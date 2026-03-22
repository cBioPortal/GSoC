import GenesetCorrelatedGeneCache from './GenesetCorrelatedGeneCache';
import client from 'shared/api/cbioportalInternalClientInstance';
import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';

describe('GenesetCorrelatedGeneCache', () => {
    beforeEach(() => {
        sinon.stub(client, 'fetchCorrelatedGenesUsingPOST');
    });
    afterEach(() => {
        (client.fetchCorrelatedGenesUsingPOST as sinon.SinonStub).restore();
    });

    it('provides as many genes as requested if more available', () => {
        // given an API client with 4 available genes and a cache with a started iteration
        (client.fetchCorrelatedGenesUsingPOST as sinon.SinonStub).returns(
            Promise.resolve([
                {
                    entrezGeneId: 0,
                    hugoGeneSymbol: 'string0',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 1,
                    hugoGeneSymbol: 'string1',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 2,
                    hugoGeneSymbol: 'string2',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 3,
                    hugoGeneSymbol: 'string2',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
            ])
        );
        const cache = new GenesetCorrelatedGeneCache({
            profile1: { sampleIds: ['sample1', 'sample2'] },
        });
        cache.initIteration('track1_expansions', {
            genesetId: 'geneset1',
            molecularProfileId: 'profile1',
        });
        // when next is called to request 2 genes in the iteration
        const geneListPromise = cache.next('track1_expansions', 2);
        // then it should resolve with 2 genes
        return geneListPromise.then(genes => {
            assert.lengthOf(genes, 2);
        });
    });

    it('provides as many genes as available if more requested', () => {
        // given an API client with 4 available genes and a cache with a started iteration
        (client.fetchCorrelatedGenesUsingPOST as sinon.SinonStub).returns(
            Promise.resolve([
                {
                    entrezGeneId: 0,
                    hugoGeneSymbol: 'string0',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 1,
                    hugoGeneSymbol: 'string1',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 2,
                    hugoGeneSymbol: 'string2',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 3,
                    hugoGeneSymbol: 'string2',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
            ])
        );
        const cache = new GenesetCorrelatedGeneCache({
            profile1: { sampleIds: ['sample1', 'sample2'] },
        });
        cache.initIteration('track1_expansions', {
            genesetId: 'geneset1',
            molecularProfileId: 'profile1',
        });
        // when next is called to request 5 genes in the iteration
        const geneListPromise = cache.next('track1_expansions', 5);
        // then it should resolve with 4 genes
        return geneListPromise.then(genes => {
            assert.lengthOf(genes, 4);
        });
    });

    it('provides an empty array if nothing available', () => {
        // given an API client with 0 available genes and a cache with a started iteration
        (client.fetchCorrelatedGenesUsingPOST as sinon.SinonStub).returns(
            Promise.resolve([])
        );
        const cache = new GenesetCorrelatedGeneCache({
            profile1: { sampleIds: ['sample1', 'sample2'] },
        });
        cache.initIteration('track1_expansions', {
            genesetId: 'geneset1',
            molecularProfileId: 'profile1',
        });
        // when next is called to request 4 genes in the iteration
        const geneListPromise = cache.next('track1_expansions', 4);
        // then it should resolve with two genes
        return geneListPromise.then(genes => {
            assert.instanceOf(genes, Array);
            assert.lengthOf(genes, 0);
        });
    });

    it('provides the next n genes if called a second time', () => {
        // given an API client with 4 available genes and a cache with a started
        // iteration
        (client.fetchCorrelatedGenesUsingPOST as sinon.SinonStub).returns(
            Promise.resolve([
                {
                    entrezGeneId: 0,
                    hugoGeneSymbol: 'string0',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 1,
                    hugoGeneSymbol: 'string1',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 2,
                    hugoGeneSymbol: 'string2',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 3,
                    hugoGeneSymbol: 'string2',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
            ])
        );
        const cache = new GenesetCorrelatedGeneCache({
            profile1: { sampleIds: ['sample1', 'sample2'] },
        });
        cache.initIteration('track1_expansions', {
            genesetId: 'geneset1',
            molecularProfileId: 'profile1',
        });
        // when next is called to request 2 genes in the iteration twice
        const geneListPromise1 = cache.next('track1_expansions', 2);
        const geneListPromise2 = cache.next('track1_expansions', 2);
        // then the two promises should resolve with arrays starting at gene 0
        // and 2 respectively
        return Promise.all([
            geneListPromise1.then(genes => {
                assert.equal(genes[0].entrezGeneId, 0);
            }),
            geneListPromise2.then(genes => {
                assert.equal(genes[0].entrezGeneId, 2);
            }),
        ]);
    });

    it('provides the first n genes again after reset is called', () => {
        // given an API client with 4 available genes and a cache with a started
        // iteration
        (client.fetchCorrelatedGenesUsingPOST as sinon.SinonStub).returns(
            Promise.resolve([
                {
                    entrezGeneId: 0,
                    hugoGeneSymbol: 'string0',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 1,
                    hugoGeneSymbol: 'string1',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 2,
                    hugoGeneSymbol: 'string2',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 3,
                    hugoGeneSymbol: 'string2',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
            ])
        );
        const cache = new GenesetCorrelatedGeneCache({
            profile1: { sampleIds: ['sample1', 'sample2'] },
        });
        cache.initIteration('track1_expansions', {
            genesetId: 'geneset1',
            molecularProfileId: 'profile1',
        });
        // when next is called to request 2 genes in the iteration twice with a
        // call to reset for the iteration in between
        const geneListPromise1 = cache.next('track1_expansions', 2);
        cache.reset('track1_expansions');
        const geneListPromise2 = cache.next('track1_expansions', 2);
        // then the both promises should resolve with arrays starting at gene 0
        return Promise.all([
            geneListPromise1.then(genes => {
                assert.equal(genes[0].entrezGeneId, 0);
            }),
            geneListPromise2.then(genes => {
                assert.equal(genes[0].entrezGeneId, 0);
            }),
        ]);
    });

    it('leaves pre-existing iterations untouched when requesting', () => {
        // given an API client with 4 available genes and a cache with 2 started
        // iterations
        (client.fetchCorrelatedGenesUsingPOST as sinon.SinonStub).returns(
            Promise.resolve([
                {
                    entrezGeneId: 0,
                    hugoGeneSymbol: 'string0',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 1,
                    hugoGeneSymbol: 'string1',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 2,
                    hugoGeneSymbol: 'string2',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 3,
                    hugoGeneSymbol: 'string2',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
            ])
        );
        const cache = new GenesetCorrelatedGeneCache({
            profile1: { sampleIds: ['sample1', 'sample2'] },
        });
        cache.initIteration('track1_expansions', {
            genesetId: 'geneset1',
            molecularProfileId: 'profile1',
        });
        cache.initIteration('track2_expansions', {
            genesetId: 'geneset2',
            molecularProfileId: 'profile1',
        });
        // when next is called to request 2 genes in the first iteration twice with a
        // call for the second iteration in between
        const geneListPromise1 = cache.next('track1_expansions', 2);
        cache.next('track2_expansions', 2);
        const geneListPromise2 = cache.next('track1_expansions', 2);
        // then the promises for the first iteration should resolve with arrays
        // starting at gene 0 and 2 respectively
        return Promise.all([
            geneListPromise1.then(genes => {
                assert.equal(genes[0].entrezGeneId, 0);
            }),
            geneListPromise2.then(genes => {
                assert.equal(genes[0].entrezGeneId, 2);
            }),
        ]);
    });

    it('leaves pre-existing iterations untouched when resetting', () => {
        // given an API client with 4 available genes and a cache with 2 started
        // iterations
        (client.fetchCorrelatedGenesUsingPOST as sinon.SinonStub).returns(
            Promise.resolve([
                {
                    entrezGeneId: 0,
                    hugoGeneSymbol: 'string0',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 1,
                    hugoGeneSymbol: 'string1',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 2,
                    hugoGeneSymbol: 'string2',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
                {
                    entrezGeneId: 3,
                    hugoGeneSymbol: 'string2',
                    correlationValue: 0,
                    expressionGeneticProfileId: 'string',
                    zScoreGeneticProfileId: 'string',
                },
            ])
        );
        const cache = new GenesetCorrelatedGeneCache({
            profile1: { sampleIds: ['sample1', 'sample2'] },
        });
        cache.initIteration('track1_expansions', {
            genesetId: 'geneset1',
            molecularProfileId: 'profile1',
        });
        cache.initIteration('track2_expansions', {
            genesetId: 'geneset2',
            molecularProfileId: 'profile1',
        });
        // when next is called to request 2 genes in the first iteration twice with a
        // call to reset for the second iteration in between
        const geneListPromise1 = cache.next('track1_expansions', 2);
        cache.reset('track2_expansions');
        const geneListPromise2 = cache.next('track1_expansions', 2);
        // then the promises for the first iteration should resolve with arrays
        // starting at gene 0 and 2 respectively
        return Promise.all([
            geneListPromise1.then(genes => {
                assert.equal(genes[0].entrezGeneId, 0);
            }),
            geneListPromise2.then(genes => {
                assert.equal(genes[0].entrezGeneId, 2);
            }),
        ]);
    });
});
