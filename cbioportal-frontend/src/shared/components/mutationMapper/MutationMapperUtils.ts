import { Mutation } from 'cbioportal-ts-api-client';
import { GenomeNexusAPI, VariantAnnotation } from 'genome-nexus-ts-api-client';
import { fetchVariantAnnotationsByMutation } from 'react-mutation-mapper';
import { getServerConfig } from 'config/config';
import _ from 'lodash';
import { NamespaceColumnConfig } from 'shared/components/namespaceColumns/NamespaceColumnConfig';
import { createNamespaceColumnName } from 'shared/components/namespaceColumns/namespaceColumnsUtils';

export function normalizeMutation<T extends Pick<Mutation, 'chr'>>(
    mutation: T
) {
    return Object.assign({ chromosome: mutation.chr }, mutation);
}

export function normalizeMutations<T extends Pick<Mutation, 'chr'>>(
    mutations: T[]
) {
    return mutations.map(normalizeMutation);
}

export function createVariantAnnotationsByMutationFetcher(
    fields: string[],
    client: GenomeNexusAPI
) {
    return function(queries: Mutation[]): Promise<VariantAnnotation[]> {
        if (queries.length > 0) {
            return fetchVariantAnnotationsByMutation(
                queries,
                fields,
                getServerConfig().genomenexus_isoform_override_source,
                client
            );
        } else {
            return Promise.resolve([]);
        }
    };
}

export function extractColumnNames(config: NamespaceColumnConfig): string[] {
    return _.flatMap(config, (namespaceCol, namespaceName) =>
        _.keys(namespaceCol).map(namespaceColumnName =>
            createNamespaceColumnName(
                namespaceName.toString(),
                namespaceColumnName
            )
        )
    );
}

function fMerge(refObject: any, addedObject: any) {
    if (_.isArray(refObject)) {
        return refObject.concat(addedObject);
    } else {
        return [addedObject];
    }
}
