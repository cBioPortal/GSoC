import { scaleLinear, scaleLog } from 'd3-scale';
import _ from 'lodash';
import { getSampleViewUrl, getStudySummaryUrl } from 'shared/api/urls';
import * as React from 'react';
import {
    ClinicalViolinPlotBoxData,
    ClinicalViolinPlotIndividualPoint,
} from 'cbioportal-ts-api-client';
import { toFixedWithoutTrailingZeros } from 'shared/lib/FormatUtils';
import joinJsx from 'shared/lib/joinJsx';

export function getDataX(
    violinX: number,
    dataBounds: { min: number; max: number },
    plotWidth: number
) {
    // inverse of getViolinX
    // map from violin scale to data scale
    return (
        dataBounds.min +
        ((violinX - violinPlotXPadding) * (dataBounds.max - dataBounds.min)) /
            plotWidth
    );
}

export function getViolinX(
    dataX: number,
    dataBounds: { min: number; max: number },
    plotWidth: number
) {
    // map from data scale to violin scale
    return (
        violinPlotXPadding +
        ((dataX - dataBounds.min) * plotWidth) /
            (dataBounds.max - dataBounds.min)
    );
}

function isPowerOfTen(x: number) {
    const str = x.toString();
    return str[0] === '1' && parseFloat(str.substring(1)) === 0;
}
export function getTickValues(
    bounds: { min: number; max: number },
    chartDimensionWidth: number,
    logScale: boolean
) {
    let range = [bounds.min, bounds.max];
    let ret = [...range];
    const numTotalTicks = 2 * chartDimensionWidth;
    const numMiddleTicks = numTotalTicks - 2; // we will always have the start and end as ticks
    if (logScale) {
        range = range.map(Math.exp);
        let middleTicks = scaleLog()
            .domain(range)
            .ticks();
        if (middleTicks.length > numMiddleTicks) {
            // first just take out all non-multiples of ten
            middleTicks = middleTicks.filter(x => x % 10 === 0);
        }
        if (middleTicks.length > numMiddleTicks) {
            // if still too many, filter out non-powers of ten
            middleTicks = middleTicks.filter(isPowerOfTen);
        }
        while (middleTicks.length > numMiddleTicks) {
            // if still too many, iteratively filter out every other tick
            middleTicks = middleTicks.filter((x, index) => index % 2 === 0);
        }
        ret.push(...middleTicks.map(x => Math.log(x + 1))); // need to add 1 to counter the inversion
    } else {
        ret.push(
            ...scaleLinear()
                .domain(range)
                .ticks(2 * chartDimensionWidth - 2)
        );
    }

    ret = _.sortBy(_.uniq(ret));
    return ret;
}

export function renderTooltipForBoxPlot(
    boxData: ClinicalViolinPlotBoxData,
    logScale: boolean
) {
    const properties: Partial<
        { [prop in keyof ClinicalViolinPlotBoxData]: string }
    > = {
        median: 'Median',
        q1: 'Quartile 1',
        q3: 'Quartile 3',
    };
    return (
        <>
            {joinJsx(
                _.map(
                    properties,
                    (label: string, prop: keyof ClinicalViolinPlotBoxData) => {
                        return (
                            <>
                                <b>{label}:</b>
                                {` `}
                                <span>
                                    {toFixedWithoutTrailingZeros(
                                        logScale
                                            ? Math.exp(boxData[prop]) - 1
                                            : boxData[prop],
                                        2
                                    )}
                                </span>
                            </>
                        );
                    }
                ),
                <br />
            )}
        </>
    );
}

export function renderTooltipForPoint(
    point: ClinicalViolinPlotIndividualPoint,
    violinColumnName: string,
    logScale: boolean
) {
    return (
        <>
            <b>Study ID:</b>
            {` `}
            <a href={getStudySummaryUrl(point.studyId)}>{point.studyId}</a>
            <br />
            <b>Sample ID:</b>
            {` `}
            <a href={getSampleViewUrl(point.studyId, point.sampleId)}>
                {point.sampleId}
            </a>
            <br />
            <b>{violinColumnName}:</b>
            {` `}
            {toFixedWithoutTrailingZeros(
                logScale ? Math.exp(point.value) - 1 : point.value,
                2
            )}
        </>
    );
}

export const violinPlotXPadding = 5;
export const violinPlotSvgHeight = 30;
