import * as React from 'react';
import classNames from 'classnames';
import autobind from 'autobind-decorator';

export default class LockIcon extends React.Component<
    {
        locked: boolean;
        size?: string;
        onClick?: () => void;
        className?: string;
        disabled?: boolean;
    },
    {}
> {
    private get icon() {
        let iconName = 'fa-lock';
        if (!this.props.locked) {
            iconName = 'fa-unlock';
        }
        return (
            <i
                className={classNames(
                    'fa',
                    this.props.size || 'fa-lg',
                    iconName,
                    this.props.className
                )}
                style={{
                    cursor:
                        this.props.onClick && !this.props.disabled
                            ? 'pointer'
                            : 'auto',
                    paddingTop: '0.2em',
                }}
            />
        );
    }

    @autobind
    private onClick() {
        if (!this.props.disabled && this.props.onClick) {
            this.props.onClick();
        }
    }

    render() {
        return <div onClick={this.onClick}>{this.icon}</div>;
    }
}
