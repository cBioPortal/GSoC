// helpers - these actually do the work
const DELIMITER = ':';
function toUuid(x: string, y: string): string {
    return `${x}${DELIMITER}${y}`;
}

function fromUuid(uuid: string): { x: string; y: string } {
    const split = uuid.split(DELIMITER);
    return { x: split[0], y: split[1] };
}

// exported functions - convenient interfaces
export function toSampleUuid(studyId: string, sampleId: string): string;
export function toSampleUuid(d: { studyId: string; sampleId: string }): string;

export function toSampleUuid(
    studyIdOrD: string | { studyId: string; sampleId: string },
    sampleId?: string
): string {
    if (typeof studyIdOrD === 'string') {
        if (!sampleId) {
            throw 'no sampleId given';
        } else {
            return toUuid(studyIdOrD, sampleId);
        }
    } else {
        return toUuid(studyIdOrD.studyId, studyIdOrD.sampleId);
    }
}

export function toPatientUuid(studyId: string, patientId: string): string;
export function toPatientUuid(d: {
    studyId: string;
    patientId: string;
}): string;

export function toPatientUuid(
    studyIdOrD: string | { studyId: string; patientId: string },
    patientId?: string
): string {
    if (typeof studyIdOrD === 'string') {
        if (!patientId) {
            throw 'no patientId given';
        } else {
            return toUuid(studyIdOrD, patientId);
        }
    } else {
        return toUuid(studyIdOrD.studyId, studyIdOrD.patientId);
    }
}

export function fromSampleUuid(
    uuid: string
): { studyId: string; sampleId: string } {
    const split = fromUuid(uuid);
    return { studyId: split.x, sampleId: split.y };
}

export function fromPatientUuid(
    uuid: string
): { studyId: string; patientId: string } {
    const split = fromUuid(uuid);
    return { studyId: split.x, patientId: split.y };
}
