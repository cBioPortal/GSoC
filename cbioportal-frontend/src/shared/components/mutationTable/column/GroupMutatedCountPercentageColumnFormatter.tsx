import * as React from 'react';
import { formatPercentValue } from 'cbioportal-utils';
import { Mutation } from 'cbioportal-ts-api-client';
import { GroupComparisonMutation } from 'shared/model/GroupComparisonMutation';

export function getMutatedCountData(
    rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    },
    groupIndex: number,
    mutations: Mutation[]
) {
    const rowData = rowDataByProteinChange[mutations[0].proteinChange];

    return groupIndex === 0
        ? rowData.groupAMutatedCount
        : rowData.groupBMutatedCount;
}

export function getGroupMutatedCountPercentageTextValue(
    rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    },
    groupIndex: number,
    mutations: Mutation[]
) {
    const rowData = rowDataByProteinChange[mutations[0].proteinChange];

    const mutatedCount = getMutatedCountData(
        rowDataByProteinChange,
        groupIndex,
        mutations
    );
    const percentage = formatPercentValue(
        groupIndex === 0
            ? rowData.groupAMutatedPercentage
            : rowData.groupBMutatedPercentage,
        2
    );

    return `${mutatedCount} (${percentage}%)`;
}

export function groupMutatedCountPercentageRenderFunction(
    rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    },
    groupIndex: number,
    mutations: Mutation[]
) {
    return (
        <span>
            {getGroupMutatedCountPercentageTextValue(
                rowDataByProteinChange,
                groupIndex,
                mutations
            )}
        </span>
    );
}
