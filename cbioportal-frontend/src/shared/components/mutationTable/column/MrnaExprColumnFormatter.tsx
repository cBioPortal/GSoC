import * as React from 'react';
import {
    DefaultTooltip,
    TableCellStatusIndicator,
    TableCellStatus,
} from 'cbioportal-frontend-commons';
import 'rc-tooltip/assets/bootstrap_white.css';
import {
    MrnaExprRankCacheDataType,
    default as MrnaExprRankCache,
} from 'shared/cache/MrnaExprRankCache';
import { Mutation, DiscreteCopyNumberData } from 'cbioportal-ts-api-client';

export default class MrnaExprColumnFormatter {
    protected static getCircleX(
        percentile: number,
        circleLeft: number,
        circleRight: number
    ) {
        const proportion = percentile / 100;
        return circleLeft * (1 - proportion) + circleRight * proportion;
    }

    protected static getCircleFill(percentile: number) {
        if (percentile < 25) {
            return 'blue';
        } else if (percentile > 75) {
            return 'red';
        } else {
            return 'gray';
        }
    }

    protected static getTooltipContents(
        cacheDatum: MrnaExprRankCacheDataType | null
    ) {
        if (
            cacheDatum &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data !== null
        ) {
            return (
                <div>
                    <span>mRNA level of the gene in this tumor</span>
                    <br />
                    <span>
                        <b>mRNA z-score: </b>
                        {cacheDatum.data.zScore}
                    </span>
                    <br />
                    <span>
                        <b>Percentile: </b>
                        {cacheDatum.data.percentile}
                    </span>
                    <br />
                </div>
            );
        } else if (
            cacheDatum &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data === null
        ) {
            return <span>mRNA data is not available for this gene.</span>;
        } else if (cacheDatum && cacheDatum.status === 'error') {
            return <span>Error retrieving data.</span>;
        } else {
            return <span>Querying server for data.</span>;
        }
    }

    private static getTdContents(cacheDatum: MrnaExprRankCacheDataType | null) {
        let status: TableCellStatus | null = null;
        const barWidth = 30;
        const circleRadius = 3;
        const barXLeft = 0;
        const circleXLeft = barXLeft + circleRadius;
        const barXRight = barXLeft + barWidth;
        const circleXRight = barXRight - circleRadius;
        const textWidth = 30;
        const textXLeft = circleXRight + circleRadius + 3;
        const width = textXLeft + textWidth;
        if (
            cacheDatum &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data !== null
        ) {
            return (
                <svg width={width} height={12}>
                    <text x={textXLeft} y={11} textAnchor="start" fontSize={10}>
                        {Math.round(cacheDatum.data.percentile) + '%'}
                    </text>
                    <g>
                        <line
                            x1={barXLeft}
                            y1={8}
                            x2={barXRight}
                            y2={8}
                            style={{ stroke: 'gray', strokeWidth: 2 }}
                        />
                        <circle
                            cx={MrnaExprColumnFormatter.getCircleX(
                                cacheDatum.data.percentile,
                                circleXLeft,
                                circleXRight
                            )}
                            cy={8}
                            r={circleRadius}
                            fill={MrnaExprColumnFormatter.getCircleFill(
                                cacheDatum.data.percentile
                            )}
                        />
                    </g>
                </svg>
            );
        } else if (
            cacheDatum &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data === null
        ) {
            status = TableCellStatus.NA;
        } else if (cacheDatum && cacheDatum.status === 'error') {
            status = TableCellStatus.ERROR;
        } else {
            status = TableCellStatus.LOADING;
        }
        if (status !== null) {
            return (
                <TableCellStatusIndicator
                    status={status}
                    naAlt="mRNA data is not available for this gene."
                />
            );
        }
    }

    public static getDownloadData(
        d: { sampleId: string; entrezGeneId: number }[],
        cache: MrnaExprRankCache
    ) {
        const cacheDatum = MrnaExprColumnFormatter.getData(d, cache);
        if (
            cacheDatum &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data !== null
        ) {
            return cacheDatum.data.percentile.toString();
        } else {
            return 'N/A';
        }
    }

    protected static getData(
        data: { sampleId: string; entrezGeneId: number }[],
        cache: MrnaExprRankCache
    ): MrnaExprRankCacheDataType | null {
        if (data.length === 0) {
            return null;
        }
        const sampleId = data[0].sampleId;
        const entrezGeneId = data[0].entrezGeneId;
        return cache.get({ sampleId, entrezGeneId });
    }
    protected static getDataFromCNA(
        data: DiscreteCopyNumberData[],
        cache: MrnaExprRankCache
    ): MrnaExprRankCacheDataType | null {
        const sampleId = data[0].sampleId;
        const entrezGeneId = data[0].entrezGeneId;
        return cache.get({ sampleId, entrezGeneId });
    }

    private static renderFromCacheDatum(
        cacheDatum: MrnaExprRankCacheDataType | null
    ) {
        return (
            <DefaultTooltip
                placement="left"
                overlay={MrnaExprColumnFormatter.getTooltipContents(cacheDatum)}
                arrowContent={<div className="rc-tooltip-arrow-inner" />}
            >
                {MrnaExprColumnFormatter.getTdContents(cacheDatum)}
            </DefaultTooltip>
        );
    }
    public static renderFunction(data: Mutation[], cache: MrnaExprRankCache) {
        const cacheDatum = MrnaExprColumnFormatter.getData(data, cache);
        return MrnaExprColumnFormatter.renderFromCacheDatum(cacheDatum);
    }

    public static cnaRenderFunction(
        data: DiscreteCopyNumberData[],
        cache: MrnaExprRankCache
    ) {
        const cacheDatum = MrnaExprColumnFormatter.getDataFromCNA(data, cache);
        return MrnaExprColumnFormatter.renderFromCacheDatum(cacheDatum);
    }
}
