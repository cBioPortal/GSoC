import { assert } from 'chai';
import ListIndexedMap, { ListIndexedMapOfCounts } from './ListIndexedMap';

describe('ListIndexedMap', () => {
    it('`get` returns `undefined` if theres no entry', () => {
        const map = new ListIndexedMap<string, string>();
        assert.equal(map.get(), undefined);
        assert.equal(map.get('yo'), undefined);
        assert.equal(map.get('whatsup', 'yo'), undefined);
        assert.equal(map.get('hello', 'there', 'hi'), undefined);
    });
    it('`get` returns the value if there is an entry', () => {
        const map = new ListIndexedMap<string | number | boolean, any>();
        assert.equal(map.get(), undefined);
        map.set(3);
        assert.equal(map.get(), 3);
        assert.equal(map.get('asdf'), undefined);
        map.set('blah', 'asdf');
        assert.equal(map.get('asdf'), 'blah');
        assert.equal(map.get('yo', 'whatsup'), undefined);
        map.set('apsoidjfa', 'yo', 'whatsup');
        assert.equal(map.get('yo', 'whatsup'), 'apsoidjfa');
        assert.equal(map.get('whatsup', true), undefined);
        map.set('foobar', 'whatsup', true);
        assert.equal(map.get('whatsup', true), 'foobar');
        assert.equal(map.get(-3, false, 'bye'), undefined);
        map.set('fubar', -3, false, 'bye');
        assert.equal(map.get(-3, false, 'bye'), 'fubar');
    });
    it('`get` returns the most recently-set value for a key', () => {
        const map = new ListIndexedMap<string, string>();
        assert.equal(map.get(), undefined);
        map.set('test');
        assert.equal(map.get(), 'test');
        map.set('test2');
        assert.equal(map.get(), 'test2');

        assert.equal(map.get('yo'), undefined);
        map.set('test', 'yo');
        assert.equal(map.get('yo'), 'test');
        map.set('test2', 'yo');
        assert.equal(map.get('yo'), 'test2');

        assert.equal(map.get('yo', 'whatsup'), undefined);
        map.set('test', 'yo', 'whatsup');
        assert.equal(map.get('yo', 'whatsup'), 'test');
        map.set('test2', 'yo', 'whatsup');
        assert.equal(map.get('yo', 'whatsup'), 'test2');

        assert.equal(map.get('whatsup', 'yo', 'bye'), undefined);
        map.set('test', 'whatsup', 'yo', 'bye');
        assert.equal(map.get('whatsup', 'yo', 'bye'), 'test');
        map.set('test2', 'whatsup', 'yo', 'bye');
        assert.equal(map.get('whatsup', 'yo', 'bye'), 'test2');
    });
    it('`entries` returns the entries in insertion order', () => {
        const map = new ListIndexedMap<string, string>();
        map.set('test');
        map.set('blah', 'asdf');
        map.set('apsoidjfa', 'yo', 'whatsup');
        map.set('foobar', 'whatsup', 'yo');
        map.set('fubar', 'whatsup', 'yo', 'bye');
        assert.deepEqual(map.entries(), [
            {
                key: [],
                value: 'test',
            },
            {
                key: ['asdf'],
                value: 'blah',
            },
            {
                key: ['yo', 'whatsup'],
                value: 'apsoidjfa',
            },
            {
                key: ['whatsup', 'yo'],
                value: 'foobar',
            },
            {
                key: ['whatsup', 'yo', 'bye'],
                value: 'fubar',
            },
        ]);
    });
    it('`has` returns true iff there is a corresponding entry', () => {
        const map = new ListIndexedMap<string, string>();
        assert.isFalse(map.has());
        map.set('test');
        assert.isTrue(map.has());
        map.set('test2');
        assert.isTrue(map.has());

        assert.isFalse(map.has('yo'));
        map.set('test', 'yo');
        assert.isTrue(map.has('yo'));
        map.set('test2', 'yo');
        assert.isTrue(map.has('yo'));

        assert.isFalse(map.has('yo', 'whatsup'));
        map.set('test', 'yo', 'whatsup');
        assert.isTrue(map.has('yo', 'whatsup'));
        map.set('test2', 'yo', 'whatsup');
        assert.isTrue(map.has('yo', 'whatsup'));

        assert.isFalse(map.has('whatsup', 'yo', 'bye'));
        map.set('test', 'whatsup', 'yo', 'bye');
        assert.isTrue(map.has('whatsup', 'yo', 'bye'));
        map.set('test2', 'whatsup', 'yo', 'bye');
        assert.isTrue(map.has('whatsup', 'yo', 'bye'));
    });
    it('`from` creates a ListIndexedMap from a given list', () => {
        const map = ListIndexedMap.from(
            [{ id: 'obj1' }, { id: 'obj2' }, { id: 'obj3' }],
            o => [o.id]
        );
        assert.deepEqual(map.get('obj1'), { id: 'obj1' });
        assert.deepEqual(map.get('obj2'), { id: 'obj2' });
        assert.deepEqual(map.get('obj3'), { id: 'obj3' });

        const map2 = ListIndexedMap.from(
            [{ id: 'obj1' }, { id: 'obj2' }, { id: 'obj3' }],
            o => [o.id, 'yo']
        );
        assert.deepEqual(map2.get('obj1', 'yo'), { id: 'obj1' });
        assert.deepEqual(map2.get('obj2', 'yo'), { id: 'obj2' });
        assert.deepEqual(map2.get('obj3', 'yo'), { id: 'obj3' });
    });
});

describe('IntegerListIndexedMap', () => {
    it('adds 1 correctly in case that key doesnt exist, and in case key does exist', () => {
        const map = new ListIndexedMapOfCounts();
        assert.isFalse(map.has('yo'));
        map.increment('yo');
        assert.isTrue(map.has('yo'));
        assert.equal(map.get('yo'), 1);
        map.increment('yo');
        assert.isTrue(map.has('yo'));
        assert.equal(map.get('yo'), 2);

        map.set(1.25, 'hi');
        map.increment('hi');
        assert.equal(map.get('hi'), 2.25);
    });
});
