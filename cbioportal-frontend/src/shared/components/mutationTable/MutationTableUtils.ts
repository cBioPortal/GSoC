import {
    defaultFilter,
    ExtendedMutationTableColumnType,
    MutationTableColumn,
} from 'shared/components/mutationTable/MutationTable';
import { Mutation } from 'cbioportal-ts-api-client';
import { getServerConfig } from 'config/config';
import { NamespaceColumnConfig } from 'shared/components/namespaceColumns/NamespaceColumnConfig';
import { createNamespaceColumns } from 'shared/components/namespaceColumns/namespaceColumnsUtils';
import _ from 'lodash';

export function createMutationNamespaceColumns(
    namespaceColumnConfig: NamespaceColumnConfig | undefined
): Record<ExtendedMutationTableColumnType, MutationTableColumn> {
    const columns: Record<
        ExtendedMutationTableColumnType,
        MutationTableColumn
    > = createNamespaceColumns<Mutation>(namespaceColumnConfig);

    _.forEach(
        columns,
        (column: MutationTableColumn, key: ExtendedMutationTableColumnType) => {
            column.filter = (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) => defaultFilter(d, key, filterStringUpper);
            column.visible = !!getServerConfig()
                .skin_mutation_table_namespace_column_show_by_default;
            column.order = 400;
        }
    );
    return columns;
}
