import { observer } from 'mobx-react';
import * as React from 'react';
import { makeObservable, observable } from 'mobx';
import { Popover } from 'react-bootstrap';
import bind from 'bind-decorator';
import classnames from 'classnames';
import Portal from 'react-overlays/lib/Portal';
import $ from 'jquery';

export interface IWaterfallPlotTooltipProps {
    container: HTMLDivElement;
    overlay: JSX.Element;
    targetCoords: { x: number; y: number };
    targetHovered?: boolean;
    className?: string;
    placement?: string;
}

@observer
export default class WaterfallPlotTooltip extends React.Component<
    IWaterfallPlotTooltipProps,
    {}
> {
    constructor(props: IWaterfallPlotTooltipProps) {
        super(props);
        makeObservable(this);
    }
    @observable isHovered = false; // allows persistence when mouse rolls over tooltip

    @bind
    private onMouseEnter() {
        this.isHovered = true;
    }

    @bind
    private onMouseLeave() {
        this.isHovered = false;
    }

    render() {
        const arrowOffsetTop = 30; // experimentally determined
        const arrowOffsetLeft = 24; // experimentally determined
        const leftPadding = 5;
        const horizontal =
            !this.props.placement ||
            this.props.placement === 'left' ||
            this.props.placement === 'right';
        const containerOffset = $(this.props.container).offset();
        if (containerOffset && (this.props.targetHovered || this.isHovered)) {
            return (
                <Portal container={document.body}>
                    <Popover
                        className={classnames(
                            'cbioportal-frontend',
                            'cbioTooltip',
                            this.props.className
                        )}
                        positionLeft={
                            this.props.targetCoords.x +
                            containerOffset.left +
                            leftPadding -
                            (!horizontal ? arrowOffsetLeft + 6 : 0)
                        }
                        positionTop={
                            this.props.targetCoords.y +
                            containerOffset.top -
                            (horizontal ? arrowOffsetTop : -5)
                        }
                        onMouseEnter={this.onMouseEnter}
                        onMouseLeave={this.onMouseLeave}
                        arrowOffsetTop={horizontal ? arrowOffsetTop : undefined}
                        arrowOffsetLeft={
                            !horizontal ? arrowOffsetLeft : undefined
                        }
                        placement={this.props.placement}
                    >
                        {this.props.overlay}
                    </Popover>
                </Portal>
            );
        } else {
            return null;
        }
    }
}
