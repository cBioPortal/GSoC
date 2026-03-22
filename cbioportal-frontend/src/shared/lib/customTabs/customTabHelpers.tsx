import _ from 'lodash';
import { MSKTab } from 'shared/components/MSKTabs/MSKTabs';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import * as React from 'react';
import {
    ICustomTabConfiguration,
    ICustomTabWrapper,
} from 'shared/model/ITabConfiguration';
import { showCustomTab } from 'shared/lib/customTabs';
import { getBrowserWindow, remoteData } from 'cbioportal-frontend-commons';

function customTabCallback(div: HTMLDivElement, tab: any, isUnmount = false) {
    showCustomTab(div, tab, getBrowserWindow().location.href, null, isUnmount);
}

export function buildCustomTabs(
    customTabConfigurations: Record<string, ICustomTabWrapper>
) {
    const tabs: JSX.Element[] = [];

    _.forEach(customTabConfigurations, tab => {
        const thisTab = tab.tab;

        const tabKey = thisTab.title;

        if (tab.promise) {
            // it's pending
            if (tab.promise.isPending) {
                tabs.push(
                    <MSKTab
                        key={'loading-' + tabKey}
                        id={thisTab.id}
                        linkText={thisTab.title}
                        pending={true}
                    >
                        <LoadingIndicator
                            isLoading={true}
                            center={true}
                            noFade={true}
                            size={'big'}
                        ></LoadingIndicator>
                    </MSKTab>
                );
            } else if (tab.promise.isComplete) {
                // only add tab if the result is TRUE
                // if it's complete but not true, don't add tab at all
                tab.promise.result === true &&
                    tabs.push(
                        <MSKTab
                            key={tabKey}
                            id={thisTab.id}
                            unmountOnHide={thisTab.unmountOnHide === true}
                            onTabDidMount={div => {
                                customTabCallback(div, thisTab);
                            }}
                            hide={false}
                            onTabUnmount={div => {
                                customTabCallback(div, thisTab, true);
                            }}
                            linkText={thisTab.title}
                        ></MSKTab>
                    );
            } else {
                tabs.push(
                    <MSKTab
                        key={tabKey}
                        id={thisTab.id}
                        unmountOnHide={thisTab.unmountOnHide === true}
                        hide={false}
                        linkText={thisTab.title}
                    >
                        Error
                    </MSKTab>
                );
            }
        } else {
            // there is no promise, so just push the tab
            tabs.push(
                <MSKTab
                    key={tabKey}
                    id={thisTab.id}
                    unmountOnHide={thisTab.unmountOnHide === true}
                    onTabDidMount={div => {
                        customTabCallback(div, thisTab);
                    }}
                    hide={false}
                    linkText={thisTab.title}
                ></MSKTab>
            );
        }
    });

    return tabs;
}

export function prepareCustomTabConfigurations(
    customTabs: ICustomTabConfiguration[],
    pageLocation: string
) {
    const tabs: Record<string, ICustomTabWrapper> = {};

    if (customTabs) {
        // convert it from string to function
        const custom_tabs: ICustomTabConfiguration[] = customTabs.map(t => {
            if (t.hideAsync)
                // will often by a string because needs to be serialized to json
                // and no function type in json
                t.hideAsync = _.isString(t.hideAsync)
                    ? eval(t.hideAsync)
                    : t.hideAsync;

            t.mountCallback = _.isString(t.mountCallback)
                ? eval(t.mountCallback)
                : t.mountCallback;

            return t as ICustomTabConfiguration;
        });

        // Select appropriate tab configurations for the requested page.
        const customResultsTabs = custom_tabs.filter(
            (tab: ICustomTabConfiguration) => tab.location === pageLocation
        );

        // if hideAsync is defined for a tab config, call it and save
        // returned promise on the tab configuration, for future use
        customResultsTabs?.forEach(tab => {
            if (tab.hideAsync) {
                tabs[tab.id] = {
                    promise: remoteData(async () => {
                        const ret = tab!.hideAsync!();
                        if (_.has(ret, 'then')) {
                            return ret;
                        } else {
                            return Promise.resolve(ret);
                        }
                    }),
                    tab: tab,
                };
            } else {
                tabs[tab.id] = {
                    tab: tab,
                };
            }
        });
    }

    return tabs;
}
