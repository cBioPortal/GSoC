import { assert } from 'chai';
import ComplexKeyMap from './ComplexKeyMap';

describe('ComplexKeyMap', () => {
    it('`get` returns `undefined` if theres no entry', () => {
        const map = new ComplexKeyMap<string>();
        assert.equal(map.get({ word1: '', word2: '' }), undefined);
        assert.equal(map.get({ word1: 'yo', word2: '' }), undefined);
        assert.equal(map.get({ word1: 'whatsup', word2: 'yo' }), undefined);
    });
    it('`get` returns the value if there is an entry, but after clearing theyre not there anymore', () => {
        const map = new ComplexKeyMap<string>();
        assert.equal(map.get({ word1: '', word2: '', word3: '' }), undefined);
        map.set({ word1: '', word2: '', word3: '' }, 'test');
        assert.equal(map.get({ word1: '', word2: '', word3: '' }), 'test');
        assert.equal(
            map.get({ word1: 'asdf', word2: '', word3: '' }),
            undefined
        );
        map.set({ word1: 'asdf', word2: '', word3: '' }, 'blah');
        assert.equal(map.get({ word1: 'asdf', word2: '', word3: '' }), 'blah');
        assert.equal(
            map.get({ word1: 'yo', word2: 'whatsup', word3: '' }),
            undefined
        );
        map.set({ word1: 'yo', word2: 'whatsup', word3: '' }, 'apsoidjfa');
        assert.equal(
            map.get({ word1: 'yo', word2: 'whatsup', word3: '' }),
            'apsoidjfa'
        );
        assert.equal(
            map.get({ word1: 'whatsup', word2: 'yo', word3: '' }),
            undefined
        );
        map.set({ word1: 'whatsup', word2: 'yo', word3: '' }, 'foobar');
        assert.equal(
            map.get({ word1: 'whatsup', word2: 'yo', word3: '' }),
            'foobar'
        );
        assert.equal(
            map.get({ word1: 'whatsup', word2: 'yo', word3: 'bye' }),
            undefined
        );
        map.set({ word1: 'whatsup', word2: 'yo', word3: 'bye' }, 'fubar');
        assert.equal(
            map.get({ word1: 'whatsup', word2: 'yo', word3: 'bye' }),
            'fubar'
        );

        map.clear();
        assert.equal(map.get({ word1: '', word2: '', word3: '' }), undefined);
        assert.equal(
            map.get({ word1: 'asdf', word2: '', word3: '' }),
            undefined
        );
        assert.equal(
            map.get({ word1: 'yo', word2: 'whatsup', word3: '' }),
            undefined
        );
        assert.equal(
            map.get({ word1: 'whatsup', word2: 'yo', word3: '' }),
            undefined
        );
        assert.equal(
            map.get({ word1: 'whatsup', word2: 'yo', word3: 'bye' }),
            undefined
        );
    });
    it('`get` returns the most recently-set value for a key', () => {
        const map = new ComplexKeyMap<string>();
        assert.equal(map.get({ word1: '', word2: '', word3: '' }), undefined);
        map.set({ word1: '', word2: '', word3: '' }, 'test');
        assert.equal(map.get({ word1: '', word2: '', word3: '' }), 'test');
        map.set({ word1: '', word2: '', word3: '' }, 'test2');
        assert.equal(map.get({ word1: '', word2: '', word3: '' }), 'test2');

        assert.equal(map.get({ word1: 'yo', word2: '', word3: '' }), undefined);
        map.set({ word1: 'yo', word2: '', word3: '' }, 'test');
        assert.equal(map.get({ word1: 'yo', word2: '', word3: '' }), 'test');
        map.set({ word1: 'yo', word2: '', word3: '' }, 'test2');
        assert.equal(map.get({ word1: 'yo', word2: '', word3: '' }), 'test2');

        assert.equal(
            map.get({ word1: 'yo', word2: 'whatsup', word3: '' }),
            undefined
        );
        map.set({ word1: 'yo', word2: 'whatsup', word3: '' }, 'test');
        assert.equal(
            map.get({ word1: 'yo', word2: 'whatsup', word3: '' }),
            'test'
        );
        map.set({ word1: 'yo', word2: 'whatsup', word3: '' }, 'test2');
        assert.equal(
            map.get({ word1: 'yo', word2: 'whatsup', word3: '' }),
            'test2'
        );

        assert.equal(
            map.get({ word1: 'whatsup', word2: 'yo', word3: 'bye' }),
            undefined
        );
        map.set({ word1: 'whatsup', word2: 'yo', word3: 'bye' }, 'test');
        assert.equal(
            map.get({ word1: 'whatsup', word2: 'yo', word3: 'bye' }),
            'test'
        );
        map.set({ word1: 'whatsup', word2: 'yo', word3: 'bye' }, 'test2');
        assert.equal(
            map.get({ word1: 'whatsup', word2: 'yo', word3: 'bye' }),
            'test2'
        );
    });
    it('`entries` returns the entries in insertion order', () => {
        const map = new ComplexKeyMap<string>();
        map.set({ word1: '' }, 'test');
        map.set({ word1: 'asdf' }, 'blah');
        map.set({ word1: 'yo', word2: 'whatsup' }, 'apsoidjfa');
        map.set({ word1: 'whatsup', word2: 'yo' }, 'foobar');
        map.set({ word1: 'whatsup', word2: 'yo', word3: 'bye' }, 'fubar');
        assert.deepEqual(map.entries(), [
            {
                key: { word1: '' },
                value: 'test',
            },
            {
                key: { word1: 'asdf' },
                value: 'blah',
            },
            {
                key: { word1: 'yo', word2: 'whatsup' },
                value: 'apsoidjfa',
            },
            {
                key: { word1: 'whatsup', word2: 'yo' },
                value: 'foobar',
            },
            {
                key: { word1: 'whatsup', word2: 'yo', word3: 'bye' },
                value: 'fubar',
            },
        ]);
    });
    it('`has` returns true iff there is a corresponding entry', () => {
        const map = new ComplexKeyMap<string | number>();
        assert.isFalse(map.has({ k: '' }));
        map.set({ k: '' }, 'test');
        assert.isTrue(map.has({ k: '' }));
        map.set({ k: '' }, 'test2');
        assert.isTrue(map.has({ k: '' }));

        assert.isFalse(map.has({ k12: 'yo' }));
        map.set({ k12: 'yo' }, 1241);
        assert.isTrue(map.has({ k12: 'yo' }));
        map.set({ k12: 'yo' }, 'test2');
        assert.isTrue(map.has({ k12: 'yo' }));

        const crazyKey = {
            'aijsdpfoiaj3141#.131-4-r1': 'aisdjfpaosijd#rjrq',
            'ijzpxdcidajf9w83r!341$$$': 19183409180,
        };
        assert.isFalse(map.has(crazyKey));
        map.set(crazyKey, 'test');
        assert.isTrue(map.has(crazyKey));
        map.set(crazyKey, 32515);
        assert.isTrue(map.has(crazyKey));
    });
    it('`from` creates a ListIndexedMap from a given list', () => {
        const map = ComplexKeyMap.from(
            [{ id: 'obj1' }, { id: 'obj2' }, { id: 'obj3' }],
            o => ({ '234ijdfapso#': o.id })
        );
        assert.deepEqual(map.get({ '234ijdfapso#': 'obj1' }), { id: 'obj1' });
        assert.deepEqual(map.get({ '234ijdfapso#': 'obj2' }), { id: 'obj2' });
        assert.deepEqual(map.get({ '234ijdfapso#': 'obj3' }), { id: 'obj3' });

        const map2 = ComplexKeyMap.from(
            [{ id: 'obj1' }, { id: 'obj2' }, { id: 'obj3' }],
            o => ({ '234ijdfapso#': o.id, whatever: 'yo' })
        );
        assert.isUndefined(map2.get({ '234ijdfapso#': 'obj1' }));
        assert.isUndefined(map2.get({ '234ijdfapso#': 'obj2' }));
        assert.isUndefined(map2.get({ '234ijdfapso#': 'obj3' }));
        assert.deepEqual(map2.get({ '234ijdfapso#': 'obj1', whatever: 'yo' }), {
            id: 'obj1',
        });
        assert.deepEqual(map2.get({ '234ijdfapso#': 'obj2', whatever: 'yo' }), {
            id: 'obj2',
        });
        assert.deepEqual(map2.get({ '234ijdfapso#': 'obj3', whatever: 'yo' }), {
            id: 'obj3',
        });
    });
});
