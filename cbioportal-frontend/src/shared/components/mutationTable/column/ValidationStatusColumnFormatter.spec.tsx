import { DefaultTooltip } from 'cbioportal-frontend-commons';
import ValidationStatusColumnFormatter from './ValidationStatusColumnFormatter';
import styles from './validationStatus.module.scss';
import { initMutation } from 'test/MutationMockUtils';
import React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';

describe('MutationStatusColumnFormatter', () => {
    const validMutation = initMutation({
        validationStatus: 'Validated',
    });

    const wildtypeMutation = initMutation({
        validationStatus: 'Wildtype',
    });

    const unknownMutation = initMutation({
        validationStatus: 'NA',
    });

    const otherMutation = initMutation({
        validationStatus: 'Other',
    });

    const validData = [validMutation];
    const wildtypeData = [wildtypeMutation];
    const unknownData = [unknownMutation];
    const otherData = [otherMutation];

    let validComponent: ReactWrapper<any, any>;
    let wildtypeComponent: ReactWrapper<any, any>;
    let unknownComponent: ReactWrapper<any, any>;
    let otherComponent: ReactWrapper<any, any>;

    beforeAll(() => {
        validComponent = mount(
            ValidationStatusColumnFormatter.renderFunction(validData)
        );
        wildtypeComponent = mount(
            ValidationStatusColumnFormatter.renderFunction(wildtypeData)
        );
        unknownComponent = mount(
            ValidationStatusColumnFormatter.renderFunction(unknownData)
        );
        otherComponent = mount(
            ValidationStatusColumnFormatter.renderFunction(otherData)
        );
    });

    it('gets validation status data properly', () => {
        assert.equal(
            ValidationStatusColumnFormatter.getData(validData),
            'Validated',
            'Validated validation status data is properly extracted'
        );

        assert.equal(
            ValidationStatusColumnFormatter.getData(wildtypeData),
            'Wildtype',
            'Wildtype validation status data is properly extracted'
        );

        assert.equal(
            ValidationStatusColumnFormatter.getData(unknownData),
            'NA',
            'Unknown validation status data is properly extracted'
        );

        assert.equal(
            ValidationStatusColumnFormatter.getData(otherData),
            'Other',
            'Other validation status data is properly extracted'
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
        testRenderedValues(validComponent, 'valid', 'V');
        testRenderedValues(wildtypeComponent, 'wildtype', 'W');
        testRenderedValues(unknownComponent, 'unknown', 'U');
    });

    it('adds tooltips for valid, wildtype, and unknown validation statuses', () => {
        assert.isTrue(
            validComponent.find(DefaultTooltip).exists(),
            'Tooltip should exist for valid mutations'
        );
        assert.isTrue(
            wildtypeComponent.find(DefaultTooltip).exists(),
            'Tooltip should exist for wildtype mutations'
        );
        assert.isTrue(
            unknownComponent.find(DefaultTooltip).exists(),
            'Tooltip should exist for unknown mutations'
        );
        assert.isFalse(
            otherComponent.find(DefaultTooltip).exists(),
            'Tooltip should not exist for other validation statuses'
        );
    });
});
