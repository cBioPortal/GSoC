import { assert } from 'chai';
import { alphabeticalDefault, stringClinicalComparator } from './SortUtils';

describe('SortUtils', () => {
    describe('alphabeticalDefault', () => {
        let cmp: (d1: any, d2: any) => number;
        beforeAll(() => {
            cmp = alphabeticalDefault((d1: any, d2: any) => {
                const res = d1.val - d2.val;
                if (res < 0) {
                    return -1;
                } else if (res > 0) {
                    return 1;
                } else {
                    return 0;
                }
            });
        });
        it('should return -1 when the input comparator returns -1 (d1.val < d2.val)', () => {
            assert.equal(
                cmp({ val: 0, sample: 'a' }, { val: 1, sample: 'b' }),
                -1
            );
            assert.equal(
                cmp({ val: -1, sample: 'a' }, { val: 1, sample: 'b' }),
                -1
            );
            assert.equal(
                cmp({ val: -2, sample: 'a' }, { val: -1, sample: 'b' }),
                -1
            );
            assert.equal(
                cmp({ val: 4, sample: 'a' }, { val: 5, sample: 'b' }),
                -1
            );
        });
        it('should return 1 when the input comparator returns 1 (d1.val > d2.val)', () => {
            assert.equal(
                cmp({ val: 1, sample: 'b' }, { val: 0, sample: 'a' }),
                1
            );
            assert.equal(
                cmp({ val: 1, sample: 'b' }, { val: -1, sample: 'a' }),
                1
            );
            assert.equal(
                cmp({ val: -1, sample: 'b' }, { val: -2, sample: 'a' }),
                1
            );
            assert.equal(
                cmp({ val: 5, sample: 'b' }, { val: 4, sample: 'a' }),
                1
            );
        });
        it('should return -1 when the input comparator returns 0 (d1.val = d2.val) and d1.sample alphabetically before d2.sample', () => {
            assert.equal(
                cmp({ val: 1, sample: 'a' }, { val: 1, sample: 'b' }),
                -1
            );
            assert.equal(
                cmp({ val: 3, sample: 'A' }, { val: 3, sample: 'B' }),
                -1
            );
            assert.equal(
                cmp(
                    { val: 4, sample: 'sample3' },
                    { val: 4, sample: 'sample15' }
                ),
                -1
            );
            assert.equal(
                cmp({ val: -1, sample: '123' }, { val: -1, sample: '223' }),
                -1
            );
            assert.equal(
                cmp({ val: 0, sample: 'tA' }, { val: 0, sample: 'tB' }),
                -1
            );
        });
        it('should return 1 when the input comparator returns 0 (d1.val = d2.val) and d1.sample alphabetically after d2.sample', () => {
            assert.equal(
                cmp({ val: 1, sample: 'b' }, { val: 1, sample: 'a' }),
                1
            );
            assert.equal(
                cmp({ val: 3, sample: 'B' }, { val: 3, sample: 'A' }),
                1
            );
            assert.equal(
                cmp(
                    { val: 4, sample: 'sample15' },
                    { val: 4, sample: 'sample3' }
                ),
                1
            );
            assert.equal(
                cmp({ val: -1, sample: '223' }, { val: -1, sample: '123' }),
                1
            );
            assert.equal(
                cmp({ val: 0, sample: 'tB' }, { val: 0, sample: 'tA' }),
                1
            );
        });
        it('should return 0 when the input comparator returns 0 (d1.val = d2.val) and d1.sample = d2.sample', () => {
            assert.equal(
                cmp({ val: 1, sample: 'a' }, { val: 1, sample: 'a' }),
                0
            );
            assert.equal(
                cmp({ val: 3, sample: 'A' }, { val: 3, sample: 'A' }),
                0
            );
            assert.equal(
                cmp(
                    { val: 4, sample: 'sampleA' },
                    { val: 4, sample: 'sampleA' }
                ),
                0
            );
            assert.equal(
                cmp({ val: -1, sample: '123' }, { val: -1, sample: '123' }),
                0
            );
            assert.equal(
                cmp({ val: 0, sample: 'tA' }, { val: 0, sample: 'tA' }),
                0
            );
        });
        it('should return -1 when the input comparator returns 0 (d1.val = d2.val) and d1.patient alphabetically before d2.patient', () => {
            assert.equal(
                cmp({ val: 1, patient: 'a' }, { val: 1, patient: 'b' }),
                -1
            );
            assert.equal(
                cmp({ val: 3, patient: 'A' }, { val: 3, patient: 'B' }),
                -1
            );
            assert.equal(
                cmp(
                    { val: 4, patient: 'patient2' },
                    { val: 4, patient: 'patient12' }
                ),
                -1
            );
            assert.equal(
                cmp({ val: -1, patient: '123' }, { val: -1, patient: '223' }),
                -1
            );
            assert.equal(
                cmp({ val: 0, patient: 'tA' }, { val: 0, patient: 'tB' }),
                -1
            );
        });
        it('should return 1 when the input comparator returns 0 (d1.val = d2.val) and d1.patient alphabetically after d2.patient', () => {
            assert.equal(
                cmp({ val: 1, patient: 'b' }, { val: 1, patient: 'a' }),
                1
            );
            assert.equal(
                cmp({ val: 3, patient: 'B' }, { val: 3, patient: 'A' }),
                1
            );
            assert.equal(
                cmp(
                    { val: 4, patient: 'patient12' },
                    { val: 4, patient: 'patient2' }
                ),
                1
            );
            assert.equal(
                cmp({ val: -1, patient: '223' }, { val: -1, patient: '123' }),
                1
            );
            assert.equal(
                cmp({ val: 0, patient: 'tB' }, { val: 0, patient: 'tA' }),
                1
            );
        });
        it('should return 0 when the input comparator returns 0 (d1.val = d2.val) and d1.patient = d2.patient', () => {
            assert.equal(
                cmp({ val: 1, patient: 'a' }, { val: 1, patient: 'a' }),
                0
            );
            assert.equal(
                cmp({ val: 3, patient: 'A' }, { val: 3, patient: 'A' }),
                0
            );
            assert.equal(
                cmp(
                    { val: 4, patient: 'patientA' },
                    { val: 4, patient: 'patientA' }
                ),
                0
            );
            assert.equal(
                cmp({ val: -1, patient: '123' }, { val: -1, patient: '123' }),
                0
            );
            assert.equal(
                cmp({ val: 0, patient: 'tA' }, { val: 0, patient: 'tA' }),
                0
            );
        });
    });

    describe('stringClinicalComparator', () => {
        it('should return -1 when neither have na and first attr_val comes before second', () => {
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'a' },
                    { na: false, attr_val: 'b' }
                ),
                -1
            );
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'cancerA' },
                    { na: false, attr_val: 'cancerB' }
                ),
                -1
            );
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'cancer2' },
                    { na: false, attr_val: 'cancer12' }
                ),
                -1
            );
        });
        it('should return 1 when neither have na and first attr_val comes after second', () => {
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'b' },
                    { na: false, attr_val: 'a' }
                ),
                1
            );
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'cancerB' },
                    { na: false, attr_val: 'cancerA' }
                ),
                1
            );
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'cancer12' },
                    { na: false, attr_val: 'cancer2' }
                ),
                1
            );
        });
        it('should return 0 when neither have na and first attr_val equals second', () => {
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'a' },
                    { na: false, attr_val: 'a' }
                ),
                0
            );
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'cancerA' },
                    { na: false, attr_val: 'cancerA' }
                ),
                0
            );
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'cancer2' },
                    { na: false, attr_val: 'cancer2' }
                ),
                0
            );
        });
        it('should return 0 when both have na', () => {
            assert.equal(
                stringClinicalComparator(
                    { na: true, attr_val: 'a' },
                    { na: true, attr_val: 'b' }
                ),
                0
            );
            assert.equal(
                stringClinicalComparator(
                    { na: true, attr_val: 'cancerA' },
                    { na: true, attr_val: 'cancerB' }
                ),
                0
            );
            assert.equal(
                stringClinicalComparator(
                    { na: true, attr_val: 'cancer2' },
                    { na: true, attr_val: 'cancer12' }
                ),
                0
            );
        });
        it('should return 2 when first has na and second doesnt', () => {
            assert.equal(
                stringClinicalComparator(
                    { na: true, attr_val: 'a' },
                    { na: false, attr_val: 'b' }
                ),
                2
            );
            assert.equal(
                stringClinicalComparator(
                    { na: true, attr_val: 'cancerA' },
                    { na: false, attr_val: 'cancerB' }
                ),
                2
            );
            assert.equal(
                stringClinicalComparator(
                    { na: true, attr_val: 'cancer2' },
                    { na: false, attr_val: 'cancer12' }
                ),
                2
            );
            assert.equal(
                stringClinicalComparator(
                    { na: true, attr_val: 'b' },
                    { na: false, attr_val: 'a' }
                ),
                2
            );
            assert.equal(
                stringClinicalComparator(
                    { na: true, attr_val: 'cancerB' },
                    { na: false, attr_val: 'cancerA' }
                ),
                2
            );
            assert.equal(
                stringClinicalComparator(
                    { na: true, attr_val: 'cancer12' },
                    { na: false, attr_val: 'cancer2' }
                ),
                2
            );
        });
        it('should return -2 when first doesnt have na and second does', () => {
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'a' },
                    { na: true, attr_val: 'b' }
                ),
                -2
            );
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'cancerA' },
                    { na: true, attr_val: 'cancerB' }
                ),
                -2
            );
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'cancer2' },
                    { na: true, attr_val: 'cancer12' }
                ),
                -2
            );
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'b' },
                    { na: true, attr_val: 'a' }
                ),
                -2
            );
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'cancerB' },
                    { na: true, attr_val: 'cancerA' }
                ),
                -2
            );
            assert.equal(
                stringClinicalComparator(
                    { na: false, attr_val: 'cancer12' },
                    { na: true, attr_val: 'cancer2' }
                ),
                -2
            );
        });
    });
});
