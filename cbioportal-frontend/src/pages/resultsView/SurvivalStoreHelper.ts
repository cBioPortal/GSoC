import { Patient, ClinicalData } from 'cbioportal-ts-api-client';
import { PatientSurvival } from '../../shared/model/PatientSurvival';
import _ from 'lodash';
import { isNullSurvivalClinicalDataValue } from './survival/SurvivalUtil';

export function getPatientSurvivals(
    survivalClinicalDataGroupByUniquePatientKey: {
        [patientKey: string]: ClinicalData[];
    },
    targetUniquePatientKeys: string[],
    statusAttributeId: string,
    monthsAttributeId: string,
    statusFilter: (s: string) => boolean,
    entryMonthsByUniquePatientKey?: { [patientKey: string]: number }
): PatientSurvival[] {
    if (targetUniquePatientKeys) {
        return targetUniquePatientKeys.reduce(
            (patientSurvivals: PatientSurvival[], uniquePatientKey: string) => {
                const clinicalData =
                    survivalClinicalDataGroupByUniquePatientKey[
                        uniquePatientKey
                    ];
                if (clinicalData) {
                    const statusClinicalData = clinicalData.find(
                        c => c.clinicalAttributeId === statusAttributeId
                    );
                    const monthsClinicalData = clinicalData.find(
                        c => c.clinicalAttributeId === monthsAttributeId
                    );
                    // if entry months data is not available, we can assume all data is collected at the beginning
                    // So we can assume entryMonths is 0 by default
                    const entryMonths =
                        entryMonthsByUniquePatientKey?.[uniquePatientKey] || 0;
                    if (
                        statusClinicalData &&
                        monthsClinicalData &&
                        !isNullSurvivalClinicalDataValue(
                            statusClinicalData.value
                        ) &&
                        !isNullSurvivalClinicalDataValue(
                            monthsClinicalData.value
                        ) &&
                        !Number.isNaN(Number(monthsClinicalData.value)) &&
                        Number(monthsClinicalData.value) >= 0 &&
                        entryMonths <= parseFloat(monthsClinicalData.value)
                    ) {
                        patientSurvivals.push({
                            uniquePatientKey,
                            patientId: clinicalData[0].patientId,
                            studyId: clinicalData[0].studyId,
                            status: statusFilter(statusClinicalData.value),
                            months: parseFloat(monthsClinicalData.value),
                            entryMonths,
                        });
                    }
                }
                return patientSurvivals;
            },
            []
        );
    } else {
        return [];
    }
}

export function getClinicalDataOfPatientSurvivalStatus(
    survivalClinicalDataGroupByUniquePatientKey: {
        [patientKey: string]: ClinicalData[];
    },
    targetUniquePatientKeys: string[],
    statusAttributeId: string,
    monthsAttributeId: string
): ClinicalData[] {
    if (targetUniquePatientKeys) {
        return targetUniquePatientKeys.reduce(
            (
                patientSurvivalStatusData: ClinicalData[],
                uniquePatientKey: string
            ) => {
                const clinicalData =
                    survivalClinicalDataGroupByUniquePatientKey[
                        uniquePatientKey
                    ];
                if (clinicalData) {
                    const statusClinicalData = clinicalData.find(
                        c => c.clinicalAttributeId === statusAttributeId
                    );
                    const monthsClinicalData = clinicalData.find(
                        c => c.clinicalAttributeId === monthsAttributeId
                    );
                    if (
                        statusClinicalData &&
                        monthsClinicalData &&
                        !isNullSurvivalClinicalDataValue(
                            statusClinicalData.value
                        ) &&
                        !isNullSurvivalClinicalDataValue(
                            monthsClinicalData.value
                        ) &&
                        !Number.isNaN(Number(monthsClinicalData.value))
                    ) {
                        patientSurvivalStatusData.push(statusClinicalData);
                    }
                }
                return patientSurvivalStatusData;
            },
            []
        );
    } else {
        return [];
    }
}
