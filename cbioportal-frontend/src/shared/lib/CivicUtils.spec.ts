import { assert } from 'chai';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { getCivicEntry } from 'cbioportal-utils';

import { Mutation } from 'cbioportal-ts-api-client';
import { fetchCivicGenes, fetchCivicVariants } from './CivicUtils';
import {
    getCivicGenes,
    getExpectedCivicEntry,
    getMutationCivicVariants,
    getMutationData,
} from '../../test/CivicMockUtils';

describe('CivicUtils', () => {
    const emptyMutationData: MobxPromise<Mutation[]> = {
        result: [],
        status: 'complete' as 'complete',
        peekStatus: 'complete',
        isPending: false,
        isError: false,
        isComplete: true,
        error: undefined,
    };

    const emptyUncalledMutationData: MobxPromise<Mutation[]> = {
        result: [],
        status: 'complete' as 'complete',
        peekStatus: 'complete',
        isPending: false,
        isError: false,
        isComplete: true,
        error: undefined,
    };

    describe('fetchCivicData', () => {
        it("won't fetch civic genes if there are no mutations", done => {
            fetchCivicGenes(emptyMutationData, emptyUncalledMutationData).then(
                (data: any) => {
                    assert.deepEqual(data, {});
                    done();
                }
            );
        });

        it("won't fetch civic variants if there are no mutations", done => {
            fetchCivicVariants(
                {},
                emptyMutationData,
                emptyUncalledMutationData
            ).then((data: any) => {
                assert.deepEqual(data, {});
                done();
            });
        });
        it("won't fetch civic variants if there are no civic genes", done => {
            fetchCivicVariants({}).then((data: any) => {
                assert.deepEqual(data, {});
                done();
            });
        });
    });

    describe('getCivicEntry', () => {
        it('properly creates a civic entry', () => {
            let civicGenes = getCivicGenes();

            let civicVariants = getMutationCivicVariants();

            let mutation = getMutationData();

            let expectedCivicEntry = getExpectedCivicEntry();

            assert.deepEqual(
                getCivicEntry(mutation, civicGenes, civicVariants),
                expectedCivicEntry,
                'Equal Civic Entry'
            );
        });
    });
});
