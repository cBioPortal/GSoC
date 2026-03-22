import * as React from 'react';
import { getTwoTailedPValue } from '../../../shared/lib/calculation/FisherExactTestCalculator';
import { MutualExclusivity } from '../../../shared/model/MutualExclusivity';
import { calculateQValues } from '../../../shared/lib/calculation/BenjaminiHochbergFDRCalculator';
import Combinatorics from 'js-combinatorics';
import Dictionary = _.Dictionary;
import _ from 'lodash';
import { SampleAlteredMap } from '../ResultsViewPageStoreUtils';

export enum AlteredStatus {
    UNPROFILED = 'unprofiled',
    ALTERED = 'altered',
    UNALTERED = 'unaltered',
}

export function calculateAssociation(logOddsRatio: number): string {
    return logOddsRatio > 0 ? 'Co-occurrence' : 'Mutual exclusivity';
}

export function countOccurences(
    valuesA: AlteredStatus[],
    valuesB: AlteredStatus[]
): [number, number, number, number] {
    let neither = 0;
    let bNotA = 0;
    let aNotB = 0;
    let both = 0;

    valuesA.forEach((valueA, index) => {
        // jump over this comparison if there is a unprofiled value
        if (
            valueA === AlteredStatus.UNPROFILED ||
            valuesB[index] === AlteredStatus.UNPROFILED
        ) {
            return true;
        }
        const valueB = valuesB[index];
        if (
            valueA === AlteredStatus.UNALTERED &&
            valueB === AlteredStatus.UNALTERED
        ) {
            neither++;
        } else if (
            valueA === AlteredStatus.UNALTERED &&
            valueB === AlteredStatus.ALTERED
        ) {
            bNotA++;
        } else if (
            valueA === AlteredStatus.ALTERED &&
            valueB === AlteredStatus.UNALTERED
        ) {
            aNotB++;
        } else {
            both++;
        }
    });
    return [neither, bNotA, aNotB, both];
}

export function calculatePValue(
    a: number,
    b: number,
    c: number,
    d: number
): number {
    return getTwoTailedPValue(a, b, c, d);
}

export function calculateAdjustedPValue(pValue: number, count: number): number {
    let value = pValue * count;
    return value > 1 ? 1 : value;
}

export function calculateLogOddsRatio(
    a: number,
    b: number,
    c: number,
    d: number
): number {
    if (a * d === 0 && b * c === 0) {
        return Infinity;
    }
    return Math.log2((a * d) / (b * c));
}

export function getMutuallyExclusiveCounts(
    data: MutualExclusivity[],
    exclusive: (n: number) => boolean
): [JSX.Element | null, JSX.Element | null] {
    let exclusiveCount = null;
    let significantCount = null;

    const exclusiveData = data.filter(mutualExclusivity =>
        exclusive(mutualExclusivity.logOddsRatio)
    );
    const significantData = exclusiveData.filter(
        mutualExclusivity => mutualExclusivity.qValue < 0.05
    );

    const exclusiveLength = exclusiveData.length;
    const significantLength = significantData.length;
    if (exclusiveLength === 0) {
        exclusiveCount = (
            <span>
                <b>no</b> track pair
            </span>
        );
    } else if (exclusiveLength === 1) {
        exclusiveCount = (
            <span>
                <b>1</b> track pair
            </span>
        );
    } else {
        exclusiveCount = (
            <span>
                <b>{exclusiveLength}</b> track pairs
            </span>
        );
    }

    if (exclusiveLength > 0) {
        if (significantLength === 0) {
            significantCount = <span> (none significant)</span>;
        } else {
            significantCount = (
                <span>
                    {' '}
                    (<b>{significantLength}</b> significant)
                </span>
            );
        }
    }

    return [exclusiveCount, significantCount];
}

export function getTrackPairsCountText(
    data: MutualExclusivity[],
    trackCount: number
): JSX.Element {
    const trackPairsCount = _.size(data);
    const pairText = trackPairsCount > 1 ? 'pairs' : 'pair';
    return (
        <p>
            The analysis tested <b>{trackPairsCount}</b> {pairText} between the{' '}
            <b>{trackCount}</b> tracks in the OncoPrint.
        </p>
    );
}

export function getCountsText(data: MutualExclusivity[]): JSX.Element {
    const mutuallyExclusiveCounts = getMutuallyExclusiveCounts(
        data,
        n => n <= 0
    );
    const coOccurentCounts = getMutuallyExclusiveCounts(data, n => n > 0);

    return (
        <p>
            The query contains {mutuallyExclusiveCounts[0]} with mutually
            exclusive alterations{mutuallyExclusiveCounts[1]}, and{' '}
            {coOccurentCounts[0]} with co-occurrent alterations
            {coOccurentCounts[1]}.
        </p>
    );
}

export function getData(
    isSampleAlteredMap: Dictionary<AlteredStatus[]>
): MutualExclusivity[] {
    let data: MutualExclusivity[] = [];
    const combinations: string[][] = (Combinatorics as any)
        .bigCombination(Object.keys(isSampleAlteredMap), 2)
        .toArray();

    combinations.forEach(combination => {
        const trackA = combination[0];
        const trackB = combination[1];
        const counts = countOccurences(
            isSampleAlteredMap[trackA],
            isSampleAlteredMap[trackB]
        );
        const pValue = calculatePValue(
            counts[0],
            counts[1],
            counts[2],
            counts[3]
        );
        const logOddsRatio = calculateLogOddsRatio(
            counts[0],
            counts[1],
            counts[2],
            counts[3]
        );
        const association = calculateAssociation(logOddsRatio);
        data.push({
            trackA,
            trackB,
            neitherCount: counts[0],
            bNotACount: counts[1],
            aNotBCount: counts[2],
            bothCount: counts[3],
            logOddsRatio,
            pValue,
            qValue: 0,
            association,
        });
    });

    data = _.sortBy(data, ['pValue']);
    const qValues = calculateQValues(
        _.map(data, mutexData => mutexData.pValue)
    );
    data.forEach((mutexData, index) => {
        mutexData.qValue = qValues[index];
    });

    return data;
}

export function getFilteredData(
    data: MutualExclusivity[],
    mutualExclusivityFilter: boolean,
    coOccurenceFilter: boolean,
    significantPairsFilter: boolean
): MutualExclusivity[] {
    return data.filter(mutualExclusivity => {
        let result = false;
        if (mutualExclusivityFilter) {
            result = result || mutualExclusivity.logOddsRatio <= 0;
        }
        if (coOccurenceFilter) {
            result = result || mutualExclusivity.logOddsRatio > 0;
        }
        if (significantPairsFilter) {
            result = result && mutualExclusivity.qValue < 0.05;
        }
        return result;
    });
}

export function formatPValue(pValue: number): string {
    return pValue < 0.001 ? '<0.001' : pValue.toFixed(3);
}

export function formatQValueWithStyle(pValue: number): JSX.Element {
    let formattedPValue = <span>{formatPValue(pValue)}</span>;
    if (pValue < 0.05) {
        formattedPValue = <b>{formattedPValue}</b>;
    }
    return formattedPValue;
}

export function formatLogOddsRatio(logOddsRatio: number): string {
    if (logOddsRatio < -3) {
        return '<-3';
    } else if (logOddsRatio > 3) {
        return '>3';
    }
    return logOddsRatio.toFixed(3);
}

export function getSampleAlteredFilteredMap(
    isSampleAlteredMap: SampleAlteredMap
): SampleAlteredMap {
    const filteredMap: SampleAlteredMap = {};
    _.forIn(isSampleAlteredMap, (alteredStatus, trackOql) => {
        if (alteredStatus && alteredStatus.length > 0) {
            if (
                alteredStatus.filter(
                    status => status != AlteredStatus.UNPROFILED
                ).length > 0
            ) {
                filteredMap[trackOql] = alteredStatus;
            }
        }
    });
    return filteredMap;
}
