import { assert } from 'chai';
import { getAlterationSummary, getGeneSummary } from './QuerySummaryUtils';
import * as React from 'react';
import expect from 'expect';
import expectJSX from 'expect-jsx';
expect.extend(expectJSX);

describe('QuerySummaryUtils', () => {
    describe('getGeneSummary', () => {
        it('gives correct summary for various numbers of genes', () => {
            assert.equal(getGeneSummary([]), '');
            assert.equal(getGeneSummary(['BRCA1']), 'BRCA1');
            assert.equal(getGeneSummary(['BRCA1', 'BRCA2']), 'BRCA1 & BRCA2');
            assert.equal(getGeneSummary(['A', 'B', 'C']), 'A, B & C');
            assert.equal(
                getGeneSummary(['A', 'B', 'C', 'D']),
                'A, B & 2 other genes'
            );
            assert.equal(
                getGeneSummary(['A', 'B', 'C', 'D', 'E']),
                'A, B & 3 other genes'
            );
            assert.equal(
                getGeneSummary(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']),
                'A, B & 6 other genes'
            );
        });
    });
    describe('getAlterationSummary', () => {
        it('gives correct summary for various inputs', () => {
            expect(getAlterationSummary(10, 10, 10, 10, 5)).toEqualJSX(
                <strong>
                    <span>
                        Queried genes are altered in 10 (100%) of queried
                        patients/samples
                    </span>
                </strong>,
                'all altered, same number samples and patients'
            );

            const notAllAlteredDifferentSamplesAndPatients = getAlterationSummary(
                10,
                8,
                7,
                4,
                1
            );
            expect(notAllAlteredDifferentSamplesAndPatients).toIncludeJSX(
                'Queried gene is altered in ',
                'not all altered, different number samples and patients 1'
            );
            expect(notAllAlteredDifferentSamplesAndPatients).toIncludeJSX(
                '4 (50%) of queried patients',
                'not all altered, different number samples and patients 2'
            );
            expect(notAllAlteredDifferentSamplesAndPatients).toIncludeJSX(
                '7 (70%) of queried samples',
                'not all altered, different number samples and patients 3'
            );

            expect(getAlterationSummary(8, 8, 0, 0, 1)).toEqualJSX(
                <strong>
                    <span>
                        Queried gene is altered in 0 (0%) of queried
                        patients/samples
                    </span>
                </strong>,
                'none altered, same number samples and patients'
            );
        });
    });
});
