import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import SampleManager from 'pages/patientView/SampleManager';
import { MutationTableColumnType } from '../../MutationTable';
import CancerCellFractionElement from 'shared/components/mutationTable/column/cancerCellFraction/CancerCellFractionElement';
import {
    getClonalValue,
    ClonalValue,
} from 'shared/components/mutationTable/column/clonal/ClonalColumnFormatter';

/**
 * @author Avery Wang
 */

export function getCancerCellFractionValue(mutation: Mutation): string {
    return hasASCNProperty(mutation, 'ccfExpectedCopies')
        ? mutation.alleleSpecificCopyNumber.ccfExpectedCopies.toFixed(2)
        : '';
}

export const getDefaultCancerCellFractionColumnDefinition = (
    sampleIds?: string[],
    sampleManager?: SampleManager | null
) => {
    return {
        name: MutationTableColumnType.CANCER_CELL_FRACTION,
        tooltip: <span>Cancer Cell Fraction</span>,
        render: (d: Mutation[]) =>
            CancerCellFractionColumnFormatter.renderFunction(
                d,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : [],
                sampleManager
            ),
        sortBy: (d: Mutation[]) => d.map(m => +getCancerCellFractionValue(m)),
        download: (d: Mutation[]) =>
            CancerCellFractionColumnFormatter.getCancerCellFractionDownload(d),
        visible: false,
    };
};

export default class CancerCellFractionColumnFormatter {
    /* Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}"CancerCellFraction" text value
     */
    public static renderFunction(
        data: Mutation[],
        sampleIds: string[],
        sampleManager?: SampleManager | null
    ) {
        const sampleToCCFValue: { [key: string]: string } = {};
        const sampleToClonalValue: { [key: string]: string } = {};
        for (const mutation of data) {
            sampleToCCFValue[mutation.sampleId] = hasASCNProperty(
                mutation,
                'ccfExpectedCopies'
            )
                ? mutation.alleleSpecificCopyNumber.ccfExpectedCopies.toFixed(2)
                : 'NA';
            sampleToClonalValue[mutation.sampleId] = getClonalValue(mutation);
        }
        return (
            <span data-test="ccf-cell">
                <CancerCellFractionElement
                    sampleIds={sampleIds}
                    sampleToClonalValue={sampleToClonalValue}
                    sampleToCCFValue={sampleToCCFValue}
                    sampleManager={sampleManager}
                />
            </span>
        );
    }

    public static getCancerCellFractionDownload(
        mutations: Mutation[]
    ): string[] {
        return mutations.map(mutation => getCancerCellFractionValue(mutation));
    }
}
