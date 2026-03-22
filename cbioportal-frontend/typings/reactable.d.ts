declare module 'reactable' {
    interface IntrinsicElementProps {
        table: React.HTMLProps<HTMLTableElement>;
        td: React.HTMLProps<HTMLTableDataCellElement>;
        tfoot: React.HTMLProps<HTMLTableSectionElement>;
        th: React.HTMLProps<HTMLTableHeaderCellElement>;
        thead: React.HTMLProps<HTMLTableSectionElement>;
        tr: React.HTMLProps<HTMLTableRowElement>;
    }

    export interface IColumnSortFunction {
        (a: any, b: any): number;
    }

    export interface IColumnFilterFunction {
        (contents: string, filter: string): boolean;
    }

    export type ISortDirection = -1 | 1 | 'desc' | 'asc';

    export type ICurrentSort = {
        column: string;
        direction: ISortDirection;
    };

    export type TableProps = IntrinsicElementProps['table'] & {
        data?: any;
        sortBy?: string | ICurrentSort;
        defaultSort?: string | ICurrentSort;
        defaultSortDescending?: boolean;
        itemsPerPage?: number;
        filterBy?: string;
        hideFilterInput?: boolean;
        pageButtonLimit?: number;
        noDataText?: React.ReactChild;
        filterClassName?: string;
        onFilter?: (filter?: string) => void;
        currentPage?: number;
        hideTableHeader?: boolean;
        sortable?:
            | true
            | Array<
                  | string
                  | { column: string; sortFunction?: IColumnSortFunction }
              >;
        onPageChange?: (page: number) => void;
        onSort?: (currentSort: ICurrentSort) => void;
        columns?: Array<
            | string
            | {
                  key: string;
                  label: string;
                  sortable?: true | IColumnSortFunction;
              }
        >;
        filterable?: Array<
            string | { column: string; filterFunction?: IColumnFilterFunction }
        >;
        filterPlaceholder?: string;
        previousPageLabel?: React.ReactChild;
        nextPageLabel?: React.ReactChild;
    };

    export type TdProps = IntrinsicElementProps['td'] & {
        column: string;
        value?: any;
    };

    export type TfootProps = IntrinsicElementProps['tfoot'] & {};

    export type ThProps = IntrinsicElementProps['th'] & {
        column: string;
    };

    export type TheadProps = IntrinsicElementProps['thead'] & {};

    export type TrProps = IntrinsicElementProps['tr'] & {
        rowData?: any;
    };

    const Table: React.ComponentClass<TableProps>;
    const Td: React.ComponentClass<TdProps>;
    const Tfoot: React.ComponentClass<TfootProps>;
    const Th: React.ComponentClass<ThProps>;
    const Thead: React.ComponentClass<TheadProps>;
    const Tr: React.ComponentClass<TrProps>;

    export { Table, Td, Tfoot, Th, Thead, Tr };
}
