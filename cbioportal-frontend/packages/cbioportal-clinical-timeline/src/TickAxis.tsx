import { TickIntervalEnum, TimelineTick } from './types';
import React from 'react';
import { TimelineStore } from './TimelineStore';
import { observer } from 'mobx-react';
import _ from 'lodash';

interface ITickAxisProps {
    store: TimelineStore;
    width: number;
}

export const TICK_AXIS_HEIGHT = 20;
const TICK_LABEL_STYLE: any = {
    fontSize: 9,
    fontFamily: 'Arial',
    textAnchor: 'middle',
};
const MAJOR_TICK_HEIGHT = 6;
const MINOR_TICK_HEIGHT = 3;

function makeSquiggle(onClick: () => void) {
    const points = [
        'M0,5',
        'L2.5,8',
        'L5,0',
        'L7.5,10',
        'L10,0',
        'L12.5,10',
        'L15,0',
        'L17.5,8',
        'L20,5',
    ];
    return (
        <g transform={`translate(-6 ${TICK_AXIS_HEIGHT - 6})`}>
            {/* this rect visually blocks the axis */}
            <rect y={5} height={1} width={20} fill={'#ffffff'} />
            {/* this rect is a mouse hitzone */}
            <rect
                y={0}
                height={10}
                width={20}
                fillOpacity={0}
                style={{ cursor: 'pointer' }}
                onClick={onClick}
            />
            <path
                d={points.join('')}
                stroke={TICK_AXIS_COLOR}
                strokeWidth="1"
                fill="none"
                pointerEvents={'none'} // dont block mouse from clicking on rect
            />
        </g>
    );
}

export const TICK_AXIS_COLOR = '#ccc';

const TickAxis: React.FunctionComponent<ITickAxisProps> = observer(function({
    store,
    width,
}: ITickAxisProps) {
    return (
        <>
            <g>
                <rect
                    transform={`translate(0 ${TICK_AXIS_HEIGHT - 1})`}
                    fill={TICK_AXIS_COLOR}
                    height={1}
                    width={width}
                />
                {store.ticks.map((tick: TimelineTick, index: number) => {
                    let content: JSX.Element | null = null;

                    let startPoint;
                    if (tick === store.firstTick) {
                        startPoint = tick.end - store.tickInterval + 1; //tick.end - normalTickWidth - 1;
                    } else {
                        startPoint = tick.start;
                    }

                    const majorTickPosition = store.getPosition({
                        start: startPoint,
                    });
                    const transform = majorTickPosition
                        ? `translate(${majorTickPosition.pixelLeft} 0)`
                        : undefined;
                    const minorTicks: JSX.Element[] = [];

                    if (tick.isTrim) {
                        content = makeSquiggle(store.toggleExpandedTrims);
                    } else {
                        const count = startPoint / store.tickInterval;
                        const unit =
                            store.tickInterval === TickIntervalEnum.MONTH
                                ? 'm'
                                : 'y';

                        let majorLabel: string = '';

                        if (count < 0) {
                            majorLabel = `${count}${unit}`;
                        }

                        if (count === 0) {
                            majorLabel = '0';
                        }

                        if (count > 0) {
                            majorLabel = `${count}${unit}`;
                        }

                        content = (
                            <>
                                <text
                                    dy={'1em'}
                                    style={{
                                        fill: '#333',
                                        ...TICK_LABEL_STYLE,
                                    }}
                                >
                                    {majorLabel}
                                </text>
                                <rect
                                    height={MAJOR_TICK_HEIGHT}
                                    width={1}
                                    transform={`translate(0 ${TICK_AXIS_HEIGHT -
                                        MAJOR_TICK_HEIGHT})`}
                                    fill={'#aaa'}
                                />
                            </>
                        );

                        if (store.tickPixelWidth > 150) {
                            const minorTickWidth = TickIntervalEnum.MONTH;

                            for (let i = 1; i < 12; i++) {
                                const position = store.getPosition({
                                    start: startPoint + minorTickWidth * i,
                                });

                                const transform = position
                                    ? `translate(${position.pixelLeft} 0)`
                                    : undefined;

                                let minorLabel = '';
                                let showLabel = false;
                                if (store.tickPixelWidth > 150) {
                                    if (i % 4 === 0) {
                                        // only odd
                                        showLabel = true;
                                    }
                                    if (store.tickPixelWidth > 700) {
                                        showLabel = true;
                                    }
                                }

                                if (showLabel) {
                                    let minorCount = i;
                                    if (count < 0) {
                                        minorCount = 12 - i;
                                        majorLabel =
                                            count + 1 === 0
                                                ? ''
                                                : `${count + 1}${unit}`;
                                        minorLabel =
                                            count === -1
                                                ? `-${minorCount}m`
                                                : `${majorLabel} ${minorCount}m`;
                                    } else {
                                        minorLabel =
                                            count === 0
                                                ? `${minorCount}m`
                                                : `${majorLabel} ${minorCount}m`;
                                    }
                                }

                                if (transform) {
                                    minorTicks.push(
                                        <g transform={transform}>
                                            <text
                                                dy={'1.5em'}
                                                style={{
                                                    fill: '#aaa',
                                                    ...TICK_LABEL_STYLE,
                                                }}
                                            >
                                                {minorLabel}
                                            </text>
                                            <rect
                                                height={MINOR_TICK_HEIGHT}
                                                width={1}
                                                transform={`translate(0 ${TICK_AXIS_HEIGHT -
                                                    MINOR_TICK_HEIGHT})`}
                                                fill={'#aaa'}
                                            />
                                        </g>
                                    );
                                }
                            }
                        }
                    }

                    // DAY TICKS
                    // if (store.tickPixelWidth > 2000) {
                    //     const dayTickWidth = TickIntervalEnum.MONTH/30;
                    //     for (let i = 0; i <= 365; i++) {
                    //
                    //         if (i % 30 !== 0) {
                    //             const position = majorTickPosition && store.getPosition(
                    //                 {start: startPoint + dayTickWidth * i},
                    //                 store.trimmedLimit
                    //             );
                    //             if (position) {
                    //                 minorTicks.push(
                    //                     <div className={'tl-daytick'} style={{left: position.left}}>
                    //                         <div className={'tl-tickline'}></div>
                    //                     </div>
                    //                 )
                    //             }
                    //         }
                    //     }
                    //
                    //
                    // }

                    const rightAfterTrim =
                        index > 0 && store.ticks[index - 1].isTrim;

                    return (
                        <>
                            {!rightAfterTrim && transform && (
                                <g transform={transform}>{content}</g>
                            )}

                            {minorTicks}
                        </>
                    );
                })}
            </g>
        </>
    );
});

export default TickAxis;
