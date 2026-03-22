export function formatPercentValue(rate: number, fractionDigits: number = 1) {
    const fixed = rate.toFixed(fractionDigits);

    let displayValue = fixed;

    // if the actual value is not zero but the display value is like 0.0, then show instead < 0.1
    if (rate !== 0 && Number(fixed) === 0) {
        displayValue = `< ${1 / Math.pow(10, fractionDigits)}`;
    }

    return displayValue;
}

export function numberOfLeadingDecimalZeros(value: number) {
    return -Math.floor(Math.log10(value) / Math.log10(10) + 1);
}

export function formatFrequencyValue(
    value: number | null,
    fractionDigits: number = 1
) {
    return value === null
        ? '-'
        : formatPercentValue(value * 100, fractionDigits);
}

export function formatNumberValueInSignificantDigits(
    value: number | null,
    significantDigits?: number
) {
    if (value === 0) {
        return 0;
    } else if (value === null) {
        return null;
    } else if (significantDigits) {
        return Number(
            value
                .toLocaleString('en-US', {
                    maximumSignificantDigits: significantDigits,
                })
                .replace(/,/g, '')
        );
    } else {
        return value;
    }
}
