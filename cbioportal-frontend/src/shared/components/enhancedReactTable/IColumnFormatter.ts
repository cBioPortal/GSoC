import * as React from 'react';

/**
 * @author Selcuk Onur Sumer
 */

export interface IColumnFormatterData<T> {
    name: string; // column name
    tableData?: Array<any>; // entire table data (array of instances)
    rowData?: any; // single instance representing the row data
    columnData?: any; // column specific data
}

export interface IColumnSortFunction {
    (a: any, b: any): number;
}

export interface IColumnFilterFunction {
    (contents: string, filter: string): boolean;
}

export interface IColumnRenderFunction {
    <T>(data: IColumnFormatterData<T>, columnProps?: any): any; // TODO this should return Reactable.Td!
}

export interface IColumnDownloadFunction {
    <T>(data: IColumnFormatterData<T>, columnProps?: any): string;
}

export interface IColumnVisibilityFunction {
    <T>(tableData: Array<T>, columnProps?: any): ColumnVisibility;
}

export interface IColumnDataFunction {
    <T>(data: IColumnFormatterData<T>): any;
}

export type ColumnVisibility = 'visible' | 'hidden' | 'excluded';
