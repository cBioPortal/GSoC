import {
    FUSIONCommandDownstream,
    FUSIONCommandUpstream,
    SingleGeneQuery,
} from 'shared/lib/oql/oql-parser';
import _ from 'lodash';
import {
    alterationIsStructVar,
    queryContainsStructVarAlteration,
    STRUCTVARAnyGeneStr,
    STRUCTVARNullGeneStr,
    STUCTVARDownstreamFusionStr,
    STUCTVARUpstreamFusionStr,
    unparseOQLQueryLine,
} from 'shared/lib/oql/oqlfilter';
import {
    StructuralVariantGeneSubQuery,
    StructuralVariantFilterQuery,
} from 'cbioportal-ts-api-client';
import { STRUCTURAL_VARIANT_FILTER_QUERY_DEFAULTS } from './StudyViewUtils';

export type StructVarGenePair = {
    gene1HugoSymbolOrOql: string;
    gene2HugoSymbolOrOql: string;
};

// This function acts as a toggle. If present in 'geneQueries', the query
// is removed. If absent, a gene1/gene2 struct var query is added.
export function updateStructuralVariantQuery(
    geneQueries: SingleGeneQuery[],
    structvarGene1: string,
    structvarGene2: string
): SingleGeneQuery[] {
    // At this point any gene must be:
    // 1) HUGO gene symbol
    // 2) '*' indicating any gene
    // 3) '-' indicating no gene.
    if (!structvarGene1 || !structvarGene2) {
        return geneQueries;
    }

    // Remove any SV alteration with the same genes (both upstream and downstream fusions are evaluated).
    const updatedQueries = _.filter(
        geneQueries,
        query =>
            !doesStructVarMatchSingleGeneQuery(
                query,
                structvarGene1,
                structvarGene2
            )
    );

    const representativeGene = ![
        STRUCTVARNullGeneStr,
        STRUCTVARAnyGeneStr,
    ].includes(structvarGene1)
        ? structvarGene1
        : structvarGene2;
    const otherGene =
        representativeGene === structvarGene1 ? structvarGene2 : structvarGene1;
    const alterationType =
        representativeGene === structvarGene1
            ? STUCTVARDownstreamFusionStr
            : STUCTVARUpstreamFusionStr;

    if (updatedQueries.length === geneQueries.length) {
        updatedQueries.push({
            gene: representativeGene!,
            alterations: [
                {
                    alteration_type: alterationType,
                    gene: otherGene,
                    modifiers: [],
                },
            ],
        });
    }
    return updatedQueries;
}

export function doesStructVarMatchSingleGeneQuery(
    query: SingleGeneQuery,
    structvarGene1: string,
    structvarGene2: string
) {
    const isStructVar = queryContainsStructVarAlteration(query);
    const isUpstreamMatch =
        query.gene === structvarGene1 &&
        query.alterations &&
        _.some(
            query.alterations,
            (alt: FUSIONCommandUpstream | FUSIONCommandDownstream) =>
                (alt.alteration_type === STUCTVARDownstreamFusionStr &&
                    alt.gene) ||
                STRUCTVARNullGeneStr === structvarGene2
        );
    const isDownstreamMatch =
        query.gene === structvarGene2 &&
        query.alterations &&
        _.some(
            query.alterations,
            (alt: FUSIONCommandUpstream | FUSIONCommandDownstream) =>
                (alt.alteration_type === STUCTVARUpstreamFusionStr &&
                    alt.gene) ||
                STRUCTVARNullGeneStr === structvarGene1
        );
    return isStructVar && (isDownstreamMatch || isUpstreamMatch);
}

export function structVarFilterQueryToOql(
    query: StructuralVariantFilterQuery
): string {
    const gene1 = query.gene1Query.hugoSymbol || '';
    const gene2 = query.gene2Query.hugoSymbol || '';
    // Translate to OQL SingleGeneQuery object.
    const parsed_oql_line: SingleGeneQuery = gene1
        ? {
              gene: gene1,
              alterations: [
                  {
                      gene: gene2,
                      alteration_type: STUCTVARDownstreamFusionStr,
                      modifiers: [],
                  },
              ],
          }
        : {
              gene: gene2,
              alterations: [
                  {
                      gene: gene1,
                      alteration_type: STUCTVARUpstreamFusionStr,
                      modifiers: [],
                  },
              ],
          };
    return unparseOQLQueryLine(parsed_oql_line);
}

export function StructuralVariantFilterQueryFromOql(
    gene1Gene2Representation: string,
    includeDriver?: boolean,
    includeVUS?: boolean,
    includeUnknownOncogenicity?: boolean,
    selectedDriverTiers?: { [tier: string]: boolean },
    includeUnknownDriverTier?: boolean,
    includeGermline?: boolean,
    includeSomatic?: boolean,
    includeUnknownStatus?: boolean
): StructuralVariantFilterQuery {
    if (!gene1Gene2Representation.match('::')) {
        throw new Error(
            "Stuct var representation is not of format 'GeneA::GeneB'. Passed value: " +
                gene1Gene2Representation
        );
    }
    const [
        gene1HugoSymbol,
        gene2HugoSymbol,
    ]: string[] = gene1Gene2Representation.split('::');
    if (!gene1HugoSymbol && !gene2HugoSymbol) {
        throw new Error(
            'Both Gene1 and Gene2 are falsy. Passed value: ' +
                gene1Gene2Representation
        );
    }

    return _.mergeWith(
        {},
        STRUCTURAL_VARIANT_FILTER_QUERY_DEFAULTS,
        {
            gene1Query: createStructVarGeneSubQuery(gene1HugoSymbol),
            gene2Query: createStructVarGeneSubQuery(gene2HugoSymbol),
            includeDriver,
            includeVUS,
            includeUnknownOncogenicity,
            tiersBooleanMap: selectedDriverTiers,
            includeUnknownTier: includeUnknownDriverTier,
            includeGermline,
            includeSomatic,
            includeUnknownStatus,
        },
        (defaultValue, providedValue) =>
            providedValue !== undefined ? providedValue : defaultValue
    );
}

function createStructVarGeneSubQuery(
    hugoGeneSybol: string | undefined
): StructuralVariantGeneSubQuery {
    let stringStructuralVariantGeneSubQuery;
    if (hugoGeneSybol === undefined) {
        stringStructuralVariantGeneSubQuery = {
            specialValue: 'NO_GENE',
        };
    } else if (hugoGeneSybol === STRUCTVARAnyGeneStr) {
        stringStructuralVariantGeneSubQuery = {
            specialValue: 'ANY_GENE',
        };
    } else {
        stringStructuralVariantGeneSubQuery = {
            hugoSymbol: hugoGeneSybol,
        };
    }
    return (stringStructuralVariantGeneSubQuery as unknown) as StructuralVariantGeneSubQuery;
}

export function generateStructVarTableCellKey(
    gene1HugoSymbol: string | undefined,
    gene2HugoSymbol: string | undefined
): string {
    return `${gene1HugoSymbol || STRUCTVARNullGeneStr}::${gene2HugoSymbol ||
        STRUCTVARNullGeneStr}`;
}
export function oqlQueryToStructVarGenePair(
    query: SingleGeneQuery
): StructVarGenePair[] | undefined {
    if (!queryContainsStructVarAlteration(query)) {
        return [];
    }
    const representativeGene = query.gene;
    return _(query.alterations || [])
        .filter(alteration => alterationIsStructVar(alteration))
        .map((alteration: FUSIONCommandDownstream | FUSIONCommandUpstream) => {
            const otherGene = alteration.gene;
            return alteration.alteration_type === STUCTVARUpstreamFusionStr
                ? {
                      gene1HugoSymbolOrOql: otherGene,
                      gene2HugoSymbolOrOql: representativeGene,
                  }
                : {
                      gene1HugoSymbolOrOql: representativeGene,
                      gene2HugoSymbolOrOql: otherGene,
                  };
        })
        .value();
}
