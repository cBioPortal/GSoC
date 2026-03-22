import React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';
import FrequencyBar from './FrequencyBar';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

describe('FrequencyBar', () => {
    const props = {
        totalCount: 100,
        counts: [43, 6],
        freqColors: ['#666', 'maroon'],
        barColor: 'black',
        barWidth: 50,
        barHeight: 15,
        textMargin: 10,
        textWidth: 40,
        tooltip: <span>This used to be an amazing bar.</span>,
    };

    let component: ReactWrapper<any, any>;
    let rootSvg: ReactWrapper<any, any>;
    let barRect: ReactWrapper<any, any>;
    let mainFreqRect: ReactWrapper<any, any>;
    let secondaryFreqRect: ReactWrapper<any, any>;

    beforeAll(() => {
        component = mount(<FrequencyBar {...props} />);
        rootSvg = component.find('svg');
        barRect = rootSvg.find('rect').find('[width=50]');
        mainFreqRect = rootSvg.find('rect').find(`[width=${(43 / 100) * 50}]`);
        secondaryFreqRect = rootSvg
            .find('rect')
            .find(`[width=${(6 / 100) * 50}]`);
    });

    it('renders the components with correct dimensions', () => {
        assert.equal(
            rootSvg.prop('width'),
            50 + 10 + 40,
            'total width should respect bar width and text margin'
        );

        assert.isTrue(
            barRect.exists(),
            'main bar rectangle should exist with correct width'
        );

        assert.isTrue(
            mainFreqRect.exists(),
            'main frequency rectangle should exist with correct width'
        );

        assert.isTrue(
            secondaryFreqRect.exists(),
            'main frequency rectangle should exist with correct width'
        );
    });

    it('renders the components with correct fill color', () => {
        assert.equal(
            mainFreqRect.prop('fill'),
            '#666',
            'main frequency rectangle should have the designated fill color'
        );

        assert.equal(
            secondaryFreqRect.prop('fill'),
            'maroon',
            'secondary frequency rectangle should have the designated fill color'
        );

        assert.equal(
            barRect.prop('fill'),
            'black',
            'main bar should have the designated fill color'
        );
    });

    it('renders the component with correct content', () => {
        assert.equal(
            rootSvg.find('text').prop('x'),
            50 + 10,
            'percentage text position should respect bar width and text margin'
        );

        assert.equal(
            rootSvg.find('text').text(),
            '43%',
            'percentage text should reflect only the first value in the count array'
        );

        assert.isTrue(
            component.find(DefaultTooltip).exists(),
            'component should have a tooltip'
        );
    });
});
