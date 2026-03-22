import SampleManager, { getSpecimenCollectionDayMap } from './SampleManager';
import mockClinicalData from 'shared/api/mock/Clinical_data_study_ucec_tcga_pub.json';
import {
    ClinicalData,
    ClinicalDataBySampleId,
    ClinicalEvent,
} from 'cbioportal-ts-api-client';
import { groupBySampleId } from 'shared/lib/StoreUtils';
import { assert } from 'chai';

describe('SampleManager', () => {
    const testSamples: Array<ClinicalDataBySampleId> = groupBySampleId(
        ['TCGA-BK-A0CC-01'],
        mockClinicalData as Array<ClinicalData>
    );

    it('checkIsOnlySequentialOrderingAvailable() with no valid ClinicalEvents', () => {
        const sampleManager = new SampleManager(testSamples, []);
        assert.isTrue(sampleManager.isOnlySequentialOrderingAvailable());
    });

    it('checkIsOnlySequentialOrderingAvailable() with valid ClinicalEvents', () => {
        const clinicalEvent = getClinicalEvent('TCGA-BK-A0CC-01');

        const sampleManager = new SampleManager(testSamples, []);
        assert.isFalse(
            sampleManager.isOnlySequentialOrderingAvailable([clinicalEvent])
        );
    });

    it('checkGetSpecimenCollectionDayMap() with incorrect ClinicalEvents', () => {
        const clinicalEvent = getClinicalEvent('TCGA-BK-A0CC-02');

        const sampleManager = new SampleManager(testSamples, []);
        assert.isTrue(
            sampleManager.isOnlySequentialOrderingAvailable([clinicalEvent])
        );
    });

    it('checkGetSpecimeCollectionDayMap()', () => {
        const clinicalEvent = getClinicalEvent('TCGA-BK-A0CC-01');
        const sampleManager = new SampleManager(testSamples, []);
        assert.equal(
            getSpecimenCollectionDayMap(sampleManager.sampleOrder, [
                clinicalEvent,
            ]).size,
            1
        );
    });
});

function getClinicalEvent(sampleID: string): ClinicalEvent {
    return {
        attributes: [{ key: 'SAMPLE_ID', value: sampleID }],
        startNumberOfDaysSinceDiagnosis: 10,
        eventType: 'SPECIMEN',
    } as ClinicalEvent;
}
