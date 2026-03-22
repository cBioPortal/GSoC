import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { Gene } from 'cbioportal-ts-api-client';
import * as React from 'react';
import AsyncSelect from 'react-select/async';
import GroupComparisonStore from './GroupComparisonStore';

interface ILollipopGeneSelectorProps {
    store: GroupComparisonStore;
    genes: Gene[];
    genesWithMutations: Gene[];
    handleGeneChange: (id?: string) => void;
}

export const LollipopGeneSelector: React.FC<ILollipopGeneSelectorProps> = observer(
    ({
        store,
        genes,
        genesWithMutations,
        handleGeneChange,
    }: ILollipopGeneSelectorProps) => {
        const loadOptions = (inputText: string, callback: any) => {
            if (!inputText) {
                callback([]);
            }
            const stringCompare = (item: any) =>
                item.hugoGeneSymbol.startsWith(inputText.toUpperCase());
            const options = genes;
            callback(
                options
                    .filter(stringCompare)
                    .slice(0, 200)
                    .map(g => ({
                        label: g.hugoGeneSymbol,
                        value: g,
                    }))
            );
        };

        return (
            <div
                data-test="GeneSelector"
                style={{ width: 200, paddingRight: 10 }}
            >
                <AsyncSelect
                    name="Select gene"
                    onChange={(option: any | null) => {
                        if (option) {
                            handleGeneChange(option.value.hugoGeneSymbol);
                        } else {
                            handleGeneChange(undefined);
                        }
                    }}
                    isClearable={true}
                    isSearchable={true}
                    defaultOptions={genesWithMutations
                        .slice(0, 200)
                        .map(gene => ({
                            label: gene.hugoGeneSymbol,
                            value: gene,
                        }))}
                    value={
                        store.activeMutationMapperGene
                            ? {
                                  label:
                                      store.activeMutationMapperGene
                                          .hugoGeneSymbol,
                                  value: store.activeMutationMapperGene,
                              }
                            : null
                    }
                    placeholder={'Search genes'}
                    loadOptions={loadOptions}
                    cacheOptions={true}
                />
            </div>
        );
    }
);
