import { POINT_RADIUS, TimelineEvent } from './types';
import React from 'react';
import { getAttributeValue } from './lib/helpers';

enum Shape {
    CIRCLE = 'circle',
    SQUARE = 'square',
    TRIANGLE = 'triangle',
    DIAMOND = 'diamond',
    STAR = 'star',
    CAMERA = 'camera',
}
function getSpecifiedShapeIfExists(e: TimelineEvent) {
    const shape = getAttributeValue(SHAPE_ATTRIBUTE_KEY, e);
    if (!shape) {
        return undefined;
    }
    const lcShape = shape.toLowerCase();
    switch (lcShape) {
        case 'circle':
        case 'square':
        case 'triangle':
        case 'diamond':
        case 'star':
        case 'camera':
            return lcShape as Shape;
        default:
            return undefined;
    }
}

export function renderShape(
    e: TimelineEvent,
    y: number,
    eventColorGetter: (e: TimelineEvent) => string
) {
    const shape = getSpecifiedShapeIfExists(e) || Shape.CIRCLE;
    const color = eventColorGetter(e);

    let sideLength: number;
    switch (shape) {
        case Shape.CIRCLE:
            return <circle cx="0" cy={y} r={POINT_RADIUS} fill={color} />;
        case Shape.SQUARE:
            sideLength = 0.8 * POINT_RADIUS;
            return (
                <rect
                    x={0}
                    y={y - sideLength}
                    width={2 * sideLength}
                    height={2 * sideLength}
                    fill={color}
                />
            );
        case Shape.TRIANGLE:
            sideLength = 1.3 * POINT_RADIUS;
            return (
                <polygon
                    points={`0,${y - sideLength} ${sideLength *
                        Math.sin(Math.PI / 3)},${y +
                        sideLength * Math.cos(Math.PI / 3)} ${-sideLength *
                        Math.sin(Math.PI / 3)},${y +
                        sideLength * Math.cos(Math.PI / 3)}`}
                    fill={color}
                />
            );
        case Shape.DIAMOND:
            sideLength = 0.8 * POINT_RADIUS;
            return (
                <rect
                    x={0}
                    y={y - sideLength}
                    fill={color}
                    width={2 * sideLength}
                    height={2 * sideLength}
                    style={{
                        transformBox: 'fill-box',
                        transformOrigin: 'center',
                        transform: 'rotate(45deg)',
                    }}
                />
            );
        case Shape.STAR:
            sideLength = 1.3 * POINT_RADIUS;
            const angleIncrement = (2 * Math.PI) / 10;
            let points = '';
            for (let i = 0; i < 10; i++) {
                let radius;
                if (i % 2 === 0) {
                    radius = sideLength;
                } else {
                    radius = sideLength / 2;
                }
                points = `${points} ${radius *
                    Math.sin(i * angleIncrement)},${y -
                    radius * Math.cos(i * angleIncrement)}`;
            }
            return <polygon points={points} fill={color} />;
        case Shape.CAMERA:
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    version="1.1"
                    id="Layer_1"
                    x="-8px"
                    y="1px"
                    width="16px"
                    height="16px"
                    viewBox="0 0 16 16"
                    enable-background="new 0 0 16 16"
                >
                    <g>
                        <circle
                            fill="none"
                            stroke="#646464"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-miterlimit="10"
                            cx="7.997"
                            cy="9.058"
                            r="3.023"
                        ></circle>
                        <path
                            fill="none"
                            stroke="#646464"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-miterlimit="10"
                            d="   M14.168,4h-2.983l-0.521-1.36C10.503,2.288,10.07,2,9.702,2H6.359C5.99,2,5.558,2.288,5.396,2.64L4.877,4H1.893   C1.401,4,1,4.427,1,4.948v8.072C1,13.543,1.401,14,1.893,14h12.275C14.659,14,15,13.543,15,13.021V4.948   C15,4.427,14.659,4,14.168,4z"
                        ></path>
                    </g>
                </svg>
            );
    }
}

export const COLOR_ATTRIBUTE_KEY = 'STYLE_COLOR';
export const SHAPE_ATTRIBUTE_KEY = 'STYLE_SHAPE';
