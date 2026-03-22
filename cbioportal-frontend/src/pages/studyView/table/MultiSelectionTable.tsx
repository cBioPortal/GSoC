import * as React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';
import FixedHeaderTable, { IFixedHeaderTableProps } from './FixedHeaderTable';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import {
    Column,
    SortDirection,
} from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import { StudyViewGenePanelModal } from './StudyViewGenePanelModal';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';
import { GenePanel } from 'cbioportal-ts-api-client';
import {
    correctColumnWidth,
    correctMargin,
    getCNAByAlteration,
    getCNAColorByAlteration,
    getFixedHeaderNumberCellMargin,
    getFixedHeaderTableMaxLengthStringPixel,
    getFrequencyStr,
} from 'pages/studyView/StudyViewUtils';
import { OncokbCancerGene } from 'pages/studyView/StudyViewPageStore';
import {
    getFreqColumnRender,
    getTooltip,
    FreqColumnTypeEnum,
    SelectionOperatorEnum,
    getCancerGeneToggledOverlay,
} from 'pages/studyView/TableUtils';
import { GeneCell } from 'pages/studyView/table/GeneCell';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import styles from 'pages/studyView/table/tables.module.scss';
import {
    stringListToIndexSet,
    stringListToSet,
    EllipsisTextTooltip,
    MobxPromise,
} from 'cbioportal-frontend-commons';
import ifNotDefined from 'shared/lib/ifNotDefined';
import { TableHeaderCellFilterIcon } from 'pages/studyView/table/TableHeaderCellFilterIcon';

export type MultiSelectionTableRow = OncokbCancerGene & {
    label: string;
    matchingGenePanelIds: Array<string>;
    numberOfAlteredCases: number;
    numberOfProfiledCases: number;
    qValue: number;
    totalCount: number;
    alteration?: number;
    cytoband?: string;
    uniqueKey: string;
};

export enum MultiSelectionTableColumnKey {
    GENE = 'Gene',
    MOLECULAR_PROFILE = 'Molecular Profile', // this table has been generalized to "Data Types"
    ANNOTATION = 'Annotation',
    CASE_LIST = 'Name',
    MUTATION_TYPE = 'Mutation Type',
    NUMBER_STRUCTURAL_VARIANTS = '# SV',
    NUMBER_MUTATIONS = '# Mut',
    NUMBER_VARIANT_ANNOTATIONS = '# VA',
    CYTOBAND = 'Cytoband',
    CNA = 'CNA',
    NUMBER = '#',
    FREQ = 'Freq',
}

export type MultiSelectionTableColumn = {
    columnKey: MultiSelectionTableColumnKey;
    columnWidthRatio?: number;
    columnTooltip?: JSX.Element;
};

export type BaseMultiSelectionTableProps = {
    tableType: FreqColumnTypeEnum;
    width: number;
    height: number;
    filters: string[][];
    onSubmitSelection: (value: string[][]) => void;
    onChangeSelectedRows: (rowsKeys: string[]) => void;
    selectedRowsKeys: string[];
    cancerGeneFilterEnabled?: boolean;
    genePanelCache?: MobxPromiseCache<{ genePanelId: string }, GenePanel>;
    filterByCancerGenes?: boolean;
    onChangeCancerGeneFilter: (filtered: boolean) => void;
    alterationFilterEnabled?: boolean;
    filterAlterations?: boolean;
    setOperationsButtonText: string;
};

export type MultiSelectionTableProps = BaseMultiSelectionTableProps & {
    defaultSortBy: MultiSelectionTableColumnKey;
    extraButtons?: IFixedHeaderTableProps<
        MultiSelectionTableRow
    >['extraButtons'];
    selectedGenes?: string[];
    onGeneSelect?: (hugoGeneSymbol: string) => void;
    columns: MultiSelectionTableColumn[];
    promise: MobxPromise<MultiSelectionTableRow[]>;
};

const DEFAULT_COLUMN_WIDTH_RATIO: {
    [key in MultiSelectionTableColumnKey]: number;
} = {
    [MultiSelectionTableColumnKey.GENE]: 0.35,
    [MultiSelectionTableColumnKey.ANNOTATION]: 0.35,
    [MultiSelectionTableColumnKey.MOLECULAR_PROFILE]: 0.6,
    [MultiSelectionTableColumnKey.CASE_LIST]: 0.6,
    [MultiSelectionTableColumnKey.MUTATION_TYPE]: 0.35,
    [MultiSelectionTableColumnKey.NUMBER_MUTATIONS]: 0.25,
    [MultiSelectionTableColumnKey.NUMBER_STRUCTURAL_VARIANTS]: 0.2,
    [MultiSelectionTableColumnKey.NUMBER_VARIANT_ANNOTATIONS]: 0.2,
    [MultiSelectionTableColumnKey.NUMBER]: 0.25,
    [MultiSelectionTableColumnKey.FREQ]: 0.15,
    [MultiSelectionTableColumnKey.CYTOBAND]: 0.25,
    [MultiSelectionTableColumnKey.CNA]: 0.14,
};

class MultiSelectionTableComponent extends FixedHeaderTable<
    MultiSelectionTableRow
> {}

@observer
export class MultiSelectionTable extends React.Component<
    MultiSelectionTableProps,
    {}
> {
    @observable protected sortBy: MultiSelectionTableColumnKey;
    @observable private sortDirection: SortDirection;
    @observable private modalSettings: {
        modalOpen: boolean;
        modalPanelName: string;
    } = {
        modalOpen: false,
        modalPanelName: '',
    };

    public static defaultProps = {
        cancerGeneFilterEnabled: false,
    };

    constructor(props: MultiSelectionTableProps, context: any) {
        super(props, context);
        makeObservable(this);
        this.sortBy = this.props.defaultSortBy;
    }

    getDefaultColumnDefinition = (
        columnKey: MultiSelectionTableColumnKey,
        columnWidth: number,
        cellMargin: number
    ) => {
        // @ts-ignore
        const defaults: {
            [key in MultiSelectionTableColumnKey]: Column<
                MultiSelectionTableRow
            >;
        } = {
            [MultiSelectionTableColumnKey.GENE]: {
                name: columnKey,
                headerRender: () => {
                    return (
                        <TableHeaderCellFilterIcon
                            cellMargin={cellMargin}
                            dataTest="gene-column-header"
                            className={styles.displayFlex}
                            showFilter={!!this.props.cancerGeneFilterEnabled!}
                            isFiltered={!!this.isFilteredByCancerGeneList}
                            onClickCallback={this.toggleCancerGeneFilter}
                            overlay={getCancerGeneToggledOverlay(
                                !!this.isFilteredByCancerGeneList
                            )}
                        >
                            <span>{columnKey}</span>
                        </TableHeaderCellFilterIcon>
                    );
                },
                render: (data: MultiSelectionTableRow) => {
                    return (
                        <GeneCell
                            tableType={this.props.tableType}
                            selectedGenes={this.props.selectedGenes!}
                            hugoGeneSymbol={data.label}
                            qValue={data.qValue}
                            isCancerGene={data.isCancerGene}
                            oncokbAnnotated={data.oncokbAnnotated}
                            isOncogene={data.isOncokbOncogene}
                            isTumorSuppressorGene={
                                data.isOncokbTumorSuppressorGene
                            }
                            onGeneSelect={this.props.onGeneSelect!}
                        />
                    );
                },
                sortBy: (data: MultiSelectionTableRow) => data.label,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.label.toUpperCase().includes(filterStringUpper);
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.MOLECULAR_PROFILE]: {
                name: columnKey,
                headerRender: () => {
                    return <></>;
                },
                render: (data: MultiSelectionTableRow) => {
                    return (
                        <div className={styles.labelContent}>
                            <EllipsisTextTooltip
                                text={data.label}
                            ></EllipsisTextTooltip>
                        </div>
                    );
                },
                sortBy: (data: MultiSelectionTableRow) => data.label,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.label.toUpperCase().includes(filterStringUpper);
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.ANNOTATION]: {
                name: columnKey,
                headerRender: () => {
                    return (
                        <div
                            style={{ marginLeft: cellMargin }}
                            className={styles.displayFlex}
                            data-test="profile-column-header"
                        >
                            {columnKey}
                        </div>
                    );
                },
                render: (data: MultiSelectionTableRow) => {
                    return (
                        <div className={styles.labelContent}>
                            <EllipsisTextTooltip
                                text={data.label}
                            ></EllipsisTextTooltip>
                        </div>
                    );
                },
                sortBy: (data: MultiSelectionTableRow) => data.label,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.label.toUpperCase().includes(filterStringUpper);
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.CASE_LIST]: {
                name: columnKey,
                headerRender: () => {
                    return (
                        <div
                            style={{ marginLeft: cellMargin }}
                            className={styles.displayFlex}
                            data-test="profile-column-header"
                        >
                            {columnKey}
                        </div>
                    );
                },
                render: (data: MultiSelectionTableRow) => {
                    return (
                        <div className={styles.labelContent}>
                            <EllipsisTextTooltip
                                text={data.label}
                            ></EllipsisTextTooltip>
                        </div>
                    );
                },
                sortBy: (data: MultiSelectionTableRow) => data.label,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.label.toUpperCase().includes(filterStringUpper);
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.MUTATION_TYPE]: {
                name: columnKey,
                headerRender: () => {
                    return (
                        <div
                            style={{ marginLeft: cellMargin }}
                            className={styles.displayFlex}
                            data-test="profile-column-header"
                        >
                            {columnKey}
                        </div>
                    );
                },
                render: (data: MultiSelectionTableRow) => {
                    return (
                        <div className={styles.labelContent}>
                            <EllipsisTextTooltip
                                text={data.label}
                            ></EllipsisTextTooltip>
                        </div>
                    );
                },
                sortBy: (data: MultiSelectionTableRow) => data.label,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return data.label.toUpperCase().includes(filterStringUpper);
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.NUMBER]: {
                name: columnKey,
                tooltip: <span>{getTooltip(this.props.tableType, false)}</span>,
                headerRender: () => {
                    return (
                        <TableHeaderCellFilterIcon
                            cellMargin={cellMargin}
                            dataTest="number-column-header"
                            className={`${styles.displayFlex} ${styles.pullRight}`}
                            showFilter={!!this.props.alterationFilterEnabled}
                            isFiltered={!!this.props.filterAlterations}
                        >
                            <span>{columnKey}</span>
                        </TableHeaderCellFilterIcon>
                    );
                },
                render: (data: MultiSelectionTableRow) => (
                    <LabeledCheckbox
                        checked={this.isChecked(data.uniqueKey)}
                        disabled={this.isDisabled(data.uniqueKey)}
                        onChange={event => this.toggleSelectRow(data.uniqueKey)}
                        labelProps={{
                            style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginLeft: cellMargin,
                                marginRight: cellMargin,
                            },
                        }}
                        inputProps={{
                            className: styles.autoMarginCheckbox,
                        }}
                    >
                        <span data-test={'numberOfAlteredCasesText'}>
                            {data.numberOfAlteredCases.toLocaleString()}
                        </span>
                    </LabeledCheckbox>
                ),
                sortBy: (data: MultiSelectionTableRow) =>
                    data.numberOfAlteredCases,
                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string
                ) => {
                    return _.toString(data.numberOfAlteredCases).includes(
                        filterString
                    );
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.FREQ]: {
                name: columnKey,
                tooltip: <span>{getTooltip(this.props.tableType, true)}</span>,
                headerRender: () => {
                    return <div style={{ marginLeft: cellMargin }}>Freq</div>;
                },
                render: (data: MultiSelectionTableRow) => {
                    // this is for backward compatibility after we introduced
                    // numberOfAlteredCasesOnPanel for alteration count services
                    // should be abstracted
                    const alteredCases =
                        'numberOfAlteredCasesOnPanel' in data
                            ? // @ts-ignore
                              data.numberOfAlteredCasesOnPanel
                            : data.numberOfAlteredCases;

                    return getFreqColumnRender(
                        this.props.tableType,
                        data.numberOfProfiledCases,
                        // @ts-ignore
                        alteredCases,
                        data.matchingGenePanelIds || [],
                        this.toggleModal,
                        {
                            marginLeft: cellMargin,
                        },
                        styles.pullRight
                    );
                },
                sortBy: (data: MultiSelectionTableRow) => {
                    // this is for backward compatibility after we introduced
                    // numberOfAlteredCasesOnPanel for alteration count services
                    // should be abstracted
                    if ('numberOfAlteredCasesOnPanel' in data) {
                        if (
                            // @ts-ignore
                            data.numberOfAlteredCasesOnPanel === 0 ||
                            // @ts-ignore
                            data.numberOfProfiledCases === 0
                        ) {
                            return 0;
                        } else {
                            return (
                                // @ts-ignore
                                (data.numberOfAlteredCasesOnPanel /
                                    // @ts-ignore
                                    data.numberOfProfiledCases) *
                                100
                            );
                        }
                    } else {
                        return (
                            (data.numberOfAlteredCases /
                                data.numberOfProfiledCases) *
                            100
                        );
                    }
                },

                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string
                ) => {
                    return _.toString(
                        getFrequencyStr(
                            data.numberOfAlteredCases /
                                data.numberOfProfiledCases
                        )
                    ).includes(filterString);
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.NUMBER_MUTATIONS]: {
                name: columnKey,
                tooltip: <span>Total number of mutations</span>,
                headerRender: () => {
                    return (
                        <div style={{ marginLeft: cellMargin }}>
                            {MultiSelectionTableColumnKey.NUMBER_MUTATIONS}
                        </div>
                    );
                },
                render: (data: MultiSelectionTableRow) => (
                    <span
                        data-test={'numberOfAlterations'}
                        className={styles.pullRight}
                        style={{
                            marginRight: cellMargin,
                        }}
                    >
                        {data.totalCount.toLocaleString()}
                    </span>
                ),
                sortBy: (data: MultiSelectionTableRow) => data.totalCount,
                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string
                ) => {
                    return _.toString(data.totalCount).includes(filterString);
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.NUMBER_VARIANT_ANNOTATIONS]: {
                name: columnKey,
                tooltip: <span>Total number of variant annotations</span>,
                headerRender: () => {
                    return (
                        <div style={{ marginLeft: cellMargin }}>
                            {
                                MultiSelectionTableColumnKey.NUMBER_VARIANT_ANNOTATIONS
                            }
                        </div>
                    );
                },
                render: (data: MultiSelectionTableRow) => (
                    <span
                        data-test={'numberOfAlterations'}
                        className={styles.pullRight}
                        style={{
                            marginRight: cellMargin,
                        }}
                    >
                        {data.totalCount.toLocaleString()}
                    </span>
                ),
                sortBy: (data: MultiSelectionTableRow) => data.totalCount,
                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string
                ) => {
                    return _.toString(data.totalCount).includes(filterString);
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.NUMBER_STRUCTURAL_VARIANTS]: {
                name: columnKey,
                tooltip: <span>Total number of structural variants</span>,
                headerRender: () => {
                    return (
                        <div style={{ marginLeft: cellMargin }}>
                            {
                                MultiSelectionTableColumnKey.NUMBER_STRUCTURAL_VARIANTS
                            }
                        </div>
                    );
                },
                render: (data: MultiSelectionTableRow) => (
                    <span
                        data-test={'numberOfAlterations'}
                        style={{
                            marginRight: cellMargin,
                        }}
                        className={`${styles.pullRight}`}
                    >
                        {data.totalCount.toLocaleString()}
                    </span>
                ),
                sortBy: (data: MultiSelectionTableRow) => data.totalCount,
                defaultSortDirection: 'desc' as 'desc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string
                ) => {
                    return _.toString(data.totalCount).includes(filterString);
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.CNA]: {
                name: MultiSelectionTableColumnKey.CNA,
                tooltip: (
                    <span>
                        Copy number alteration, only amplifications and deep
                        deletions are shown
                    </span>
                ),
                render: (data: MultiSelectionTableRow) => (
                    <span
                        data-test={'cnaCell'}
                        style={{
                            color: getCNAColorByAlteration(
                                getCNAByAlteration(data.alteration!)
                            ),
                            fontWeight: 'bold',
                        }}
                    >
                        {getCNAByAlteration(data.alteration!)}
                    </span>
                ),
                sortBy: (data: MultiSelectionTableRow) => data.alteration!,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return getCNAByAlteration(data.alteration!).includes(
                        filterStringUpper
                    );
                },
                width: columnWidth,
            },
            [MultiSelectionTableColumnKey.CYTOBAND]: {
                name: MultiSelectionTableColumnKey.CYTOBAND,
                tooltip: <span>Cytoband</span>,
                render: (data: MultiSelectionTableRow) => (
                    <span>{data.cytoband}</span>
                ),
                sortBy: (data: MultiSelectionTableRow) => data.cytoband!,
                defaultSortDirection: 'asc' as 'asc',
                filter: (
                    data: MultiSelectionTableRow,
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return _.isUndefined(data.cytoband)
                        ? false
                        : data.cytoband
                              .toUpperCase()
                              .includes(filterStringUpper);
                },
                width: columnWidth,
            },
        };
        return defaults[columnKey];
    };

    getDefaultCellMargin = (
        columnKey: MultiSelectionTableColumnKey,
        columnWidth: number
    ) => {
        const defaults: { [key in MultiSelectionTableColumnKey]: number } = {
            [MultiSelectionTableColumnKey.GENE]: 0,
            [MultiSelectionTableColumnKey.MOLECULAR_PROFILE]: 0,
            [MultiSelectionTableColumnKey.ANNOTATION]: 0,
            [MultiSelectionTableColumnKey.CASE_LIST]: 0,
            [MultiSelectionTableColumnKey.MUTATION_TYPE]: 0,
            [MultiSelectionTableColumnKey.NUMBER_MUTATIONS]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    columnWidth,
                    this.totalCountLocaleString
                )
            ),
            [MultiSelectionTableColumnKey.NUMBER_VARIANT_ANNOTATIONS]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    columnWidth,
                    this.totalCountLocaleString
                )
            ),
            [MultiSelectionTableColumnKey.NUMBER_STRUCTURAL_VARIANTS]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    columnWidth,
                    this.totalCountLocaleString
                )
            ),
            [MultiSelectionTableColumnKey.NUMBER]: correctMargin(
                (columnWidth -
                    10 -
                    (getFixedHeaderTableMaxLengthStringPixel(
                        this.alteredCasesLocaleString
                    ) +
                        20)) /
                    2
            ),
            [MultiSelectionTableColumnKey.FREQ]: correctMargin(
                getFixedHeaderNumberCellMargin(
                    columnWidth,
                    getFrequencyStr(
                        _.max(
                            this.tableData.map(
                                item =>
                                    (item.numberOfAlteredCases! /
                                        item.numberOfProfiledCases!) *
                                    100
                            )
                        )!
                    )
                )
            ),
            [MultiSelectionTableColumnKey.CYTOBAND]: 0,
            [MultiSelectionTableColumnKey.CNA]: 0,
        };
        return defaults[columnKey];
    };

    @computed
    get maxNumberTotalCount() {
        return _.max(this.tableData.map(item => item.totalCount));
    }

    @computed
    get maxNumberAlteredCasesColumn() {
        return _.max(this.tableData!.map(item => item.numberOfAlteredCases));
    }

    @computed
    get totalCountLocaleString() {
        return this.maxNumberTotalCount === undefined
            ? ''
            : this.maxNumberTotalCount.toLocaleString();
    }

    @computed
    get alteredCasesLocaleString() {
        return this.maxNumberAlteredCasesColumn === undefined
            ? ''
            : this.maxNumberAlteredCasesColumn.toLocaleString();
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
            {} as { [key in MultiSelectionTableColumnKey]: number }
        );
    }

    @computed
    get cellMargin() {
        return _.reduce(
            this.props.columns,
            (acc, column) => {
                acc[column.columnKey] = this.getDefaultCellMargin(
                    column.columnKey,
                    this.columnsWidth[column.columnKey]
                );
                return acc;
            },
            {} as { [key in MultiSelectionTableColumnKey]: number }
        );
    }

    @computed get tableData() {
        return this.isFilteredByCancerGeneList
            ? _.filter(this.props.promise.result, data => data.isCancerGene)
            : this.props.promise.result || [];
    }

    @computed get flattenedFilters() {
        return _.flatMap(this.props.filters);
    }

    @computed get selectableTableData() {
        if (this.flattenedFilters.length === 0) {
            return this.tableData;
        }
        return _.filter(
            this.tableData,
            data => !this.flattenedFilters.includes(data.uniqueKey)
        );
    }

    @computed
    get preSelectedRows() {
        if (this.flattenedFilters.length === 0) {
            return [];
        }
        const order = stringListToIndexSet(this.flattenedFilters);
        return _.chain(this.tableData)
            .filter(data => this.flattenedFilters.includes(data.uniqueKey))
            .sortBy<MultiSelectionTableRow>(data =>
                ifNotDefined(order[data.uniqueKey], Number.POSITIVE_INFINITY)
            )
            .value();
    }

    @computed
    get preSelectedRowsKeys() {
        return this.preSelectedRows.map(row => row.uniqueKey);
    }

    @computed
    get tableColumns() {
        return this.props.columns.map(column => {
            const columnDefinition = this.getDefaultColumnDefinition(
                column.columnKey,
                this.columnsWidth[column.columnKey],
                this.cellMargin[column.columnKey]
            );
            if (column.columnTooltip) {
                columnDefinition.tooltip = column.columnTooltip;
            }
            return columnDefinition;
        });
    }

    @action.bound
    toggleModal(panelName: string) {
        this.modalSettings.modalOpen = !this.modalSettings.modalOpen;
        if (!this.modalSettings.modalOpen) {
            return;
        }
        this.modalSettings.modalPanelName = panelName;
    }

    @action.bound
    closeModal() {
        this.modalSettings.modalOpen = !this.modalSettings.modalOpen;
    }

    @autobind
    toggleCancerGeneFilter(event: any) {
        event.stopPropagation();
        this.props.onChangeCancerGeneFilter(!this.props.filterByCancerGenes);
    }

    @computed get isFilteredByCancerGeneList() {
        return (
            !!this.props.cancerGeneFilterEnabled &&
            this.props.filterByCancerGenes
        );
    }

    @computed get allSelectedRowsKeysSet() {
        return stringListToSet([
            ...this.props.selectedRowsKeys,
            ...this.preSelectedRowsKeys,
        ]);
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
    @observable private _selectionType: SelectionOperatorEnum;

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

    @computed get selectionType() {
        if (this._selectionType) {
            return this._selectionType;
        }
        switch (
            (localStorage.getItem(this.props.tableType) || '').toUpperCase()
        ) {
            case SelectionOperatorEnum.INTERSECTION:
                return SelectionOperatorEnum.INTERSECTION;
            case SelectionOperatorEnum.UNION:
                return SelectionOperatorEnum.UNION;
            default:
                return this.props.tableType === FreqColumnTypeEnum.DATA
                    ? SelectionOperatorEnum.INTERSECTION
                    : SelectionOperatorEnum.UNION;
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
        localStorage.setItem(this.props.tableType, this.selectionType);
    }

    @autobind
    isSelectedRow(data: MultiSelectionTableRow) {
        return this.isChecked(data.uniqueKey);
    }

    @computed get filterKeyToIndexSet() {
        return _.reduce(
            this.props.filters,
            (acc, next, index) => {
                if (Array.isArray(next)) {
                    next.forEach(key => {
                        acc[key] = index;
                    });
                } else {
                    acc[next] = index;
                }

                return acc;
            },
            {} as { [id: string]: number }
        );
    }

    @autobind
    selectedRowClassName(data: MultiSelectionTableRow) {
        const index = this.filterKeyToIndexSet[data.uniqueKey];
        if (index === undefined) {
            return this.props.filters.length % 2 === 0
                ? styles.highlightedEvenRow
                : styles.highlightedOddRow;
        }
        return index % 2 === 0
            ? styles.highlightedEvenRow
            : styles.highlightedOddRow;
    }

    @action.bound
    afterSorting(
        sortBy: MultiSelectionTableColumnKey,
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
                        key={`multiSelect-${tableId}-${this.preSelectedRowsKeys.join(
                            ''
                        )}`}
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
                        showSetOperationsButton={true}
                        setOperationsButtonText={
                            this.props.setOperationsButtonText
                        }
                        numberOfSelectedRows={
                            this.props.selectedRowsKeys.length
                        }
                    />
                )}
                {this.props.genePanelCache ? (
                    <StudyViewGenePanelModal
                        show={this.modalSettings.modalOpen}
                        genePanelCache={this.props.genePanelCache}
                        panelName={this.modalSettings.modalPanelName}
                        onHide={this.closeModal}
                    />
                ) : null}
            </div>
        );
    }
}
