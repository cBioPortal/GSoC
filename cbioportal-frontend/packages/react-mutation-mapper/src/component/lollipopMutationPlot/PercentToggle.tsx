import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { AxisScale, AxisScaleSwitch } from './AxisScaleSwitch';

interface IPercentToggleProps {
    axisMode?: AxisScale;
    onScaleToggle?: (selectedScale: AxisScale) => void;
}

export class PercentToggle extends React.Component<IPercentToggleProps, {}> {
    constructor(props: IPercentToggleProps) {
        super(props);
    }

    public render() {
        return (
            <div
                className="small"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: 10,
                }}
            >
                <div
                    style={{
                        marginLeft: 10,
                    }}
                >
                    <div style={{ textAlign: 'center' }}>Y-Axis:</div>
                    <AxisScaleSwitch
                        selectedScale={this.props.axisMode}
                        onChange={this.props.onScaleToggle}
                    />
                </div>
            </div>
        );
    }
}
