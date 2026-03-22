import _ from 'lodash';

import { SamplesSpecificationElement } from './ResultsViewPageStore';
import ResultsViewURLWrapper, {
    ResultsViewURLQueryEnum,
} from './ResultsViewURLWrapper';
import * as React from 'react';
import { observer } from 'mobx-react';
import { VirtualStudy } from 'shared/api/session-service/sessionServiceModels';

export enum ResultsViewTab {
    ONCOPRINT = 'oncoprint',
    SURVIVAL_REDIRECT = 'survival',
    CANCER_TYPES_SUMMARY = 'cancerTypesSummary',
    MUTUAL_EXCLUSIVITY = 'mutualExclusivity',
    PLOTS = 'plots',
    MUTATIONS = 'mutations',
    STRUCTURALVARIANTS = 'structuralVariants',
    COEXPRESSION = 'coexpression',
    COMPARISON = 'comparison',
    CN_SEGMENTS = 'cnSegments',
    NETWORK = 'network',
    PATHWAYS = 'pathways',
    EXPRESSION_REDIRECT = 'expression',
    DOWNLOAD = 'download',
}

export enum ResultsViewPathwaysSubTab {
    PATHWAY_MAPPER = 'PathwayMapper',
    NDEX = 'NDEx Cancer Pathways',
}

export enum LegacyResultsViewComparisonSubTab {
    MUTATIONS = 'mutations',
    CNA = 'cna',
}

export enum ResultsViewComparisonSubTab {
    OVERLAP = 'overlap',
    SURVIVAL = 'survival',
    CLINICAL = 'clinical',
    MRNA = 'mrna',
    PROTEIN = 'protein',
    DNAMETHYLATION = 'dna_methylation',
    ALTERATIONS = 'alterations',
    GENERIC_ASSAY_PREFIX = 'generic_assay',
}

export function getTabId(pathname: string) {
    const match = pathname.match(/results\/([^\/]+)/);
    if (match) {
        return match[1] as ResultsViewTab;
    } else {
        return undefined;
    }
}

export function getSubTabId(pathName: string) {
    const tabSegment = getTabId(pathName);
    if (!tabSegment) {
        return undefined;
    }
    // Extract subtab name after "results/tabSegment/" in the URL path
    const subtabMatch = pathName.match(/\/results\/[^\/]+\/([^\/?#]+)/);
    if (subtabMatch) {
        return subtabMatch?.[1];
    } else {
        return undefined;
    }
}

export const oldTabToNewTabRoute: { [legacyTabId: string]: ResultsViewTab } = {
    oncoprint: ResultsViewTab.ONCOPRINT,
    cancer_types_summary: ResultsViewTab.CANCER_TYPES_SUMMARY,
    mutual_exclusivity: ResultsViewTab.MUTUAL_EXCLUSIVITY,
    plots: ResultsViewTab.PLOTS,
    mutations: ResultsViewTab.MUTATIONS,
    co_expression: ResultsViewTab.COEXPRESSION,
    IGV: ResultsViewTab.CN_SEGMENTS,
    network: ResultsViewTab.NETWORK,
    pathways: ResultsViewTab.PATHWAYS,
    expression: ResultsViewTab.EXPRESSION_REDIRECT,
    download: ResultsViewTab.DOWNLOAD,
};

export function parseConfigDisabledTabs(configDisabledTabsParam: string) {
    return configDisabledTabsParam
        .split(',')
        .map(s => s.trim())
        .map(str => {
            if (str in oldTabToNewTabRoute) {
                return oldTabToNewTabRoute[str];
            } else {
                return str;
            }
        });
}

export function substitutePhysicalStudiesForVirtualStudies(
    cancerStudyIds: string[],
    virtualStudies: VirtualStudy[]
) {
    let physicalStudies: string[] = [];

    //if a study is a virtual study, substitute its physical study ids
    const virtualStudiesKeyedById = _.keyBy(
        virtualStudies,
        virtualStudy => virtualStudy.id
    );
    cancerStudyIds.forEach(studyId => {
        if (studyId in virtualStudiesKeyedById) {
            const virtualStudy = virtualStudiesKeyedById[studyId];
            physicalStudies = physicalStudies.concat(
                virtualStudy.data.studies.map(study => study.id)
            );
        } else {
            physicalStudies.push(studyId);
        }
    });

    // it's possible that a virtual study could contain a physical study which is also selected independently
    // or is also contained by another selected virtual study
    // make sure physical study collection is unique
    return _.uniq(physicalStudies);
}

export function populateSampleSpecificationsFromVirtualStudies(
    samplesSpecifications: SamplesSpecificationElement[],
    virtualStudies: VirtualStudy[]
) {
    const virtualStudiesKeyedById = _.keyBy(
        virtualStudies,
        virtualStudy => virtualStudy.id
    );
    const samplesSpecificationsKeyedByStudyId = _.keyBy(
        samplesSpecifications,
        spec => spec.studyId
    );
    // remove specs for virtual studies (since they mean nothing to api)
    // and then populate with ids
    samplesSpecifications = _.filter(
        samplesSpecifications,
        spec => !virtualStudiesKeyedById[spec.studyId]
    );

    // only add sample specs when this virtual study is in the samplesSpecifications
    const selectedVirtualStudies = _.filter(
        virtualStudies,
        virtualStudy => samplesSpecificationsKeyedByStudyId[virtualStudy.id]
    );
    const allSelectedVirtualStudySampleSpecs = _.flatMapDeep(
        selectedVirtualStudies.map(virtualStudy => {
            return virtualStudy.data.studies.map(study => {
                return study.samples.map(sampleId => {
                    return {
                        studyId: study.id,
                        sampleListId: undefined,
                        sampleId: sampleId,
                    } as SamplesSpecificationElement;
                });
            }) as SamplesSpecificationElement[][];
        })
    );

    // ts not resolving type above and not sure why, so cast it
    samplesSpecifications = samplesSpecifications.concat(
        allSelectedVirtualStudySampleSpecs as SamplesSpecificationElement[]
    );

    return samplesSpecifications;
}

//testIt
export function parseSamplesSpecifications(
    case_ids: string,
    sample_list_ids: string | undefined,
    case_set_id: string,
    cancerStudyIds: string[]
): SamplesSpecificationElement[] {
    let samplesSpecifications: SamplesSpecificationElement[];

    if (case_ids && case_ids.length > 0) {
        const case_ids_parsed = case_ids.split(/\+|\s+/);
        samplesSpecifications = case_ids_parsed.map((item: string) => {
            const split = item.split(':');
            return {
                studyId: split[0],
                sampleId: split[1],
            } as SamplesSpecificationElement;
        });
    } else if (sample_list_ids) {
        samplesSpecifications = sample_list_ids
            .split(',')
            .map((studyListPair: string) => {
                const pair = studyListPair.split(':');
                return {
                    studyId: pair[0],
                    sampleListId: pair[1],
                    sampleId: undefined,
                };
            });
    } else if (case_set_id !== 'all') {
        // by definition if there is a case_set_id, there is only one study
        samplesSpecifications = cancerStudyIds.map((studyId: string) => {
            return {
                studyId: studyId,
                sampleListId: case_set_id,
                sampleId: undefined,
            };
        });
    } else if (case_set_id === 'all') {
        // case_set_id IS equal to all
        samplesSpecifications = cancerStudyIds.map((studyId: string) => {
            return {
                studyId,
                sampleListId: `${studyId}_all`,
                sampleId: undefined,
            };
        });
    } else {
        throw 'INVALID QUERY';
    }

    return samplesSpecifications;
}

export function addGenesToQuery(
    urlWrapper: ResultsViewURLWrapper,
    selectedGenes: string[],
    tab: ResultsViewTab = ResultsViewTab.ONCOPRINT
) {
    // add selected genes and go to the target tab
    const geneList = urlWrapper.query[ResultsViewURLQueryEnum.gene_list];

    urlWrapper.updateURL(
        {
            [ResultsViewURLQueryEnum.gene_list]: `${geneList}\n${selectedGenes.join(
                ' '
            )}`,
        },
        `results/${tab}`
    );
}

export const BoldedSpanList: React.FunctionComponent<{
    words: string[];
}> = observer(({ words }) => {
    return (
        <span>
            {words.map((tab, index) => (
                <span>
                    <strong>{tab}</strong>
                    {index < words.length - 1 ? ', ' : ''}
                </span>
            ))}
        </span>
    );
});
