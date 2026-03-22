import {
    SampleTreatmentRow,
    SampleTreatmentFilter,
    PatientTreatmentFilter,
    PatientTreatmentRow,
    PatientTreatment,
} from 'cbioportal-ts-api-client';
import { ChartMeta } from 'pages/studyView/StudyViewUtils';
import styles from 'pages/studyView/table/tables.module.scss';
import React from 'react';

export type Treatment =
    | SampleTreatmentRow
    | SampleTreatmentFilter
    | PatientTreatmentRow
    | PatientTreatmentFilter;

export function treatmentComparisonGroupName(
    cell: Treatment,
    ignoreTime?: boolean
) {
    if (
        (cell as SampleTreatmentFilter | SampleTreatmentRow).time !==
            undefined &&
        !ignoreTime
    ) {
        const castCell = cell as SampleTreatmentFilter | SampleTreatmentRow;
        return `${castCell.time}-${castCell.treatment}`;
    } else {
        return cell.treatment;
    }
}
export function treatmentUniqueKey(cell: Treatment, ignoreTime?: boolean) {
    if (
        (cell as SampleTreatmentFilter | SampleTreatmentRow).time !==
            undefined &&
        !ignoreTime
    ) {
        const castCell = cell as SampleTreatmentFilter | SampleTreatmentRow;
        return castCell.treatment + '::' + castCell.time;
    } else {
        return cell.treatment;
    }
}

export function toTreatmentFilter(
    uniqueKey: string,
    meta: ChartMeta
): SampleTreatmentFilter | PatientTreatmentFilter {
    if (meta.uniqueKey.startsWith('SAMPLE')) {
        return toSampleTreatmentFilter(uniqueKey);
    } else {
        return toPatientTreatmentFilter(uniqueKey);
    }
}

function toSampleTreatmentFilter(uniqueKey: string): SampleTreatmentFilter {
    const split = uniqueKey.split('::');
    return {
        treatment: split[0],
        time: split[1] as 'Pre' | 'Post',
    };
}

function toPatientTreatmentFilter(uniqueKey: string): PatientTreatmentFilter {
    const split = uniqueKey.split('::');
    return {
        treatment: split[0],
    };
}

export enum TreatmentTableType {
    SAMPLE = 'SAMPLE_TREATMENTS',
    PATIENT = 'PATIENT_TREATMENTS',
}

export const TreatmentGenericColumnHeader = class GenericColumnHeader extends React.Component<
    { margin: number; headerName: string },
    {}
> {
    render() {
        return (
            <div
                style={{ marginLeft: this.props.margin }}
                className={styles.displayFlex}
            >
                {this.props.headerName}
            </div>
        );
    }
};

export const TreatmentColumnCell = class TreatmentColumnCell extends React.Component<
    { row: PatientTreatment | SampleTreatmentRow },
    {}
> {
    render() {
        return <div>{this.props.row.treatment}</div>;
    }
};

export function filterTreatmentCell(
    cell: PatientTreatment | SampleTreatmentRow,
    filter: string
): boolean {
    return cell.treatment.toUpperCase().includes(filter.toUpperCase());
}

/**
 * toNumericValue gives a string an approximate value between 0 - 1.
 * This doesn't have to be perfect, I just need it for sorting
 * @param words
 */
export function toNumericValue(words: string) {
    return words
        .toLocaleLowerCase()
        .split('')
        .map(c => Math.min(c.charCodeAt(0), 127))
        .filter(num => !Number.isNaN(num))
        .reduce((acc, v, i) => {
            return acc + v / Math.pow(128, i + 1);
        }, 0);
}
