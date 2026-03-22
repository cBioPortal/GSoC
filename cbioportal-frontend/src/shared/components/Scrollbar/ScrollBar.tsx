import * as React from 'react';
import Draggable from 'react-draggable';
import { CSSProperties } from 'react';
import { observer } from 'mobx-react';
import { action, makeObservable, observable, runInAction } from 'mobx';

import styles from './styles.module.scss';
import autobind from 'autobind-decorator';

export interface ScrollBarScrollEvent {
    percentage: number;
}

interface IScrollBar {
    onScroll?: (ev: ScrollBarScrollEvent) => void;
    getScrollEl: () => HTMLElement;
    style?: CSSProperties;
}

@observer
export default class ScrollBar extends React.Component<IScrollBar, {}> {
    constructor(props: IScrollBar) {
        super(props);
        makeObservable(this);
    }

    public scrollbarEl: HTMLDivElement | undefined;

    public get scrollEl() {
        return this.props.getScrollEl();
    }

    public get overflow() {
        return (
            this.scrollEl.offsetWidth -
            (this.scrollEl.parentNode as HTMLElement).offsetWidth
        );
    }

    @observable visible = false;
    @observable handleWidth = '10%';

    doScroll(ratio: number) {
        if (this.overflow > 0) {
            this.scrollEl.style.left = ratio * this.overflow * -1 + 'px';
        }
    }

    componentDidMount() {
        this.updateScrollbar();
    }

    componentDidUpdate() {
        this.updateScrollbar();
    }

    updateScrollbar() {
        // we need to use a timeout here in order to account for fact that parent component ref
        // has not yet fired in lifecycle
        setTimeout(() => {
            if (this.overflow > 0) {
                runInAction(() => {
                    this.visible = true;
                    var overflowRatio =
                        (this.scrollEl.parentNode as HTMLElement).offsetWidth /
                        this.scrollEl.offsetWidth;
                    this.handleWidth = overflowRatio * 75 + '%';
                });
            }
        }, 1);
    }

    @autobind
    handleDragEvent(mouseEvent: any, dragEvent: any) {
        const node = dragEvent.node;
        let percentage =
            dragEvent.x / (node.parentNode.offsetWidth - node.offsetWidth);
        percentage = percentage > 1 ? 1 : percentage;
        percentage = percentage < 0 ? 0 : percentage;
        if (this.props.onScroll) this.props.onScroll({ percentage });
        this.doScroll(percentage);
    }

    render() {
        const style = Object.assign(
            {},
            { visibility: this.visible ? 'visible' : 'hidden' },
            this.props.style
        );

        return (
            <div
                className={styles.scrollbar}
                style={style}
                ref={(el: HTMLDivElement) => (this.scrollbarEl = el)}
            >
                <Draggable bounds={'parent'} onDrag={this.handleDragEvent}>
                    <div
                        className={styles.handle}
                        style={{ width: this.handleWidth }}
                    ></div>
                </Draggable>
            </div>
        );
    }
}
