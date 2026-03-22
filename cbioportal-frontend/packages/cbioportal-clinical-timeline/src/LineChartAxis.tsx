import { TimelineTrackSpecification } from './types';
import { getTrackHeight } from './lib/helpers';
import React from 'react';
import { getTicksForLineChartAxis } from './lib/lineChartAxisUtils';
import { CBIOPORTAL_VICTORY_THEME } from 'cbioportal-frontend-commons';

export interface ILineChartAxisProps {
    track: TimelineTrackSpecification;
    standalone: boolean;
}
export const LINE_CHART_AXIS_SVG_WIDTH = 50;
export const LINE_CHART_AXIS_TICK_WIDTH = 5;
const LineChartAxis: React.FunctionComponent<ILineChartAxisProps> = function({
    track,
    standalone,
}) {
    const trackHeight = getTrackHeight(track);
    const ticks = getTicksForLineChartAxis(track);

    const width = LINE_CHART_AXIS_SVG_WIDTH;
    const tickWidth = LINE_CHART_AXIS_TICK_WIDTH;
    const ticksGroup = (
        <g transform={`translate(${width - tickWidth},0)`}>
            {ticks.map((tick, index) => {
                return (
                    <g transform={`translate(0, ${tick.offset})`}>
                        <text
                            // font family has to be inline, not from CSS,
                            //  because otherwise it won't download properly.
                            fontFamily={
                                CBIOPORTAL_VICTORY_THEME.axis.fontFamily
                            }
                            fontSize="10px"
                            textAnchor="end"
                            dy={'0.3em'}
                            dx={-3}
                            fill={'#aaa'}
                        >
                            {tick.label}
                        </text>
                        <line
                            x1={0}
                            x2={tickWidth}
                            y1={0}
                            y2={0}
                            strokeWidth={1}
                            stroke={'#aaa'}
                        />
                    </g>
                );
            })}
        </g>
    );
    if (standalone) {
        return (
            <svg height={trackHeight} width={width}>
                {ticksGroup}
            </svg>
        );
    } else {
        return ticksGroup;
    }
};

export default LineChartAxis;
