import * as React from 'react';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { AnnotatedStructuralVariant } from 'shared/model/AnnotatedMutation';
import { DriverFilterOrder } from 'shared/lib/StoreUtils';

/**
 * Discrete Copy Number Formatter.
 */
export default class CustomDriverColumnFormatter {
    public static getTextValue(data: StructuralVariant[]): string {
        let textValue: string = '';
        const dataValue = CustomDriverColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getData(data: StructuralVariant[]) {
        if (data.length > 0) {
            // show driverFilter data in case driverFilterAnnotation is not present
            if (_.isEmpty(data[0].driverFilterAnn)) {
                return data[0].driverFilter;
            }
            return data[0].driverFilterAnn;
        } else {
            return null;
        }
    }

    public static sortValue(data: StructuralVariant[]) {
        if (
            _.isEmpty(data[0].driverFilter) ||
            _.isEmpty(data[0].driverFilterAnn)
        ) {
            return null;
        }

        return (
            DriverFilterOrder[
                data[0].driverFilter.toUpperCase() as keyof typeof DriverFilterOrder
            ] +
            '_' +
            data[0].driverFilterAnn
        );
    }

    public static renderFunction(cnaData: StructuralVariant[]) {
        // use text for all purposes (display, sort, filter)
        const text: string = CustomDriverColumnFormatter.getTextValue(cnaData);

        // use actual value for tooltip
        const toolTip: string = CustomDriverColumnFormatter.getTextValue(
            cnaData
        );

        let content;
        if (
            cnaData[0] !== undefined &&
            (cnaData[0] as AnnotatedStructuralVariant).putativeDriver
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
