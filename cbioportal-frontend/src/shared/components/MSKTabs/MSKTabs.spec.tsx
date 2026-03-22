import { MSKTab, MSKTabs } from './MSKTabs';
import React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';

describe('MSKTabs', () => {
    let tabs: any;

    function tabText(tabs: ReactWrapper<any, any>): string[] {
        return tabs
            .find('ul.nav-tabs')
            .find('li')
            .map(x => x.text());
    }

    beforeEach(() => {
        tabs = mount(
            <MSKTabs>
                <MSKTab id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );

        tabs.update();
    });

    it('initial render only mounts first tab', done => {
        setTimeout(function() {
            assert.equal(tabs.update().find('.msk-tab').length, 1);
            done();
        });
    });

    it('render of tab is deferred to frame following', done => {
        assert.equal(tabs.find('.msk-tab').length, 0);
        setTimeout(function() {
            assert.equal(tabs.update().find('.msk-tab').length, 1);
            done();
        });
    });

    it('creates two tab buttons and toggles them properly', done => {
        setTimeout(() => {
            // the number of actual tabs are 2, but we have an additional 'li' element for the loader icon
            assert.equal(tabs.update().find('li').length, 3);
            assert.isTrue(
                tabs
                    .find('li')
                    .at(0)
                    .hasClass('active')
            );
            assert.isFalse(
                tabs
                    .find('li')
                    .at(1)
                    .hasClass('active')
            );
            tabs.setProps({ activeTabId: 'two' });
            assert.isFalse(
                tabs
                    .find('li')
                    .at(0)
                    .hasClass('active')
            );
            assert.isTrue(
                tabs
                    .find('li')
                    .at(1)
                    .hasClass('active')
            );
            done();
        });
    });

    it('if unmount on hide is false, we retain tabs when we click away', done => {
        var tabs = mount(
            <MSKTabs unmountOnHide={false}>
                <MSKTab id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );

        setTimeout(() => {
            assert.equal(tabs.update().find('.msk-tab').length, 1);
            tabs.setProps({ activeTabId: 'two' });
            assert.equal(tabs.find('.msk-tab').length, 2, "didn't unmount");
            assert.isTrue(
                tabs
                    .find('.msk-tab')
                    .at(0)
                    .hasClass('hiddenByPosition')
            );

            tabs.setProps({ activeTabId: 'one' });

            // assert.isTrue(tabs.find('.msk-tab').at(1).hasClass('hiddenByPosition'));
            // assert.isFalse(tabs.find('.msk-tab').at(0).hasClass('hiddenByPosition'));

            done();
        });
    });

    it('if unmount on hide is true, we DO NOT retain tabs when we click away', done => {
        var tabs = mount(
            <MSKTabs unmountOnHide={true}>
                <MSKTab id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );

        setTimeout(function() {
            assert.equal(tabs.update().find('.msk-tab').length, 1);

            tabs.setProps({ activeTabId: 'two' });

            // assert.equal(tabs.find('.msk-tab').length, 1, "did unmount");
            // assert.isFalse(tabs.find('.msk-tab').at(0).hasClass('hiddenByPosition'));
            //
            // tabs.setProps({ activeTabId:"one" });
            //
            // assert.isFalse(tabs.find('.msk-tab').at(0).hasClass('hiddenByPosition'));

            done();
        });
    });

    it('if unMountOnHide = false, switch tab causes mounting, switching again causes hide/show', done => {
        var tabs = mount(
            <MSKTabs unmountOnHide={false}>
                <MSKTab id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );
        setTimeout(() => {
            assert.equal(tabs.update().find('.msk-tab').length, 1);
            tabs.setProps({ activeTabId: 'two' });
            assert.equal(tabs.update().find('.msk-tab').length, 2);
            tabs.setProps({ activeTabId: 'one' });
            done();
        });
    });

    it('if individual tab is unmountOnHide false then it will not be unmounted', done => {
        tabs = mount(
            <MSKTabs>
                <MSKTab unmountOnHide={false} id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );

        setTimeout(() => {
            assert.equal(tabs.update().find('.msk-tab').length, 1);

            tabs.setProps({ activeTabId: 'two' });
            assert.equal(tabs.find('.msk-tab').length, 2);

            tabs.setProps({ activeTabId: 'one' });
            assert.equal(tabs.find('.msk-tab').length, 1);

            done();
        });
    });

    it('if individual tab is unmountOnHide false then it will not be unmounted even if parent unmountOnHide is true', done => {
        var tabs = mount(
            <MSKTabs unmountOnHide={true}>
                <MSKTab unmountOnHide={false} id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );

        setTimeout(() => {
            assert.equal(tabs.update().find('.msk-tab').length, 1);

            tabs.setProps({ activeTabId: 'two' });
            assert.equal(tabs.find('.msk-tab').length, 2);

            tabs.setProps({ activeTabId: 'one' });
            assert.equal(tabs.find('.msk-tab').length, 1);

            done();
        });
    });

    it('if individual tab is unmountOnHide true then it will be unmounted even if parent unmountOnHide is false', done => {
        var tabs = mount(
            <MSKTabs unmountOnHide={false}>
                <MSKTab unmountOnHide={true} id="one" linkText="One">
                    <span className="content">One</span>
                </MSKTab>
                <MSKTab linkText="Two" id="two">
                    <span className="content">Two</span>
                </MSKTab>
            </MSKTabs>
        );

        setTimeout(() => {
            assert.equal(tabs.update().find('.msk-tab').length, 1);

            tabs.setProps({ activeTabId: 'two' });
            assert.equal(tabs.find('.msk-tab').length, 1);

            tabs.setProps({ activeTabId: 'one' });
            assert.equal(tabs.find('.msk-tab').length, 2);

            done();
        });
    });
});
