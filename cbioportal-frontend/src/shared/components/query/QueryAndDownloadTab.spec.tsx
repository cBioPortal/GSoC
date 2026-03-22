import QueryAndDownloadTabs from './QueryAndDownloadTabs';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';

import { Tab } from 'react-bootstrap';
import { QueryStore } from './QueryStore';

describe('QueryAndDownloadTabs', () => {
    it.skip('only show query tab if prop showQuickSearchTab and showDownloadTab are false', () => {
        // const comp = shallow(
        //     <QueryAndDownloadTabs
        //         getQueryStore={() => ({} as QueryStore)}
        //         showQuickSearchTab={true}
        //         showDownloadTab={true}
        //     />
        // );
        // assert.equal(comp.find(Tab).length, 3);
        // comp.setProps({ showQuickSearchTab: false, showDownloadTab: false });
        // assert.equal(comp.find(Tab).length, 1);
    });
});
