import {
    filterCaseSetOptions,
    ReactSelectOptionWithName,
} from './CaseSetSelector';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('CaseSetSelector', () => {
    describe('filterCaseSetOptions', () => {
        it('lambda filters without case sensitivity', () => {
            let opt = {
                textLabel: 'this is the Haystack',
            } as ReactSelectOptionWithName;

            assert.isTrue(filterCaseSetOptions(opt, 'haystack'));
            assert.isTrue(filterCaseSetOptions(opt, 'Haystack'));
            assert.isFalse(filterCaseSetOptions(opt, 'Maystack'));
        });
    });
});
