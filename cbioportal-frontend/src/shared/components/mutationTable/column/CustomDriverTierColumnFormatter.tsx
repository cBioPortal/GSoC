import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { createToolTip } from './CategoricalColumnFormatter';
import styles from './mutationType.module.scss';
import _ from 'lodash';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';

/**
 * Mutation Column Formatter.
 */
export default class CustomDriverTierColumnFormatter {
    public static getTextValue(data: Mutation[]): string {
        let textValue: string = '';
        const dataValue = CustomDriverTierColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getData(data: Mutation[]) {
        if (data.length > 0) {
            // show driverTiersFilter data in case driverTiersFilterAnnotation is not present
            if (_.isEmpty(data[0].driverTiersFilterAnnotation)) {
                return data[0].driverTiersFilter;
            }
            return data[0].driverTiersFilterAnnotation;
        } else {
            return null;
        }
    }

    public static renderFunction(mutations: Mutation[]) {
        // use text for all purposes (display, sort, filter)
        const text: string = CustomDriverTierColumnFormatter.getTextValue(
            mutations
        );

        // use actual value for tooltip
        const toolTip: string = CustomDriverTierColumnFormatter.getTextValue(
            mutations
        );

        let content;
        if (
            mutations[0] !== undefined &&
            (mutations[0] as AnnotatedMutation).putativeDriver
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
