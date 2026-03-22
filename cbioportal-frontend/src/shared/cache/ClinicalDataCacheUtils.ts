import { makeUniqueColorGetter } from '../components/plots/PlotUtils';
import _ from 'lodash';
import { RESERVED_CLINICAL_VALUE_COLORS } from '../lib/Colors';
import { ClinicalData, MutationSpectrum } from 'cbioportal-ts-api-client';
import { interpolateReds } from 'd3-scale-chromatic';

export type OncoprintClinicalData = ClinicalData[] | MutationSpectrum[];

export function getClinicalAttributeColoring(
    data: OncoprintClinicalData,
    datatype: string
) {
    let categoryToColor;
    let numericalValueToColor;
    let logScaleNumericalValueToColor;
    let numericalValueRange;
    switch (datatype) {
        case 'STRING':
            const colorGetter = makeUniqueColorGetter(
                _.values(RESERVED_CLINICAL_VALUE_COLORS)
            );
            categoryToColor = _.cloneDeep(RESERVED_CLINICAL_VALUE_COLORS);
            for (const d of data) {
                if (!((d as ClinicalData).value in categoryToColor)) {
                    categoryToColor[(d as ClinicalData).value] = colorGetter();
                }
            }
            break;
        case 'NUMBER':
            // TODO: calculate gradient with data
            const numbers = (data as ClinicalData[]).reduce((nums, d) => {
                if (d.value && !isNaN(d.value as any)) {
                    nums.push(parseFloat(d.value));
                }
                return nums;
            }, [] as number[]);
            const min = _.min(numbers)!;
            const max = _.max(numbers)!;
            if (min !== undefined && max !== undefined) {
                numericalValueToColor = (x: number) =>
                    interpolateReds((x - min) / (max - min));

                if (min >= 0) {
                    const safeLog = (x: number) => {
                        return Math.log(Math.max(0.01, x));
                    };
                    const logMin = safeLog(min);
                    const logMax = safeLog(max);
                    logScaleNumericalValueToColor = (x: number) => {
                        return interpolateReds(
                            (safeLog(x) - logMin) / (logMax - logMin)
                        );
                    };
                }
                numericalValueRange = [min, max] as [number, number];
            } else {
                numericalValueToColor = (x: number) => '#000000';
            }
            break;
    }
    return {
        categoryToColor,
        numericalValueToColor,
        numericalValueRange,
        logScaleNumericalValueToColor,
    };
}
