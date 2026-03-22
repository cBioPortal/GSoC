import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import { GroupComparisonMutation } from 'shared/model/GroupComparisonMutation';
import { SIGNIFICANT_QVALUE_THRESHOLD } from 'pages/groupComparison/GroupComparisonUtils';

export function getPValueData(
    rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    },
    mutations: Mutation[]
) {
    const rowData = rowDataByProteinChange[mutations[0].proteinChange];

    return rowData.pValue;
}

export function getPValueTextValue(
    rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    },
    mutations: Mutation[]
) {
    const pValue = getPValueData(rowDataByProteinChange, mutations);
    return toConditionalPrecision(pValue, 3, 0.01);
}

export function pValueRenderFunction(
    rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    },
    mutations: Mutation[]
) {
    const pValue = getPValueData(rowDataByProteinChange, mutations);

    return (
        <span
            style={{
                whiteSpace: 'nowrap',
                fontWeight:
                    rowDataByProteinChange[mutations[0].proteinChange].qValue <
                    SIGNIFICANT_QVALUE_THRESHOLD
                        ? 'bold'
                        : 'normal',
            }}
        >
            {toConditionalPrecisionWithMinimum(pValue, 3, 0.01, -10)}
        </span>
    );
}
