import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { Mutation } from 'cbioportal-ts-api-client';
import * as React from 'react';
import {
    formatPercentValue,
    numberOfLeadingDecimalZeros,
} from 'cbioportal-utils';
import { AxisScale } from './AxisScaleSwitch';

interface ILollipopTooltipCountInfoProps {
    count: number;
    mutations?: Mutation[];
    axisMode?: AxisScale;
}

export const LollipopTooltipCountInfo: React.FC<ILollipopTooltipCountInfoProps> = ({
    count,
    mutations,
    axisMode,
}: ILollipopTooltipCountInfoProps) => {
    const decimalZeros = numberOfLeadingDecimalZeros(count);
    const fractionDigits = decimalZeros < 0 ? 1 : decimalZeros + 2;

    return mutations &&
        mutations.length > 0 &&
        axisMode === AxisScale.PERCENT ? (
        <strong>
            {formatPercentValue(count, fractionDigits)}% mutation rate
        </strong>
    ) : (
        <strong>
            {count} mutation{`${count !== 1 ? 's' : ''}`}
        </strong>
    );
};
