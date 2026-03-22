import React from 'react';
import { observer } from 'mobx-react';
import _ from 'lodash';

interface IVAFChartHeaderProps {
    ticks: { label: string; offset: number }[];
    legendHeight: number;
}

const VAFChartHeader: React.FunctionComponent<IVAFChartHeaderProps> = observer(
    function({ ticks, legendHeight }) {
        const width = 50;
        const mqxTickOffset =
            _(ticks)
                .map(t => t.offset)
                .max() || 0;

        return (
            <div
                style={{
                    height: legendHeight,
                    width: width,
                }}
            >
                <svg
                    height={legendHeight}
                    width={width}
                    style={{
                        textTransform: 'none',
                        position: 'relative',
                    }}
                >
                    <text
                        style={{ textAlign: 'left' }}
                        text-anchor="middle"
                        transform={`translate(${width - 40},${mqxTickOffset /
                            2}) rotate(-90)`}
                    >
                        Allele Frequency
                    </text>

                    <g transform={`translate(0,0)`}>
                        {ticks.map((tick, index) => {
                            return (
                                <g transform={`translate(${width - 30},0)`}>
                                    <text
                                        y={tick.offset}
                                        font-size="10px"
                                        style={{ textAlign: 'right' }}
                                    >
                                        {tick.label}
                                    </text>
                                    <rect
                                        width={5}
                                        height={1}
                                        fill="#aaa"
                                        transform={`translate(20,${tick.offset -
                                            4})`}
                                    />
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </div>
        );
    }
);

export { VAFChartHeader };
