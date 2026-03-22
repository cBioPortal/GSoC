import { assert } from 'chai';
import onMobxPromise from './onMobxPromise';
import { IReactionDisposer, observable } from 'mobx';
import { remoteData } from '../../api/remoteData';

describe('onMobxPromise', () => {
    it('executes the given callback with the result when the mobx promise completes', done => {
        let promiseInvokeCount = 0;
        let promise = remoteData({
            invoke: async () => {
                promiseInvokeCount += 1;
                return 5;
            },
        });
        assert.equal(promiseInvokeCount, 0, 'promise not invoked yet');
        onMobxPromise(promise, (result: number) => {
            assert.equal(promiseInvokeCount, 1, 'promise invoked once');
            assert.equal(result, 5, 'promise invoked with right result');
            done();
        });
    });
    it('executes the given callback with the results when the mobx promises complete', done => {
        let promiseInvokeCount = 0;
        let promise1 = remoteData({
            invoke: async () => {
                promiseInvokeCount += 1;
                return 5;
            },
        });
        let promise2 = remoteData({
            invoke: async () => {
                promiseInvokeCount += 1;
                return 6;
            },
        });
        let promise3 = remoteData({
            invoke: async () => {
                promiseInvokeCount += 1;
                return 7;
            },
        });
        assert.equal(promiseInvokeCount, 0, 'promise not invoked yet');
        onMobxPromise(
            [promise1, promise2, promise3],
            (result1: number, result2: number, result3: number) => {
                assert.equal(
                    promiseInvokeCount,
                    3,
                    'promises each invoked once'
                );
                assert.equal(result1, 5, 'promise invoked with right result');
                assert.equal(result2, 6, 'promise invoked with right result');
                assert.equal(result3, 7, 'promise invoked with right result');
                done();
            }
        );
    });
    it('executes the given callback the specified number of times', done => {
        let handlerInvokeCount = 0;
        let promiseResult = observable.box(0);
        let lastInvokedPromiseResult = 0;
        let promiseResultIncrementerDisposer: IReactionDisposer;
        let promise = remoteData({
            invoke: async () => {
                lastInvokedPromiseResult = promiseResult.get();
                return lastInvokedPromiseResult;
            },
        });
        onMobxPromise(
            promise,
            (result: number) => {
                assert.equal(
                    result,
                    lastInvokedPromiseResult,
                    'promise invoked with result = lastInvokedPromiseResult'
                );
                handlerInvokeCount += 1;
                promiseResult.set(promiseResult.get() + 1);
            },
            5,
            () => {
                promiseResultIncrementerDisposer = onMobxPromise(
                    promise,
                    () => {
                        assert.equal(
                            handlerInvokeCount,
                            5,
                            'never invoked again'
                        );
                        promiseResult.set(promiseResult.get() + 1);
                    },
                    10,
                    () => {
                        done();
                    }
                );
            }
        );
    });
    it('executes immediately if the promise is already resolved, does not execute again', done => {
        let handlerInvokeCount = 0;
        let promiseResult = observable.box(0);
        let lastInvokedPromiseResult = 0;
        let promiseResultIncrementerDisposer: IReactionDisposer;
        let promise = remoteData({
            invoke: async () => {
                lastInvokedPromiseResult = promiseResult.get();
                return lastInvokedPromiseResult;
            },
        });
        onMobxPromise(promise, () => {
            // ensure the promise is already resolved by this point
            onMobxPromise(
                promise,
                (result: number) => {
                    assert.equal(result, 0, 'promise invoked with result = 0');
                    handlerInvokeCount += 1;
                    promiseResult.set(promiseResult.get() + 1);
                },
                1,
                () => {
                    promiseResultIncrementerDisposer = onMobxPromise(
                        promise,
                        () => {
                            assert.equal(
                                handlerInvokeCount,
                                1,
                                'never invoked again'
                            );
                            promiseResult.set(promiseResult.get() + 1);
                        },
                        10,
                        () => {
                            done();
                        }
                    );
                }
            );
        });
    });
});
