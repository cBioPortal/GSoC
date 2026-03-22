import WindowStore from '../window/WindowStore';
import * as React from 'react';
import { computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { CSSProperties, HTMLProps } from 'react';

interface IWindowWidthBoxProps extends React.HTMLProps<HTMLDivElement> {
    offset: number;
}

@observer
export class WindowWidthBox extends React.Component<IWindowWidthBoxProps, {}> {
    wrapper: HTMLDivElement;

    constructor(props: IWindowWidthBoxProps) {
        super(props);
        makeObservable(this);
    }

    @computed get offset() {
        return this.props.offset || 0;
    }

    @computed get style(): CSSProperties {
        return {
            width: WindowStore.size.width - this.offset,
            overflowX: 'auto',
        };
    }

    render() {
        return (
            <div
                className={this.props.className || ''}
                {...this.props}
                ref={(el: HTMLDivElement) => (this.wrapper = el)}
                style={this.style}
            >
                {this.props.children}
            </div>
        );
    }
}
