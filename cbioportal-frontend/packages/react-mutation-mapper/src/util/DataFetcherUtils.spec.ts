import { assert } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';

import { annotateMutations, Mutation } from 'cbioportal-utils';

import { fetchVariantAnnotationsIndexedByGenomicLocation } from './DataFetcherUtils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';

describe('DataFetcherUtils', () => {
    let mutationsWithNoGenomicLocation: Partial<Mutation>[];
    let mutationsWithGenomicLocation: Partial<Mutation>[];

    beforeAll(() => {
        mutationsWithNoGenomicLocation = [
            {
                gene: {
                    hugoGeneSymbol: 'AR',
                },
                proteinChange: 'L729I',
                mutationType: '',
                variantType: '',
            },
            {
                gene: {
                    hugoGeneSymbol: 'AR',
                },
                proteinChange: 'K222N',
                mutationType: '',
                variantType: '',
            },
            {
                gene: {
                    hugoGeneSymbol: 'BRCA1',
                },
                proteinChange: 'Q1395fs',
                mutationType: '',
                variantType: '',
            },
        ];

        mutationsWithGenomicLocation = [
            {
                chromosome: 'X',
                startPosition: 66937331,
                endPosition: 66937331,
                referenceAllele: 'T',
                variantAllele: 'A',
            },
            {
                chromosome: '17',
                startPosition: 41242962,
                endPosition: 41242963,
                referenceAllele: '-',
                variantAllele: 'GA',
            },
            {
                chromosome: '13',
                startPosition: 32912813,
                endPosition: 32912813,
                referenceAllele: 'G',
                variantAllele: 'T',
            },
            {
                chromosome: '12',
                startPosition: 133214671,
                endPosition: 133214671,
                referenceAllele: 'G',
                variantAllele: 'C',
            },
            {
                chromosome: '17',
                startPosition: 7577539,
                endPosition: 7577539,
                referenceAllele: 'G',
                variantAllele: 'A',
            },
            {
                chromosome: '10',
                startPosition: 89692905,
                endPosition: 89692905,
                referenceAllele: 'G',
                variantAllele: 'A',
            },
        ];
    });

    describe('fetchVariantAnnotationsIndexedByGenomicLocation', () => {
        it("won't fetch variant annotation data if there are no mutations", done => {
            const fetchStub = sinon.stub();
            fetchStub.returns(undefined);

            const genomeNexusClient: any = {
                fetchVariantAnnotationByGenomicLocationPOST: fetchStub,
            };

            fetchVariantAnnotationsIndexedByGenomicLocation(
                [],
                ['annotation_summary'],
                'mskcc',
                genomeNexusClient
            ).then(
                (indexedVariantAnnotations: {
                    [genomicLocation: string]: VariantAnnotation;
                }) => {
                    assert.isFalse(
                        fetchStub.called,
                        'variant annotation fetcher should NOT be called'
                    );

                    done();
                }
            );
        });

        it("won't fetch variant annotation data if there are no mutations with genomic coordinate information", done => {
            const fetchStub = sinon.stub();
            fetchStub.returns(undefined);

            const genomeNexusClient: any = {
                fetchVariantAnnotationByGenomicLocationPOST: fetchStub,
            };

            fetchVariantAnnotationsIndexedByGenomicLocation(
                _.cloneDeep(mutationsWithNoGenomicLocation),
                ['annotation_summary'],
                'mskcc',
                genomeNexusClient
            ).then(indexedVariantAnnotations => {
                assert.isFalse(
                    fetchStub.called,
                    'variant annotation fetcher should NOT be called'
                );

                done();
            });
        });

        it('fetches variant annotation data when the genomic coordinate information is present', done => {
            const fetchStub = sinon.stub();
            fetchStub.returns({});

            const genomeNexusClient: any = {
                fetchVariantAnnotationByGenomicLocationPOST: fetchStub,
            };

            fetchVariantAnnotationsIndexedByGenomicLocation(
                _.cloneDeep(mutationsWithGenomicLocation),
                ['annotation_summary'],
                'mskcc',
                genomeNexusClient
            ).then(indexedVariantAnnotations => {
                assert.isTrue(
                    fetchStub.called,
                    'variant annotation fetcher should be called'
                );

                done();
            });
        });
    });
});
