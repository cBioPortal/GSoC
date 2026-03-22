import { assert } from 'chai';

import { CopyNumberSeg } from 'cbioportal-ts-api-client';
import {
    calcIgvTrackHeight,
    featuresWithoutFunctions,
    generateSegmentFeatures,
    generateSegmentFileContent,
    getModifiedTrackNames,
} from './IGVUtils';

describe('IGVUtils', () => {
    let segments: CopyNumberSeg[];

    beforeAll(() => {
        segments = [
            {
                uniqueSampleKey: 'VENHQS0xMy0xNTEwLTAxOm92X3RjZ2FfcHVi',
                uniquePatientKey: 'VENHQS0xMy0xNTEwOm92X3RjZ2FfcHVi',
                patientId: 'TCGA-13-1510',
                start: 3218610,
                end: 4734076,
                segmentMean: -0.6819,
                studyId: 'ov_tcga_pub',
                sampleId: 'TCGA-13-1510-01',
                chromosome: '1',
                numberOfProbes: 941,
            },
            {
                uniqueSampleKey: 'VENHQS0xMy0xNTEwLTAxOm92X3RjZ2FfcHVi',
                uniquePatientKey: 'VENHQS0xMy0xNTEwOm92X3RjZ2FfcHVi',
                patientId: 'TCGA-13-1510',
                start: 4734514,
                end: 4735056,
                segmentMean: -2.742,
                studyId: 'ov_tcga_pub',
                sampleId: 'TCGA-13-1510-01',
                chromosome: '1',
                numberOfProbes: 2,
            },
            {
                uniqueSampleKey: 'VENHQS0xMy0xNTEwLTAxOm92X3RjZ2FfcHVi',
                uniquePatientKey: 'VENHQS0xMy0xNTEwOm92X3RjZ2FfcHVi',
                patientId: 'TCGA-13-1510',
                start: 4735908,
                end: 12155936,
                segmentMean: -0.6566,
                studyId: 'ov_tcga_pub',
                sampleId: 'TCGA-13-1510-01',
                chromosome: '1',
                numberOfProbes: 3984,
            },
            {
                uniqueSampleKey: 'VENHQS0xMy0xNTEwLTAxOm92X3RjZ2FfcHVi',
                uniquePatientKey: 'VENHQS0xMy0xNTEwOm92X3RjZ2FfcHVi',
                patientId: 'TCGA-13-1510',
                start: 12156236,
                end: 12262792,
                segmentMean: 0.1393,
                studyId: 'ov_tcga_pub',
                sampleId: 'TCGA-13-1510-01',
                chromosome: '1',
                numberOfProbes: 77,
            },
            {
                uniqueSampleKey: 'VENHQS0xMy0xNTEwLTAxOm92X3RjZ2FfcHVi',
                uniquePatientKey: 'VENHQS0xMy0xNTEwOm92X3RjZ2FfcHVi',
                patientId: 'TCGA-13-1510',
                start: 12264355,
                end: 26281561,
                segmentMean: -0.6842,
                studyId: 'ov_tcga_pub',
                sampleId: 'TCGA-13-1510-01',
                chromosome: '1',
                numberOfProbes: 7347,
            },
            {
                uniqueSampleKey: 'VENHQS0xMy0xNTEwLTAxOm92X3RjZ2FfcHVi',
                uniquePatientKey: 'VENHQS0xMy0xNTEwOm92X3RjZ2FfcHVi',
                patientId: 'TCGA-13-1510',
                start: 26282396,
                end: 26355640,
                segmentMean: 0.1718,
                studyId: 'ov_tcga_pub',
                sampleId: 'TCGA-13-1510-01',
                chromosome: '1',
                numberOfProbes: 41,
            },
            {
                uniqueSampleKey: 'VENHQS0xMy0xNTEwLTAxOm92X3RjZ2FfcHVi',
                uniquePatientKey: 'VENHQS0xMy0xNTEwOm92X3RjZ2FfcHVi',
                patientId: 'TCGA-13-1510',
                start: 26361404,
                end: 30593096,
                segmentMean: -0.6302,
                studyId: 'ov_tcga_pub',
                sampleId: 'TCGA-13-1510-01',
                chromosome: '23',
                numberOfProbes: 1833,
            },
            {
                uniqueSampleKey: 'VENHQS0xMy0xNTEwLTAxOm92X3RjZ2FfcHVi',
                uniquePatientKey: 'VENHQS0xMy0xNTEwOm92X3RjZ2FfcHVi',
                patientId: 'TCGA-13-1510',
                start: 30593355,
                end: 35255680,
                segmentMean: 0.103,
                studyId: 'ov_tcga_pub',
                sampleId: 'TCGA-13-1510-01',
                chromosome: '24',
                numberOfProbes: 2587,
            },
        ];
    });

    describe('generateSegmentFileContent', () => {
        it('generates only the header for empty input', () => {
            assert.equal(
                generateSegmentFileContent([]),
                'ID\tchrom\tloc.start\tloc.end\tnum.mark\tseg.mean'
            );
        });

        it('generates proper row data for non-empty input', () => {
            assert.equal(
                generateSegmentFileContent(segments),
                'ID\tchrom\tloc.start\tloc.end\tnum.mark\tseg.mean\n' +
                    'TCGA-13-1510-01\t1\t3218610\t4734076\t941\t-0.6819\n' +
                    'TCGA-13-1510-01\t1\t4734514\t4735056\t2\t-2.742\n' +
                    'TCGA-13-1510-01\t1\t4735908\t12155936\t3984\t-0.6566\n' +
                    'TCGA-13-1510-01\t1\t12156236\t12262792\t77\t0.1393\n' +
                    'TCGA-13-1510-01\t1\t12264355\t26281561\t7347\t-0.6842\n' +
                    'TCGA-13-1510-01\t1\t26282396\t26355640\t41\t0.1718\n' +
                    'TCGA-13-1510-01\t23\t26361404\t30593096\t1833\t-0.6302\n' +
                    'TCGA-13-1510-01\t24\t30593355\t35255680\t2587\t0.103'
            );
        });
    });

    describe('generateSegmentFeatures', () => {
        it('generates an empty array for empty input', () => {
            assert.equal(generateSegmentFeatures([]).length, 0);
        });

        it('generates proper segment features for non-empty input', () => {
            assert.deepEqual(
                featuresWithoutFunctions(generateSegmentFeatures(segments)),
                [
                    {
                        sampleKey: 'TCGA-13-1510-01',
                        patient: 'TCGA-13-1510',
                        start: 3218610,
                        end: 4734076,
                        value: -0.6819,
                        study: 'ov_tcga_pub',
                        sample: 'TCGA-13-1510-01',
                        chr: '1',
                        numberOfProbes: 941,
                    },
                    {
                        sampleKey: 'TCGA-13-1510-01',
                        patient: 'TCGA-13-1510',
                        start: 4734514,
                        end: 4735056,
                        value: -2.742,
                        study: 'ov_tcga_pub',
                        sample: 'TCGA-13-1510-01',
                        chr: '1',
                        numberOfProbes: 2,
                    },
                    {
                        sampleKey: 'TCGA-13-1510-01',
                        patient: 'TCGA-13-1510',
                        start: 4735908,
                        end: 12155936,
                        value: -0.6566,
                        study: 'ov_tcga_pub',
                        sample: 'TCGA-13-1510-01',
                        chr: '1',
                        numberOfProbes: 3984,
                    },
                    {
                        sampleKey: 'TCGA-13-1510-01',
                        patient: 'TCGA-13-1510',
                        start: 12156236,
                        end: 12262792,
                        value: 0.1393,
                        study: 'ov_tcga_pub',
                        sample: 'TCGA-13-1510-01',
                        chr: '1',
                        numberOfProbes: 77,
                    },
                    {
                        sampleKey: 'TCGA-13-1510-01',
                        patient: 'TCGA-13-1510',
                        start: 12264355,
                        end: 26281561,
                        value: -0.6842,
                        study: 'ov_tcga_pub',
                        sample: 'TCGA-13-1510-01',
                        chr: '1',
                        numberOfProbes: 7347,
                    },
                    {
                        sampleKey: 'TCGA-13-1510-01',
                        patient: 'TCGA-13-1510',
                        start: 26282396,
                        end: 26355640,
                        value: 0.1718,
                        study: 'ov_tcga_pub',
                        sample: 'TCGA-13-1510-01',
                        chr: '1',
                        numberOfProbes: 41,
                    },
                    {
                        sampleKey: 'TCGA-13-1510-01',
                        patient: 'TCGA-13-1510',
                        start: 26361404,
                        end: 30593096,
                        value: -0.6302,
                        study: 'ov_tcga_pub',
                        sample: 'TCGA-13-1510-01',
                        chr: 'X',
                        numberOfProbes: 1833,
                    },
                    {
                        sampleKey: 'TCGA-13-1510-01',
                        patient: 'TCGA-13-1510',
                        start: 30593355,
                        end: 35255680,
                        value: 0.103,
                        study: 'ov_tcga_pub',
                        sample: 'TCGA-13-1510-01',
                        chr: 'Y',
                        numberOfProbes: 2587,
                    },
                ]
            );
        });
    });

    describe('calcIgvTrackHeight', () => {
        it('returns the default min height for the empty input', () => {
            assert.equal(calcIgvTrackHeight([]), 25);
        });

        it('returns the default min height for an input with too few samples', () => {
            const features: any[] = [
                { sampleKey: 'sample1' },
                { sampleKey: 'sample2' },
            ];

            assert.equal(calcIgvTrackHeight(features), 25);
        });

        it('returns a value between min and max for moderate number of samples', () => {
            // generate a dummy list of features with 20 samples
            const features: any[] = [...Array(20).keys()].map(key => ({
                sampleKey: `sample${key}`,
            }));

            assert.equal(calcIgvTrackHeight(features), 200);
        });

        it('returns the default max height for large number of samples', () => {
            // generate a dummy list of features with 100 samples
            const features: any[] = [...Array(100).keys()].map(key => ({
                sampleKey: `sample${key}`,
            }));

            assert.equal(calcIgvTrackHeight(features), 600);
        });
    });

    describe('getModifiedTrackNames', () => {
        it('returns an empty array for empty input', () => {
            assert.equal(getModifiedTrackNames([], []).length, 0);
        });

        it('returns newly added track names', () => {
            const currentTracks = [
                {
                    name: 'MUT',
                    type: 'variant',
                },
            ];

            const nextTracks = [
                {
                    name: 'CNA',
                    type: 'seg',
                    displayMode: 'FILL',
                    features: [],
                },
                {
                    name: 'MUT',
                    type: 'variant',
                },
            ];

            assert.equal(
                getModifiedTrackNames(currentTracks, nextTracks)[0],
                'CNA'
            );
        });

        it('returns an empty array if no track has been changed', () => {
            const currentTracks = [
                {
                    name: 'MUT',
                    type: 'variant',
                },
                {
                    name: 'CNA',
                    type: 'seg',
                    displayMode: 'FILL',
                    features: [],
                },
            ];

            const nextTracks = [
                {
                    name: 'CNA',
                    type: 'seg',
                    displayMode: 'FILL',
                    features: [],
                },
                {
                    name: 'MUT',
                    type: 'variant',
                },
            ];

            assert.equal(
                getModifiedTrackNames(currentTracks, nextTracks).length,
                0
            );
        });

        it('returns only modified tracks names', () => {
            const currentTracks = [
                {
                    name: 'CNA',
                    type: 'seg',
                    displayMode: 'FILL',
                    features: [],
                },
                {
                    name: 'MUT',
                    type: 'variant',
                },
            ];

            const nextTracks = [
                {
                    name: 'MUT',
                    type: 'variant',
                },
                {
                    name: 'CNA',
                    type: 'seg',
                    displayMode: 'FILL',
                    features: [
                        {
                            patient: 'p1',
                            sample: 's1',
                        },
                    ],
                },
            ];

            assert.equal(
                getModifiedTrackNames(currentTracks, nextTracks).length,
                1
            );
            assert.equal(
                getModifiedTrackNames(currentTracks, nextTracks)[0],
                'CNA'
            );
        });
    });
});
