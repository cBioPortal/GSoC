import {
    defaultSortMethod,
    formatFrequencyValue,
    formatNumberValueInSignificantDigits,
    ISignalTumorTypeDecomposition,
} from 'cbioportal-utils';
import _ from 'lodash';
import React from 'react';
import DefaultTooltip from '../defaultTooltip/DefaultTooltip';
import FrequencyCell from './FrequencyCell';

export enum FrequencyTableColumnEnum {
    TUMOR_TYPE = 'tumorType',
    MUTATION_STATUS = 'mutationStatus',
    SAMPLE_COUNT = 'tumorTypeCount',
    VARIANT_COUNT = 'variantCount',
    PREVALENCE_FREQUENCY = 'frequency',
    BIALLELIC_RATIO = 'biallelicRatio',
    MEDIAN_AGE_AT_DX = 'ageAtDx',
    MEDIAN_TMB = 'tmb',
    MSI_SCORE = 'msiScore',
    MEDIAN_HRD_LST = 'lst',
    MEDIAN_HRD_NTELOMERIC_AI = 'ntelomericAi',
    MEDIAN_HRD_FRACTION_LOH = 'fractionLoh',
    OVERALL_NUMBER_OF_GERMLINE_HOMOZYGOUS = 'overallNumberOfGermlineHomozygous',
    NUMBER_OF_GERMLINE_HOMOZYGOUS = 'numberOfGermlineHomozygous',
}

export function columnHeader(
    headerContent: string | JSX.Element,
    overlay: JSX.Element | string
) {
    return (
        <DefaultTooltip
            mouseEnterDelay={0.5}
            placement="top"
            overlay={overlay}
            destroyTooltipOnHide={true}
        >
            <>{headerContent}</>
        </DefaultTooltip>
    );
}

export const FREQUENCY_TABLE_HEADER_COMPONENT: { [id: string]: JSX.Element } = {
    [FrequencyTableColumnEnum.TUMOR_TYPE]: columnHeader(
        <strong className="table-header">Cancer Type</strong>,
        'Main cancer type based on OncoTree'
    ),
    [FrequencyTableColumnEnum.MUTATION_STATUS]: columnHeader(
        <strong className="table-header">Mutation Status</strong>,
        'Somatic, Pathogenic Germline, or Rare Benign/VUS Germline'
    ),
    [FrequencyTableColumnEnum.SAMPLE_COUNT]: columnHeader(
        <strong className="table-header"># Patients</strong>,
        'Total number of patients'
    ),
    [FrequencyTableColumnEnum.VARIANT_COUNT]: columnHeader(
        <strong className="table-header"># Carriers</strong>,
        'Total number of patients harboring a germline pathogenic variant'
    ),
    [FrequencyTableColumnEnum.NUMBER_OF_GERMLINE_HOMOZYGOUS]: columnHeader(
        <strong className="table-header"># Germline Homozygous</strong>,
        'Number of germline homozygous'
    ),
    [FrequencyTableColumnEnum.PREVALENCE_FREQUENCY]: columnHeader(
        <strong className="table-header">% Prevalence</strong>,
        '# Carriers / # Patients'
    ),
    [FrequencyTableColumnEnum.BIALLELIC_RATIO]: columnHeader(
        <strong className="table-header">% Biallelic</strong>,
        'Fraction of carriers with somatic biallelic inactivation in the corresponding tumor sample.'
    ),
    [FrequencyTableColumnEnum.MEDIAN_AGE_AT_DX]: columnHeader(
        <strong className="table-header">Median Age at Dx</strong>,
        'Median age at diagnosis of carriers'
    ),
    [FrequencyTableColumnEnum.MEDIAN_TMB]: columnHeader(
        <strong className="table-header">Median TMB</strong>,
        'Median tumor mutational burden (TMB)'
    ),
    [FrequencyTableColumnEnum.MSI_SCORE]: columnHeader(
        <strong className="table-header">MSI Score</strong>,
        'Median microsatellite instability (MSI) score determined by MSIsensor'
    ),
    [FrequencyTableColumnEnum.MEDIAN_HRD_LST]: columnHeader(
        <strong className="table-header">Median HRD LST</strong>,
        'Median of LST (large-scale state transitions) scores for carriers (a measure of # of breakpoints between large copy-number segments)'
    ),
    [FrequencyTableColumnEnum.MEDIAN_HRD_NTELOMERIC_AI]: columnHeader(
        <strong className="table-header">Median HRD ntelomeric AI</strong>,
        'Median of HRD-TAI scores for carriers (a measure of allelic imbalance at telomeres)'
    ),
    [FrequencyTableColumnEnum.MEDIAN_HRD_FRACTION_LOH]: columnHeader(
        <strong className="table-header">Median HRD Fraction LOH %</strong>,
        'Median of HRD-LOH scores for carriers (a measure of large LOH regions in the genome)'
    ),
};

export const FREQUENCY_COLUMNS_DEFINITION = {
    [FrequencyTableColumnEnum.TUMOR_TYPE]: {
        id: FrequencyTableColumnEnum.TUMOR_TYPE,
        Cell: renderTextData,
        Header:
            FREQUENCY_TABLE_HEADER_COMPONENT[
                FrequencyTableColumnEnum.TUMOR_TYPE
            ],
        accessor: FrequencyTableColumnEnum.TUMOR_TYPE,
        minWidth: 180,
        Footer: <strong>Total</strong>,
    },
    [FrequencyTableColumnEnum.MUTATION_STATUS]: {
        id: FrequencyTableColumnEnum.MUTATION_STATUS,
        Cell: renderTextData,
        Header:
            FREQUENCY_TABLE_HEADER_COMPONENT[
                FrequencyTableColumnEnum.MUTATION_STATUS
            ],
        accessor: FrequencyTableColumnEnum.MUTATION_STATUS,
        minWidth: 130,
    },
    [FrequencyTableColumnEnum.SAMPLE_COUNT]: {
        id: FrequencyTableColumnEnum.SAMPLE_COUNT,
        Cell: renderNumber,
        Header:
            FREQUENCY_TABLE_HEADER_COMPONENT[
                FrequencyTableColumnEnum.SAMPLE_COUNT
            ],
        accessor: FrequencyTableColumnEnum.SAMPLE_COUNT,
        minWidth: 90,
        Footer: (col: any) => {
            const tumorTypeCount = col.data.reduce(
                (sum: any, row: ISignalTumorTypeDecomposition) =>
                    sum + row.tumorTypeCount,
                0
            );
            return <strong className="pull-right">{tumorTypeCount}</strong>;
        },
    },
    [FrequencyTableColumnEnum.VARIANT_COUNT]: {
        id: FrequencyTableColumnEnum.VARIANT_COUNT,
        Cell: renderNumber,
        Header:
            FREQUENCY_TABLE_HEADER_COMPONENT[
                FrequencyTableColumnEnum.VARIANT_COUNT
            ],
        accessor: FrequencyTableColumnEnum.VARIANT_COUNT,
        minWidth: 90,
        Footer: (col: any) => {
            const variantCount = col.data.reduce(
                (sum: any, row: ISignalTumorTypeDecomposition) =>
                    sum + row.variantCount,
                0
            );
            return <strong className="pull-right">{variantCount}</strong>;
        },
    },
    [FrequencyTableColumnEnum.NUMBER_OF_GERMLINE_HOMOZYGOUS]: {
        id: FrequencyTableColumnEnum.NUMBER_OF_GERMLINE_HOMOZYGOUS,
        Cell: renderNumber,
        Header:
            FREQUENCY_TABLE_HEADER_COMPONENT[
                FrequencyTableColumnEnum.NUMBER_OF_GERMLINE_HOMOZYGOUS
            ],
        accessor: FrequencyTableColumnEnum.NUMBER_OF_GERMLINE_HOMOZYGOUS,
        sortMethod: defaultSortMethod,
        minWidth: 100,
        Footer: (col: any) => {
            const numberOfGermlineHomozygous = col.data.reduce(
                (sum: any, row: ISignalTumorTypeDecomposition) =>
                    sum + row.numberOfGermlineHomozygous,
                0
            );
            return (
                <strong className="pull-right">
                    {numberOfGermlineHomozygous}
                </strong>
            );
        },
    },
    [FrequencyTableColumnEnum.PREVALENCE_FREQUENCY]: {
        id: FrequencyTableColumnEnum.PREVALENCE_FREQUENCY,
        Cell: (cell: any) => {
            const styles = {
                fontWeight: cell.value > 0 ? 'bold' : 'normal',
            };
            return renderPercentage(cell, styles);
        },
        Header:
            FREQUENCY_TABLE_HEADER_COMPONENT[
                FrequencyTableColumnEnum.PREVALENCE_FREQUENCY
            ],
        accessor: FrequencyTableColumnEnum.PREVALENCE_FREQUENCY,
        sortMethod: defaultSortMethod,
        minWidth: 110,
        Footer: (col: any) => {
            const tumorTypeCount = col.data.reduce(
                (sum: any, row: ISignalTumorTypeDecomposition) =>
                    sum + row.tumorTypeCount,
                0
            );
            const variantCount = col.data.reduce(
                (sum: any, row: ISignalTumorTypeDecomposition) =>
                    sum + row.variantCount,
                0
            );
            const percent =
                formatNumberValueInSignificantDigits(
                    (variantCount * 100) / tumorTypeCount,
                    2
                ) || 0;
            return <strong className="pull-right">{percent}</strong>;
        },
    },
    [FrequencyTableColumnEnum.BIALLELIC_RATIO]: {
        id: FrequencyTableColumnEnum.BIALLELIC_RATIO,
        Cell: renderPercentage,
        Header:
            FREQUENCY_TABLE_HEADER_COMPONENT[
                FrequencyTableColumnEnum.BIALLELIC_RATIO
            ],
        accessor: FrequencyTableColumnEnum.BIALLELIC_RATIO,
        sortMethod: defaultSortMethod,
        minWidth: 90,
        Footer: (col: any) => {
            const biallelicTumorCount = col.data.reduce(
                (sum: any, row: any) => sum + row._original.biallelicTumorCount,
                0
            );
            const qcPassTumorCount = col.data.reduce(
                (sum: any, row: any) => sum + row._original.qcPassTumorCount,
                0
            );
            const percent =
                formatNumberValueInSignificantDigits(
                    (biallelicTumorCount * 100) / qcPassTumorCount,
                    2
                ) || 0;
            return <strong className="pull-right">{percent}</strong>;
        },
    },
    [FrequencyTableColumnEnum.MEDIAN_AGE_AT_DX]: {
        id: FrequencyTableColumnEnum.MEDIAN_AGE_AT_DX,
        Cell: renderNumber,
        Header:
            FREQUENCY_TABLE_HEADER_COMPONENT[
                FrequencyTableColumnEnum.MEDIAN_AGE_AT_DX
            ],
        sortMethod: defaultSortMethod,
        accessor: FrequencyTableColumnEnum.MEDIAN_AGE_AT_DX,
        minWidth: 90,
    },
    [FrequencyTableColumnEnum.MEDIAN_TMB]: {
        id: FrequencyTableColumnEnum.MEDIAN_TMB,
        Cell: (column: any) => {
            return renderNumber(column, 1);
        },
        Header:
            FREQUENCY_TABLE_HEADER_COMPONENT[
                FrequencyTableColumnEnum.MEDIAN_TMB
            ],
        sortMethod: defaultSortMethod,
        accessor: FrequencyTableColumnEnum.MEDIAN_TMB,
        minWidth: 90,
    },
    [FrequencyTableColumnEnum.MSI_SCORE]: {
        id: FrequencyTableColumnEnum.MSI_SCORE,
        Cell: renderNumber,
        Header:
            FREQUENCY_TABLE_HEADER_COMPONENT[
                FrequencyTableColumnEnum.MSI_SCORE
            ],
        sortMethod: defaultSortMethod,
        accessor: FrequencyTableColumnEnum.MSI_SCORE,
        minWidth: 80,
    },
    [FrequencyTableColumnEnum.MEDIAN_HRD_LST]: {
        id: FrequencyTableColumnEnum.MEDIAN_HRD_LST,
        Cell: renderNumber,
        Header:
            FREQUENCY_TABLE_HEADER_COMPONENT[
                FrequencyTableColumnEnum.MEDIAN_HRD_LST
            ],
        sortMethod: defaultSortMethod,
        accessor: FrequencyTableColumnEnum.MEDIAN_HRD_LST,
        minWidth: 90,
    },
    [FrequencyTableColumnEnum.MEDIAN_HRD_NTELOMERIC_AI]: {
        id: FrequencyTableColumnEnum.MEDIAN_HRD_NTELOMERIC_AI,
        Cell: renderNumber,
        Header:
            FREQUENCY_TABLE_HEADER_COMPONENT[
                FrequencyTableColumnEnum.MEDIAN_HRD_NTELOMERIC_AI
            ],
        sortMethod: defaultSortMethod,
        accessor: FrequencyTableColumnEnum.MEDIAN_HRD_NTELOMERIC_AI,
        minWidth: 100,
    },
    [FrequencyTableColumnEnum.MEDIAN_HRD_FRACTION_LOH]: {
        id: FrequencyTableColumnEnum.MEDIAN_HRD_FRACTION_LOH,
        Cell: renderFrequency,
        Header:
            FREQUENCY_TABLE_HEADER_COMPONENT[
                FrequencyTableColumnEnum.MEDIAN_HRD_FRACTION_LOH
            ],
        sortMethod: defaultSortMethod,
        accessor: FrequencyTableColumnEnum.MEDIAN_HRD_FRACTION_LOH,
        minWidth: 120,
    },
};

export function renderPercentage(cellProps: any, styles?: any) {
    return <FrequencyCell style={styles} frequency={cellProps.value} />;
}

export function renderNumber(cellProps: any, fractionDigits?: number) {
    let displayValue;
    if (cellProps.value !== undefined && cellProps.value !== null) {
        if (fractionDigits) {
            displayValue = cellProps.value.toFixed(fractionDigits);
        } else {
            displayValue = cellProps.value;
        }
    } else {
        displayValue = '-';
    }
    return <span className="pull-right mr-1">{displayValue}</span>;
}

export function renderFrequency(cellProps: any) {
    const displayValue =
        cellProps.value === 0 ? 0 : formatFrequencyValue(cellProps.value);
    return <span className="pull-right mr-1">{displayValue}</span>;
}

export function renderTextData(cellProps: any) {
    return (
        <span className="pull-left ml-2">{_.upperFirst(cellProps.value)}</span>
    );
}
