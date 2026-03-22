import * as React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import browser from 'bowser';
import UnsupportedBrowserModal from './UnsupportedBrowserModal';

describe('UnsupportedBrowserModal', () => {
    let wrapper: any;

    beforeAll(() => {
        browser.version = '';
        wrapper = shallow(<UnsupportedBrowserModal />);
    });

    it('does not show modal when Chrome is being used', () => {
        wrapper.instance().handleUnsupportedBrowsers('chrome');
        expect(wrapper.state('show')).to.equal(false);
    });

    it('does not show modal when Edge is being used', () => {
        wrapper.instance().handleUnsupportedBrowsers('msedge');
        expect(wrapper.state('show')).to.equal(false);
    });

    it('does not show when state is manually set to false', () => {
        wrapper.instance().setState({ show: false });
        expect(wrapper.state('show')).to.equal(false);
    });

    it('does not show modal when Safari is being used', () => {
        wrapper.instance().handleUnsupportedBrowsers('safari');
        expect(wrapper.state('show')).to.equal(false);
    });

    it('does not show modal when Firefox is being used', () => {
        wrapper.instance().handleUnsupportedBrowsers('firefox');
        expect(wrapper.state('show')).to.equal(false);
    });

    it.skip('shows modal when IE10 is being used and site is accessed for first time', () => {
        wrapper.instance().handleUnsupportedBrowsers('msie', '10.0.0', false);
        expect(wrapper.state('show')).to.equal(true);
    });

    it('does not show modal when IE10 is being used and "do not show has" been checked', () => {
        wrapper.instance().handleUnsupportedBrowsers('msie', '10.0.0', true);
        expect(wrapper.state('show')).to.equal(false);
    });

    it('shows no modal when IE11 is being used', () => {
        wrapper.instance().handleUnsupportedBrowsers('msie', '11.0.0', false);
        expect(wrapper.state('show')).to.equal(false);
    });
});
