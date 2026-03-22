import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { truncateDisplayText } from '../../util/LabelUtils';

type TrackRectProps = {
    x: number;
    y: number;
    width?: number;
    height?: number;
    isHovered: boolean;
    hitZoneClassName?: string;
    hitZoneXOffset?: number;
    spec: TrackRectSpec;
};

export type TrackRectSpec = {
    startCodon: number;
    endCodon?: number;
    label?: string;
    labelColor?: string;
    color?: string;
    tooltip?: JSX.Element;
};

@observer
export default class TrackRect extends React.Component<TrackRectProps, {}> {
    @observable private textElt: SVGTextElement | null = null;
    private handlers: any;
    constructor(props: any) {
        super(props);
        makeObservable(this);
        this.handlers = {
            textRef: action((text: SVGTextElement | null) => {
                this.textElt = text;
            }),
        };
    }

    public static defaultProps = {
        width: 50,
        height: 15,
    };

    private get centerX() {
        return this.props.x + this.props.width! / 2;
    }

    private get centerY() {
        return this.props.y + this.props.height! / 2;
    }

    private makeTextElement(reference: boolean) {
        let props: any = {
            x: this.centerX,
            y: this.centerY,
            textAnchor: 'middle',
            dy: '0.3em',
            fill: this.props.spec.labelColor || '#FFFFFF',
            style: {
                fontSize: '12px',
                fontFamily: 'arial',
            },
        };
        const label = this.props.spec.label || '';
        const displayText = truncateDisplayText(
            label,
            this.textElt,
            this.props.width!
        );
        const text = reference ? this.props.spec.labelColor || '' : displayText;
        if (reference) {
            props.ref = this.handlers.textRef;
            props.visibility = 'hidden';
            props.style = { opacity: 0 };
            props.className = this.props.hitZoneClassName;
        }
        return <text {...props}>{text}</text>;
    }

    @computed get strokeWidth() {
        return this.props.isHovered ? 2 : 0.5;
    }

    @computed get strokeColor() {
        return this.props.isHovered ? '#666666' : '#BABDB6';
    }

    public render() {
        return (
            <g>
                <rect
                    stroke={this.strokeColor}
                    strokeWidth={this.strokeWidth}
                    fill={this.props.spec.color}
                    width={this.props.width}
                    height={this.props.height}
                    x={this.props.x}
                    y={this.props.y}
                />
                {this.makeTextElement(true)};{this.makeTextElement(false)}
                <rect
                    className={this.props.hitZoneClassName}
                    x={this.props.x}
                    y={this.props.y}
                    width={this.props.width}
                    height={this.props.height}
                    style={{ opacity: 0 }}
                />
            </g>
        );
    }
}
