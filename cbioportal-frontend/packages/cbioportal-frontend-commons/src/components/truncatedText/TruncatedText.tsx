import * as React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import { default as DefaultTooltip } from '../defaultTooltip/DefaultTooltip';

export interface ITruncatedTextProps {
    text: string;
    className?: string;
    maxLength?: number; // max allowed length of the text
    buffer?: number; // buffer length before considering truncating the text
    suffix?: string; // will be added to the end of the text if truncated
    addTooltip?: 'truncated' | 'always' | 'never'; // when to add the tooltip
    tooltip?: JSX.Element; // tooltip content
}

export function isTooLong(
    text: string,
    maxLength: number,
    buffer?: number
): boolean {
    return text != null && text.length > maxLength + (buffer || 0);
}

export function truncateText(
    text: string,
    suffix: string,
    maxLength: number,
    buffer?: number
) {
    if (isTooLong(text, maxLength, buffer)) {
        return text.substring(0, maxLength) + suffix;
    } else {
        return text;
    }
}

/**
 * @author Selcuk Onur Sumer
 */
@observer
export default class TruncatedText extends React.Component<
    ITruncatedTextProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps = {
        maxLength: 50,
        buffer: 2,
        suffix: '...',
        addTooltip: 'truncated',
    };

    public render() {
        let content = (
            <span
                style={{ whiteSpace: 'nowrap' }}
                className={classNames(this.props.className)}
            >
                {this.truncatedText}
            </span>
        );

        if (this.needsTooltip) {
            content = (
                <DefaultTooltip
                    overlay={() =>
                        this.props.tooltip || (
                            <div style={{ maxWidth: 500 }}>
                                {this.props.text}
                            </div>
                        )
                    }
                    placement="right"
                    destroyTooltipOnHide={true}
                >
                    {content}
                </DefaultTooltip>
            );
        }

        return content;
    }

    @computed get needsTooltip(): boolean {
        return (
            this.props.addTooltip !== 'never' &&
            (this.props.addTooltip === 'always' ||
                (this.props.addTooltip === 'truncated' && this.isTooLong))
        );
    }

    @computed get isTooLong(): boolean {
        return isTooLong(
            this.props.text,
            this.props.maxLength || TruncatedText.defaultProps.maxLength,
            this.props.buffer
        );
    }

    @computed get truncatedText(): string {
        return truncateText(
            this.props.text,
            this.props.suffix || TruncatedText.defaultProps.suffix,
            this.props.maxLength || TruncatedText.defaultProps.maxLength,
            this.props.buffer
        );
    }
}
