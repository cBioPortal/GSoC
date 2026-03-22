import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, toJS, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import _ from 'lodash';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import { ClinicalDataCountSummary } from 'pages/studyView/StudyViewUtils';
import FixedHeaderTable from './FixedHeaderTable';
import styles from './tables.module.scss';
import {
    correctColumnWidth,
    correctMargin,
    getClinicalAttributeOverlay,
    getFixedHeaderNumberCellMargin,
    getFixedHeaderTableMaxLengthStringPixel,
} from '../StudyViewUtils';
import { SortDirection } from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import { EllipsisTextTooltip } from 'cbioportal-frontend-commons';
import { DEFAULT_SORTING_COLUMN } from '../StudyViewConfig';
import ComparisonVsIcon from 'shared/components/ComparisonVsIcon';

export interface IClinicalTableProps {
    data: ClinicalDataCountSummary[];
    filters: string[];
    highlightedRow?: (value: string | undefined) => void;
    onUserSelection: (values: string[]) => void;
    openComparisonPage?: () => void;
    label?: string;
    labelDescription?: string;
    patientAttribute: boolean;
    width?: number;
    height?: number;
    showAddRemoveAllButtons?: boolean;
    title?: string;
}

class ClinicalTableComponent extends FixedHeaderTable<
    ClinicalDataCountSummary
> {}

export enum ColumnKey {
    CATEGORY = 'Category',
    NUMBER = '#',
    FREQ = 'Freq',
}

@observer
export default class ClinicalTable extends React.Component<
    IClinicalTableProps,
    {}
> {
    constructor(props: IClinicalTableProps) {
        super(props);
        makeObservable(this);
    }

    @observable private sortBy: string = DEFAULT_SORTING_COLUMN;
    @observable private sortDirection: SortDirection;

    static readonly defaultProps = {
        width: 300,
        showAddRemoveAllButtons: false,
    };

    @computed
    get columnsWidth() {
        const numberWidth = 80;
        const freqWidth = 60;
        const categoryWidth = correctColumnWidth(
            this.props.width! - (numberWidth + freqWidth)
        );
        return {
            [ColumnKey.CATEGORY]: categoryWidth,
            [ColumnKey.NUMBER]: numberWidth,
            [ColumnKey.FREQ]: freqWidth,
        };
    }

    @computed
    get cellMargin() {
        return {
            [ColumnKey.CATEGORY]: 0,
            [ColumnKey.NUMBER]:
                this.props.data.length === 0
                    ? 0
                    : correctMargin(
                          (this.columnsWidth[ColumnKey.NUMBER] -
                              10 -
                              (getFixedHeaderTableMaxLengthStringPixel(
                                  _.max(
                                      this.props.data.map(item => item.count)
                                  )!.toLocaleString()
                              ) +
                                  20)) /
                              2
                      ),
            [ColumnKey.FREQ]:
                this.props.data.length === 0
                    ? 0
                    : correctMargin(
                          getFixedHeaderNumberCellMargin(
                              this.columnsWidth[ColumnKey.FREQ],
                              _.sortBy(
                                  this.props.data,
                                  item => item.percentage
                              )[this.props.data.length - 1].freq
                          )
                      ),
        };
    }

    @computed
    get firstColumnName() {
        return this.props.label ? this.props.label : ColumnKey.CATEGORY;
    }

    @computed
    private get columns() {
        return [
            {
                name: this.firstColumnName,
                render: (data: ClinicalDataCountSummary) => {
                    return (
                        <div
                            className={styles.labelContent}
                            onMouseEnter={event => {
                                this.tooltipLabelMouseEnter(data.value);
                            }}
                            onMouseLeave={this.tooltipLabelMouseLeave}
                        >
                            <svg
                                width="18"
                                height="12"
                                className={styles.labelContentSVG}
                            >
                                <g>
                                    <rect
                                        x="0"
                                        y="0"
                                        width="12"
                                        height="12"
                                        fill={data.color}
                                    />
                                </g>
                            </svg>
                            <EllipsisTextTooltip
                                text={data.displayedValue || data.value}
                            ></EllipsisTextTooltip>
                        </div>
                    );
                },
                headerRender: () => {
                    const style: any = {};
                    let text = this.firstColumnName;
                    if (!this.props.label) {
                        style.opacity = 0;
                        text = '.';
                    }
                    return (
                        <EllipsisTextTooltip
                            style={style}
                            text={text}
                            hideTooltip={true}
                        ></EllipsisTextTooltip>
                    );
                },
                tooltip: getClinicalAttributeOverlay(
                    this.firstColumnName,
                    this.props.labelDescription
                        ? this.props.labelDescription
                        : ''
                ),
                filter: (
                    d: ClinicalDataCountSummary,
                    f: string,
                    filterStringUpper: string
                ) => d.value.toUpperCase().includes(filterStringUpper),
                sortBy: (d: ClinicalDataCountSummary) => d.value,
                defaultSortDirection: 'asc' as 'asc',
                width: this.columnsWidth[ColumnKey.CATEGORY],
            },
            {
                name: ColumnKey.NUMBER,
                headerRender: () => {
                    return (
                        <div
                            style={{
                                marginLeft: this.cellMargin[ColumnKey.NUMBER],
                            }}
                        >
                            #
                        </div>
                    );
                },
                render: (data: ClinicalDataCountSummary) => (
                    <LabeledCheckbox
                        checked={_.includes(this.props.filters, data.value)}
                        onChange={event => {
                            this.onUserSelection(data.value);
                        }}
                        labelProps={{
                            style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginLeft: this.cellMargin[ColumnKey.NUMBER],
                                marginRight: this.cellMargin[ColumnKey.NUMBER],
                            },
                        }}
                        inputProps={{
                            className: styles.autoMarginCheckbox,
                        }}
                    >
                        {data.count.toLocaleString()}
                    </LabeledCheckbox>
                ),
                tooltip: (
                    <span>
                        Number of{' '}
                        {this.props.patientAttribute ? 'patients' : 'samples'}
                    </span>
                ),
                filter: (d: ClinicalDataCountSummary, f: string) =>
                    d.count.toString().includes(f),
                sortBy: (d: ClinicalDataCountSummary) => d.count,
                defaultSortDirection: 'desc' as 'desc',
                width: this.columnsWidth[ColumnKey.NUMBER],
            },
            {
                name: ColumnKey.FREQ,
                headerRender: () => {
                    return (
                        <div
                            style={{
                                marginLeft: this.cellMargin[ColumnKey.FREQ],
                            }}
                        >
                            Freq
                        </div>
                    );
                },
                render: (data: ClinicalDataCountSummary) => (
                    <span
                        style={{
                            marginRight: this.cellMargin[ColumnKey.FREQ],
                        }}
                        className={styles.pullRight}
                    >
                        {data.freq}
                    </span>
                ),
                tooltip: (
                    <span>
                        Percentage of{' '}
                        {this.props.patientAttribute ? 'patients' : 'samples'}
                    </span>
                ),
                filter: (d: ClinicalDataCountSummary, f: string) => {
                    return d.freq.includes(f);
                },
                sortBy: (d: ClinicalDataCountSummary) => d.percentage, //sort freq column using count
                defaultSortDirection: 'desc' as 'desc',
                width: this.columnsWidth[ColumnKey.FREQ],
            },
        ];
    }

    @autobind
    private onUserSelection(filter: string) {
        let filters = toJS(this.props.filters);
        if (_.includes(filters, filter)) {
            filters = _.filter(filters, obj => obj !== filter);
        } else {
            filters = filters.concat([filter]);
        }
        this.props.onUserSelection(filters);
    }

    @autobind
    private tooltipLabelMouseEnter(value: string): void {
        if (this.props.highlightedRow) {
            this.props.highlightedRow(value);
        }
    }

    @autobind
    private tooltipLabelMouseLeave(): void {
        if (this.props.highlightedRow) {
            this.props.highlightedRow(undefined);
        }
    }

    @autobind
    addAll(selectedRows: ClinicalDataCountSummary[]) {
        // To prevent the deselection of previously applied filters upon each "Select All" click,
        // we retrieve the existing filters and concatenate them with the new ones.
        let filters = toJS(this.props.filters);

        let uniqueSelectedRows = selectedRows
            .map(row => row.value)
            .filter(item => !filters.includes(item));

        filters = filters.concat(uniqueSelectedRows);
        this.props.onUserSelection(filters);
    }

    @autobind
    removeAll(deselectedRows: ClinicalDataCountSummary[]) {
        const deselectRows = deselectedRows.map(row => row.value);
        this.props.onUserSelection(
            this.props.filters.filter(filter => !deselectRows.includes(filter))
        );
    }

    @action.bound
    afterSorting(sortBy: string, sortDirection: SortDirection) {
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    @computed get selectedClinicalValues() {
        const filtersMap = _.keyBy(this.props.filters);
        return this.props.data.filter(d => d.value in filtersMap);
    }

    @computed get extraButtons() {
        if (this.props.openComparisonPage) {
            return [
                {
                    content: (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <ComparisonVsIcon
                                width={16}
                                style={{ marginRight: 5 }}
                            />
                            Compare
                        </div>
                    ),
                    onClick: this.props.openComparisonPage,
                    isDisabled: () => this.selectedClinicalValues.length === 1, // no selection means compare all, so only problem would be if exactly 1 is selected
                },
            ];
        } else {
            return [];
        }
    }

    render() {
        return (
            <ClinicalTableComponent
                width={this.props.width}
                height={this.props.height}
                data={this.props.data || []}
                columns={this.columns}
                addAll={this.addAll}
                removeAll={this.removeAll}
                numberOfSelectedRows={this.props.filters.length}
                showAddRemoveAllButton={this.props.showAddRemoveAllButtons}
                extraButtons={this.extraButtons}
                sortBy={this.sortBy}
                sortDirection={this.sortDirection}
                afterSorting={this.afterSorting}
            />
        );
    }
}
