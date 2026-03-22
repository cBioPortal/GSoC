import * as React from 'react';
import { computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';

type TrackCircleProps = {
    x: number;
    y: number;
    radius?: number;
    isHovered: boolean;
    hoverRadius?: number;
    hitZoneClassName?: string;
    hitZoneXOffset?: number;
    spec: TrackCircleSpec;
};

export type TrackCircleSpec = {
    startCodon: number;
    label?: string;
    color?: string;
    tooltip?: JSX.Element;
};

@observer
export default class TrackCircle extends React.Component<TrackCircleProps, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps = {
        radius: 2.8,
        hoverRadius: 5,
    };

    @computed get circleRadius() {
        return this.props.isHovered
            ? this.props.hoverRadius
            : this.props.radius;
    }

    public render() {
        return (
            <g>
                <circle
                    stroke="#BABDB6"
                    strokeWidth="0.5"
                    fill={this.props.spec.color}
                    r={this.circleRadius}
                    cx={this.props.x}
                    cy={this.props.y}
                />
                <circle
                    className={this.props.hitZoneClassName}
                    r={this.props.hoverRadius}
                    cx={this.props.x}
                    cy={this.props.y}
                    cursor="pointer"
                    style={{ opacity: 0 }}
                />
            </g>
        );
    }
}
