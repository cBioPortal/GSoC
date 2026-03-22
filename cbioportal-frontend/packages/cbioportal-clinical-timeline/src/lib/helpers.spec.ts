import { assert } from 'chai';
import {
    colorGetterFactory,
    formatDate,
    getAttributeValue,
    getPointInTrimmedSpace,
    segmentAndSortAttributesForTooltip,
} from './helpers';
import intersect from './intersect';
import { TimelineEvent } from '../types';

describe('getPointInTrimmedSpace', () => {
    let ticks: any;

    beforeEach(() => {
        ticks = [
            { start: -20, end: -1, offset: 0 },
            { start: 0, end: 364, offset: 0 },
            {
                start: 365,
                end: 729,
                offset: 0,
            },
            { start: 730, end: 1094, offset: 0 },
            {
                isTrim: true,
                start: 1095,
                end: 1459,
                realEnd: 2189,
                offset: 0,
            },
            { start: 2190, end: 2554, offset: 1095 },
            {
                start: 2555,
                end: 2919,
                offset: 1095,
            },
            { start: 2920, end: 3284, offset: 1095 },
            {
                start: 3285,
                end: 3649,
                offset: 1095,
            },
            { start: 3650, end: 4014, offset: 1095 },
            {
                start: 4015,
                end: 4379,
                offset: 1095,
            },
            { start: 4380, end: 4744, offset: 1095 },
            {
                start: 4745,
                end: 5109,
                offset: 1095,
            },
            { start: 5110, end: 5474, offset: 1095 },
            {
                start: 5475,
                end: 5839,
                offset: 1095,
            },
            { start: 5840, end: 6204, offset: 1095 },
            {
                start: 6205,
                end: 6569,
                offset: 1095,
            },
            {
                isTrim: true,
                start: 6570,
                end: 6934,
                realEnd: 7299,
                offset: 1095,
            },
            {
                start: 7300,
                end: 7664,
                offset: 1337,
            },
            { start: 7665, end: 7785, offset: 1337 },
        ];
    });

    it('', () => {
        assert.isUndefined(
            getPointInTrimmedSpace(-21, ticks),
            'point prior to start of first tick is undefined'
        );

        assert.equal(
            getPointInTrimmedSpace(-20, ticks),
            -20,
            'point at start of first tick is equal to itself'
        );

        assert.equal(
            getPointInTrimmedSpace(-1, ticks),
            -1,
            'point at end of first tick is equal to itself'
        );

        assert.equal(
            getPointInTrimmedSpace(-1, ticks),
            -1,
            'point at end of first tick is equal to itself'
        );
    });

    it('points around/after trim regions incorporate trims', () => {
        assert.equal(getPointInTrimmedSpace(0, ticks), 0);
        assert.equal(getPointInTrimmedSpace(20, ticks), 20);
        assert.equal(
            getPointInTrimmedSpace(1500, ticks),
            1095,
            'point in trimmed region maps to start of trim'
        );
        assert.equal(
            getPointInTrimmedSpace(2200, ticks),
            1105,
            'point after trim observers is reduced by offset'
        );
    });

    it('point outside of limit returns undefined', () => {
        assert.equal(getPointInTrimmedSpace(-21, ticks), undefined);
        assert.equal(getPointInTrimmedSpace(7786, ticks), undefined);
    });
});

describe('intersect', () => {
    it('detects overlaps', () => {
        assert.isTrue(intersect(-100, -10, -50, 20), 'overlap');
        assert.isTrue(intersect(-50, 20, -100, -10), 'overlap');
        assert.isTrue(intersect(-100, -10, -10, 20), 'overlap single point');
        assert.isTrue(
            intersect(-100, -10, -30, -20),
            'one contains other - negative'
        );
        assert.isTrue(
            intersect(100, 110, 105, 108),
            'one contains other - positive'
        );
        assert.isTrue(
            intersect(-10, 5, -5, 3),
            'one contains other - spanning zero'
        );
        assert.isFalse(intersect(-100, -10, -9, 20), 'no overlap');

        assert.isTrue(intersect(100, -10, -9, 20), 'reversed coordinates');
    });
});

describe('formatDate', () => {
    it('formats correctly', () => {
        assert.equal(formatDate(0), '0 days');
        assert.equal(formatDate(1), '1 day');
        assert.equal(formatDate(29), '29 days');
        assert.equal(formatDate(31), '1 month, 1 day');
        assert.equal(formatDate(59), '1 month, 29 days');
        assert.equal(formatDate(365), '1 year');
        assert.equal(formatDate(365 * 2), '2 years');
        assert.equal(formatDate(365 * 3), '3 years');
        assert.equal(formatDate(365 * 3 + 1), '3 years, 1 day');
        assert.equal(
            formatDate(365 * 3 + 30 * 2 + 1),
            '3 years, 2 months, 1 day'
        );
    });
});

describe('getAttributeValue', () => {
    it('gets attribute value by regexp', () => {
        const event: TimelineEvent = {
            end: 13524,
            start: 13524,
            event: {
                uniquePatientKey: 'UC0wMDAwMDA0Om1za2ltcGFjdF90ZXN0X2p1bmU',
                studyId: 'mskimpact_test_june',
                patientId: 'P-0000004',
                eventType: 'Sample acquisition',
                attributes: [
                    { key: 'SURGICAL_METHOD', value: 'Biopsy' },
                    {
                        key: 'SAMPLE_TYPE',
                        value: 'Primary',
                    },
                    {
                        key: 'CANCER_TYPE_DETAILED',
                        value: 'Breast Invasive Ductal Carcinoma',
                    },
                    {
                        key: 'SAMPLE_ID',
                        value: 'P-0000004-T01-IM3',
                    },
                    { key: 'CANCER_TYPE', value: 'Breast Cancer' },
                ],
                startNumberOfDaysSinceDiagnosis: 13524,
            },
        } as any;

        assert.equal(
            getAttributeValue('CANCER_TYPE_DETAILED', event),
            'Breast Invasive Ductal Carcinoma'
        );
        assert.equal(
            getAttributeValue(/_DETAILED/, event),
            'Breast Invasive Ductal Carcinoma'
        );
        assert.equal(getAttributeValue('CANCER_TYPE_DETA', event), undefined);
    });
});

describe('color getter helpers', () => {
    it('colorGetterFactory resolves to custom getter or default', () => {
        const ev = ({
            event: {
                attributes: [{ key: 'STYLE_COLOR', value: '#12345' }],
            },
        } as unknown) as TimelineEvent;

        assert.equal(
            colorGetterFactory(undefined)(ev),
            '#12345',
            'if no custom getter passwed, we default getter plucks color from STYLE_COLOR'
        );

        assert.equal(
            colorGetterFactory(() => {})(ev),
            '#12345',
            'if custom color getter returns void, we use default color getter'
        );

        assert.equal(
            colorGetterFactory(() => undefined)(ev),
            '#12345',
            'if custom color getter returns undefined, we use default color getter'
        );

        assert.equal(
            colorGetterFactory(() => '#54321')(ev),
            '#54321',
            'if there IS a custom getter, it gets used'
        );
    });

    it('colorGetterFactory returns default color if there is not STYLE_COLOR attr', () => {
        const ev = ({
            event: {
                attributes: [],
            },
        } as unknown) as TimelineEvent;

        assert.equal(
            colorGetterFactory(undefined)(ev),
            'rgb(31, 119, 180)',
            'if no custom getter passwed, we default getter plucks color from STYLE_COLOR'
        );
    });
});

describe('order attributes according to config', () => {
    const atts = [
        { key: 'key1', value: 'someValue' },
        { key: 'key2', value: 'someValue' },
        { key: 'key3', value: 'someValue' },
        { key: 'key4', value: 'someValue' },
    ];

    it('places attributes in order by config', () => {
        const processedAtts = segmentAndSortAttributesForTooltip(atts, [
            'key4',
            'key2',
        ]);

        assert.deepEqual(
            processedAtts.map(a => a.key),
            ['key4', 'key2', 'key1', 'key3']
        );
    });

    it('handles missing attributes in config', () => {
        const processedAtts = segmentAndSortAttributesForTooltip(atts, [
            'key10',
            'key2',
        ]);

        assert.deepEqual(
            processedAtts.map(a => a.key),
            ['key2', 'key1', 'key3', 'key4']
        );
    });
});
