import _ from 'lodash';
import * as React from 'react';
import classNames from 'classnames';

export type Option = {
    value: string;
    label: string | JSX.Element;
    disabled?: boolean;
};

export enum CheckBoxType {
    STRING = 'string',
    HTML = 'html',
}

export function getStringCheckBox(
    option: Option,
    selectedValues: { [optionValue: string]: any }
): string {
    let checkBox: string;

    if (option.value in selectedValues) {
        checkBox = String.fromCodePoint(9745); // checked box
    } else {
        checkBox = String.fromCodePoint(9744); // empty box
    }

    return checkBox;
}

export function getHtmlCheckBox(
    option: Option,
    selectedValues: { [optionValue: string]: any }
): JSX.Element {
    return <input type="checkbox" checked={option.value in selectedValues} />;
}

export function getSelectedValuesMap(
    values: { value: string }[]
): { [value: string]: { value: string } } {
    return _.keyBy(values, v => v.value);
}

export function getOptionLabel(
    option: Option,
    selectedValues: { [optionValue: string]: any },
    checkBoxType: CheckBoxType = CheckBoxType.STRING
): JSX.Element {
    const checkBox =
        checkBoxType === CheckBoxType.STRING
            ? getStringCheckBox(option, selectedValues)
            : getHtmlCheckBox(option, selectedValues);

    return (
        <span
            className={classNames('checked-select-option', {
                'is-selected': option.value in selectedValues,
            })}
        >
            {checkBox} {option.label || option.value}
        </span>
    );
}
