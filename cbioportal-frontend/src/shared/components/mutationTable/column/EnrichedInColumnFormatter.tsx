import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import {
    ComparisonGroup,
    SIGNIFICANT_QVALUE_THRESHOLD,
} from 'pages/groupComparison/GroupComparisonUtils';
import styles from 'pages/resultsView/enrichments/styles.module.scss';
import classNames from 'classnames';
import _ from 'lodash';
import { getTextColor } from 'pages/groupComparison/OverlapUtils';
import { GroupComparisonMutation } from 'shared/model/GroupComparisonMutation';

export function getEnrichedInData(
    rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    },
    mutations: Mutation[]
) {
    const rowData = rowDataByProteinChange[mutations[0].proteinChange];

    return rowData.enrichedGroup;
}

export function getEnrichedInFilterValue(
    rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    },
    mutations: Mutation[],
    filterStringUpper: string
): boolean {
    return getEnrichedInData(rowDataByProteinChange, mutations)
        .toUpperCase()
        .includes(filterStringUpper);
}

export function enrichedInRenderFunction(
    rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    },
    mutations: Mutation[],
    groups: ComparisonGroup[]
) {
    const rowData = rowDataByProteinChange[mutations[0].proteinChange];

    const nameToGroup = _.keyBy(groups, g => g.nameWithOrdinal);
    const significant = rowData.qValue < SIGNIFICANT_QVALUE_THRESHOLD;
    const groupColor =
        significant && groups
            ? nameToGroup[getEnrichedInData(rowDataByProteinChange, mutations)]
                  .color
            : undefined;
    return (
        <div
            className={classNames(styles.Tendency, {
                [styles.Significant]: significant,
                [styles.ColoredBackground]: !!groupColor,
            })}
            style={{
                backgroundColor: groupColor,
                color: groupColor && getTextColor(groupColor),
            }}
        >
            {getEnrichedInData(rowDataByProteinChange, mutations)}
        </div>
    );
}
