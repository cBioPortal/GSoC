import { assert } from 'chai';
import ComplexKeySet from './ComplexKeySet';

describe('ComplexKeySet', () => {
    it('`add`, `delete`, `has`, `clear`, and `keys` work correctly through this use flow, starting from empty set', () => {
        const set = new ComplexKeySet();
        assert.isFalse(set.has({ yo: 'hey' }));
        set.add({ yo: 'hey' });
        assert.isTrue(set.has({ yo: 'hey' }));
        assert.isFalse(set.has({ yo: 'whatsup' }));
        assert.deepEqual(set.keys(), [{ yo: 'hey' }]);
        set.add({ yo: 'whatsup' });
        assert.deepEqual(set.keys(), [{ yo: 'hey' }, { yo: 'whatsup' }]);
        assert.isTrue(set.has({ yo: 'whatsup' }));
        set.delete({ yo: 'hey' });
        assert.deepEqual(set.keys(), [{ yo: 'whatsup' }]);
        assert.isTrue(set.has({ yo: 'whatsup' }));
        assert.isFalse(set.has({ yo: 'hey' }));
        set.delete({ yo: 'whatsup' });
        set.add({ yo: 'hey' });
        assert.deepEqual(set.keys(), [{ yo: 'hey' }]);
        assert.isFalse(set.has({ yo: 'whatsup' }));
        assert.isTrue(set.has({ yo: 'hey' }));
        set.clear();
        assert.deepEqual(set.keys(), []);
        assert.isFalse(set.has({ yo: 'whatsup' }));
        assert.isFalse(set.has({ yo: 'hey' }));
    });
    it('`add`, `delete`, `has`, `clear`, and `keys` work correctly through this use flow, starting from set constructed with `from`', () => {
        const set = ComplexKeySet.from([
            { '23u4pu13': 1, '123u90': false },
            { '3': 1, '000-----': null, '13oid': undefined },
            { 'AGASDIJB93939####$$$': undefined },
        ]);
        assert.isTrue(set.has({ '23u4pu13': 1, '123u90': false }));
        assert.isTrue(
            set.has({ '3': 1, '000-----': null, '13oid': undefined })
        );
        assert.isTrue(set.has({ 'AGASDIJB93939####$$$': undefined }));
        assert.isFalse(set.has({ yo: 'hey' }));
        set.add({ yo: 'hey' });
        assert.isTrue(set.has({ '23u4pu13': 1, '123u90': false }));
        assert.isTrue(
            set.has({ '3': 1, '000-----': null, '13oid': undefined })
        );
        assert.isTrue(set.has({ 'AGASDIJB93939####$$$': undefined }));
        assert.isTrue(set.has({ yo: 'hey' }));
        assert.isFalse(set.has({ yo: 'whatsup' }));
        assert.deepEqual(set.keys(), [
            { '23u4pu13': 1, '123u90': false },
            { '3': 1, '000-----': null, '13oid': undefined },
            { 'AGASDIJB93939####$$$': undefined },
            { yo: 'hey' },
        ]);
        set.add({ yo: 'whatsup' });
        assert.isTrue(set.has({ '23u4pu13': 1, '123u90': false }));
        assert.isTrue(
            set.has({ '3': 1, '000-----': null, '13oid': undefined })
        );
        assert.isTrue(set.has({ 'AGASDIJB93939####$$$': undefined }));
        assert.deepEqual(set.keys(), [
            { '23u4pu13': 1, '123u90': false },
            { '3': 1, '000-----': null, '13oid': undefined },
            { 'AGASDIJB93939####$$$': undefined },
            { yo: 'hey' },
            { yo: 'whatsup' },
        ]);
        assert.isTrue(set.has({ yo: 'whatsup' }));
        set.delete({ yo: 'hey' });
        assert.isTrue(set.has({ '23u4pu13': 1, '123u90': false }));
        assert.isTrue(
            set.has({ '3': 1, '000-----': null, '13oid': undefined })
        );
        assert.isTrue(set.has({ 'AGASDIJB93939####$$$': undefined }));
        assert.deepEqual(set.keys(), [
            { '23u4pu13': 1, '123u90': false },
            { '3': 1, '000-----': null, '13oid': undefined },
            { 'AGASDIJB93939####$$$': undefined },
            { yo: 'whatsup' },
        ]);
        assert.isTrue(set.has({ yo: 'whatsup' }));
        assert.isFalse(set.has({ yo: 'hey' }));
        set.delete({ yo: 'whatsup' });
        set.add({ yo: 'hey' });
        assert.isTrue(set.has({ '23u4pu13': 1, '123u90': false }));
        assert.isTrue(
            set.has({ '3': 1, '000-----': null, '13oid': undefined })
        );
        assert.isTrue(set.has({ 'AGASDIJB93939####$$$': undefined }));
        assert.deepEqual(set.keys(), [
            { '23u4pu13': 1, '123u90': false },
            { '3': 1, '000-----': null, '13oid': undefined },
            { 'AGASDIJB93939####$$$': undefined },
            { yo: 'hey' },
        ]);
        assert.isFalse(set.has({ yo: 'whatsup' }));
        assert.isTrue(set.has({ yo: 'hey' }));
        set.clear();
        assert.deepEqual(set.keys(), []);
        assert.isFalse(set.has({ yo: 'whatsup' }));
        assert.isFalse(set.has({ yo: 'hey' }));
    });
});
