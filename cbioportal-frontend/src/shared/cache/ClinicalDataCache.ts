import MobxPromiseCache from '../lib/MobxPromiseCache';
import {
    CancerStudy,
    ClinicalAttribute,
    ClinicalData,
    MolecularProfile,
    MutationSpectrumFilter,
    Patient,
    Sample,
} from 'cbioportal-ts-api-client';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { ExtendedClinicalAttribute } from '../../pages/resultsView/ResultsViewPageStoreUtils';
import { CoverageInformation } from '../lib/GenePanelUtils';
import _ from 'lodash';
import client from '../api/cbioportalClientInstance';
import internalClient from '../api/cbioportalInternalClientInstance';
import ComplexKeySet from '../lib/complexKeyDataStructures/ComplexKeySet';
import { hexToRGBA } from '../lib/Colors';
import {
    getClinicalAttributeColoring,
    OncoprintClinicalData,
} from './ClinicalDataCacheUtils';

export enum SpecialAttribute {
    MutationSpectrum = 'NO_CONTEXT_MUTATION_SIGNATURE',
    StudyOfOrigin = 'CANCER_STUDY',
    ProfiledInPrefix = 'PROFILED_IN',
    ComparisonGroupPrefix = 'IN_COMPARISON_GROUP',
    NumSamplesPerPatient = 'NUM_SAMPLES_PER_PATIENT',
}

export const MUTATION_SPECTRUM_CATEGORIES = [
    'C>A',
    'C>G',
    'C>T',
    'T>A',
    'T>C',
    'T>G',
];

export const MUTATION_SPECTRUM_FILLS = [
    '#3D6EB1',
    '#8EBFDC',
    '#DFF1F8',
    '#FCE08E',
    '#F78F5E',
    '#D62B23',
].map(hexToRGBA);

const locallyComputedSpecialAttributes = [
    SpecialAttribute.StudyOfOrigin,
    SpecialAttribute.NumSamplesPerPatient,
];

export function clinicalAttributeIsPROFILEDIN(attribute: {
    clinicalAttributeId: string | SpecialAttribute;
}) {
    return attribute.clinicalAttributeId.startsWith(
        SpecialAttribute.ProfiledInPrefix
    );
}

export function clinicalAttributeIsINCOMPARISONGROUP(attribute: {
    clinicalAttributeId: string | SpecialAttribute;
}) {
    return attribute.clinicalAttributeId.startsWith(
        SpecialAttribute.ComparisonGroupPrefix
    );
}

function clinicalAttributeisCustomChart(
    attribute: {
        clinicalAttributeId: string;
    },
    customCharts: { clinicalAttributeId: string }[]
) {
    return customCharts.find(
        c => c.clinicalAttributeId === attribute.clinicalAttributeId
    );
}

export function clinicalAttributeIsLocallyComputed(attribute: {
    clinicalAttributeId: string | SpecialAttribute;
}) {
    return (
        clinicalAttributeIsPROFILEDIN(attribute) ||
        clinicalAttributeIsINCOMPARISONGROUP(attribute) ||
        locallyComputedSpecialAttributes.indexOf(
            attribute.clinicalAttributeId as any
        ) > -1
    );
}

export type ClinicalDataCacheEntry = {
    data: OncoprintClinicalData;
    // Compute colors here so that we can use the same color
    //  scheme for a clinical attribute throughout the portal,
    //  e.g. in oncoprint and plots tab.
    categoryToColor?: { [value: string]: string };
    numericalValueToColor?: (x: number) => string;
    logScaleNumericalValueToColor?: (x: number) => string;
    numericalValueRange?: [number, number];
};

function makeComparisonGroupData(
    attribute: ExtendedClinicalAttribute,
    samples: Sample[]
): ClinicalData[] {
    const ret = [];
    const samplesInGroup = new ComplexKeySet();
    for (const study of attribute.comparisonGroup!.data.studies) {
        const studyId = study.id;
        for (const sampleId of study.samples) {
            samplesInGroup.add({ studyId, sampleId });
        }
    }
    for (const sample of samples) {
        ret.push({
            clinicalAttribute: attribute as ClinicalAttribute,
            clinicalAttributeId: attribute.clinicalAttributeId,
            patientAttribute: attribute.patientAttribute,
            patientId: sample.patientId,
            sampleId: sample.sampleId,
            studyId: sample.studyId,
            uniquePatientKey: sample.uniquePatientKey,
            uniqueSampleKey: sample.uniqueSampleKey,
            value: samplesInGroup.has({
                studyId: sample.studyId,
                sampleId: sample.sampleId,
            })
                ? 'Yes'
                : 'No',
        });
    }
    return ret;
}

function makeProfiledData(
    attribute: ExtendedClinicalAttribute,
    samples: Sample[],
    coverageInformation: CoverageInformation
): ClinicalData[] {
    const molecularProfileIds = attribute.molecularProfileIds!;
    const ret = [];
    for (const sample of samples) {
        const coverageInfo =
            coverageInformation.samples[sample.uniqueSampleKey];
        if (!coverageInfo) {
            continue;
        }
        const allCoverage: { molecularProfileId: string }[] = (_.flatten(
            _.values(coverageInfo.byGene)
        ) as { molecularProfileId: string }[]).concat(coverageInfo.allGenes);
        const coveredMolecularProfiles = _.keyBy(
            allCoverage,
            'molecularProfileId'
        );
        const profiled = _.some(
            molecularProfileIds,
            molecularProfileId => molecularProfileId in coveredMolecularProfiles
        );
        if (profiled) {
            ret.push({
                clinicalAttribute: attribute as ClinicalAttribute,
                clinicalAttributeId: attribute.clinicalAttributeId,
                patientId: sample.patientId,
                patientAttribute: attribute.patientAttribute,
                sampleId: sample.sampleId,
                studyId: sample.studyId,
                uniquePatientKey: sample.uniquePatientKey,
                uniqueSampleKey: sample.uniqueSampleKey,
                value: 'Yes',
            });
        }
    }
    return ret;
}

async function fetch(
    attribute: ExtendedClinicalAttribute,
    samples: Sample[],
    patients: Pick<Patient, 'uniquePatientKey' | 'patientId' | 'studyId'>[],
    studyToMutationMolecularProfile: { [studyId: string]: MolecularProfile },
    studyIdToStudy: { [studyId: string]: CancerStudy },
    coverageInformation: CoverageInformation,
    customChartClinicalAttributes: ExtendedClinicalAttribute[]
): Promise<OncoprintClinicalData> {
    let ret: OncoprintClinicalData;
    let studyToSamples: { [studyId: string]: Sample[] };
    switch (attribute.clinicalAttributeId) {
        case SpecialAttribute.MutationSpectrum:
            studyToSamples = _.groupBy(samples, sample => sample.studyId);
            ret = _.flatten(
                await Promise.all(
                    Object.keys(studyToMutationMolecularProfile).map(
                        studyId => {
                            const samplesInStudy = studyToSamples[studyId];
                            if (samplesInStudy.length) {
                                return internalClient.fetchMutationSpectrumsUsingPOST(
                                    {
                                        molecularProfileId:
                                            studyToMutationMolecularProfile[
                                                studyId
                                            ].molecularProfileId,
                                        mutationSpectrumFilter: {
                                            sampleIds: samplesInStudy.map(
                                                s => s.sampleId
                                            ),
                                        } as MutationSpectrumFilter,
                                    }
                                );
                            } else {
                                return Promise.resolve([]);
                            }
                        }
                    )
                )
            );
            break;
        case SpecialAttribute.StudyOfOrigin:
            ret = samples.map(
                sample =>
                    ({
                        clinicalAttribute: attribute,
                        clinicalAttributeId: attribute.clinicalAttributeId,
                        patientId: sample.patientId,
                        sampleId: sample.sampleId,
                        studyId: sample.studyId,
                        uniquePatientKey: sample.uniquePatientKey,
                        uniqueSampleKey: sample.uniqueSampleKey,
                        value: studyIdToStudy[sample.studyId].name,
                    } as ClinicalData)
            );
            break;
        case SpecialAttribute.NumSamplesPerPatient:
            const patientToSamples = _.groupBy(samples, 'uniquePatientKey');
            const patientKeyToPatient = _.keyBy(patients, 'uniquePatientKey');
            ret = _.map(patientToSamples, (samples, patientKey) => {
                const patient = patientKeyToPatient[patientKey];
                return ({
                    clinicalAttribute: attribute,
                    clinicalAttributeId: attribute.clinicalAttributeId,
                    patientId: patient.patientId,
                    uniquePatientKey: patientKey,
                    studyId: patient.studyId,
                    value: samples.length,
                } as any) as ClinicalData;
            });
            break;
        default:
            if (clinicalAttributeIsPROFILEDIN(attribute)) {
                ret = makeProfiledData(attribute, samples, coverageInformation);
            } else if (clinicalAttributeIsINCOMPARISONGROUP(attribute)) {
                ret = makeComparisonGroupData(attribute, samples);
            } else if (
                clinicalAttributeisCustomChart(
                    attribute,
                    customChartClinicalAttributes
                )
            ) {
                ret = attribute.data!;
            } else {
                ret = await client.fetchClinicalDataUsingPOST({
                    clinicalDataType: attribute.patientAttribute
                        ? 'PATIENT'
                        : 'SAMPLE',
                    clinicalDataMultiStudyFilter: {
                        attributeIds: [attribute.clinicalAttributeId as string],
                        identifiers: attribute.patientAttribute
                            ? patients.map(p => ({
                                  entityId: p.patientId,
                                  studyId: p.studyId,
                              }))
                            : samples.map(s => ({
                                  entityId: s.sampleId,
                                  studyId: s.studyId,
                              })),
                    },
                });
            }
            break;
    }
    return ret;
}

function keyFn(q: ExtendedClinicalAttribute) {
    return `${q.clinicalAttributeId},${(q.molecularProfileIds || []).join(
        '-'
    )},${q.patientAttribute}`;
}

export class UnfilteredClinicalDataCache extends MobxPromiseCache<
    ExtendedClinicalAttribute,
    ClinicalDataCacheEntry
> {
    constructor(
        samplesPromise: MobxPromise<Sample[]>,
        patientsPromise: MobxPromise<
            Pick<Patient, 'uniquePatientKey' | 'patientId' | 'studyId'>[]
        >,
        studyToMutationMolecularProfilePromise: MobxPromise<{
            [studyId: string]: MolecularProfile;
        }>,
        studyIdToStudyPromise: MobxPromise<{ [studyId: string]: CancerStudy }>,
        coverageInformationPromise: MobxPromise<CoverageInformation>,
        customChartClinicalAttributes: MobxPromise<ExtendedClinicalAttribute[]>
    ) {
        super(
            q => ({
                await: () => [
                    samplesPromise,
                    patientsPromise,
                    studyToMutationMolecularProfilePromise,
                    studyIdToStudyPromise,
                    coverageInformationPromise,
                    customChartClinicalAttributes,
                ],
                invoke: async () => {
                    const data: OncoprintClinicalData = await fetch(
                        q,
                        samplesPromise.result!,
                        patientsPromise.result!,
                        studyToMutationMolecularProfilePromise.result!,
                        studyIdToStudyPromise.result!,
                        coverageInformationPromise.result!,
                        customChartClinicalAttributes.result!
                    );
                    const coloring = getClinicalAttributeColoring(data, q.datatype);
                    return {
                        data,
                        ...coloring,
                    };
                },
            }),
            keyFn
        );
    }
}

export default class ClinicalDataCache extends MobxPromiseCache<
    ExtendedClinicalAttribute,
    ClinicalDataCacheEntry
> {
    private unfilteredClinicalDataCache: UnfilteredClinicalDataCache;

    constructor(
        samplesPromise: MobxPromise<Sample[]>,
        patientsPromise: MobxPromise<
            Pick<Patient, 'uniquePatientKey' | 'patientId' | 'studyId'>[]
        >,
        studyToMutationMolecularProfilePromise: MobxPromise<{
            [studyId: string]: MolecularProfile;
        }>,
        studyIdToStudyPromise: MobxPromise<{ [studyId: string]: CancerStudy }>,
        coverageInformationPromise: MobxPromise<CoverageInformation>,
        filteredSampleKeyToSample: MobxPromise<{
            [uniqueSampleKey: string]: Sample;
        }>,
        filteredPatientKeyToPatient: MobxPromise<{
            [uniquePatientKey: string]: Patient;
        }>,
        customChartClinicalAttributes: MobxPromise<ExtendedClinicalAttribute[]>
    ) {
        const unfilteredClinicalDataCache = new UnfilteredClinicalDataCache(
            samplesPromise,
            patientsPromise,
            studyToMutationMolecularProfilePromise,
            studyIdToStudyPromise,
            coverageInformationPromise,
            customChartClinicalAttributes
        );
        super(
            q => ({
                await: () => [
                    unfilteredClinicalDataCache.get(q),
                    filteredSampleKeyToSample,
                    filteredPatientKeyToPatient,
                ],
                invoke: () => {
                    const { data, ...rest } = unfilteredClinicalDataCache.get(
                        q
                    ).result!;
                    if (q.patientAttribute) {
                        const patientKeyToPatient = filteredPatientKeyToPatient.result!;
                        return Promise.resolve(
                            // typescript having some issues, so had to do this typing
                            {
                                data: (data as {
                                    uniquePatientKey: string;
                                }[]).filter(
                                    d =>
                                        d.uniquePatientKey in
                                        patientKeyToPatient
                                ) as OncoprintClinicalData,
                                ...rest,
                            }
                        );
                    } else {
                        const sampleKeyToSample = filteredSampleKeyToSample.result!;
                        return Promise.resolve(
                            // typescript having some issues, so had to do this typing
                            {
                                data: (data as {
                                    uniqueSampleKey: string;
                                }[]).filter(
                                    (d: OncoprintClinicalData[0]) =>
                                        d.uniqueSampleKey in sampleKeyToSample
                                ) as OncoprintClinicalData,
                                ...rest,
                            }
                        );
                    }
                },
            }),
            keyFn
        );
        this.unfilteredClinicalDataCache = unfilteredClinicalDataCache;
    }
}
