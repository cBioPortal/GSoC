import {
    MolecularProfile,
    Mutation,
    PatientIdentifier,
    Sample,
    SampleIdentifier,
} from 'cbioportal-ts-api-client';
import _ from 'lodash';
import {
    ClinicalDataEnrichment,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';
import { AlterationEnrichmentWithQ } from '../resultsView/enrichments/EnrichmentsUtil';
import * as React from 'react';
import ComplexKeyMap from '../../shared/lib/complexKeyDataStructures/ComplexKeyMap';
import ComplexKeySet from '../../shared/lib/complexKeyDataStructures/ComplexKeySet';
import ComplexKeyCounter from '../../shared/lib/complexKeyDataStructures/ComplexKeyCounter';
import ComplexKeyGroupsMap from '../../shared/lib/complexKeyDataStructures/ComplexKeyGroupsMap';
import {
    MakeMobxView,
    MobxViewAlwaysComponent,
} from '../../shared/components/MobxView';
import OverlapExclusionIndicator from './OverlapExclusionIndicator';
import Loader from '../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../shared/components/ErrorMessage';
import {
    DefaultTooltip,
    MobxPromise,
    stringListToIndexSet,
} from 'cbioportal-frontend-commons';
import { GroupComparisonTab } from './GroupComparisonTabs';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import {
    DataType,
    geneFilterQueryToOql,
    getButtonNameWithDownPointer,
} from 'pages/studyView/StudyViewUtils';
import styles from 'pages/groupComparison/styles.module.scss';
import SettingsMenu from 'shared/components/driverAnnotations/SettingsMenu';
import { observer } from 'mobx-react';
import { getServerConfig } from 'config/config';
import AlterationEnrichmentTypeSelector from 'shared/lib/comparison/AlterationEnrichmentTypeSelector';
import { EnrichmentEventType } from 'shared/lib/comparison/ComparisonStoreUtils';
import {
    GroupData,
    SessionGroupData,
} from 'shared/api/session-service/sessionServiceModels';
import { GroupComparisonMutation } from 'shared/model/GroupComparisonMutation';
import { getTwoTailedPValue } from 'shared/lib/calculation/FisherExactTestCalculator';
import { calculateQValues } from 'shared/lib/calculation/BenjaminiHochbergFDRCalculator';
import {
    IBaseBoxScatterPlotPoint,
    IBoxScatterPlotData,
} from 'shared/components/plots/BoxScatterPlot';

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

export type ComparisonGroup = Omit<SessionGroupData, 'studies' | 'color'> & {
    color: string; // color mandatory here, bc we'll assign one if its missing
    uid: string; // unique in the session
    nameWithOrdinal: string; // for easy disambiguation when groups are abbreviated
    ordinal: string;
    studies: { id: string; samples: string[]; patients: string[] }[]; // include patients, filter out nonexistent samples
    nonExistentSamples: SampleIdentifier[]; // samples specified in the group which no longer exist in our DB
    nameOfEnrichmentDirection?: string;
};

export type EnrichmentAnalysisComparisonGroup = {
    name: string;
    description: string;
    color: string;
    samples: Sample[];
    nameOfEnrichmentDirection: string | undefined;
};

export type StudyViewComparisonGroup = Omit<GroupData, 'studies'> & {
    uid: string; // unique in the session
    studies: { id: string; samples: string[]; patients: string[] }[]; // include patients, filter out nonexistent samples
    nonExistentSamples: SampleIdentifier[]; // samples specified in the group which no longer exist in our DB
    color?: string | undefined;
    isSharedGroup?: boolean;
    hasWarningSign?: boolean;
};

export type ClinicalDataEnrichmentWithQ = ClinicalDataEnrichment & {
    qValue: number;
};

export type CopyNumberEnrichment = AlterationEnrichmentWithQ & {
    value: number;
};

export function defaultGroupOrder<T extends Pick<ComparisonGroup, 'name'>>(
    groups: T[]
) {
    // sort alphabetically, except NA goes last
    const isNA = _.partition(groups, g => g.name.toLowerCase() === 'na');
    return _.sortBy(isNA[1], g => g.name.toLowerCase()).concat(isNA[0]);
}

export const MAX_GROUPS_IN_SESSION = 20;

const alphabet = '-ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function getOrdinals(num: number, base: number) {
    if (num <= 0) {
        return [];
    }
    const inNewBase = [[1]];
    let prev: number[];
    let next: number[];
    for (let i = 1; i < num; i++) {
        prev = inNewBase[i - 1];
        next = _.clone(prev);
        next[next.length - 1] += 1;
        for (let carryIndex = next.length - 1; carryIndex >= 0; carryIndex--) {
            if (next[carryIndex] > base) {
                next[carryIndex] -= base;
                if (carryIndex > 0) {
                    next[carryIndex - 1] += 1;
                } else {
                    next.unshift(1);
                }
            }
        }
        inNewBase.push(next);
    }
    return inNewBase.map(n => n.map(i => alphabet[i]).join(''));
}

export function getVennPlotData(
    combinationSets: { groups: string[]; cases: string[] }[]
) {
    return combinationSets
        .map(set => {
            return {
                count: set.cases.length,
                size: set.cases.length,
                label: `${set.cases.length}`,
                sets: set.groups,
            };
        })
        .sort((a, b) => b.count - a.count);
}

export function caseCountsInParens(
    samples: MobxPromise<any[]> | any[],
    patients: MobxPromise<any[]> | any[]
) {
    let text = '';
    if (
        (Array.isArray(samples) || samples.isComplete) &&
        (Array.isArray(patients) || patients.isComplete)
    ) {
        const samplesArr = Array.isArray(samples) ? samples : samples.result!;
        const patientsArr = Array.isArray(patients)
            ? patients
            : patients.result!;
        if (samplesArr.length === patientsArr.length) {
            text = `(${samplesArr.length})`;
        } else {
            const pluralSamples = samplesArr.length !== 1;
            const pluralPatients = patientsArr.length !== 1;
            text = `(${samplesArr.length} sample${pluralSamples ? 's' : ''}/${
                patientsArr.length
            } patient${pluralPatients ? 's' : ''})`;
        }
    }
    return text;
}

export function caseCounts(
    numSamples: number,
    numPatients: number,
    delimiter = '/',
    infix = ' '
) {
    if (numSamples === numPatients) {
        const plural = numSamples !== 1;
        return `${numSamples}${infix}sample${
            plural ? 's' : ''
        }${delimiter}patient${plural ? 's' : ''}`;
    } else {
        const pluralSamples = numSamples !== 1;
        const pluralPatients = numPatients !== 1;
        return `${numSamples}${infix}sample${
            pluralSamples ? 's' : ''
        }${delimiter}${numPatients}${infix}patient${pluralPatients ? 's' : ''}`;
    }
}

export function getPatientIdentifiers(
    sampleIdentifiers: SampleIdentifier[],
    sampleSet: ComplexKeyMap<
        Pick<Sample, 'uniquePatientKey' | 'patientId' | 'studyId'>
    >
) {
    const patientSet: { [uniquePatientKey: string]: PatientIdentifier } = {};
    for (const sampleId of sampleIdentifiers) {
        const sample = sampleSet.get({
            studyId: sampleId.studyId,
            sampleId: sampleId.sampleId,
        });
        if (sample && !(sample.uniquePatientKey in patientSet)) {
            patientSet[sample.uniquePatientKey] = {
                patientId: sample.patientId,
                studyId: sample.studyId,
            };
        }
    }
    return _.values(patientSet);
}

export function getOverlappingSamples(
    groups: Pick<ComparisonGroup, 'studies'>[]
) {
    // samples that are in at least two selected groups
    const sampleUseCount = new ComplexKeyCounter();
    for (const group of groups) {
        for (const study of group.studies) {
            const studyId = study.id;
            for (const sampleId of study.samples) {
                sampleUseCount.increment({ studyId, sampleId });
            }
        }
    }
    const overlapping = [];
    for (const entry of sampleUseCount.entries()) {
        if (entry.value > 1) {
            overlapping.push(entry.key as SampleIdentifier);
        }
    }
    return overlapping;
}

export function getOverlappingPatients(
    groups: Pick<ComparisonGroup, 'studies'>[]
) {
    // patients that are in at least two selected groups
    const patientUseCount = new ComplexKeyCounter();
    for (const group of groups) {
        for (const study of group.studies) {
            const studyId = study.id;
            for (const patientId of study.patients) {
                patientUseCount.increment({ studyId, patientId });
            }
        }
    }
    const overlapping = [];
    for (const entry of patientUseCount.entries()) {
        if (entry.value > 1) {
            overlapping.push(entry.key as PatientIdentifier);
        }
    }
    return overlapping;
}

export function isGroupEmpty(group: Pick<ComparisonGroup, 'studies'>) {
    return !_.some(
        group.studies,
        study => study.samples.length > 0 || study.patients.length > 0
    );
}

export function getStudyIds(groups: Pick<SessionGroupData, 'studies'>[]) {
    return _.uniq<string>(
        _.flattenDeep<string>(
            groups.map(group => group.studies.map(study => study.id))
        )
    );
}

/**
 * Gets all unique sample identifiers from the groups
 * provided. A unique key can be generated for a sample
 * by appending the sample's study id to the sample's sample id, separated
 * by a character not allowed in either id- in this case a newline symbol.
 */
export function getSampleIdentifiers(
    groups: Pick<SessionGroupData, 'studies'>[]
) {
    const sampleIds: { [key: string]: SampleIdentifier } = {};

    groups.forEach(group => {
        group.studies.forEach(study => {
            study.samples.forEach(sample => {
                sampleIds[study.id + '\n' + sample] = {
                    studyId: study.id,
                    sampleId: sample,
                };
            });
        });
    });

    return Object.values(sampleIds);
}

export function getNumSamples(
    group: Pick<SessionGroupData, 'studies'>,
    filter?: (studyId: string, sampleId: string) => boolean
) {
    return _.sum(
        group.studies.map(study => {
            if (filter) {
                const studyId = study.id;
                let count = 0;
                for (const sampleId of study.samples) {
                    if (filter(studyId, sampleId)) {
                        count += 1;
                    }
                }
                return count;
            } else {
                return study.samples.length;
            }
        })
    );
}

export function getNumPatients(
    group: Pick<StudyViewComparisonGroup, 'studies'>
) {
    return _.sum(group.studies.map(study => study.patients.length));
}

export function filterStudiesAttr(
    studiesAttr: SessionGroupData['studies'],
    filter: (s: SampleIdentifier) => boolean
) {
    return studiesAttr
        .map(studyObj => {
            const studyId = studyObj.id;
            return {
                id: studyId,
                samples: studyObj.samples.filter(sampleId =>
                    filter({ studyId, sampleId })
                ),
            };
        })
        .filter(studyObj => studyObj.samples.length > 0);
}

export function finalizeStudiesAttr(
    groupData: Pick<SessionGroupData, 'studies'>,
    sampleSet: ComplexKeyMap<Sample>
) {
    // (1) filter out, and keep track of nonexisting samples
    // (2) add `patients` object
    const nonExistentSamples = [];
    const studies = [];

    for (const study of groupData.studies) {
        const studyId = study.id;
        const samples = [];
        let patients = [];
        for (const sampleId of study.samples) {
            const sample = sampleSet.get({ studyId, sampleId });
            if (!sample) {
                // filter out, and keep track of, nonexisting sample
                nonExistentSamples.push({ studyId, sampleId });
            } else {
                // add sample and corresponding patient
                samples.push(sampleId);
                patients.push(sample.patientId);
            }
        }
        patients = _.uniq(patients);
        if (samples.length > 0 || patients.length > 0) {
            studies.push({
                id: studyId,
                samples,
                patients,
            });
        }
    }

    return {
        nonExistentSamples,
        studies,
    };
}

export function getOverlapFilteredGroups<
    T extends Pick<ComparisonGroup, 'studies'>
>(
    groups: T[],
    info: {
        overlappingSamplesSet: ComplexKeySet;
        overlappingPatientsSet: ComplexKeySet;
    }
): T[] {
    // filter out overlap
    const overlappingSamplesSet = info.overlappingSamplesSet;
    const overlappingPatientsSet = info.overlappingPatientsSet;

    return groups.map(group => {
        const studies = [];
        for (const study of group.studies) {
            const studyId = study.id;
            const nonOverlappingSamples = study.samples.filter(sampleId => {
                return !overlappingSamplesSet.has({ studyId, sampleId });
            });
            const nonOverlappingPatients = study.patients.filter(patientId => {
                return !overlappingPatientsSet.has({ studyId, patientId });
            });
            if (
                nonOverlappingSamples.length > 0 ||
                nonOverlappingPatients.length > 0
            ) {
                studies.push({
                    id: studyId,
                    samples: nonOverlappingSamples,
                    patients: nonOverlappingPatients,
                });
            }
        }
        return Object.assign({}, group, {
            studies,
        });
    });
}

export function MakeEnrichmentsTabUI(
    getStore: () => ComparisonStore,
    getEnrichmentsUI: () => MobxViewAlwaysComponent,
    enrichmentType: string,
    multiGroupAnalysisPossible?: boolean,
    patientAnalysisPossible?: boolean,
    multiStudyAnalysisPossible?: boolean
) {
    return MakeMobxView({
        await: () => {
            const store = getStore();
            const ret: any[] = [
                store._activeGroupsNotOverlapRemoved,
                store.activeGroups,
                store.activeStudyIds,
            ];
            if (
                (store.activeGroups.isComplete &&
                    store.activeGroups.result.length !== 2) ||
                (store.activeStudyIds.isComplete &&
                    store.activeStudyIds.result.length > 1)
            ) {
                // dont bother loading data for and computing enrichments UI if its not valid situation for it
            } else {
                ret.push(getEnrichmentsUI());
            }
            return ret;
        },
        render: () => {
            const store = getStore();
            const activeGroupsCount = store.activeGroups.result!.length;
            if (
                (!multiGroupAnalysisPossible && activeGroupsCount !== 2) ||
                (multiGroupAnalysisPossible && activeGroupsCount < 2)
            ) {
                return (
                    <span>
                        {ENRICHMENTS_NOT_2_GROUPS_MSG(
                            store.activeGroups.result!.length,
                            store._activeGroupsNotOverlapRemoved.result!.length,
                            multiGroupAnalysisPossible
                        )}
                    </span>
                );
            } else if (
                store.activeStudyIds.result!.length > 1 &&
                !multiStudyAnalysisPossible
            ) {
                return (
                    <span>
                        {ENRICHMENTS_TOO_MANY_STUDIES_MSG(enrichmentType)}
                    </span>
                );
            } else {
                const content: any = [];
                const doShowInlineTypeSelectionMenu =
                    enrichmentType == 'alterations' &&
                    !getServerConfig().skin_show_settings_menu;
                content.push(
                    // The alteration type selector is shown to left of the
                    // graph panels ('in-line'). This div element pushes the
                    // graph elements to the right when the type selector
                    // is shown 'in-line'.
                    <div
                        style={{
                            marginLeft: doShowInlineTypeSelectionMenu ? 244 : 0,
                        }}
                    >
                        <OverlapExclusionIndicator
                            store={store}
                            only={
                                patientAnalysisPossible &&
                                store.usePatientLevelEnrichments
                                    ? 'patient'
                                    : 'sample'
                            }
                        />
                    </div>
                );
                content.push(getEnrichmentsUI().component);
                return content;
            }
        },
        renderPending: () => (
            <Loader center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });
}

export function ENRICHMENTS_NOT_2_GROUPS_MSG(
    numActiveGroups: number,
    numSelectedGroups: number,
    isMultiGroupAnalysis?: boolean
) {
    if (numSelectedGroups < 2) {
        return `Please select more groups - we need ${
            isMultiGroupAnalysis ? 'at least' : 'exactly'
        } 2 selected groups to show enrichments.`;
    } else if (numActiveGroups < 2) {
        // at least 2 selected, but less than 2 active, meaning overlap has reduced it
        return 'Due to excluded overlapping cases, there are less than 2 selected nonempty groups - we need exactly 2 nonempty selected groups to show enrichments.';
    } else if (numActiveGroups > 2) {
        // more than 2 active
        return 'Please deselect groups - we need exactly 2 selected groups to show enrichments.';
    }
}

export function ENRICHMENTS_TOO_MANY_STUDIES_MSG(enrichmentsType: string) {
    return `The selected comparison groups span more than one study, so we can't show ${enrichmentsType} enrichments. Please change your selection in the Groups section so that all samples only come from one study.`;
}

export const SURVIVAL_NOT_ENOUGH_GROUPS_MSG =
    'We need at least 1 group to show survival. Please select more groups from the Groups section above.';

export const SURVIVAL_TOO_MANY_GROUPS_MSG =
    "We can't show survival for more than 10 groups. Please deselect groups in the Groups section.";

export const DUPLICATE_GROUP_NAME_MSG = 'Another group already has this name.';

export const OVERLAP_NOT_ENOUGH_GROUPS_MSG =
    'We need at least 2 groups to show overlap. Please select more groups from the Groups section above.';

export function CLINICAL_TAB_NOT_ENOUGH_GROUPS_MSG(numSelectedGroups: number) {
    if (numSelectedGroups >= 2) {
        return 'Due to excluded overlapping cases, there are less than 2 selected nonempty groups - we need at least 2.';
    } else {
        return 'We need at least 2 groups to show clinical data enrichments. Please select more groups from the Groups section above.';
    }
}

export const MUTATIONS_NOT_ENOUGH_GROUPS_MSG =
    'We need 2 groups to show mutations. Please select more groups from the Groups section above.';

export const MUTATIONS_TOO_MANY_GROUPS_MSG =
    "We can't show mutations for more than 2 groups. Please deselect groups in the Groups section.";

export const NO_MUTATIONS_AVAILABLE_MSG = 'There are no mutations available.';

export function getDefaultGroupName(
    filters: StudyViewFilter,
    customChartFilterSet: { [chartId: string]: string[] },
    clinicalAttributeIdToDataType: { [chartId: string]: string }
) {
    const equalityFilters = _.chain(filters.clinicalDataFilters || [])
        .filter(
            clinicalDataFilter =>
                clinicalAttributeIdToDataType[
                    clinicalDataFilter.attributeId
                ] === DataType.STRING
        )
        .sortBy(filter => filter.attributeId) // sort clinical data equality filters into a canonical order - lets just do alphabetical by attribute id
        .map(filter => _.flatMap(filter.values, datum => datum.value).join('+')) // get each attributes selected values, joined by +
        .value();

    const customChartValues = _(customChartFilterSet)
        .keys()
        .sortBy() // sort into a canonical order - lets just do alphabetical by chart id
        .map(key => customChartFilterSet[key].join('+')) // get each attributes selected values, joined by +
        .value();

    const geneFilters = _.chain(filters.geneFilters || [])
        .flatMapDeep(geneFilter => geneFilter.geneQueries)
        .map(geneQuery => geneFilterQueryToOql(geneQuery))
        .value();

    const caseListsFilters = _.chain(filters.caseLists || [])
        .flatMapDeep(caseList => caseList)
        .value();

    const genomicProfileFilters = _.flatMapDeep(filters.genomicProfiles || []);

    return geneFilters
        .concat(equalityFilters)
        .concat(customChartValues)
        .concat(genomicProfileFilters)
        .concat(caseListsFilters)
        .join(', '); // comma separate each attributes values
}

export function getTabId(pathname: string) {
    const match = pathname.match(/comparison\/([^\/]+)/);
    if (match) {
        return match[1] as GroupComparisonTab;
    } else {
        return undefined;
    }
}

export function MissingSamplesMessage(props: { samples: SampleIdentifier[] }) {
    return (
        <div style={{ width: 380 }}>
            <div style={{ marginBottom: 7 }}>
                The following samples cannot be found in our database. They
                might have been removed or changed since this group was created:{' '}
            </div>
            <div style={{ maxHeight: 200, overflowY: 'scroll' }}>
                {props.samples.map(sample => (
                    <div>{`${sample.studyId}:${sample.sampleId}`}</div>
                ))}
            </div>
        </div>
    );
}

export function splitData<D extends { value: string }>(
    data: D[],
    numberOfSplits: number
) {
    data = _.chain(data)
        .filter(d => !isNaN(d.value as any))
        .sortBy(d => parseFloat(d.value))
        .value();

    const splitLength = data.length / numberOfSplits;
    const quartiles: D[][] = [];

    for (var i = 0; i < numberOfSplits; i++) {
        const newQuartile = data.slice(splitLength * i, splitLength * (i + 1));
        if (newQuartile.length > 0)
            // handle edge case for small amounts of data where some quartile ranges might be empty
            quartiles.push(newQuartile);
    }
    return quartiles;
}

export function intersectSamples(
    groupData1: SessionGroupData['studies'],
    groupData2: SessionGroupData['studies']
) {
    const studies1 = _.keyBy(groupData1, elt => elt.id);
    const studies2 = _.keyBy(groupData2, elt => elt.id);
    const intersection = _.mapValues(studies1, (elt, studyId) => ({
        id: elt.id,
        samples: _.intersection(
            elt.samples,
            studyId in studies2 ? studies2[studyId].samples : []
        ),
    }));
    return _.values(intersection).filter(elt => elt.samples.length > 0);
}

export function excludeSamples(
    excludeFrom: SessionGroupData['studies'],
    exclude: SessionGroupData['studies']
) {
    const studiesToExcludeFrom = _.keyBy(excludeFrom, elt => elt.id);
    const studiesToExclude = _.keyBy(exclude, elt => elt.id);
    const exclusion = _.mapValues(studiesToExcludeFrom, (elt, studyId) => ({
        id: elt.id,
        samples:
            studyId in studiesToExclude
                ? _.difference(elt.samples, studiesToExclude[studyId].samples)
                : elt.samples,
    }));
    return _.values(exclusion).filter(elt => elt.samples.length > 0);
}

export function unionSamples(
    groupData1: SessionGroupData['studies'],
    groupData2: SessionGroupData['studies']
): SessionGroupData['studies'] {
    const studies1 = _.keyBy(groupData1, elt => elt.id);
    const studies2 = _.keyBy(groupData2, elt => elt.id);
    const studyIds = _.union(_.keys(studies1), _.keys(studies2));
    return studyIds.map(studyId => {
        const elt1 = studies1[studyId];
        const elt2 = studies2[studyId];
        if (elt1 && elt2) {
            return {
                id: studyId,
                samples: _.union(elt1.samples, elt2.samples),
            };
        } else if (elt1) {
            return elt1;
        } else {
            return elt2;
        }
    });
}

export function intersectPatients(
    groupData1: { id: string; patients: string[] }[],
    groupData2: { id: string; patients: string[] }[]
) {
    const studies1 = _.keyBy(groupData1, elt => elt.id);
    const studies2 = _.keyBy(groupData2, elt => elt.id);
    const intersection = _.mapValues(studies1, (elt, studyId) => ({
        id: elt.id,
        patients: _.intersection(
            elt.patients,
            studyId in studies2 ? studies2[studyId].patients : []
        ),
    }));
    return _.values(intersection).filter(elt => elt.patients.length > 0);
}

export function excludePatients(
    excludeFrom: { id: string; patients: string[] }[],
    exclude: { id: string; patients: string[] }[]
) {
    const studiesToExcludeFrom = _.keyBy(excludeFrom, elt => elt.id);
    const studiesToExclude = _.keyBy(exclude, elt => elt.id);
    const exclusion = _.mapValues(studiesToExcludeFrom, (elt, studyId) => ({
        id: elt.id,
        patients:
            studyId in studiesToExclude
                ? _.difference(elt.patients, studiesToExclude[studyId].patients)
                : elt.patients,
    }));
    return _.values(exclusion).filter(elt => elt.patients.length > 0);
}

export function unionPatients(
    groupData1: { id: string; patients: string[] }[],
    groupData2: { id: string; patients: string[] }[]
) {
    const studies1 = _.keyBy(groupData1, elt => elt.id);
    const studies2 = _.keyBy(groupData2, elt => elt.id);
    const studyIds = _.union(_.keys(studies1), _.keys(studies2));
    return studyIds.map(studyId => {
        const elt1 = studies1[studyId];
        const elt2 = studies2[studyId];
        if (elt1 && elt2) {
            return {
                id: studyId,
                patients: _.union(elt1.patients, elt2.patients),
            };
        } else if (elt1) {
            return elt1;
        } else {
            return elt2;
        }
    });
}

export function convertPatientsStudiesAttrToSamples(
    data: { id: string; patients: string[] }[],
    patientToSamples: ComplexKeyGroupsMap<Pick<Sample, 'sampleId'>>
) {
    return data.map(elt => ({
        id: elt.id,
        samples: _.flatten(
            elt.patients.map(patientId => {
                return (
                    patientToSamples.get({ patientId, studyId: elt.id }) || []
                ).map(s => s.sampleId);
            })
        ),
    }));
}

export function partitionCasesByGroupMembership(
    groupsNotOverlapRemoved: Pick<
        StudyViewComparisonGroup,
        'studies' | 'uid'
    >[],
    getCaseIdentifiers: (
        group: Pick<StudyViewComparisonGroup, 'studies' | 'uid'>
    ) => any[],
    getUniqueCaseKey: (caseIdentifier: any) => string,
    caseKeys: string[]
) {
    // Gives a partition of the given cases into lists based on which groups
    //  each case is a member of. For example, if there are groups A and B, then
    //  in the output, there is an entry for cases in A not B, an entry for cases in
    //  B not A, and an entry for cases in A and B. Note that there are only
    //  entries in the output for nonempty lists.

    const partitionMap = new ComplexKeyGroupsMap<string>();
    const groupToCaseKeys = groupsNotOverlapRemoved.reduce((map, group) => {
        map[group.uid] = _.keyBy(
            getCaseIdentifiers(group).map(id => {
                return getUniqueCaseKey(id);
            })
        );
        return map;
    }, {} as { [uid: string]: { [uniqueCaseKey: string]: any } });

    for (const caseKey of caseKeys) {
        const key: any = {};
        for (const group of groupsNotOverlapRemoved) {
            key[group.uid] = caseKey in groupToCaseKeys[group.uid];
        }
        partitionMap.add(key, caseKey);
    }
    return partitionMap.entries();
}

export interface IOverlapComputations<
    T extends Pick<ComparisonGroup, 'studies' | 'uid'>
> {
    groups: T[];
    overlappingSamples: SampleIdentifier[];
    overlappingPatients: PatientIdentifier[];
    overlappingSamplesSet: ComplexKeySet;
    overlappingPatientsSet: ComplexKeySet;
    totalSampleOverlap: number;
    totalPatientOverlap: number;
    excludedFromAnalysis: { [uid: string]: true };
}

export function getOverlapComputations<
    T extends Pick<ComparisonGroup, 'studies' | 'uid' | 'name'>
>(
    groups: T[],
    isGroupSelected: (name: string) => boolean
): IOverlapComputations<T> {
    let filteredGroups: T[] = groups.filter(group =>
        isGroupSelected(group.name)
    );

    const totalSampleOverlap = new ComplexKeySet();
    const totalPatientOverlap = new ComplexKeySet();

    let overlappingSamples: SampleIdentifier[] = [];
    let overlappingPatients: PatientIdentifier[] = [];
    let overlappingSamplesSet = new ComplexKeySet();
    let overlappingPatientsSet = new ComplexKeySet();
    let removedGroups: { [uid: string]: T } = {};

    if (filteredGroups.length > 0) {
        while (true) {
            overlappingSamples = getOverlappingSamples(filteredGroups);
            overlappingPatients = getOverlappingPatients(filteredGroups);
            overlappingSamplesSet = new ComplexKeySet();
            overlappingPatientsSet = new ComplexKeySet();
            let sampleId;
            for (const sample of overlappingSamples) {
                sampleId = {
                    studyId: sample.studyId,
                    sampleId: sample.sampleId,
                };
                overlappingSamplesSet.add(sampleId);
                totalSampleOverlap.add(sampleId);
            }
            let patientId;
            for (const patient of overlappingPatients) {
                patientId = {
                    studyId: patient.studyId,
                    patientId: patient.patientId,
                };
                overlappingPatientsSet.add(patientId);
                totalPatientOverlap.add(patientId);
            }

            const [emptyGroups, nonEmptyGroups] = _.partition(
                getOverlapFilteredGroups(filteredGroups, {
                    overlappingSamplesSet,
                    overlappingPatientsSet,
                }),
                group => isGroupEmpty(group)
            );

            // remove one group at a time
            if (emptyGroups.length > 0) {
                const lastEmptyGroup = emptyGroups.pop()!;
                removedGroups[lastEmptyGroup.uid] = lastEmptyGroup;
            }

            if (nonEmptyGroups.length === filteredGroups.length) {
                // no group has been removed this round, so we've reached stable state
                break;
            } else {
                // otherwise, keep iterating
                filteredGroups = filteredGroups.filter(
                    g => !(g.uid in removedGroups)
                );
            }
        }
    }

    const sortOrder = stringListToIndexSet(groups.map(g => g.uid));
    let groupsInSortOrder = getOverlapFilteredGroups(filteredGroups, {
        overlappingSamplesSet,
        overlappingPatientsSet,
    }).concat(_.values(removedGroups));
    groupsInSortOrder = _.sortBy(groupsInSortOrder, g => sortOrder[g.uid]);
    return {
        groups: groupsInSortOrder,
        overlappingSamples,
        overlappingPatients,
        overlappingSamplesSet,
        overlappingPatientsSet,
        totalSampleOverlap: totalSampleOverlap.keys().length,
        totalPatientOverlap: totalPatientOverlap.keys().length,
        excludedFromAnalysis: _.mapValues(removedGroups, g => true as true),
    };
}

export function getGroupsDownloadData(
    samples: Sample[],
    groups: ComparisonGroup[],
    sampleKeyToGroups: {
        [uniqueSampleKey: string]: { [groupUid: string]: boolean };
    }
) {
    const lines: string[][] = [];
    const header = ['Sample ID', 'Patient ID', 'Study ID'].concat(
        groups.map(g => g.name)
    );
    lines.push(header);
    for (const sample of samples) {
        const groupMembershipMap = sampleKeyToGroups[sample.uniqueSampleKey];
        const line = [sample.sampleId, sample.patientId, sample.studyId].concat(
            groups.map(g => {
                if (groupMembershipMap[g.uid]) {
                    return 'Yes';
                } else {
                    return 'No';
                }
            })
        );
        lines.push(line);
    }
    return lines.map(line => line.join('\t')).join('\n');
}

export const GetStatisticalCautionInfo: React.FunctionComponent = () => {
    return (
        <div className="alert alert-info">
            <i
                className="fa fa-md fa-info-circle"
                style={{
                    verticalAlign: 'middle !important',
                    marginRight: 6,
                    marginBottom: 1,
                }}
            />
            Interpret all results with caution, as they can be confounded by
            many different variables that are not controlled for in these
            analyses. Consider consulting a statistician.
        </div>
    );
};

export const GetHazardRatioCautionInfo: React.FunctionComponent = () => {
    return (
        <div className="alert alert-info">
            <i
                className="fa fa-md fa-info-circle"
                style={{
                    verticalAlign: 'middle !important',
                    marginRight: 6,
                    marginBottom: 1,
                }}
            />
            The log-rank test is used to test the null hypothesis that there is
            no difference between the groups in the probability of an event at
            any time point. Hazard ratios are derived from the log-rank test.
        </div>
    );
};

export const AlterationFilterMenuSection: React.FunctionComponent<{
    store: ComparisonStore;
    updateSelectedEnrichmentEventTypes: (t: EnrichmentEventType[]) => void;
}> = observer(({ store, updateSelectedEnrichmentEventTypes }) => {
    return (
        <div>
            <DefaultTooltip
                trigger={['click']}
                placement={'bottomRight'}
                overlay={
                    <AlterationEnrichmentTypeSelector
                        classNames={styles.buttonAlterationTypeSelectorMenu}
                        store={store}
                        updateSelectedEnrichmentEventTypes={
                            updateSelectedEnrichmentEventTypes
                        }
                        showMutations={store.hasMutationEnrichmentData}
                        showCnas={store.hasCnaEnrichmentData}
                        showStructuralVariants={store.hasStructuralVariantData}
                    />
                }
            >
                <button
                    data-test="AlterationEnrichmentTypeSelectorButton"
                    className="btn btn-primary btn-sm"
                    style={{ marginBottom: '10px' }}
                >
                    {getButtonNameWithDownPointer('Alteration Types')}
                </button>
            </DefaultTooltip>
            <DefaultTooltip
                trigger={['click']}
                placement={'bottomRight'}
                overlay={
                    <SettingsMenu
                        store={store}
                        infoElement={
                            <AlterationMenuHeader
                                studyHasMutations={
                                    store.hasMutationEnrichmentData
                                }
                                studyHasStructuralVariants={
                                    store.hasStructuralVariantData
                                }
                                studyHasCnas={store.hasCnaEnrichmentData}
                                showDriverSection={
                                    store.showDriverAnnotationMenuSection
                                }
                                showTiersSection={
                                    store.showDriverTierAnnotationMenuSection
                                }
                            />
                        }
                        customDriverSourceName={
                            getServerConfig()
                                .oncoprint_custom_driver_annotation_binary_menu_label ||
                            'undefined'
                        }
                        showDriverAnnotationSection={
                            store.showDriverAnnotationMenuSection
                        }
                        showTierAnnotationSection={
                            store.showDriverTierAnnotationMenuSection
                        }
                    />
                }
            >
                <button
                    data-test="AlterationEnrichmentAnnotationsSelectorButton"
                    style={{
                        marginLeft: '10px',
                        marginBottom: '10px',
                    }}
                    className="btn btn-primary btn-sm"
                >
                    {getButtonNameWithDownPointer('Annotations')}
                </button>
            </DefaultTooltip>
        </div>
    );
});

const AlterationMenuHeader: React.FunctionComponent<{
    studyHasMutations: boolean;
    studyHasStructuralVariants: boolean;
    studyHasCnas: boolean;
    showDriverSection: boolean;
    showTiersSection: boolean;
}> = observer(
    ({
        studyHasMutations,
        studyHasStructuralVariants,
        studyHasCnas,
        showDriverSection,
        showTiersSection,
    }) => {
        const sections = [];
        if (studyHasMutations) sections.push('mutations');
        if (
            studyHasStructuralVariants &&
            (showDriverSection || showTiersSection)
        )
            sections.push('structural variants');
        if (studyHasCnas && (showDriverSection || showTiersSection))
            sections.push('copy number alterations');
        let text = sections.join(' and ');
        if (sections.length === 3)
            text = sections[0] + ', ' + sections[1] + ' and ' + sections[2];
        return (
            <span>
                Select filters for {text} included in the over-representation
                analysis.
            </span>
        );
    }
);

// Benjamini-Hochberg procedure q-value, used to show significant association of mutations enriched in a group
export const SIGNIFICANT_QVALUE_THRESHOLD = 0.05;

export function getProteinChangeToMutationRowData(
    tableData: Mutation[][],
    mutationsGroupedByProteinChangeForGroup: (
        groupIndex: number
    ) => _.Dictionary<{
        group: string;
        data: any[];
    }>,
    profiledPatientsCounts: number[],
    groups: ComparisonGroup[]
): {
    [proteinChange: string]: GroupComparisonMutation;
} {
    const mutationsGroupedByProteinChangeForGroupA = mutationsGroupedByProteinChangeForGroup(
        0
    );
    const mutationsGroupedByProteinChangeForGroupB = mutationsGroupedByProteinChangeForGroup(
        1
    );
    const countsByProteinChangeForGroupA = getCountsByAttribute(
        mutationsGroupedByProteinChangeForGroupA
    );
    const countsByProteinChangeForGroupB = getCountsByAttribute(
        mutationsGroupedByProteinChangeForGroupB
    );
    let rowData = tableData.map(proteinChangeRow => {
        const groupAMutatedCount: number =
            countsByProteinChangeForGroupA[proteinChangeRow[0].proteinChange] ||
            0;
        const groupBMutatedCount: number =
            countsByProteinChangeForGroupB[proteinChangeRow[0].proteinChange] ||
            0;
        const groupAMutatedPercentage: number =
            (groupAMutatedCount / profiledPatientsCounts[0]) * 100;
        const groupBMutatedPercentage: number =
            (groupBMutatedCount / profiledPatientsCounts[1]) * 100;
        const logRatio: number = Math.log2(
            groupAMutatedPercentage / groupBMutatedPercentage
        );
        const pValue: number = getTwoTailedPValue(
            groupAMutatedCount,
            profiledPatientsCounts[0] - groupAMutatedCount,
            groupBMutatedCount,
            profiledPatientsCounts[1] - groupBMutatedCount
        );
        const enrichedGroup: string =
            logRatio > 0
                ? groups[0].nameWithOrdinal
                : groups[1].nameWithOrdinal;

        return {
            proteinChange: proteinChangeRow[0].proteinChange,
            groupAMutatedCount,
            groupBMutatedCount,
            groupAMutatedPercentage,
            groupBMutatedPercentage,
            logRatio,
            pValue,
            qValue: 0,
            enrichedGroup,
        };
    });

    rowData = _.sortBy(rowData, r => r.pValue);
    const qValues = calculateQValues(_.map(rowData, d => d.pValue));
    rowData.forEach((d, i) => {
        d.qValue = qValues[i];
    });

    return _.keyBy(rowData, d => d.proteinChange);
}

export function getCountsByAttribute(
    mutationsGroupedByAttribute: _.Dictionary<{
        group: string;
        data: any[];
    }>,
    mutationCounts?: boolean
): {
    [attribute: string]: number;
} {
    const map: { [attribute: string]: number } = {};

    // if true get mutation counts, else get mutated counts
    mutationCounts
        ? _.forIn(mutationsGroupedByAttribute, (v, k) => {
              map[v.group] = v.data.length;
          })
        : _.forIn(mutationsGroupedByAttribute, (v, k) => {
              // mutations are unique by gene, protein change, patientId. mutations by gene and protein change are already grouped
              const uniqueMutations = _.uniqBy(v.data, d => d[0].patientId);
              map[v.group] = uniqueMutations.length;
          });

    return map;
}

export function getStudyMutationEnrichmentProfileMap(
    mutationEnrichmentEventTypes: {
        [s: string]: boolean | undefined;
    },
    mutationEnrichmentProfiles: MolecularProfile[],
    mutationEnrichmentProfileMap: {
        [studyId: string]: MolecularProfile;
    }
): {
    [studyId: string]: MolecularProfile;
} {
    //Only return Mutation profile if any mutation type is selected, otherwise return {}
    if (
        _(mutationEnrichmentEventTypes)
            .values()
            .some()
    ) {
        // set default enrichmentProfileMap if not selected yet
        if (_.isEmpty(mutationEnrichmentProfileMap)) {
            const molecularProfilesbyStudyId = _.groupBy(
                mutationEnrichmentProfiles,
                profile => profile.studyId
            );
            // Select only one molecular profile for each study
            return _.mapValues(
                molecularProfilesbyStudyId,
                molecularProfiles => molecularProfiles[0]
            );
        } else {
            return mutationEnrichmentProfileMap;
        }
    } else {
        return {};
    }
}
