import * as React from 'react';
import { Mutation, Gene } from 'cbioportal-ts-api-client';

/**
 * @author Selcuk Onur Sumer
 */
export default class GeneColumnFormatter {
    /**
     * Default text value for a gene is its hugo gene symbol.
     *
     * @param data  column formatter data
     * @returns {string}    hugo gene symbol
     */
    public static getTextValue(data: Mutation[]): string {
        const hugo = GeneColumnFormatter.getData(data);

        return hugo || '';
    }

    public static getDisplayValue(data: Mutation[]): string {
        // same as text value
        return GeneColumnFormatter.getTextValue(data);
    }

    public static getData(data: Mutation[]) {
        if (data.length > 0) {
            return data[0].gene.hugoGeneSymbol;
        } else {
            return null;
        }
    }

    public static getSortValue(data: Mutation[]): string {
        return GeneColumnFormatter.getTextValue(data);
    }

    public static renderFunction(data: Mutation[]) {
        // use text as display value
        const text = GeneColumnFormatter.getDisplayValue(data);

        return <span data-test="mutation-table-gene-column">{text}</span>;
    }
}
