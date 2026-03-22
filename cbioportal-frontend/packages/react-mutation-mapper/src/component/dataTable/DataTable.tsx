import autobind from 'autobind-decorator';
import {
    resolveColumnVisibility,
    resolveColumnVisibilityByColumnDefinition,
} from 'cbioportal-frontend-commons';
import { getRemoteDataGroupStatus, RemoteData } from 'cbioportal-utils';
import classnames from 'classnames';
import _ from 'lodash';
import {
    action,
    computed,
    IReactionDisposer,
    IReactionPublic,
    observable,
    reaction,
    makeObservable,
} from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import ReactTable, { Column, RowInfo, TableProps } from 'react-table';

import { DataFilter } from '../../model/DataFilter';
import { DataStore } from '../../model/DataStore';
import { TEXT_INPUT_FILTER_ID } from '../../util/FilterUtils';
import { ColumnSelectorProps, ColumnVisibilityDef } from './ColumnSelector';
import { DataTableToolbar } from './DataTableToolbar';

export type DataTableColumn<T> = Column<T> & {
    name?: string;
    togglable?: boolean;
    searchable?: boolean;
};

export enum ColumnSortDirection {
    ASC = 'asc',
    DESC = 'desc',
}

export type ColumnSort = {
    column: string;
    sortDirection?: ColumnSortDirection;
};

export type DataTableProps<T> = {
    data?: T[];
    dataStore?: DataStore;
    columns?: DataTableColumn<T>[];
    className?: string;
    reactTableProps?: Partial<TableProps<T>>;

    initialSort?: ColumnSort[];
    initialSortRemoteData?: (RemoteData<any> | undefined)[];
    initialItemsPerPage?: number;

    highlightColorLight?: string;
    highlightColorDark?: string;

    showColumnVisibility?: boolean;
    showSearchBox?: boolean;
    onSearch?: (
        input: string,
        visibleSearchableColumns: DataTableColumn<T>[]
    ) => void;
    searchDelay?: number;
    searchPlaceholder?: string;
    info?: JSX.Element;
    columnVisibility?: { [columnId: string]: boolean };
    columnSelectorProps?: ColumnSelectorProps;
};

export function getInitialSortDataStatus(
    initialSortRemoteData?: (RemoteData<any> | undefined)[]
) {
    return initialSortRemoteData
        ? getRemoteDataGroupStatus(..._.compact(initialSortRemoteData))
        : 'complete';
}

function getColumnVisibilityDef<T>(
    columns: DataTableColumn<T>[],
    columnVisibility: { [columnId: string]: boolean }
) {
    const colVisProp: ColumnVisibilityDef[] = [];

    (columns || [])
        .filter(column => column.id)
        .forEach(column =>
            colVisProp.push({
                id: column.id!,
                name: column.name || column.id!,
                visible: columnVisibility[column.id!],
                togglable:
                    column.togglable !== undefined ? column.togglable : true,
            })
        );

    return colVisProp;
}

export default class DataTable<T> extends React.Component<
    DataTableProps<T>,
    {}
> {
    public static defaultProps = {
        data: [],
        initialItemsPerPage: 10,
        highlightColorLight: '#B0BED9',
        highlightColorDark: '#9FAFD1',
    };

    private filterInput: HTMLInputElement | undefined;
    private filterInputReaction: IReactionDisposer | undefined;

    // this keeps the state of the latest action (latest user selection)
    @observable
    private _columnVisibilityOverride:
        | { [columnId: string]: boolean }
        | undefined;

    @observable
    private expanded: { [index: number]: boolean } = {};

    constructor(props: DataTableProps<T>) {
        super(props);

        makeObservable<
            DataTable<T>,
            | '_columnVisibilityOverride'
            | 'expanded'
            | 'onSearch'
            | 'onVisibilityToggle'
            | 'updateColumnVisibility'
            | 'onExpandedChange'
            | 'resetExpander'
        >(this);

        this.filterInputReaction = this.props.dataStore
            ? this.createFilterInputResetReaction(this.props.dataStore)
            : undefined;
    }

    @computed
    get tableData(): T[] | undefined {
        let data = this.props.data;

        if (this.props.dataStore) {
            data =
                this.props.dataStore.sortedFilteredSelectedData.length > 0
                    ? this.props.dataStore.sortedFilteredSelectedData
                    : this.props.dataStore.sortedFilteredData;
        }

        return data;
    }

    @computed
    get columns(): DataTableColumn<T>[] {
        return (this.props.columns || []).map(c => ({
            ...c,
            show: c.id ? this.columnVisibility[c.id] : c.expander || c.show,
        }));
    }

    @computed
    get needToCustomizeRowStyle() {
        return this.props.dataStore && this.props.dataStore.highlightFilters;
    }

    @computed
    get showPagination() {
        const initialItemsPerPage = this.props.initialItemsPerPage;

        return (
            this.tableData !== undefined &&
            this.tableData.length > initialItemsPerPage!
        );
    }

    @computed
    get initialSortDataStatus() {
        return getInitialSortDataStatus(this.props.initialSortRemoteData);
    }

    @computed
    get defaultSorted() {
        // we need to wait for the async data to complete,
        // otherwise initial sort won't work
        if (
            this.props.initialSort === undefined ||
            this.initialSortDataStatus === 'pending'
        ) {
            return undefined;
        } else {
            return this.props.initialSort.map(s => ({
                id: s.column,
                desc: s.sortDirection !== ColumnSortDirection.ASC, // default: DESC
            }));
        }
    }

    @computed
    public get columnVisibility(): { [columnId: string]: boolean } {
        return resolveColumnVisibility(
            this.columnVisibilityByColumnDefinition,
            this.props.columnVisibility,
            this._columnVisibilityOverride
        );
    }

    @computed
    public get columnVisibilityDef(): ColumnVisibilityDef[] {
        return getColumnVisibilityDef(
            this.props.columns || [],
            this.columnVisibility
        );
    }

    @computed
    public get columnVisibilityByColumnDefinition() {
        return resolveColumnVisibilityByColumnDefinition(
            (this.props.columns || [])
                .filter(c => c.id)
                .map(c => ({
                    name: c.name || c.id!,
                    id: c.id,
                    visible: c.show,
                }))
        );
    }

    public render() {
        return (
            <div className="cbioportal-frontend">
                <DataTableToolbar
                    visibilityToggle={this.onVisibilityToggle}
                    showSearchBox={this.props.showSearchBox}
                    onSearch={this.onSearch}
                    filterInputRef={this.filterInputRef}
                    searchDelay={this.props.searchDelay}
                    searchPlaceHolder={this.props.searchPlaceholder}
                    info={this.props.info}
                    showColumnVisibility={this.props.showColumnVisibility}
                    columnVisibility={this.columnVisibilityDef}
                    columnSelectorProps={this.props.columnSelectorProps}
                />
                <div
                    className={classnames(
                        this.props.className,
                        'cbioportal-frontend',
                        'default-data-table'
                    )}
                >
                    <ReactTable
                        data={this.tableData}
                        columns={this.columns}
                        getTrProps={
                            this.needToCustomizeRowStyle
                                ? this.getTrProps
                                : undefined
                        }
                        defaultSorted={this.defaultSorted}
                        defaultPageSize={this.props.initialItemsPerPage}
                        showPagination={this.showPagination}
                        className="-striped -highlight"
                        previousText="<"
                        nextText=">"
                        expanded={this.expanded}
                        onExpandedChange={this.onExpandedChange}
                        onPageChange={this.resetExpander}
                        onPageSizeChange={this.resetExpander}
                        onSortedChange={this.resetExpander}
                        minRows={1}
                        {...this.props.reactTableProps}
                    />
                </div>
            </div>
        );
    }

    componentWillReceiveProps(nextProps: Readonly<DataTableProps<T>>) {
        if (nextProps.dataStore) {
            this.createExpanderResetReaction(nextProps.dataStore);
        }
    }

    componentWillUnmount(): void {
        if (this.filterInputReaction) {
            this.filterInputReaction();
        }
    }

    /**
     * This reaction is to reset expander component every time the data or selection filters update.
     * It would be cleaner if we could do this with a ReactTable callback (something like onDataChange),
     * but no such callback exists.
     */
    protected createExpanderResetReaction(dataStore: DataStore) {
        return reaction(
            () => [dataStore.selectionFilters, dataStore.dataFilters],
            (
                filters: DataFilter[][],
                prev: DataFilter[][],
                disposer: IReactionPublic
            ) => {
                if (filters.length > 0) {
                    this.resetExpander();
                }
                disposer.dispose();
            }
        );
    }

    /**
     * This reaction is to reset search input box content when text input filter is reset.
     * TODO if possible directly render the value in the actual search box component instead of adding this reaction
     */
    protected createFilterInputResetReaction(dataStore: DataStore) {
        return reaction(
            () => dataStore.dataFilters,
            dataFilters => {
                if (this.filterInput) {
                    const inputFilter = dataFilters.find(
                        f => f.id === TEXT_INPUT_FILTER_ID
                    );

                    // reset the input text value in case of no text input filter
                    if (!inputFilter) {
                        this.filterInput.value = '';
                    }
                }
            }
        );
    }

    @autobind
    protected getTrProps(state: any, row?: RowInfo) {
        return {
            style: {
                background: state && row && this.getRowBackground(row),
            },
        };
    }

    @autobind
    protected filterInputRef(input: HTMLInputElement) {
        this.filterInput = input;
    }

    @action.bound
    protected onSearch(searchText: string) {
        if (this.props.onSearch) {
            this.props.onSearch(
                searchText,
                this.columns.filter(c => c.searchable && c.show)
            );
        }
    }

    @action.bound
    protected onVisibilityToggle(selectedColumnIds: string[]) {
        // reset all column visibility
        Object.keys(this.columnVisibility).forEach(columnId =>
            this.updateColumnVisibility(columnId, false)
        );

        // make selected columns visible
        selectedColumnIds.forEach(columnId =>
            this.updateColumnVisibility(columnId, true)
        );
    }

    @action.bound
    protected updateColumnVisibility(id: string, visible: boolean) {
        // no previous action, need to init
        if (this._columnVisibilityOverride === undefined) {
            this._columnVisibilityOverride = resolveColumnVisibility(
                this.columnVisibilityByColumnDefinition,
                this.props.columnVisibility
            );
        }

        // update visibility
        if (
            this._columnVisibilityOverride &&
            this._columnVisibilityOverride[id] !== undefined
        ) {
            this._columnVisibilityOverride[id] = visible;
        }
    }

    @action.bound
    protected onExpandedChange(expanded: { [index: number]: boolean }) {
        this.expanded = expanded;
    }

    @action.bound
    protected resetExpander() {
        this.expanded = {};
    }

    protected isRowHighlighted(datum: T) {
        return (
            this.props.dataStore &&
            this.props.dataStore.dataHighlightFilter(datum)
        );
    }

    protected getRowBackground(row: RowInfo) {
        let background: string | undefined;

        if (this.isRowHighlighted(row.original)) {
            background =
                row.viewIndex % 2 === 1
                    ? this.props.highlightColorDark
                    : this.props.highlightColorLight;
        }

        return background;
    }
}
