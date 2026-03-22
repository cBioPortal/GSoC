import { assert } from 'chai';
import {
    fillClinicalTrackDatum,
    fillGeneticTrackDatum,
    fillHeatmapTrackDatum,
    getOncoprintMutationType,
    HeatmapCaseDatum,
    makeGeneticTrackData,
    selectDisplayValue,
} from './DataUtils';
import {
    GeneticTrackDatum,
    IGeneHeatmapTrackDatum,
    IGenesetHeatmapTrackDatum,
    IGenericAssayHeatmapTrackDatum,
} from 'shared/components/oncoprint/Oncoprint';
import { AlterationTypeConstants } from 'shared/constants';
import {
    ClinicalAttribute,
    GenePanelData,
    MolecularProfile,
    Mutation,
    Patient,
    Sample,
} from 'cbioportal-ts-api-client';
import { MutationSpectrum } from 'cbioportal-ts-api-client';
import { SpecialAttribute } from '../../cache/ClinicalDataCache';
import { AnnotatedExtendedAlteration } from 'shared/model/AnnotatedExtendedAlteration';

/* Type assertions are used throughout this file to force functions to accept
/* mocked parameters known to be sufficient. */
/* tslint:disable no-object-literal-type-assertion */

describe('DataUtils', () => {
    describe('getOncoprintMutationType', () => {
        it('correctly gets `promoter` type based on mutation.proteinChange', () => {
            assert.equal(
                getOncoprintMutationType({
                    proteinChange: 'Promoter',
                    mutationType: 'asdjfpoai',
                } as Mutation),
                'promoter'
            );
            assert.equal(
                getOncoprintMutationType({
                    proteinChange: 'PROMOTER',
                    mutationType: 'asdfjii',
                } as Mutation),
                'promoter'
            );
            assert.equal(
                getOncoprintMutationType({
                    proteinChange: 'promoter',
                    mutationType: 'Asdfasl',
                } as Mutation),
                'promoter'
            );
            assert.equal(
                getOncoprintMutationType({
                    proteinChange: 'Promoter',
                } as Mutation),
                'promoter'
            );
        });
    });
    describe('selectDisplayValue', () => {
        it('returns undefined if no values', () => {
            assert.equal(selectDisplayValue({}, {}), undefined);
        });
        it('returns the lone value if one value', () => {
            assert.equal(selectDisplayValue({ a: 0 }, { a: 0 }), 'a');
        });
        it('returns the lowest priority value if two values', () => {
            assert.equal(
                selectDisplayValue({ a: 0, b: 0 }, { a: 0, b: 1 }),
                'a'
            );
            assert.equal(
                selectDisplayValue({ a: 0, b: 0 }, { a: 1, b: 0 }),
                'b'
            );
        });
        it('returns the lowest priority value if several values', () => {
            assert.equal(
                selectDisplayValue({ a: 0, b: 0, c: 5 }, { a: 0, b: 1, c: 2 }),
                'a'
            );
            assert.equal(
                selectDisplayValue(
                    { a: 20, b: 0, c: 10 },
                    { a: 2, b: 1, c: 0 }
                ),
                'c'
            );
        });
        it('returns the lowest priority, highest count value if two values w same priority', () => {
            assert.equal(
                selectDisplayValue({ a: 1, b: 0 }, { a: 0, b: 0 }),
                'a'
            );
            assert.equal(
                selectDisplayValue({ a: 0, b: 1 }, { a: 0, b: 0 }),
                'b'
            );
        });
        it('returns the lowest priority, highest count value if several values w same priority', () => {
            assert.equal(
                selectDisplayValue({ a: 1, b: 0, c: 5 }, { a: 0, b: 0, c: 2 }),
                'a'
            );
            assert.equal(
                selectDisplayValue(
                    { a: 20, b: 0, c: 10 },
                    { a: 0, b: 1, c: 0 }
                ),
                'a'
            );
        });
    });

    describe('makeGeneticTrackData', () => {
        const makeMinimalGenePanelData = (
            patientKey: string,
            profiled: boolean
        ) =>
            ({
                molecularProfileId: 'PROFILE1',
                uniquePatientKey: patientKey,
                uniqueSampleKey: `${patientKey}-SAMPLE1`,
                genePanelId: 'GENEPANEL1',
                profiled,
            } as GenePanelData);
        const makeMinimalDifferentGenePanelData = (
            patientKey: string,
            profiled: boolean
        ) =>
            ({
                molecularProfileId: 'PROFILE1',
                uniquePatientKey: patientKey,
                uniqueSampleKey: `${patientKey}-SAMPLE1`,
                genePanelId: 'GENEPANEL2',
                profiled,
            } as GenePanelData);
        const makeMinimalWholeExomePanelData = (
            patientKey: string,
            profiled: boolean
        ) =>
            ({
                molecularProfileId: 'PROFILE1',
                uniquePatientKey: patientKey,
                uniqueSampleKey: `${patientKey}-SAMPLE1`,
                profiled,
            } as GenePanelData);
        const makeMinimalPatient = (
            uniquePatientKey: string,
            patientId: string
        ) =>
            ({
                uniquePatientKey,
                patientId,
                studyId: 'gbm_tcga',
            } as Patient);
        const makeMinimalProfilelArray = () =>
            [
                {
                    molecularProfileId: 'PROFILE1',
                    studyId: 'STUDY1',
                    study: {
                        groups: '',
                        name: 'STUDY1',
                        publicStudy: true,
                        status: 1,
                        studyId: 'STUDY1',
                    },
                    name: 'PROFILE1',
                    description: '',
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    datatype: 'DISCRETE',
                    showProfileInAnalysisTab: true,
                },
            ] as MolecularProfile[];

        it('returns one cell for each listed case', () => {
            // given three patients and a whole-exome coverage panel
            const patientArray = [
                makeMinimalPatient('PATIENT1', 'TCGA-02-0001'),
                makeMinimalPatient('PATIENT2', 'TCGA-02-0003'),
                makeMinimalPatient('PATIENT3', 'TCGA-02-0006'),
            ];
            const makeMinimalPatientGenePanel = (patientKey: string) => ({
                allGenes: [makeMinimalWholeExomePanelData(patientKey, true)],
                byGene: {},
                notProfiledAllGenes: [],
                notProfiledByGene: {},
            });
            const genePanelByCase = {
                samples: {},
                patients: {
                    PATIENT1: makeMinimalPatientGenePanel('PATIENT1'),
                    PATIENT2: makeMinimalPatientGenePanel('PATIENT2'),
                    PATIENT3: makeMinimalPatientGenePanel('PATIENT3'),
                },
            };
            // when called to make data for a gene that has zero alterations in
            // these patients
            const trackData = makeGeneticTrackData(
                { PATIENT1: [], PATIENT2: [], PATIENT3: [] },
                'PTEN',
                patientArray,
                genePanelByCase,
                makeMinimalProfilelArray()
            );
            // then it returns three cells of data, corresponding to first, second
            // and third patient respectively
            assert.lengthOf(trackData, 3);
            assert.equal(trackData[0].patient, 'TCGA-02-0001');
            assert.equal(trackData[1].patient, 'TCGA-02-0003');
            assert.equal(trackData[2].patient, 'TCGA-02-0006');
        });

        it('sets na if a single-gene cell is not covered by any panel', () => {
            // given a patient and a gene panel that doesn't mark all genes as
            // profiled in that patient
            const patientArray = [
                makeMinimalPatient('PATIENT1', 'TCGA-02-0001'),
            ];
            const genePanelByCase = {
                samples: {},
                patients: {
                    PATIENT1: {
                        allGenes: [],
                        byGene: {
                            PTEN: [makeMinimalGenePanelData('PATIENT1', true)],
                        },
                        notProfiledAllGenes: [],
                        notProfiledByGene: {
                            TP53: [makeMinimalGenePanelData('PATIENT1', false)],
                        },
                    },
                },
            };
            // when called to make a cell of data for a zero-alteration gene that
            // isn't covered by the panel
            const [trackDatum] = makeGeneticTrackData(
                { PATIENT1: [] },
                'TP53',
                patientArray,
                genePanelByCase,
                makeMinimalProfilelArray()
            );
            // then it sets the na field of the cell to true
            assert.isTrue(trackDatum.na);
        });

        it('sets na if none of the genes in a multi-gene cell is covered by a panel', () => {
            // given a patient and a gene panel that doesn't mark all genes as
            // profiled in that patient
            const patientArray = [
                makeMinimalPatient('PATIENT1', 'TCGA-02-0001'),
            ];
            const genePanelByCase = {
                samples: {},
                patients: {
                    PATIENT1: {
                        allGenes: [],
                        byGene: {
                            PTEN: [makeMinimalGenePanelData('PATIENT1', true)],
                        },
                        notProfiledAllGenes: [],
                        notProfiledByGene: {
                            TP53: [makeMinimalGenePanelData('PATIENT1', false)],
                            BRCA1: [
                                makeMinimalGenePanelData('PATIENT1', false),
                            ],
                        },
                    },
                },
            };
            // when called to make a cell of data for two zero-alteration genes
            // that aren't covered by the panel
            const [trackDatum] = makeGeneticTrackData(
                { PATIENT1: [] },
                ['TP53', 'BRCA1'],
                patientArray,
                genePanelByCase,
                makeMinimalProfilelArray()
            );
            // then it sets the na field of the cell to true
            assert.isTrue(trackDatum.na);
        });

        it('does not set na if a single-gene cell is covered by a panel', () => {
            // given a patient and a gene panel that marks a gene as profiled in
            // that patient
            const patientArray = [
                makeMinimalPatient('PATIENT1', 'TCGA-02-0001'),
            ];
            const genePanelByCase = {
                samples: {},
                patients: {
                    PATIENT1: {
                        allGenes: [],
                        byGene: {
                            PTEN: [makeMinimalGenePanelData('PATIENT1', true)],
                        },
                        notProfiledAllGenes: [],
                        notProfiledByGene: {},
                    },
                },
            };
            // when called to make a cell of data for that (zero-alteration) gene
            const [trackDatum] = makeGeneticTrackData(
                { PATIENT1: [] },
                'PTEN',
                patientArray,
                genePanelByCase,
                makeMinimalProfilelArray()
            );
            // then it makes the na field of that track evaluate to a falsy value
            assert.isNotOk(trackDatum.na);
        });

        it('does not set na if one of the genes in a multi-gene cell is covered by a panel', () => {
            // given a patient and a gene panel that marks a gene as profiled in
            // that patient
            const patientArray = [
                makeMinimalPatient('PATIENT1', 'TCGA-02-0001'),
            ];
            const genePanelByCase = {
                samples: {},
                patients: {
                    PATIENT1: {
                        allGenes: [],
                        byGene: {
                            PTEN: [makeMinimalGenePanelData('PATIENT1', true)],
                        },
                        notProfiledAllGenes: [],
                        notProfiledByGene: {
                            BRCA2: [
                                makeMinimalGenePanelData('PATIENT1', false),
                            ],
                        },
                    },
                },
            };
            // when called to make a cell of data for that (zero-alteration) gene
            // in addition to another one
            const [trackDatum] = makeGeneticTrackData(
                { PATIENT1: [] },
                ['BRCA2', 'PTEN'],
                patientArray,
                genePanelByCase,
                makeMinimalProfilelArray()
            );
            // then it makes the na field of that track evaluate to a falsy value
            assert.isNotOk(trackDatum.na);
        });

        it('does not set na if a single-gene cell is covered by whole-exome profiling', () => {
            // given a patient and a whole-exome gene panel that marks a gene as
            // profiled in that patient
            const patientArray = [
                makeMinimalPatient('PATIENT1', 'TCGA-02-0001'),
            ];
            const genePanelByCase = {
                samples: {},
                patients: {
                    PATIENT1: {
                        allGenes: [
                            makeMinimalWholeExomePanelData('PATIENT1', true),
                        ],
                        byGene: {},
                        notProfiledAllGenes: [],
                        notProfiledByGene: {},
                    },
                },
            };
            // when called to make a cell of data for that (zero-alteration) gene
            const [trackDatum] = makeGeneticTrackData(
                { PATIENT1: [] },
                'PTEN',
                patientArray,
                genePanelByCase,
                makeMinimalProfilelArray()
            );
            // then it makes the na field of that track evaluate to a falsy value
            assert.isNotOk(trackDatum.na);
        });

        it('sets na per cell if two single-gene cells have different coverage', () => {
            // given two patients and a gene panel that marks a gene as profiled
            // in only one of them
            const patientArray = [
                makeMinimalPatient('PATIENT1', 'TCGA-02-0001'),
                makeMinimalPatient('PATIENT2', 'TCGA-02-0003'),
            ];
            const genePanelByCase = {
                samples: {},
                patients: {
                    PATIENT1: {
                        allGenes: [],
                        byGene: {
                            PTEN: [makeMinimalGenePanelData('PATIENT1', true)],
                        },
                        notProfiledAllGenes: [],
                        notProfiledByGene: {},
                    },
                    PATIENT2: {
                        allGenes: [],
                        byGene: {},
                        notProfiledAllGenes: [],
                        notProfiledByGene: {
                            PTEN: [makeMinimalGenePanelData('PATIENT2', false)],
                        },
                    },
                },
            };
            // when called to make data for that (zero-alteration) gene
            const trackData = makeGeneticTrackData(
                { PATIENT1: [], PATIENT2: [] },
                'PTEN',
                patientArray,
                genePanelByCase,
                makeMinimalProfilelArray()
            );
            // then it sets na only on the cell for the patient that wasn't covered
            assert.isNotOk(trackData[0].na);
            assert.isTrue(trackData[1].na);
        });

        it('lists a profile in profiled_in if it covers a single-gene cell by whole-exome profiling', () => {
            // given a patient and a whole-exome gene panel that marks a gene as
            // profiled in that patient
            const patientArray = [
                makeMinimalPatient('PATIENT1', 'TCGA-02-0001'),
            ];
            const genePanelByCase = {
                samples: {},
                patients: {
                    PATIENT1: {
                        allGenes: [
                            makeMinimalWholeExomePanelData('PATIENT1', true),
                        ],
                        byGene: {},
                        notProfiledAllGenes: [],
                        notProfiledByGene: {},
                    },
                },
            };
            // when called to make a cell of data for that (zero-alteration) gene
            const [trackDatum] = makeGeneticTrackData(
                { PATIENT1: [] },
                'PTEN',
                patientArray,
                genePanelByCase,
                makeMinimalProfilelArray()
            );
            // then it lists the profile in profiled_in and not in not_profiled_in
            assert.deepEqual(trackDatum.profiled_in, [
                makeMinimalWholeExomePanelData('PATIENT1', true),
            ]);
            assert.deepEqual(
                trackDatum.not_profiled_in,
                [],
                'nothing should be listed in not_profiled_in in this case'
            );
        });

        it('lists a profile in profiled_in if it covers a single-gene cell by a non-whole-exome panel', () => {
            // given a patient and a non-whole-exome gene panel that marks a gene
            // as profiled in that patient
            const patientArray = [
                makeMinimalPatient('PATIENT1', 'TCGA-02-0001'),
            ];
            const genePanelByCase = {
                samples: {},
                patients: {
                    PATIENT1: {
                        allGenes: [],
                        byGene: {
                            PTEN: [makeMinimalGenePanelData('PATIENT1', true)],
                        },
                        notProfiledAllGenes: [],
                        notProfiledByGene: {},
                    },
                },
            };
            // when called to make a cell of data for that (zero-alteration) gene
            const [trackDatum] = makeGeneticTrackData(
                { PATIENT1: [] },
                'PTEN',
                patientArray,
                genePanelByCase,
                makeMinimalProfilelArray()
            );
            // then it lists the profile in profiled_in and not in not_profiled_in
            assert.deepEqual(trackDatum.profiled_in, [
                makeMinimalGenePanelData('PATIENT1', true),
            ]);
            assert.deepEqual(
                trackDatum.not_profiled_in,
                [],
                'nothing should be listed in not_profiled_in in this case'
            );
        });

        it('lists a profile in not_profiled_in if it skips a single-gene cell in a non-whole-exome panel', () => {
            // given a patient and a gene panel that doesn't mark all genes as
            // profiled in that patient
            const patientArray = [
                makeMinimalPatient('PATIENT1', 'TCGA-02-0001'),
            ];
            const genePanelByCase = {
                samples: {},
                patients: {
                    PATIENT1: {
                        allGenes: [],
                        byGene: {
                            PTEN: [makeMinimalGenePanelData('PATIENT1', true)],
                        },
                        notProfiledAllGenes: [],
                        notProfiledByGene: {
                            TP53: [makeMinimalGenePanelData('PATIENT1', false)],
                        },
                    },
                },
            };
            // when called to make a cell of data for a zero-alteration gene that
            // isn't covered by the panel
            const [trackDatum] = makeGeneticTrackData(
                { PATIENT1: [] },
                'TP53',
                patientArray,
                genePanelByCase,
                makeMinimalProfilelArray()
            );
            // then it lists the profile in not_profiled_in and not in profiled_in
            assert.deepEqual(trackDatum.not_profiled_in, [
                makeMinimalGenePanelData('PATIENT1', false),
            ]);
            assert.deepEqual(
                trackDatum.profiled_in,
                [],
                'nothing should be listed in profiled_in in this case'
            );
        });

        it('lists a profile in not_profiled_in if it fails to cover a patient at all', () => {
            // given a patient and a gene panel that marks that patient as
            // unprofiled for all genes
            const patientArray = [
                makeMinimalPatient('PATIENT1', 'TCGA-02-0001'),
            ];
            const genePanelByCase = {
                samples: {},
                patients: {
                    PATIENT1: {
                        allGenes: [],
                        byGene: {},
                        notProfiledAllGenes: [
                            makeMinimalWholeExomePanelData('PATIENT1', false),
                        ],
                        notProfiledByGene: {},
                    },
                },
            };
            // when called to make a cell of data for any (zero-alteration) gene
            const [trackDatum] = makeGeneticTrackData(
                { PATIENT1: [] },
                'TP53',
                patientArray,
                genePanelByCase,
                makeMinimalProfilelArray()
            );
            // then it lists the profile in not_profiled_in and not in profiled_in
            assert.deepEqual(trackDatum.not_profiled_in, [
                makeMinimalWholeExomePanelData('PATIENT1', false),
            ]);
            assert.deepEqual(
                trackDatum.profiled_in,
                [],
                'nothing should be listed in profiled_in in this case'
            );
        });

        it('lists panel coverage and non-coverage for all genes displayed in the cell', () => {
            // given a patient, a gene panel that marks two genes as profiled in
            // that patient, and a different gene panel that marks one
            // of them as profiled in that patient
            const patientArray = [
                makeMinimalPatient('PATIENT1', 'TCGA-02-0001'),
            ];
            const genePanelByCase = {
                samples: {},
                patients: {
                    PATIENT1: {
                        allGenes: [],
                        byGene: {
                            PTEN: [makeMinimalGenePanelData('PATIENT1', true)],
                            BRCA2: [
                                makeMinimalGenePanelData('PATIENT1', true),
                                makeMinimalDifferentGenePanelData(
                                    'PATIENT1',
                                    true
                                ),
                            ],
                        },
                        notProfiledAllGenes: [],
                        notProfiledByGene: {
                            PTEN: [
                                makeMinimalDifferentGenePanelData(
                                    'PATIENT1',
                                    false
                                ),
                            ],
                            BRCA1: [
                                makeMinimalGenePanelData('PATIENT1', false),
                                makeMinimalDifferentGenePanelData(
                                    'PATIENT1',
                                    false
                                ),
                            ],
                        },
                    },
                },
            };
            // when called to make a cell of data for the two (zero-alteration)
            // genes and another one that isn't covered
            const [trackDatum] = makeGeneticTrackData(
                { PATIENT1: [] },
                ['BRCA2', 'PTEN', 'BRCA1'],
                patientArray,
                genePanelByCase,
                makeMinimalProfilelArray()
            );
            // then the profiled_in attribute for the cell lists all the gene
            // panel/profile combinations for the two covered genes in this
            // patient, and the not_profiled_in attribute lists them for the
            // un-covered genes
            assert.deepEqual(
                trackDatum.profiled_in,
                [
                    makeMinimalGenePanelData('PATIENT1', true), // BRCA2
                    makeMinimalDifferentGenePanelData('PATIENT1', true), // BRCA2
                    makeMinimalGenePanelData('PATIENT1', true), // PTEN
                ],
                'profiled_in should list the panels that cover genes'
            );
            assert.deepEqual(
                trackDatum.not_profiled_in,
                [
                    makeMinimalDifferentGenePanelData('PATIENT1', false), // PTEN
                    makeMinimalGenePanelData('PATIENT1', false), // BRCA1
                    makeMinimalDifferentGenePanelData('PATIENT1', false), // BRCA1
                ],
                "not_profiled_in should list the panels that don't cover genes"
            );
        });
    });

    describe('fillGeneticTrackDatum', () => {
        const makeMinimalUnfilledDatum = () => ({
            study_id: 'study1',
            uid: 'SAMPLE1==',
            patient: 'patient1',
        });
        it('fills a datum w no data correctly', () => {
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', []),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: [],
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                }
            );
        });
        it('fills a datum w one mutation data correctly', () => {
            let data = [
                {
                    mutationType: 'missense',
                    putativeDriver: true,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: 'missense_rec',
                    disp_germ: false,
                    disp_structuralVariant: undefined,
                },
                'missense driver with no germline'
            );

            data = [
                {
                    mutationType: 'in_frame_del',
                    putativeDriver: false,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: 'inframe',
                    disp_germ: false,
                    disp_structuralVariant: undefined,
                },
                'inframe non-driver'
            );

            data = [
                {
                    mutationType: 'start_codon_del',
                    putativeDriver: false,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: 'trunc',
                    disp_germ: false,
                    disp_structuralVariant: undefined,
                },
                'truncating non-driver'
            );

            data = [
                {
                    mutationType: 'fusion',
                    putativeDriver: false,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.STRUCTURAL_VARIANT,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_structuralVariant: 'sv',
                    disp_germ: undefined,
                },
                'fusion non-driver'
            );
        });

        it('fills a datum w one cna data correctly', () => {
            let data = [
                {
                    value: 2,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: 'amp',
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'amplification'
            );

            data = [
                {
                    value: 1,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: 'gain',
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'gain'
            );

            data = [
                {
                    value: -1,
                    alterationType: '',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: 'hetloss',
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'hetloss'
            );

            data = [
                {
                    value: -2,
                    alterationType: '',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: 'homdel',
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'homdel'
            );

            data = [
                {
                    value: 0,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'diploid'
            );
        });

        it('fills a datum w one germline data correctly', () => {
            let data = [
                {
                    mutationType: 'missense',
                    putativeDriver: true,
                    mutationStatus: 'Germline',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: 'missense_rec',
                    disp_germ: true,
                    disp_structuralVariant: undefined,
                },
                'missense driver with germline'
            );

            data = [
                {
                    mutationType: 'missense',
                    putativeDriver: true,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: 'missense_rec',
                    disp_germ: false,
                    disp_structuralVariant: undefined,
                },
                'missense driver without germline'
            );
        });

        it('fills a datum w one germline and one non-germline data correctly', () => {
            let data = [
                {
                    mutationType: 'missense',
                    putativeDriver: true,
                    mutationStatus: 'Germline',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
                {
                    mutationType: 'missense',
                    putativeDriver: false,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
            ];

            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: 'missense_rec',
                    disp_germ: true,
                    disp_structuralVariant: undefined,
                },
                'missense driver with germline is stronger than missense passenger'
            );

            data = [
                {
                    mutationType: 'missense',
                    putativeDriver: false,
                    mutationStatus: 'Germline',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
                {
                    mutationType: 'start_codon_del',
                    putativeDriver: true,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
            ];

            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: 'trunc_rec',
                    disp_germ: false,
                    disp_structuralVariant: undefined,
                },
                'trunc driver is stronger than missense passenger w germline'
            );
        });

        it('fills a datum w one mrna data correctly', () => {
            let data = [
                {
                    alterationSubType: 'high',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: 'high',
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'high'
            );

            data = [
                {
                    alterationSubType: 'low',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: 'low',
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'low'
            );
        });
        it('fills a datum w one protein data correctly', () => {
            let data = [
                {
                    alterationSubType: 'high',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.PROTEIN_LEVEL,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: 'high',
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'high'
            );

            data = [
                {
                    alterationSubType: 'low',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.PROTEIN_LEVEL,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: 'low',
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'low'
            );
        });
        it('fills a datum w two mutation data w correct priority', () => {
            let data = [
                {
                    mutationType: 'missense',
                    putativeDriver: true,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
                {
                    mutationType: 'start_codon_del',
                    putativeDriver: true,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: 'trunc_rec',
                    disp_germ: false,
                    disp_structuralVariant: undefined,
                },
                'truncating driver beats missense driver'
            );

            data = [
                {
                    mutationType: 'missense',
                    putativeDriver: true,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
                {
                    mutationType: 'start_codon_del',
                    putativeDriver: false,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: 'missense_rec',
                    disp_germ: false,
                    disp_structuralVariant: undefined,
                },
                'missense driver beats truncating non-driver'
            );

            data = [
                {
                    mutationType: 'missense',
                    putativeDriver: false,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
                {
                    mutationType: 'start_codon_del',
                    putativeDriver: false,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: 'trunc',
                    disp_germ: false,
                    disp_structuralVariant: undefined,
                },
                'truncating non-driver beats missense non-driver'
            );
        });
        it('fills a datum w multiple cna data w correct priority', () => {
            let data = [
                {
                    value: 2,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
                {
                    value: 1,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: 'amp',
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'amplification beats gain'
            );

            data = [
                {
                    value: -2,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
                {
                    value: 0,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: 'homdel',
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'homdel beats diploid'
            );

            data = [
                {
                    value: -2,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
                {
                    value: -2,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
                {
                    value: 2,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: 'homdel',
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'two homdels beats one amp'
            );

            data = [
                {
                    value: -2,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
                {
                    value: 2,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
                {
                    value: 2,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: 'amp',
                    disp_mrna: undefined,
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'two amps beats one homdel'
            );
        });
        it('fills a datum w multiple mrna data w correct priority', () => {
            let data = [
                {
                    alterationSubType: 'high',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                } as AnnotatedExtendedAlteration,
                {
                    alterationSubType: 'low',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                } as AnnotatedExtendedAlteration,
                {
                    alterationSubType: 'low',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: 'low',
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'two downs beats one high'
            );

            data = [
                {
                    alterationSubType: 'high',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                } as AnnotatedExtendedAlteration,
                {
                    alterationSubType: 'high',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                } as AnnotatedExtendedAlteration,
                {
                    alterationSubType: 'low',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: 'high',
                    disp_prot: undefined,
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'two ups beats one low'
            );
        });
        it('fills a datum w multiple protein data w correct priority', () => {
            let data = [
                {
                    alterationSubType: 'high',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.PROTEIN_LEVEL,
                } as AnnotatedExtendedAlteration,
                {
                    alterationSubType: 'low',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.PROTEIN_LEVEL,
                } as AnnotatedExtendedAlteration,
                {
                    alterationSubType: 'low',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.PROTEIN_LEVEL,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: 'low',
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'two downs beats one high'
            );

            data = [
                {
                    alterationSubType: 'high',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.PROTEIN_LEVEL,
                } as AnnotatedExtendedAlteration,
                {
                    alterationSubType: 'high',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.PROTEIN_LEVEL,
                } as AnnotatedExtendedAlteration,
                {
                    alterationSubType: 'low',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.PROTEIN_LEVEL,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: undefined,
                    disp_mrna: undefined,
                    disp_prot: 'high',
                    disp_mut: undefined,
                    disp_germ: undefined,
                    disp_structuralVariant: undefined,
                },
                'two ups beats one low'
            );
        });
        it('fills a datum w several data of different types correctly', () => {
            let data = [
                {
                    alterationSubType: 'high',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.PROTEIN_LEVEL,
                } as AnnotatedExtendedAlteration,
                {
                    alterationSubType: 'low',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.PROTEIN_LEVEL,
                } as AnnotatedExtendedAlteration,
                {
                    alterationSubType: 'low',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.PROTEIN_LEVEL,
                } as AnnotatedExtendedAlteration,
                {
                    alterationSubType: 'high',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                } as AnnotatedExtendedAlteration,
                {
                    alterationSubType: 'high',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                } as AnnotatedExtendedAlteration,
                {
                    alterationSubType: 'low',
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MRNA_EXPRESSION,
                } as AnnotatedExtendedAlteration,
                {
                    value: -2,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
                {
                    value: -2,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
                {
                    value: 2,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                } as AnnotatedExtendedAlteration,
                {
                    mutationType: 'missense',
                    putativeDriver: true,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
                {
                    mutationType: 'start_codon_del',
                    putativeDriver: true,
                    molecularProfileAlterationType:
                        AlterationTypeConstants.MUTATION_EXTENDED,
                } as AnnotatedExtendedAlteration,
            ];
            assert.deepEqual(
                fillGeneticTrackDatum(makeMinimalUnfilledDatum(), 'gene', data),
                {
                    ...makeMinimalUnfilledDatum(),
                    trackLabel: 'gene',
                    data: data,
                    disp_cna: 'homdel',
                    disp_mrna: 'high',
                    disp_prot: 'low',
                    disp_mut: 'trunc_rec',
                    disp_germ: false,
                    disp_structuralVariant: undefined,
                }
            );
        });
    });

    describe('fillHeatmapTrackDatum', () => {
        it('sets na true if no data', () => {
            assert.isTrue(
                fillHeatmapTrackDatum<
                    IGeneHeatmapTrackDatum,
                    'hugo_gene_symbol'
                >({}, 'hugo_gene_symbol', '', {} as Sample).na
            );
        });
        it('sets data for sample', () => {
            const data: any[] = [{ value: 3 }];
            assert.deepEqual(
                fillHeatmapTrackDatum<
                    IGeneHeatmapTrackDatum,
                    'hugo_gene_symbol'
                >(
                    {},
                    'hugo_gene_symbol',
                    'gene',
                    { sampleId: 'sample', studyId: 'study' } as Sample,
                    data
                ),
                {
                    hugo_gene_symbol: 'gene',
                    study_id: 'study',
                    na: false,
                    profile_data: 3,
                }
            );
        });
        it('removes data points with NaN value', () => {
            const data: any[] = [{ value: 3 }, { value: NaN }];
            assert.deepEqual(
                fillHeatmapTrackDatum<
                    IGeneHeatmapTrackDatum,
                    'hugo_gene_symbol'
                >(
                    {},
                    'hugo_gene_symbol',
                    'gene',
                    { sampleId: 'sample', studyId: 'study' } as Sample,
                    data
                ),
                {
                    hugo_gene_symbol: 'gene',
                    study_id: 'study',
                    na: false,
                    profile_data: 3,
                }
            );
        });
        it('throws exception if more than one data given for sample', () => {
            const data: any[] = [{ value: 3 }, { value: 2 }];
            try {
                fillHeatmapTrackDatum<
                    IGeneHeatmapTrackDatum,
                    'hugo_gene_symbol'
                >(
                    {},
                    'hugo_gene_symbol',
                    'gene',
                    { sampleId: 'sample', studyId: 'study' } as Sample,
                    data
                );
                assert(false);
            } catch (e) {
                // Succeed if an exception occurred before asserting false
            }
        });
        it('sets data for patient, if multiple then maximum in abs value', () => {
            let data: any[] = [{ value: 3 }, { value: 2 }];
            assert.deepEqual(
                fillHeatmapTrackDatum<
                    IGeneHeatmapTrackDatum,
                    'hugo_gene_symbol'
                >(
                    {},
                    'hugo_gene_symbol',
                    'gene',
                    { patientId: 'patient', studyId: 'study' } as Sample,
                    data
                ),
                {
                    hugo_gene_symbol: 'gene',
                    study_id: 'study',
                    na: false,
                    profile_data: 3,
                }
            );

            data = [{ value: 2 }];
            assert.deepEqual(
                fillHeatmapTrackDatum<
                    IGeneHeatmapTrackDatum,
                    'hugo_gene_symbol'
                >(
                    {},
                    'hugo_gene_symbol',
                    'gene',
                    { patientId: 'patient', studyId: 'study' } as Sample,
                    data
                ),
                {
                    hugo_gene_symbol: 'gene',
                    study_id: 'study',
                    na: false,
                    profile_data: 2,
                }
            );

            data = [{ value: 2 }, { value: 3 }, { value: 4 }];
            assert.deepEqual(
                fillHeatmapTrackDatum<
                    IGeneHeatmapTrackDatum,
                    'hugo_gene_symbol'
                >(
                    {},
                    'hugo_gene_symbol',
                    'gene',
                    { patientId: 'patient', studyId: 'study' } as Sample,
                    data
                ),
                {
                    hugo_gene_symbol: 'gene',
                    study_id: 'study',
                    na: false,
                    profile_data: 4,
                }
            );

            data = [{ value: -10 }, { value: 3 }, { value: 4 }];
            assert.deepEqual(
                fillHeatmapTrackDatum<
                    IGeneHeatmapTrackDatum,
                    'hugo_gene_symbol'
                >(
                    {},
                    'hugo_gene_symbol',
                    'gene',
                    { patientId: 'patient', studyId: 'study' } as Sample,
                    data
                ),
                {
                    hugo_gene_symbol: 'gene',
                    study_id: 'study',
                    na: false,
                    profile_data: -10,
                }
            );
        });
        it("fills data for a gene set if that's requested", () => {
            const partialTrackDatum = {};
            fillHeatmapTrackDatum<IGenesetHeatmapTrackDatum, 'geneset_id'>(
                partialTrackDatum,
                'geneset_id',
                'MY_FAVORITE_GENE_SET-3',
                { sampleId: 'sample', studyId: 'study' } as Sample,
                [
                    {
                        value: 7,
                        uniquePatientKey: 'patient_key',
                        uniqueSampleKey: 'sample_key',
                    },
                ]
            );
            assert.deepEqual(partialTrackDatum, {
                geneset_id: 'MY_FAVORITE_GENE_SET-3',
                study_id: 'study',
                na: false,
                profile_data: 7,
            });
        });

        it('adds thresholdType and category to trackDatum', () => {
            let data: HeatmapCaseDatum[] = [
                {
                    value: 8,
                    thresholdType: '>' as '>',
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key',
                },
            ];
            const partialTrackDatum = {};
            fillHeatmapTrackDatum<IGenericAssayHeatmapTrackDatum, 'entityId'>(
                partialTrackDatum,
                'entityId',
                'GENERIC_ASSAY_ID_1',
                { patientId: 'patient', studyId: 'study' } as Sample,
                data
            );
            assert.deepEqual(partialTrackDatum, {
                entityId: 'GENERIC_ASSAY_ID_1',
                study_id: 'study',
                na: false,
                profile_data: 8,
                thresholdType: '>',
                category: '>8.00',
            });
        });

        it('returns smallest value with ASC sort order', () => {
            let data: HeatmapCaseDatum[] = [
                {
                    value: 1,
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key_1',
                },
                {
                    value: 2,
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key_2',
                },
                {
                    value: 3,
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key_3',
                },
            ];
            const partialTrackDatum = {};
            fillHeatmapTrackDatum<IGenericAssayHeatmapTrackDatum, 'entityId'>(
                partialTrackDatum,
                'entityId',
                'GENERIC_ASSAY_ID_1',
                { patientId: 'patient', studyId: 'study' } as Sample,
                data,
                'ASC'
            );
            assert.deepEqual(partialTrackDatum, {
                entityId: 'GENERIC_ASSAY_ID_1',
                study_id: 'study',
                na: false,
                profile_data: 1,
            });
        });

        it('returns largest value with DESC sort order', () => {
            let data: HeatmapCaseDatum[] = [
                {
                    value: 1,
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key_1',
                },
                {
                    value: 2,
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key_2',
                },
                {
                    value: 3,
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key_3',
                },
            ];
            const partialTrackDatum = {};
            fillHeatmapTrackDatum<IGenericAssayHeatmapTrackDatum, 'entityId'>(
                partialTrackDatum,
                'entityId',
                'GENERIC_ASSAY_ID_1',
                { patientId: 'patient', studyId: 'study' } as Sample,
                data,
                'DESC'
            );
            assert.deepEqual(partialTrackDatum, {
                entityId: 'GENERIC_ASSAY_ID_1',
                study_id: 'study',
                na: false,
                profile_data: 3,
            });
        });

        it('selects non-threshold over threshold data point when values are equal', () => {
            let data: HeatmapCaseDatum[] = [
                {
                    value: 1,
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key_1',
                },
                {
                    value: 2,
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key_2',
                },
                {
                    value: 3,
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key_3',
                },
            ];
            const partialTrackDatum = {};
            fillHeatmapTrackDatum<IGenericAssayHeatmapTrackDatum, 'entityId'>(
                partialTrackDatum,
                'entityId',
                'GENERIC_ASSAY_ID_1',
                { patientId: 'patient', studyId: 'study' } as Sample,
                data
            );
            assert.deepEqual(partialTrackDatum, {
                entityId: 'GENERIC_ASSAY_ID_1',
                study_id: 'study',
                na: false,
                profile_data: 3,
            });
        });

        it('handles all NaN-value data points', () => {
            let data: HeatmapCaseDatum[] = [
                {
                    value: NaN,
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key_1',
                },
                {
                    value: NaN,
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key_2',
                },
            ];
            const partialTrackDatum = {} as IGenericAssayHeatmapTrackDatum;
            fillHeatmapTrackDatum<IGenericAssayHeatmapTrackDatum, 'entityId'>(
                partialTrackDatum,
                'entityId',
                'GENERIC_ASSAY_ID_1',
                { patientId: 'patient', studyId: 'study' } as Sample,
                data,
                'DESC'
            );
            assert.isTrue(partialTrackDatum.na);
        });

        it('Prefers largest non-threshold absolute value when no sort order provided', () => {
            let data: HeatmapCaseDatum[] = [
                {
                    value: -10,
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key_1',
                },
                {
                    value: 10,
                    thresholdType: '>' as '>',
                    uniquePatientKey: 'patient_key',
                    uniqueSampleKey: 'sample_key_2',
                },
            ];
            const partialTrackDatum = {};
            fillHeatmapTrackDatum<IGenericAssayHeatmapTrackDatum, 'entityId'>(
                partialTrackDatum,
                'entityId',
                'GENERIC_ASSAY_ID_1',
                { patientId: 'patient', studyId: 'study' } as Sample,
                data
            );
            assert.deepEqual(partialTrackDatum, {
                entityId: 'GENERIC_ASSAY_ID_1',
                study_id: 'study',
                na: false,
                profile_data: -10,
            });
        });
    });

    describe('fillClinicalTrackDatum', () => {
        it('creates datum correctly when no data given', () => {
            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {
                        clinicalAttributeId: 'clinicalAttribute',
                    } as ClinicalAttribute,
                    { sampleId: 'sample', studyId: 'study' } as Sample
                ),
                {
                    attr_id: 'clinicalAttribute',
                    study_id: 'study',
                    attr_val_counts: {},
                    na: true,
                },
                'NA in general'
            );
        });
        it('creates data correctly for number data', () => {
            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {
                        clinicalAttributeId: 'clinicalAttribute',
                        datatype: 'number',
                    } as any,
                    { sampleId: 'sample', studyId: 'study' } as Sample,
                    [{ value: 3 }] as any[]
                ),
                {
                    attr_id: 'clinicalAttribute',
                    study_id: 'study',
                    attr_val_counts: { 3: 1 },
                    attr_val: 3,
                },
                'one input data'
            );

            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {
                        clinicalAttributeId: 'clinicalAttribute',
                        datatype: 'number',
                    } as any,
                    { sampleId: 'sample', studyId: 'study' } as Sample,
                    [{ value: 'abc' }] as any[]
                ),
                {
                    attr_id: 'clinicalAttribute',
                    study_id: 'study',
                    attr_val_counts: {},
                    na: true,
                },
                'doesnt accept string data in number clinical attribute'
            );

            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {
                        clinicalAttributeId: 'clinicalAttribute',
                        datatype: 'number',
                    } as any,
                    { sampleId: 'sample', studyId: 'study' } as Sample,
                    [{ value: 3 }, { value: 2 }] as any[]
                ),
                {
                    attr_id: 'clinicalAttribute',
                    study_id: 'study',
                    attr_val_counts: { 2.5: 1 },
                    attr_val: 2.5,
                },
                'averages multiple values'
            );

            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {
                        clinicalAttributeId: 'MUTATION_COUNT',
                        datatype: 'number',
                    } as any,
                    { sampleId: 'sample', studyId: 'study' } as Sample,
                    [{ value: 3 }, { value: 2 }] as any[]
                ),
                {
                    attr_id: 'MUTATION_COUNT',
                    study_id: 'study',
                    attr_val_counts: { 3: 1 },
                    attr_val: 3,
                },
                'takes max of multiple values for MUTATION_COUNT'
            );
        });
        it('creates data correctly for string data', () => {
            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {
                        clinicalAttributeId: 'clinicalAttribute',
                        datatype: 'string',
                    } as any,
                    { sampleId: 'sample', studyId: 'study' } as Sample,
                    [{ value: 'a' }, { value: 'a' }] as any[]
                ),
                {
                    attr_id: 'clinicalAttribute',
                    study_id: 'study',
                    attr_val_counts: { a: 2 },
                    attr_val: 'a',
                }
            );

            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {
                        clinicalAttributeId: 'clinicalAttribute',
                        datatype: 'string',
                    } as any,
                    { sampleId: 'sample', studyId: 'study' } as Sample,
                    [{ value: 'a' }, { value: 'b' }] as any[]
                ),
                {
                    attr_id: 'clinicalAttribute',
                    study_id: 'study',
                    attr_val_counts: { a: 1, b: 1 },
                    attr_val: 'Mixed',
                }
            );

            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {
                        clinicalAttributeId: 'clinicalAttribute',
                        datatype: 'string',
                    } as any,
                    { sampleId: 'sample', studyId: 'study' } as Sample,
                    [{ value: 'a' }, { value: 'b' }, { value: 'b' }] as any[]
                ),
                {
                    attr_id: 'clinicalAttribute',
                    study_id: 'study',
                    attr_val_counts: { a: 1, b: 2 },
                    attr_val: 'Mixed',
                }
            );
        });
        it('creates data correctly for mutation spectrum data', () => {
            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {
                        clinicalAttributeId: SpecialAttribute.MutationSpectrum,
                    } as any,
                    { sampleId: 'sample', studyId: 'study' } as Sample,
                    [] as MutationSpectrum[]
                ),
                {
                    attr_id: SpecialAttribute.MutationSpectrum,
                    study_id: 'study',
                    attr_val_counts: {},
                    na: true,
                },
                'NA if no data given'
            );
            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {
                        clinicalAttributeId: SpecialAttribute.MutationSpectrum,
                        datatype: '',
                    } as any,
                    { sampleId: 'sample', studyId: 'study' } as Sample,
                    [
                        {
                            CtoA: 0,
                            CtoG: 0,
                            CtoT: 0,
                            TtoA: 0,
                            TtoC: 0,
                            TtoG: 0,
                        },
                    ] as MutationSpectrum[]
                ),
                {
                    attr_id: SpecialAttribute.MutationSpectrum,
                    study_id: 'study',
                    attr_val_counts: {
                        'C>A': 0,
                        'C>G': 0,
                        'C>T': 0,
                        'T>A': 0,
                        'T>C': 0,
                        'T>G': 0,
                    },
                    attr_val: {
                        'C>A': 0,
                        'C>G': 0,
                        'C>T': 0,
                        'T>A': 0,
                        'T>C': 0,
                        'T>G': 0,
                    },
                    na: true,
                },
                'NA if no mutations'
            );
            assert.deepEqual(
                fillClinicalTrackDatum(
                    {},
                    {
                        clinicalAttributeId: SpecialAttribute.MutationSpectrum,
                        datatype: '',
                    } as any,
                    { sampleId: 'sample', studyId: 'study' } as Sample,
                    [
                        {
                            CtoA: 1,
                            CtoG: 0,
                            CtoT: 0,
                            TtoA: 0,
                            TtoC: 0,
                            TtoG: 0,
                        },
                        {
                            CtoA: 0,
                            CtoG: 2,
                            CtoT: 0,
                            TtoA: 0,
                            TtoC: 0,
                            TtoG: 0,
                        },
                        {
                            CtoA: 0,
                            CtoG: 0,
                            CtoT: 3,
                            TtoA: 0,
                            TtoC: 0,
                            TtoG: 0,
                        },
                        {
                            CtoA: 0,
                            CtoG: 0,
                            CtoT: 0,
                            TtoA: 0,
                            TtoC: 6,
                            TtoG: 4,
                        },
                    ] as MutationSpectrum[]
                ),
                {
                    attr_id: SpecialAttribute.MutationSpectrum,
                    study_id: 'study',
                    attr_val_counts: {
                        'C>A': 1,
                        'C>G': 2,
                        'C>T': 3,
                        'T>A': 0,
                        'T>C': 6,
                        'T>G': 4,
                    },
                    attr_val: {
                        'C>A': 1,
                        'C>G': 2,
                        'C>T': 3,
                        'T>A': 0,
                        'T>C': 6,
                        'T>G': 4,
                    },
                },
                'sum'
            );
        });
    });
});
