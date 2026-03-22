import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import styles from './EllipsisTextTooltip.module.scss';
import DefaultTooltip from '../defaultTooltip/DefaultTooltip';
import $ from 'jquery';
import classNames from 'classnames';
import autobind from 'autobind-decorator';

// This is a block component
@observer
export default class EllipsisTextTooltip extends React.Component<
    { text: any; style?: any; hideTooltip?: boolean; className?: string },
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @observable tooltipVisible = false;

    el: HTMLDivElement;

    @action.bound
    onVisibleChange(isVisible: boolean) {
        // if shownWidth exist, using the shownWidth
        let shownWidth = $(this.el).innerWidth()!;
        let actualWidth = this.el.scrollWidth;

        const isOverflowed = actualWidth - shownWidth > 1;
        this.tooltipVisible =
            !this.props.hideTooltip && isVisible && isOverflowed;
    }

    @autobind
    setRef(el: HTMLDivElement) {
        this.el = el;
    }

    render() {
        return (
            <DefaultTooltip
                overlay={<span>{this.props.text}</span>}
                visible={this.tooltipVisible}
                onVisibleChange={this.onVisibleChange}
            >
                <div
                    className={classNames(styles.text, this.props.className)}
                    style={this.props.style}
                    ref={this.setRef}
                >
                    {this.props.text}
                </div>
            </DefaultTooltip>
        );
    }
}
