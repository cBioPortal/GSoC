import { assert } from 'chai';
import accumulatingDebounce from './accumulatingDebounce';
import sinon from 'sinon';
import lolex from 'lolex';
import { Clock } from 'lolex';
import { AccumulatingDebouncedFunction } from './accumulatingDebounce';

describe('accumulatingDebounce', () => {
    let clock: Clock;

    beforeAll(() => {
        clock = lolex.install();
    });

    afterAll(() => {
        clock.uninstall();
    });

    it('calls the add function once, followed by the final function, when the returned function is called once', () => {
        let deb: AccumulatingDebouncedFunction<any>;
        let done = false;
        const finalFn = sinon.spy(() => {
            assert(
                addFn.calledOnce,
                'add function called exactly once, before the final function'
            );
            assert(true, 'final function called');
        });
        const addFn = sinon.spy(() => {
            return {};
        });
        deb = accumulatingDebounce(
            finalFn,
            addFn,
            () => {
                return {};
            },
            0,
            () => {
                assert(!deb.isPending(), 'final function wont be called again');
                done = true;
            }
        );

        assert(!deb.isPending(), 'before being called, no timeout is pending');
        deb();
        clock.tick(1);
        assert.isTrue(done);
        assert.isTrue(finalFn.calledOnce);
    });

    it(
        'calls the add function three times, followed by the final function once, when the returned function is called ' +
            'three times in succession',
        () => {
            let deb: AccumulatingDebouncedFunction<any>;
            let done = false;
            const finalFn = sinon.spy(() => {
                assert(
                    addFn.callCount === 3,
                    'add function called three times, before the final function called once'
                );
            });
            const addFn = sinon.spy(() => {
                return {};
            });
            const afterTimeoutExpire = sinon.spy(() => {
                if (afterTimeoutExpire.callCount === 1) {
                    assert(
                        addFn.callCount === 3,
                        'add function called three times before the first timeout expire'
                    );
                    assert(
                        deb.isPending(),
                        'final function will be called again, because there has been an add call ' +
                            '(actually, 2) since the timeout was set'
                    );
                } else {
                    assert(
                        afterTimeoutExpire.callCount === 2,
                        'timeout expired only twice'
                    );
                    assert(
                        addFn.callCount === 3,
                        'no additional add calls triggered since last timeout expire'
                    );
                    assert(
                        !deb.isPending(),
                        'final function will not be called again'
                    );
                    done = true;
                }
            });
            deb = accumulatingDebounce(
                finalFn,
                addFn,
                () => {
                    return {};
                },
                0,
                afterTimeoutExpire
            );
            deb();
            deb();
            deb();
            clock.tick(1);
            assert.isTrue(finalFn.calledOnce);
            assert.isTrue(done);
        }
    );

    it('accumulates arguments as specified, and only triggers the final function with them once per burst', () => {
        let deb: AccumulatingDebouncedFunction<number>;
        let done = false;

        let finalFnCalls = 0;
        let expiredTimeouts = 0;
        const finalFn = (arg: number[]) => {
            finalFnCalls++;
            if (finalFnCalls === 1) {
                assert.deepEqual(
                    arg,
                    [1, 2, 3, 4, 5],
                    'first burst of arguments should be accumulated'
                );
            } else if (finalFnCalls === 2) {
                assert.deepEqual(
                    arg,
                    [6],
                    'second burst of arguments accumulated'
                );
            } else if (finalFnCalls === 3) {
                assert.deepEqual(
                    arg,
                    [7, 8],
                    'third burst of arguments accumulated'
                );
                done = true;
            }
        };
        const addFn = (acc: number[], arg: number) => {
            acc.push(arg);
            return acc;
        };

        deb = accumulatingDebounce(
            finalFn,
            addFn,
            () => [],
            0,
            () => {
                expiredTimeouts++;
                if (finalFnCalls === 1 && expiredTimeouts === 2) {
                    assert(
                        !deb.isPending(),
                        'before we add more arguments, no timeout is set to happen'
                    );
                    deb(6);
                    assert(
                        deb.isPending(),
                        'after adding arguments, timeout is set to happen'
                    );
                } else if (finalFnCalls === 2 && expiredTimeouts === 3) {
                    assert(
                        !deb.isPending(),
                        'before we add more arguments, no timeout is set to happen'
                    );
                    deb(7);
                    deb(8);
                    assert(
                        deb.isPending(),
                        'after adding arguments, timeout is set to happen'
                    );
                }
            }
        );
        deb(1);
        deb(2);
        deb(3);
        deb(4);
        deb(5);
        clock.tick(10);
        assert.isTrue(done);
    });

    it('waits the specified number of milliseconds before executing', () => {
        let done = false;
        let deb = accumulatingDebounce(
            (x: number) => {
                done = true;
            },
            (x: number) => 0,
            () => {
                return 0;
            },
            250
        );
        deb();
        clock.tick(10);
        assert.isFalse(done);
        clock.tick(60);
        assert.isFalse(done);
        clock.tick(100);
        assert.isFalse(done);
        clock.tick(90);
        assert.isTrue(done);
    });

    it('does not execute if cancelled', () => {
        let done = sinon.spy((x: number) => {});
        let deb = accumulatingDebounce(
            done,
            (x: number) => 0,
            () => {
                return 0;
            },
            0
        );
        deb();
        clock.tick(20);
        assert.isTrue(done.calledOnce, 'if not cancelled, it executes');
        assert.isFalse(
            deb.isPending(),
            'call is not pending after an execution'
        );

        deb();
        assert.isTrue(deb.isPending(), 'call is pending');
        deb();
        deb();
        deb();
        assert.isTrue(deb.isPending(), 'call is still pending');
        assert.isTrue(done.calledOnce, 'final function not called again');
        deb.cancel();
        assert.isFalse(
            deb.isPending(),
            'call not pending after being cancelled'
        );
        clock.tick(500);
        assert.isFalse(deb.isPending(), 'call still not pending 500 ms later');
        assert.isTrue(done.calledOnce, 'final function was never called again');
    });
});
