import SampleInline from './SampleInline';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';

describe('SampleInline', () => {
    const defaultProps = {
        sample: {
            id: 'sampleSample',
            clinicalData: [],
        },
        sampleNumber: 6,
        sampleColor: '#DDD666',
        fillOpacity: 0.6,
    };

    let minimalComponent: ReactWrapper<any, any>;
    let defaultComponent: ReactWrapper<any, any>;
    let componentWithExtraTooltipText: ReactWrapper<any, any>;
    let componentWithAdditionalContent: ReactWrapper<any, any>;

    beforeAll(() => {
        defaultComponent = mount(<SampleInline {...defaultProps} />);

        const minimalProps = { ...defaultProps, tooltipEnabled: false };
        minimalComponent = mount(<SampleInline {...minimalProps} />);

        const extraTooltipTextProps = {
            ...defaultProps,
            extraTooltipText: 'Custom Tooltip Text!',
        };
        componentWithExtraTooltipText = mount(
            <SampleInline {...extraTooltipTextProps} />
        );

        const additionalContentProps = {
            ...defaultProps,
            additionalContent: (
                <span className="awesomeCustomAdditionalContent">
                    I am custom!
                </span>
            ),
        };
        componentWithAdditionalContent = mount(
            <SampleInline {...additionalContentProps} />
        );
    });

    it('renders the default component properly', () => {
        assert.isTrue(
            defaultComponent.find(DefaultTooltip).exists(),
            'Default component should have tooltip'
        );

        assert.isFalse(
            defaultComponent.find('span').exists(),
            'Default component should NOT have any additional component than svg'
        );
    });

    it('renders the minimal component properly', () => {
        assert.isFalse(
            minimalComponent.find(DefaultTooltip).exists(),
            'Minimal component should NOT have a tooltip'
        );

        assert.isFalse(
            minimalComponent.find('span').exists(),
            'Minimal component should NOT have any additional component than svg'
        );
    });

    it('renders the component with extra tooltip text properly', () => {
        assert.isTrue(
            componentWithExtraTooltipText.find(DefaultTooltip).exists(),
            'Component should have a tooltip'
        );

        // ideally we should also check for the actual existence of "Custom Tooltip Text!" within the tooltip content

        assert.isFalse(
            componentWithExtraTooltipText.find('span').exists(),
            'Component should NOT have any additional component than svg'
        );
    });

    it('renders the component with additional content properly', () => {
        assert.isTrue(
            componentWithAdditionalContent.find(DefaultTooltip).exists(),
            'Component should have a tooltip'
        );

        assert.isTrue(
            componentWithAdditionalContent
                .find('span.awesomeCustomAdditionalContent')
                .exists(),
            'Component should have the additional content'
        );
    });
});
