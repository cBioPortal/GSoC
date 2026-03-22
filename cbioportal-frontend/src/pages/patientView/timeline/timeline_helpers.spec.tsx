import { allResultValuesAreNumerical } from 'pages/patientView/timeline/timeline_helpers';
import { assert } from 'chai';
import { TimelineEvent } from 'cbioportal-clinical-timeline';

describe('#allResultValuesAreNumerical', () => {
    var events = [] as TimelineEvent[];

    beforeEach(() => {
        events = [
            {
                event: {
                    attributes: [{ key: 'RESULT', value: '0.6' }],
                },
            },
            {
                event: {
                    attributes: [{ key: 'RESULT', value: '10' }],
                },
            },
        ] as TimelineEvent[];
    });

    it('catches all numerical condition', () => {
        assert.isTrue(allResultValuesAreNumerical(events));
    });

    it('catches non numerical', () => {
        events.push({
            event: {
                attributes: [{ key: 'RESULT', value: 'S' }],
            },
        } as TimelineEvent);
        assert.isFalse(allResultValuesAreNumerical(events));
    });

    it('handles zero as numeric', () => {
        events.push({
            event: {
                attributes: [{ key: 'RESULT', value: '0' }],
            },
        } as TimelineEvent);
        assert.isTrue(allResultValuesAreNumerical(events));
    });

    it('catches missing RESULT attribute', () => {
        events.push(({
            event: {
                attributes: [],
            },
        } as any) as TimelineEvent);
        assert.isFalse(allResultValuesAreNumerical(events));
    });
});
