import { assert } from 'chai';
import * as React from 'react';
import {
    STRUCTVARAnyGeneStr,
    STRUCTVARNullGeneStr,
    STUCTVARDownstreamFusionStr,
    STUCTVARUpstreamFusionStr,
} from 'shared/lib/oql/oqlfilter';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import {
    oqlQueryToStructVarGenePair,
    StructuralVariantFilterQueryFromOql,
    StructVarGenePair,
} from 'pages/studyView/StructVarUtils';

describe('StructVarUtils', () => {
    describe('StructuralVariantFilterQueryFromOql', () => {
        it('throws when input does not contain "::"', () => {
            assert.throws(() => StructuralVariantFilterQueryFromOql('BRCA1'));
        });

        it('throws when both gene parts are empty', () => {
            assert.throws(() => StructuralVariantFilterQueryFromOql('::'));
        });

        it('returns all defaults when no optional params provided', () => {
            const result = StructuralVariantFilterQueryFromOql('ALK::EML4');
            assert.isTrue(result.includeDriver);
            assert.isTrue(result.includeVUS);
            assert.isTrue(result.includeUnknownOncogenicity);
            assert.isTrue(result.includeUnknownTier);
            assert.isTrue(result.includeGermline);
            assert.isTrue(result.includeSomatic);
            assert.isTrue(result.includeUnknownStatus);
            assert.deepEqual(result.tiersBooleanMap, {});
        });

        it('parses gene1 and gene2 into query objects', () => {
            const result = StructuralVariantFilterQueryFromOql('ALK::EML4');
            assert.deepEqual(result.gene1Query, { hugoSymbol: 'ALK' } as any);
            assert.deepEqual(result.gene2Query, { hugoSymbol: 'EML4' } as any);
        });

        it('explicit false overrides default true for boolean fields', () => {
            const result = StructuralVariantFilterQueryFromOql(
                'ALK::EML4',
                false,
                false,
                false,
                undefined,
                false,
                false,
                false,
                false
            );
            assert.isFalse(result.includeDriver);
            assert.isFalse(result.includeVUS);
            assert.isFalse(result.includeUnknownOncogenicity);
            assert.isFalse(result.includeUnknownTier);
            assert.isFalse(result.includeGermline);
            assert.isFalse(result.includeSomatic);
            assert.isFalse(result.includeUnknownStatus);
        });

        it('explicit tiersBooleanMap overrides default empty map', () => {
            const tiers = { tier1: true, tier2: false };
            const result = StructuralVariantFilterQueryFromOql(
                'ALK::EML4',
                undefined,
                undefined,
                undefined,
                tiers
            );
            assert.deepEqual(result.tiersBooleanMap, tiers);
        });
    });

    describe('oqlQueryToStructVarGenePair', () => {
        it.each([
            [{ gene: 'A', alterations: [] }, []],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: undefined,
                            alteration_type: STUCTVARDownstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: 'B',
                            alteration_type: STUCTVARDownstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [{ gene1HugoSymbolOrOql: 'A', gene2HugoSymbolOrOql: 'B' }],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: STRUCTVARAnyGeneStr,
                            alteration_type: STUCTVARDownstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [
                    {
                        gene1HugoSymbolOrOql: 'A',
                        gene2HugoSymbolOrOql: STRUCTVARAnyGeneStr,
                    },
                ],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: STRUCTVARNullGeneStr,
                            alteration_type: STUCTVARDownstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [
                    {
                        gene1HugoSymbolOrOql: 'A',
                        gene2HugoSymbolOrOql: STRUCTVARNullGeneStr,
                    },
                ],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: 'B',
                            alteration_type: STUCTVARUpstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [{ gene1HugoSymbolOrOql: 'B', gene2HugoSymbolOrOql: 'A' }],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: STRUCTVARAnyGeneStr,
                            alteration_type: STUCTVARUpstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [
                    {
                        gene1HugoSymbolOrOql: STRUCTVARAnyGeneStr,
                        gene2HugoSymbolOrOql: 'A',
                    },
                ],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: STRUCTVARNullGeneStr,
                            alteration_type: STUCTVARUpstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [
                    {
                        gene1HugoSymbolOrOql: STRUCTVARNullGeneStr,
                        gene2HugoSymbolOrOql: 'A',
                    },
                ],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            gene: 'B',
                            alteration_type: STUCTVARDownstreamFusionStr,
                            modifiers: [],
                        },
                        {
                            gene: 'C',
                            alteration_type: STUCTVARDownstreamFusionStr,
                            modifiers: [],
                        },
                    ],
                },
                [
                    { gene1HugoSymbolOrOql: 'A', gene2HugoSymbolOrOql: 'B' },
                    { gene1HugoSymbolOrOql: 'A', gene2HugoSymbolOrOql: 'C' },
                ],
            ],
        ])(
            'converts %p into %p',
            (singleGeneQuery, expected: StructVarGenePair[]) => {
                assert.deepEqual(
                    oqlQueryToStructVarGenePair(
                        singleGeneQuery as SingleGeneQuery
                    ),
                    expected
                );
            }
        );
    });
});
