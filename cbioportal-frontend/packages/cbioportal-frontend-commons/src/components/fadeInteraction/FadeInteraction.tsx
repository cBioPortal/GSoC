import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, reaction, makeObservable } from 'mobx';

export interface IFadeInteractionProps {
    fadeInSeconds?: number;
    fadeOutSeconds?: number;
    showByDefault?: boolean;
    show?: boolean;
}

@observer
export default class FadeInteraction extends React.Component<
    IFadeInteractionProps,
    {}
> {
    static defaultProps = {
        fadeInSeconds: 0.2,
        fadeOutSeconds: 0.6,
    };

    constructor(props: IFadeInteractionProps) {
        super(props);
        makeObservable(this);
        this.initialShow = props.showByDefault === true;
        this.onFocus = this.onFocus.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);
    }

    @observable focused = false;
    @observable mouseInside = false;
    public initialShow = false;

    componentWillUpdate(nextProps: IFadeInteractionProps) {
        if (nextProps.show !== this.props.show) {
            this.initialShow = false;
        }
    }

    @computed get fadeInStyle() {
        return {
            WebkitTransition: `opacity ${this.props.fadeInSeconds}s`,
            MozTransition: `opacity ${this.props.fadeInSeconds}s`,
            OTransition: `opacity ${this.props.fadeInSeconds}s`,
            transition: `opacity ${this.props.fadeInSeconds}s`,
            opacity: 1,
        };
    }

    @computed get fadeOutStyle() {
        return {
            WebkitTransition: `opacity ${this.props.fadeOutSeconds}s`,
            MozTransition: `opacity ${this.props.fadeOutSeconds}s`,
            OTransition: `opacity ${this.props.fadeOutSeconds}s`,
            transition: `opacity ${this.props.fadeOutSeconds}s`,
            opacity: 0,
        };
    }

    @computed get style() {
        if (this.show) {
            return this.fadeInStyle;
        } else {
            return this.fadeOutStyle;
        }
    }

    @computed get show() {
        return (
            this.props.show ||
            this.focused ||
            this.mouseInside ||
            this.initialShow
        );
    }

    private onFocus() {
        this.focused = true;
    }

    private onBlur() {
        this.focused = false;
    }

    @action
    onMouseEnter() {
        this.initialShow = false;
        this.mouseInside = true;
    }

    @action
    onMouseLeave() {
        this.initialShow = false;
        this.mouseInside = false;
    }

    render() {
        return (
            <div
                style={this.style}
                onFocus={this.onFocus}
                onBlur={this.onBlur}
                onMouseEnter={this.onMouseEnter}
                onMouseLeave={this.onMouseLeave}
            >
                {this.props.children}
            </div>
        );
    }
}
