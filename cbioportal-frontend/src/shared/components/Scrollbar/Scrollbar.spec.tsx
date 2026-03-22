import React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import sinon from 'sinon';
import ScrollBar from './ScrollBar';

describe('Scrollbar', () => {
    var wrapper;
    var instance: ScrollBar;
    var fakeInstance: any;

    beforeAll(() => {
        fakeInstance = {
            overflow: false,
            visible: false,
            scrollEl: {
                parentNode: {
                    offsetWidth: 500,
                },
                offsetWidth: 400,
                style: {},
            },
        };

        wrapper = mount(
            <ScrollBar getScrollEl={() => fakeInstance.scrollEl} />
        );
        instance = wrapper.instance() as ScrollBar;
    });

    beforeEach(() => {});

    it('detects absence of overflow and hides', done => {
        assert.equal(instance.overflow, -100, 'overflow is negative');

        setTimeout(() => {
            assert.isFalse(instance.visible, 'not visible if overflow <=0');
            done();
        }, 3);
    });

    it('detects overflow, shows, calculates handle percentage', done => {
        fakeInstance.scrollEl.parentNode.offsetWidth = 300;

        instance.forceUpdate();

        assert.equal(instance.overflow, 100, 'overflow is positive');

        setTimeout(() => {
            assert.isTrue(instance.visible, 'visible if overflow > 0');
            assert.equal(instance.handleWidth, '56.25%');
            done();
        }, 3);
    });

    it('handles drag event properly', () => {
        fakeInstance.scrollEl.parentNode.offsetWidth = 300;

        instance.forceUpdate();

        const doScrollStub = sinon.stub(instance, 'doScroll');

        const handleNode = {
            offsetWidth: 50,
            parentNode: {
                offsetWidth: 350,
            },
        };

        instance.handleDragEvent({}, { node: handleNode, x: 30 });
        assert(doScrollStub.calledOnce, 'calls doScroll');
        assert.equal(
            doScrollStub.args[0][0],
            0.1,
            'calls doScroll with correct percentage'
        );

        instance.handleDragEvent({}, { node: handleNode, x: 1000 });
        assert.equal(doScrollStub.args[1][0], 1, 'handles ratio above 1');

        handleNode.offsetWidth = 400;
        instance.handleDragEvent({}, { node: handleNode, x: 30 });
        assert.equal(doScrollStub.args[2][0], 0, 'handles ratio below 1');
    });

    it('sets left prop on scroll pane', () => {
        fakeInstance.scrollEl.parentNode.offsetWidth = 300;
        instance.doScroll(0.1);
        instance.scrollEl.style.left = '-10px';
    });
});
