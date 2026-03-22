import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import styles from './styles.module.scss';
import classnames from 'classnames';

export interface IGroupLogicProps {
    components: JSX.Element[];
    operation: string;
    group: boolean;
}

@observer
export class GroupLogic extends React.Component<IGroupLogicProps, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @computed
    get child() {
        let elements = [];
        if (this.props.group) {
            elements.push(
                <span className={classnames(styles.text, styles.mostLeft)}>
                    (
                </span>
            );
        }
        _.reduce(
            this.props.components,
            (acc, next, index): any => {
                if (index > 0) {
                    acc.push(
                        <span className={styles.text}>
                            {this.props.operation}
                        </span>
                    );
                }
                acc.push(next);
                return acc;
            },
            elements
        );
        if (this.props.group) {
            elements.push(
                <span className={classnames(styles.text, styles.mostRight)}>
                    )
                </span>
            );
        }
        return elements;
    }

    render() {
        return <div className={styles.main}>{this.child}</div>;
    }
}
