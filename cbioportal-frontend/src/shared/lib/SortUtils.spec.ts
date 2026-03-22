import { assert } from 'chai';
import { ClinicalAttribute } from 'cbioportal-ts-api-client';
import { sortByClinicalAttributePriorityThenName } from './SortUtils';

describe('SortUtils functions', () => {
    it('sortByClinicalAttributePriorityThenName', () => {
        const c1 = {
            clinicalAttributeId: 'test1',
            count: 1,
            datatype: 'NUMBER',
            description: '',
            displayName: 'name1',
            patientAttribute: true,
            priority: '1',
            studyId: 's1',
        } as ClinicalAttribute;

        const c2 = {
            clinicalAttributeId: 'test2',
            count: 21,
            datatype: 'NUMBER',
            description: '',
            displayName: 'name2',
            patientAttribute: true,
            priority: '2',
            studyId: 's1',
        } as ClinicalAttribute;

        const c3 = {
            clinicalAttributeId: 'test3',
            count: 21,
            datatype: 'NUMBER',
            description: '',
            displayName: 'name3',
            patientAttribute: true,
            priority: '2',
            studyId: 's1',
        } as ClinicalAttribute;

        assert.isTrue(sortByClinicalAttributePriorityThenName(c1, c2) > 0);
        assert.isTrue(sortByClinicalAttributePriorityThenName(c2, c3) < 0);
        assert.isTrue(sortByClinicalAttributePriorityThenName(c3, c3) === 0);
    });
});
