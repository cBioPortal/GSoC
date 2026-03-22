import * as React from 'react';
import { computed, makeObservable } from 'mobx';

import CBIOPORTAL_VICTORY_THEME from '../../theme/cBioPortalTheme';

export interface IGradientLegendProps {
    // TODO orientation: string;
    gradientId: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    min: number;
    max: number;
    fontSize?: number;
    fontFamily?: string;
}

export const TITLE_DX = -12;
export const TITLE_DY = -5;

export class GradientLegend extends React.Component<IGradientLegendProps> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps: Partial<IGradientLegendProps> = {
        fontSize: 11,
        fontFamily: CBIOPORTAL_VICTORY_THEME.legend.style.labels.fontFamily,
    };

    public get rectX() {
        return this.props.x;
    }

    public get rectY() {
        return this.props.y - TITLE_DX;
    }

    @computed
    public get title() {
        return (
            <text
                fontSize={this.props.fontSize}
                fontFamily={this.props.fontFamily}
                x={this.rectX}
                y={this.rectY}
                dx={`${TITLE_DX}px`}
                dy={`${TITLE_DY}px`}
            >
                {this.props.title}
            </text>
        );
    }

    @computed
    public get labels() {
        const rectWidth = this.props.width;
        const rectHeight = this.props.height;

        return [
            <text
                key="gradientLegendLabelMax"
                fontSize={this.props.fontSize}
                fontFamily={this.props.fontFamily}
                x={this.rectX + rectWidth + 4}
                y={this.rectY}
                dy="1em"
            >
                {this.props.max.toLocaleString()}
            </text>,
            <text
                key="gradientLegendLabelMin"
                fontSize={11}
                x={this.rectX + rectWidth + 4}
                y={this.rectY + rectHeight}
                dy="-0.3em"
            >
                {this.props.min.toLocaleString()}
            </text>,
        ];
    }

    @computed
    public get gradientRect() {
        const rectWidth = this.props.width;
        const rectHeight = this.props.height;

        return (
            <rect
                fill={`url(#${this.props.gradientId})`}
                x={this.rectX}
                y={this.rectY}
                width={rectWidth}
                height={rectHeight}
            />
        );
    }

    public render() {
        return (
            <g>
                {this.title}
                {this.gradientRect}
                {this.labels}
            </g>
        );
    }
}

export default GradientLegend;
