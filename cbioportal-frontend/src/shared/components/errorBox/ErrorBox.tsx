import * as React from 'react';
import FontAwesome from 'react-fontawesome';
import styles from './styles.module.scss';
import classNames from 'classnames';

interface ISectionHeaderProps
    extends React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLDivElement>,
        HTMLDivElement
    > {
    error: Error;
}

export default class ErrorBox extends React.Component<ISectionHeaderProps, {}> {
    render() {
        let { error, children, className, ...divProps } = this.props;
        return (
            <div className={classNames(className, styles.error)} {...divProps}>
                <span className={styles.message}>
                    <FontAwesome
                        className={styles.icon}
                        name="exclamation-circle"
                    />
                    {error.message + ''}
                </span>
                {children}
            </div>
        );
    }
}
