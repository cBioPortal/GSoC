import React from 'react';
import {TIMELINE_TRACK_HEIGHT} from "../lib/helpers";

const HEIGHT_OVER_WIDTH = 0.52
const SHEET_STROKE_WIDTH = 0.2;

function renderCenteredSheet(width:number, y:number, fill:string, strokeWidth:number) {
    return (
        <ellipse
            cx={0}
            cy={y}
            rx={width/2}
            ry={HEIGHT_OVER_WIDTH * width/2}
            fill={fill}
            stroke="black"
            strokeWidth={strokeWidth}
        />
    );
}

function renderMaskedSheet(width:number, y:number, fill:string) {
    return (
        <>
            {renderCenteredSheet(width, y, fill, SHEET_STROKE_WIDTH)}
            <g transform={`translate(0 -1)`}>
                {renderCenteredSheet(width, y, "#fff", 0)}
            </g>
        </>
    );
}

function ensureEnoughFills(fills:string[], desiredLength:number) {
    const ret = [];
    let index = 0;
    while (ret.length < desiredLength) {
        ret.push(fills[index]);
        index = (index + 1) % fills.length;
    }
    return ret;
}
function renderCustomStack(width:number, y:number, fills:string[]) {
    if (fills.length === 2) {
        // if we get exactly 2 fills, then show a stack of size 2
        return (
            <g>
                {renderMaskedSheet(width, y + width/8, fills[1])}
                {renderCenteredSheet(width, y - width/8, fills[0], SHEET_STROKE_WIDTH)}
            </g>
        );
    } else {
        // otherwise, we have 1 fill or >2 fills, so show a stack of size 3
        fills = ensureEnoughFills(fills, 3);
        return (
            <g>
                {renderMaskedSheet(width, y + width / 4, fills[2])}
                {renderMaskedSheet(width, y, fills[1])}
                {renderCenteredSheet(width, y - width / 4, fills[0], SHEET_STROKE_WIDTH)}
            </g>
        )
    }
}

export function renderStack(fills:string[], y?:number) {
    return renderCustomStack(9, y || TIMELINE_TRACK_HEIGHT/2, fills);
}
