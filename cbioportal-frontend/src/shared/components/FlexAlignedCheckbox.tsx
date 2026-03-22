import * as React from 'react';
import { observer } from 'mobx-react';

export interface ICheckboxProps {
    value?: string;
    checked: boolean;
    onClick?: () => void;
    label: any;
    style?: any;
}

@observer
export default class FlexAlignedCheckbox extends React.Component<
    ICheckboxProps,
    {}
> {
    render() {
        return (
            <div
                className="checkbox"
                style={Object.assign(
                    { display: 'flex', alignItems: 'center' },
                    this.props.style
                )}
            >
                <label>
                    <input
                        type="checkbox"
                        value={this.props.value}
                        checked={this.props.checked}
                        onClick={this.props.onClick}
                        style={{ marginTop: 1 }}
                    />
                </label>
                {typeof this.props.label === 'function'
                    ? this.props.label()
                    : this.props.label}
            </div>
        );
    }
}
