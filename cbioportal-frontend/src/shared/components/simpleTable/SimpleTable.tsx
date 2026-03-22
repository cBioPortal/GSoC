import * as React from 'react';
import './styles.scss';
import { If, Then, Else } from 'react-if';
import classNames from 'classnames';
import { observer } from 'mobx-react';

interface ISimpleTableProps {
    headers: JSX.Element[];
    rows: JSX.Element[];
    noRowsText?: string;
    className?: string;
}

@observer
export default class SimpleTable extends React.Component<
    ISimpleTableProps,
    {}
> {
    public render() {
        const { headers, rows, className, noRowsText } = this.props;
        const tableRows =
            rows.length > 0
                ? rows
                : [
                      <tr key="0">
                          <td
                              style={{ textAlign: 'center' }}
                              colSpan={headers.length}
                          >
                              {noRowsText || 'There are no results.'}
                          </td>
                      </tr>,
                  ];

        return (
            <table
                className={classNames(
                    'simple-table table table-striped table-border-top',
                    className
                )}
            >
                <thead>
                    <tr>{headers}</tr>
                </thead>
                <tbody>{tableRows}</tbody>
            </table>
        );
    }
}
