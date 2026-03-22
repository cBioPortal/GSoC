import * as React from 'react';
import { DiscreteCopyNumberData } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { AnnotatedNumericGeneMolecularData } from 'shared/model/AnnotatedNumericGeneMolecularData';

/**
 * Mutation Column Formatter.
 */
export default class CustomDriverTierColumnFormatter {
    public static getTextValue(data: DiscreteCopyNumberData[]): string {
        let textValue: string = '';
        const dataValue = CustomDriverTierColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString();
        }

        return textValue;
    }

    public static getData(data: DiscreteCopyNumberData[]) {
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

    public static renderFunction(cnaData: DiscreteCopyNumberData[]) {
        // use text for all purposes (display, sort, filter)
        const text: string = CustomDriverTierColumnFormatter.getTextValue(
            cnaData
        );

        // use actual value for tooltip
        const toolTip: string = CustomDriverTierColumnFormatter.getTextValue(
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
            content = <span>{text} </span>;
        }

        return <span>{content}</span>;
    }
}
