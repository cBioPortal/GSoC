import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { Mutation } from 'cbioportal-ts-api-client';
import * as React from 'react';
import {
    formatPercentValue,
    numberOfLeadingDecimalZeros,
} from 'cbioportal-utils';
import { AxisScale } from 'react-mutation-mapper';
import _ from 'lodash';

interface ILollipopTooltipCountInfoProps {
    count: number;
    mutations: Mutation[];
    axisMode: AxisScale;
    patientCount: number;
}

export const LollipopTooltipCountInfo: React.FC<ILollipopTooltipCountInfoProps> = ({
    count,
    mutations,
    axisMode,
    patientCount,
}: ILollipopTooltipCountInfoProps) => {
    const decimalZeros = numberOfLeadingDecimalZeros(count);
    const fractionDigits = decimalZeros < 0 ? 1 : decimalZeros + 2;
    const mutatedPatientCount = _.uniq(mutations.map(m => m.patientId)).length;

    return axisMode === AxisScale.PERCENT ? (
        <strong>
            {formatPercentValue(count, fractionDigits)}% ({mutatedPatientCount}{' '}
            mutated of {patientCount} profiled patients)
        </strong>
    ) : (
        <strong>
            {count} mutated of {patientCount} profiled patients
        </strong>
    );
};
