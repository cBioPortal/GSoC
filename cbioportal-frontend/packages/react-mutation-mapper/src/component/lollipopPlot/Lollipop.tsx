import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable, observable } from 'mobx';

import {
    LollipopLabel,
    LollipopPlacement,
    LollipopSpec,
} from '../../model/LollipopSpec';

type LollipopProps = {
    x: number;
    stickBaseY: number;
    stickHeight: number;
    headRadius: number;
    hoverHeadRadius: number;
    headColor?: string;
    stickColor?: string;
    label?: LollipopLabel;
    hitzoneClassName?: string;
    spec: LollipopSpec;
};

@observer
export default class Lollipop extends React.Component<LollipopProps, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @observable public isHovered: boolean = false;

    @computed private get headRadius() {
        return this.isHovered
            ? this.props.hoverHeadRadius
            : this.props.headRadius;
    }

    @computed private get circleX() {
        return this.props.x;
    }

    @computed private get circleY() {
        return this.props.stickBaseY - this.props.stickHeight;
    }

    @computed private get textY() {
        if (this.props.spec.placement === LollipopPlacement.BOTTOM) {
            return (
                this.props.stickBaseY -
                this.props.stickHeight +
                this.props.headRadius +
                5
            );
        } else {
            return (
                this.props.stickBaseY -
                this.props.stickHeight -
                this.props.headRadius -
                5
            );
        }
    }

    @computed public get circleHitRect() {
        return {
            x: this.circleX - this.props.hoverHeadRadius,
            y: this.circleY - this.props.hoverHeadRadius,
            width: this.props.hoverHeadRadius * 2,
            height: this.props.hoverHeadRadius * 2,
        };
    }

    render() {
        let label = null;
        if (this.props.label) {
            label = (
                <text
                    fill="#2E3436"
                    style={{
                        fontSize: this.props.label.fontSize || 10,
                        fontFamily: this.props.label.fontFamily || 'arial',
                    }}
                    textAnchor={this.props.label.textAnchor || 'middle'}
                    dominantBaseline={
                        this.props.spec.placement === LollipopPlacement.BOTTOM
                            ? 'hanging'
                            : 'baseline'
                    }
                    x={this.props.x}
                    y={this.textY}
                >
                    {this.props.label.show ? this.props.label.text : ''}
                </text>
            );
        }
        return (
            <g>
                <line
                    strokeWidth="1"
                    stroke={this.props.stickColor || '#BABDB6'}
                    x1={this.props.x}
                    x2={this.props.x}
                    y1={this.props.stickBaseY}
                    y2={this.props.stickBaseY - this.props.stickHeight}
                />
                <circle
                    stroke="#BABDB6"
                    strokeWidth="0.5"
                    fill={this.props.headColor || '#000000'}
                    r={this.headRadius}
                    cx={this.circleX}
                    cy={this.circleY}
                />
                <circle
                    className={this.props.hitzoneClassName}
                    r={this.props.hoverHeadRadius}
                    cx={this.circleX}
                    cy={this.circleY}
                    cursor="pointer"
                    style={{ opacity: 0 }}
                />
                {label}
            </g>
        );
    }
}
