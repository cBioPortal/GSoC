import * as React from 'react';
import { SampleIdentifier, Patient, Sample } from 'cbioportal-ts-api-client';
import _ from 'lodash';

interface IPatientSampleSummaryProps {
    samples: Sample[] | SampleIdentifier[];
    patients: Patient[] | string[];
}

export const PatientSampleSummary: React.FC<IPatientSampleSummaryProps> = ({
    samples,
    patients,
}: IPatientSampleSummaryProps) => {
    if (samples.length !== patients.length) {
        const patientUnits = patients.length === 1 ? 'patient' : 'patients';
        const sampleUnits = samples.length === 1 ? 'sample' : 'samples';
        return (
            <span>
                <strong>{samples.length}</strong> {sampleUnits} /{' '}
                <strong>{patients.length}</strong> {patientUnits}
            </span>
        );
    } else {
        const units =
            samples.length === 1 ? 'sample/patient' : 'samples/patients';
        return (
            <span>
                <strong>{samples.length}</strong> {units}
            </span>
        );
    }
};
