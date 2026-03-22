import {
    ChartMeta,
    ChartType,
    SpecialChartsUniqueKeyEnum,
} from './StudyViewUtils';
import {
    MolecularDataMultipleStudyFilter,
    MolecularProfile,
    MutationMultipleStudyFilter,
    Sample,
    SampleIdentifier,
    SampleMolecularIdentifier,
} from 'cbioportal-ts-api-client';

import {
    StructuralVariant,
    StructuralVariantFilter,
} from 'cbioportal-ts-api-client';

import { getGroupParameters } from 'pages/groupComparison/comparisonGroupManager/ComparisonGroupManagerUtils';
import { LoadingPhase } from 'pages/groupComparison/GroupComparisonLoading';
import comparisonClient from 'shared/api/comparisonGroupClientInstance';
import _ from 'lodash';
import { ChartTypeEnum } from 'pages/studyView/StudyViewConfig';
import { getGeneFromUniqueKey } from './TableUtils';
import client from 'shared/api/cbioportalClientInstance';
import { REQUEST_ARG_ENUM } from 'shared/constants';
import internalClient from 'shared/api/cbioportalInternalClientInstance';

export function doesChartHaveComparisonGroupsLimit(chartMeta: ChartMeta) {
    return chartMeta.uniqueKey !== SpecialChartsUniqueKeyEnum.CANCER_STUDIES;
}

export async function createAlteredGeneComparisonSession<
    D extends SampleIdentifier
>(
    chartMeta: ChartMeta,
    origin: string[],
    alterationsByGene: { [hugoGeneSymbol: string]: D[] },
    statusCallback: (phase: LoadingPhase) => void
) {
    const groups = _.map(alterationsByGene, (data, gene) => {
        const sampleIdentifiers = _.uniqBy(
            data,
            d => `${d.sampleId}_${d.studyId}`
        ).map(d => ({ studyId: d.studyId, sampleId: d.sampleId }));
        return getGroupParameters(gene, sampleIdentifiers, origin);
    });
    statusCallback(LoadingPhase.CREATING_SESSION);
    // create session and get id
    const { id } = await comparisonClient.addComparisonSession({
        groups,
        origin,
        clinicalAttributeName: chartMeta.displayName,
    });
    return id;
}

export function getHugoGeneSymbols(
    chartType: ChartType,
    selectedRowsKeys: string[]
): string[] {
    switch (chartType) {
        case ChartTypeEnum.CNA_GENES_TABLE:
            return _.uniq(selectedRowsKeys.map(getGeneFromUniqueKey));
            break;
        default:
            return selectedRowsKeys;
    }
}

export function getSampleMolecularIdentifiers(
    selectedSamples: Sample[],
    profiles: MolecularProfile[]
) {
    const studyToProfile = _.keyBy(profiles, p => p.studyId);
    return selectedSamples.reduce((array, sample) => {
        if (sample.studyId in studyToProfile) {
            array.push({
                sampleId: sample.sampleId,
                molecularProfileId:
                    studyToProfile[sample.studyId].molecularProfileId,
            });
        }
        return array;
    }, [] as SampleMolecularIdentifier[]);
}

export async function getMutationData(
    selectedSamples: Sample[],
    mutationProfiles: MolecularProfile[],
    hugoGeneSymbols: string[]
) {
    const sampleMolecularIdentifiers = getSampleMolecularIdentifiers(
        selectedSamples,
        mutationProfiles
    );

    const genes = await client.fetchGenesUsingPOST({
        geneIdType: 'HUGO_GENE_SYMBOL',
        geneIds: hugoGeneSymbols,
    });

    const mutationMultipleStudyFilter = {
        entrezGeneIds: genes.map(g => g.entrezGeneId),
        sampleMolecularIdentifiers,
    } as MutationMultipleStudyFilter;

    return client.fetchMutationsInMultipleMolecularProfilesUsingPOST({
        projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
        mutationMultipleStudyFilter,
    });
}

export async function getCnaData(
    selectedSamples: Sample[],
    cnaProfiles: MolecularProfile[],
    hugoGeneSymbols: string[]
) {
    const sampleMolecularIdentifiers = getSampleMolecularIdentifiers(
        selectedSamples,
        cnaProfiles
    );

    const genes = await client.fetchGenesUsingPOST({
        geneIdType: 'HUGO_GENE_SYMBOL',
        geneIds: hugoGeneSymbols,
    });
    return client.fetchMolecularDataInMultipleMolecularProfilesUsingPOST({
        projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
        molecularDataMultipleStudyFilter: {
            entrezGeneIds: genes.map(g => g.entrezGeneId),
            sampleMolecularIdentifiers,
        } as MolecularDataMultipleStudyFilter,
    });
}

export async function getSvData(
    selectedSamples: Sample[],
    svProfiles: MolecularProfile[],
    hugoGeneSymbols: string[]
) {
    const sampleMolecularIdentifiers = getSampleMolecularIdentifiers(
        selectedSamples,
        svProfiles
    );

    const genes = await client.fetchGenesUsingPOST({
        geneIdType: 'HUGO_GENE_SYMBOL',
        geneIds: hugoGeneSymbols,
    });

    return internalClient.fetchStructuralVariantsUsingPOST({
        structuralVariantFilter: {
            entrezGeneIds: genes.map(g => g.entrezGeneId),
            sampleMolecularIdentifiers,
        } as StructuralVariantFilter,
    });
}

export function groupSvDataByGene(
    svData: StructuralVariant[],
    comparisonGenes: string[]
) {
    // group structural variants both by site 1 and site 2, but only for comparisonGenes
    // We dont care to group data by the gene on the other side of the fusion, because
    //  our comparison groups should just be based on the selected genes

    const data: { [hugoSymbol: string]: StructuralVariant[] } = {};
    for (const g of comparisonGenes) {
        data[g] = [];
    }

    for (const d of svData) {
        if (d.site1HugoSymbol in data) {
            data[d.site1HugoSymbol].push(d);
        }
        if (d.site2HugoSymbol in data) {
            data[d.site2HugoSymbol].push(d);
        }
    }
    return data;
}

export function getComparisonParamsForTable(
    selectedRowsKeys: string[],
    chartType: ChartType
) {
    switch (chartType) {
        case ChartTypeEnum.MUTATED_GENES_TABLE:
        case ChartTypeEnum.CNA_GENES_TABLE:
        case ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE:
            const hugoGeneSymbols = getHugoGeneSymbols(
                chartType,
                selectedRowsKeys.slice() // slice() gets rid of mobx wrapping which messes up API calls
            );
            return {
                hugoGeneSymbols,
            };
        case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE:
        case ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE:
        case ChartTypeEnum.SAMPLE_TREATMENT_TARGET_TABLE:
        case ChartTypeEnum.PATIENT_TREATMENTS_TABLE:
        case ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE:
        case ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE:
            return {
                treatmentUniqueKeys: selectedRowsKeys.slice(), // slice() gets rid of mobx wrapping which messes up API calls
            };
        case ChartTypeEnum.VARIANT_ANNOTATIONS_TABLE:
            return {
                namespaceAttributeValues: selectedRowsKeys.slice(),
            };
        default:
            return {};
    }
}
