export const CORR_POS_COLOR = 'rgb(41, 87, 41)';
export const CORR_NEG_COLOR = 'rgb(180, 4, 4)';

export function correlationColor(correlation: number) {
    if (correlation > 0) {
        return CORR_POS_COLOR;
    } else {
        return CORR_NEG_COLOR;
    }
}

export function correlationSortBy(correlation: number) {
    return [Math.abs(correlation), correlation > 0 ? 1 : 0];
}
