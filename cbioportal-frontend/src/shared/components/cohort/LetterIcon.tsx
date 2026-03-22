import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

export interface ILetterIconProps {
    text: string;
    tooltip?: JSX.Element | (() => JSX.Element);
    stroke?: string;
    circleFill?: string;
    fontSize?: number;
    textFill?: string;
}

/**
 * @author Selcuk Onur Sumer
 */
export default class LetterIcon extends React.Component<ILetterIconProps, {}> {
    public static defaultProps = {
        stroke: '#55C',
        circleFill: 'none',
        fontSize: 7,
        textFill: '#66C',
    };

    public render() {
        let content = (
            <svg width="12" height="12">
                <circle
                    r="5"
                    cx="6"
                    cy="6"
                    stroke={this.props.stroke}
                    fill={this.props.circleFill}
                />
                <text
                    x="3"
                    y="8.5"
                    fontSize={this.props.fontSize}
                    fill={this.props.textFill}
                >
                    {this.props.text.slice(0, 1)}
                </text>
            </svg>
        );

        if (this.props.tooltip) {
            content = (
                <DefaultTooltip
                    placement="right"
                    overlay={this.props.tooltip}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}
                >
                    {content}
                </DefaultTooltip>
            );
        }

        return content;
    }
}
