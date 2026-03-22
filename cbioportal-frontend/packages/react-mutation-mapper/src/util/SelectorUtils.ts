import { DataFilter } from '../model/DataFilter';

export function handleOptionSelect(
    selectedValues: Array<{ value: string }>,
    allValues: string[],
    onSelect?: (
        selectedOptionIds: string[],
        allValuesSelected?: boolean
    ) => void
) {
    if (onSelect) {
        onSelect(
            selectedValues.map(o => o.value),
            allValues.length === selectedValues.length
        );
    }
}

export function getAllOptionValues(options?: { value: string }[]) {
    return (options || []).map(option => option.value);
}

export function getSelectedOptionValues(
    allValues: string[],
    filter?: DataFilter<string>
) {
    return allValues
        .filter(
            value =>
                !filter ||
                filter.values.find(
                    filterValue =>
                        value.toLowerCase() === filterValue.toLowerCase()
                )
        )
        .map(value => ({ value }));
}
