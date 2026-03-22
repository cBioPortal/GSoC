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
    PatientTreatmentReport,
    PatientTreatment,
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

export enum PatientTreatmentsTableColumnKey {
    TREATMENT = 'Treatment',
    COUNT = '#',
}

export type PatientTreatmentsTableColumn = {
    columnKey: PatientTreatmentsTableColumnKey;
    columnWidthRatio?: number;
};

export type PatientTreatmentsTableProps = {
    tableType: TreatmentTableType;
    promise: MobxPromise<PatientTreatmentReport>;
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
    defaultSortBy: PatientTreatmentsTableColumnKey;
    columns: PatientTreatmentsTableColumn[];
    setOperationsButtonText: string;
};

const DEFAULT_COLUMN_WIDTH_RATIO: {
    [key in PatientTreatmentsTableColumnKey]: number;
} = {
    [PatientTreatmentsTableColumnKey.TREATMENT]: 0.8,
    [PatientTreatmentsTableColumnKey.COUNT]: 0.2,
};

class MultiSelectionTableComponent extends FixedHeaderTable<PatientTreatment> {}

@observer
export class PatientTreatmentsTable extends TreatmentsTable<
    PatientTreatmentsTableProps
> {
    @observable protected sortBy: PatientTreatmentsTableColumnKey;

    public static defaultProps = {
        cancerGeneFilterEnabled: false,
    };

    constructor(props: PatientTreatmentsTableProps) {
        super(props);
        makeObservable(this);
        this.sortBy = this.props.defaultSortBy;
    }

    createNubmerColumnCell(
        row: PatientTreatment,
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
        columnKey: PatientTreatmentsTableColumnKey,
        columnWidth: number,
        cellMargin: number
    ) => {
        const defaults: {
            [key in PatientTreatmentsTableColumnKey]: Column<PatientTreatment>;
        } = {
            [PatientTreatmentsTableColumnKey.TREATMENT]: {
                name: columnKey,
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={cellMargin}
                        headerName={columnKey}
                    />
                ),
                render: (data: PatientTreatment) => (
                    <TreatmentColumnCell row={data} />
                ),
                sortBy: (data: PatientTreatment) => data.treatment,
                defaultSortDirection: 'asc' as 'asc',
                filter: filterTreatmentCell,
                width: columnWidth,
            },
            [PatientTreatmentsTableColumnKey.COUNT]: {
                tooltip: <span>Number of patients treated</span>,
                name: columnKey,
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={cellMargin}
                        headerName={columnKey}
                    />
                ),
                render: (data: PatientTreatment) =>
                    this.createNubmerColumnCell(data, 28),
                sortBy: (data: PatientTreatment) =>
                    data.count + toNumericValue(data.treatment),
                defaultSortDirection: 'desc' as 'desc',
                filter: filterTreatmentCell,
                width: columnWidth,
            },
        };
        return defaults[columnKey];
    };

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
            {} as { [key in PatientTreatmentsTableColumnKey]: number }
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
            {} as { [key in PatientTreatmentsTableColumnKey]: number }
        );
    }

    @computed get tableData(): PatientTreatment[] {
        return this.props.promise.result?.patientTreatments || [];
    }

    @computed
    get selectableTableData() {
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
            .sortBy<PatientTreatment>((data: PatientTreatment) =>
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
        sortBy: PatientTreatmentsTableColumnKey,
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
