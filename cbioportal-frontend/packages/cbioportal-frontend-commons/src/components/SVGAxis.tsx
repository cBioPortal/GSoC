import * as React from 'react';

export type Tick = {
    position: number;
    label?: string;
};

type SVGAxisProps = {
    x: number;
    y: number;
    length: number;
    ticks: Tick[];
    tickLength: number;
    rangeLower: number;
    rangeUpper: number;
    vertical?: boolean;
    reverse?: boolean;
    invertTicks?: boolean;
    label?: string;
    verticalLabelPadding?: number;
    horizontalLabelPadding?: number;
    tickLabelPadding?: number;
};

export default class SVGAxis extends React.Component<SVGAxisProps, {}> {
    public static defaultProps: Partial<SVGAxisProps> = {
        verticalLabelPadding: 30,
        horizontalLabelPadding: 5,
        tickLabelPadding: 3,
    };

    private positionToAxisPosition(position: number) {
        const pos = this.props.reverse
            ? this.props.rangeUpper - position
            : position;
        return (
            (pos / (this.props.rangeUpper - this.props.rangeLower)) *
            this.props.length
        );
    }

    private get ticks() {
        return this.props.ticks.map(tick => {
            const tickLength = this.props.invertTicks
                ? -this.props.tickLength
                : this.props.tickLength;
            const axisPosition = this.positionToAxisPosition(tick.position);
            const x1 = this.props.vertical
                ? this.props.x
                : this.props.x + axisPosition;
            const y1 = this.props.vertical
                ? this.props.y + this.props.length - axisPosition
                : this.props.y;
            const x2 = this.props.vertical
                ? this.props.x - tickLength
                : this.props.x + axisPosition;
            const y2 = this.props.vertical
                ? this.props.y + this.props.length - axisPosition
                : this.props.y + tickLength;
            const labelPadding = this.props.tickLabelPadding!;

            let label = null;
            if (tick.label) {
                if (this.props.vertical) {
                    label = (
                        <text
                            textAnchor={
                                this.props.invertTicks ? 'start' : 'end'
                            }
                            style={{
                                fontSize: '10px',
                                fontFamily: 'arial',
                            }}
                            dx={
                                (this.props.invertTicks ? 1 : -1) * labelPadding
                            }
                            dy="0.4em"
                            x={x2}
                            y={y2}
                        >
                            {tick.label}
                        </text>
                    );
                } else {
                    label = (
                        <text
                            textAnchor="middle"
                            style={{
                                fontSize: '10px',
                                fontFamily: 'arial',
                            }}
                            x={x2}
                            y={
                                y2 +
                                (this.props.invertTicks ? tickLength - 5 : 0)
                            }
                            dy="1em"
                        >
                            {tick.label}
                        </text>
                    );
                }
            }
            return (
                <g key={axisPosition}>
                    <line
                        stroke="rgb(170,170,170)"
                        strokeWidth="1"
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                    />
                    {label}
                </g>
            );
        });
    }

    private get label() {
        if (this.props.label) {
            const tickLength = this.props.invertTicks
                ? -this.props.tickLength
                : this.props.tickLength;
            const verticalPadding = this.props.verticalLabelPadding!;
            const horizontalPadding = this.props.horizontalLabelPadding!;
            let x: number;
            let y: number;
            let transform: string;
            if (this.props.vertical) {
                x =
                    this.props.x -
                    tickLength +
                    (this.props.invertTicks
                        ? verticalPadding
                        : -verticalPadding);
                y = this.props.y + this.props.length / 2;
                transform = `rotate(270,${x},${y})`;
            } else {
                x = this.props.x + this.props.length / 2;
                y =
                    this.props.y +
                    tickLength +
                    (this.props.invertTicks
                        ? -horizontalPadding
                        : horizontalPadding);
                transform = '';
            }
            let count = 0;
            let wrappedLabel = this.props.label.split(/\n/g).map(l => (
                <tspan
                    x={x}
                    dy="1em"
                    dangerouslySetInnerHTML={{
                        __html: l.replace(/\*{2}/g, function() {
                            count += 1;
                            if (count % 2 === 1) {
                                return '<tspan style="font-weight: bold;">';
                            } else {
                                return '</tspan>';
                            }
                        }),
                    }}
                ></tspan>
            ));
            return (
                <text
                    textAnchor="middle"
                    style={{
                        fontFamily: 'arial',
                        fontSize: '12px',
                        fontWeight: 'normal',
                    }}
                    fill="#2E3436"
                    x={x}
                    y={y}
                    transform={
                        wrappedLabel.length > 1
                            ? transform + ' translate(0, -30)'
                            : transform
                    }
                >
                    {wrappedLabel.length > 1 ? wrappedLabel : this.props.label}
                </text>
            );
        } else {
            return null;
        }
    }

    render() {
        const x2 = this.props.vertical
            ? this.props.x
            : this.props.x + this.props.length;
        const y2 = this.props.vertical
            ? this.props.y + this.props.length
            : this.props.y;
        return (
            <g>
                <line
                    stroke="rgb(170,170,170)"
                    strokeWidth="1"
                    x1={this.props.x}
                    y1={this.props.y}
                    x2={x2}
                    y2={y2}
                />
                {this.ticks}
                {this.label}
            </g>
        );
    }
}
