import { assert } from 'chai';
import { computePlotData } from './CoExpressionVizUtils';
import { GenePanelData, MolecularProfile } from 'cbioportal-ts-api-client';

describe('CoExpressionVizUtils', () => {
    describe('computePlotData', () => {
        it('no data', () => {
            assert.deepEqual(
                computePlotData([], [], 0, 0, '', '', {} as any, {} as any),
                [],
                'empty empty empty'
            );
            assert.deepEqual(
                computePlotData(
                    [],
                    [
                        {
                            proteinChange: 'G12D',
                            uniqueSampleKey: 'sample1',
                            entrezGeneId: 0,
                        },
                    ] as any,
                    0,
                    0,
                    '',
                    '',
                    {} as any,
                    {} as any
                ),
                [],
                'no molecular data -> no data, even w mutations'
            );
        });
        it('gene data with no mutations', () => {
            assert.deepEqual(
                computePlotData(
                    [
                        {
                            uniqueSampleKey: 'sample1',
                            sampleId: 'sample1',
                            studyId: 'study',
                            entrezGeneId: 0,
                            value: 1.5,
                        },
                        {
                            uniqueSampleKey: 'sample2',
                            sampleId: 'sample2',
                            studyId: 'study',
                            entrezGeneId: 0,
                            value: 5,
                        },
                        {
                            uniqueSampleKey: 'sample1',
                            sampleId: 'sample1',
                            studyId: 'study',
                            entrezGeneId: 1,
                            value: 2,
                        },
                        {
                            uniqueSampleKey: 'sample2',
                            sampleId: 'sample2',
                            studyId: 'study',
                            entrezGeneId: 1,
                            value: 12,
                        },
                        // the following data should not appear because only x-axis data for it
                        {
                            uniqueSampleKey: 'sample3',
                            sampleId: 'sample3',
                            studyId: 'study',
                            entrezGeneId: 0,
                            value: 5,
                        },
                        // the following data should not appear because one is NaN
                        {
                            uniqueSampleKey: 'sample4',
                            sampleId: 'sample4',
                            studyId: 'study',
                            entrezGeneId: 0,
                            value: NaN,
                        },
                        {
                            uniqueSampleKey: 'sample4',
                            sampleId: 'sample4',
                            studyId: 'study',
                            entrezGeneId: 1,
                            value: 4,
                        },
                    ] as any,
                    [],
                    0,
                    0,
                    'gene0',
                    'gene1',
                    { samples: {}, patients: {} },
                    {} as any
                ),
                [
                    {
                        x: 1.5,
                        y: 2,
                        mutationsX: '',
                        mutationsY: '',
                        studyId: 'study',
                        sampleId: 'sample1',
                        profiledX: false,
                        profiledY: false,
                    },
                    {
                        x: 5,
                        y: 12,
                        mutationsX: '',
                        mutationsY: '',
                        studyId: 'study',
                        sampleId: 'sample2',
                        profiledX: false,
                        profiledY: false,
                    },
                ]
            );
        });
        it('gene data with mutations', () => {
            const profiled = {
                byGene: {
                    gene0: [{ molecularProfileId: 'profile' } as GenePanelData],
                },
                allGenes: [],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            };
            assert.deepEqual(
                computePlotData(
                    [
                        {
                            uniqueSampleKey: 'sample1',
                            sampleId: 'sample1',
                            studyId: 'study',
                            entrezGeneId: 0,
                            value: 1.5,
                        },
                        {
                            uniqueSampleKey: 'sample2',
                            sampleId: 'sample2',
                            studyId: 'study',
                            entrezGeneId: 0,
                            value: 5,
                        },
                        {
                            uniqueSampleKey: 'sample1',
                            sampleId: 'sample1',
                            studyId: 'study',
                            entrezGeneId: 1,
                            value: 2,
                        },
                        {
                            uniqueSampleKey: 'sample2',
                            sampleId: 'sample2',
                            studyId: 'study',
                            entrezGeneId: 1,
                            value: 12,
                        },
                        {
                            uniqueSampleKey: 'sample3',
                            sampleId: 'sample3',
                            studyId: 'study',
                            entrezGeneId: 0,
                            value: -7,
                        },
                        {
                            uniqueSampleKey: 'sample3',
                            sampleId: 'sample3',
                            studyId: 'study',
                            entrezGeneId: 1,
                            value: -10,
                        },
                        // the following data should not appear because one is NaN
                        {
                            uniqueSampleKey: 'sample4',
                            sampleId: 'sample4',
                            studyId: 'study',
                            entrezGeneId: 0,
                            value: NaN,
                        },
                        {
                            uniqueSampleKey: 'sample4',
                            sampleId: 'sample4',
                            studyId: 'study',
                            entrezGeneId: 1,
                            value: 4,
                        },
                        // the following data should not appear because only x-axis data for it
                        {
                            uniqueSampleKey: 'sample5',
                            sampleId: 'sample5',
                            studyId: 'study',
                            entrezGeneId: 0,
                            value: 5,
                        },
                    ] as any,
                    [
                        {
                            uniqueSampleKey: 'sample1',
                            sampleId: 'sample1',
                            studyId: 'study',
                            entrezGeneId: 0,
                            proteinChange: 'hello',
                        },
                        {
                            uniqueSampleKey: 'sample1',
                            sampleId: 'sample1',
                            studyId: 'study',
                            entrezGeneId: 0,
                            proteinChange: 'hi',
                        },
                        {
                            uniqueSampleKey: 'sample1',
                            sampleId: 'sample1',
                            studyId: 'study',
                            entrezGeneId: 0,
                            proteinChange: '',
                        },
                        {
                            uniqueSampleKey: 'sample1',
                            sampleId: 'sample1',
                            studyId: 'study',
                            entrezGeneId: 1,
                            proteinChange: 'whatsup',
                        },
                        {
                            uniqueSampleKey: 'sample2',
                            sampleId: 'sample2',
                            studyId: 'study',
                            entrezGeneId: 0,
                            proteinChange: 'bye',
                        },
                    ] as any,
                    0,
                    0,
                    'gene0',
                    'gene1',
                    {
                        samples: { sample1: profiled, sample4: profiled },
                        patients: {},
                    },
                    {
                        study: {
                            molecularProfileId: 'profile',
                        } as MolecularProfile,
                    }
                ),
                [
                    {
                        x: 1.5,
                        y: 2,
                        mutationsX: 'hello, hi',
                        mutationsY: 'whatsup',
                        studyId: 'study',
                        sampleId: 'sample1',
                        profiledX: true,
                        profiledY: false,
                    },
                    {
                        x: 5,
                        y: 12,
                        mutationsX: 'bye',
                        mutationsY: '',
                        studyId: 'study',
                        sampleId: 'sample2',
                        profiledX: false,
                        profiledY: false,
                    },
                    {
                        x: -7,
                        y: -10,
                        mutationsX: '',
                        mutationsY: '',
                        studyId: 'study',
                        sampleId: 'sample3',
                        profiledX: false,
                        profiledY: false,
                    },
                ]
            );
        });
        it('gene set data', () => {
            assert.deepEqual(
                computePlotData(
                    [
                        {
                            uniqueSampleKey: 'sample1',
                            sampleId: 'sample1',
                            studyId: 'study',
                            genesetId: 'abc',
                            value: '2',
                        },
                        {
                            uniqueSampleKey: 'sample2',
                            sampleId: 'sample2',
                            studyId: 'study',
                            genesetId: 'abc',
                            value: '4',
                        },
                        {
                            uniqueSampleKey: 'sample1',
                            sampleId: 'sample1',
                            studyId: 'study',
                            genesetId: 'def',
                            value: '1.5',
                        },
                        {
                            uniqueSampleKey: 'sample2',
                            sampleId: 'sample2',
                            studyId: 'study',
                            genesetId: 'def',
                            value: '10',
                        },
                        // the following data should not appear because only x-axis data for it
                        {
                            uniqueSampleKey: 'sample3',
                            sampleId: 'sample3',
                            studyId: 'study',
                            genesetId: 'abc',
                            value: '2',
                        },
                        // the following data should not appear because one is NaN
                        {
                            uniqueSampleKey: 'sample4',
                            sampleId: 'sample4',
                            studyId: 'study',
                            genesetId: 'abc',
                            value: NaN,
                        },
                        {
                            uniqueSampleKey: 'sample4',
                            sampleId: 'sample4',
                            studyId: 'study',
                            genesetId: 'def',
                            value: '1.5',
                        },
                    ] as any,
                    [],
                    'abc',
                    'abc',
                    'def',
                    'def',
                    { samples: {}, patients: {} },
                    {} as any
                ),
                [
                    {
                        x: 2,
                        y: 1.5,
                        mutationsX: '',
                        mutationsY: '',
                        studyId: 'study',
                        sampleId: 'sample1',
                        profiledX: false,
                        profiledY: false,
                    },
                    {
                        x: 4,
                        y: 10,
                        mutationsX: '',
                        mutationsY: '',
                        studyId: 'study',
                        sampleId: 'sample2',
                        profiledX: false,
                        profiledY: false,
                    },
                ]
            );
        });
    });
});
