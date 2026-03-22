import { assert } from 'chai';
import { addTimeoutToPromise } from './PromiseUtils';

describe('PromiseUtils', () => {
    describe('addTimeoutToPromise', () => {
        it('should reject if timeout occurs', done => {
            const promise = new Promise(resolve => {
                setTimeout(resolve, 1000);
            });
            addTimeoutToPromise(promise, 100).catch(() => {
                done();
            });
        });
        it('should not reject if resolves before timeout', done => {
            const promise = new Promise(resolve => {
                setTimeout(resolve, 0);
            });
            addTimeoutToPromise(promise, 100).then(() => {
                done();
            });
        });
        it('should reject with same argument if promise rejects', done => {
            const promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    reject('hello');
                }, 100);
            });
            addTimeoutToPromise(promise, 200).catch(err => {
                assert.equal(err, 'hello');
                done();
            });
        });
        it('should resolve with same argument if promise resolves', done => {
            const promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve('hello');
                }, 100);
            });
            addTimeoutToPromise(promise, 200).then(res => {
                assert.equal(res, 'hello');
                done();
            });
        });
    });
});
