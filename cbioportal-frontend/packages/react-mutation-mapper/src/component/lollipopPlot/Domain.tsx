import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';

import $ from 'jquery';

import { DomainSpec } from '../../model/DomainSpec';

type DomainProps = {
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    label?: string;
    labelColor?: string;
    hitzoneClassName?: string;
    spec: DomainSpec;
};

@observer
export default class Domain extends React.Component<DomainProps, {}> {
    @observable private textElt: SVGTextElement | null = null;
    @observable private isMounted: boolean = false;
    private handlers: any;

    constructor(props: DomainProps) {
        super(props);
        makeObservable<Domain, 'textElt' | 'isMounted' | 'displayText'>(this);
        this.state = {
            displayText: props.label || '',
        };
        this.handlers = {
            textRef: action((text: SVGTextElement | null) => {
                this.textElt = text;
            }),
        };
    }
    public get hitRect() {
        return {
            x: this.props.x,
            y: this.props.y,
            width: this.props.width,
            height: this.props.height,
        };
    }

    private get centerX() {
        return this.props.x + this.props.width / 2;
    }

    private get centerY() {
        return this.props.y + this.props.height / 2;
    }

    @action componentDidMount() {
        this.isMounted = true;
    }

    @computed private get displayText() {
        // Truncate text if necessary
        const label = this.props.label || '';
        if (!this.textElt || !this.isMounted) {
            return label;
        }

        if (!$(this.textElt).is(':visible')) {
            return label;
        }

        let substringLength = label.length;
        // Find the number of characters that will fit inside
        while (
            substringLength > 0 &&
            this.textElt.getSubStringLength(0, substringLength) >
                this.props.width
        ) {
            substringLength -= 1;
        }
        let displayText = label;
        if (substringLength < label.length) {
            // If we have to do shortening
            substringLength -= 2; // make room for ellipsis ".."
            if (substringLength <= 0) {
                // too short to show any string
                displayText = '';
            } else {
                // if it's long enough to show anything at all
                displayText = label.substr(0, substringLength) + '..';
            }
        }
        return displayText;
    }

    private makeTextElement(reference: boolean) {
        let props: any = {
            x: this.centerX,
            y: this.centerY,
            textAnchor: 'middle',
            dy: '0.3em',
            fill: this.props.labelColor || '#FFFFFF',
            style: {
                fontSize: '12px',
                fontFamily: 'arial',
            },
        };
        const text = reference ? this.props.label || '' : this.displayText;
        if (reference) {
            props.ref = this.handlers.textRef;
            props.visibility = 'hidden';
            props.style = { opacity: 0 };
            props.className = this.props.hitzoneClassName;
        }
        return <text {...props}>{text}</text>;
    }

    render() {
        return (
            <g>
                <rect
                    x={this.props.x}
                    y={this.props.y}
                    width={this.props.width}
                    height={this.props.height}
                    fill={this.props.color}
                />
                {this.makeTextElement(true)}
                {this.makeTextElement(false)}
                <rect
                    className={this.props.hitzoneClassName}
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
