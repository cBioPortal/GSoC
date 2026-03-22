export interface ISelectOption {
    value: string;
    label: string;
}

export function doesOptionMatchSearchText(text: string, option: ISelectOption) {
    try {
        let result = false;
        if (
            !text ||
            RegExp(text, 'i').test(option.label) ||
            RegExp(text, 'i').test(option.value)
        ) {
            result = true;
        }
        return result;
    } catch {
        return false;
    }
}
