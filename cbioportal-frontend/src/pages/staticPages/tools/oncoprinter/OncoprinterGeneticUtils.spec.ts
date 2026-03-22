import { assert } from 'chai';
import { parseGeneticInput } from './OncoprinterGeneticUtils';

describe('OncoprinterGeneticUtils', () => {
    describe('parseGeneticInput', () => {
        it('skips header line', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sample gene alteration type\nsample_id TP53 FUSION FUSION\n'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sample_id',
                            hugoGeneSymbol: 'TP53',
                            alteration: 'structuralVariant',
                            eventInfo: 'FUSION',
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses fusion command correctly', () => {
            assert.deepEqual(
                parseGeneticInput('sample_id TP53 FUSION FUSION'),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sample_id',
                            hugoGeneSymbol: 'TP53',
                            alteration: 'structuralVariant',
                            eventInfo: 'FUSION',
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('throws an error if fusion is not specified correctly', () => {
            try {
                const parsed = parseGeneticInput(
                    'sample_id TP53 FUSION apsoidjfpaos'
                );
                assert(false);
            } catch (e) {}
        });
        it('parses germline mutation correctly', () => {
            assert.deepEqual(
                parseGeneticInput('sampleid	BRCA1	Q1538A	MISSENSE_GERMLINE'),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'BRCA1',
                            alteration: 'missense',
                            proteinChange: 'Q1538A',
                            isGermline: true,
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses driver mutation correctly', () => {
            assert.deepEqual(
                parseGeneticInput('sampleid	BRCA1	Q1538A	TRUNC_DRIVER'),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'BRCA1',
                            alteration: 'trunc',
                            proteinChange: 'Q1538A',
                            isCustomDriver: true,
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses germline & driver mutation correctly', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sampleid	BRCA1	Q1538A	MISSENSE_GERMLINE_DRIVER'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'BRCA1',
                            alteration: 'missense',
                            proteinChange: 'Q1538A',
                            isGermline: true,
                            isCustomDriver: true,
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('throws an error for an invalid mutation modifier', () => {
            try {
                const parsed = parseGeneticInput(
                    'sample_id TP53 protienchange MISSENSE_JIDFPAOIJFP'
                );
                assert(false);
            } catch (e) {}
        });
        it('parses a line with a given track name correctly', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sampleid	BRCA1	Q1538A	MISSENSE_GERMLINE_DRIVER	testTrackName'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'BRCA1',
                            alteration: 'missense',
                            proteinChange: 'Q1538A',
                            isGermline: true,
                            isCustomDriver: true,
                            trackName: 'testTrackName',
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses fusion correctly', () => {
            assert.deepEqual(
                parseGeneticInput('sampleid	ACY1-BAP1	ACY1-BAP1_fusion	FUSION'),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'ACY1-BAP1',
                            alteration: 'structuralVariant',
                            eventInfo: 'ACY1-BAP1_fusion',
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses driver fusion correctly', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sampleid	ACY1-BAP1	ACY1-BAP1_fusion	FUSION_DRIVER'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'ACY1-BAP1',
                            alteration: 'structuralVariant',
                            eventInfo: 'ACY1-BAP1_fusion',
                            isCustomDriver: true,
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses germline fusion correctly', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sampleid	ACY1-BAP1	ACY1-BAP1_fusion	FUSION_GERMLINE'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'ACY1-BAP1',
                            alteration: 'structuralVariant',
                            eventInfo: 'ACY1-BAP1_fusion',
                            isGermline: true,
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
        it('parses germline & driver fusion correctly', () => {
            assert.deepEqual(
                parseGeneticInput(
                    'sampleid	ACY1-BAP1	ACY1-BAP1_fusion	FUSION_GERMLINE_DRIVER'
                ),
                {
                    parseSuccess: true,
                    result: [
                        {
                            sampleId: 'sampleid',
                            hugoGeneSymbol: 'ACY1-BAP1',
                            alteration: 'structuralVariant',
                            eventInfo: 'ACY1-BAP1_fusion',
                            isGermline: true,
                            isCustomDriver: true,
                            trackName: undefined,
                        },
                    ],
                    error: undefined,
                }
            );
        });
    });
});
