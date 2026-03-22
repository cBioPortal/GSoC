import * as React from 'react';
import _ from 'lodash';

import { Mutation } from 'cbioportal-utils';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';

import { OncoKbSummaryTable, LEVELS } from 'oncokb-frontend-commons';
import { makeObservable } from 'mobx';
import {
    getTumorTypeName,
    getTumorTypeNameWithExclusionInfo,
} from 'oncokb-frontend-commons';

type OncoKbTrackTooltipProps = {
    usingPublicOncoKbInstance: boolean;
    mutations: Mutation[];
    indicatorData?: IndicatorQueryResp[];
    hugoGeneSymbol?: string;
};

export function oncoKbTooltip(
    usingPublicOncoKbInstance: boolean,
    indicatorData: IndicatorQueryResp[]
) {
    const sampleCount = indicatorData.length;

    // generate info

    const pluralSuffix = sampleCount > 1 ? 's' : undefined;
    const groupedByImplication = _.groupBy(indicatorData, 'oncogenic');
    const oncogenicKeywords = _.keys(groupedByImplication).map(keyword => (
        <b>{keyword}</b>
    ));
    let oncogenicInfo: (JSX.Element | string)[] = [];

    if (oncogenicKeywords.length > 1) {
        // join all except the last one with ','
        const joined = oncogenicKeywords
            .slice(0, oncogenicKeywords.length - 1)
            .reduce((prev: JSX.Element, curr: JSX.Element): any => [
                prev,
                ', ',
                curr,
            ]);

        oncogenicInfo.push(joined);

        // add the last one after "and"
        oncogenicInfo.push(' and ');
        oncogenicInfo.push(oncogenicKeywords[oncogenicKeywords.length - 1]);
    } else {
        // use oncogenic keywords array as is
        oncogenicInfo = oncogenicKeywords;
    }

    const groupedByProteinChange = _.groupBy(
        indicatorData,
        d => d.query.alteration
    );
    const tableData = _.keys(groupedByProteinChange).map(proteinChange => ({
        count: groupedByProteinChange[proteinChange].length,
        proteinChange: proteinChange,
        clinicalImplication: _.uniq(
            groupedByProteinChange[proteinChange].map(indicator =>
                indicator.oncogenic ? indicator.oncogenic : 'Unknown'
            )
        ),
        biologicalEffect: _.uniq(
            groupedByProteinChange[proteinChange].map(indicator =>
                indicator.mutationEffect && indicator.mutationEffect.knownEffect
                    ? indicator.mutationEffect.knownEffect
                    : 'Unknown'
            )
        ),
        level: generateLevelData(groupedByProteinChange[proteinChange]),
    }));

    // generate the tooltip

    return (
        <span>
            <b>{sampleCount}</b> sample{pluralSuffix} with {oncogenicInfo}{' '}
            mutations.
            <OncoKbSummaryTable
                usingPublicOncoKbInstance={usingPublicOncoKbInstance}
                data={tableData}
            />
        </span>
    );
}

export function generateLevelData(indicatorData: IndicatorQueryResp[]) {
    const levels: { [level: string]: string[] } = {};

    indicatorData.forEach(indicator => {
        indicator.treatments.forEach(treatment => {
            const parts = treatment.level.split('_');
            const level = parts.length === 2 ? parts[1] : treatment.level;

            levels[level] = levels[level] || [];
            levels[level].push(
                getTumorTypeNameWithExclusionInfo(
                    treatment.levelAssociatedCancerType,
                    treatment.levelExcludedCancerTypes
                )
            );
        });
    });

    return _.keys(levels)
        .sort((a, b) =>
            LEVELS.all.indexOf(a) > LEVELS.all.indexOf(b) ? -1 : 1
        )
        .map(level => ({ level: level, tumorTypes: _.uniq(levels[level]) }));
}

export const OncoKbTrackTooltip: React.FunctionComponent<OncoKbTrackTooltipProps> = props => {
    return props.indicatorData
        ? oncoKbTooltip(props.usingPublicOncoKbInstance, props.indicatorData)
        : null;
};
