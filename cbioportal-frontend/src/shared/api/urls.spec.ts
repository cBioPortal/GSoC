import { getGenomeNexusApiUrl } from './urls';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

import { getServerConfig } from 'config/config';
import { IServerConfig } from 'config/IAppConfig';
import { getLoadConfig } from 'config/config';

describe('url library', () => {
    beforeAll(() => {
        //global.window = { location: { protocol: 'https://' } };
        getServerConfig().genomenexus_url = 'http://www.test.com/hello/';
        getLoadConfig().apiRoot = 'http://www.cbioportal.org';
    });

    afterAll(() => {
        delete (getServerConfig() as Partial<IServerConfig>).genomenexus_url;
        delete getLoadConfig().apiRoot;
    });

    it('transforms genome nexus url configuration url to proxied url: removes protocol and trailing slash', () => {
        // note that this is WRONG (http: should be followed by double shlash)
        // but this is due to testing env and url builder library
        // this works correctly in browser env
        assert.equal(
            getGenomeNexusApiUrl(),
            'http://www.cbioportal.org/proxy/www.test.com/hello'
        );
    });

    it('transforms genome nexus url configuration url to proxied url: removes protocol and trailing slash', () => {
        getServerConfig().genomenexus_url = null;
        // note that this is WRONG (http: should be followed by double shlash)
        // note that this is WRONG (http: should be followed by double shlash)
        // but this is due to testing env and url builder library
        // this works correctly in browser env
        assert.isUndefined(getGenomeNexusApiUrl());
    });
});
