import { assert } from 'chai';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';
import { autorun, reaction, toJS } from 'mobx';
import ExtendedRouterStore, {
    PortalSession,
} from 'shared/lib/ExtendedRouterStore';
import sinon from 'sinon';
import { createMemoryHistory } from 'history';
import { syncHistoryWithStore } from 'mobx-react-router';
import URLWrapper, { needToLoadSession } from 'shared/lib/URLWrapper';
import sessionClient from '../api/sessionServiceInstance';
import SpyInstance = jest.SpyInstance;

function getPlotsSelectionParam<T extends string | undefined>(val: T): any {
    return {
        selectedGeneOption: val,
        selectedGenesetOption: val,
        selectedGenericAssayOption: val,
        dataType: val,
        selectedDataSourceOption: val,
        mutationCountBy: val,
        structuralVariantCountBy: val,
        logScale: val,
    };
}

type TestQuery = {
    name: string;
    data: {
        d1: string;
        d2: string;
    };
};

class TestURLWrapper extends URLWrapper<TestQuery> {
    constructor(routing: ExtendedRouterStore) {
        super(routing, {
            name: { isSessionProp: true, isHashedProp: true },
            data: {
                isSessionProp: true,
                isHashedProp: true,
                nestedObjectProps: { d1: '', d2: '' },
                aliases: ['aliasForData'],
            },
        });
    }
}

class TestURLWrapper2 extends URLWrapper<{ data: { d1: string; d2: string } }> {
    constructor(routing: ExtendedRouterStore) {
        super(routing, {
            data: {
                isSessionProp: true,
                nestedObjectProps: { d1: '', d2: '' },
                doubleURIEncode: true,
            },
        });
    }
}

describe('URLWrapper', () => {
    let routingStore: ExtendedRouterStore;
    let wrapper: ResultsViewURLWrapper;
    let getSessionStub: SpyInstance;

    beforeAll(() => {
        getSessionStub = jest
            .spyOn(sessionClient, 'getSession')
            .mockImplementation(() => Promise.resolve({}));
    });

    afterAll(() => {
        getSessionStub.mockRestore();
    });

    beforeEach(() => {
        routingStore = new ExtendedRouterStore();
        const history = syncHistoryWithStore(
            createMemoryHistory(),
            routingStore
        );
        wrapper = new ResultsViewURLWrapper(routingStore);
        routingStore.updateRoute({}, '/results');
    });

    it('handles doubleURIEncode nested object properties correctly', () => {
        const testWrapper = new TestURLWrapper2(routingStore);
        testWrapper.updateURL({ data: { d1: 'BRCA1 BRCA2', d2: 'hey' } });
        assert.equal(
            routingStore.query.data,
            encodeURIComponent(
                JSON.stringify({ d1: 'BRCA1 BRCA2', d2: 'hey' })
            ),
            'property is doubly encoded in URL (one layer of encoding is undone by the routingStore query access)'
        );
        assert.deepEqual(
            testWrapper.query.data,
            { d1: 'BRCA1 BRCA2', d2: 'hey' },
            'double encoding is undone for query member'
        );
    });

    it('handles doubleURIEncode properties correctly', () => {
        wrapper.updateURL({ gene_list: 'BRCA1 BRCA2' });
        assert.equal(
            routingStore.query.gene_list,
            encodeURIComponent('BRCA1 BRCA2'),
            'property is doubly encoded in URL (one layer of encoding is undone by the routingStore query access)'
        );
        assert.equal(
            wrapper.query.gene_list,
            'BRCA1 BRCA2',
            'double encoding is undone for query member'
        );
    });

    it('reacts to change in underling router store', () => {
        routingStore.updateRoute({ clinicallist: 'monkeys' }, '/results');

        const wrapper = new ResultsViewURLWrapper(routingStore);

        assert.equal(
            wrapper.query.clinicallist,
            'monkeys',
            'handles undefined properties'
        );
        routingStore.updateRoute({ clinicallist: 'donkeys' });
        assert.equal(
            wrapper.query.clinicallist,
            'donkeys',
            'handles undefined properties'
        );
    });

    it('resolves properties aliases correctly', () => {
        routingStore.updateRoute({
            cancer_study_id: 'some_study_id',
            non_property: 'foo',
        });

        assert.equal(
            wrapper.query.cancer_study_list,
            'some_study_id',
            'alias resolves to correct param'
        );

        assert.notProperty(wrapper.query, 'cancer_study_id');

        const testWrapper = new TestURLWrapper(routingStore);
        routingStore.updateRoute({
            aliasForData: JSON.stringify({ d1: 'yo', d2: 'hey' }),
        });
        assert.deepEqual(
            testWrapper.query.data,
            { d1: 'yo', d2: 'hey' },
            'nested object alias resolves to correct param'
        );
        assert.notProperty(testWrapper.query, 'aliasForData');
    });

    it('resolves properties correctly', () => {
        routingStore.updateRoute({
            case_ids: 'bar',
            plots_vert_selection: JSON.stringify(getPlotsSelectionParam('yo')),
            non_property: 'foo',
            non_property_object: JSON.stringify({ a: 'yo' }),
        });
        assert.notProperty(wrapper.query, 'non_property');
        assert.notProperty(wrapper.query, 'non_property_object');
        assert.equal(wrapper.query.case_ids, 'bar');
        assert.deepEqual(
            wrapper.query.plots_vert_selection,
            getPlotsSelectionParam('yo')
        );
    });

    it('reacts to underlying routing store according to rules, with nested object props', () => {
        const testWrapper = new TestURLWrapper(routingStore);
        routingStore.updateRoute({
            name: 'yo',
            data: JSON.stringify({ d1: 'a', d2: 'b' }),
        });
        const stub1 = sinon.stub();
        const stub2 = sinon.stub();
        const stub3 = sinon.stub();
        const stub4 = sinon.stub();
        const disposer1 = reaction(() => testWrapper.query.data.d1, stub1);
        const disposer2 = reaction(() => testWrapper.query.data.d2, stub2);
        const disposer3 = reaction(
            () => [testWrapper.query.data.d1, testWrapper.query.data.d2],
            stub3
        );
        const disposer4 = reaction(
            () => [
                testWrapper.query.name,
                testWrapper.query.data.d1,
                testWrapper.query.data.d2,
            ],
            stub4
        );

        assert.equal(stub1.callCount, 0, 'stub1 hasnt been called');
        assert.equal(stub2.callCount, 0, 'stub2 hasnt been called');
        assert.equal(stub3.callCount, 0, 'stub3 hasnt been called');
        assert.equal(stub4.callCount, 0, 'stub4 hasnt been called');

        routingStore.updateRoute({ name: 'hey' });
        assert.equal(stub1.callCount, 0, 'stub1 hasnt been called (2)');
        assert.equal(stub2.callCount, 0, 'stub2 hasnt been called (2)');
        assert.equal(stub3.callCount, 0, 'stub3 hasnt been called (2)');
        assert.equal(stub4.callCount, 1, 'stub4 called once');

        routingStore.updateRoute({
            data: JSON.stringify({ d1: 'A', d2: 'b' }),
        });
        assert.equal(stub1.callCount, 1, 'stub1 called once');
        assert.equal(stub2.callCount, 0, 'stub2 hasnt been called (3)');
        assert.equal(stub3.callCount, 1, 'stub3 called once');
        assert.equal(stub4.callCount, 2, 'stub4 called twice');

        routingStore.updateRoute({
            data: JSON.stringify({ d1: 'A', d2: 'B' }),
        });
        assert.equal(stub1.callCount, 1, 'stub1 called once (2)');
        assert.equal(stub2.callCount, 1, 'stub2 called once');
        assert.equal(stub3.callCount, 2, 'stub3 called twice');
        assert.equal(stub4.callCount, 3, 'stub4 called three times');

        routingStore.updateRoute({
            data: JSON.stringify({ d1: 'abc', d2: 'def' }),
        });
        assert.equal(stub1.callCount, 2, 'stub1 called twice');
        assert.equal(stub2.callCount, 2, 'stub2 called twice');
        assert.equal(stub3.callCount, 3, 'stub3 called three times');
        assert.equal(stub4.callCount, 4, 'stub4 called four times');

        disposer1();
        disposer2();
        disposer3();
        disposer4();
    });

    it('reacts to underlying routing store according to rules', () => {
        routingStore.updateRoute({ case_ids: 'bar', non_property: 'foo' });

        const stub = sinon.stub();

        const disposer = reaction(() => wrapper.query.case_ids, stub);

        assert.equal(stub.args.length, 0, "stub hasn't been called");

        routingStore.updateRoute({ case_ids: 'bar2', non_property: 'foo' });

        assert.equal(
            stub.args.length,
            1,
            'stub has been called due to update to property'
        );

        routingStore.updateRoute({ case_ids: 'bar2', non_property: 'foo' });

        assert.equal(
            stub.args.length,
            1,
            'setting property to existing value does not cause reaction'
        );

        routingStore.updateRoute({ cancer_study_list: 'study1' });

        assert.equal(
            stub.args.length,
            1,
            'setting query property which is not referenced in reaction does not cause reaction'
        );

        routingStore.updateRoute({ case_ids: 'bar3', non_property: 'foo' });

        assert.equal(
            stub.args.length,
            2,
            'setting property to knew value DOES cause reaction'
        );

        routingStore.updateRoute(
            { case_ids: 'bar4', non_property: 'foo' },
            '/patient'
        );

        assert.equal(
            stub.args.length,
            2,
            "does not react when pathname doesn't match"
        );

        disposer();
    });

    it('hash composed only of hash props', () => {
        routingStore.updateRoute({ case_ids: 'bar', non_property: 'foo' });
        let beforeChange = wrapper.hash;

        routingStore.updateRoute({ clinicallist: '1,2,3' });
        assert.equal(
            wrapper.hash,
            beforeChange,
            "hash doesn't change if we mutate non hashed prop"
        );

        routingStore.updateRoute({ case_ids: 'blah', non_property: 'foo' });
        assert.notEqual(
            wrapper.hash,
            beforeChange,
            'hash changes if we mutate hashed prop'
        );

        const testWrapper = new TestURLWrapper(routingStore);
        routingStore.updateRoute({
            name: 'hey',
            data: JSON.stringify({ d1: 'yo', d2: 'yo' }),
        });
        beforeChange = testWrapper.hash;

        routingStore.updateRoute({
            data: JSON.stringify({ d1: 'hey', d2: 'yo' }),
        });
        assert.notEqual(
            testWrapper.hash,
            beforeChange,
            'hash changes if we mutate nested object hashed prop'
        );
    });

    it('sets and reads nested objects from internal session appropriately', done => {
        const testWrapper = new TestURLWrapper(routingStore);
        const stub = sinon.stub(testWrapper, 'saveRemoteSession');

        stub.callsFake(function(sessionData) {
            return new Promise(resolve => {
                setTimeout(() => {
                    return resolve({ id: 'someSessionId' });
                }, 5);
            });
        });

        testWrapper.sessionEnabled = true;

        testWrapper.urlCharThresholdForSession = 0;

        testWrapper.updateURL({
            name: 'one,two,three',
            data: { d1: '1231', d2: 'yo' },
        });

        assert(stub.calledOnce, 'save session method is called');

        assert.equal(testWrapper.sessionId, 'pending', 'pending session state');

        assert.isUndefined(
            routingStore.query.data,
            'nested object session params NOT in url'
        );

        assert.deepEqual(
            testWrapper.query.data,
            { d1: '1231', d2: 'yo' },
            'we have access to nested object session prop on query'
        );

        setTimeout(() => {
            assert.equal(testWrapper.sessionId, 'someSessionId');
            done();
        }, 10);
    });

    it('sets and reads from internal session appropriately', done => {
        const stub = sinon.stub(wrapper, 'saveRemoteSession');

        stub.callsFake(function(sessionData) {
            return new Promise(resolve => {
                setTimeout(() => {
                    return resolve({ id: 'someSessionId' });
                }, 5);
            });
        });

        wrapper.sessionEnabled = true;

        wrapper.urlCharThresholdForSession = 0;

        wrapper.updateURL({
            clinicallist: 'one,two,three',
            case_ids: '1231',
            plots_horz_selection: getPlotsSelectionParam('yo'),
        });

        assert(stub.calledOnce, 'save session method is called');

        assert.equal(wrapper.sessionId, 'pending', 'pending session state');

        assert.deepEqual(
            wrapper.query.plots_horz_selection,
            getPlotsSelectionParam('yo'),
            'non session nested object param is present in query'
        );

        assert.equal(
            wrapper.query.clinicallist,
            'one,two,three',
            'non session is present in query'
        );

        assert.equal(
            routingStore.query.clinicallist,
            'one,two,three',
            'non session params present in url'
        );

        assert.isNotTrue(
            'clinicallist' in wrapper.localSessionData!.query,
            'non session params NOT present in internal session store'
        );
        assert.isNotTrue(
            'plots_horz_selection' in wrapper.localSessionData!.query,
            'non session nested object params NOT present in internal session store'
        );

        assert.isUndefined(
            routingStore.query.case_ids,
            'session params NOT in url'
        );

        assert.equal(
            wrapper.query.case_ids,
            '1231',
            'we have access to session prop on query'
        );

        setTimeout(() => {
            assert.equal(wrapper.sessionId, 'someSessionId');
            done();
        }, 10);
    });

    it('respects url length threshold for session', done => {
        const stub = sinon.stub(wrapper, 'saveRemoteSession');

        stub.callsFake(function(sessionData) {
            return new Promise(resolve => {
                setTimeout(() => {
                    return resolve({ id: 'someSessionId' });
                }, 5);
            });
        });

        wrapper.sessionEnabled = true;

        wrapper.urlCharThresholdForSession = 1000;

        wrapper.updateURL({ clinicallist: 'one,two,three', case_ids: '1231' });

        setTimeout(() => {
            assert.isFalse(
                stub.called,
                'save session method is NOT called b/c thresshold is not met'
            );

            assert.equal(
                routingStore.query.case_ids,
                '1231',
                'update param from url'
            );

            wrapper.urlCharThresholdForSession = 0;

            assert.isUndefined(wrapper.sessionId, 'no sessionID');

            wrapper.updateURL({
                clinicallist: 'one,two,three',
                case_ids: '12312341234',
            });

            assert.isUndefined(
                routingStore.query.case_ids,
                'case_ids no longer in url'
            );

            assert.isTrue(
                stub.calledOnce,
                'save session method IS called when thresshold is met'
            );

            // EVEN IF URL is under threshold, you cannot go back to non session behavior
            wrapper.updateURL({
                clinicallist: 'one,two,three',
                case_ids: '2222',
            });

            assert.isUndefined(routingStore.query.case_ids);
            assert.equal(wrapper.query.case_ids, '2222');

            setTimeout(() => {
                assert.equal(wrapper.query.case_ids, '2222');
                assert.isUndefined(routingStore.query.case_ids);
                done();
            }, 50);
        }, 50);
    });

    it('respects sessionEnabled flag and thresholds', () => {
        const testWrapper = new TestURLWrapper(routingStore);
        const stub = sinon.stub(testWrapper, 'saveRemoteSession');

        testWrapper.sessionEnabled = false;

        testWrapper.urlCharThresholdForSession = 0;

        testWrapper.updateURL({
            name: 'CDKN2A MDM2 MDM4 TP53',
            data: { d1: 'CDKN2A MDM2 MDM4 TP53', d2: 'def' },
        });

        assert.isFalse(stub.called, 'does not call create session');

        assert.isFalse(testWrapper.hasSessionId, 'does not have session id');

        assert.equal(
            routingStore.query.name,
            'CDKN2A MDM2 MDM4 TP53',
            'puts session prop in url'
        );

        assert.equal(
            routingStore.query.data,
            JSON.stringify({ d1: 'CDKN2A MDM2 MDM4 TP53', d2: 'def' }),
            'puts nested object session prop in url'
        );

        assert.equal(
            testWrapper.query.name,
            'CDKN2A MDM2 MDM4 TP53',
            'obtains session prop from url'
        );
        assert.equal(
            testWrapper.query.data.d1,
            'CDKN2A MDM2 MDM4 TP53',
            'obtains nested object session prop from url'
        );
        assert.equal(
            testWrapper.query.data.d2,
            'def',
            'obtains nested object session prop from url'
        );
        assert.deepEqual(
            testWrapper.query.data,
            { d1: 'CDKN2A MDM2 MDM4 TP53', d2: 'def' },
            'obtains nested object session prop from url'
        );
    });

    it('fetches remote session as necessary', done => {
        const testWrapper = new TestURLWrapper(routingStore);
        const stub = sinon.stub(testWrapper, 'getRemoteSession');

        stub.callsFake(function(sessionData) {
            return new Promise(resolve => {
                setTimeout(() => {
                    return resolve({
                        id: '5dcae586e4b04a9c23e27e5f',
                        data: {
                            name: 'CDKN2A MDM2 MDM4 TP53',
                            data: JSON.stringify({
                                d1: 'CDKN2A MDM2 MDM4 TP53',
                                d2: 'hi',
                            }),
                        },
                        source: 'public_portal',
                        type: 'main_session',
                    });
                }, 5);
            });
        });

        testWrapper.sessionEnabled = true;

        // // must establish an observer in order for remoteData to invoke
        const disposer = autorun(() => {
            testWrapper.isLoadingSession;
        });

        routingStore.updateRoute({ session_id: '5dcae586e4b04a9c23e27e5f' });

        assert.isTrue(testWrapper.isLoadingSession, 'it is loading session');
        assert.isFalse(
            testWrapper.isTemporarySessionPendingSave,
            'it is NOT pending session'
        );

        setTimeout(() => {
            assert.isTrue(stub.calledOnce);

            assert.isTrue(stub.calledOnce);

            assert.equal(
                testWrapper.query.name,
                'CDKN2A MDM2 MDM4 TP53',
                'sets session props on query after session load'
            );
            assert.equal(testWrapper.query.data.d1, 'CDKN2A MDM2 MDM4 TP53');
            assert.equal(testWrapper.query.data.d2, 'hi');
            assert.deepEqual(testWrapper.query.data, {
                d1: 'CDKN2A MDM2 MDM4 TP53',
                d2: 'hi',
            });
            disposer();
            done();
        }, 100);
    });

    it('handles back/forward of routingstore', done => {
        const testWrapper = new TestURLWrapper(routingStore);
        const getRemoteSessionStub = sinon.stub(
            testWrapper,
            'getRemoteSession'
        );
        let saveSessionStub = sinon.stub(testWrapper, 'saveRemoteSession');

        getRemoteSessionStub.callsFake(function(sessionData) {
            return new Promise(resolve => {
                setTimeout(() => {
                    return resolve({
                        id: '5dcae586e4b04a9c23e27e5f',
                        data: {
                            name: 'CDKN2A MDM2 MDM4 TP53',
                            data: JSON.stringify({ d1: 'one', d2: 'two' }),
                        },
                    });
                }, 5);
            });
        });

        saveSessionStub.callsFake(function(sessionData) {
            return new Promise(resolve => {
                setTimeout(() => {
                    return resolve({ id: 'someSessionId' });
                }, 5);
            });
        });

        testWrapper.sessionEnabled = true;

        testWrapper.urlCharThresholdForSession = 0;

        // // must establish an observer in order for remoteData to invoke
        const disposer = autorun(() => {
            testWrapper.isLoadingSession;
        });

        routingStore.updateRoute({ session_id: '5dcae586e4b04a9c23e27e5f' });

        assert.isTrue(testWrapper.isLoadingSession, 'it is loading session');
        assert.isFalse(
            testWrapper.isTemporarySessionPendingSave,
            'it is NOT pending session'
        );

        setTimeout(() => {
            assert.isTrue(getRemoteSessionStub.calledOnce);
            assert.equal(
                testWrapper.query.name,
                'CDKN2A MDM2 MDM4 TP53',
                'sets session props on query after session load'
            );
            assert.equal(
                testWrapper.query.data.d1,
                'one',
                'sets nested object session props on query after session load'
            );
            assert.equal(
                testWrapper.query.data.d2,
                'two',
                'sets nested object session props on query after session load'
            );
            assert.deepEqual(
                testWrapper.query.data,
                { d1: 'one', d2: 'two' },
                'sets nested object session props on query after session load'
            );
            assert.equal(
                routingStore.query.session_id,
                '5dcae586e4b04a9c23e27e5f'
            );

            testWrapper.updateURL({
                name: 'CDKN2 MDM2 MDM4',
                data: { d1: 'abc', d2: 'def' },
            });

            setTimeout(() => {
                assert.isTrue(saveSessionStub.calledOnce);
                assert.isTrue(getRemoteSessionStub.calledOnce);
                assert.equal(
                    testWrapper.sessionId,
                    'someSessionId',
                    'session id updated'
                );
                assert.equal(
                    testWrapper.query.name,
                    'CDKN2 MDM2 MDM4',
                    'has correct gene list'
                );
                assert.equal(
                    testWrapper.query.data.d1,
                    'abc',
                    'has correct plots selection'
                );
                assert.equal(
                    testWrapper.query.data.d2,
                    'def',
                    'has correct plots selection'
                );
                assert.deepEqual(
                    testWrapper.query.data,
                    { d1: 'abc', d2: 'def' },
                    'has correct plots selection'
                );

                routingStore.goBack();

                assert.equal(testWrapper.sessionId, '5dcae586e4b04a9c23e27e5f');

                assert.isTrue(testWrapper.isLoadingSession);
                assert.isTrue(getRemoteSessionStub.calledTwice);

                setTimeout(() => {
                    assert.isFalse(testWrapper.isLoadingSession);
                    assert.equal(
                        testWrapper.query.name,
                        'CDKN2A MDM2 MDM4 TP53'
                    );
                    assert.equal(testWrapper.query.data.d1, 'one');
                    assert.equal(testWrapper.query.data.d2, 'two');
                    assert.deepEqual(testWrapper.query.data, {
                        d1: 'one',
                        d2: 'two',
                    });
                    disposer();
                    done();
                }, 20);
            }, 10);
        }, 100);
    });

    it('creates new session when session param is changed', done => {
        let getSessionStub = sinon.stub(wrapper, 'getRemoteSession');

        let saveSessionStub = sinon.stub(wrapper, 'saveRemoteSession');

        saveSessionStub.callsFake(function(sessionData) {
            return new Promise(resolve => {
                setTimeout(() => {
                    return resolve({ id: 'someSessionId' });
                }, 5);
            });
        });

        getSessionStub.callsFake(function(sessionData) {
            return new Promise(resolve => {
                setTimeout(() => {
                    return resolve({
                        id: '5dcae586e4b04a9c23e27e5f',
                        data: {
                            genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION:
                                'msk_impact_2017_cna',
                            Z_SCORE_THRESHOLD: '2.0',
                            gene_list: 'CDKN2A%20MDM2%20MDM4%20TP53',
                            case_set_id: 'msk_impact_2017_cnaseq',
                            RPPA_SCORE_THRESHOLD: '2.0',
                            cancer_study_list: 'msk_impact_2017',
                            geneset_list: ' ',
                            genetic_profile_ids_PROFILE_MUTATION_EXTENDED:
                                'msk_impact_2017_mutations',
                        },
                        source: 'public_portal',
                        type: 'main_session',
                    });
                }, 5);
            });
        });

        wrapper.sessionEnabled = true;
        wrapper.urlCharThresholdForSession = 10;

        // // must establish an observer in order for remoteData to invoke
        const disposer = autorun(() => {
            wrapper.isLoadingSession;
        });

        // set first session for loading
        routingStore.updateRoute({ session_id: '5dcae586e4b04a9c23e27e5f' });

        assert.isTrue(getSessionStub.calledOnce);
        assert.isTrue(wrapper.isLoadingSession);

        setTimeout(() => {
            assert.isFalse(wrapper.isLoadingSession);

            wrapper.updateURL({ gene_list: 'EGFR TP53' });

            assert.isTrue(
                saveSessionStub.calledOnce,
                'it called save session service'
            );

            assert.equal(
                wrapper.query.gene_list,
                'EGFR TP53',
                'sets query params for new session immediately'
            );

            assert.isTrue(wrapper.isTemporarySessionPendingSave);

            setTimeout(() => {
                assert.isTrue(
                    getSessionStub.calledOnce,
                    'did not call get session again'
                );
                assert.equal(
                    wrapper.sessionId,
                    'someSessionId',
                    'sets session id appropriatly'
                );
                disposer();
                done();
            }, 50);
        }, 50);
    });

    it('creates new session when nested object session param is changed', done => {
        const testWrapper = new TestURLWrapper(routingStore);

        let getSessionStub = sinon.stub(testWrapper, 'getRemoteSession');

        let saveSessionStub = sinon.stub(testWrapper, 'saveRemoteSession');

        saveSessionStub.callsFake(function(sessionData) {
            return new Promise(resolve => {
                setTimeout(() => {
                    return resolve({ id: 'someSessionId' });
                }, 5);
            });
        });

        getSessionStub.callsFake(function(sessionData) {
            return new Promise(resolve => {
                setTimeout(() => {
                    return resolve({
                        id: '5dcae586e4b04a9c23e27e5f',
                        data: {
                            name: 'hey',
                            data: JSON.stringify({
                                d1: 'one',
                                d2: 'two',
                            }),
                        },
                        source: 'public_portal',
                        type: 'main_session',
                    });
                }, 5);
            });
        });

        testWrapper.sessionEnabled = true;
        testWrapper.urlCharThresholdForSession = 10;

        // // must establish an observer in order for remoteData to invoke
        const disposer = autorun(() => {
            testWrapper.isLoadingSession;
        });

        // set first session for loading
        routingStore.updateRoute({ session_id: '5dcae586e4b04a9c23e27e5f' });

        assert.isTrue(getSessionStub.calledOnce);
        assert.isTrue(testWrapper.isLoadingSession);

        setTimeout(() => {
            assert.isFalse(testWrapper.isLoadingSession);
            assert.equal(
                testWrapper.query.data.d1,
                'one',
                'nested object value loads initially from session'
            );

            testWrapper.updateURL({ data: { d1: 'zzz', d2: 'two' } });

            assert.isTrue(
                saveSessionStub.calledOnce,
                'it called save session service'
            );

            assert.equal(
                testWrapper.query.data.d1,
                'zzz',
                'sets query params for new session immediately'
            );

            assert.isTrue(testWrapper.isTemporarySessionPendingSave);

            setTimeout(() => {
                assert.isTrue(
                    getSessionStub.calledOnce,
                    'did not call get session again'
                );
                assert.equal(
                    testWrapper.sessionId,
                    'someSessionId',
                    'sets session id appropriatly'
                );
                disposer();
                done();
            }, 50);
        }, 50);
    });

    it('when clear=true, gets rid of any existing params', () => {
        wrapper.updateURL({
            case_ids: '12345',
            clinicallist: '6789',
            plots_horz_selection: getPlotsSelectionParam(''),
        });
        assert.equal(wrapper.query.case_ids, '12345');
        assert.equal(routingStore.query.case_ids, '12345');
        assert.deepEqual(
            toJS(wrapper.query.plots_horz_selection),
            getPlotsSelectionParam('')
        );

        wrapper.updateURL({ cancer_study_list: 'somelist' }, undefined, true);

        assert.isUndefined(routingStore.query.case_ids);

        assert.isFalse('case_ids' in routingStore.query);

        assert.isUndefined(
            wrapper.query.case_ids,
            'removes existing params on clear'
        );
        assert.deepEqual(
            toJS(wrapper.query.plots_horz_selection),
            getPlotsSelectionParam(undefined) as any,
            'clears nested object params to undefined'
        );

        assert.equal(routingStore.query.cancer_study_list, 'somelist');
    });

    it('Populates wrapper query according to alias rules ON instantiation (fire immediately on reaction)', () => {
        routingStore = new ExtendedRouterStore();

        const history = syncHistoryWithStore(
            createMemoryHistory(),
            routingStore
        );

        routingStore.updateRoute({
            gene_list: '12345',
            cancer_study_id: '789',
        });

        wrapper = new ResultsViewURLWrapper(routingStore);

        assert.equal(wrapper.query.gene_list, '12345');
        assert.equal(wrapper.query.cancer_study_list, '789');
    });

    it('handles new session before old session finished saving', done => {
        wrapper.urlCharThresholdForSession = 0;
        wrapper.sessionEnabled = true;

        let saveSessionStub = sinon.stub(wrapper, 'saveRemoteSession');

        saveSessionStub.callsFake(function(sessionData) {
            return new Promise(resolve => {
                setTimeout(() => {
                    return resolve({ id: 'sessionId1' });
                }, 10);
            });
        });

        wrapper.updateURL({ gene_list: '12345' });

        assert.isTrue(saveSessionStub.called);

        saveSessionStub.callsFake(function(sessionData) {
            return new Promise(resolve => {
                setTimeout(() => {
                    return resolve({ id: 'sessionId2' });
                }, 5);
            });
        });

        wrapper.updateURL({ gene_list: '54321' });

        assert.isTrue(saveSessionStub.calledTwice);

        // should reflect sequence of sessions, not response
        // i.e. first session should have been cancelled by second
        // even though second response sooner
        setTimeout(() => {
            assert.equal(wrapper.sessionId, 'sessionId2');
            assert.equal(wrapper.query.gene_list, '54321');
            assert.equal(routingStore.query.session_id, 'sessionId2');
            done();
        }, 1000);
    });

    it('#needToLoadSession obeys rules', () => {
        assert.isFalse(needToLoadSession({}));

        assert.isFalse(
            needToLoadSession({
                sessionId: 'pending',
            })
        );

        assert.isFalse(
            needToLoadSession({
                sessionId: '123',
                localSessionData: { id: '123' } as PortalSession,
            }),
            'sessionId is same, so we already have data'
        );

        assert.isTrue(
            needToLoadSession({
                sessionId: '123',
                localSessionData: { id: '321' } as PortalSession,
            }),
            'sessionId from url is different from internal store'
        );
    });
});
