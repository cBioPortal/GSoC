import { assert } from 'chai';
import Sinon from 'sinon';
import {
    getFilteredCustomCaseSets,
    CustomCaseSets,
} from 'shared/components/query/CaseSetSelectorUtils';

describe('CaseSetSelectorUtils', () => {
    describe('filterCustomCaseSets', () => {
        it('returns only custom case set if profiledSamplesCount is empty', () => {
            assert.deepEqual(
                getFilteredCustomCaseSets(true, false, {} as any),
                [CustomCaseSets[4]]
            );
            assert.deepEqual(getFilteredCustomCaseSets(true, true, {} as any), [
                CustomCaseSets[4],
            ]);
            assert.deepEqual(
                getFilteredCustomCaseSets(false, false, {} as any),
                [CustomCaseSets[4]]
            );
            assert.deepEqual(
                getFilteredCustomCaseSets(false, true, {} as any),
                [CustomCaseSets[4]]
            );
        });

        it('returns all case set and custom case set if there is at least one virtual study selected', () => {
            assert.deepEqual(
                getFilteredCustomCaseSets(true, false, {
                    w_mut: 100,
                    w_cna: 100,
                    w_mut_cna: 100,
                    all: 100,
                })
                    .map(obj => obj.value)
                    .sort(),
                ['-1', 'all']
            );
            assert.deepEqual(
                getFilteredCustomCaseSets(true, true, {
                    w_mut: 100,
                    w_cna: 100,
                    w_mut_cna: 100,
                    all: 100,
                })
                    .map(obj => obj.value)
                    .sort(),
                ['-1', 'all']
            );
        });

        it('returns only custom case set if there is one physical study selected', () => {
            assert.deepEqual(
                getFilteredCustomCaseSets(false, false, {
                    w_mut: 100,
                    w_cna: 100,
                    w_mut_cna: 100,
                    all: 100,
                }),
                [CustomCaseSets[4]]
            );
        });

        it('returns correct filtered case sets depending on the samples when mutliple studies selected', () => {
            assert.deepEqual(
                getFilteredCustomCaseSets(false, true, {
                    w_mut: 50,
                    w_cna: 50,
                    w_mut_cna: 50,
                    all: 100,
                })
                    .map(obj => obj.value)
                    .sort(),
                ['-1', 'all', 'w_cna', 'w_mut', 'w_mut_cna']
            );
            assert.deepEqual(
                getFilteredCustomCaseSets(false, true, {
                    w_mut: 0,
                    w_cna: 50,
                    w_mut_cna: 50,
                    all: 100,
                })
                    .map(obj => obj.value)
                    .sort(),
                ['-1', 'all', 'w_cna', 'w_mut_cna']
            );
            assert.deepEqual(
                getFilteredCustomCaseSets(false, true, {
                    w_mut: 50,
                    w_cna: 0,
                    w_mut_cna: 50,
                    all: 100,
                })
                    .map(obj => obj.value)
                    .sort(),
                ['-1', 'all', 'w_mut', 'w_mut_cna']
            );
            assert.deepEqual(
                getFilteredCustomCaseSets(false, true, {
                    w_mut: 50,
                    w_cna: 50,
                    w_mut_cna: 0,
                    all: 100,
                })
                    .map(obj => obj.value)
                    .sort(),
                ['-1', 'all', 'w_cna', 'w_mut']
            );
            assert.deepEqual(
                getFilteredCustomCaseSets(false, true, {
                    w_mut: 50,
                    w_cna: 0,
                    w_mut_cna: 0,
                    all: 100,
                })
                    .map(obj => obj.value)
                    .sort(),
                ['-1', 'all', 'w_mut']
            );
            assert.deepEqual(
                getFilteredCustomCaseSets(false, true, {
                    w_mut: 0,
                    w_cna: 50,
                    w_mut_cna: 0,
                    all: 100,
                })
                    .map(obj => obj.value)
                    .sort(),
                ['-1', 'all', 'w_cna']
            );
            assert.deepEqual(
                getFilteredCustomCaseSets(false, true, {
                    w_mut: 0,
                    w_cna: 0,
                    w_mut_cna: 50,
                    all: 100,
                })
                    .map(obj => obj.value)
                    .sort(),
                ['-1', 'all', 'w_mut_cna']
            );
            assert.deepEqual(
                getFilteredCustomCaseSets(false, true, {
                    w_mut: 0,
                    w_cna: 0,
                    w_mut_cna: 0,
                    all: 100,
                })
                    .map(obj => obj.value)
                    .sort(),
                ['-1', 'all']
            );
        });
    });
});
