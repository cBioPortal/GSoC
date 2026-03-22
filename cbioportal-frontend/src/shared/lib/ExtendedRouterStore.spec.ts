import ExtendedRouterStore, { PortalSession } from './ExtendedRouterStore';
import { assert } from 'chai';
import * as React from 'react';
import _ from 'lodash';
import * as $ from 'jquery';
import * as sinon from 'sinon';
import * as mobx from 'mobx';
import { syncHistoryWithStore, SynchronizedHistory } from 'mobx-react-router';
import { createBrowserHistory, MemoryHistory } from 'history';
import { SinonStub } from 'sinon';
import { sleep } from './TimeUtils';
import { computed } from 'mobx';
import { getServerConfig } from 'config/config';
import { setServerConfig } from '../../config/config';

describe('ExtendedRouterStore', () => {
    let history: SynchronizedHistory;
    let routingStore: ExtendedRouterStore;
    let saveRemoteSessionStub: SinonStub;
    let getRemoteSessionStub: SinonStub;

    beforeEach(() => {
        routingStore = new ExtendedRouterStore();
        history = syncHistoryWithStore(createBrowserHistory(), routingStore);
        setServerConfig({ sessionServiceEnabled: true });
        routingStore.location.pathname = '/results';
        routingStore.updateRoute({ param1: '1', param2: '2', param3: '3' });
    });

    afterEach(() => {
        history.unsubscribe!();
    });

    it('Updating route with clear=true will clear all params and except new ones', () => {
        routingStore.updateRoute(
            {
                param3: 'cleared',
            },
            undefined,
            true
        );

        assert.deepEqual(
            routingStore.query,
            { param3: 'cleared' },
            'removes param1'
        );
        assert.deepEqual(routingStore.location.pathname, '/results');
    });

    it('Properties that are undefined will be removed from URL', () => {
        routingStore.updateRoute(
            {
                param1: 'something1',
                param2: 'something2',
                param3: 'something3',
            },
            undefined,
            false
        );

        assert.deepEqual(
            routingStore.query,
            {
                param1: 'something1',
                param2: 'something2',
                param3: 'something3',
            },
            'sets params'
        );

        routingStore.updateRoute(
            {
                param3: undefined,
            },
            undefined,
            false
        );

        assert.deepEqual(
            routingStore.query,
            { param1: 'something1', param2: 'something2' },
            'removes undefined param'
        );

        routingStore.updateRoute(
            {
                param2: '',
            },
            undefined,
            false
        );

        assert.deepEqual(
            routingStore.query,
            { param1: 'something1' },
            'removes empty string prop'
        );
    });
});
