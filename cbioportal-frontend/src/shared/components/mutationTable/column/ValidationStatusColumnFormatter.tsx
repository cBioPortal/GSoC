import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import styles from './validationStatus.module.scss';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

/**
 * @author Selcuk Onur Sumer
 */
export default class ValidationStatusColumnFormatter {
    /**
     * Mapping between the validation status (data) values and view values.
     */
    public static get VALIDATION_STATUS_FORMAT(): {
        [status: string]: { text: string; className: string; tooltip: string };
    } {
        const UNKNOWN = { text: 'U', className: 'unknown', tooltip: 'Unknown' };
        const VALID = { text: 'V', className: 'valid', tooltip: 'Valid' };
        const WILDTYPE = {
            text: 'W',
            className: 'wildtype',
            tooltip: 'Wildtype',
        };

        return {
            valid: VALID,
            validated: VALID,
            wildtype: WILDTYPE,
            unknown: UNKNOWN,
            not_tested: UNKNOWN,
            'not tested': UNKNOWN,
            none: UNKNOWN,
            na: UNKNOWN,
            'n/a': UNKNOWN,
        };
    }

    public static getData(data: Mutation[]) {
        let value: string | null = null;

        if (data.length > 0) {
            value = data[0].validationStatus;
        }

        return value;
    }

    public static sortValue(data: Mutation[]) {
        return ValidationStatusColumnFormatter.getData(data);
    }

    public static download(data: Mutation[]) {
        return ValidationStatusColumnFormatter.getData(data) || '';
    }

    public static renderFunction(data: Mutation[]) {
        const value = ValidationStatusColumnFormatter.getData(data);
        let content: JSX.Element;
        let needTooltip = false;

        if (value) {
            const format =
                ValidationStatusColumnFormatter.VALIDATION_STATUS_FORMAT[
                    value.toLowerCase()
                ];

            if (format) {
                content = (
                    <span className={(styles as any)[format.className]}>
                        {format.text}
                    </span>
                );
                needTooltip = true;
            } else {
                content = <span className={styles.other}>{value}</span>;
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
