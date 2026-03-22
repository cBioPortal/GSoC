import { assert } from 'chai';
import { default as sinon, SinonSpy } from 'sinon';
import lolex from 'lolex';
import { Clock } from 'lolex';
import { default as LazyMobXCache, CacheData } from './LazyMobXCache';
import mobx, { autorun } from 'mobx';

// We have to use 'done' rather than fake clock because for some reason fake clock isn't working with async/await
//  in LazyMobXCache.populate
type Query = {
    numAsString: string;
    shouldFail?: boolean;
    shouldDelay?: boolean;
    shouldNotExist?: boolean;
    meta?: string;
};

function useFakeClock(callback: (clock: Clock) => void) {
    let clock = lolex.install();
    callback(clock);
    clock.uninstall();
}
describe('LazyMobXCache', () => {
    let cache: LazyMobXCache<number, Query, string>;

    let fetch: SinonSpy;
    beforeEach(() => {
        fetch = sinon.spy(
            (queries: Query[], multiplier: number, translator: number) => {
                let data: number[] | null = [];
                for (let i = 0; i < queries.length; i++) {
                    if (queries[i].shouldFail) {
                        data = null;
                        break;
                    } else if (!queries[i].shouldNotExist) {
                        data.push(
                            parseInt(queries[i].numAsString, 10) * multiplier +
                                translator
                        );
                    }
                }
                if (data) {
                    if (queries.find((query: Query) => !!query.shouldDelay)) {
                        return new Promise((resolve, reject) => {
                            setTimeout(() => {
                                resolve(data as number[]);
                            }, 1000);
                        });
                    } else {
                        let meta: string | undefined = (
                            queries.find(q => !!q.meta) || { meta: undefined }
                        ).meta;
                        if (meta) {
                            return Promise.resolve([{ data, meta }]);
                        } else {
                            return Promise.resolve(data);
                        }
                    }
                } else {
                    return Promise.reject('fail!');
                }
            }
        );

        cache = new LazyMobXCache<number, Query, string>(
            q => q.numAsString + (q.meta || ''),
            (n: number, m?: string) => {
                return Math.round((n - 3) / 25) + (m || '');
            },
            fetch,
            25,
            3
        );
    });
    describe('#addData', () => {
        it('adds data properly, and returns data using #peek if it exists in the cache', done => {
            let timesRun = 0;
            let reaction = autorun(() => {
                timesRun += 1;
                if (timesRun === 1) {
                    // Initially, no data
                    assert.deepEqual(
                        cache.peek({
                            numAsString: '5',
                        }),
                        null
                    );
                    assert.deepEqual(
                        cache.peek({
                            numAsString: '10',
                        }),
                        null
                    );
                    assert.deepEqual(
                        cache.peek({
                            numAsString: '15',
                        }),
                        null
                    );

                    setTimeout(() => cache.addData([253, 128, 378]), 0); // gotta schedule it so itll trigger another autorun
                } else if (timesRun === 2) {
                    assert.isFalse(
                        fetch.called,
                        'fetch should never have been called'
                    );
                    assert.deepEqual(
                        cache.peek({
                            numAsString: '5',
                        }),
                        {
                            status: 'complete',
                            data: 128,
                        } as CacheData<number, string>
                    );
                    assert.deepEqual(
                        cache.peek({
                            numAsString: '10',
                        }),
                        {
                            status: 'complete',
                            data: 253,
                        } as CacheData<number, string>
                    );
                    assert.deepEqual(
                        cache.peek({
                            numAsString: '15',
                        }),
                        {
                            status: 'complete',
                            data: 378,
                        } as CacheData<number, string>
                    );
                    assert.deepEqual(
                        cache.peek({
                            numAsString: '20',
                        }),
                        null
                    );
                    done();
                }
            });
        });
    });

    describe('#get', () => {
        it('passes static dependencies into fetch correctly', () => {
            useFakeClock(clock => {
                cache.get({
                    numAsString: '5',
                });
                clock.tick(100);
                assert.equal(
                    fetch.getCall(0).args[1],
                    25,
                    'first static dependency passed in correctly'
                );
                assert.equal(
                    fetch.getCall(0).args[2],
                    3,
                    'second static dependency passed in correctly'
                );
            });
        });
        it('returns data if it exists', done => {
            let timesRun = 0;
            let reaction = autorun(() => {
                timesRun += 1;
                let datum = cache.get({
                    numAsString: '5',
                });
                if (timesRun === 1) {
                    assert.isNull(datum, 'no data when first checking for it');
                } else if (timesRun === 2) {
                    assert.isTrue(
                        fetch.calledOnce,
                        'fetch has been called once'
                    );
                    assert.deepEqual(datum, {
                        status: 'complete',
                        data: 128,
                    } as CacheData<number, string>);
                    reaction();
                    done();
                }
            });
        });
        it('doesnt try to fetch already resolved data', () => {
            useFakeClock(clock => {
                cache.addData([253, 128, 378]);
                assert.deepEqual(
                    cache.get({ numAsString: '5' }),
                    { status: 'complete', data: 128 } as CacheData<
                        number,
                        string
                    >,
                    'returns existing data'
                );
                clock.tick(100);
                assert.isFalse(
                    fetch.called,
                    'fetch shouldnt be called at all for existing queries'
                );
                cache.get({ numAsString: '15' });
                cache.get({ numAsString: '10' });
                cache.get({ numAsString: '20' });
                clock.tick(100);
                assert.isTrue(
                    fetch.calledOnce,
                    'fetch should only have been called once'
                );
                assert.deepEqual(
                    fetch.getCall(0).args[0],
                    [{ numAsString: '20' }],
                    'should only have fetched the missing data'
                );
            });
        });
        it('doesnt try to double-fetch data that has already been requested and is pending', () => {
            useFakeClock(clock => {
                cache.get({ numAsString: '5', shouldDelay: true });
                clock.tick(500);
                assert.isTrue(fetch.calledOnce, 'fetch was called once');
                assert.isNull(
                    cache.peek({ numAsString: '5' }),
                    'this data is still pending, not resolved'
                );
                cache.get({ numAsString: '5' });
                clock.tick(4000);
                assert.isTrue(
                    fetch.calledOnce,
                    'fetch should not have been called again because the only data requested was already pending'
                );
            });
        });
        it('returns no data if no data exists', done => {
            let timesRun = 0;
            let reaction = autorun(() => {
                timesRun += 1;
                if (timesRun === 1) {
                    let firstTry = cache.get({
                        numAsString: '6',
                        shouldNotExist: true,
                    });
                    assert.isNull(firstTry, 'returns null if data pending');
                } else if (timesRun === 2) {
                    let secondTry = cache.get({ numAsString: '6' });
                    assert.deepEqual(
                        secondTry,
                        { status: 'complete', data: null } as CacheData<
                            number,
                            string
                        >,
                        'no data available for this query'
                    );
                    reaction();
                    done();
                }
            });
        });
        it('returns an error if fetching failed, and doesnt try to fetch data that has errored', done => {
            let timesRun = 0;
            let reaction = autorun(() => {
                timesRun += 1;
                if (timesRun === 1) {
                    let firstTry = cache.get({
                        numAsString: '6',
                        shouldFail: true,
                    });
                    assert.isNull(firstTry, 'returns null if data pending');
                } else if (timesRun === 2) {
                    let secondTry = cache.get({ numAsString: '6' });
                    assert.deepEqual(
                        secondTry,
                        { status: 'error', data: null } as CacheData<
                            number,
                            string
                        >,
                        'an error occurred during fetch'
                    );

                    cache.get({ numAsString: '6' });
                    cache.get({ numAsString: '7' });
                    cache.get({ numAsString: '8' });
                } else if (timesRun === 3) {
                    assert.isTrue(
                        !!fetch.lastCall.args[0].find(
                            (x: Query) => x.numAsString === '7'
                        ),
                        '7 should have been queried'
                    );
                    assert.isTrue(
                        !!fetch.lastCall.args[0].find(
                            (x: Query) => x.numAsString === '8'
                        ),
                        '8 should have been queried'
                    );
                    assert.isFalse(
                        !!fetch.lastCall.args[0].find(
                            (x: Query) => x.numAsString === '6'
                        ),
                        '6 should have been queried, it already failed'
                    );

                    assert.deepEqual(
                        cache.peek({ numAsString: '7' }),
                        { status: 'complete', data: 178 } as CacheData<
                            number,
                            string
                        >,
                        'data 1 fetched successfully'
                    );
                    assert.deepEqual(
                        cache.peek({ numAsString: '8' }),
                        { status: 'complete', data: 203 } as CacheData<
                            number,
                            string
                        >,
                        'data 2 fetched successfully'
                    );
                    assert.deepEqual(
                        cache.peek({ numAsString: '6' }),
                        { status: 'error', data: null } as CacheData<
                            number,
                            string
                        >,
                        'error data still marked as error'
                    );

                    cache.get({ numAsString: '7' });
                    cache.get({ numAsString: '9' });
                    cache.get({ numAsString: '10' });
                    cache.get({ numAsString: '11', shouldFail: true });
                } else if (timesRun === 4) {
                    assert.isFalse(
                        !!fetch.lastCall.args[0].find(
                            (x: Query) => x.numAsString === '7'
                        ),
                        '7 should not have been queried, it already succeeded'
                    );
                    assert.isTrue(
                        !!fetch.lastCall.args[0].find(
                            (x: Query) => x.numAsString === '9'
                        ),
                        '9 should have been queried'
                    );
                    assert.isTrue(
                        !!fetch.lastCall.args[0].find(
                            (x: Query) => x.numAsString === '10'
                        ),
                        '10 should have been queried'
                    );
                    assert.isTrue(
                        !!fetch.lastCall.args[0].find(
                            (x: Query) => x.numAsString === '11'
                        ),
                        '11 should have been queried'
                    );

                    assert.deepEqual(
                        cache.peek({ numAsString: '7' }),
                        { status: 'complete', data: 178 } as CacheData<
                            number,
                            string
                        >,
                        '7 still there successfully from before'
                    );
                    assert.deepEqual(
                        cache.peek({ numAsString: '9' }),
                        { status: 'error', data: null } as CacheData<
                            number,
                            string
                        >,
                        'there was an error during fetching 9'
                    );
                    assert.deepEqual(
                        cache.peek({ numAsString: '10' }),
                        { status: 'error', data: null } as CacheData<
                            number,
                            string
                        >,
                        'there was an error during fetching 10'
                    );
                    assert.deepEqual(
                        cache.peek({ numAsString: '11' }),
                        { status: 'error', data: null } as CacheData<
                            number,
                            string
                        >,
                        'there was an error during fetching 11'
                    );
                    reaction();
                    done();
                }
            });
        });
        it('adds data using metadata given by fetch', done => {
            let timesRun = 0;
            let reaction = autorun(() => {
                timesRun += 1;
                let datum = cache.get({
                    numAsString: '5',
                    meta: 'Q',
                });
                if (timesRun === 1) {
                    assert.isNull(datum, 'no data when first checking for it');
                } else if (timesRun === 2) {
                    assert.isTrue(
                        fetch.calledOnce,
                        'fetch has been called once'
                    );
                    assert.deepEqual(
                        datum,
                        {
                            status: 'complete',
                            data: 128,
                            meta: 'Q',
                        } as CacheData<number, string>,
                        'data found using key with metadata'
                    );
                    assert.equal(
                        cache.peek({ numAsString: '5' }),
                        null,
                        'no data found when querying without metadata'
                    );
                    reaction();
                    done();
                }
            });
        });

        it('returns null if fetch pending', () => {
            assert.isNull(cache.get({ numAsString: '6' }));
        });
        it('debounces calls to get', () => {
            useFakeClock(clock => {
                cache.get({ numAsString: '1' });
                clock.tick(1000);
                assert.equal(fetch.callCount, 1);
                cache.get({ numAsString: '2' });
                cache.get({ numAsString: '3' });
                cache.get({ numAsString: '4' });
                clock.tick(1000);
                assert.equal(fetch.callCount, 2);
                cache.get({ numAsString: '5' });
                cache.get({ numAsString: '6' });
                cache.get({ numAsString: '7' });
                cache.get({ numAsString: '8' });
                cache.get({ numAsString: '9' });
                cache.get({ numAsString: '10' });
                cache.get({ numAsString: '11' });
                cache.get({ numAsString: '12' });
                cache.get({ numAsString: '13' });
                clock.tick(1000);
                assert.equal(fetch.callCount, 3);
                cache.get({ numAsString: '14' });
                clock.tick(1000);
                assert.equal(fetch.callCount, 4);
                clock.tick(1000);
                assert.equal(fetch.callCount, 4);
            });
        });
        it('triggers any mobx reaction that touches the cache when its updated', done => {
            let peekFn = sinon.spy(() => {
                cache.peek({ numAsString: '2' });
                if (
                    peekFn.callCount === 2 &&
                    cacheFn.callCount === 2 &&
                    getFn.callCount === 2
                ) {
                    peekReaction();
                    cacheReaction();
                    getReaction();
                    done();
                }
            });
            let cacheFn = sinon.spy(() => {
                cache.cache;
                if (
                    peekFn.callCount === 2 &&
                    cacheFn.callCount === 2 &&
                    getFn.callCount === 2
                ) {
                    peekReaction();
                    cacheReaction();
                    getReaction();
                    done();
                }
            });
            let getFn = sinon.spy(() => {
                cache.get({ numAsString: '2' });
                if (
                    peekFn.callCount === 2 &&
                    cacheFn.callCount === 2 &&
                    getFn.callCount === 2
                ) {
                    peekReaction();
                    cacheReaction();
                    getReaction();
                    done();
                }
            });
            assert.equal(peekFn.callCount, 0);
            assert.equal(cacheFn.callCount, 0);
            assert.equal(getFn.callCount, 0);
            let peekReaction = autorun(peekFn);
            let cacheReaction = autorun(cacheFn);
            let getReaction = autorun(getFn);
            assert.equal(peekFn.callCount, 1);
            assert.equal(cacheFn.callCount, 1);
            assert.equal(getFn.callCount, 1);
        });
    });
    describe('#getPromise', () => {
        it('resolves immediately if the selected queries are already there', async () => {
            let callback = sinon.spy((data: number[]) => {});
            await cache.getPromise([]).then(callback);
            assert.equal(callback.callCount, 1); // immediately called
            assert.equal(cache.activePromisesCount, 0);
            assert.deepEqual(callback.args[0], [[]]);
            cache.get({ numAsString: '3' });
            await cache.getPromise([{ numAsString: '3' }]).then(callback);
            assert.equal(callback.callCount, 2); // immediately called
            assert.equal(cache.activePromisesCount, 0);
            assert.deepEqual(
                callback.args[1][0].map((x: any) => x.data),
                [78]
            );
            cache.get({ numAsString: '2' });
            cache.get({ numAsString: '1' });
            await cache
                .getPromise([
                    { numAsString: '3' },
                    { numAsString: '2' },
                    { numAsString: '1' },
                ])
                .then(callback);
            assert.equal(callback.callCount, 3);
            assert.equal(cache.activePromisesCount, 0);
            assert.deepEqual(
                callback.args[2][0].map((x: any) => x.data),
                [78, 53, 28]
            );
            return true;
        });
        it('resolves when the selected queries become available: request made', done => {
            let callback = sinon.spy((data: CacheData<number, string>[]) => {
                assert.equal(callback.callCount, 1);
                assert.deepEqual(
                    data.map(x => x.data),
                    [28, 103]
                );
                done();
            });
            cache
                .getPromise([{ numAsString: '1' }, { numAsString: '4' }], true)
                .then(callback);
        });
        it('resolves when the selected queries become available: request not made', done => {
            let callback = sinon.spy((data: CacheData<number, string>[]) => {
                assert.equal(callback.callCount, 1);
                assert.deepEqual(
                    data.map(x => x.data),
                    [28, 103]
                );
                done();
            });
            cache
                .getPromise([{ numAsString: '1' }, { numAsString: '4' }])
                .then(callback);
            assert.equal(callback.callCount, 0);
            cache.get({ numAsString: '1' });
            assert.equal(callback.callCount, 0);
            cache.get({ numAsString: '4' });
            assert.equal(callback.callCount, 0);
        });
        it('errors if there is an error', done => {
            let callback = sinon.spy(() => {
                assert.equal(callback.callCount, 1);
                done();
            });
            cache
                .getPromise([{ numAsString: '1' }, { numAsString: '4' }])
                .catch(callback);
            assert.equal(callback.callCount, 0);
            cache.get({ numAsString: '1' });
            assert.equal(callback.callCount, 0);
            cache.get({ numAsString: '4', shouldFail: true });
            assert.equal(callback.callCount, 0);
        });
        it('can handle multiple pending listeners', done => {
            let callbackCount = 0;
            assert.equal(cache.activePromisesCount, 0);
            cache.getPromise([{ numAsString: '1' }]).then(() => {
                callbackCount += 1;
                assert.equal(callbackCount, 1);
            });
            assert.equal(cache.activePromisesCount, 1);
            cache.getPromise({ numAsString: '2' }).then(() => {
                callbackCount += 1;
                assert.equal(callbackCount, 2);
            });
            assert.equal(cache.activePromisesCount, 2);
            cache.getPromise({ numAsString: '3' }).then(() => {
                callbackCount += 1;
                assert.equal(callbackCount, 3);
                done();
            });
            assert.equal(cache.activePromisesCount, 3);
            cache.get({ numAsString: '1' });
            cache.get({ numAsString: '2' });
            cache.get({ numAsString: '3' });
        });
        it('unregisters the listener once it has been triggered: resolve', done => {
            cache.getPromise([{ numAsString: '1' }]).then(() => {
                assert.equal(cache.activePromisesCount, 0);
                done();
            });
            assert.equal(cache.activePromisesCount, 1);
            cache.get({ numAsString: '1' });
        });
        it('unregisters the listener once it has been triggered: error', done => {
            cache.getPromise([{ numAsString: '1' }]).catch(() => {
                assert.equal(cache.activePromisesCount, 0);
                done();
            });
            assert.equal(cache.activePromisesCount, 1);
            cache.get({ numAsString: '1', shouldFail: true });
        });
    });
});
