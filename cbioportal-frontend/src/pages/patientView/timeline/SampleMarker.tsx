import React from 'react';
import {
    getNumberRangeLabel,
    getSortedSampleInfo,
} from 'pages/patientView/timeline/TimelineWrapperUtils';
import { getTextWidth } from 'cbioportal-frontend-commons';
import _ from 'lodash';

const SampleMarker: React.FunctionComponent<{
    color: string;
    label: string;
    y: number;
}> = function({ color, label, y }) {
    return (
        <g transform={`translate(0 ${y})`}>
            <circle cx="0" cy="0" r="7" fill={color} />
            <text
                x="0"
                y="0"
                text-anchor="middle"
                fill="white"
                font-size="10px"
                font-family="Arial"
                dy=".3em"
            >
                {label}
            </text>
        </g>
    );
};

export const MultipleSampleMarker: React.FunctionComponent<{
    colors: string[]; // same length as labels
    labels: string[];
    y: number;
}> = function({ colors, labels, y }) {
    const sortedSampleInfo = getSortedSampleInfo(colors, labels);
    const label = getNumberRangeLabel(sortedSampleInfo.map(p => p.label));
    const labelWidth = Math.ceil(getTextWidth(label, 'Arial', '10px'));
    const rectPadding = 4;
    const rectWidth = labelWidth + 2 * rectPadding;
    const rectHeight = 14;
    const clipPathId = `clipPath_${Math.random()}`;

    const uniqueColors = _.uniq(sortedSampleInfo.map(p => p.color));
    const colorRectWidth = rectWidth / uniqueColors.length;
    return (
        <g transform={`translate(0 ${y})`}>
            <clipPath id={clipPathId}>
                <rect
                    x={-rectWidth / 2}
                    y={-rectHeight / 2}
                    rx={rectHeight / 2}
                    ry={rectHeight / 2}
                    width={rectWidth}
                    height={rectHeight}
                />
            </clipPath>
            <g clipPath={`url(#${clipPathId})`}>
                {uniqueColors.map((color, index) => (
                    <rect
                        x={-rectWidth / 2 + index * colorRectWidth}
                        y={-rectHeight / 2}
                        width={colorRectWidth}
                        height={rectHeight}
                        fill={color}
                    />
                ))}
                <text
                    x="0"
                    y="0"
                    text-anchor="middle"
                    fill="white"
                    font-size="10px"
                    font-family="Arial"
                    dy=".3em"
                >
                    {label}
                </text>
            </g>
        </g>
    );
};

export default SampleMarker;
