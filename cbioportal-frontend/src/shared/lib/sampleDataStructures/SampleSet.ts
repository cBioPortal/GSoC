import { SampleIdentifier } from 'cbioportal-ts-api-client';

function key(studyId: string, sampleId: string) {
    return `${studyId},${sampleId}`;
}

export default class SampleSet {
    private _set: Set<string>;

    constructor() {
        this._set = new Set();
    }

    public add(studyId: string, sampleIds: string[]) {
        for (const sampleId of sampleIds) {
            this._set.add(key(studyId, sampleId));
        }
    }

    public has(studyId: string, sampleId: string): boolean;
    public has(sample: SampleIdentifier): boolean;
    public has(sampleOrStudyId: any, sampleId?: string): boolean {
        if (typeof sampleOrStudyId === 'string') {
            return this._set.has(key(sampleOrStudyId, sampleId!));
        } else {
            return this._set.has(
                key(sampleOrStudyId.studyId, sampleOrStudyId.sampleId)
            );
        }
    }
}
