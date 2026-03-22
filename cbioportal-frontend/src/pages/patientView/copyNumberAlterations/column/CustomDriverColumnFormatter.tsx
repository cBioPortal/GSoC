import * as React from 'react';
import { DiscreteCopyNumberData } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { AnnotatedNumericGeneMolecularData } from 'shared/model/AnnotatedNumericGeneMolecularData';
import { DriverFilterOrder } from 'shared/lib/StoreUtils';

/**
 * Discrete Copy Number Formatter.
 */
export default class CustomDriverColumnFormatter {
    public static getTextValue(data: DiscreteCopyNumberData[]): string {
        let textValue: string = '';
        const dataValue = CustomDriverColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getData(data: DiscreteCopyNumberData[]) {
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

    public static sortValue(data: DiscreteCopyNumberData[]) {
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

    public static renderFunction(cnaData: DiscreteCopyNumberData[]) {
        // use text for all purposes (display, sort, filter)
        const text: string = CustomDriverColumnFormatter.getTextValue(cnaData);

        // use actual value for tooltip
        const toolTip: string = CustomDriverColumnFormatter.getTextValue(
            cnaData
        );

        let content;
        if (
            cnaData[0] !== undefined &&
            ((cnaData[0] as unknown) as AnnotatedNumericGeneMolecularData)
                .putativeDriver
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
