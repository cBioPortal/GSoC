import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import SampleManager from 'pages/patientView/SampleManager';
import { MutationTableColumnType } from '../../MutationTable';
import ExpectedAltCopiesElement from 'shared/components/mutationTable/column/expectedAltCopies/ExpectedAltCopiesElement';
import { RESPONSE_VALUE_NA } from 'shared/constants';

/**
 * @author Avery Wang
 */

function getSampleIdToExpectedAltCopiesMap(
    data: Mutation[]
): { [key: string]: string } {
    const sampleToValue: { [key: string]: string } = {};
    for (const mutation of data) {
        const value: string = getExpectedAltCopiesValue(mutation);
        if (value.length > 0) {
            sampleToValue[mutation.sampleId] = value;
        }
    }
    return sampleToValue;
}

export function getDisplayValueAsString(
    data: Mutation[],
    sampleIds: string[]
): string {
    const displayValuesBySample: {
        [key: string]: string;
    } = getSampleIdToExpectedAltCopiesMap(data);
    const sampleIdsWithValues = sampleIds.filter(
        sampleId => displayValuesBySample[sampleId]
    );
    const displayValuesAsString = sampleIdsWithValues.map(
        (sampleId: string) => {
            return displayValuesBySample[sampleId];
        }
    );
    return displayValuesAsString.join('; ');
}

export function getExpectedAltCopiesValue(mutation: Mutation): string {
    return hasASCNProperty(mutation, 'totalCopyNumber') &&
        hasASCNProperty(mutation, 'expectedAltCopies')
        ? mutation.alleleSpecificCopyNumber.expectedAltCopies.toString() +
              '/' +
              mutation.alleleSpecificCopyNumber.totalCopyNumber.toString()
        : '';
}

export const getDefaultExpectedAltCopiesColumnDefinition = (
    sampleIds?: string[],
    sampleManager?: SampleManager | null
) => {
    return {
        name: MutationTableColumnType.EXPECTED_ALT_COPIES,
        tooltip: <span>Best Guess for Mutant Integer Cop #</span>,
        render: (d: Mutation[]) =>
            ExpectedAltCopiesColumnFormatter.renderFunction(
                d,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : [],
                sampleManager
            ),
        sortBy: (d: Mutation[]) =>
            getDisplayValueAsString(
                d,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : []
            ),
        download: (d: Mutation[]) =>
            ExpectedAltCopiesColumnFormatter.getExpectedAltCopiesDownload(d),
        visible: false,
    };
};

export default class ExpectedAltCopiesColumnFormatter {
    /* Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}"Clonal" text value
     */
    public static renderFunction(
        data: Mutation[],
        sampleIds: string[],
        sampleManager?: SampleManager | null
    ) {
        const sampleToTotalCopyNumber: { [key: string]: string } = {};
        const sampleToExpectedAltCopies: { [key: string]: string } = {};

        // only signify NA (no FACETS analysis done) if ASCN METHOD not set
        // else indicate indeterminte
        for (const mutation of data) {
            sampleToTotalCopyNumber[mutation.sampleId] = hasASCNProperty(
                mutation,
                'totalCopyNumber'
            )
                ? mutation.alleleSpecificCopyNumber.totalCopyNumber.toString()
                : hasASCNProperty(mutation, 'ascnMethod')
                ? 'INDETERMINATE'
                : RESPONSE_VALUE_NA;
            sampleToExpectedAltCopies[mutation.sampleId] = hasASCNProperty(
                mutation,
                'expectedAltCopies'
            )
                ? mutation.alleleSpecificCopyNumber.expectedAltCopies.toString()
                : hasASCNProperty(mutation, 'ascnMethod')
                ? 'INDETERMINATE'
                : RESPONSE_VALUE_NA;
        }

        return (
            <span data-test="eac-cell">
                {sampleIds.map((sampleId: string, index: number) => {
                    return (
                        <span
                            key={sampleId}
                            style={index === 0 ? undefined : { marginLeft: 5 }}
                        >
                            <ExpectedAltCopiesElement
                                sampleId={sampleId}
                                totalCopyNumberValue={
                                    sampleToTotalCopyNumber[sampleId]
                                        ? sampleToTotalCopyNumber[sampleId]
                                        : 'NA'
                                }
                                expectedAltCopiesValue={
                                    sampleToExpectedAltCopies[sampleId]
                                        ? sampleToExpectedAltCopies[sampleId]
                                        : 'NA'
                                }
                                sampleManager={sampleManager}
                            />
                        </span>
                    );
                })}
            </span>
        );
    }

    public static getExpectedAltCopiesDownload(
        mutations: Mutation[]
    ): string[] {
        return mutations.map(mutation => getExpectedAltCopiesValue(mutation));
    }
}
