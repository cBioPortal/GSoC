import exposeComponentRenderer from './exposeComponentRenderer';
import { assert } from 'chai';
import * as React from 'react';
import _ from 'lodash';

describe('test', () => {
    let targetEl: HTMLDivElement | null;

    beforeAll(() => {
        targetEl = document.createElement('div');
    });

    afterAll(() => {
        targetEl = null;
    });

    it('exposeComponentRenderer puts a function on window object. calling the function renders the passed component', () => {
        class testClass extends React.Component<any, any> {
            render() {
                return <div>foo</div>;
            }
        }

        exposeComponentRenderer('renderTestComponent', testClass, {});

        assert.isTrue(_.isFunction((window as any).renderTestComponent));

        (window as any).renderTestComponent(targetEl);

        assert.equal(targetEl!.textContent, 'foo');
    });
});
