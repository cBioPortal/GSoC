import React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import SimpleTable from './SimpleTable';

describe('SimpleTable', () => {
    let table: any;

    const headers: any = [<th>one</th>];
    const rows: any = [
        <tr>
            <td>data</td>
        </tr>,
        <tr>
            <td>data</td>
        </tr>,
    ];
    const classNameTrue: string = 'test-class';
    const classNameFalse: undefined = undefined;

    beforeAll(() => {
        table = mount(<SimpleTable headers={headers} rows={rows} />);
    });

    it('renders 3 rows if passed headers and two rows', () => {
        assert.equal(table.find('tr').length, 3);
    });

    it('renders no result message when rows is empty array', () => {
        table.setProps({ rows: [] });
        assert.isTrue(
            table.containsMatchingElement(
                <td colSpan={1}>There are no results.</td>
            )
        );

        table.setProps({ rows: [], noRowsText: 'Hello there!!!!' });
        assert.isTrue(
            table.containsMatchingElement(<td colSpan={1}>Hello there!!!!</td>)
        );
    });

    it('has class name of className prop if provided', () => {
        assert.isTrue(
            mount(
                <SimpleTable
                    className={classNameTrue}
                    headers={headers}
                    rows={rows}
                />
            ).hasClass('test-class')
        );
    });

    it("does not have class name of 'undefined' if className prop is undefined", () => {
        assert.isFalse(
            mount(
                <SimpleTable
                    className={classNameFalse}
                    headers={headers}
                    rows={rows}
                />
            ).hasClass('undefined')
        );
    });
});
