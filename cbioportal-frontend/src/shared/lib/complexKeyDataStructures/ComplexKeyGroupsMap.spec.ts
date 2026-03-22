import { assert } from 'chai';
import ComplexKeyGroupsMap from './ComplexKeyGroupsMap';

describe('ComplexKeyGroupsMap', () => {
    it('nonexisting keys return undefined', () => {
        const map = new ComplexKeyGroupsMap<number>();
        assert.isUndefined(map.get({ id: 'any' }));
        assert.isUndefined(map.get({ id2: 'any' }));
    });
    it('values get added to arrays', () => {
        const map = new ComplexKeyGroupsMap<number>();
        map.add({ sampleId: 'sample1', studyId: 'study1' }, 1);
        map.add({ sampleId: 'sample1', studyId: 'study1' }, 5);
        map.add({ sampleId: 'sample1', studyId: 'study1' }, 10);
        map.add({ sampleId: 'sample2', studyId: 'study1' }, 2);
        map.add({ sampleId: 'sample2', studyId: 'study1' }, 4);
        map.add({ sampleId: 'sample2', studyId: 'study10' }, 6);

        assert.deepEqual(map.get({ sampleId: 'sample1', studyId: 'study1' }), [
            1,
            5,
            10,
        ]);
        assert.deepEqual(map.get({ sampleId: 'sample2', studyId: 'study1' }), [
            2,
            4,
        ]);
        assert.deepEqual(map.get({ sampleId: 'sample2', studyId: 'study10' }), [
            6,
        ]);
        assert.isUndefined(map.get({ id2: 'any' }));

        assert.deepEqual(map.entries(), [
            {
                key: { sampleId: 'sample1', studyId: 'study1' },
                value: [1, 5, 10],
            },
            { key: { sampleId: 'sample2', studyId: 'study1' }, value: [2, 4] },
            { key: { sampleId: 'sample2', studyId: 'study10' }, value: [6] },
        ]);
    });
});
