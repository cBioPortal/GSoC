import SampleColumnFormatter from './SampleColumnFormatter';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { initMutation } from 'test/MutationMockUtils';
import React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';

describe('SampleColumnFormatter', () => {
    const mutationShort = initMutation({
        sampleId: 'Short_Id',
    });

    const mutationLong = initMutation({
        sampleId: 'This_is_a_quite_long_Sample_Id_in_my_opinion!',
    });

    let componentShort: ReactWrapper<any, any>;
    let componentLong: ReactWrapper<any, any>;

    beforeAll(() => {
        let data = [mutationShort];

        // mount a single cell component (Td) for the mutation with short sample id
        componentShort = mount(SampleColumnFormatter.renderFunction(data));

        data = [mutationLong];

        // mount a single cell component (Td) for the mutation with long sample id
        componentLong = mount(SampleColumnFormatter.renderFunction(data));
    });

    it('renders sample display value', () => {
        assert.isTrue(
            componentShort
                .find(`span`)
                .text()
                .indexOf('Short_Id') > -1,
            'Display value is correct for short sample id'
        );
        assert.isTrue(
            componentLong
                .find(`span`)
                .text()
                .indexOf('This_is_a_quite_long_Sample_Id_in_my_opinion!') > -1,
            'Display value is correct for long sample id'
        );
    });

    it('generates component tooltip', () => {
        assert.isTrue(
            componentShort.find(DefaultTooltip).exists(),
            'Tooltip should exists for short sample id'
        );
        assert.isTrue(
            componentLong.find(DefaultTooltip).exists(),
            'Tooltip should exists for long sample id'
        );
    });
});
