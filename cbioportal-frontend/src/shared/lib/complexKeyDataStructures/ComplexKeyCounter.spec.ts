import { assert } from 'chai';
import ComplexKeyCounter from './ComplexKeyCounter';

describe('ComplexKeyCounter', () => {
    it('nonexisting keys start at 0, `entries` only reflects incremented keys', () => {
        const counter = new ComplexKeyCounter();
        assert.deepEqual(counter.entries(), []);
        assert.equal(counter.get({ k: 'aaidsopjfap' }), 0);
        assert.equal(
            counter.get({ 'kjaspdoijfp134u13!@@#$!$$': 'sdf0913' }),
            0
        );
        assert.deepEqual(counter.entries(), []);
    });
    it('after incrementing, the value with `get` changes appropriately, `entries` reflect current state', () => {
        const counter = new ComplexKeyCounter();
        assert.deepEqual(counter.entries(), []);
        assert.equal(counter.get({ k: 'aaidsopjfap' }), 0);
        assert.equal(
            counter.get({ 'kjaspdoijfp134u13!@@#$!$$': 'sdf0913' }),
            0
        );
        counter.increment({ k: 'aaidsopjfap' });
        counter.increment({ k: 'aaidsopjfap' });
        counter.increment({ k: 'aaidsopjfap' });
        counter.increment({ k: 'aaidsopjfap' });
        counter.increment({ k: 'aaidsopjfap' });
        counter.add({ k: 'aaidsopjfap' }, 6);
        counter.increment({ 'kjaspdoijfp134u13!@@#$!$$': 'sdf0913' });
        counter.increment({ 'kjaspdoijfp134u13!@@#$!$$': 'sdf0913' });
        assert.equal(counter.get({ k: 'aaidsopjfap' }), 11);
        assert.equal(
            counter.get({ 'kjaspdoijfp134u13!@@#$!$$': 'sdf0913' }),
            2
        );
        assert.deepEqual(counter.entries(), [
            { key: { k: 'aaidsopjfap' }, value: 11 },
            { key: { 'kjaspdoijfp134u13!@@#$!$$': 'sdf0913' }, value: 2 },
        ]);
    });
    it('after clearing, all keys are back to 0, `entries` returns empty', () => {
        const counter = new ComplexKeyCounter();
        counter.increment({ k: 'aaidsopjfap' });
        counter.increment({ k: 'aaidsopjfap' });
        counter.increment({ k: 'aaidsopjfap' });
        counter.increment({ k: 'aaidsopjfap' });
        counter.increment({ k: 'aaidsopjfap' });
        counter.increment({ 'kjaspdoijfp134u13!@@#$!$$': 'sdf0913' });
        counter.increment({ 'kjaspdoijfp134u13!@@#$!$$': 'sdf0913' });
        assert.equal(counter.get({ k: 'aaidsopjfap' }), 5);
        assert.equal(
            counter.get({ 'kjaspdoijfp134u13!@@#$!$$': 'sdf0913' }),
            2
        );
        counter.clear();
        assert.equal(counter.get({ k: 'aaidsopjfap' }), 0);
        assert.equal(
            counter.get({ 'kjaspdoijfp134u13!@@#$!$$': 'sdf0913' }),
            0
        );
        assert.deepEqual(counter.entries(), []);
    });
});
