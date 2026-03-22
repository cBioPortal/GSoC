import * as React from 'react';
import { createSelector } from 'reselect';
import { Table, Th, Tr, Td, Thead } from 'reactable';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import _ from 'lodash';
import TableHeaderControls from 'shared/components/tableHeaderControls/TableHeaderControls';
import {
    IEnhancedReactTableProps,
    IColumnDefMap,
    IEnhancedReactTableColumnDef,
    IColumnVisibilityState,
    IEnhancedReactTableState,
    IColumnVisibilityDef,
    IColumnSort,
    IColumnFilter,
} from './IEnhancedReactTableProps';
import {
    IColumnFormatterData,
    IColumnSortFunction,
    IColumnFilterFunction,
    IColumnVisibilityFunction,
    ColumnVisibility,
} from './IColumnFormatter';
import './styles.css';
import { getServerConfig } from 'config/config';
import { DownloadControlOption } from 'cbioportal-frontend-commons';

/**
 * @author Selcuk Onur Sumer
 */
export default class EnhancedReactTable<T> extends React.Component<
    IEnhancedReactTableProps<T>,
    IEnhancedReactTableState
> {
    /**
     * Resolves the visible columns and returns the state for the ones except "excluded".
     *
     * @param columns   column definitions
     * @param tableData raw table data
     * @returns {IColumnVisibilityState} column visibility state for not excluded columns
     */
    public static resolveVisibility<T>(
        columns: IColumnDefMap | undefined,
        tableData: Array<T>
    ): IColumnVisibilityState {
        let visibilityState: IColumnVisibilityState = {};

        if (!columns) {
            return visibilityState;
        }

        _.each(_.keys(columns), function(key: string) {
            let column: IEnhancedReactTableColumnDef = columns[key];

            // every column is visible by default unless otherwise marked as hidden or excluded
            let visibility: ColumnVisibility = 'visible';

            if (column.visible) {
                if (_.isFunction(column.visible)) {
                    visibility = (column.visible as IColumnVisibilityFunction)(
                        tableData,
                        column.columnProps
                    );
                } else {
                    visibility = column.visible as ColumnVisibility;
                }
            }

            // do not include "excluded" columns in the state, they will always remain hidden
            // ones set initially to "hidden" can be toggled visible later on.
            if (visibility !== 'excluded') {
                visibilityState[key] = visibility;
            }
        });

        return visibilityState;
    }

    public static columnSort(
        a: IEnhancedReactTableColumnDef,
        b: IEnhancedReactTableColumnDef
    ): number {
        if (a.priority && b.priority) {
            return a.priority - b.priority;
        } else if (a.priority) {
            return -1;
        } else if (b.priority) {
            return 1;
        }
        // sort alphabetically in case of no priority
        else if (a.name > b.name) {
            return 1;
        } else {
            return -1;
        }
    }

    // mapping of column name to column id
    private colNameToId: { [key: string]: string };

    private filteredDataLength: number;

    private shouldSetState: boolean;

    private rawDataSelector = (
        state: IEnhancedReactTableState,
        props: IEnhancedReactTableProps<T>
    ) => props.rawData;

    private columnsSelector = (
        state: IEnhancedReactTableState,
        props: IEnhancedReactTableProps<T>
    ) => props.columns;

    private columnVisibilitySelector = (state: IEnhancedReactTableState) =>
        state.columnVisibility;

    // visible columns depend on both column definitions and visibility
    private visibleColsSelector = createSelector(
        this.columnsSelector,
        this.columnVisibilitySelector,
        (columns: IColumnDefMap, columnVisibility: IColumnVisibilityState) =>
            this.resolveVisible(columns, columnVisibility)
    );

    // sorted list of visible columns are required to calculate table header
    private sortedVisibleColsSelector = createSelector(
        this.visibleColsSelector,
        (visibleCols: IColumnDefMap) => this.resolveOrder(visibleCols)
    );

    // sorted columns depend on column definition, but not on the visibility
    private sortedColsSelector = createSelector(
        this.columnsSelector,
        (columns: IColumnDefMap) => this.resolveOrder(columns)
    );

    private columnVisibilityArraySelector = createSelector(
        this.sortedColsSelector,
        this.columnVisibilitySelector,
        (
            sortedColumns: Array<IEnhancedReactTableColumnDef>,
            columnVisibility: IColumnVisibilityState
        ) =>
            this.resolveColumnVisibility(
                this.colNameToId,
                sortedColumns,
                columnVisibility
            )
    );

    private downloadDataSelector = createSelector(
        this.sortedColsSelector,
        this.columnVisibilitySelector,
        this.rawDataSelector,
        (
            sortedCols: Array<IEnhancedReactTableColumnDef>,
            visibility: IColumnVisibilityState,
            rawData: Array<T>
        ) => this.generateDownloadData(sortedCols, visibility, rawData)
    );

    // we need to calculate the header values every time the visibility or column definitions change
    private headersSelector = createSelector(
        this.sortedVisibleColsSelector,
        (sortedCols: Array<IEnhancedReactTableColumnDef>) =>
            this.generateHeaders(sortedCols)
    );

    // no need to calculate column render values every time the visibility changes,
    // we only need to do it when the column definitions change
    // reactable is clever enough to not render the column if its header is missing
    private rowsSelector = createSelector(
        this.sortedColsSelector,
        this.rawDataSelector,
        (sortedCols: Array<IEnhancedReactTableColumnDef>, rawData: Array<T>) =>
            this.generateRows(sortedCols, rawData)
    );

    constructor(props: IEnhancedReactTableProps<T>) {
        super(props);

        this.colNameToId = this.mapColNameToId(props.columns);

        this.state = {
            columnVisibility: EnhancedReactTable.resolveVisibility(
                props.columns,
                props.rawData
            ),
            sortableColumns: this.resolveSortable(this.props.columns || {}),
            filterableColumns: this.resolveFilterable(this.props.columns || {}),
            filter: '',
            itemsPerPage: this.props.initItemsPerPage || 25,
            currentPage: this.props.initPage || 0,
        };

        // Begin code designed to get around the fact that data filtering happens inside Table
        // but we need that information to properly paginate.

        // Monkey patch to get access to filtered data for pagination num pages calculation
        this.filteredDataLength = props.rawData.length;
        this.shouldSetState = false;

        const setFilteredDataLength = (n: number) => {
            if (n !== this.filteredDataLength) {
                this.filteredDataLength = n;
                this.shouldSetState = true;
            }
        };

        const sendVisibleRows = (tableRenderResult: JSX.Element) => {
            const tbodyElt = tableRenderResult.props.children.find(
                (x: JSX.Element) => x.type === 'tbody'
            );
            const visibleRows = tbodyElt.props.children || [];
            if (this.props.onVisibleRowsChange)
                this.props.onVisibleRowsChange(
                    visibleRows.map((r: JSX.Element) => r.props.rowData)
                );
        };

        const Table_applyFilter = Table.prototype.applyFilter;
        Table.prototype.applyFilter = function() {
            const result = Table_applyFilter.apply(this, arguments);
            setFilteredDataLength(result.length);
            return result;
        };
        const Table_render = Table.prototype.render;
        Table.prototype.render = function() {
            const result = Table_render.apply(this, arguments);
            sendVisibleRows(result);
            return result;
        };
        //

        // binding "this" to handler functions
        this.handleDownload = this.handleDownload.bind(this);
        this.handleFilterInput = this.handleFilterInput.bind(this);
        this.handleVisibilityToggle = this.handleVisibilityToggle.bind(this);
        this.handleChangeItemsPerPage = this.handleChangeItemsPerPage.bind(
            this
        );
        this.handlePreviousPageClick = this.handlePreviousPageClick.bind(this);
        this.handleNextPageClick = this.handleNextPageClick.bind(this);
    }

    public render() {
        let { className, reactTableProps, headerControlsProps } = this.props;

        // always use the initially sorted columns (this.sortedColumns),
        // otherwise already hidden columns will never appear in the dropdown menu!
        let columnVisibility: Array<IColumnVisibilityDef> = this.columnVisibilityArraySelector(
            this.state,
            this.props
        );

        // column headers: an array of Th components
        const headers = this.headersSelector(this.state, this.props);

        // table rows: an array of Tr components
        const rows = this.rowsSelector(this.state, this.props);

        const { firstIndex, numIndexes } = this.rowIndexesOnPage();

        return (
            <div className={className}>
                <TableHeaderControls
                    showCopyAndDownload={
                        getServerConfig().skin_hide_download_controls ===
                        DownloadControlOption.SHOW_ALL
                    }
                    showHideShowColumnButton={true}
                    handleInput={this.handleFilterInput}
                    downloadDataGenerator={this.handleDownload}
                    downloadDataContainsHeader={true}
                    downloadFilename="mutations.csv"
                    showSearch={true}
                    columnVisibilityProps={{
                        className: 'pull-right',
                        /*columnVisibility,*/
                        onColumnToggled: this.handleVisibilityToggle,
                    }}
                    paginationProps={{
                        className: 'pull-right',
                        itemsPerPage: this.state.itemsPerPage,
                        currentPage: this.state.currentPage,
                        onChangeItemsPerPage: this.handleChangeItemsPerPage,
                        onPreviousPageClick: this.handlePreviousPageClick,
                        onNextPageClick: this.handleNextPageClick,
                        textBetweenButtons: `${
                            this.filteredDataLength ? firstIndex + 1 : 0
                        }-${firstIndex + numIndexes} of ${
                            this.filteredDataLength
                        }`,
                        previousPageDisabled: this.state.currentPage === 0,
                        nextPageDisabled:
                            this.state.currentPage >= this.numPages() - 1,
                    }}
                    {...headerControlsProps}
                />
                <Table
                    sortable={this.state.sortableColumns}
                    filterable={this.state.filterableColumns}
                    filterBy={this.state.filter}
                    itemsPerPage={
                        this.state.itemsPerPage === -1
                            ? undefined
                            : this.state.itemsPerPage
                    }
                    currentPage={this.state.currentPage}
                    {...(reactTableProps as any)}
                >
                    {headers}

                    {rows}
                </Table>
            </div>
        );
    }

    componentWillUpdate(
        nextProps: IEnhancedReactTableProps<T>,
        nextState: IEnhancedReactTableState
    ) {
        if (nextState.filter.length === 0) {
            // Normally, the way we update this.filteredDataLength is when Table.applyFilter is
            // called (see "monkey patching" of Table.prototype.applyFilter).
            // But if the filter text is empty, Table.applyFilter is not called and the
            // entire input data is used, so we have to manually catch and handle this case here
            // to keep this.filteredDataLength up to date.
            this.filteredDataLength = this.props.rawData.length;
        }
    }
    componentDidUpdate() {
        if (this.shouldSetState) {
            this.shouldSetState = false;
            this.setState({
                currentPage: Math.max(
                    0,
                    Math.min(this.state.currentPage, this.numPages() - 1)
                ),
            } as IEnhancedReactTableState);
        }
    }

    private rowIndexesOnPage() {
        let firstIndex: number;
        let numIndexes: number;
        if (this.state.itemsPerPage === -1) {
            firstIndex = 0;
            numIndexes = this.filteredDataLength;
        } else {
            firstIndex = this.state.itemsPerPage * this.state.currentPage;
            numIndexes = Math.min(
                this.filteredDataLength - firstIndex,
                this.state.itemsPerPage
            );
        }
        return { firstIndex, numIndexes };
    }

    private numPages(itemsPerPage?: number) {
        itemsPerPage = itemsPerPage || this.state.itemsPerPage;
        if (itemsPerPage === -1) {
            return 1;
        } else {
            return Math.ceil(this.filteredDataLength / itemsPerPage);
        }
    }

    private mapColNameToId(
        columns: IColumnDefMap | undefined
    ): { [key: string]: string } {
        let colNameToId: { [key: string]: string } = {};

        if (columns) {
            _.each(columns, function(
                value: IEnhancedReactTableColumnDef,
                key: string
            ) {
                if (value.name) {
                    if (colNameToId[value.name] != null) {
                        // TODO console.log("[EnhancedReactTable] Warning: Duplicate column name: " + value.name);
                    }
                    colNameToId[value.name] = key;
                }
            });
        }

        return colNameToId;
    }

    /**
     * Generate a list of column definitions sorted by priority.
     *
     * @param columns
     * @returns {Array<IEnhancedReactTableColumnDef>}
     */
    private resolveOrder(
        columns: IColumnDefMap | undefined
    ): Array<IEnhancedReactTableColumnDef> {
        if (columns) {
            return _.values(columns).sort(EnhancedReactTable.columnSort);
        } else {
            return [];
        }
    }

    /**
     * Resolves the IColumnVisibilityDef to be passed to the TableHeaderControls.
     *
     * @param colNameToId
     * @param sortedCols
     * @param columnVisibility
     * @returns {Array<IColumnVisibilityDef>}
     */
    private resolveColumnVisibility(
        colNameToId: { [key: string]: string },
        sortedCols: Array<IEnhancedReactTableColumnDef>,
        columnVisibility: IColumnVisibilityState
    ): Array<IColumnVisibilityDef> {
        let colVis: Array<IColumnVisibilityDef> = [];

        _.each(sortedCols, function(col: IEnhancedReactTableColumnDef) {
            let id: string = colNameToId[col.name];

            if (columnVisibility[id]) {
                colVis.push({
                    id,
                    name: col.name,
                    visibility: columnVisibility[id],
                });
            }
        });

        return colVis;
    }

    private generateHeaders(columns: Array<IEnhancedReactTableColumnDef>) {
        let headers: Array<any> = [];

        _.each(columns, function(columnDef: IEnhancedReactTableColumnDef) {
            // basic content (with no tooltip)
            let headerContent = columnDef.header || (
                <span>{columnDef.name}</span>
            );

            // if description is provided, add a tooltip
            if (columnDef.description) {
                const arrowContent = <div className="rc-tooltip-arrow-inner" />;

                headerContent = (
                    <DefaultTooltip
                        overlay={<span>{columnDef.description}</span>}
                        placement="top"
                        arrowContent={arrowContent}
                    >
                        {headerContent}
                    </DefaultTooltip>
                );
            }

            headers.push(
                <Th key={columnDef.name} column={columnDef.name}>
                    {headerContent}
                </Th>
            );
        });

        return headers;
    }

    private generateDownloadData(
        columns: Array<IEnhancedReactTableColumnDef>,
        visibility: IColumnVisibilityState,
        tableData: Array<T>
    ) {
        const tableDownloadData: string[][] = [];

        // add header
        tableDownloadData[0] = [];
        _.each(columns, (columnDef: IEnhancedReactTableColumnDef) => {
            const colId = this.colNameToId[columnDef.name];

            // don't include excluded columns
            if (colId in visibility && visibility[colId] !== 'excluded') {
                tableDownloadData[0].push(columnDef.name);
            }
        });

        // add rows
        _.each(tableData, (rowData: T, index: number) => {
            const rowDownloadData: string[] = [];

            _.each(columns, (columnDef: IEnhancedReactTableColumnDef) => {
                const colId = this.colNameToId[columnDef.name];

                // include both visible and hidden columns, but not the excluded ones
                if (colId in visibility && visibility[colId] !== 'excluded') {
                    const columnData = this.getColumnData(
                        columnDef,
                        tableData,
                        rowData
                    );

                    if (columnDef.downloader) {
                        rowDownloadData.push(
                            columnDef.downloader(
                                columnData,
                                columnDef.columnProps
                            )
                        );
                    } else {
                        rowDownloadData.push(
                            (columnData.columnData || '').toString()
                        );
                    }
                }
            });

            tableDownloadData.push(rowDownloadData);
        });

        return tableDownloadData;
    }

    private getColumnData(
        columnDef: IEnhancedReactTableColumnDef,
        tableData: Array<T>,
        rowData: T
    ): IColumnFormatterData<T> {
        const data: IColumnFormatterData<T> = {
            name: columnDef.name,
            tableData,
            rowData,
            columnData: null,
        };

        // get column data (may end up being undefined)
        if (columnDef.columnDataFunction) {
            data.columnData = columnDef.columnDataFunction(data);
        } else if (columnDef.dataField) {
            let instance: any = null;

            // also taking into account that row data might be an array of instances
            if (_.isArray(data.rowData) && data.rowData.length > 0) {
                // In case row data is an array of instances, by default retrieving only the first
                // element's data as the column data. For advanced combining of all elements' data,
                // one needs to provide a custom columnData function.
                instance = data.rowData[0];
            } else {
                // assuming that rowData is a flat type instance
                instance = data.rowData;
            }

            if (instance) {
                data.columnData = instance[columnDef.dataField];
            }
        }

        return data;
    }

    private generateRows(
        columns: Array<IEnhancedReactTableColumnDef>,
        tableData: Array<T>
    ) {
        const rows: Array<any> = [];

        _.each(tableData, (rowData: T, index: number) => {
            // columns for this row: an array of Td elements
            const cols = this.generateColumns(columns, tableData, rowData);

            rows.push(
                <Tr key={index} rowData={rowData}>
                    {cols}
                </Tr>
            );
        });

        return rows;
    }

    private generateColumns(
        columns: Array<IEnhancedReactTableColumnDef>,
        tableData: Array<T>,
        rowData: T
    ) {
        const cols: Array<any> = [];

        _.each(columns, (columnDef: IEnhancedReactTableColumnDef) => {
            const columnData = this.getColumnData(
                columnDef,
                tableData,
                rowData
            );
            cols.push(this.generateColumn(columnData, columnDef));
        });

        return cols;
    }

    private generateColumn(
        data: IColumnFormatterData<T>,
        columnDef: IEnhancedReactTableColumnDef
    ) {
        if (columnDef.formatter) {
            return columnDef.formatter(data, columnDef.columnProps);
        } else {
            return (
                <Td
                    key={columnDef.name}
                    column={columnDef.name}
                    value={data.columnData}
                >
                    {data.columnData}
                </Td>
            );
        }
    }

    private resolveVisible(
        columns: IColumnDefMap,
        visibility: IColumnVisibilityState
    ): IColumnDefMap {
        let visibleCols: IColumnDefMap = {};

        _.each(_.keys(visibility), function(key: string) {
            if (visibility[key] === 'visible') {
                visibleCols[key] = columns[key];
            }
        });

        return visibleCols;
    }

    private resolveSortable(
        columns: IColumnDefMap
    ): Array<string | IColumnSort> {
        let sortable: Array<string | IColumnSort> = [];

        _.each(columns, function(column: IEnhancedReactTableColumnDef) {
            if (_.isFunction(column.sortable)) {
                sortable.push({
                    column: column.name,
                    sortFunction: column.sortable as IColumnSortFunction,
                });
            } else if (column.sortable) {
                sortable.push(column.name);
            }
        });

        return sortable;
    }

    private resolveFilterable(
        columns: IColumnDefMap
    ): Array<string | IColumnFilter> {
        let filterable: Array<string | IColumnFilter> = [];

        _.each(columns, function(column: IEnhancedReactTableColumnDef) {
            if (_.isFunction(column.filterable)) {
                filterable.push({
                    column: column.name,
                    filterFunction: column.filterable as IColumnFilterFunction,
                });
            } else if (column.filterable) {
                filterable.push(column.name);
            }
        });

        return filterable;
    }

    private handleFilterInput(filter: string): void {
        this.setState({
            filter,
        } as IEnhancedReactTableState);
    }

    private handleDownload(): string[][] {
        return this.downloadDataSelector(this.state, this.props);
    }

    private handleVisibilityToggle(columnId: String): void {
        const key: string = columnId as string;

        let visibility: ColumnVisibility = this.state.columnVisibility[key];
        const columnVisibility: IColumnVisibilityState = {
            ...this.state.columnVisibility,
        };

        if (visibility === 'hidden') {
            visibility = 'visible';
        } else if (visibility === 'visible') {
            visibility = 'hidden';
        }

        columnVisibility[key] = visibility;

        this.setState({
            columnVisibility,
        } as IEnhancedReactTableState);
    }

    private handleChangeItemsPerPage(itemsPerPage: number) {
        this.setState({
            itemsPerPage,
            currentPage: Math.min(
                this.state.currentPage,
                this.numPages(itemsPerPage) - 1
            ),
        } as IEnhancedReactTableState);
    }

    private handlePreviousPageClick() {
        this.setState({
            currentPage: Math.max(0, this.state.currentPage - 1),
        } as IEnhancedReactTableState);
    }

    private handleNextPageClick() {
        this.setState({
            currentPage: Math.min(
                this.state.currentPage + 1,
                this.numPages() - 1
            ),
        } as IEnhancedReactTableState);
    }
}
