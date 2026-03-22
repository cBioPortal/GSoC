import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { Mutation } from 'cbioportal-ts-api-client';
import {
    ICategoricalColumn,
    createToolTip,
} from './CategoricalColumnFormatter';
import styles from './variantType.module.scss';

/**
 * Variant Type Column Formatter.
 *
 * This class follows the official GDC MAF Variant Type List:
 * https://docs.gdc.cancer.gov/Data/File_Formats/MAF_Format/
 *
 * Possible variant type values include:
 * SNP, DNP, TNP, ONP, INS, DEL, or Consolidated.
 */
export default class VariantTypeColumnFormatter {
    public static get MAIN_VARIANT_TYPE_MAP(): {
        [key: string]: ICategoricalColumn;
    } {
        return {
            SNP: {
                toolTip: 'Single Nucleotide Polymorphism',
                className: styles.variantTypeSnp,
            },
            DNP: {
                toolTip: 'Di-Nucleotide Polymorphism',
                className: styles.variantTypeSnp,
            },
            TNP: {
                toolTip: 'Tri-Nucleotide Polymorphism',
                className: styles.variantTypeSnp,
            },
            ONP: {
                toolTip: 'Oligo-Nucleotide Polymorphism',
                className: styles.variantTypeSnp,
            },
            INS: {
                toolTip: 'Insertion',
                className: styles.variantTypeIns,
            },
            DEL: {
                toolTip: 'Deletion',
                className: styles.variantTypeDel,
            },
            CONSOLIDATED: {
                className: styles.variantTypeOther,
            },
            OTHER: {
                className: styles.variantTypeOther,
            },
        };
    }

    /**
     * Gets the display value.
     */
    public static getDisplayValue(data: Mutation[]): string {
        return VariantTypeColumnFormatter.getTextValue(data);
    }

    /**
     * Gets the Text Value.
     */
    public static getTextValue(data: Mutation[]): string {
        let textValue: string = '';
        const dataValue = VariantTypeColumnFormatter.getData(data);

        if (dataValue) {
            textValue = dataValue.toString().toUpperCase();
        }

        return textValue;
    }

    /**
     * Gets the actual data.
     */
    public static getData(data: Mutation[]) {
        if (data.length > 0) {
            return data[0].variantType;
        } else {
            return null;
        }
    }

    /**
     * Gets the Map Entry.
     */
    public static getMapEntry(data: Mutation[]) {
        const variantType = VariantTypeColumnFormatter.getData(data);

        if (variantType) {
            return VariantTypeColumnFormatter.MAIN_VARIANT_TYPE_MAP[
                variantType.toUpperCase()
            ];
        } else {
            return undefined;
        }
    }

    /**
     * Gets the associated tooltip.
     */
    public static getTooltip(data: Mutation[]) {
        const value:
            | ICategoricalColumn
            | undefined = VariantTypeColumnFormatter.getMapEntry(data);
        if (value && value.toolTip) {
            return value.toolTip;
        } else {
            return undefined;
        }
    }

    /**
     * Gets the CSS Class Name.
     */
    public static getClassName(data: Mutation[]): string {
        const value:
            | ICategoricalColumn
            | undefined = VariantTypeColumnFormatter.getMapEntry(data);

        if (value && value.className) {
            return value.className;
        }
        // for unmapped values, use the "OTHER" style
        else {
            return VariantTypeColumnFormatter.MAIN_VARIANT_TYPE_MAP['OTHER']
                .className;
        }
    }

    public static renderFunction(data: Mutation[]) {
        // use text for all purposes (display, sort, filter)
        const text: string = VariantTypeColumnFormatter.getDisplayValue(data);
        const className: string = VariantTypeColumnFormatter.getClassName(data);

        // extract the tooltip, if available
        const toolTip = VariantTypeColumnFormatter.getTooltip(data);
        let content = <span className={className}>{text}</span>;

        if (toolTip) {
            content = createToolTip(content, toolTip);
        }
        return content;
    }
}
