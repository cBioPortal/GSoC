import {
    IColumnRenderFunction,
    IColumnSortFunction,
    IColumnFilterFunction,
    IColumnVisibilityFunction,
    ColumnVisibility,
    IColumnDataFunction,
    IColumnDownloadFunction,
} from './IColumnFormatter';
import { ITableHeaderControlsProps } from '../tableHeaderControls/TableHeaderControls';
import { TableProps } from 'reactable';

/**
 * @author Selcuk Onur Sumer
 */
export interface IEnhancedReactTableProps<T> {
    className?: string; // className for outer div
    reactTableProps?: TableProps; // any available reactable props
    headerControlsProps?: ITableHeaderControlsProps;
    columns?: IColumnDefMap; // column definitions (including component renderers)
    rawData: Array<T>; // raw data
    initItemsPerPage?: number; // initial number of items per page
    initPage?: number; // initial page
    itemsName?: string; // name of items, e.g. "mutations"
    onVisibleRowsChange?: (data: T[]) => void; // executed whenever the visible rows change (sorting or paginating), argument is the row data of visible rows, in order
}

export interface IEnhancedReactTableState {
    columnVisibility: IColumnVisibilityState;
    sortableColumns: Array<string | IColumnSort>;
    filterableColumns: Array<string | IColumnFilter>;
    filter: string;
    itemsPerPage: number;
    currentPage: number;
}

export interface IColumnDefMap {
    [key: string]: IEnhancedReactTableColumnDef;
}

export interface IColumnVisibilityState {
    [key: string]: ColumnVisibility;
}

export interface IColumnVisibilityDef {
    id: string;
    name: string;
    visibility: ColumnVisibility;
}

export interface IEnhancedReactTableColumnDef {
    name: string; // display name for the column header
    header?: React.ReactChild;
    description?: string | JSX.Element; // column description (used as a column header tooltip value)
    formatter?: IColumnRenderFunction; // actual renderer function
    downloader?: IColumnDownloadFunction; // function to determine the download value
    sortable?: IColumnSortFunction | boolean; // boolean indicator, or a custom sort function
    filterable?: IColumnFilterFunction | boolean; // boolean indicator, or a custom filter function
    visible?: IColumnVisibilityFunction | ColumnVisibility; // visibility value, or visibility function
    priority?: number; // column priority (used for column ordering)
    columnProps?: any; // any additional column props (passed as argument to the formatter)
    dataField?: string; // data field to retrieve display data used for sorting (in case no formatter provided, otherwise ignored)
    columnDataFunction?: IColumnDataFunction; // column data function to retrieve display data (in case no formatter provided)
}

export type IColumnSort = {
    column: string;
    sortFunction: IColumnSortFunction;
};

export type IColumnFilter = {
    column: string;
    filterFunction: IColumnFilterFunction;
};

export default IEnhancedReactTableProps;
