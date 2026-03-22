import _ from 'lodash';
import { Column } from 'shared/components/lazyMobXTable/LazyMobXTable';
export function adjustVisibility(
    tableColumns: Record<string, Column<any>>,
    namespaceColumns: string[],
    visibleColumnsProperty: string,
    showNamespaceColumns: boolean
) {
    if (!visibleColumnsProperty) {
        return;
    }
    const visibleColumns = visibleColumnsProperty.split(',');
    _.forIn(tableColumns, function(column, columnName) {
        if (visibleColumns.includes(columnName)) {
            column.visible = true;
        } else {
            // If not specified by name, only show the column when it is a namespace column and
            // the skin_mutation_table_namespace_column_show_by_default is 'true'.
            const isVisible =
                namespaceColumns.includes(columnName) && showNamespaceColumns;
            column.visible = isVisible;
        }
    });
}
