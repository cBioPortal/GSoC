import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';
import { Mutation } from 'cbioportal-ts-api-client';
import VariantCountCache from 'shared/cache/VariantCountCache';
import FrequencyBar from 'shared/components/cohort/FrequencyBar';
import { IMutSigData as MutSigData } from 'shared/model/MutSig';
import { VariantCount } from 'cbioportal-ts-api-client';
import { CacheData } from 'shared/lib/LazyMobXCache';
import { getPercentage } from 'shared/lib/FormatUtils';
import { If, Then } from 'react-if';
import {
    TableCellStatusIndicator,
    TableCellStatus,
} from 'cbioportal-frontend-commons';
import MutSigAnnotation from 'shared/components/annotation/MutSig';

type AugVariantCountOutput = CacheData<VariantCount> & {
    hugoGeneSymbol: string;
};

export default class CohortColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        mutSigData: MutSigData | undefined,
        variantCountCache: VariantCountCache
    ) {
        const mutSigQValue: number = CohortColumnFormatter.getMutSigQValue(
            data,
            mutSigData
        );
        const variantCountData = CohortColumnFormatter.getVariantCountData(
            data,
            variantCountCache
        );
        const freqViz = CohortColumnFormatter.makeCohortFrequencyViz(
            variantCountData
        );
        return (
            <div>
                {freqViz !== null && freqViz}
                <If condition={mutSigQValue > 0}>
                    <Then>
                        <MutSigAnnotation qValue={mutSigQValue} />
                    </Then>
                </If>
            </div>
        );
    }

    public static getSortValue(
        data: Mutation[],
        variantCountCache: VariantCountCache
    ): number | null {
        const variantCountData = CohortColumnFormatter.getVariantCountData(
            data,
            variantCountCache
        );
        if (variantCountData && variantCountData.data) {
            return variantCountData.data.numberOfSamplesWithMutationInGene;
        } else {
            return null;
        }
    }

    private static getVariantCountData(
        data: Mutation[],
        cache: VariantCountCache
    ): AugVariantCountOutput | null {
        if (data.length === 0) {
            return null;
        }
        const entrezGeneId = data[0].entrezGeneId;
        const keyword = data[0].keyword;

        let cacheDatum = cache.get({ entrezGeneId, keyword });
        if (cacheDatum) {
            return {
                hugoGeneSymbol: data[0].gene.hugoGeneSymbol,
                ...cacheDatum,
            };
        } else {
            return null;
        }
    }

    private static getMutSigQValue(
        data: Mutation[],
        mutSigData: MutSigData | undefined
    ): number {
        if (!mutSigData || data.length === 0) {
            return -1;
        }
        const thisData = mutSigData[data[0].entrezGeneId];
        if (!thisData) {
            return -1;
        }
        return thisData.qValue;
    }

    private static makeCohortFrequencyViz(
        variantCount: AugVariantCountOutput | null
    ) {
        let status: TableCellStatus | null = null;
        if (variantCount === null) {
            status = TableCellStatus.LOADING;
        } else if (variantCount.status === 'error') {
            status = TableCellStatus.ERROR;
        } else if (variantCount.data === null) {
            status = TableCellStatus.NA;
        } else {
            const counts = [
                variantCount.data.numberOfSamplesWithMutationInGene,
            ];

            if (variantCount.data.keyword) {
                counts.push(variantCount.data.numberOfSamplesWithKeyword!);
            }

            return (
                <FrequencyBar
                    counts={counts}
                    totalCount={variantCount.data.numberOfSamples}
                    tooltip={CohortColumnFormatter.getCohortFrequencyTooltip(
                        variantCount
                    )}
                />
            );
        }
        if (status !== null) {
            return <TableCellStatusIndicator status={status} />;
        }
    }

    private static getBoldPercentage(proportion: number) {
        return <b>{getPercentage(proportion)}</b>;
    }

    private static getCohortFrequencyTooltip(
        variantCount: AugVariantCountOutput | null
    ) {
        let message: string;
        if (variantCount === null) {
            return <span>Querying server for data.</span>;
        } else if (variantCount.status === 'error') {
            return <span>Error retrieving data.</span>;
        } else if (variantCount.data === null) {
            return <span>Count data is not available for this gene.</span>;
        } else {
            return (
                <div>
                    <span>
                        {variantCount.data.numberOfSamplesWithMutationInGene}{' '}
                        samples (
                        {CohortColumnFormatter.getBoldPercentage(
                            variantCount.data
                                .numberOfSamplesWithMutationInGene /
                                variantCount.data.numberOfSamples
                        )}
                        ) in this study have mutated{' '}
                        {variantCount.hugoGeneSymbol}
                        {typeof variantCount.data.keyword !== 'undefined' && (
                            <span>
                                , out of which{' '}
                                {variantCount.data.numberOfSamplesWithKeyword} (
                                {CohortColumnFormatter.getBoldPercentage(
                                    variantCount.data
                                        .numberOfSamplesWithKeyword! /
                                        variantCount.data.numberOfSamples
                                )}
                                ) have {variantCount.data.keyword} mutations
                            </span>
                        )}
                        .
                    </span>
                </div>
            );
        }
    }
}
