import * as React from 'react';
import { ThreeBounce } from 'better-react-spinkit';
import { If, Else, Then } from 'react-if';
import Spinner from 'react-spinkit';
import { Portal } from 'react-portal';
import classNames from 'classnames';
import styles from './styles.module.scss';
import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';

export interface ILoader {
    isLoading: boolean;
    style?: any;
    inline?: boolean;
    center?: boolean;
    centerRelativeToContainer?: boolean;
    noFade?: boolean;
    size?: 'big' | 'small';
    small?: boolean;
    big?: boolean;
    className?: string;
}

@observer
export default class LoadingIndicator extends React.Component<ILoader, {}> {
    constructor(props: ILoader) {
        super(props);
        makeObservable(this);
    }

    public static defaultProps = {
        inline: true,
        center: false,
        size: 'small',
    };

    @computed get size() {
        if (this.props.size) {
            return this.props.size;
        } else if (this.props.big) {
            return 'big';
        } else if (this.props.small) {
            return 'small';
        } else {
            return undefined;
        }
    }

    public render() {
        const spinnerStyles = {
            [styles.small]: this.size === 'small',
            [styles.big]: this.size === 'big',
            inlineBlock: this.props.inline,
        };

        const parentStyles = {
            [styles.centered]: this.props.center,
            [styles.nofade]: this.props.noFade,
            // (centered-relative-to-container style is currently commented out)
            // [styles['centered-relative-to-container']]: this.props
            //     .centerRelativeToContainer,
            [styles['centered-with-children']]:
                (this.props.center || this.props.centerRelativeToContainer) &&
                React.Children.count(this.props.children) > 0,
            inlineBlock: this.props.inline,
        };

        return (
            <If condition={this.props.isLoading}>
                <Then>
                    <div
                        className={classNames(
                            parentStyles,
                            this.props.className
                        )}
                        style={this.props.style || {}}
                        data-test={'LoadingIndicator'}
                    >
                        <Spinner
                            fadeIn="none"
                            className={classNames(styles.color, spinnerStyles)}
                            style={{ display: 'inline-block' }}
                            name="line-scale-pulse-out"
                        />
                        <div className={styles.progressUI}>
                            {this.props.children}
                        </div>
                    </div>
                </Then>
            </If>
        );
    }
}

export class GlobalLoader extends React.Component<ILoader, {}> {
    public render() {
        return (
            <Portal isOpened={this.props.isLoading}>
                <Spinner
                    className={classNames(
                        styles.color,
                        styles.centered,
                        styles.big
                    )}
                    fadeIn="none"
                    name="line-scale-pulse-out"
                />
            </Portal>
        );
    }
}
