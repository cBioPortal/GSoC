/**
 * Created by aaronlisman on 3/2/17.
 */
import {
    handlePathologyReportCheckResponse,
    PatientViewPageStore,
} from './PatientViewPageStore';
import { assert } from 'chai';
import { AppStore } from '../../../AppStore';

describe('PatientViewPageStore', () => {
    let store: PatientViewPageStore;

    beforeAll(() => {
        store = new PatientViewPageStore(new AppStore(), 'someId', '');
    });

    it('if there are pdf items in response and their name starts with a given patientId, return collection, otherwise returns empty array', () => {
        let result = handlePathologyReportCheckResponse('some', {
            total_count: 1,
            items: [{ url: 'someUrl', name: 'someName' }],
        });
        assert.deepEqual(result, [{ url: 'someUrl', name: 'someName' }]);

        result = handlePathologyReportCheckResponse('some', {
            total_count: 0,
        });
        assert.deepEqual(result, []);
    });

    it('if there are pdf items in response and their name starts with the wrong patientId, return empty array', () => {
        let result = handlePathologyReportCheckResponse('xxx', {
            total_count: 1,
            items: [{ url: 'someUrl', name: 'someName' }],
        });
        assert.deepEqual(result, []);
    });

    it('sets page title to patient if theres a patient id and sample if sample id, patient id winning out', () => {
        assert.equal(store.pageTitle, 'Patient: ');

        store.setPatientId('1234');
        assert.equal(store.pageTitle, 'Patient: 1234');

        store.setSampleId('1234');
        assert.equal(store.pageTitle, 'Sample: 1234');

        store.setPatientId('1234');
        assert.equal(store.pageTitle, 'Patient: 1234');
    });
});
