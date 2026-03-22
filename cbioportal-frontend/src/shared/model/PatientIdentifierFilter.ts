export interface PatientIdentifierFilter {
    patientIdentifiers: PatientIdentifier[];
}

export interface PatientIdentifier {
    patientId: string;
    studyId: string;
}
