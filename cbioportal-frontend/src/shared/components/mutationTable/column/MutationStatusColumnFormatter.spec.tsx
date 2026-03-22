import { DefaultTooltip } from 'cbioportal-frontend-commons';
import MutationStatusColumnFormatter from './MutationStatusColumnFormatter';
import styles from './mutationStatus.module.scss';
import { initMutation } from 'test/MutationMockUtils';
import React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';

describe('MutationStatusColumnFormatter', () => {
    const germlineMutation = initMutation({
        mutationStatus: 'Germline',
    });

    const somaticMutation = initMutation({
        mutationStatus: 'Somatic',
    });

    const naMutation = initMutation({
        mutationStatus: 'na',
    });

    const germlineData = [germlineMutation];
    const somaticData = [somaticMutation];
    const naData = [naMutation];

    let germlineComponent: ReactWrapper<any, any>;
    let somaticComponent: ReactWrapper<any, any>;
    let naComponent: ReactWrapper<any, any>;

    beforeAll(() => {
        germlineComponent = mount(
            MutationStatusColumnFormatter.renderFunction(germlineData)
        );
        somaticComponent = mount(
            MutationStatusColumnFormatter.renderFunction(somaticData)
        );
        naComponent = mount(
            MutationStatusColumnFormatter.renderFunction(naData)
        );
    });

    it('gets mutation status data properly', () => {
        assert.equal(
            MutationStatusColumnFormatter.getData(germlineData),
            'Germline',
            'Germline mutation status data is properly extracted'
        );

        assert.equal(
            MutationStatusColumnFormatter.getData(somaticData),
            'Somatic',
            'Somatic mutation status data is properly extracted'
        );
    });

    function testRenderedValues(
        component: ReactWrapper<any, any>,
        className: string,
        value: string
    ) {
        assert.isTrue(
            component.find(`span.${(styles as any)[className]}`).exists(),
            `Span has the correct class name for ${value}`
        );
        assert.isTrue(
            component
                .find(`span.${(styles as any)[className]}`)
                .text()
                .indexOf(value) > -1,
            `Display value is correct for ${value}`
        );
    }

    it('renders component display value, class name, and cell value property', () => {
        testRenderedValues(germlineComponent, 'germline', 'G');
        testRenderedValues(somaticComponent, 'somatic', 'S');
        testRenderedValues(naComponent, 'unknown', 'na');
    });

    it('adds tooltips only for germline and somatic mutation statuses', () => {
        assert.isTrue(
            germlineComponent.find(DefaultTooltip).exists(),
            'Tooltip should exist for germline mutations'
        );
        assert.isTrue(
            somaticComponent.find(DefaultTooltip).exists(),
            'Tooltip should exist for somatic mutations'
        );
        assert.isFalse(
            naComponent.find(DefaultTooltip).exists(),
            'Tooltip should not exist for unknown statuses'
        );
    });
});
