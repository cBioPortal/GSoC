import {
    CancerStudyQueryUrlParams,
    normalizeQuery,
    QueryStore,
} from './QueryStore';
import { ResourceDefinition, SampleList } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { getSuffixOfMolecularProfile } from 'shared/lib/molecularProfileUtils';
import { VirtualStudy } from 'shared/api/session-service/sessionServiceModels';
import { IFilterDef } from './DataTypeFilter';

export enum MutationProfilesEnum {
    mutations = 'mutations',
}

export enum CNAProfilesEnum {
    cna = 'cna',
    gistic = 'gistic',
    cna_rae = 'cna_rae',
    cna_consensus = 'cna_consensus',
}

export enum StructuralVariantProfilesEnum {
    fusion = 'fusion', // TODO: should be removed once fusion profiles are removed from data files and database
    structural_variants = 'structural_variants',
}

export enum GeneSetProfilesEnum {
    gsva_scores = 'gsva_scores',
}

export const DEFAULT_STUDY_FILTER_OPTIONS = [
    {
        id: 'sequencedSampleCount',
        name: 'Mutations',
        checked: false,
    },
    {
        id: 'cnaSampleCount',
        name: 'CNA',
        checked: false,
    },
    {
        id: 'mrnaRnaSeqV2SampleCount',
        name: 'RNA-Seq',
        checked: false,
    },
    {
        id: 'mrnaMicroarraySampleCount',
        name: 'RNA (microarray)',
        checked: false,
    },
    {
        id: 'miRnaSampleCount',
        name: 'miRNA',
        checked: false,
    },
    {
        id: 'rppaSampleCount',
        name: 'RPPA',
        checked: false,
    },
    {
        id: 'massSpectrometrySampleCount',
        name: 'Protein Mass-Spectrometry',
        checked: false,
    },
    {
        id: 'treatmentCount',
        name: 'Treatment',
        checked: false,
    },
];

export function currentQueryParams(store: QueryStore) {
    const selectableSelectedStudyIds = store.selectableSelectedStudyIds;

    // case ids is of format study1:sample1+study2:sample2+...
    const case_ids = store.asyncCustomCaseSet.result
        .map(caseRow => caseRow.studyId + ':' + caseRow.sampleId)
        .join('+');

    let profileFilters: string[] = Object.keys(store.selectedProfileIdSet);

    // If there is a single non-virtual study in selection, add profiles based on the alteration types in the OQL if they are not pre-selected.
    // Example: If there are anything specific to mutation, ex: TP53: MUT = TRUNC INFRAME, then include/select mutation profile if it not selected in molecular profile slection section. Similarly even for other alteration type (Mutation, Structural Variant, Copy Number Alteration, mRNA Expression and Protein) in OQL
    if (!store.isVirtualStudyQuery) {
        // select default profiles for OQL alteration types
        let selectedMutationProfileType = store.getSelectedProfileTypeFromMolecularAlterationType(
            'MUTATION_EXTENDED'
        );
        if (
            store.alterationTypesInOQL.haveMutInQuery &&
            !selectedMutationProfileType &&
            store.defaultMutationProfile
        ) {
            profileFilters.push(
                getSuffixOfMolecularProfile(store.defaultMutationProfile)
            );
        }

        let selectedStructuralVariantProfileType = store.getSelectedProfileTypeFromMolecularAlterationType(
            'STRUCTURAL_VARIANT'
        );
        if (
            store.alterationTypesInOQL.haveStructuralVariantInQuery &&
            !selectedStructuralVariantProfileType &&
            store.defaultStructuralVariantProfile
        ) {
            profileFilters.push(
                getSuffixOfMolecularProfile(
                    store.defaultStructuralVariantProfile
                )
            );
        }

        let selectedCNAProfileType = store.getSelectedProfileTypeFromMolecularAlterationType(
            'COPY_NUMBER_ALTERATION'
        );
        if (
            store.alterationTypesInOQL.haveCnaInQuery &&
            !selectedCNAProfileType &&
            store.defaultCnaProfile
        ) {
            profileFilters.push(
                getSuffixOfMolecularProfile(store.defaultCnaProfile)
            );
        }

        let selectedMRNAProfileType = store.getSelectedProfileTypeFromMolecularAlterationType(
            'MRNA_EXPRESSION'
        );
        if (
            store.alterationTypesInOQL.haveMrnaInQuery &&
            !selectedMRNAProfileType &&
            store.defaultMrnaProfile
        ) {
            profileFilters.push(
                getSuffixOfMolecularProfile(store.defaultMrnaProfile)
            );
        }

        let selectedProtienProfileType = store.getSelectedProfileTypeFromMolecularAlterationType(
            'PROTEIN_LEVEL'
        );
        if (
            store.alterationTypesInOQL.haveProtInQuery &&
            !selectedProtienProfileType &&
            store.defaultProtProfile
        ) {
            profileFilters.push(
                getSuffixOfMolecularProfile(store.defaultProtProfile)
            );
        }
    }

    const ret: CancerStudyQueryUrlParams = {
        cancer_study_id:
            selectableSelectedStudyIds.length === 1
                ? selectableSelectedStudyIds[0]
                : 'all',
        cancer_study_list: undefined,
        Z_SCORE_THRESHOLD: store.zScoreThreshold,
        RPPA_SCORE_THRESHOLD: store.rppaScoreThreshold,
        profileFilter: profileFilters.join(','),
        case_set_id: store.selectedSampleListId || '-1', // empty string won't work
        case_ids,
        gene_list: normalizeQuery(store.geneQuery) || ' ', // empty string won't work
        geneset_list: normalizeQuery(store.genesetQuery) || ' ', //empty string won't work
        tab_index: store.forDownloadTab
            ? 'tab_download'
            : ('tab_visualize' as any),
        transpose_matrix: store.transposeDataMatrix ? 'on' : undefined,
        Action: 'Submit',
    };

    if (selectableSelectedStudyIds.length !== 1) {
        ret.cancer_study_list = selectableSelectedStudyIds.join(',');
    }

    return { query: ret };
}

export function categorizedSamplesCount(
    sampleLists: SampleList[],
    selectedStudies: string[],
    selectedVirtualStudies: VirtualStudy[]
) {
    let mutationSamples: {
        [studyId: string]: { [sampleId: string]: string };
    } = {};
    let cnaSamples: { [studyId: string]: { [sampleId: string]: string } } = {};
    let mutationCnaSamples: {
        [studyId: string]: { [sampleId: string]: string };
    } = {};
    let allSamples: { [studyId: string]: { [sampleId: string]: string } } = {};

    let filteredMutationSamples: {
        [studyId: string]: { [sampleId: string]: string };
    } = {};
    let filteredCnaSamples: {
        [studyId: string]: { [sampleId: string]: string };
    } = {};
    let filteredMutationCnaSamples: {
        [studyId: string]: { [sampleId: string]: string };
    } = {};
    let filteredallSamples: {
        [studyId: string]: { [sampleId: string]: string };
    } = {};

    _.each(sampleLists, sampleList => {
        switch (sampleList.category) {
            case 'all_cases_with_mutation_and_cna_data':
                mutationCnaSamples[sampleList.studyId] = _.keyBy(
                    sampleList.sampleIds
                );
                break;
            case 'all_cases_with_mutation_data':
                mutationSamples[sampleList.studyId] = _.keyBy(
                    sampleList.sampleIds
                );
                break;
            case 'all_cases_with_cna_data':
                cnaSamples[sampleList.studyId] = _.keyBy(sampleList.sampleIds);
                break;
            case 'all_cases_in_study':
                allSamples[sampleList.studyId] = _.keyBy(sampleList.sampleIds);
                break;
            default: {
                // this in case if the all cases list is tagged under other category
                if (sampleList.sampleListId === sampleList.studyId + '_all') {
                    allSamples[sampleList.studyId] = _.keyBy(
                        sampleList.sampleIds
                    );
                }
            }
        }
    });

    const selectedVirtualStudyIds = _.map(
        selectedVirtualStudies,
        virtualStudy => virtualStudy.id
    );
    const selectedPhysicalStudyIds = selectedStudies.filter(
        id => !_.includes(selectedVirtualStudyIds, id)
    );

    //add all samples from selected physical studies
    _.forEach(selectedPhysicalStudyIds, studyId => {
        filteredMutationSamples[studyId] = mutationSamples[studyId] || {};
        filteredCnaSamples[studyId] = cnaSamples[studyId] || {};
        filteredMutationCnaSamples[studyId] = mutationCnaSamples[studyId] || {};
        filteredallSamples[studyId] = allSamples[studyId] || {};
    });

    _.forEach(selectedVirtualStudies, virtualStudy => {
        _.forEach(virtualStudy.data.studies, study => {
            // check if the study in this virtual study is already in the selected studies list
            // and only add the samples if its not already present
            if (!_.includes(selectedPhysicalStudyIds, study.id)) {
                filteredMutationSamples[study.id] =
                    filteredMutationSamples[study.id] || {};
                filteredCnaSamples[study.id] =
                    filteredCnaSamples[study.id] || {};
                filteredMutationCnaSamples[study.id] =
                    filteredMutationCnaSamples[study.id] || {};
                filteredallSamples[study.id] =
                    filteredallSamples[study.id] || {};

                _.forEach(study.samples, sampleId => {
                    if (
                        mutationSamples[study.id] &&
                        mutationSamples[study.id][sampleId]
                    ) {
                        filteredMutationSamples[study.id][sampleId] = sampleId;
                    }
                    if (
                        cnaSamples[study.id] &&
                        cnaSamples[study.id][sampleId]
                    ) {
                        filteredCnaSamples[study.id][sampleId] = sampleId;
                    }
                    if (
                        mutationCnaSamples[study.id] &&
                        mutationCnaSamples[study.id][sampleId]
                    ) {
                        filteredMutationCnaSamples[study.id][
                            sampleId
                        ] = sampleId;
                    }
                    if (
                        allSamples[study.id] &&
                        allSamples[study.id][sampleId]
                    ) {
                        filteredallSamples[study.id][sampleId] = sampleId;
                    }
                });
            }
        });
    });

    return {
        w_mut: _.reduce(
            filteredMutationSamples,
            (acc: number, next) => acc + Object.keys(next).length,
            0
        ),
        w_cna: _.reduce(
            filteredCnaSamples,
            (acc: number, next) => acc + Object.keys(next).length,
            0
        ),
        w_mut_cna: _.reduce(
            filteredMutationCnaSamples,
            (acc: number, next) => acc + Object.keys(next).length,
            0
        ),
        all: _.reduce(
            filteredallSamples,
            (acc: number, next) => acc + Object.keys(next).length,
            0
        ),
    };
}

export function getMolecularProfileOptions(molecularProfileIdSet: {
    [profileType: string]: boolean;
}) {
    const molecularProfileOptions: {
        label: string;
        id: string;
        profileTypes: string[];
    }[] = [];

    if (molecularProfileIdSet[MutationProfilesEnum.mutations]) {
        molecularProfileOptions.push({
            label: 'Mutations',
            id: MutationProfilesEnum.mutations,
            profileTypes: [MutationProfilesEnum.mutations],
        });
    }

    const structuralVariantProfileTypes = Object.keys(
        StructuralVariantProfilesEnum
    ).filter(profileType => molecularProfileIdSet[profileType] !== undefined);
    if (structuralVariantProfileTypes.length > 0) {
        molecularProfileOptions.push({
            label: 'Structural variants',
            id: structuralVariantProfileTypes.join('-'),
            profileTypes: structuralVariantProfileTypes,
        });
    }

    const cnaProfileTypes = Object.keys(CNAProfilesEnum).filter(
        profileType => molecularProfileIdSet[profileType] !== undefined
    );
    if (cnaProfileTypes.length > 0) {
        molecularProfileOptions.push({
            label: 'Copy number alterations',
            id: cnaProfileTypes.join('-'),
            profileTypes: cnaProfileTypes,
        });
    }

    return molecularProfileOptions;
}

export function getResourceFilterOptions(
    resourceDefinitions: ResourceDefinition[]
): IFilterDef[] {
    const resourceIds = new Set<string>();
    return _.reduce(
        resourceDefinitions,
        (acc: IFilterDef[], rd) => {
            if (
                rd.resourceId !== 'CHROMOSCOPE' &&
                rd.resourceId !== 'FIGURES' &&
                !resourceIds.has(rd.resourceId)
            ) {
                resourceIds.add(rd.resourceId);
                acc.push({
                    id: rd.resourceId,
                    name: rd.displayName,
                    checked: false,
                });
            }
            return acc;
        },
        []
    );
}
