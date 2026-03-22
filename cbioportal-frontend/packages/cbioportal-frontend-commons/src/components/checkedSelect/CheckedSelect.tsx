import * as React from 'react';
import ReactSelect from 'react-select';
import autobind from 'autobind-decorator';
import { computed, observable, action, makeObservable } from 'mobx';
import { observer } from 'mobx-react';

import {
    CheckBoxType,
    getOptionLabel,
    getSelectedValuesMap,
    Option,
} from './CheckedSelectUtils';

type CheckedSelectProps = {
    name?: string;
    onChange: (values: { value: string }[]) => void;
    value: { value: string }[];
    options: Option[];
    checkBoxType?: CheckBoxType;
    placeholder?: string | JSX.Element;
    reactSelectComponents?: {
        [componentType: string]: (props: any) => JSX.Element;
    };
    isClearable?: boolean;
    isDisabled?: boolean;
    onAddAll?: () => void;
    onClearAll?: () => void;
    isAddAllDisabled?: boolean;
    addAllLabel?: string | JSX.Element;
    clearAllLabel?: string | JSX.Element;
    showControls?: boolean;
    height?: number;
    onInputChange?: (input: string) => void;
    inputValue?: string;
};

@observer
export default class CheckedSelect extends React.Component<
    CheckedSelectProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps: Partial<CheckedSelectProps> = {
        isClearable: false,
        isDisabled: false,
        isAddAllDisabled: false,
        showControls: true,
        checkBoxType: CheckBoxType.STRING,
    };

    @observable defaultInputValue = '';

    @computed
    get selectedValues() {
        return getSelectedValuesMap(this.props.value);
    }

    @computed
    get addAllLabel() {
        if (this.props.addAllLabel) {
            return this.props.addAllLabel;
        } else {
            return `Add all (${this.props.options.length})`;
        }
    }

    @computed
    get clearAllLabel() {
        if (this.props.clearAllLabel) {
            return this.props.clearAllLabel;
        } else {
            return 'Clear';
        }
    }

    @computed
    get components() {
        return this.props.showControls
            ? {
                  GroupHeading: this.buttonsSection,
                  ...this.props.reactSelectComponents,
              }
            : this.props.reactSelectComponents;
    }

    @autobind
    private defaultOnAddAll() {
        this.props.onChange(this.props.options);
    }

    @autobind
    private defaultOnClearAll() {
        this.props.onChange([]);
    }

    @autobind
    private getOptionLabel(option: Option): JSX.Element {
        return getOptionLabel(
            option,
            this.selectedValues,
            this.props.checkBoxType
        );
    }

    @computed get inputValue() {
        return this.props.inputValue || this.defaultInputValue;
    }

    @action.bound
    defaultOnInputChange(input: string, options: { action: string }) {
        // The input value (which is a blank string in the case of action === 'set-value')
        // will be passed to `this.props.onInputChange` by default without the `if` condition.
        // This leads to undesirable behaviour so adding the if condition will prevent that.
        if (options.action !== 'set-value') {
            if (this.props.onInputChange) this.props.onInputChange(input);
            this.defaultInputValue = input;
        }
    }

    @autobind
    private buttonsSection() {
        return (
            <div
                style={{
                    marginTop: -7,
                    paddingBottom: 5,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderBottom: '1px solid #ccc',
                }}
            >
                <button
                    className="btn btn-sm btn-default"
                    onClick={this.props.onAddAll || this.defaultOnAddAll}
                    style={{ marginRight: 5 }}
                    disabled={this.props.isAddAllDisabled}
                >
                    {this.addAllLabel}
                </button>
                <button
                    className="btn btn-sm btn-default"
                    disabled={this.props.value.length === 0}
                    onClick={this.props.onClearAll || this.defaultOnClearAll}
                >
                    {this.clearAllLabel}
                </button>
            </div>
        );
    }

    public render() {
        return (
            <div className="default-checked-select">
                <ReactSelect
                    aria-label={this.props.name}
                    styles={{
                        control: (provided: any) => ({
                            ...provided,
                            height: this.props.height || 33.5,
                            minHeight: this.props.height || 33.5,
                            border: '1px solid rgb(204,204,204)',
                        }),
                        menu: (provided: any) => ({
                            ...provided,
                            maxHeight: 400,
                        }),
                        menuList: (provided: any) => ({
                            ...provided,
                            maxHeight: 400,
                        }),
                        placeholder: (provided: any) => ({
                            ...provided,
                            color: '#000000',
                        }),
                        dropdownIndicator: (provided: any) => ({
                            ...provided,
                            // make the dropdown y axis padding a bit small for shorter dropdown.
                            padding: '4px 8px',
                            color: '#000000',
                        }),
                        option: (provided: any, state: any) => {
                            return {
                                ...provided,
                                cursor: 'pointer',
                            };
                        },
                    }}
                    theme={(theme: any) => ({
                        ...theme,
                        colors: {
                            ...theme.colors,
                            //primary: theme.colors.primary50
                        },
                    })}
                    components={this.components}
                    name={this.props.name}
                    isMulti={true}
                    isClearable={this.props.isClearable}
                    isDisabled={this.props.isDisabled}
                    closeMenuOnSelect={false}
                    hideSelectedOptions={false}
                    controlShouldRenderValue={false}
                    placeholder={this.props.placeholder}
                    onChange={this.props.onChange}
                    options={[
                        {
                            label: this.props.showControls
                                ? 'dummy label, this is only here to create group so we can add the buttons section as the group label component'
                                : undefined,
                            options: this.props.options,
                        },
                    ]}
                    getOptionLabel={this.getOptionLabel}
                    value={this.props.value}
                    labelKey="label"
                    onInputChange={this.defaultOnInputChange}
                    inputValue={this.inputValue}
                    backspaceRemovesValue={false}
                />
            </div>
        );
    }
}
