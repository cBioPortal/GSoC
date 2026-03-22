import * as React from 'react';

export default class SampleLabelSVG extends React.Component<
    ISampleLabelSVGProps,
    {}
> {
    static defaultProps = {
        r: 10,
    };

    constructor(props: ISampleLabelSVGProps) {
        super(props);
        this.render = this.render.bind(this);
    }

    public render() {
        const { label, color, x, y } = this.props;
        return (
            <g>
                <circle cx={x} cy={y} fill={color} r={this.props.r!} />
                <text
                    x={x}
                    y={y + 5}
                    dy={this.props.textDy}
                    fill={'white'}
                    fontSize={10}
                    textAnchor={'middle'}
                >
                    {label}
                </text>
            </g>
        );
    }
}

export interface ISampleLabelSVGProps {
    label: string;
    color: string;
    x: number;
    y: number;
    r?: number;
    textDy?: number;
}

export class SampleLabelHTML extends React.Component<
    ISampleLabelHTMLProps,
    {}
> {
    constructor(props: ISampleLabelHTMLProps) {
        super(props);
        this.render = this.render.bind(this);
    }

    public render() {
        const { label, color, fillOpacity } = this.props;
        return (
            <svg
                width="12"
                height="12"
                className="case-label-header"
                data-test="sample-icon"
            >
                <g transform="translate(6,6)">
                    <circle r="6" fill={color} fillOpacity={fillOpacity} />
                </g>
                <g transform="translate(6,5.5)">
                    <text
                        y="4"
                        textAnchor="middle"
                        fontSize="10"
                        fill="white"
                        style={{ cursor: 'default' }}
                    >
                        {label}
                    </text>
                </g>
            </svg>
        );
    }
}

interface ISampleLabelHTMLProps {
    label: string;
    color: string;
    fillOpacity: number;
}
