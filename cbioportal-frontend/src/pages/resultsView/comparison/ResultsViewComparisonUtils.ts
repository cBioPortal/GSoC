import {
    ComparisonGroup,
    finalizeStudiesAttr,
    getNumPatients,
    getNumSamples,
} from '../../groupComparison/GroupComparisonUtils';
import { getStudiesAttr } from '../../groupComparison/comparisonGroupManager/ComparisonGroupManagerUtils';
import { Sample } from 'cbioportal-ts-api-client';
import {
    isMergedTrackFilter,
    UnflattenedOQLLineFilterOutput,
} from '../../../shared/lib/oql/oqlfilter';
import ComplexKeyMap from '../../../shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { SingleGeneQuery } from '../../../shared/lib/oql/oql-parser';
import oql_parser from '../../../shared/lib/oql/oql-parser';
import _ from 'lodash';
import { DEFAULT_NA_COLOR } from 'shared/lib/Colors';
import { SessionGroupData } from 'shared/api/session-service/sessionServiceModels';
import { IQueriedMergedTrackCaseData } from 'shared/model/IQueriedMergedTrackCaseData';

export type ResultsViewComparisonGroup = ComparisonGroup & {
    nameOfEnrichmentDirection: string;
    count: number;
};

export const ALTERED_COLOR = '#dc3912';
export const UNALTERED_COLOR = '#3366cc';
export const ALTERED_GROUP_NAME = 'Altered group';
export const UNALTERED_GROUP_NAME = 'Unaltered group';
export const UNPROFILED_GROUP_NAME = 'Unprofiled group';

// compute/add members to SessionGroupData to make them
//  into complete ComparisonGroup objects
export function completeSessionGroups(
    patientLevel: boolean,
    groups: SessionGroupData[],
    sampleSet: ComplexKeyMap<Sample>,
    getColor: () => string
) {
    // (1) ensure color and other required members
    // (2) filter out, and add list of, nonexistent samples
    // (3) add patients

    return groups.map(groupData => {
        // assign color to group if no color given
        let color = groupData.color || getColor();

        let { nonExistentSamples, studies } = finalizeStudiesAttr(
            groupData,
            sampleSet
        );

        return Object.assign({}, groupData, {
            color,
            studies,
            nonExistentSamples,
            uid: groupData.name,
            nameWithOrdinal: groupData.name,
            ordinal: '',
            nameOfEnrichmentDirection: '',
            count: patientLevel
                ? getNumPatients({ studies })
                : getNumSamples({ studies }),
        });
    });
}

export function getAlteredVsUnalteredGroups(
    patientLevel: boolean,
    studyIds: string[],
    alteredSamples: Sample[],
    unalteredAndProfiledSamples: Sample[],
    totallyUnprofiledSamples: Sample[],
    queryContainsOql: boolean,
    hideUnprofiledSamples: 'any' | 'totally' | false
): SessionGroupData[] {
    const ret = [];
    if (alteredSamples.length > 0) {
        ret.push({
            name: ALTERED_GROUP_NAME,
            description: `${
                patientLevel ? 'Patients' : 'Samples'
            } with at least one alteration in ${
                queryContainsOql ? 'the OQL specification for ' : ''
            }your queried genes in the selected profiles.`,
            studies: getStudiesAttr(alteredSamples, alteredSamples),
            origin: studyIds,
            color: ALTERED_COLOR,
        });
    }
    if (unalteredAndProfiledSamples.length > 0) {
        ret.push({
            name: UNALTERED_GROUP_NAME,
            description: `${
                patientLevel ? 'Patients' : 'Samples'
            } without any alterations in ${
                queryContainsOql ? 'the OQL specification for ' : ''
            }your queried genes in the selected profiles.`,
            studies: getStudiesAttr(
                unalteredAndProfiledSamples,
                unalteredAndProfiledSamples
            ),
            origin: studyIds,
            color: UNALTERED_COLOR,
        });
    }
    if (
        totallyUnprofiledSamples.length > 0 &&
        hideUnprofiledSamples !== 'totally'
    ) {
        ret.push({
            name: UNPROFILED_GROUP_NAME,
            description: `${
                patientLevel ? 'Patients' : 'Samples'
            } not profiled in any queried genes in any selected profiles.`,
            studies: getStudiesAttr(
                totallyUnprofiledSamples,
                totallyUnprofiledSamples
            ),
            origin: studyIds,
            color: DEFAULT_NA_COLOR,
        });
    }
    return ret;
}

export function getAlteredByOncoprintTrackGroups(
    patientLevel: boolean,
    studyIds: string[],
    allSamples: Sample[],
    oqlFilteredCaseAggregatedDataByUnflattenedOQLLine: IQueriedMergedTrackCaseData[],
    defaultOql: string
): SessionGroupData[] {
    const parsedDefaultOqlAlterations = (oql_parser.parse(
        `DUMMYGENE:${defaultOql};`
    )![0] as SingleGeneQuery).alterations;
    const groups = oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.map(
        (dataForLine, index) => {
            const label = getOncoprintTrackGroupName(
                dataForLine.oql,
                parsedDefaultOqlAlterations
            );
            const alteredSamples = allSamples.filter(
                sample =>
                    dataForLine.cases.samples[sample.uniqueSampleKey].length > 0
            );
            const studies = getStudiesAttr(alteredSamples, alteredSamples);
            return {
                name: label,
                description: `${
                    patientLevel ? 'Patients' : 'Samples'
                } with alterations in ${label}`,
                studies,
                origin: studyIds,
                color: undefined,
            };
        }
    );

    // remove duplicates by name
    return _.uniqBy(groups, g => g.name);
}

function getOncoprintTrackGroupName(
    oqlFilter: UnflattenedOQLLineFilterOutput<object>,
    parsedDefaultOqlAlterations: SingleGeneQuery['alterations']
): string {
    if (isMergedTrackFilter(oqlFilter) && oqlFilter.label) {
        // return label if it exists
        return oqlFilter.label;
    } else {
        // if oql is default oql, just use list of genes joined by /,
        //  otherwise, give all the oql
        if (isMergedTrackFilter(oqlFilter)) {
            // list of genes (with oql, if not default) joined by /
            return oqlFilter.list
                .map(geneLine => {
                    if (
                        _.isEqual(
                            geneLine.parsed_oql_line.alterations,
                            parsedDefaultOqlAlterations
                        )
                    ) {
                        return geneLine.gene;
                    } else {
                        return geneLine.oql_line.replace(';', ''); // take out semicolon at end
                    }
                })
                .join(' / ');
        } else {
            if (
                _.isEqual(
                    oqlFilter.parsed_oql_line.alterations,
                    parsedDefaultOqlAlterations
                )
            ) {
                return oqlFilter.gene;
            } else {
                return oqlFilter.oql_line.replace(';', ''); // take out semicolon at end
            }
        }
    }
}
