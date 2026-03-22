import _ from 'lodash';

export interface ISimpleColumnVisibilityDef {
    name: string;
    id?: string;
    visible?: boolean;
}

export function resolveColumnVisibilityByColumnDefinition(
    columns: ISimpleColumnVisibilityDef[] = []
): { [columnId: string]: boolean } {
    const colVis: { [columnId: string]: boolean } = {};

    columns.forEach((column: ISimpleColumnVisibilityDef) => {
        // every column is visible by default unless it is flagged otherwise
        let visible = true;

        if (column.visible !== undefined) {
            visible = column.visible;
        }

        // if no id exists, just use name for key
        const key = column.id || column.name;

        colVis[key] = visible;
    });

    return colVis;
}

export function resolveColumnVisibility(
    defaultColumnVisibility: { [columnId: string]: boolean },
    currentColumnVisibility?: { [columnId: string]: boolean },
    userSelectionColumnVisibility?: { [columnId: string]: boolean }
): { [columnId: string]: boolean } {
    let colVis: { [columnId: string]: boolean };

    if (currentColumnVisibility) {
        colVis = {
            // if currentColumnVisibility object is provided (e.g. when swtiching transcripts), override corresponding default visibility
            // so if defaultColumnVisibility contains more columns than currentColumnVisibility
            // the extra columns can still keep the default visibility and prevent being lost
            ...defaultColumnVisibility,
            ...currentColumnVisibility,
            // if userSelectionColumnVisibility exists, override to the latest user selection
            ...(userSelectionColumnVisibility || {}),
        };
    } else {
        colVis = {
            // resolve visibility by default column definition
            ...defaultColumnVisibility,
            // if userSelectionColumnVisibility exists, override to the latest user selection
            ...(userSelectionColumnVisibility || {}),
        };
    }

    return colVis;
}

export function toggleColumnVisibility(
    columnVisibility: { [columnId: string]: boolean } | undefined,
    columnId: string,
    columnVisibilityDefs?: ISimpleColumnVisibilityDef[]
): { [columnId: string]: boolean } {
    let colVis = columnVisibility;

    // if not init yet: it means that no prior user action on column visibility
    // just copy the contents from the provided columnVisibility definition
    if (!colVis) {
        colVis = resolveColumnVisibilityByColumnDefinition(
            columnVisibilityDefs
        );
    }

    // toggle column visibility
    colVis[columnId] = !colVis[columnId];

    return colVis;
}
