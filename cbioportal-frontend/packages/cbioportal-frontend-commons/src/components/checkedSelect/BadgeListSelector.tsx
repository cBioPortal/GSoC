import autobind from 'autobind-decorator';
import _ from 'lodash';
import { action, computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import styles from './badgeListSelector.module.scss';
import { BadgeCell } from './BadgeCell';

import {
    CheckBoxType,
    getOptionLabel,
    getSelectedValuesMap,
    Option,
} from './CheckedSelectUtils';

type BadgeListSelectorProps = {
    onChange: (values: { value: string }[]) => void;
    selectedValue: { value: string }[];
    options: Option[];
    getOptionLabel?: (
        option: Option,
        selectedValues: { [optionValue: string]: any },
        checkBoxType?: CheckBoxType
    ) => JSX.Element;
    checkBoxType?: CheckBoxType;
    isDisabled?: boolean;
    numberOfColumnsPerRow?: number;
    isDriverAnnotated?: boolean;
    onOnlyDriverVsVusChange?: (values: { value: string }[]) => void;
    driverAnnotationIcon?: JSX.Element;
    onBadgeSelect?: (
        value: string,
        selectedValues: { value: string }[],
        onChange: (values: { value: string }[]) => void
    ) => void;
    onOnlySelect?: (
        value: string,
        onChange: (values: { value: string }[]) => void,
        onOnlyDriverVsVusChange: (values: { value: string }[]) => void
    ) => void;
    useOnlyFeature?: boolean;
};

function generateTableRows(
    selectComponents: JSX.Element[],
    numberOfColumnsPerRow: number = 1,
    className: string
) {
    return _.chunk(selectComponents, numberOfColumnsPerRow).map(components => (
        <tr className={className}>{components}</tr>
    ));
}

@observer
export default class BadgeListSelector extends React.Component<
    BadgeListSelectorProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps: Partial<BadgeListSelectorProps> = {
        isDisabled: false,
        numberOfColumnsPerRow: 1,
        checkBoxType: CheckBoxType.HTML,
    };

    @computed
    get selectedValues() {
        return getSelectedValuesMap(this.props.selectedValue);
    }

    public render() {
        return generateTableRows(
            this.props.options.map(this.optionSelectComponent),
            this.props.numberOfColumnsPerRow,
            this.props.options[0].value === '' ? styles['headerRow'] : ''
        );
    }

    @autobind
    private getOptionLabel(option: Option): JSX.Element {
        return this.props.getOptionLabel
            ? this.props.getOptionLabel(
                  option,
                  this.selectedValues,
                  this.props.checkBoxType
              )
            : getOptionLabel(
                  option,
                  this.selectedValues,
                  this.props.checkBoxType
              );
    }

    @autobind
    protected getBadgeCell(option: Option): JSX.Element | null {
        const onOnlyClick =
            option.value && this.props.useOnlyFeature
                ? (e: React.MouseEvent<any>) => {
                      e.stopPropagation();
                      if (
                          this.props.onOnlySelect &&
                          this.props.onOnlyDriverVsVusChange
                      ) {
                          this.props.onOnlySelect(
                              option.value,
                              this.props.onChange,
                              this.props.onOnlyDriverVsVusChange
                          );
                      } else {
                          this.props.onChange([{ value: option.value }]);
                      }
                  }
                : undefined;
        return (
            <BadgeCell
                option={option}
                optionLabel={this.getOptionLabel(option)}
                onOnlyClick={onOnlyClick}
                isDriverAnnotated={!!this.props.isDriverAnnotated}
                driverAnnotationIcon={this.props.driverAnnotationIcon}
            />
        );
    }

    @autobind
    protected optionSelectComponent(option: Option) {
        const onClick = () => this.handleSelect(option.value);

        return (
            <td
                onClick={onClick}
                style={{
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                }}
            >
                {this.getBadgeCell(option)}
            </td>
        );
    }

    @action.bound
    protected handleSelect(value: string) {
        // do nothing if disabled
        if (this.props.isDisabled) {
            return;
        }

        if (this.props.onBadgeSelect) {
            this.props.onBadgeSelect(
                value,
                this.props.selectedValue,
                this.props.onChange
            );
        } else {
            // unselect if selected
            if (this.selectedValues[value]) {
                this.props.onChange(
                    this.props.selectedValue.filter(v => v.value !== value)
                );
            }
            // select if not selected
            else {
                this.props.onChange(
                    [{ value }].concat(this.props.selectedValue)
                );
            }
        }
    }
}
