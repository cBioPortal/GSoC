import {
    EventPosition,
    ITrackEventConfig,
    POINT_RADIUS,
    TimeLineColorGetter,
    TimelineEvent,
    TimelineEventAttribute,
    TimelineTrackSpecification,
    TimelineTrackType,
} from './types';
import React, { useCallback, useState } from 'react';
import _ from 'lodash';
import {
    colorGetterFactory,
    formatDate,
    getTrackEventCustomColorGetterFromConfiguration,
    REMOVE_FOR_DOWNLOAD_CLASSNAME,
    segmentAndSortAttributesForTooltip,
    TIMELINE_TRACK_HEIGHT,
} from './lib/helpers';
import { TimelineStore } from './TimelineStore';
import { renderStack } from './svg/renderStack';
import { observer } from 'mobx-react';
import {
    getLineChartYCoordinateForEvents,
    getTicksForLineChartAxis,
    getTrackValueRange,
} from './lib/lineChartAxisUtils';
import { getBrowserWindow, getColor } from 'cbioportal-frontend-commons';
import { getTrackLabel } from './TrackHeader';
import {
    COLOR_ATTRIBUTE_KEY,
    renderShape,
    SHAPE_ATTRIBUTE_KEY,
} from './renderHelpers';
import ReactMarkdown from 'react-markdown';
import { useLocalObservable, useLocalStore } from 'mobx-react-lite';

export interface ITimelineTrackProps {
    trackData: TimelineTrackSpecification;
    limit: number;
    getPosition: (
        item: TimelineEvent,
        limit: number
    ) => EventPosition | undefined;
    handleTrackHover: (e: React.MouseEvent<any>) => void;
    store: TimelineStore;
    y: number;
    height: number;
    width: number;
}

/*
 get events with identical positions so we can stack them
 */
export function groupEventsByPosition(events: TimelineEvent[]) {
    return _.groupBy(events, e => {
        return `${e.start}-${e.end}`;
    });
}

export function renderSuperscript(number: number, y: number = 0) {
    return (
        <g transform={'translate(3 -18)'}>
            <text
                x={1}
                y={y}
                dy={'1em'}
                className="noselect"
                style={{
                    fontFamily: 'Arial',
                    fill: '#666',
                    pointerEvents: 'none',
                }}
            >
                <tspan style={{ fontSize: 7 }}>{number}</tspan>
            </text>
        </g>
    );
}

function renderTickGridLines(track: TimelineTrackSpecification, width: number) {
    const ticks = getTicksForLineChartAxis(track);
    return ticks.map(tick => (
        <line
            className={'tl-axis-grid-line tl-track-highlight'}
            x1={0}
            x2={width}
            y1={tick.offset}
            y2={tick.offset}
        />
    ));
}

function renderLineChartConnectingLines(points: { x: number; y: number }[]) {
    if (points.length < 2) {
        return null;
    }

    return (
        <g>
            {points.map((point, index) => {
                if (index === 0) {
                    return null;
                } else {
                    const prev = points[index - 1];
                    return (
                        <line
                            style={{
                                stroke: '#555',
                                strokeWidth: 2,
                            }}
                            x1={prev.x}
                            y1={prev.y}
                            x2={point.x}
                            y2={point.y}
                        />
                    );
                }
            })}
        </g>
    );
}

function getPointY(
    events: TimelineEvent[],
    trackData: TimelineTrackSpecification,
    trackHeight: number,
    trackValueRange?: { min: number; max: number }
) {
    let y: number | null;

    if (!trackValueRange) {
        y = trackHeight / 2;
    } else {
        y = getLineChartYCoordinateForEvents(
            events,
            trackData,
            trackHeight,
            trackValueRange!
        );
    }

    return y;
}

export function randomColorGetter(e: TimelineEvent) {
    return getColor(getTrackLabel(e.containingTrack));
}

export function renderPoint(
    events: TimelineEvent[],
    y: number,
    eventColorGetter?: TimeLineColorGetter
) {
    // When nested tracks are collapsed, we might see multiple events that are
    //  from different tracks. So let's check if all these events actually come
    //  from the same track
    const allFromSameTrack =
        _.uniq(events.map(e => e.containingTrack.uid)).length === 1;

    let contents: any | null = null;
    if (allFromSameTrack && events[0].containingTrack.renderEvents) {
        // If they are all from the same track and there is a track-specific renderer,
        // try that.
        contents = events[0].containingTrack.renderEvents(events, y);
    }
    // Otherwise, or if that returns null, use default renderers. For multiple events, we'll show the individual
    // renders in the tooltip.

    if (contents === null) {
        if (events.length > 1) {
            contents = (
                <>
                    {renderSuperscript(events.length, y)}
                    {renderStack(
                        events.map(colorGetterFactory(eventColorGetter)),
                        y
                    )}
                </>
            );
        } else {
            contents = renderShape(
                events[0],
                y,
                colorGetterFactory(eventColorGetter)
            );
        }
    }

    return <g>{contents}</g>;
}

function renderRange(
    pixelWidth: number,
    events: TimelineEvent[],
    eventColorGetter?: TimeLineColorGetter
) {
    const height = 5;
    return (
        <rect
            width={Math.max(pixelWidth, 2 * POINT_RADIUS)}
            height={height}
            y={(TIMELINE_TRACK_HEIGHT - height) / 2}
            rx="2"
            ry="2"
            fill={colorGetterFactory(eventColorGetter)(events[0])}
        />
    );
}

export const TimelineTrack: React.FunctionComponent<ITimelineTrackProps> = observer(
    function({
        trackData,
        limit,
        getPosition,
        handleTrackHover,
        store,
        y,
        height,
        width,
    }: ITimelineTrackProps) {
        let eventsGroupedByPosition;

        if (trackData.items) {
            // group events which occur on the same day offset
            // so they can be "stacked"
            eventsGroupedByPosition = groupEventsByPosition(trackData.items);

            // if this track has a custom sorting function
            // configured for simultaneous events, employ it
            if (trackData.sortSimultaneousEvents) {
                eventsGroupedByPosition = _.mapValues(
                    eventsGroupedByPosition,
                    trackData.sortSimultaneousEvents
                );
            }
        }

        let trackValueRange: { min: number; max: number };
        const linePoints: { x: number; y: number }[] = [];
        if (trackData.trackType === TimelineTrackType.LINE_CHART) {
            trackValueRange = getTrackValueRange(trackData);
        }

        const points =
            eventsGroupedByPosition &&
            _.map(eventsGroupedByPosition, itemGroup => {
                const firstItem = itemGroup[0];
                const position = getPosition(firstItem, limit);

                let content: JSX.Element | null | string = null;

                const isPoint = firstItem.start === firstItem.end;

                if (isPoint) {
                    // if this track has a getLineChartValue
                    // configured for it, we use that function to obtain
                    // a y value so that the point's can be represented and connected
                    // as a line chart, with corresponding axis
                    const y = getPointY(
                        itemGroup,
                        trackData,
                        height,
                        trackValueRange
                    );
                    if (y !== null) {
                        content = renderPoint(
                            itemGroup,
                            y,
                            getTrackEventCustomColorGetterFromConfiguration(
                                trackData
                            )
                        );
                        linePoints.push({
                            x: position ? position.pixelLeft : 0,
                            y,
                        });
                    }
                } else if (position && position.pixelWidth) {
                    content = renderRange(
                        position.pixelWidth,
                        itemGroup,
                        getTrackEventCustomColorGetterFromConfiguration(
                            trackData
                        )
                    );
                }

                return (
                    <TimelineItemWithTooltip
                        x={position && position.pixelLeft}
                        store={store}
                        track={trackData}
                        events={itemGroup}
                        content={content}
                    />
                );
            });

        return (
            <g
                className={'tl-track'}
                transform={`translate(0 ${y})`}
                onMouseEnter={handleTrackHover}
                onMouseLeave={handleTrackHover}
            >
                <rect
                    className={`tl-track-highlight ${REMOVE_FOR_DOWNLOAD_CLASSNAME}`}
                    x={0}
                    y={0}
                    height={height}
                    width={width}
                />
                {trackData.trackType === TimelineTrackType.LINE_CHART &&
                    renderTickGridLines(trackData, width)}
                {trackData.trackType === TimelineTrackType.LINE_CHART &&
                    renderLineChartConnectingLines(linePoints)}
                {points}
                <line
                    x1={0}
                    x2={width}
                    y1={height - 0.5}
                    y2={height - 0.5}
                    stroke={'#eee'}
                    strokeWidth={1}
                    strokeDasharray={'3,2'}
                />
            </g>
        );
    }
);

const TimelineItemWithTooltip: React.FunctionComponent<{
    x: number | undefined;
    store: TimelineStore;
    track: TimelineTrackSpecification;
    events: TimelineEvent[];
    content: any;
}> = observer(function({ x, store, track, events, content }) {
    const [tooltipUid, setTooltipUid] = useState<string | null>(null);

    const transforms = [];
    if (x) {
        transforms.push(`translate(${x} 0)`);
    }

    function syncTooltipUid() {
        if (tooltipUid && !store.doesTooltipExist(tooltipUid)) {
            setTooltipUid(null);
            return null;
        }
        return tooltipUid;
    }

    const hoverStyle = store.doesTooltipExist(tooltipUid || '')
        ? {
              opacity: 0.5,
          }
        : {};

    return (
        <g
            style={{ cursor: 'pointer', ...hoverStyle }}
            transform={transforms.join(' ')}
            onMouseMove={e => {
                let uid = syncTooltipUid();

                if (!uid) {
                    uid = store.addTooltip({
                        track,
                        events,
                    });

                    setTooltipUid(uid);

                    store.setHoveredTooltipUid(uid);
                    store.setMousePosition({
                        x: e.pageX,
                        y: e.pageY,
                    });
                }
            }}
            onMouseLeave={e => {
                // we use a timeout here to allow user to
                // mouse into the tooltip (in order to copy or click a link)
                // the tooltip onEnter handler causes the tooltip to
                // become "pinned" meaning it is stuck open
                // that way when this timeout finally executes
                // the if statement will be false and the tooltip
                // will not be removed
                setTimeout(() => {
                    const uid = syncTooltipUid();
                    if (uid && !store.isTooltipPinned(uid)) {
                        store.removeTooltip(uid);
                        setTooltipUid(null);
                    }
                }, 100);
            }}
            onClick={() => {
                const uid = syncTooltipUid();

                if (uid) {
                    store.togglePinTooltip(uid);
                }
            }}
        >
            {content}
        </g>
    );
});

export const OurPopup: React.FunctionComponent<any> = observer(function(
    ...props
) {
    const store = useLocalObservable(() => ({
        showModal: false,
    }));

    const showModal = useCallback(() => {
        const $modal = $(`
            <div class="myoverlay">
                <div class="myclose"><button class="btn btn-xs">Open in New Window</button> <button class="btn btn-xs"><i class="fa fa-close"></i> Close</button> </div>
                <iframe class="modal-iframe"></iframe>
            </div>,
        `)
            .appendTo('body')
            .on('keydown', function(event) {
                if (event.key == 'Escape') {
                    $modal.remove();
                }
            })
            .on('click', function(e) {
                if (/Open in New Window/.test(e.target.innerText)) {
                    getBrowserWindow().open(props[0].href);
                }
                $modal.remove();
            });

        setTimeout(() => {
            $modal.find('iframe').attr('src', props[0].href);
        }, 500);
    }, []);

    return (
        <>
            <a onClick={showModal}>{props[0].children}</a>
        </>
    );
});

export const EventTooltipContent: React.FunctionComponent<{
    event: TimelineEvent;
    trackConfig: ITrackEventConfig | undefined;
}> = function({ event, trackConfig }) {
    let attributes = event.event.attributes.filter(attr => {
        return (
            attr.key !== COLOR_ATTRIBUTE_KEY && attr.key !== SHAPE_ATTRIBUTE_KEY
        );
    });

    // if we have an attribute order configuration, we need to
    // update attribute list accordingly
    if (trackConfig?.attributeOrder) {
        attributes = segmentAndSortAttributesForTooltip(
            attributes,
            trackConfig.attributeOrder
        );
    }

    return (
        <div>
            <table className={'table table-condensed'}>
                <tbody>
                    {_.map(attributes, (attr: any) => {
                        return (
                            <tr>
                                <td>{attr.key.replace(/_/g, ' ')}</td>
                                <td>
                                    <ReactMarkdown
                                        allowedElements={['p', 'a']}
                                        linkTarget={'_blank'}
                                        components={{
                                            a: ({ node, ...props }) => {
                                                if (
                                                    /:blank$/.test(props.href!)
                                                ) {
                                                    return (
                                                        <a
                                                            href={props.href?.replace(
                                                                /:blank$/,
                                                                ''
                                                            )}
                                                            target={'_blank'}
                                                        >
                                                            {props.children}
                                                        </a>
                                                    );
                                                } else {
                                                    return (
                                                        <OurPopup {...props} />
                                                    );
                                                }
                                            },
                                        }}
                                    >
                                        {attr.value}
                                    </ReactMarkdown>
                                </td>
                            </tr>
                        );
                    })}
                    <tr>
                        <td>{`${
                            event.event.endNumberOfDaysSinceDiagnosis
                                ? 'START DATE'
                                : 'DATE'
                        }`}</td>
                        <td className={'nowrap'}>
                            {formatDate(
                                event.event.startNumberOfDaysSinceDiagnosis
                            )}
                        </td>
                    </tr>
                    {event.event.endNumberOfDaysSinceDiagnosis && (
                        <tr>
                            <td>END DATE</td>
                            <td className={'nowrap'}>
                                {formatDate(
                                    event.event.endNumberOfDaysSinceDiagnosis
                                )}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
