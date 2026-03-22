import * as React from 'react';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { AnnotatedStructuralVariant } from 'shared/model/AnnotatedMutation';

/**
 * Discrete Copy Number Formatter.
 */
export default class CustomDriverTierColumnFormatter {
    public static getTextValue(data: StructuralVariant[]): string {
        let textValue: string = '';
        const dataValue = CustomDriverTierColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getData(data: StructuralVariant[]) {
        if (data.length > 0) {
            // show driverTiersFilter data in case driverTiersFilterAnnotation is not present
            if (_.isEmpty(data[0].driverTiersFilterAnn)) {
                return data[0].driverTiersFilter;
            }
            return data[0].driverTiersFilterAnn;
        } else {
            return null;
        }
    }

    public static renderFunction(svData: StructuralVariant[]) {
        // use text for all purposes (display, sort, filter)
        const text: string = CustomDriverTierColumnFormatter.getTextValue(
            svData
        );

        // use actual value for tooltip
        const toolTip: string = CustomDriverTierColumnFormatter.getTextValue(
            svData
        );

        let content;
        if (
            svData[0] !== undefined &&
            (svData[0] as AnnotatedStructuralVariant).putativeDriver
        ) {
            content = (
                <span>
                    <strong>{text}</strong>
                </span>
            );
        } else {
            content = <span>{text}</span>;
        }

        return <span>{content}</span>;
    }
}
