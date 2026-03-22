import { ClinicalEventTypeCount } from 'cbioportal-ts-api-client/dist/generated/CBioPortalAPIInternal';
import FixedHeaderTable, {
    IFixedHeaderTableProps,
} from 'pages/studyView/table/FixedHeaderTable';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import React, { CSSProperties } from 'react';
import styles from 'pages/studyView/table/tables.module.scss';
import {
    toNumericValue,
    TreatmentGenericColumnHeader,
} from 'pages/studyView/table/treatments/treatmentsTableUtil';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import {
    MobxPromise,
    stringListToIndexSet,
    stringListToSet,
} from 'cbioportal-frontend-commons';
import ifNotDefined from 'shared/lib/ifNotDefined';
import {
    Column,
    SortDirection,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import autobind from 'autobind-decorator';
import { SelectionOperatorEnum } from 'pages/studyView/TableUtils';
import { MultiSelectionTableRow } from 'pages/studyView/table/MultiSelectionTable';
import {
    correctMargin,
    getFixedHeaderNumberCellMargin,
    getFrequencyStr,
} from 'pages/studyView/StudyViewUtils';

export interface IClinicalEventTypeDataColumnCellProp {
    data: string;
    style?: CSSProperties;
    className?: string;
}

function ClinicalEventTypeColumnCell(
    props: IClinicalEventTypeDataColumnCellProp
) {
    return (
        <div className={props.className} style={props.style}>
            {props.data}
        </div>
    );
}

export function filterClinicalEventTypeCountCell(
    cell: ClinicalEventTypeCount,
    filter: string
): boolean {
    return cell.eventType.toUpperCase().includes(filter.toUpperCase());
}

export type ClinicalEventTypeCountTableColumn = {
    columnKey: ClinicalEventTypeCountColumnKey;
    columnWidthRatio?: number;
};
export interface IClinicalEventTypeCountTableProps {
    filters: string[][];
    promise: MobxPromise<ClinicalEventTypeCount[]>;
    highlightedRow?: (value: string | undefined) => void;
    openComparisonPage?: () => void;
    label?: string;
    labelDescription?: string;
    width: number;
    height: number;
    showAddRemoveAllButtons?: boolean;
    defaultSortBy: ClinicalEventTypeCountColumnKey;
    columns: ClinicalEventTypeCountTableColumn[];
    selectedRowsKeys: string[];
    onSubmitSelection: (value: string[][]) => void;
    onChangeSelectedRows: (rowsKeys: string[]) => void;
    extraButtons?: IFixedHeaderTableProps<
        MultiSelectionTableRow
    >['extraButtons'];
    selectedPatientsKeyPromise: MobxPromise<string[]>;
    setOperationsButtonText: string;
}

class ClinicalEventTypeCountTableComponent extends FixedHeaderTable<
    ClinicalEventTypeCount
> {}

export enum ClinicalEventTypeCountColumnKey {
    CLINICAL_EVENT_TYPE = 'Event Type',
    COUNT = '#',
    FREQ = 'Freq',
}

const TABLE_TYPE = 'CLINICAL_EVENT_TYPE_COUNT';
const DEFAULT_COLUMN_WIDTH_RATIO: {
    [key in ClinicalEventTypeCountColumnKey]: number;
} = {
    [ClinicalEventTypeCountColumnKey.CLINICAL_EVENT_TYPE]: 0.65,
    [ClinicalEventTypeCountColumnKey.COUNT]: 0.2,
    [ClinicalEventTypeCountColumnKey.FREQ]: 0.15,
};

@observer
export default class ClinicalEventTypeCountTable extends React.Component<
    IClinicalEventTypeCountTableProps,
    {}
> {
    @observable protected _selectionType: SelectionOperatorEnum;
    @observable protected sortDirection: SortDirection;

    constructor(props: IClinicalEventTypeCountTableProps) {
        super(props);
        makeObservable(this);
        this.sortBy = this.props.defaultSortBy;
    }

    createNumberColumnCell(
        row: ClinicalEventTypeCount,
        cellMargin: number
    ): JSX.Element {
        return (
            <LabeledCheckbox
                checked={this.isChecked(row.eventType)}
                disabled={this.isDisabled(row.eventType)}
                onChange={_ => this.toggleSelectRow(row.eventType)}
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

    static readonly defaultProps = {
        width: 300,
        showAddRemoveAllButtons: false,
        cancerGeneFilterEnabled: false,
    };

    @observable protected sortBy: ClinicalEventTypeCountColumnKey;

    getDefaultColumnDefinition = (
        columnKey: ClinicalEventTypeCountColumnKey,
        columnWidth: number,
        cellMargin: number
    ) => {
        const defaults: {
            [key in ClinicalEventTypeCountColumnKey]: Column<
                ClinicalEventTypeCount
            >;
        } = {
            [ClinicalEventTypeCountColumnKey.CLINICAL_EVENT_TYPE]: {
                name: columnKey,
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={cellMargin}
                        headerName={columnKey}
                    />
                ),
                render: (data: ClinicalEventTypeCount) => (
                    <ClinicalEventTypeColumnCell data={data.eventType} />
                ),
                sortBy: (data: ClinicalEventTypeCount) => data.eventType,
                defaultSortDirection: 'asc' as 'asc',
                filter: filterClinicalEventTypeCountCell,
                width: columnWidth,
            },
            [ClinicalEventTypeCountColumnKey.COUNT]: {
                tooltip: (
                    <span>Distinct Number of Patients with Event Type</span>
                ),
                name: columnKey,
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={cellMargin}
                        headerName={columnKey}
                    />
                ),
                render: (data: ClinicalEventTypeCount) =>
                    this.createNumberColumnCell(data, 28),
                sortBy: (data: ClinicalEventTypeCount) =>
                    data.count + toNumericValue(data.eventType),
                defaultSortDirection: 'desc' as 'desc',
                filter: filterClinicalEventTypeCountCell,
                width: columnWidth,
            },
            [ClinicalEventTypeCountColumnKey.FREQ]: {
                name: columnKey,
                tooltip: (
                    <span>Freq of Event Types with Selected Patients</span>
                ),
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={cellMargin}
                        headerName={columnKey}
                    />
                ),
                render: (data: ClinicalEventTypeCount) => (
                    <ClinicalEventTypeColumnCell
                        className={styles.pullRight}
                        style={{ marginLeft: cellMargin }}
                        data={this.calculateClinicalEventTypeFreqString(
                            data,
                            this.selectedPatientCount
                        )}
                    />
                ),
                sortBy: (data: ClinicalEventTypeCount) =>
                    (data.count / this.selectedPatientCount) * 100,
                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: ClinicalEventTypeCount,
                    filterString: string
                ) => {
                    return _.toString(
                        getFrequencyStr(data.count / this.selectedPatientCount)
                    ).includes(filterString);
                },
                width: columnWidth,
            },
        };
        return defaults[columnKey];
    };

    @computed
    get columnsWidth() {
        const eventTypeWidth =
            DEFAULT_COLUMN_WIDTH_RATIO[
                ClinicalEventTypeCountColumnKey.CLINICAL_EVENT_TYPE
            ] * this.props.width;
        const countWidth =
            DEFAULT_COLUMN_WIDTH_RATIO[ClinicalEventTypeCountColumnKey.COUNT] *
            this.props.width;
        const freqWidth =
            DEFAULT_COLUMN_WIDTH_RATIO[ClinicalEventTypeCountColumnKey.FREQ] *
            this.props.width;
        return {
            [ClinicalEventTypeCountColumnKey.CLINICAL_EVENT_TYPE]: eventTypeWidth,
            [ClinicalEventTypeCountColumnKey.COUNT]: countWidth,
            [ClinicalEventTypeCountColumnKey.FREQ]: freqWidth,
        };
    }

    @computed
    get cellMargin() {
        return {
            [ClinicalEventTypeCountColumnKey.CLINICAL_EVENT_TYPE]: 0,
            [ClinicalEventTypeCountColumnKey.COUNT]: 0,
            [ClinicalEventTypeCountColumnKey.FREQ]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    this.columnsWidth[ClinicalEventTypeCountColumnKey.FREQ],
                    getFrequencyStr(
                        _.max(
                            this.tableData.map(
                                item =>
                                    (item.count! / this.selectedPatientCount!) *
                                    100
                            )
                        )!
                    )
                )
            ),
        };
    }

    @computed
    get firstColumnName() {
        return this.props.label
            ? this.props.label
            : ClinicalEventTypeCountColumnKey.CLINICAL_EVENT_TYPE;
    }

    @computed get tableData(): ClinicalEventTypeCount[] {
        return this.props.promise.result || [];
    }

    @computed get selectedPatientCount(): number {
        let patients = this.props.selectedPatientsKeyPromise.result;
        return patients ? patients.length : 0;
    }

    @computed
    get flattenedFilters(): string[] {
        return _.flatMap(this.props.filters);
    }
    @computed
    get selectableTableData() {
        if (this.flattenedFilters.length === 0) {
            return this.tableData;
        }
        return _.filter(
            this.tableData,
            data => !this.flattenedFilters.includes(data.eventType)
        );
    }

    @computed
    get allSelectedRowsKeysSet() {
        return stringListToSet([
            ...this.props.selectedRowsKeys,
            ...this.preSelectedRowsKeys,
        ]);
    }
    @computed
    get preSelectedRows() {
        if (this.flattenedFilters.length === 0) {
            return [];
        }
        const order = stringListToIndexSet(this.flattenedFilters);
        return _.chain(this.tableData)
            .filter(data => this.flattenedFilters.includes(data.eventType))
            .sortBy<ClinicalEventTypeCount>(data =>
                ifNotDefined(order[data.eventType], Number.POSITIVE_INFINITY)
            )
            .value();
    }

    calculateClinicalEventTypeFreqString(
        clinicalEventCount: ClinicalEventTypeCount,
        selectedPatientCount: number
    ): string {
        return getFrequencyStr(
            (clinicalEventCount.count / selectedPatientCount) * 100
        );
    }

    @computed
    get preSelectedRowsKeys() {
        return this.preSelectedRows.map(row => row.eventType);
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
        sortBy: ClinicalEventTypeCountColumnKey,
        sortDirection: SortDirection
    ) {
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    @autobind
    isChecked(uniqueKey: string) {
        return !!this.allSelectedRowsKeysSet[uniqueKey];
    }

    @autobind
    isDisabled(uniqueKey: string) {
        return _.some(this.preSelectedRowsKeys, key => key === uniqueKey);
    }

    @action.bound
    toggleSelectRow(uniqueKey: string) {
        const record = _.find(
            this.props.selectedRowsKeys,
            key => key === uniqueKey
        );
        if (_.isUndefined(record)) {
            this.props.onChangeSelectedRows(
                this.props.selectedRowsKeys.concat([uniqueKey])
            );
        } else {
            this.props.onChangeSelectedRows(
                _.xorBy(this.props.selectedRowsKeys, [record])
            );
        }
    }

    @autobind
    isSelectedRow(data: ClinicalEventTypeCount) {
        return this.isChecked(data.eventType);
    }

    @action.bound
    afterSelectingRows() {
        if (this.selectionType === SelectionOperatorEnum.UNION) {
            this.props.onSubmitSelection([this.props.selectedRowsKeys]);
        } else {
            this.props.onSubmitSelection(
                this.props.selectedRowsKeys.map(selectedRowsKey => [
                    selectedRowsKey,
                ])
            );
        }
        this.props.onChangeSelectedRows([]);
    }

    @computed
    get selectionType(): SelectionOperatorEnum {
        if (this._selectionType) {
            return this._selectionType;
        }
        switch ((localStorage.getItem(TABLE_TYPE) || '').toUpperCase()) {
            case SelectionOperatorEnum.INTERSECTION:
                return SelectionOperatorEnum.INTERSECTION;
            case SelectionOperatorEnum.UNION:
                return SelectionOperatorEnum.UNION;
            default:
                return SelectionOperatorEnum.UNION;
        }
    }
    @action.bound
    toggleSelectionOperator() {
        const selectionType = this._selectionType || this.selectionType;
        if (selectionType === SelectionOperatorEnum.INTERSECTION) {
            this._selectionType = SelectionOperatorEnum.UNION;
        } else {
            this._selectionType = SelectionOperatorEnum.INTERSECTION;
        }
        localStorage.setItem(TABLE_TYPE, this.selectionType);
    }

    @autobind
    selectedRowClassName(data: ClinicalEventTypeCount) {
        const index = this.filterKeyToIndexSet[data.eventType];
        if (index === undefined) {
            return this.props.filters.length % 2 === 0
                ? styles.highlightedEvenRow
                : styles.highlightedOddRow;
        }
        return index % 2 === 0
            ? styles.highlightedEvenRow
            : styles.highlightedOddRow;
    }

    @computed
    get filterKeyToIndexSet() {
        const keyIndexSet: { [id: string]: number } = {};
        return _.reduce(
            this.props.filters,
            (acc, next, index) => {
                next.forEach(key => {
                    acc[key] = index;
                });
                return acc;
            },
            keyIndexSet
        );
    }
    public render() {
        const tableId = `${TABLE_TYPE}-table`;
        return (
            <div data-test={tableId} key={tableId}>
                {this.props.promise.isComplete && (
                    <ClinicalEventTypeCountTableComponent
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
