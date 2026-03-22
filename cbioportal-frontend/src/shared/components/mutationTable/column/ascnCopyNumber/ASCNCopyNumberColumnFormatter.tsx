import * as React from 'react';
import _ from 'lodash';
import { Mutation, ClinicalData } from 'cbioportal-ts-api-client';
import { hasASCNProperty } from 'shared/lib/MutationUtils';
import SampleManager from 'pages/patientView/SampleManager';
import { MutationTableColumnType } from '../../MutationTable';
import ASCNCopyNumberElement from 'shared/components/mutationTable/column/ascnCopyNumber/ASCNCopyNumberElement';
import { ASCNCopyNumberValueEnum } from 'shared/components/mutationTable/column/ascnCopyNumber/ASCNCopyNumberElement';
import { ASCN_BLACK } from 'shared/lib/Colors';
import { getASCNCopyNumberColor } from 'shared/lib/ASCNUtils';
import {
    CLINICAL_ATTRIBUTE_ID_ENUM,
    MUTATION_DATA_FIELD_ENUM,
} from 'shared/constants';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { errorIcon, loaderIcon } from 'oncokb-frontend-commons';

/**
 * @author Avery Wang
 */

// gets value displayed in table cell - "NA" if missing attributes needed for calculation
function getAscnCopyNumberData(
    mutation: Mutation,
    sampleIdToClinicalDataMap:
        | { [sampleId: string]: ClinicalData[] }
        | undefined
) {
    return hasASCNProperty(
        mutation,
        MUTATION_DATA_FIELD_ENUM.ASCN_INTEGER_COPY_NUMBER
    )
        ? mutation.alleleSpecificCopyNumber.ascnIntegerCopyNumber
        : ASCNCopyNumberValueEnum.NA;
}

// sort by total copy number (since that is the number displayed in the icon
function getAllTotalCopyNumberForMutation(
    data: Mutation[],
    sampleIdToClinicalDataMap: { [key: string]: ClinicalData[] } | undefined,
    sampleIds: string[]
) {
    const sampleToCNA: { [key: string]: string } = _.chain(data)
        .keyBy('sampleId')
        .mapValues(function(mutation) {
            let ascnCopyNumberValue = getAscnCopyNumberData(
                mutation,
                sampleIdToClinicalDataMap
            );
            if (
                ascnCopyNumberValue !== ASCNCopyNumberValueEnum.NA &&
                hasASCNProperty(mutation, 'totalCopyNumber') &&
                getWGD(sampleIdToClinicalDataMap, mutation.sampleId) !==
                    ASCNCopyNumberValueEnum.NA &&
                getASCNCopyNumberColor(ascnCopyNumberValue.toString()) !==
                    ASCN_BLACK
            ) {
                return mutation.alleleSpecificCopyNumber.totalCopyNumber.toString();
            }
            return ASCNCopyNumberValueEnum.NA;
        })
        .value();
    return sampleToCNA;
}

function getSortValue(
    data: Mutation[],
    sampleIdToClinicalDataMap:
        | MobxPromise<{ [key: string]: ClinicalData[] }>
        | undefined,
    sampleIds: string[]
) {
    const displayValuesBySample: {
        [key: string]: string;
    } = getAllTotalCopyNumberForMutation(
        data,
        sampleIdToClinicalDataMap !== undefined
            ? sampleIdToClinicalDataMap.result
            : undefined,
        sampleIds
    );
    const sampleIdsWithValues = sampleIds.filter(
        sampleId => displayValuesBySample[sampleId]
    );
    const displayValuesAsString = sampleIdsWithValues.map(
        (sampleId: string) => {
            return displayValuesBySample[sampleId];
        }
    );
    return displayValuesAsString.join(';');
}

export function getWGD(
    sampleIdToClinicalDataMap:
        | { [sampleId: string]: ClinicalData[] }
        | undefined,
    sampleId: string
) {
    let wgdData =
        sampleIdToClinicalDataMap && sampleId in sampleIdToClinicalDataMap
            ? sampleIdToClinicalDataMap[sampleId].find(
                  (cd: ClinicalData) =>
                      cd.clinicalAttributeId ===
                      CLINICAL_ATTRIBUTE_ID_ENUM.ASCN_WGD
              )
            : undefined;
    return wgdData !== undefined ? wgdData.value : ASCNCopyNumberValueEnum.NA;
}

export const getDefaultASCNCopyNumberColumnDefinition = (
    sampleIds?: string[],
    sampleIdToClinicalDataMap?:
        | MobxPromise<{ [sampleId: string]: ClinicalData[] }>
        | undefined,
    sampleManager?: SampleManager | null
) => {
    return {
        name: MutationTableColumnType.ASCN_COPY_NUM,
        render: (d: Mutation[]) =>
            ASCNCopyNumberColumnFormatter.renderFunction(
                d,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : [],
                sampleIdToClinicalDataMap,
                sampleManager
            ),
        sortBy: (d: Mutation[]) =>
            getSortValue(
                d,
                sampleIdToClinicalDataMap,
                sampleIds ? sampleIds : d.length > 0 ? [d[0].sampleId] : []
            ),
        visible: false,
    };
};

export default class ASCNCopyNumberColumnFormatter {
    /* Determines the display value by using the impact field.
     *
     * @param data  column formatter data
     * @returns {string}"Clonal" text value
     */
    public static renderFunction(
        data: Mutation[],
        sampleIds: string[],
        sampleIdToClinicalDataMap?:
            | MobxPromise<{ [sampleId: string]: ClinicalData[] }>
            | undefined,
        sampleManager?: SampleManager | null
    ) {
        const sampleToTotalCopyNumber: { [key: string]: string } = {};
        const sampleToMinorCopyNumber: { [key: string]: string } = {};
        const sampleToASCNCopyNumber: { [key: string]: string } = {};

        for (const mutation of data) {
            sampleToTotalCopyNumber[mutation.sampleId] = hasASCNProperty(
                mutation,
                'totalCopyNumber'
            )
                ? mutation.alleleSpecificCopyNumber.totalCopyNumber.toString()
                : hasASCNProperty(mutation, 'ascnMethod')
                ? ASCNCopyNumberValueEnum.INDETERMINATE
                : ASCNCopyNumberValueEnum.NA;
            sampleToMinorCopyNumber[mutation.sampleId] = hasASCNProperty(
                mutation,
                'minorCopyNumber'
            )
                ? mutation.alleleSpecificCopyNumber.minorCopyNumber.toString()
                : hasASCNProperty(mutation, 'ascnMethod')
                ? ASCNCopyNumberValueEnum.INDETERMINATE
                : ASCNCopyNumberValueEnum.NA;
            sampleToASCNCopyNumber[mutation.sampleId] = hasASCNProperty(
                mutation,
                MUTATION_DATA_FIELD_ENUM.ASCN_INTEGER_COPY_NUMBER
            )
                ? mutation.alleleSpecificCopyNumber.ascnIntegerCopyNumber.toString()
                : hasASCNProperty(mutation, 'ascnMethod')
                ? ASCNCopyNumberValueEnum.INDETERMINATE
                : ASCNCopyNumberValueEnum.NA;
        }
        if (
            sampleIdToClinicalDataMap === undefined ||
            sampleIdToClinicalDataMap.isError
        ) {
            return errorIcon('Error fetching data');
        } else if (sampleIdToClinicalDataMap.isComplete) {
            return (
                <span data-test="ascn-copy-number-cell">
                    {sampleIds.map((sampleId: string, index: number) => {
                        return (
                            <span
                                key={sampleId}
                                style={
                                    index === 0 ? undefined : { marginLeft: 5 }
                                }
                            >
                                <ASCNCopyNumberElement
                                    sampleId={sampleId}
                                    wgdValue={getWGD(
                                        sampleIdToClinicalDataMap.result,
                                        sampleId
                                    )}
                                    totalCopyNumberValue={
                                        sampleToTotalCopyNumber[sampleId]
                                            ? sampleToTotalCopyNumber[sampleId]
                                            : ASCNCopyNumberValueEnum.NA
                                    }
                                    minorCopyNumberValue={
                                        sampleToMinorCopyNumber[sampleId]
                                            ? sampleToMinorCopyNumber[sampleId]
                                            : ASCNCopyNumberValueEnum.NA
                                    }
                                    ascnCopyNumberValue={
                                        sampleToASCNCopyNumber[sampleId]
                                            ? sampleToASCNCopyNumber[sampleId]
                                            : ASCNCopyNumberValueEnum.NA
                                    }
                                    sampleManager={sampleManager}
                                />
                            </span>
                        );
                    })}
                </span>
            );
        } else {
            return loaderIcon('pull-left');
        }
    }
}
