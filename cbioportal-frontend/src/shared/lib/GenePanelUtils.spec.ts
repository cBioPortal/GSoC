import { assert } from 'chai';
import { Gene, GenePanelData, Patient, Sample } from 'cbioportal-ts-api-client';
import { computeGenePanelInformation } from 'shared/lib/GenePanelUtils';

describe('GenePanelUtils', () => {
    describe('computeGenePanelInformation', () => {
        const genes: Gene[] = [];
        const samples: Sample[] = [];
        const patients: Patient[] = [];
        let genePanelDatum1: any,
            genePanelDatum2: any,
            wxsDatum1: any,
            nsDatum1: any,
            nsDatum2: any;
        let genePanels: any[] = [];
        beforeAll(() => {
            genes.push({
                entrezGeneId: 0,
                hugoGeneSymbol: 'GENE1',
            } as Gene);
            genes.push({
                entrezGeneId: 1,
                hugoGeneSymbol: 'GENE2',
            } as Gene);
            genes.push({
                entrezGeneId: 2,
                hugoGeneSymbol: 'GENE3',
            } as Gene);

            genePanels.push({
                genePanelId: 'GENEPANEL1',
                genes: [genes[0], genes[1]],
            });

            genePanels.push({
                genePanelId: 'GENEPANEL2',
                genes: [genes[0], genes[1]],
            });

            samples.push({
                uniqueSampleKey: 'PATIENT1 SAMPLE1',
            } as Sample);
            samples.push({
                uniqueSampleKey: 'PATIENT1 SAMPLE2',
            } as Sample);
            samples.push({
                uniqueSampleKey: 'PATIENT2 SAMPLE1',
            } as Sample);

            patients.push({
                uniquePatientKey: 'PATIENT1',
            } as Patient);
            patients.push({
                uniquePatientKey: 'PATIENT2',
            } as Patient);

            genePanelDatum1 = {
                uniqueSampleKey: 'PATIENT1 SAMPLE1',
                uniquePatientKey: 'PATIENT1',
                molecularProfileId: 'PROFILE',
                genePanelId: 'GENEPANEL1',
                profiled: true,
            };

            genePanelDatum2 = {
                uniqueSampleKey: 'PATIENT2 SAMPLE1',
                uniquePatientKey: 'PATIENT2',
                molecularProfileId: 'PROFILE',
                genePanelId: 'GENEPANEL2',
                profiled: true,
            };

            wxsDatum1 = {
                uniqueSampleKey: 'PATIENT1 SAMPLE2',
                uniquePatientKey: 'PATIENT1',
                molecularProfileId: 'PROFILE',
                profiled: true,
            };

            nsDatum1 = {
                entrezGeneId: 2,
                molecularProfileId: 'PROFILE',
                uniqueSampleKey: 'PATIENT1 SAMPLE1',
                uniquePatientKey: 'PATIENT1',
                profiled: false,
            };

            nsDatum2 = {
                entrezGeneId: 2,
                molecularProfileId: 'PROFILE',
                uniqueSampleKey: 'PATIENT2 SAMPLE1',
                uniquePatientKey: 'PATIENT2',
                profiled: false,
            };
        });
        it('computes the correct object with no input data', () => {
            assert.deepEqual(
                computeGenePanelInformation(
                    [],
                    genePanels,
                    samples,
                    patients,
                    genes
                ),
                {
                    samples: {
                        'PATIENT1 SAMPLE1': {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [],
                        },
                        'PATIENT1 SAMPLE2': {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [],
                        },
                        'PATIENT2 SAMPLE1': {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [],
                        },
                    },
                    patients: {
                        PATIENT1: {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [],
                        },
                        PATIENT2: {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [],
                        },
                    },
                }
            );
        });
        it('computes the correct object with gene panel data', () => {
            assert.deepEqual(
                computeGenePanelInformation(
                    [genePanelDatum1, genePanelDatum2] as GenePanelData[],
                    genePanels,
                    samples,
                    patients,
                    genes
                ),
                {
                    samples: {
                        'PATIENT1 SAMPLE1': {
                            byGene: {
                                GENE1: [genePanelDatum1],
                                GENE2: [genePanelDatum1],
                            },
                            allGenes: [],
                            notProfiledByGene: { GENE3: [genePanelDatum1] },
                            notProfiledAllGenes: [],
                        },
                        'PATIENT1 SAMPLE2': {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [],
                        },
                        'PATIENT2 SAMPLE1': {
                            byGene: {
                                GENE1: [genePanelDatum2],
                                GENE2: [genePanelDatum2],
                            },
                            allGenes: [],
                            notProfiledByGene: { GENE3: [genePanelDatum2] },
                            notProfiledAllGenes: [],
                        },
                    },
                    patients: {
                        PATIENT1: {
                            byGene: {
                                GENE1: [genePanelDatum1],
                                GENE2: [genePanelDatum1],
                            },
                            allGenes: [],
                            notProfiledByGene: { GENE3: [genePanelDatum1] },
                            notProfiledAllGenes: [],
                        },
                        PATIENT2: {
                            byGene: {
                                GENE1: [genePanelDatum2],
                                GENE2: [genePanelDatum2],
                            },
                            allGenes: [],
                            notProfiledByGene: { GENE3: [genePanelDatum2] },
                            notProfiledAllGenes: [],
                        },
                    },
                }
            );
        });
        it('computes the correct object with whole exome sequenced data', () => {
            assert.deepEqual(
                computeGenePanelInformation(
                    [wxsDatum1] as GenePanelData[],
                    genePanels,
                    samples,
                    patients,
                    genes
                ),
                {
                    samples: {
                        'PATIENT1 SAMPLE1': {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [],
                        },
                        'PATIENT1 SAMPLE2': {
                            byGene: {},
                            allGenes: [wxsDatum1],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [],
                        },
                        'PATIENT2 SAMPLE1': {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [],
                        },
                    },
                    patients: {
                        PATIENT1: {
                            byGene: {},
                            allGenes: [wxsDatum1],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [],
                        },
                        PATIENT2: {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [],
                        },
                    },
                }
            );
        });
        it('computes the correct object with not sequenced data', () => {
            assert.deepEqual(
                computeGenePanelInformation(
                    [nsDatum1, nsDatum2] as GenePanelData[],
                    genePanels,
                    samples,
                    patients,
                    genes
                ),
                {
                    samples: {
                        'PATIENT1 SAMPLE1': {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [nsDatum1],
                        },
                        'PATIENT1 SAMPLE2': {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [],
                        },
                        'PATIENT2 SAMPLE1': {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [nsDatum2],
                        },
                    },
                    patients: {
                        PATIENT1: {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [nsDatum1],
                        },
                        PATIENT2: {
                            byGene: {},
                            allGenes: [],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [nsDatum2],
                        },
                    },
                }
            );
        });
        it('computes the correct object with gene panel data and whole exome sequenced data' /*and not sequenced data"*/, () => {
            assert.deepEqual(
                computeGenePanelInformation(
                    [
                        genePanelDatum1,
                        genePanelDatum2,
                        wxsDatum1,
                        nsDatum1,
                        nsDatum2,
                    ] as GenePanelData[],
                    genePanels,
                    samples,
                    patients,
                    genes
                ),
                {
                    samples: {
                        'PATIENT1 SAMPLE1': {
                            byGene: {
                                GENE1: [genePanelDatum1],
                                GENE2: [genePanelDatum1],
                            },
                            allGenes: [],
                            notProfiledByGene: { GENE3: [genePanelDatum1] },
                            notProfiledAllGenes: [nsDatum1],
                        },
                        'PATIENT1 SAMPLE2': {
                            byGene: {},
                            allGenes: [wxsDatum1],
                            notProfiledByGene: {},
                            notProfiledAllGenes: [],
                        },
                        'PATIENT2 SAMPLE1': {
                            byGene: {
                                GENE1: [genePanelDatum2],
                                GENE2: [genePanelDatum2],
                            },
                            allGenes: [],
                            notProfiledByGene: { GENE3: [genePanelDatum2] },
                            notProfiledAllGenes: [nsDatum2],
                        },
                    },
                    patients: {
                        PATIENT1: {
                            byGene: {
                                GENE1: [genePanelDatum1],
                                GENE2: [genePanelDatum1],
                            },
                            allGenes: [wxsDatum1],
                            notProfiledByGene: { GENE3: [genePanelDatum1] },
                            notProfiledAllGenes: [nsDatum1],
                        },
                        PATIENT2: {
                            byGene: {
                                GENE1: [genePanelDatum2],
                                GENE2: [genePanelDatum2],
                            },
                            allGenes: [],
                            notProfiledByGene: { GENE3: [genePanelDatum2] },
                            notProfiledAllGenes: [nsDatum2],
                        },
                    },
                }
            );
        });
    });
});
