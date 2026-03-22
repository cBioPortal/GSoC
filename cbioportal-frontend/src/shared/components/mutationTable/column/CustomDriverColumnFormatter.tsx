import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { createToolTip } from './CategoricalColumnFormatter';
import styles from './mutationType.module.scss';
import _ from 'lodash';
import { DriverFilterOrder, PUTATIVE_DRIVER } from 'shared/lib/StoreUtils';

/**
 * Mutation Column Formatter.
 */
export default class CustomDriverColumnFormatter {
    public static getTextValue(data: Mutation[]): string {
        let textValue: string = '';
        const dataValue = CustomDriverColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getData(data: Mutation[]) {
        if (data.length > 0) {
            // show driverFilter data in case driverFilterAnnotation is not present
            if (_.isEmpty(data[0].driverFilterAnnotation)) {
                return data[0].driverFilter;
            }
            return data[0].driverFilterAnnotation;
        } else {
            return null;
        }
    }

    public static sortValue(data: Mutation[]) {
        if (
            _.isEmpty(data[0].driverFilter) ||
            _.isEmpty(data[0].driverFilterAnnotation)
        ) {
            return null;
        }

        return (
            DriverFilterOrder[
                data[0].driverFilter.toUpperCase() as keyof typeof DriverFilterOrder
            ] +
            '_' +
            data[0].driverFilterAnnotation
        );
    }

    public static renderFunction(mutations: Mutation[]) {
        // use text for all purposes (display, sort, filter)
        const text: string = CustomDriverColumnFormatter.getTextValue(
            mutations
        );

        // use actual value for tooltip
        const toolTip: string = CustomDriverColumnFormatter.getTextValue(
            mutations
        );

        let content;
        if (
            !_.isEmpty(mutations[0]?.driverFilter) &&
            mutations[0].driverFilter === PUTATIVE_DRIVER
        ) {
            content = (
                <span>
                    <strong>{text}</strong>
                </span>
            );
        } else {
            content = <span>{text} </span>;
        }

        // add tooltip only if the display value differs from the actual text value!
        if (toolTip.toLowerCase() !== text.toLowerCase()) {
            content = createToolTip(content, toolTip);
        }
        return <span className={styles.mutationTypeCell}>{content}</span>;
    }
}
