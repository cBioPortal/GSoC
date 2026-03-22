import { assert } from 'chai';
import expect from 'expect';
import expectJSX from 'expect-jsx';
import * as React from 'react';
expect.extend(expectJSX);
import {
    getExcludedIndexes,
    getStudiesAttrForPatientOverlapGroup,
    getStudiesAttrForSampleOverlapGroup,
    getTextColor,
    joinGroupNames,
} from './OverlapUtils';
import { assertDeepEqualInAnyOrder } from '../../shared/lib/SpecUtils';
import ComplexKeyGroupsMap from '../../shared/lib/complexKeyDataStructures/ComplexKeyGroupsMap';
import { Sample } from 'cbioportal-ts-api-client';
import _ from 'lodash';

describe('OverlapUtils', () => {
    describe('getExcludedIndexes', () => {
        it('empty input', () => {
            assert.deepEqual(getExcludedIndexes([], 5), [0, 1, 2, 3, 4]);
            assert.deepEqual(getExcludedIndexes([], 2), [0, 1]);
            assert.deepEqual(getExcludedIndexes([], 0), []);
        });
        it('nonempty input', () => {
            assert.deepEqual(getExcludedIndexes([2, 4], 5), [0, 1, 3]);
            assert.deepEqual(getExcludedIndexes([1], 2), [0]);
            assert.deepEqual(getExcludedIndexes([0, 3, 1], 4), [2]);
        });
        it('empty output', () => {
            assert.deepEqual(getExcludedIndexes([0, 2, 1], 3), []);
            assert.deepEqual(getExcludedIndexes([1, 5, 3, 2, 0, 4], 6), []);
            assert.deepEqual(getExcludedIndexes([], 0), []);
            assert.deepEqual(getExcludedIndexes([0], 1), []);
            assert.deepEqual(getExcludedIndexes([0, 1], 2), []);
        });
    });

    describe('joinGroupNames', () => {
        it('gives right result for several numbers of names', () => {
            expect(joinGroupNames([], 'conj')).toEqualJSX(<span></span>);
            expect(
                joinGroupNames([{ name: 'nameA', ordinal: '1' }], 'and')
            ).toEqualJSX(
                <span>
                    <>
                        (<strong>1</strong>)&nbsp;
                    </>
                    <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                        nameA
                    </span>
                </span>
            );
            expect(
                joinGroupNames(
                    [
                        { name: 'nameA', ordinal: '1' },
                        { name: 'nameB', ordinal: 'B' },
                    ],
                    'and'
                )
            ).toEqualJSX(
                <span>
                    <span>
                        <>
                            (<strong>1</strong>)&nbsp;
                        </>
                        <span
                            style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                            nameA
                        </span>
                    </span>{' '}
                    and{' '}
                    <span>
                        <>
                            (<strong>B</strong>)&nbsp;
                        </>
                        <span
                            style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                            nameB
                        </span>
                    </span>
                </span>
            );
            expect(
                joinGroupNames(
                    [
                        { name: 'nameA', ordinal: '1' },
                        { name: 'nameB', ordinal: '2' },
                        { name: 'nameC', ordinal: '3' },
                    ],
                    'and'
                )
            ).toEqualJSX(
                <span>
                    <span>
                        <>
                            (<strong>1</strong>)&nbsp;
                        </>
                        <span
                            style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                            nameA
                        </span>
                    </span>
                    ,{' '}
                    <span>
                        <>
                            (<strong>2</strong>)&nbsp;
                        </>
                        <span
                            style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                            nameB
                        </span>
                    </span>
                    , and{' '}
                    <span>
                        <>
                            (<strong>3</strong>)&nbsp;
                        </>
                        <span
                            style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                            nameC
                        </span>
                    </span>
                </span>
            );
            expect(
                joinGroupNames(
                    [
                        { name: 'nameA', ordinal: '1' },
                        { name: 'nameB', ordinal: '2' },
                        { name: 'nameC', ordinal: '3' },
                        { name: 'nameD', ordinal: '4' },
                    ],
                    'and'
                )
            ).toEqualJSX(
                <span>
                    <span>
                        <>
                            (<strong>1</strong>)&nbsp;
                        </>
                        <span
                            style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                            nameA
                        </span>
                    </span>
                    ,{' '}
                    <span>
                        <>
                            (<strong>2</strong>)&nbsp;
                        </>
                        <span
                            style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                            nameB
                        </span>
                    </span>
                    ,{' '}
                    <span>
                        <>
                            (<strong>3</strong>)&nbsp;
                        </>
                        <span
                            style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                            nameC
                        </span>
                    </span>
                    , and{' '}
                    <span>
                        <>
                            (<strong>4</strong>)&nbsp;
                        </>
                        <span
                            style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                            nameD
                        </span>
                    </span>
                </span>
            );
        });
    });

    describe('getTextColor', () => {
        it('gives right result for basic cases', () => {
            assert.equal(getTextColor('#ffffff'), 'black');
            assert.equal(getTextColor('#d3fff5'), 'black');
            assert.equal(getTextColor('#fff5b9'), 'black');
            assert.equal(getTextColor('#000000'), 'white');
            assert.equal(getTextColor('#22152b'), 'white');
            assert.equal(getTextColor('#0f2912'), 'white', '3');
        });
        it('gives right result for basic cases, inverted', () => {
            assert.equal(getTextColor('#ffffff', true), 'white');
            assert.equal(getTextColor('#d3fff5', true), 'white');
            assert.equal(getTextColor('#fff5b9', true), 'white');
            assert.equal(getTextColor('#000000', true), 'black');
            assert.equal(getTextColor('#22152b', true), 'black');
            assert.equal(getTextColor('#0f2912', true), 'black');
        });
    });

    describe('getStudiesAttrForSampleOverlapGroup', () => {
        const groups = [
            {
                uid: 'group0',
                studies: [
                    {
                        id: 'study1',
                        samples: ['1', '2', '3'],
                    },
                    {
                        id: 'study2',
                        samples: ['1', '2'],
                    },
                ],
            },
            {
                uid: 'group1',
                studies: [
                    {
                        id: 'study1',
                        samples: ['2'],
                    },
                    {
                        id: 'study3',
                        samples: ['1', '2', '3', '4'],
                    },
                ],
            },
            {
                uid: 'group2',
                studies: [
                    {
                        id: 'study1',
                        samples: ['1', '3'],
                    },
                ],
            },
            {
                uid: 'group3',
                studies: [
                    {
                        id: 'study3',
                        samples: ['4', '5'],
                    },
                    {
                        id: 'study4',
                        samples: ['1', '2', '3'],
                    },
                ],
            },
            {
                uid: 'group4',
                studies: [
                    {
                        id: 'study1',
                        samples: ['3'],
                    },
                ],
            },
            {
                uid: 'group5',
                studies: [
                    {
                        id: 'study4',
                        samples: ['1', '2', '3', '4'],
                    },
                    {
                        id: 'study1',
                        samples: ['4', '5', '6', '2'],
                    },
                    {
                        id: 'study2',
                        samples: ['2', '3', '4'],
                    },
                ],
            },
        ];
        it('one region, 1/1 group in it', () => {
            for (const group of groups) {
                assert.deepEqual(
                    getStudiesAttrForSampleOverlapGroup(
                        groups,
                        [[group.uid]],
                        [group.uid]
                    ),
                    group.studies,
                    group.uid
                );
            }
        });
        it('one region, 1/2 groups in it', () => {
            assertDeepEqualInAnyOrder(
                getStudiesAttrForSampleOverlapGroup(
                    groups,
                    [[groups[0].uid]],
                    [groups[0].uid, groups[1].uid]
                ),
                [
                    {
                        id: 'study1',
                        samples: ['1', '3'],
                    },
                    {
                        id: 'study2',
                        samples: ['1', '2'],
                    },
                ],
                '0 of 0,1'
            );

            assertDeepEqualInAnyOrder(
                getStudiesAttrForSampleOverlapGroup(
                    groups,
                    [[groups[1].uid]],
                    [groups[0].uid, groups[1].uid]
                ),
                [
                    {
                        id: 'study3',
                        samples: ['1', '2', '3', '4'],
                    },
                ],
                '1 of 0,1'
            );
        });
        it('two regions, out of 3 groups', () => {
            assertDeepEqualInAnyOrder(
                getStudiesAttrForSampleOverlapGroup(
                    groups,
                    [[groups[0].uid], [groups[1].uid, groups[2].uid]],
                    [groups[0].uid, groups[1].uid, groups[2].uid]
                ),
                [
                    {
                        id: 'study2',
                        samples: ['1', '2'],
                    },
                ],
                '0 + 1,2 of 0,1,2'
            );
        });
        it('three regions, out of 4 groups', () => {
            assertDeepEqualInAnyOrder(
                getStudiesAttrForSampleOverlapGroup(
                    groups,
                    [
                        [groups[5].uid, groups[3].uid],
                        [groups[0].uid, groups[5].uid],
                        [groups[1].uid],
                    ],
                    [groups[0].uid, groups[1].uid, groups[3].uid, groups[5].uid]
                ),
                [
                    {
                        id: 'study4',
                        samples: ['1', '2', '3'],
                    },
                    {
                        id: 'study2',
                        samples: ['2'],
                    },
                    {
                        id: 'study3',
                        samples: ['1', '2', '3'],
                    },
                ]
            );
        });
        it('3 singleton regions, out of 3 groups', () => {
            assertDeepEqualInAnyOrder(
                getStudiesAttrForSampleOverlapGroup(
                    groups,
                    [[groups[0].uid], [groups[1].uid], [groups[2].uid]],
                    [groups[0].uid, groups[1].uid, groups[2].uid]
                ),
                [
                    {
                        id: 'study2',
                        samples: ['1', '2'],
                    },
                    {
                        id: 'study3',
                        samples: ['1', '2', '3', '4'],
                    },
                ]
            );
        });
    });

    describe('getStudiesAttrForPatientOverlapGroup', () => {
        const groups = [
            {
                uid: 'group0',
                studies: [
                    {
                        id: 'study1',
                        patients: ['1', '2', '3'],
                    },
                    {
                        id: 'study2',
                        patients: ['1', '2'],
                    },
                ],
            },
            {
                uid: 'group1',
                studies: [
                    {
                        id: 'study1',
                        patients: ['2'],
                    },
                    {
                        id: 'study3',
                        patients: ['1', '2', '3', '4'],
                    },
                ],
            },
            {
                uid: 'group2',
                studies: [
                    {
                        id: 'study1',
                        patients: ['1', '3'],
                    },
                ],
            },
            {
                uid: 'group3',
                studies: [
                    {
                        id: 'study3',
                        patients: ['4', '5'],
                    },
                    {
                        id: 'study4',
                        patients: ['1', '2', '3'],
                    },
                ],
            },
            {
                uid: 'group4',
                studies: [
                    {
                        id: 'study1',
                        patients: ['3'],
                    },
                ],
            },
            {
                uid: 'group5',
                studies: [
                    {
                        id: 'study4',
                        patients: ['1', '2', '3', '4'],
                    },
                    {
                        id: 'study1',
                        patients: ['4', '5', '6', '2'],
                    },
                    {
                        id: 'study2',
                        patients: ['2', '3', '4'],
                    },
                ],
            },
        ];
        let patientToSamplesSet: ComplexKeyGroupsMap<Pick<Sample, 'sampleId'>>;
        beforeAll(() => {
            patientToSamplesSet = new ComplexKeyGroupsMap<
                Pick<Sample, 'sampleId'>
            >();
            for (const studyId of ['study1', 'study2', 'study3', 'study4']) {
                for (const patientId of ['1', '2', '3', '4', '5', '6']) {
                    if (patientId === '1') {
                        patientToSamplesSet.add(
                            { patientId, studyId },
                            { sampleId: '1.1' }
                        );
                        patientToSamplesSet.add(
                            { patientId, studyId },
                            { sampleId: '1.2' }
                        );
                        patientToSamplesSet.add(
                            { patientId, studyId },
                            { sampleId: '1.3' }
                        );
                    } else if (patientId === '2') {
                        patientToSamplesSet.add(
                            { patientId, studyId },
                            { sampleId: '2.1' }
                        );
                        patientToSamplesSet.add(
                            { patientId, studyId },
                            { sampleId: '2.2' }
                        );
                    } else {
                        patientToSamplesSet.add(
                            { patientId, studyId },
                            { sampleId: patientId }
                        );
                    }
                }
            }
        });
        it('one region, 1/1 group in it', () => {
            for (const group of groups) {
                assert.deepEqual(
                    getStudiesAttrForPatientOverlapGroup(
                        groups,
                        [[group.uid]],
                        [group.uid],
                        patientToSamplesSet
                    ),
                    group.studies.map(entry => ({
                        id: entry.id,
                        samples: _.flatMap(entry.patients, patient => {
                            if (patient === '1') {
                                return ['1.1', '1.2', '1.3'];
                            } else if (patient === '2') {
                                return ['2.1', '2.2'];
                            } else {
                                return patient;
                            }
                        }),
                    })),
                    group.uid
                );
            }
        });
        it('one region, 1/2 groups in it', () => {
            assertDeepEqualInAnyOrder(
                getStudiesAttrForPatientOverlapGroup(
                    groups,
                    [[groups[0].uid]],
                    [groups[0].uid, groups[1].uid],
                    patientToSamplesSet
                ),
                [
                    {
                        id: 'study1',
                        samples: ['1.1', '1.2', '1.3', '3'],
                    },
                    {
                        id: 'study2',
                        samples: ['1.1', '1.2', '1.3', '2.1', '2.2'],
                    },
                ],
                '0 of 0,1'
            );

            assertDeepEqualInAnyOrder(
                getStudiesAttrForPatientOverlapGroup(
                    groups,
                    [[groups[1].uid]],
                    [groups[0].uid, groups[1].uid],
                    patientToSamplesSet
                ),
                [
                    {
                        id: 'study3',
                        samples: ['1.1', '1.2', '1.3', '2.1', '2.2', '3', '4'],
                    },
                ],
                '1 of 0,1'
            );
        });
        it('two regions, out of 3 groups', () => {
            assertDeepEqualInAnyOrder(
                getStudiesAttrForPatientOverlapGroup(
                    groups,
                    [[groups[0].uid], [groups[1].uid, groups[2].uid]],
                    [groups[0].uid, groups[1].uid, groups[2].uid],
                    patientToSamplesSet
                ),
                [
                    {
                        id: 'study2',
                        samples: ['1.1', '1.2', '1.3', '2.1', '2.2'],
                    },
                ],
                '0 + 1,2 of 0,1,2'
            );
        });
        it('three regions, out of 4 groups', () => {
            assertDeepEqualInAnyOrder(
                getStudiesAttrForPatientOverlapGroup(
                    groups,
                    [
                        [groups[5].uid, groups[3].uid],
                        [groups[0].uid, groups[5].uid],
                        [groups[1].uid],
                    ],
                    [
                        groups[0].uid,
                        groups[1].uid,
                        groups[3].uid,
                        groups[5].uid,
                    ],
                    patientToSamplesSet
                ),
                [
                    {
                        id: 'study4',
                        samples: ['1.1', '1.2', '1.3', '2.1', '2.2', '3'],
                    },
                    {
                        id: 'study2',
                        samples: ['2.1', '2.2'],
                    },
                    {
                        id: 'study3',
                        samples: ['1.1', '1.2', '1.3', '2.1', '2.2', '3'],
                    },
                ]
            );
        });
        it('3 singleton regions, out of 3 groups', () => {
            assertDeepEqualInAnyOrder(
                getStudiesAttrForPatientOverlapGroup(
                    groups,
                    [[groups[0].uid], [groups[1].uid], [groups[2].uid]],
                    [groups[0].uid, groups[1].uid, groups[2].uid],
                    patientToSamplesSet
                ),
                [
                    {
                        id: 'study2',
                        samples: ['1.1', '1.2', '1.3', '2.1', '2.2'],
                    },
                    {
                        id: 'study3',
                        samples: ['1.1', '1.2', '1.3', '2.1', '2.2', '3', '4'],
                    },
                ]
            );
        });
    });
});
