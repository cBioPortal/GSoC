import React from 'react';
import { shallow } from 'enzyme';
import { assert } from 'chai';
import GeneFilterMenu, { GeneFilterOption } from './GeneFilterMenu';
import sinon from 'sinon';

describe('GeneFilterOptions', () => {
    const callback = sinon.spy();
    const wrapper = shallow(
        <GeneFilterMenu
            currentSelection={GeneFilterOption.ALL_SAMPLES}
            onOptionChanged={callback}
        />
    );
    const allGenesRadioButton = wrapper
        .dive()
        .find('[value="' + GeneFilterOption.ALL_SAMPLES + '"]');
    const anyGenesRadioButton = wrapper
        .dive()
        .find('[value="' + GeneFilterOption.ANY_SAMPLE + '"]');

    it('Selects correct option on init', () => {
        const propertiesAll = allGenesRadioButton.props() as any;
        const propertiesAny = anyGenesRadioButton.props() as any;
        assert.isTrue(propertiesAll.checked);
        assert.isFalse(propertiesAny.checked);
    });

    it('Notifies parent of option change', () => {
        anyGenesRadioButton.simulate('change', { target: { checked: true } });
        assert(callback.called);
    });
});
