import React, { useCallback } from 'react';
import { TimelineTrackSpecification, TimelineTrackType } from './types';
import { TICK_AXIS_HEIGHT } from './TickAxis';
import { CustomTrackSpecification } from './CustomTrack';
import { TimelineStore } from './TimelineStore';
import { useObserver } from 'mobx-react-lite';
import { EllipsisTextTooltip } from 'cbioportal-frontend-commons';
import { isTrackVisible } from './lib/helpers';
import LineChartAxis, { LINE_CHART_AXIS_SVG_WIDTH } from './LineChartAxis';
import ReactDOM from 'react-dom';

interface ITrackHeaderProps {
    store: TimelineStore;
    track: TimelineTrackSpecification;
    handleTrackHover: (e: React.MouseEvent<any>) => void;
    height: number;
    paddingLeft?: number;
}

export function getTrackLabel(track: TimelineTrackSpecification) {
    return (track.label || track.type).replace(/_/g, '');
}

const TrackHeader: React.FunctionComponent<ITrackHeaderProps> = function({
    store,
    track,
    handleTrackHover,
    height,
    paddingLeft = 5,
}) {
    const collapseCallback = useCallback(
        () => store.toggleTrackCollapse(track.uid),
        [track]
    );

    const isLineChartTrack = track.trackType === TimelineTrackType.LINE_CHART;

    return useObserver(() => (
        <>
            <div
                style={{
                    paddingLeft,
                    height,
                    position: 'relative',
                }}
                onMouseEnter={handleTrackHover}
                onMouseLeave={handleTrackHover}
            >
                <span>
                    <EllipsisTextTooltip text={getTrackLabel(track)} />
                </span>
                {isLineChartTrack && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                        }}
                    >
                        <LineChartAxis track={track} standalone={true} />
                    </div>
                )}
                {store.enableCollapseTrack &&
                    track.tracks &&
                    track.tracks.length > 0 && (
                        <div
                            onClick={collapseCallback}
                            style={{
                                cursor: 'pointer',
                                fontSize: 15,
                                lineHeight: 0.5,
                                padding: 3,
                                right: isLineChartTrack
                                    ? LINE_CHART_AXIS_SVG_WIDTH + 10
                                    : 2,
                                top: 0,
                                position: 'absolute',
                            }}
                        >
                            {store.isTrackCollapsed(track.uid) ? (
                                <i className={'fa fa-caret-right fa-sm'} />
                            ) : (
                                <i className={'fa fa-caret-down fa-sm'} />
                            )}
                        </div>
                    )}
            </div>
        </>
    ));
};

export const EXPORT_TRACK_HEADER_STYLE = 'font-size: 12px;font-family:Arial';
export const EXPORT_TRACK_HEADER_BORDER_CLASSNAME = 'track-header-border';

export function getTrackHeadersG(
    store: TimelineStore,
    customTracks?: CustomTrackSpecification[],
    visibleTracks?: string[]
) {
    const g = (document.createElementNS(
        'http://www.w3.org/2000/svg',
        'g'
    ) as unknown) as SVGGElement;

    function makeTextElement(x: number, y: number) {
        const text = (document.createElementNS(
            'http://www.w3.org/2000/svg',
            'text'
        ) as unknown) as SVGTextElement;
        text.setAttribute('style', EXPORT_TRACK_HEADER_STYLE);
        text.setAttribute('x', `${x}px`);
        text.setAttribute('y', `${y}px`);
        text.setAttribute('dy', '1em');
        return text;
    }

    function makeBorderLineElement(y: number, trackHeight: number) {
        const line = (document.createElementNS(
            'http://www.w3.org/2000/svg',
            'line'
        ) as unknown) as SVGLineElement;
        line.classList.add(EXPORT_TRACK_HEADER_BORDER_CLASSNAME);
        line.setAttribute('x1', '0');
        line.setAttribute('x2', store.headersWidth.toString());
        line.setAttribute('y1', `${y + trackHeight - 0.5}`);
        line.setAttribute('y2', `${y + trackHeight - 0.5}`);
        line.setAttribute('stroke', '#eee');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-dasharray', '3,2');
        return line;
    }

    let y = TICK_AXIS_HEIGHT;

    const tracks = store.data;
    for (const t of tracks) {
        if (visibleTracks && !isTrackVisible(t.track, visibleTracks)) {
            continue;
        }
        const text = makeTextElement(t.indent, y);
        text.textContent = getTrackLabel(t.track);
        g.appendChild(text);

        if (t.track.trackType === TimelineTrackType.LINE_CHART) {
            // Add axis for line chart
            const axisGroup = (document.createElementNS(
                'http://www.w3.org/2000/svg',
                'g'
            ) as unknown) as SVGGElement;

            axisGroup.setAttribute(
                'transform',
                `translate(${store.headersWidth -
                    LINE_CHART_AXIS_SVG_WIDTH}, ${y})`
            );
            ReactDOM.render(
                <LineChartAxis track={t.track} standalone={false} />,
                axisGroup
            );

            g.appendChild(axisGroup);
        }

        g.appendChild(makeBorderLineElement(y, t.height));

        y += t.height;
    }

    if (customTracks) {
        for (const t of customTracks) {
            const text = makeTextElement(5, y);
            text.textContent = t.labelForExport;
            g.appendChild(text);

            const height = t.height(store);
            g.appendChild(makeBorderLineElement(y, height));

            y += height;
        }
    }

    return g;
}

export default TrackHeader;
