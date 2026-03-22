import * as React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import FixedHeaderTable, { IFixedHeaderTableProps } from '../FixedHeaderTable';
import { action, computed, observable, makeObservable } from 'mobx';
import {
    Column,
    SortDirection,
} from '../../../../shared/components/lazyMobXTable/LazyMobXTable';
import {
    SampleTreatmentReport,
    SampleTreatmentRow,
} from 'cbioportal-ts-api-client';
import { correctColumnWidth } from 'pages/studyView/StudyViewUtils';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import styles from 'pages/studyView/table/tables.module.scss';
import { MobxPromise, stringListToIndexSet } from 'cbioportal-frontend-commons';
import ifNotDefined from 'shared/lib/ifNotDefined';
import {
    treatmentUniqueKey,
    TreatmentTableType,
    TreatmentGenericColumnHeader,
    TreatmentColumnCell,
    filterTreatmentCell,
    toNumericValue,
} from './treatmentsTableUtil';
import { TreatmentsTable } from './AbstractTreatmentsTable';
import { MultiSelectionTableRow } from 'pages/studyView/table/MultiSelectionTable';

export enum SampleTreatmentsTableColumnKey {
    TREATMENT = 'Treatment',
    TIME = 'Pre / Post',
    COUNT = '#',
}

export type SampleTreatmentsTableColumn = {
    columnKey: SampleTreatmentsTableColumnKey;
    columnWidthRatio?: number;
};

export type SampleTreatmentsTableProps = {
    tableType: TreatmentTableType;
    promise: MobxPromise<SampleTreatmentReport>;
    width: number;
    height: number;
    filters: string[][];
    onSubmitSelection: (value: string[][]) => void;
    onChangeSelectedRows: (rowsKeys: string[]) => void;
    extraButtons?: IFixedHeaderTableProps<
        MultiSelectionTableRow
    >['extraButtons'];
    selectedRowsKeys: string[];
    selectedTreatments: string[];
    defaultSortBy: SampleTreatmentsTableColumnKey;
    columns: SampleTreatmentsTableColumn[];
    setOperationsButtonText: string;
};

const DEFAULT_COLUMN_WIDTH_RATIO: {
    [key in SampleTreatmentsTableColumnKey]: number;
} = {
    [SampleTreatmentsTableColumnKey.TREATMENT]: 0.6,
    [SampleTreatmentsTableColumnKey.TIME]: 0.3,
    [SampleTreatmentsTableColumnKey.COUNT]: 0.2,
};

class MultiSelectionTableComponent extends FixedHeaderTable<
    SampleTreatmentRow
> {}

@observer
export class SampleTreatmentsTable extends TreatmentsTable<
    SampleTreatmentsTableProps
> {
    @observable protected sortBy: SampleTreatmentsTableColumnKey;

    public static defaultProps = {
        cancerGeneFilterEnabled: false,
    };

    constructor(props: SampleTreatmentsTableProps) {
        super(props);
        makeObservable(this);
        this.sortBy = this.props.defaultSortBy;
    }

    createTemporalRelationColumnCell(row: SampleTreatmentRow): JSX.Element {
        return <div>{row.time}</div>;
    }

    createNubmerColumnCell(
        row: SampleTreatmentRow,
        cellMargin: number
    ): JSX.Element {
        return (
            <LabeledCheckbox
                checked={this.isChecked(treatmentUniqueKey(row))}
                disabled={this.isDisabled(treatmentUniqueKey(row))}
                onChange={_ => this.toggleSelectRow(treatmentUniqueKey(row))}
                labelProps={{
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginLeft: 0,
                        marginRight: cellMargin,
                    },
                }}
                inputProps={{
                    className: styles.autoMarginCheckbox,
                }}
            >
                <span>{row.count.toLocaleString()}</span>
            </LabeledCheckbox>
        );
    }

    getDefaultColumnDefinition = (
        columnKey: SampleTreatmentsTableColumnKey,
        columnWidth: number,
        cellMargin: number
    ) => {
        const defaults: {
            [key in SampleTreatmentsTableColumnKey]: Column<SampleTreatmentRow>;
        } = {
            [SampleTreatmentsTableColumnKey.TREATMENT]: {
                name: columnKey,
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={cellMargin}
                        headerName={columnKey}
                    />
                ),
                render: (data: SampleTreatmentRow) => (
                    <TreatmentColumnCell row={data} />
                ),
                sortBy: (data: SampleTreatmentRow) => data.treatment,
                defaultSortDirection: 'asc' as 'asc',
                filter: filterTreatmentCell,
                width: columnWidth,
            },
            [SampleTreatmentsTableColumnKey.TIME]: {
                name: columnKey,
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={cellMargin}
                        headerName={columnKey}
                    />
                ),
                render: this.createTemporalRelationColumnCell,
                sortBy: (data: SampleTreatmentRow) => data.time,
                defaultSortDirection: 'asc' as 'asc',
                filter: filterTreatmentCell,
                width: columnWidth,
            },
            [SampleTreatmentsTableColumnKey.COUNT]: {
                tooltip: (
                    <span>
                        Number of samples acquired before treatment or after/on
                        treatment
                    </span>
                ),
                name: columnKey,
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={cellMargin}
                        headerName={columnKey}
                    />
                ),
                render: (data: SampleTreatmentRow) =>
                    this.createNubmerColumnCell(data, 28),
                sortBy: (data: SampleTreatmentRow) =>
                    this.calculateMaxValueForTreatment(data) +
                    toNumericValue(data.time + data.treatment),
                defaultSortDirection: 'desc' as 'desc',
                filter: filterTreatmentCell,
                width: columnWidth,
            },
        };
        return defaults[columnKey];
    };

    calculateMaxValueForTreatment(treatment: SampleTreatmentRow): number {
        const matchingSortedRows = this.tableData
            .filter(row => row.treatment == treatment.treatment)
            .sort((a, b) => b.count - a.count);

        return matchingSortedRows.length == 0 ? 0 : matchingSortedRows[0].count;
    }

    @computed
    get columnsWidth() {
        return _.reduce(
            this.props.columns,
            (acc, column) => {
                acc[column.columnKey] = correctColumnWidth(
                    (column.columnWidthRatio
                        ? column.columnWidthRatio
                        : DEFAULT_COLUMN_WIDTH_RATIO[column.columnKey]) *
                        this.props.width
                );
                return acc;
            },
            {} as { [key in SampleTreatmentsTableColumnKey]: number }
        );
    }

    @computed
    get cellMargin() {
        return _.reduce(
            this.props.columns,
            (acc, column) => {
                acc[column.columnKey] = 0;
                return acc;
            },
            {} as { [key in SampleTreatmentsTableColumnKey]: number }
        );
    }

    @computed get tableData(): SampleTreatmentRow[] {
        return this.props.promise.result?.treatments || [];
    }

    @computed get selectableTableData() {
        if (this.flattenedFilters.length === 0) {
            return this.tableData;
        }
        return _.filter(
            this.tableData,
            data => !this.flattenedFilters.includes(treatmentUniqueKey(data))
        );
    }

    @computed
    get preSelectedRows() {
        if (this.flattenedFilters.length === 0) {
            return [];
        }
        const order = stringListToIndexSet(this.flattenedFilters);
        return _.chain(this.tableData)
            .filter(data =>
                this.flattenedFilters.includes(treatmentUniqueKey(data))
            )
            .sortBy<SampleTreatmentRow>(data =>
                ifNotDefined(
                    order[treatmentUniqueKey(data)],
                    Number.POSITIVE_INFINITY
                )
            )
            .value();
    }

    @computed
    get preSelectedRowsKeys() {
        return this.preSelectedRows.map(row => treatmentUniqueKey(row));
    }

    @computed
    get tableColumns() {
        return this.props.columns.map(column =>
            this.getDefaultColumnDefinition(
                column.columnKey,
                this.columnsWidth[column.columnKey],
                this.cellMargin[column.columnKey]
            )
        );
    }

    @action.bound
    afterSorting(
        sortBy: SampleTreatmentsTableColumnKey,
        sortDirection: SortDirection
    ) {
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    public render() {
        const tableId = `${this.props.tableType}-table`;
        return (
            <div data-test={tableId} key={tableId}>
                {this.props.promise.isComplete && (
                    <MultiSelectionTableComponent
                        width={this.props.width}
                        height={this.props.height}
                        data={this.selectableTableData}
                        columns={this.tableColumns}
                        isSelectedRow={this.isSelectedRow}
                        afterSelectingRows={this.afterSelectingRows}
                        defaultSelectionOperator={this.selectionType}
                        toggleSelectionOperator={this.toggleSelectionOperator}
                        extraButtons={this.props.extraButtons}
                        sortBy={this.sortBy}
                        sortDirection={this.sortDirection}
                        afterSorting={this.afterSorting}
                        fixedTopRowsData={this.preSelectedRows}
                        highlightedRowClassName={this.selectedRowClassName}
                        numberOfSelectedRows={
                            this.props.selectedRowsKeys.length
                        }
                        showSetOperationsButton={true}
                        setOperationsButtonText={
                            this.props.setOperationsButtonText
                        }
                    />
                )}
            </div>
        );
    }
}
