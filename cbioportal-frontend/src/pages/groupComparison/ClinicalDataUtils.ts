import { getServerConfig } from 'config/config';
import {
    PatientIdentifier,
    Sample,
    SampleIdentifier,
} from 'cbioportal-ts-api-client/dist';
import _ from 'lodash';
import {
    ComparisonGroup,
    getOverlappingPatients,
    getOverlappingSamples,
} from './GroupComparisonUtils';

const NA_VALUES_DELIMITER = '|';

export function getComparisonCategoricalNaValue(): string[] {
    const rawString = getServerConfig().comparison_categorical_na_values;
    const naValues = rawString.split(NA_VALUES_DELIMITER);
    return naValues;
}

export function getOverlappingPatientsMap(
    overlappingPatients: PatientIdentifier[]
): { [studyId: string]: Set<string> } {
    return _.chain(overlappingPatients)
        .groupBy(p => p.studyId)
        .mapValues(arr => new Set(arr.map(p => p.patientId)))
        .value();
}

export function getOverlappingSamplesMap(
    overlappingSamples: SampleIdentifier[]
): { [studyId: string]: Set<string> } {
    return _.chain(overlappingSamples)
        .groupBy(s => s.studyId)
        .mapValues(arr => new Set(arr.map(p => p.sampleId)))
        .value();
}

export function filterSampleList(
    allSamples: Sample[],
    groups: ComparisonGroup[]
): Sample[] {
    const overlappingPatientsMap = getOverlappingPatientsMap(
        getOverlappingPatients(groups)
    );
    const overlappingSamplesMap = getOverlappingSamplesMap(
        getOverlappingSamples(groups)
    );
    return allSamples.filter(
        sample =>
            !overlappingPatientsMap[sample.studyId]?.has(sample.patientId) &&
            !overlappingSamplesMap[sample.studyId]?.has(sample.sampleId)
    );
}
