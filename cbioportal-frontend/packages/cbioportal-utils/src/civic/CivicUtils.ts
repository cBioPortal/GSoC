import _ from 'lodash';

import CivicDataFetcher from './CivicDataFetcher';
import {
    ICivicEntry,
    ICivicGeneIndex,
    ICivicGeneSummary,
    ICivicVariantIndex,
    ICivicVariantSummary,
} from '../model/Civic';
import { Mutation } from '../model/Mutation';

export type MutationSpec = {
    gene: { hugoGeneSymbol: string };
    proteinChange: string;
};

const civicClient = new CivicDataFetcher();

export enum CivicAlterationType {
    AMPLIFICATION = 'AMPLIFICATION',
    DELETION = 'DELETION',
}

export const CIVIC_NA_VALUE = 'NA';

/**
 * Asynchronously return a map with Civic information from the genes given.
 */
export function getCivicGenes(hugoSymbols: string[]): Promise<ICivicGeneIndex> {
    return Promise.resolve(civicClient.getCivicGeneSummaries(hugoSymbols)).then(
        (responses: ICivicGeneSummary[]) => {
            return responses.reduce(
                (
                    acc: { [name: string]: ICivicGeneSummary },
                    civicGene: ICivicGeneSummary
                ) => {
                    acc[civicGene.name] = civicGene;
                    return acc;
                },
                {}
            );
        }
    );
}

/**
 * Asynchronously retrieve a map with Civic information from the mutationSpecs given for all genes in civicGenes.
 * If no mutationSpecs are given, then return the Civic information of all the CNA variants of the genes in civicGenes.
 */
export function splitProteinChange(proteinChange: string): string[] {
    // Match any other variants after splitting the name on + or /
    return proteinChange.split(/[+\/]/);
}

export function getCivicVariants(
    civicGenes: ICivicGeneIndex,
    mutationSpecs?: Array<MutationSpec>
): Promise<ICivicVariantIndex> {
    let civicVariants: ICivicVariantIndex = {};
    if (mutationSpecs) {
        const geneToProteinChangeSet: {
            [geneSymbol: string]: Set<String>;
        } = mutationSpecs.reduce((acc, mutation) => {
            const geneSymbol = mutation.gene.hugoGeneSymbol;
            const splittedProteinChanges = splitProteinChange(
                mutation.proteinChange
            );
            if (!acc[geneSymbol]) {
                acc[geneSymbol] = new Set(splittedProteinChanges);
            } else {
                for (const splitProteinChange of splittedProteinChanges) {
                    acc[geneSymbol].add(splitProteinChange);
                }
            }
            return acc;
        }, {} as { [geneSymbol: string]: Set<String> });

        // civicGenes is fetched from civic by giving mutation gene symbols as input
        // so all genes in the civicGenes should be in geneToProteinChangeSet too
        for (const geneSymbol in civicGenes) {
            const proteinChangeSet = geneToProteinChangeSet[geneSymbol];
            const geneVariants = civicGenes[geneSymbol].variants;
            for (const variantName in geneVariants) {
                if (proteinChangeSet.has(variantName)) {
                    if (!civicVariants[geneSymbol]) {
                        civicVariants[geneSymbol] = {};
                    }
                    civicVariants[geneSymbol][variantName] =
                        geneVariants[variantName];
                }
            }
        }
    } else {
        for (const geneSymbol in civicGenes) {
            const geneEntry = civicGenes[geneSymbol];
            const geneVariants = geneEntry.variants;
            if (!_.isEmpty(geneVariants)) {
                for (const variantName in geneVariants) {
                    // Only retrieve CNA variants
                    if (
                        variantName == CivicAlterationType.AMPLIFICATION ||
                        variantName == CivicAlterationType.DELETION
                    ) {
                        civicVariants[geneSymbol][variantName] =
                            geneVariants[variantName];
                    }
                }
            }
        }
    }

    return Promise.resolve(civicVariants);
}

/**
 * Build a Civic Entry with the data given.
 */
export function buildCivicEntry(
    geneEntry: ICivicGeneSummary,
    geneVariants: { [name: string]: ICivicVariantSummary }
) {
    return {
        name: geneEntry.name,
        description: geneEntry.description,
        url: geneEntry.url,
        variants: geneVariants,
    };
}

/**
 * Returns an ICivicEntry if the civicGenes and civicVariants have information about the gene and the mutation (variant) specified. Otherwise it returns null.
 */
export function getCivicEntry(
    mutation: Mutation,
    civicGenes: ICivicGeneIndex,
    civicVariants: ICivicVariantIndex
): ICivicEntry | null {
    let geneSymbol: string = mutation.gene ? mutation.gene.hugoGeneSymbol : '';
    let civicEntry = null;
    //Only search for matching Civic variants if the gene mutation exists in the Civic API
    if (
        civicGenes[geneSymbol] &&
        civicVariants[geneSymbol] &&
        civicVariants[geneSymbol][mutation.proteinChange]
    ) {
        let geneVariants: { [name: string]: ICivicVariantSummary } = {
            [mutation.proteinChange]:
                civicVariants[geneSymbol][mutation.proteinChange],
        };
        let geneEntry: ICivicGeneSummary = civicGenes[geneSymbol];
        civicEntry = buildCivicEntry(geneEntry, geneVariants);
    }

    return civicEntry;
}

export function fetchCivicGenes(
    mutations: Partial<Mutation>[]
): Promise<ICivicGeneIndex> {
    if (mutations.length === 0) {
        return Promise.resolve({});
    }
    const entrezGeneSymbols = _.chain(mutations)
        .map(mutation => mutation.gene?.hugoGeneSymbol)
        .compact()
        .uniq()
        .value();
    return getCivicGenes(entrezGeneSymbols);
}

export function fetchCivicVariants(
    civicGenes: ICivicGeneIndex,
    mutations: Partial<Mutation>[]
): Promise<ICivicVariantIndex> {
    let civicVariants: Promise<ICivicVariantIndex>;

    if (mutations.length > 0) {
        civicVariants = getCivicVariants(
            civicGenes,
            mutations as MutationSpec[]
        );
    } else if (!_.isEmpty(civicGenes)) {
        civicVariants = getCivicVariants(civicGenes);
    } else {
        civicVariants = Promise.resolve({});
    }

    return civicVariants;
}
