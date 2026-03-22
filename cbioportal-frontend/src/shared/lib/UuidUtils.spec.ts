import { assert } from 'chai';
import {
    toSampleUuid,
    toPatientUuid,
    fromSampleUuid,
    fromPatientUuid,
} from './UuidUtils';

describe('UuidUtils', () => {
    it('recovers the input study/sample/patient properly', () => {
        const samples = [
            'a',
            'ab',
            'abc',
            'abcd',
            '12345',
            'xijd-3985-djfi',
            'xij-+jdsapf-3r31',
        ];
        const studies = ['abc_def', 'abcdfa_a', 'a_b_c_d_e_f'];

        for (const sample of samples) {
            for (const study of studies) {
                let sampleUuid1 = toSampleUuid(study, sample);
                let sampleUuid2 = toSampleUuid({
                    studyId: study,
                    sampleId: sample,
                });
                assert.equal(
                    sampleUuid1,
                    sampleUuid2,
                    'sample uuids should be the same for both function signatures'
                );

                let patientUuid1 = toPatientUuid(study, sample);
                let patientUuid2 = toPatientUuid({
                    studyId: study,
                    patientId: sample,
                });
                assert.equal(
                    patientUuid1,
                    patientUuid2,
                    'patient uuids should be the same for both function signatures'
                );

                let fromSampleUuid1 = fromSampleUuid(sampleUuid1);
                let fromSampleUuid2 = fromSampleUuid(sampleUuid2);
                let fromPatientUuid1 = fromPatientUuid(patientUuid1);
                let fromPatientUuid2 = fromPatientUuid(patientUuid2);

                assert.deepEqual(
                    fromSampleUuid1,
                    fromSampleUuid2,
                    'parse results should be same for sample'
                );
                assert.deepEqual(
                    fromPatientUuid1,
                    fromPatientUuid2,
                    'parse results should be same for patient'
                );
                assert.deepEqual(
                    fromSampleUuid1,
                    { studyId: study, sampleId: sample },
                    'parse result correct for sample'
                );
                assert.deepEqual(
                    fromPatientUuid1,
                    { studyId: study, patientId: sample },
                    'parse result correct for patient'
                );
            }
        }
    });
});
