import NumericNamespaceColumnFormatter, {
    WithNamespaceColumns,
} from './NumericNamespaceColumnFormatter';
import { Column } from 'shared/components/lazyMobXTable/LazyMobXTable';
import CategoricalNamespaceColumnFormatter from './CategoricalNamespaceColumnFormatter';
import _ from 'lodash';
import { NamespaceColumnConfig } from 'shared/components/namespaceColumns/NamespaceColumnConfig';

export function createNamespaceColumns<T extends WithNamespaceColumns>(
    namespaceColumnConfig?: NamespaceColumnConfig | undefined
) {
    const columns = {} as Record<string, Column<T[]>>;

    if (!namespaceColumnConfig) {
        return columns;
    }

    _.forIn(namespaceColumnConfig, (namespaceColumnNames, namespaceName) =>
        _.forIn(namespaceColumnNames, (type, namespaceColumnName) => {
            const columnName = createNamespaceColumnName(
                namespaceName,
                namespaceColumnName
            );
            const fRender =
                type === 'number'
                    ? (d: T[]) =>
                          NumericNamespaceColumnFormatter.renderFunction(
                              d,
                              namespaceName,
                              namespaceColumnName
                          )
                    : (d: T[]) =>
                          CategoricalNamespaceColumnFormatter.renderFunction(
                              d,
                              namespaceName,
                              namespaceColumnName
                          );
            const fSort =
                type === 'number'
                    ? (d: T[]) =>
                          NumericNamespaceColumnFormatter.sortValue(
                              d,
                              namespaceName,
                              namespaceColumnName
                          )
                    : (d: T[]) =>
                          CategoricalNamespaceColumnFormatter.sortValue(
                              d,
                              namespaceName,
                              namespaceColumnName
                          );

            const fDownload =
                type === 'number'
                    ? (d: T[]) =>
                          NumericNamespaceColumnFormatter.download(
                              d,
                              namespaceName,
                              namespaceColumnName
                          )
                    : (d: T[]) =>
                          CategoricalNamespaceColumnFormatter.download(
                              d,
                              namespaceName,
                              namespaceColumnName
                          );
            columns[columnName] = {
                id: columnName,
                name: columnName,
                render: fRender,
                sortBy: fSort,
                download: fDownload,
                align: type === 'number' ? 'right' : 'left',
            };
        })
    );
    return columns;
}

export function buildNamespaceColumnConfig(
    mutations: WithNamespaceColumns[]
): NamespaceColumnConfig {
    if (!mutations) {
        return {};
    }
    const columnTypes: any = {};
    mutations.forEach(m => {
        _.forIn(m.namespaceColumns, (columns, namespace) => {
            _.forIn(columns, (value, columnName) => {
                if (columnTypes[namespace] === undefined) {
                    columnTypes[namespace] = {};
                }
                if (columnTypes[namespace][columnName] === undefined) {
                    columnTypes[namespace][columnName] = 'number';
                }
                if (
                    _.isString(value) &&
                    columnTypes[namespace][columnName] === 'number'
                ) {
                    columnTypes[namespace][columnName] = 'string';
                }
            });
        });
    });
    return columnTypes;
}

export function createNamespaceColumnName(
    namespaceName: string,
    namespaceColumnName: string
) {
    return namespaceName + ' ' + _.capitalize(namespaceColumnName);
}
