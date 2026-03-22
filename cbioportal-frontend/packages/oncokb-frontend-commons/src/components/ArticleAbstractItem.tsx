import * as React from 'react';

import styles from './listGroupItem.module.scss';
import { ArticleAbstract } from 'oncokb-ts-api-client';

export default class ArticleAbstractItem extends React.Component<
    ArticleAbstract
> {
    render() {
        let content = <span>{this.props.abstract}</span>;
        if (this.props.link) {
            content = (
                <a href={this.props.link} target="_blank">
                    {content}
                </a>
            );
        }
        return (
            <li
                key={`abstract_${this.props.abstract}`}
                className={styles['list-group-item']}
            >
                <span className={styles['list-group-item-title']}>
                    {content}
                </span>
            </li>
        );
    }
}
