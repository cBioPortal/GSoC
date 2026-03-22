import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import styles from './mutationStatus.module.scss';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

/**
 * @author Selcuk Onur Sumer
 */
export default class MutationStatusColumnFormatter {
    public static getData(data: Mutation[]) {
        let value: string | null = null;

        if (data.length > 0) {
            value = data[0].mutationStatus;
        }

        return value;
    }

    public static sortValue(data: Mutation[]) {
        return MutationStatusColumnFormatter.getData(data);
    }

    public static download(data: Mutation[]) {
        return MutationStatusColumnFormatter.getData(data) || '';
    }

    public static renderFunction(data: Mutation[]) {
        const value = MutationStatusColumnFormatter.getData(data);
        let content: JSX.Element;
        let needTooltip = false;

        if (value) {
            if (value.toLowerCase().indexOf('somatic') > -1) {
                content = <span className={styles.somatic}>S</span>;
                needTooltip = true;
            } else if (value.toLowerCase().indexOf('germline') > -1) {
                content = <span className={styles.germline}>G</span>;
                needTooltip = true;
            } else {
                content = <span className={styles.unknown}>{value}</span>;
            }
        } else {
            content = <span />;
        }

        if (needTooltip) {
            content = (
                <DefaultTooltip
                    overlay={<span>{value}</span>}
                    placement="right"
                >
                    {content}
                </DefaultTooltip>
            );
        }

        return content;
    }
}
