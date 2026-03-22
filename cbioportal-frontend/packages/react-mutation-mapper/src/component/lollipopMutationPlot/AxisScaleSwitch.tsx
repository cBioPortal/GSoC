import classNames from 'classnames';
import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ButtonGroup } from 'react-bootstrap';

interface IAxisScaleSwitchProps {
    onChange: (selectedScale: AxisScale) => void;
    selectedScale: AxisScale;
}

export enum AxisScale {
    PERCENT = '%',
    COUNT = '#',
}

@observer
export class AxisScaleSwitch extends React.Component<
    IAxisScaleSwitchProps,
    {}
> {
    public static defaultProps: Partial<IAxisScaleSwitchProps> = {
        selectedScale: AxisScale.COUNT,
    };

    @observable
    private selectedScale: AxisScale;

    constructor(props: IAxisScaleSwitchProps) {
        super(props);
        this.selectedScale = props.selectedScale;
        makeObservable(this);
    }

    public toggleButton(scale: AxisScale, onClick: () => void) {
        return (
            <button
                className={classNames(
                    {
                        'btn-secondary': this.props.selectedScale === scale,
                        'btn-outline-secondary':
                            this.props.selectedScale !== scale,
                    },
                    'btn',
                    'btn-sm',
                    'btn-axis-switch'
                )}
                data-test={`AxisScaleSwitch${scale}`}
                style={{
                    lineHeight: 1,
                    cursor:
                        this.props.selectedScale === scale
                            ? 'default'
                            : 'pointer',
                    fontWeight:
                        this.props.selectedScale === scale
                            ? 'bolder'
                            : 'normal',
                    color:
                        this.props.selectedScale === scale ? '#fff' : '#6c757d',
                    backgroundColor:
                        this.props.selectedScale === scale ? '#6c757d' : '#fff',
                    borderColor: '#6c757d',
                }}
                onClick={onClick}
            >
                {scale}
            </button>
        );
    }

    public render() {
        return (
            <ButtonGroup aria-label="">
                {this.toggleButton(AxisScale.PERCENT, this.handlePercentClick)}
                {this.toggleButton(AxisScale.COUNT, this.handleCountClick)}
            </ButtonGroup>
        );
    }

    @action.bound
    private handlePercentClick() {
        this.selectedScale = AxisScale.PERCENT;
        this.props.onChange(this.selectedScale);
    }

    @action.bound
    private handleCountClick() {
        this.selectedScale = AxisScale.COUNT;
        this.props.onChange(this.selectedScale);
    }
}
