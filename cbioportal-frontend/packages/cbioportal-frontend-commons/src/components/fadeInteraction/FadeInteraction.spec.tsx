import * as React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';

import FadeInteraction from './FadeInteraction';

describe('FadeInteraction', function() {
    it('showByDefault prop sets initialShow state properly', function() {
        const instance = shallow(
            <FadeInteraction showByDefault={true} />
        ).instance() as FadeInteraction;
        assert.isTrue(
            instance.initialShow,
            'showByDefault results in initialshow=true'
        );
        const instance2 = shallow(
            <FadeInteraction />
        ).instance() as FadeInteraction;
        assert.isFalse(
            instance2.initialShow,
            'showByDefault results in initialshow=true'
        );
    });

    it('#onMouseEnter adjusts state properly', function() {
        const instance = shallow(
            <FadeInteraction showByDefault={true} />
        ).instance() as FadeInteraction;
        assert.isFalse(instance.mouseInside, 'mouseInside is false by default');
        instance.onMouseEnter();
        assert.isFalse(
            instance.initialShow,
            'calling onMouseEnter sets initialShow to false'
        );
        assert.isTrue(
            instance.mouseInside,
            'calling onMouseEnter sets mouseIndie to true'
        );
    });

    it('#onMouseLeave adjust state properly', function() {
        const instance = shallow(
            <FadeInteraction showByDefault={true} />
        ).instance() as FadeInteraction;
        instance.onMouseEnter();
        instance.onMouseLeave();
        assert.isFalse(
            instance.initialShow,
            'calling onMouseLeave sets initialShow to false'
        );
        assert.isFalse(
            instance.mouseInside,
            'calling onMouseLeave sets mouseIndie to false'
        );
    });

    it('componentWillUpdate updates show property', function() {
        const wrapper = shallow(
            <FadeInteraction show={true} showByDefault={true} />
        );
        const instance = wrapper.instance() as FadeInteraction;
        assert.isTrue(instance.initialShow);
        wrapper.setProps({ show: false });
        assert.isFalse(instance.initialShow);
    });
});
