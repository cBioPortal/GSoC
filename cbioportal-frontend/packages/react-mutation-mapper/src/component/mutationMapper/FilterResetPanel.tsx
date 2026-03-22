import classNames from 'classnames';
import { observer } from 'mobx-react';
import * as React from 'react';

import styles from './filterResetPanel.module.scss';

type FilterResetPanelProps = {
    resetFilters: () => void;
    filterInfo?: JSX.Element | string;
    additionalInfo?: JSX.Element | string;
    className?: string;
    buttonText?: string;
    buttonClass?: string;
};

@observer
export class FilterResetPanel extends React.Component<
    FilterResetPanelProps,
    {}
> {
    public static defaultProps: Partial<FilterResetPanelProps> = {
        buttonText: 'Remove filter',
        buttonClass: classNames('btn', 'btn-secondary', 'btn-sm'),
        className: classNames(
            'alert',
            'alert-success',
            styles.filterResetPanel
        ),
    };

    public render() {
        return (
            <div
                className={this.props.className}
                data-test="filter-reset-panel"
            >
                <span style={{ verticalAlign: 'middle' }}>
                    <strong>{this.props.filterInfo}</strong>
                    <button
                        className={this.props.buttonClass}
                        style={{ cursor: 'pointer', marginLeft: 6 }}
                        onClick={this.props.resetFilters}
                    >
                        {this.props.buttonText}
                    </button>
                    <br />
                    {this.props.additionalInfo}
                </span>
            </div>
        );
    }
}

export default FilterResetPanel;
