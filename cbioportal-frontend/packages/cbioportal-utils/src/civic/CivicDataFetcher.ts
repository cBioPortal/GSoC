import {
    ICivivEvidenceCountsByType,
    ICivicGeneSummary,
    ICivicVariantSummary,
} from '../model/Civic';
import _ from 'lodash';

type CivicAPIGenes = {
    pageInfo: PageInfo;
    nodes: Array<CivicAPIGene>;
};

type PageInfo = {
    endCursor: string;
    hasNextPage: boolean;
    startCursor: string;
    hasPreviousPage: boolean;
};

type CivicAPIGene = {
    id: number;
    name: string;
    link: string;
    description: string;
    variants: CivicVariantCollection;
};

type CivicVariantCollection = {
    pageInfo: PageInfo;
    nodes: Array<CivicVariant>;
};

type CivicVariant = {
    id: number;
    name: string;
    link: string;
    singleVariantMolecularProfile: CivicMolecularProfile;
};

type CivicMolecularProfile = {
    description: string;
    evidenceCountsByType: ICivivEvidenceCountsByType;
};

function transformCivicVariantsToEvidenceCountMap(
    variants: CivicVariantCollection
): { [variantName: string]: ICivicVariantSummary } {
    // Transform the variants into the desired map format
    const map: { [variantName: string]: ICivicVariantSummary } = {};
    for (const variant of variants.nodes) {
        map[variant.name] = {
            id: variant.id,
            name: variant.name,
            url: 'https://civicdb.org' + variant.link + '/summary',
            description: variant.singleVariantMolecularProfile.description,
            evidenceCounts:
                variant.singleVariantMolecularProfile.evidenceCountsByType,
        };
    }
    return map;
}

export class CivicAPI {
    /**
     * Retrieves the gene entries for the hugo symbols given, if they are in the Civic API.
     * If more than 100 variants available for the gene, send new query for Variants.
     */

    async createCivicVariantSummaryMap(
        variants: CivicVariantCollection,
        geneId: number
    ): Promise<{ [variantName: string]: ICivicVariantSummary }> {
        // Check if hasNextPage is false, if true, call fetchCivicAPIVariants and update the map
        if (!variants.pageInfo.hasNextPage) {
            return transformCivicVariantsToEvidenceCountMap(variants);
        }

        // Call fetchCivicAPIVariants with geneId
        let after: string | null = null;
        let civicVariantSummaryMap: {
            [variantName: string]: ICivicVariantSummary;
        } = {};
        let needToFetch = true;

        while (needToFetch) {
            const variantsByGeneId: CivicVariantCollection = await this.fetchCivicAPIVariants(
                geneId,
                after
            );
            civicVariantSummaryMap = {
                ...civicVariantSummaryMap,
                ...transformCivicVariantsToEvidenceCountMap(variantsByGeneId),
            };

            if (variantsByGeneId.pageInfo.hasNextPage) {
                after = variantsByGeneId.pageInfo.endCursor;
            } else {
                needToFetch = false;
            }
        }
        return civicVariantSummaryMap;
    }

    async getCivicGeneSummaries(
        hugoGeneSymbols: string[]
    ): Promise<ICivicGeneSummary[]> {
        let result: ICivicGeneSummary[] = [];
        // civic genes api can return up to 100 civic genes in a single request (no limit on sending)
        // if result contains more than 100 genes, the first 100 genes will be returned, other queries (genes after 100) will need to be sent again
        // the next query will start from the last gene of previous query (by giving "after" parameter), which is the "endCursor" field returned in previous query
        // set needToFetch to true to make sure the query will be sent at least for the first time
        let needToFetch = true;
        let after = null;
        while (needToFetch) {
            const civicGenes: CivicAPIGenes = await this.fetchCivicAPIGenes(
                hugoGeneSymbols,
                after
            );
            // hasNextPage is true means there are more than 100 genes in the return, and need to make another request
            if (civicGenes.pageInfo?.hasNextPage) {
                // Update endCursor when next page is available
                after = civicGenes.pageInfo.endCursor;
                needToFetch = true;
            } else {
                needToFetch = false;
            }
            const filteredCivicGenes = _.compact(civicGenes.nodes);
            const geneSummaries = _.map(filteredCivicGenes, async record => {
                const variants = await this.createCivicVariantSummaryMap(
                    record.variants,
                    record.id
                );
                const geneSummary: ICivicGeneSummary = {
                    id: record.id,
                    name: record.name,
                    description: record.description,
                    url: 'https://civicdb.org/genes/' + record.id + '/summary',
                    variants,
                };
                return geneSummary;
            });
            result.push(...(await Promise.all(geneSummaries)));
        }
        return Promise.resolve(result);
    }

    // Call Variants if have more than 100 variants. The Variants query can return up to 300 variants in a single query.
    fetchCivicAPIVariants(
        geneId: number,
        after: string | null
    ): Promise<CivicVariantCollection> {
        const url = 'https://civicdb.org/api/graphql';
        const headers = {
            'content-type': 'application/json',
        };
        const body = JSON.stringify({
            variables: {
                geneId: geneId,
                after: after,
            },
            query: `query variants($after: String, $geneId: Int) {
                variants(after: $after, geneId: $geneId) {
                    pageInfo {
                        endCursor
                        hasNextPage
                        startCursor
                        hasPreviousPage
                    }
                    nodes {
                        id
                        name
                        link
                        singleVariantMolecularProfile {
                            description
                            evidenceCountsByType {
                                diagnosticCount
                                predictiveCount
                                prognosticCount
                                predisposingCount
                                oncogenicCount
                                functionalCount
                            }
                        }
                    }
                }
            }`,
        });
        return fetch(url, {
            headers,
            body,
            method: 'POST',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Civic error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(result =>
                Promise.resolve(result.data.variants as CivicVariantCollection)
            );
    }

    fetchCivicAPIGenes(
        entrezSymbols: string[],
        after: string | null
    ): Promise<CivicAPIGenes> {
        const url = 'https://civicdb.org/api/graphql';
        const headers = {
            'content-type': 'application/json',
        };
        const body = JSON.stringify({
            variables: {
                entrezSymbols: entrezSymbols,
                after: after,
            },
            query: `query genes($after: String, $entrezSymbols: [String!]) {
                genes(after: $after, entrezSymbols: $entrezSymbols) {
                    pageInfo {
                        endCursor
                        hasNextPage
                        startCursor
                        hasPreviousPage
                    }
                    nodes {
                        id
                        description
                        link
                        name
                        variants {
                            pageInfo {
                                endCursor
                                hasNextPage
                                startCursor
                                hasPreviousPage
                            }
                            nodes {
                                name
                                id
                                link
                                singleVariantMolecularProfile {
                                    description
                                    evidenceCountsByType {
                                        diagnosticCount
                                        predictiveCount
                                        prognosticCount
                                        predisposingCount
                                        oncogenicCount
                                        functionalCount
                                    }
                                }
                            }
                        }
                    }
                }
            }`,
        });
        return fetch(url, {
            headers,
            body,
            method: 'POST',
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Civic error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(result =>
                Promise.resolve(result.data.genes as CivicAPIGenes)
            );
    }
}

export default CivicAPI;
