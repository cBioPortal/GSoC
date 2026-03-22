import { getNCBIlink } from '../lib/urls';
import * as React from 'react';

import styles from './listGroupItem.module.scss';
import { trimOffHtmlTagEntities } from '../lib/StringUtils';

type PmidItemProps = {
    title: string;
    author: string;
    source: string;
    date: string;
    pmid: string;
};

export default class PmidItem extends React.Component<PmidItemProps> {
    render() {
        return (
            <li key={this.props.pmid} className={styles['list-group-item']}>
                <a
                    className={styles['list-group-item-title']}
                    href={getNCBIlink(`/pubmed/${this.props.pmid}`)}
                    target="_blank"
                >
                    <span>{trimOffHtmlTagEntities(this.props.title)}</span>
                </a>
                <div className={styles['list-group-item-content']}>
                    <span>
                        {this.props.author} {this.props.source}.{' '}
                        {this.props.date}
                    </span>
                    <span>PMID: {this.props.pmid}</span>
                </div>
            </li>
        );
    }
}
