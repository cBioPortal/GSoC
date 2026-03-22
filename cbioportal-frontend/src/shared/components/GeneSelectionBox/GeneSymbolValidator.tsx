import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import {
    GeneReplacement,
    normalizeQuery,
    Focus,
} from 'shared/components/query/QueryStore';
import {
    action,
    computed,
    makeObservable,
} from '../../../../node_modules/mobx';
import { Gene } from 'cbioportal-ts-api-client';
import 'react-select1/dist/react-select.css';
import { remoteData } from 'cbioportal-frontend-commons';
import client from 'shared/api/cbioportalClientInstance';
import memoize from 'memoize-weak-decorator';
import { OQL } from 'shared/components/GeneSelectionBox/OQLTextArea';
import {
    getEmptyGeneValidationResult,
    getOQL,
} from 'shared/components/GeneSelectionBox/GeneSelectionBoxUtils';
import autobind from 'autobind-decorator';
import GeneSymbolValidatorMessage from 'shared/components/GeneSelectionBox/GeneSymbolValidatorMessage';
import { getGenesFromSingleGeneQuery } from 'shared/lib/oql/oqlfilter';

export interface IGeneSymbolValidatorProps {
    deferOqlError?: boolean;
    focus?: Focus;
    errorMessageOnly?: boolean;
    skipGeneValidation: boolean;
    geneQuery: string;
    updateGeneQuery: (newQuery: string) => void;
    afterValidation?: (
        validQuery: boolean,
        validationResult: GeneValidationResult,
        oql: OQL
    ) => void;
    wrap?: boolean;
    replaceGene: (oldSymbol: string, newSymbol: string) => void;
    highlightError?: (oql: OQL) => void;
}

export type GeneValidationResult = {
    found: Gene[];
    suggestions: GeneReplacement[];
};

function isInteger(str: string) {
    return Number.isInteger(Number(str));
}

@observer
export default class GeneSymbolValidator extends React.Component<
    IGeneSymbolValidatorProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    public static defaultProps = {
        errorMessageOnly: false,
    };

    @memoize
    public async getGeneSuggestions(alias: string): Promise<GeneReplacement> {
        return {
            alias,
            genes: await client.getAllGenesUsingGET({ alias }),
        };
    }

    readonly genes = remoteData({
        invoke: async (): Promise<{
            found: Gene[];
            suggestions: GeneReplacement[];
        }> => {
            if (this.geneIds.length === 0) {
                return getEmptyGeneValidationResult();
            }
            let [entrezIds, hugoIds] = _.partition(
                _.uniq(this.geneIds),
                isInteger
            );

            let getEntrezResults = async () => {
                let found: Gene[];
                if (entrezIds.length)
                    found = await client.fetchGenesUsingPOST({
                        geneIdType: 'ENTREZ_GENE_ID',
                        geneIds: entrezIds,
                    });
                else found = [];
                let missingIds = _.difference(
                    entrezIds,
                    found.map(gene => gene.entrezGeneId + '')
                );
                let removals = missingIds.map(entrezId => ({
                    alias: entrezId,
                    genes: [],
                }));
                let replacements = found.map(gene => ({
                    alias: gene.entrezGeneId + '',
                    genes: [gene],
                }));
                let suggestions = [...removals, ...replacements];
                return { found, suggestions };
            };

            let getHugoResults = async () => {
                let found: Gene[];
                if (hugoIds.length)
                    found = await client.fetchGenesUsingPOST({
                        geneIdType: 'HUGO_GENE_SYMBOL',
                        geneIds: hugoIds,
                    });
                else found = [];
                let missingIds = _.difference(
                    hugoIds,
                    found.map(gene => gene.hugoGeneSymbol)
                );
                let suggestions = await Promise.all(
                    missingIds.map(alias => this.getGeneSuggestions(alias))
                );
                return { found, suggestions };
            };

            let [entrezResults, hugoResults] = await Promise.all([
                getEntrezResults(),
                getHugoResults(),
            ]);
            return {
                found: [...entrezResults.found, ...hugoResults.found],
                suggestions: [
                    ...entrezResults.suggestions,
                    ...hugoResults.suggestions,
                ],
            };
        },
        onResult: genes => {
            if (this.props.afterValidation) {
                this.props.afterValidation(
                    genes.suggestions.length === 0,
                    genes,
                    this.oql
                );
            }
        },
        default: getEmptyGeneValidationResult(),
    });

    @computed get oql() {
        return getOQL(this.props.geneQuery);
    }

    @computed private get geneIds(): string[] {
        return this.oql.error
            ? []
            : _(this.oql.query)
                  .flatMap(singleGeneQuery =>
                      getGenesFromSingleGeneQuery(singleGeneQuery)
                  )
                  .uniq()
                  .value();
    }

    @computed
    get oqlOrError(): OQL | Error {
        if (!this.oql.error) {
            return this.oql;
        }
        return new Error(`OQL error at character ${this.oql.error.start}`);
    }

    render() {
        if (this.props.skipGeneValidation) {
            if (this.props.afterValidation) {
                this.props.afterValidation(
                    true,
                    getEmptyGeneValidationResult(),
                    this.oql
                );
            }
        }

        return (
            <GeneSymbolValidatorMessage
                genes={
                    this.props.skipGeneValidation
                        ? getEmptyGeneValidationResult()
                        : this.genes.isError
                        ? new Error('ERROR')
                        : this.genes.result
                }
                highlightError={() => {
                    this.props.highlightError &&
                        this.props.highlightError(this.oql);
                }}
                oql={this.oqlOrError}
                validatingGenes={
                    this.props.skipGeneValidation ? false : this.genes.isPending
                }
                errorMessageOnly={this.props.errorMessageOnly}
                wrapTheContent={this.props.wrap}
                replaceGene={this.props.replaceGene}
            >
                {this.props.children}
            </GeneSymbolValidatorMessage>
        );
    }
}
