import * as React from 'react';
import { action, computed, makeObservable } from 'mobx';
import { Observer, observer } from 'mobx-react';
import styles from './styles.module.scss';
import { ChartOption } from '../AddChartButton';
import _ from 'lodash';
import LabeledCheckbox from '../../../../shared/components/labeledCheckbox/LabeledCheckbox';
import { Column } from '../../../../shared/components/lazyMobXTable/LazyMobXTable';
import { getFrequencyStr } from '../../StudyViewUtils';
import LoadingIndicator from '../../../../shared/components/loadingIndicator/LoadingIndicator';
import { ChartDataCountSet } from '../../StudyViewUtils';
import FixedHeaderTable from '../../table/FixedHeaderTable';
import autobind from 'autobind-decorator';
import classnames from 'classnames';
import {
    EllipsisTextTooltip,
    DefaultTooltip,
    MobxPromise,
} from 'cbioportal-frontend-commons';
import { Omit } from '../../../../shared/lib/TypeScriptUtils';
import ifNotDefined from '../../../../shared/lib/ifNotDefined';

export type AddChartOption = Omit<ChartOption, 'chartType'>;
export interface IAddChartByTypeProps {
    options: Omit<AddChartOption, 'freq'>[];
    freqPromise?: MobxPromise<ChartDataCountSet>;
    onAddAll: (keys: string[]) => void;
    onClearAll: (keys: string[]) => void;
    onToggleOption: (key: string) => void;
    optionsGivenInSortedOrder?: boolean;
    frequencyHeaderTooltip?: string;
    width?: number;
    firstColumnHeaderName?: string;
    hideControls?: boolean;
    shareCharts?: (chartIds: string[]) => void;
    deleteChart?: (chartId: string) => void;
    restoreChart?: (chartId: string) => void;
    markedForDeletion?: string[];
}

class AddChartTableComponent extends FixedHeaderTable<AddChartOption> {}

const NUM_ROWS_SHOWN = 15;

@observer
export default class AddChartByType extends React.Component<
    IAddChartByTypeProps,
    {}
> {
    constructor(props: IAddChartByTypeProps) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps = {
        firstColumnHeaderName: 'Name',
        hideControls: false,
        width: 400,
    };

    @computed
    get options() {
        if (this.props.freqPromise?.isComplete) {
            const options = _.reduce(
                this.props.options,
                (acc, next) => {
                    const disabled =
                        this.props.freqPromise!.result![next.key] === 0;
                    acc.push({
                        label: next.label,
                        key: next.key,
                        disabled: next.disabled || disabled,
                        selected: next.selected,
                        isSharedChart: next.isSharedChart,
                        freq: disabled
                            ? 0
                            : this.props.freqPromise!.result![next.key],
                    });
                    return acc;
                },
                [] as AddChartOption[]
            );
            if (this.props.optionsGivenInSortedOrder) {
                return options;
            } else {
                return options.sort((a: AddChartOption, b: AddChartOption) => {
                    return b.freq - a.freq || a.label.localeCompare(b.label);
                });
            }
        } else {
            const options = this.props.options.map(o =>
                Object.assign({ freq: 100 }, o)
            );
            if (this.props.optionsGivenInSortedOrder) {
                return options;
            } else {
                return options.sort((a, b) => a.label.localeCompare(b.label));
            }
        }
    }

    @autobind
    private onDeleteClick(option: AddChartOption) {
        this.props.deleteChart!(option.key);
    }

    @autobind
    private shareChart(option: AddChartOption) {
        this.props.shareCharts!([option.key]);
    }

    @autobind
    private onRestoreClick(option: AddChartOption) {
        this.props.restoreChart!(option.key);
    }

    @computed get columns() {
        const columns: Column<AddChartOption>[] = [
            {
                name: this.props.firstColumnHeaderName!,
                render: (option: AddChartOption) => {
                    return (
                        <Observer>
                            {() => (
                                <div
                                    className={classnames(
                                        styles.option,
                                        'add-chart-option',
                                        {
                                            [styles.markedForDeletion]:
                                                this.props.markedForDeletion &&
                                                this.props.markedForDeletion.includes(
                                                    option.key
                                                ),
                                        }
                                    )}
                                    data-test={`add-chart-option-${option.label
                                        .toLowerCase()
                                        .replace(/\s/g, '-')}`}
                                >
                                    <LabeledCheckbox
                                        checked={option.selected}
                                        disabled={
                                            option.disabled ||
                                            (this.props.markedForDeletion &&
                                                this.props.markedForDeletion.includes(
                                                    option.key
                                                ))
                                        }
                                        labelProps={{
                                            className: classnames(
                                                styles.label,
                                                option.disabled
                                                    ? styles.labelDisabled
                                                    : ''
                                            ),
                                        }}
                                        inputProps={{
                                            className: styles.input,
                                        }}
                                        onChange={() =>
                                            this.onOptionChange(option)
                                        }
                                    >
                                        <EllipsisTextTooltip
                                            text={option.label}
                                        />
                                    </LabeledCheckbox>
                                </div>
                            )}
                        </Observer>
                    );
                },
                filter: (
                    d: AddChartOption,
                    f: string,
                    filterStringUpper: string
                ) => d.label.toUpperCase().includes(filterStringUpper),
                sortBy: (d: AddChartOption) => d.label,
                // 250 for custom data tab
                width:
                    this.props.width! -
                    80 -
                    (this.props.shareCharts || this.props.deleteChart ? 70 : 0),
                defaultSortDirection: 'asc' as 'asc',
            },
        ];
        if (this.props.freqPromise) {
            columns.push({
                name: 'Freq',
                tooltip: (
                    <span>
                        {ifNotDefined(
                            this.props.frequencyHeaderTooltip,
                            '% samples with data'
                        )}
                    </span>
                ),
                render: (option: AddChartOption) => (
                    <span
                        className={classnames(
                            option.disabled ? styles.labelDisabled : '',
                            {
                                [styles.markedForDeletion]:
                                    this.props.markedForDeletion &&
                                    this.props.markedForDeletion.includes(
                                        option.key
                                    ),
                            }
                        )}
                    >
                        {this.props.freqPromise?.isComplete
                            ? getFrequencyStr(option.freq)
                            : ''}
                    </span>
                ),
                sortBy: (d: AddChartOption) => d.freq,
                defaultSortDirection: 'desc' as 'desc',
                width: 60,
            });
        }

        if (this.props.shareCharts || this.props.deleteChart) {
            columns.push({
                name: ' ',
                render: (option: AddChartOption) => {
                    let content: JSX.Element = <></>;
                    if (
                        this.props.markedForDeletion &&
                        this.props.markedForDeletion.includes(option.key)
                    ) {
                        content = (
                            <button
                                className="btn btn-xs btn-default"
                                onClick={() => this.onRestoreClick(option)}
                            >
                                Restore
                            </button>
                        );
                    } else {
                        content = (
                            <>
                                {this.props.deleteChart && (
                                    <DefaultTooltip
                                        overlay={'Delete Chart'}
                                        placement={'top'}
                                    >
                                        <span
                                            onClick={() =>
                                                this.onDeleteClick(option)
                                            }
                                            style={{ marginRight: '5px' }}
                                        >
                                            <i
                                                className="fa fa-md fa-trash"
                                                style={{
                                                    cursor: 'pointer',
                                                }}
                                            />
                                        </span>
                                    </DefaultTooltip>
                                )}
                                {this.props.shareCharts && (
                                    <span
                                        onClick={() => this.shareChart(option)}
                                    >
                                        <i
                                            className="fa fa-share-alt"
                                            style={{
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </span>
                                )}
                            </>
                        );
                    }
                    return (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                            }}
                            className={classnames({
                                [styles.labelDisabled]: option.disabled,
                            })}
                        >
                            {content}
                        </div>
                    );
                },
                width: 70,
            });
        }
        return columns;
    }

    @computed
    get tableHeight() {
        return this.options.length > NUM_ROWS_SHOWN
            ? NUM_ROWS_SHOWN * 25
            : (this.options.length + 1) * 25;
    }

    @autobind
    getCurrentSelectedRows(): AddChartOption[] {
        return this.options.filter(option => option.selected);
    }

    @autobind
    getCurrentSelectedRowKeys() {
        return this.getCurrentSelectedRows().map(option => option.key);
    }

    @action.bound
    addAll(selectedOptions: AddChartOption[]) {
        this.props.onAddAll(
            _.filter(selectedOptions, option => !option.disabled).map(
                option => option.key
            )
        );
    }

    @action.bound
    removeAll(selectedOptions: AddChartOption[]) {
        this.props.onClearAll(selectedOptions.map(option => option.key));
    }

    @action.bound
    onOptionChange(option: AddChartOption) {
        this.props.onToggleOption(option.key);
    }

    @action.bound
    shareSelected() {
        this.props.shareCharts!(
            this.props.options
                .filter(option => option.selected)
                .map(option => option.key)
        );
    }

    @computed get extraButtons() {
        if (this.props.shareCharts) {
            return [
                {
                    content: <>Share selected</>,
                    onClick: this.shareSelected,
                    isDisabled: () =>
                        this.props.options.filter(option => option.selected)
                            .length === 0,
                },
            ];
        }
        return [];
    }

    render() {
        return (
            <div
                style={{ display: 'flex', flexDirection: 'column' }}
                data-test="add-by-type"
            >
                {(!this.props.freqPromise ||
                    this.props.freqPromise.isComplete) && (
                    <AddChartTableComponent
                        width={this.props.width! - 20}
                        height={this.tableHeight}
                        columns={this.columns}
                        data={this.options}
                        showControlsAtTop={true}
                        addAll={this.addAll}
                        removeAll={this.removeAll}
                        showSelectableNumber={true}
                        showAddRemoveAllButton={true}
                        autoFocusSearchAfterRendering={true}
                        numberOfSelectedRows={
                            this.getCurrentSelectedRows().length
                        }
                        hideControls={this.props.hideControls}
                        isSelectedRow={data => !!data.isSharedChart}
                        highlightedRowClassName={data =>
                            data.isSharedChart ? styles.sharedChart : ''
                        }
                        extraButtons={this.extraButtons}
                        setOperationsButtonText={''}
                    />
                )}
                {this.props.freqPromise?.isPending && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 100,
                        }}
                    >
                        <LoadingIndicator isLoading={true} />
                        <br />
                        Calculating data availability...
                    </div>
                )}
            </div>
        );
    }
}
