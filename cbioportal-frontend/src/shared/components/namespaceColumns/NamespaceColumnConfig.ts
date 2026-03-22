// Namespace columns are custom columns that can be added to the MAF file.
// They are imported via the namespace configuration during data import.
// See: https://docs.cbioportal.org/5.1-data-loading/data-loading/file-formats#adding-mutation-annotation-columns-through-namespaces
// The MutationTable component will render these columns dynamically.
export type NamespaceColumnConfig = {
    [namespaceName: string]: {
        [namespaceColumnName: string]: 'string' | 'number';
    };
};
