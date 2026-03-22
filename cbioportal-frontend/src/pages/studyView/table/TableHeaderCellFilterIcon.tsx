import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import styles from 'pages/studyView/table/tables.module.scss';
import classnames from 'classnames';
import { ICON_FILTER_OFF, ICON_FILTER_ON } from 'shared/lib/Colors';

export interface IFilterHeaderProps {
    cellMargin: number;
    showFilter: boolean;
    isFiltered: boolean;
    overlay?: JSX.Element;
    className?: string;
    dataTest?: string;
    onClickCallback?: (event: any) => void;
}

export class TableHeaderCellFilterIcon extends React.Component<
    IFilterHeaderProps,
    {}
> {
    render() {
        return (
            <div
                style={{ marginLeft: this.props.cellMargin }}
                className={styles.displayFlex}
                data-test={this.props.dataTest}
            >
                {this.props.showFilter && (
                    <DefaultTooltip
                        mouseEnterDelay={0}
                        placement="top"
                        disabled={!this.props.overlay}
                        overlay={this.props.overlay || null}
                    >
                        <div
                            onClick={this.props.onClickCallback}
                            className={styles.displayFlex}
                        >
                            <span
                                data-test="header-filter-icon"
                                className={classnames(
                                    styles.cancerGeneIcon,
                                    styles.displayFlex
                                )}
                                style={{
                                    color: this.props.isFiltered
                                        ? ICON_FILTER_ON
                                        : ICON_FILTER_OFF,
                                }}
                            >
                                <i className="fa fa-filter" />
                            </span>
                        </div>
                    </DefaultTooltip>
                )}
                {this.props.children}
            </div>
        );
    }
}
