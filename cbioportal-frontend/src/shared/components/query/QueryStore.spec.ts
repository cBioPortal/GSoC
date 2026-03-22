import { assert, expect } from 'chai';
import {
    QueryStore,
    CUSTOM_CASE_LIST_ID,
    CancerStudyQueryUrlParams,
} from './QueryStore';
import Sinon from 'sinon';
import sessionServiceClient from 'shared/api//sessionServiceInstance';
import client from '../../api/cbioportalClientInstance';
import _ from 'lodash';
import {
    VirtualStudy,
    VirtualStudyData,
} from 'shared/api/session-service/sessionServiceModels';

describe('QueryStore', () => {
    describe('#setParamsFromLocalStorage', () => {
        let store: QueryStore;
        let getUserVirtualStudiesStub: sinon.SinonStub;
        let deleteVirtualStudyStub: sinon.SinonStub;
        let addVirtualStudyStub: sinon.SinonStub;
        let initializeStub: sinon.SinonStub;

        beforeEach(() => {
            initializeStub = Sinon.stub(
                QueryStore.prototype,
                'initialize'
            ).callsFake(function() {});

            store = new QueryStore();
        });

        it('given custom case list, sets store and flags appropriately', () => {
            assert.isFalse(store.initiallySelected.profileIds);
            assert.isFalse(store.initiallySelected.sampleListId);
            store.setParamsFromLocalStorage({
                case_set_id: '-1',
                case_ids: 'sample1:study+sample2:study',
            } as Partial<CancerStudyQueryUrlParams>);
            assert.equal(store.caseIds, 'sample1:study\nsample2:study');
            assert.isTrue(store.initiallySelected.sampleListId);
            assert.equal(store.selectedSampleListId, '-1');
        });
    });

    describe.skip('Virtual Studies section on query page', () => {
        let store_vs: QueryStore;
        const virtualStudies: VirtualStudy[] = [
            {
                id: 'study1',
                data: {
                    name: 'Test Study',
                    description: 'Test Study',
                    studies: [
                        {
                            id: 'test_study',
                            samples: ['sample-01', 'sample-02', 'sample-03'],
                        },
                    ],
                    studyViewFilter: {},
                    origin: ['test_study'],
                } as VirtualStudyData,
            },
        ];
        let getUserVirtualStudiesStub: sinon.SinonStub;
        let deleteVirtualStudyStub: sinon.SinonStub;
        let addVirtualStudyStub: sinon.SinonStub;

        beforeAll(() => {
            getUserVirtualStudiesStub = Sinon.stub(
                sessionServiceClient,
                'getUserVirtualStudies'
            ).callsFake(function fakeFn() {
                return new Promise((resolve, reject) => {
                    resolve(virtualStudies);
                });
            });
            deleteVirtualStudyStub = Sinon.stub(
                sessionServiceClient,
                'deleteVirtualStudy'
            ).callsFake(function fakeFn(id: string) {
                return new Promise<void>((resolve, reject) => {
                    resolve();
                });
            });
            addVirtualStudyStub = Sinon.stub(
                sessionServiceClient,
                'addVirtualStudy'
            ).callsFake(function fakeFn(id: string) {
                return new Promise<void>((resolve, reject) => {
                    resolve();
                });
            });

            store_vs = new QueryStore();
        });

        afterAll(() => {
            getUserVirtualStudiesStub.restore();
            deleteVirtualStudyStub.restore();
            addVirtualStudyStub.restore();
        });

        it('should show all user virtual studies', () => {
            assert.isTrue(getUserVirtualStudiesStub.calledOnce);
        });

        it('should be able to delete a virtual study', () => {
            store_vs.deleteVirtualStudy('study1');
            assert.isTrue(deleteVirtualStudyStub.calledOnce);
        });

        it('should be able to restore back deleted virtual study', () => {
            store_vs.restoreVirtualStudy('study1');
            assert.isTrue(addVirtualStudyStub.calledOnce);
        });
    });
});
