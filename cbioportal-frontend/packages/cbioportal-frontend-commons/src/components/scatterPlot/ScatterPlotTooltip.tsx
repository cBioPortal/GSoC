import autobind from 'autobind-decorator';
import { observer } from 'mobx-react';
import * as React from 'react';
import { makeObservable, observable } from 'mobx';
import { Popover } from 'react-bootstrap';
import classnames from 'classnames';
import Portal from 'react-overlays/lib/Portal';
import $ from 'jquery';

import './styles.scss';

export interface IScatterPlotTooltipProps {
    container: HTMLDivElement;
    overlay: JSX.Element;
    targetCoords: { x: number; y: number };
    targetHovered?: boolean;
    className?: string;
    placement?: string;
    arrowOffsetTop?: number;
}

@observer
export default class ScatterPlotTooltip extends React.Component<
    IScatterPlotTooltipProps
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @observable isHovered = false; // allows persistence when mouse rolls over tooltip

    @autobind
    private onMouseEnter() {
        this.isHovered = true;
    }

    @autobind
    private onMouseLeave() {
        this.isHovered = false;
    }

    render() {
        const arrowOffsetTop =
            this.props.arrowOffsetTop === undefined
                ? 30
                : this.props.arrowOffsetTop;
        const arrowOffsetLeft = 24;
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
                        id="scatterPlotTooltipPopover"
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
