import { Mutation } from 'cbioportal-ts-api-client';
import { getSimplifiedMutationType } from '../../shared/lib/oql/AccessorsForOqlFilter';

export function countMutations(
    mutations: Pick<
        Mutation,
        'entrezGeneId' | 'proteinPosStart' | 'proteinPosEnd'
    >[]
) {
    const mutationPositionIdentifiers: any = {};
    for (const mutation of mutations) {
        const key = mutationCountByPositionKey(mutation);
        mutationPositionIdentifiers[key] = {
            entrezGeneId: mutation.entrezGeneId,
            proteinPosStart: mutation.proteinPosStart,
            proteinPosEnd: mutation.proteinPosEnd,
        };
    }
    return mutationPositionIdentifiers;
}

export function mutationCountByPositionKey(obj: {
    entrezGeneId: number;
    proteinPosStart: number;
    proteinPosEnd: number;
}) {
    return `${obj.entrezGeneId}_${obj.proteinPosStart}_${obj.proteinPosEnd}`;
}
