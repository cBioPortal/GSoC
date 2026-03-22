import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import { GroupComparisonMutation } from 'shared/model/GroupComparisonMutation';
import { SIGNIFICANT_QVALUE_THRESHOLD } from 'pages/groupComparison/GroupComparisonUtils';

export function getQValueData(
    rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    },
    mutations: Mutation[]
) {
    const rowData = rowDataByProteinChange[mutations[0].proteinChange];

    return rowData.qValue;
}

export function getQValueTextValue(
    rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    },
    mutations: Mutation[]
) {
    const qValue = getQValueData(rowDataByProteinChange, mutations);
    return toConditionalPrecision(qValue, 3, 0.01);
}

export function qValueRenderFunction(
    rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    },
    mutations: Mutation[]
) {
    const qValue = getQValueData(rowDataByProteinChange, mutations);

    return (
        <span
            style={{
                whiteSpace: 'nowrap',
                fontWeight:
                    qValue < SIGNIFICANT_QVALUE_THRESHOLD ? 'bold' : 'normal',
            }}
        >
            {toConditionalPrecisionWithMinimum(qValue, 3, 0.01, -10)}
        </span>
    );
}
