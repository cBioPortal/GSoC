import * as React from 'react';
import DefaultTooltip from './defaultTooltip/DefaultTooltip';

export enum TableCellStatus {
    LOADING,
    ERROR,
    NA,
}

type TableCellStatusIndicatorProps = {
    status: TableCellStatus;
    loadingAlt?: string;
    errorAlt?: string;
    naAlt?: string;
};

export default class TableCellStatusIndicator extends React.Component<
    TableCellStatusIndicatorProps,
    {}
> {
    public render() {
        let alt: string = '';
        let text: string = '';
        switch (this.props.status) {
            case TableCellStatus.LOADING:
                alt = this.props.loadingAlt || 'Querying server for data.';
                text = 'LOADING';
                break;
            case TableCellStatus.ERROR:
                alt = this.props.errorAlt || 'Error retrieving data.';
                text = 'ERROR';
                break;
            case TableCellStatus.NA:
                alt = this.props.naAlt || 'Data not available.';
                text = '';
                break;
        }
        return (
            <DefaultTooltip placement="left" overlay={<span>{alt}</span>}>
                <span
                    style={{
                        color: 'gray',
                        fontSize: 'xx-small',
                        textAlign: 'center',
                    }}
                >
                    {text}
                </span>
            </DefaultTooltip>
        );
    }
}
