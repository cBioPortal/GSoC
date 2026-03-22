import * as React from 'react';
import { LegendDataWithId } from './PlotUtils';
import { Point } from 'victory';
import { toFixedWithoutTrailingZeros } from '../../lib/FormatUtils';

export interface ILegendDataComponentProps {
    orientation: 'horizontal' | 'vertical';
    // these props are typed as optional because of the way victory api works:
    //  dataComponent={<LegendDataComponent/>},
    // but they are always passed in
    datum?: LegendDataWithId<any>;
    x?: number;
    y?: number;
}

export default class LegendDataComponent extends React.Component<
    ILegendDataComponentProps,
    {}
> {
    render() {
        const horizontal = this.props.orientation === 'horizontal';

        if (this.props.datum!.symbol.type === 'gradient') {
            const colorFn = this.props.datum!.symbol.colorFn;
            const range = this.props.datum!.symbol.range;
            const gradientId = this.props.datum!.symbol.gradientUid;

            const GRADIENTMESH = 30;
            const gradientStopPoints = [];
            for (let i = 0; i < GRADIENTMESH; i++) {
                const fraction = i / GRADIENTMESH;
                gradientStopPoints.push(
                    <stop
                        offset={`${(fraction * 100).toFixed(0)}%`}
                        stopColor={colorFn(
                            fraction * range[1] + (1 - fraction) * range[0]
                        )}
                    />
                );
            }
            const gradientElt = (
                <linearGradient
                    id={gradientId}
                    key={gradientId}
                    x1="0"
                    y1={horizontal ? '0' : '1'}
                    x2={horizontal ? '1' : '0'}
                    y2="0"
                >
                    {gradientStopPoints}
                </linearGradient>
            );

            const rectThickness = 25;
            const largeRange = range[1] - range[0] > 5;
            const rectLength = largeRange ? 90 : 50;

            let rectWidth, rectHeight, rectX, rectY, labelDx, labelDy;
            if (horizontal) {
                rectWidth = rectLength;
                rectHeight = rectThickness;

                rectX = this.props.x!;
                rectY = this.props.y! - rectHeight / 2;

                labelDx = '-0.5em';
                labelDy = '1em';
            } else {
                rectWidth = rectThickness;
                rectHeight = rectLength;

                rectX = this.props.x!;
                rectY = this.props.y!;
                labelDx = '0em';
                labelDy = '0.5em';
            }

            const rect = (
                <rect
                    fill={`url(#${gradientId})`}
                    x={rectX}
                    y={rectY}
                    width={rectWidth}
                    height={rectHeight}
                />
            );

            const labels = [
                <text
                    fontSize={11}
                    x={horizontal ? rectX + rectWidth : rectX + rectWidth + 4}
                    y={horizontal ? rectY + rectHeight + 4 : rectY}
                    dx={labelDx}
                    dy={labelDy}
                >
                    {toFixedWithoutTrailingZeros(range[1], 2)}
                </text>,
                <text
                    fontSize={11}
                    x={horizontal ? rectX : rectX + rectWidth + 4}
                    y={horizontal ? rectY + rectHeight + 4 : rectY + rectHeight}
                    dx={labelDx}
                    dy={labelDy}
                >
                    {toFixedWithoutTrailingZeros(range[0], 2)}
                </text>,
            ];
            if (largeRange) {
                // only add a middle label if theres room
                labels.push(
                    <text
                        fontSize={11}
                        x={
                            horizontal
                                ? rectX + rectWidth / 2
                                : rectX + rectWidth + 4
                        }
                        y={
                            horizontal
                                ? rectY + rectHeight + 4
                                : rectY + rectHeight / 2
                        }
                        dx={labelDx}
                        dy={labelDy}
                    >
                        {toFixedWithoutTrailingZeros(
                            (range[0] + range[1]) / 2,
                            2
                        )}
                    </text>
                );
            }
            return (
                <g>
                    {gradientElt}
                    {rect}
                    {labels}
                </g>
            );
        } else {
            // default victory component
            const point = <Point {...this.props} />;
            if (this.props.datum!.margin !== undefined) {
                const dx = horizontal ? this.props.datum!.margin : 0;
                const dy = horizontal ? 0 : this.props.datum!.margin;
                return <g transform={`translate(${dx},${dy})`}>{point}</g>;
            } else {
                return point;
            }
        }
    }
}
