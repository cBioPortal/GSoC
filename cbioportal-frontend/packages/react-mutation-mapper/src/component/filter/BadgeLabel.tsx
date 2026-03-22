import * as React from 'react';
import { CSSProperties } from 'react';

export type BadgeLabelProps = {
    label: JSX.Element | string;
    badgeContent?: number | string;
    badgeStyleOverride?: CSSProperties;
    badgeClassName?: string;
    badgeFirst?: boolean;
    value?: string;
    isDriverAnnotated?: boolean;
    badgeLabelFormat?: (
        label: JSX.Element | string,
        badgeFirst?: boolean,
        value?: string,
        badge?: JSX.Element | null
    ) => JSX.Element;
};

export const DEFAULT_BADGE_STYLE = {
    color: '#FFF',
    backgroundColor: '#000',
    borderStyle: 'solid',
    borderWidth: 'thin',
};

export class BadgeLabel extends React.Component<BadgeLabelProps, {}> {
    public static defaultProps: Partial<BadgeLabelProps> = {
        badgeClassName: 'badge',
        badgeFirst: false,
    };

    protected get badge(): JSX.Element | null {
        return (
            <span
                style={
                    this.props.badgeFirst
                        ? this.props.isDriverAnnotated
                            ? {}
                            : { marginRight: 5 }
                        : { marginLeft: 5 }
                }
            >
                <span
                    className={this.props.badgeClassName}
                    data-test={`badge-${this.props.value}`}
                    style={{
                        ...DEFAULT_BADGE_STYLE,
                        ...this.props.badgeStyleOverride,
                        ...(this.props.isDriverAnnotated
                            ? { marginRight: 0, width: 'auto' }
                            : {}),
                    }}
                >
                    {this.props.badgeContent}
                </span>
            </span>
        );
    }

    protected get badgeFirst(): JSX.Element {
        if (this.props.badgeLabelFormat) {
            return this.props.badgeLabelFormat(
                this.props.label,
                true,
                this.props.value,
                this.badge
            );
        } else {
            return (
                <>
                    {this.badge}
                    {this.props.label}
                </>
            );
        }
    }

    protected get badgeLast(): JSX.Element {
        if (this.props.badgeLabelFormat) {
            return this.props.badgeLabelFormat(
                this.props.label,
                false,
                this.props.value,
                this.badge
            );
        } else {
            return (
                <>
                    {this.props.label}
                    {this.badge}
                </>
            );
        }
    }

    public render(): JSX.Element {
        return this.props.badgeFirst ? this.badgeFirst : this.badgeLast;
    }
}

export default BadgeLabel;
