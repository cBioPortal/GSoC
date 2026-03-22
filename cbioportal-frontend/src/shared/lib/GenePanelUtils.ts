import _ from 'lodash';
import client from 'shared/api/cbioportalClientInstance';
import {
    Gene,
    GenePanel,
    GenePanelData,
    Patient,
    Sample,
} from 'cbioportal-ts-api-client';
import { REQUEST_ARG_ENUM } from 'shared/constants';

export type CoverageInformation = {
    samples: { [uniqueSampleKey: string]: CoverageInformationForCase };
    patients: { [uniquePatientKey: string]: CoverageInformationForCase };
};

export type CoverageInformationForCase = {
    byGene: { [hugoGeneSymbol: string]: GenePanelData[] };
    allGenes: Omit<GenePanelData, 'genePanelId'>[];
    notProfiledByGene: { [hugoGeneSymbol: string]: GenePanelData[] };
    notProfiledAllGenes: Omit<GenePanelData, 'genePanelId'>[];
};

export function computeGenePanelInformation(
    genePanelData: GenePanelData[],
    genePanels: GenePanel[],
    samples: Pick<Sample, 'uniqueSampleKey' | 'uniquePatientKey'>[],
    patients: Pick<Patient, 'uniquePatientKey'>[],
    genes: Pick<Gene, 'entrezGeneId' | 'hugoGeneSymbol'>[]
): CoverageInformation {
    const entrezToGene = _.keyBy(genes, gene => gene.entrezGeneId);
    const genePanelToGenes = _.mapValues(
        _.keyBy(genePanels, panel => panel.genePanelId),
        (panel: GenePanel) => {
            return panel.genes.filter(
                gene => !!entrezToGene[gene.entrezGeneId]
            ); // only list genes that we're curious in
        }
    );
    const sampleInfo: CoverageInformation['samples'] = _.reduce(
        samples,
        (map: CoverageInformation['samples'], sample) => {
            map[sample.uniqueSampleKey] = {
                byGene: {},
                allGenes: [],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            };
            return map;
        },
        {}
    );

    const patientInfo: CoverageInformation['patients'] = _.reduce(
        patients,
        (map: CoverageInformation['patients'], patient) => {
            map[patient.uniquePatientKey] = {
                byGene: {},
                allGenes: [],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            };
            return map;
        },
        {}
    );

    const genePanelDataWithGenePanelId: GenePanelData[] = [];
    for (const gpData of genePanelData) {
        const sampleSequencingInfo = sampleInfo[gpData.uniqueSampleKey];
        const patientSequencingInfo = patientInfo[gpData.uniquePatientKey];
        const genePanelId = gpData.genePanelId;

        if (gpData.profiled) {
            if (genePanelId) {
                if (genePanelToGenes[genePanelId]) {
                    // add gene panel data to record particular genes sequenced
                    for (const gene of genePanelToGenes[genePanelId]) {
                        sampleSequencingInfo.byGene[gene.hugoGeneSymbol] =
                            sampleSequencingInfo.byGene[gene.hugoGeneSymbol] ||
                            [];
                        sampleSequencingInfo.byGene[gene.hugoGeneSymbol].push(
                            gpData
                        );

                        patientSequencingInfo.byGene[gene.hugoGeneSymbol] =
                            patientSequencingInfo.byGene[gene.hugoGeneSymbol] ||
                            [];
                        patientSequencingInfo.byGene[gene.hugoGeneSymbol].push(
                            gpData
                        );
                    }
                    // Add to list for more processing later
                    genePanelDataWithGenePanelId.push(gpData);
                }
            } else {
                // otherwise, all genes are profiled
                sampleSequencingInfo.allGenes.push(gpData);
                patientSequencingInfo.allGenes.push(gpData);
            }
        } else {
            sampleSequencingInfo.notProfiledAllGenes.push(gpData);
            patientSequencingInfo.notProfiledAllGenes.push(gpData);
        }
    }
    // Record which of the queried genes are not profiled by gene panels
    for (const gpData of genePanelDataWithGenePanelId) {
        const sampleSequencingInfo = sampleInfo[gpData.uniqueSampleKey];
        const patientSequencingInfo = patientInfo[gpData.uniquePatientKey];

        for (const queryGene of genes) {
            if (!sampleSequencingInfo.byGene[queryGene.hugoGeneSymbol]) {
                sampleSequencingInfo.notProfiledByGene[
                    queryGene.hugoGeneSymbol
                ] =
                    sampleSequencingInfo.notProfiledByGene[
                        queryGene.hugoGeneSymbol
                    ] || [];
                sampleSequencingInfo.notProfiledByGene[
                    queryGene.hugoGeneSymbol
                ].push(gpData);
            }
            if (!patientSequencingInfo.byGene[queryGene.hugoGeneSymbol]) {
                patientSequencingInfo.notProfiledByGene[
                    queryGene.hugoGeneSymbol
                ] =
                    patientSequencingInfo.notProfiledByGene[
                        queryGene.hugoGeneSymbol
                    ] || [];
                patientSequencingInfo.notProfiledByGene[
                    queryGene.hugoGeneSymbol
                ].push(gpData);
            }
        }
    }
    return {
        samples: sampleInfo,
        patients: patientInfo,
    };
}

export async function getCoverageInformation(
    genePanelData: GenePanelData[],
    sampleKeyToSample: { [uniqueSampleKey: string]: Sample },
    patients: Pick<Patient, 'uniquePatientKey'>[],
    genes: Pick<Gene, 'entrezGeneId' | 'hugoGeneSymbol'>[]
) {
    // filter data only for our queried samples
    genePanelData = genePanelData.filter(
        d => d.uniqueSampleKey in sampleKeyToSample
    );

    // query for gene panel metadata
    const genePanelIds = _.uniq(
        genePanelData.map(gpData => gpData.genePanelId).filter(id => !!id)
    );
    let genePanels: GenePanel[] = [];
    if (genePanelIds.length > 0) {
        genePanels = await client.fetchGenePanelsUsingPOST({
            genePanelIds,
            projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
        });
    }

    // plug all data into computeGenePanelInformation to generate CoverageInformation object
    return computeGenePanelInformation(
        genePanelData,
        genePanels,
        _.values(sampleKeyToSample),
        patients,
        genes
    );
}
