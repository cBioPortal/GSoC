import * as React from 'react';
import Tooltip from 'rc-tooltip';
import ReactDOM from 'react-dom';
import 'rc-tooltip/assets/bootstrap_white.css';
import $ from 'jquery';
import './styles.scss';
import { observer } from 'mobx-react';
import { TooltipProps } from 'rc-tooltip/es/Tooltip';
import autobind from 'autobind-decorator';

export const TOOLTIP_MOUSE_ENTER_DELAY_MS = 0.5;

export interface DefaultTooltipProps extends TooltipProps {
    disabled?: boolean;
    getTooltipContainer?: () => HTMLElement;
    children: any;
}

@observer
export default class DefaultTooltip extends React.Component<
    DefaultTooltipProps,
    {}
> {
    static readonly defaultProps = {
        mouseEnterDelay: TOOLTIP_MOUSE_ENTER_DELAY_MS,
        mouseLeaveDelay: 0.05,
        arrowContent: <div className="rc-tooltip-arrow-inner" />,
    };

    @autobind
    defaultSetArrowLeft(tooltipEl: Element, align: any) {
        // Corrects for screen overflow adjustment (should really be handled by the library...)
        const arrowEl: HTMLDivElement = tooltipEl.querySelector(
            'div.rc-tooltip-arrow'
        ) as HTMLDivElement;
        // @ts-ignore: no-implicit-this
        const targetEl = ReactDOM.findDOMNode(this) as any; // eslint-disable-line no-invalid-this

        if (
            arrowEl &&
            align &&
            align.points &&
            align.points[1] &&
            align.points[1][1] === 'c'
        ) {
            // if aligning to the horizontal center, set arrow left to the horizontal center of the target
            const offset = $(targetEl).offset()!;
            const width = $(targetEl).width()!;
            const tooltipOffset = $(tooltipEl).offset()!;
            const arrowLeftOffset = offset.left - tooltipOffset.left;

            arrowEl.style.left = `${arrowLeftOffset + width / 2}px`;
        }
    }

    render() {
        let { disabled, visible, onPopupAlign, ...restProps } = this.props;
        let tooltipProps: TooltipProps = restProps;
        if (typeof visible !== 'undefined') {
            tooltipProps.visible = visible;
        }
        return (
            <Tooltip
                {...tooltipProps}
                onPopupAlign={(...args) => {
                    this.defaultSetArrowLeft(...args);
                    onPopupAlign && onPopupAlign(...args);
                }}
            >
                {this.props.children as any}
            </Tooltip>
        );
    }
}

export function setArrowLeft(tooltipEl: any, left: string) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.left = left;
}

// we need this to account for issue with rc-tooltip when dealing with large tooltip overlay content
export function placeArrowBottomLeft(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.left = '10px';
}
