/* tslint:disable: indent linebreak-style */
import _ from 'lodash';
import { getClient } from '../../api/cbioportalClientInstance';
import {
    action,
    computed,
    makeObservable,
    observable,
    ObservableMap,
    reaction,
    runInAction,
    toJS,
} from 'mobx';
import {
    CancerStudy,
    Gene,
    Geneset,
    MolecularProfile,
    Sample,
    SampleFilter,
    SampleList,
    TypeOfCancer as CancerType,
} from 'cbioportal-ts-api-client';
import CancerStudyTreeData from './CancerStudyTreeData';
import {
    cached,
    debounceAsync,
    getBrowserWindow,
    remoteData,
    stringListToIndexSet,
    stringListToSet,
} from 'cbioportal-frontend-commons';
import internalClient, {
    getInternalClient,
} from '../../api/cbioportalInternalClientInstance';
import { SingleGeneQuery, SyntaxError } from '../../lib/oql/oql-parser';
import { parseOQLQuery } from '../../lib/oql/oqlfilter';
import memoize from 'memoize-weak-decorator';
import { ComponentGetsStoreContext } from '../../lib/ContextUtils';
import URL from 'url';
import { redirectToStudyView } from '../../api/urls';
import StudyListLogic from './StudyListLogic';
import chunkMapReduce from 'shared/lib/chunkMapReduce';
import { categorizedSamplesCount, currentQueryParams } from './QueryStoreUtils';

import getOverlappingStudies from '../../lib/getOverlappingStudies';
import MolecularProfilesInStudyCache from '../../cache/MolecularProfilesInStudyCache';
import { CacheData } from '../../lib/LazyMobXCache';
import {
    getAlterationTypesInOql,
    getDefaultProfilesForOql,
    getHierarchyData,
    getOqlMessages,
} from 'shared/lib/StoreUtils';
import sessionServiceClient from 'shared/api//sessionServiceInstance';
import {
    getGenesetsFromHierarchy,
    getVolcanoPlotData,
    getVolcanoPlotMinYValue,
} from 'shared/components/query/GenesetsSelectorStore';
import SampleListsInStudyCache from 'shared/cache/SampleListsInStudyCache';
import { getServerConfig, ServerConfigHelpers } from '../../../config/config';
import { AlterationTypeConstants } from 'shared/constants';
import {
    ResultsViewURLQuery,
    ResultsViewURLQueryEnum,
} from 'pages/resultsView/ResultsViewURLWrapper';
import { isMixedReferenceGenome } from 'shared/lib/referenceGenomeUtils';
import { getSuffixOfMolecularProfile } from 'shared/lib/molecularProfileUtils';
import { VirtualStudy } from 'shared/api/session-service/sessionServiceModels';
import { isQueriedStudyAuthorized } from 'pages/studyView/StudyViewUtils';
import { toQueryString } from 'shared/lib/query/textQueryUtils';
import { SearchClause } from 'shared/components/query/filteredSearch/SearchClause';
import { QueryParser } from 'shared/lib/query/QueryParser';
import { AppStore } from 'AppStore';
import { ResultsViewTab } from 'pages/resultsView/ResultsViewPageHelpers';
import { CaseSetId } from 'shared/components/query/CaseSetSelectorUtils';
import { IFilterDef } from './DataTypeFilter';

// interface for communicating
export type CancerStudyQueryUrlParams = {
    cancer_study_id: string;
    cancer_study_list?: string;
    genetic_profile_ids_PROFILE_MUTATION_EXTENDED?: string;
    genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION?: string;
    genetic_profile_ids_PROFILE_MRNA_EXPRESSION?: string;
    genetic_profile_ids_PROFILE_METHYLATION?: string;
    genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION?: string;
    genetic_profile_ids_PROFILE_GENESET_SCORE?: string;
    genetic_profile_ids_PROFILE_GENERIC_ASSAY?: string;
    Z_SCORE_THRESHOLD: string;
    RPPA_SCORE_THRESHOLD: string;
    data_priority?: '0' | '1' | '2';
    profileFilter: string;
    case_set_id: string;
    case_ids: string;
    gene_list: string;
    geneset_list?: string;
    tab_index: 'tab_download' | 'tab_visualize';
    transpose_matrix?: 'on';
    Action: 'Submit';
    patient_enrichments?: string;
    show_samples?: string;
    exclude_germline_mutations?: string;
};

export type GeneReplacement = { alias: string; genes: Gene[] };

export const CUSTOM_CASE_LIST_ID = '-1';
export const ALL_CASES_LIST_ID = 'all';

function isInteger(str: string) {
    return Number.isInteger(Number(str));
}

export function normalizeQuery(geneQuery: string) {
    return geneQuery
        .trim()
        .replace(/^\s+|\s+$/g, '')
        .replace(/[ \+]+/g, ' ')
        .toUpperCase();
}

type GenesetId = string;

export class QueryStore {
    constructor(urlWithInitialParams?: string) {
        getBrowserWindow().activeQueryStore = this;

        makeObservable(this);

        /**
         * Reset selectedSampleListId when sampleLists and sampleListInSelectedStudies have finished
         */
        reaction(
            () => [this.sampleLists, this.sampleListInSelectedStudies],
            () => {
                if (
                    !this.sampleLists.isComplete ||
                    !this.sampleListInSelectedStudies.isComplete
                ) {
                    return;
                }
                if (
                    !this.initiallySelected.sampleListId ||
                    this.studiesHaveChangedSinceInitialization
                ) {
                    this._selectedSampleListId = undefined;
                }
            }
        );
        this.initialize(urlWithInitialParams);
    }

    @computed
    get queryParser() {
        return new QueryParser(this.referenceGenomes);
    }

    initialize(urlWithInitialParams?: string) {
        //labelMobxPromises(this);

        if (urlWithInitialParams) this.setParamsFromUrl(urlWithInitialParams);

        // handle local storage submission from study page (too long for url)
        let legacySubmission: any = localStorage.getItem(
            'legacyStudySubmission'
        );
        localStorage.removeItem('legacyStudySubmission');
        if (legacySubmission) {
            try {
                this.setParamsFromLocalStorage(JSON.parse(legacySubmission));
            } catch (ex) {
                throw 'error parseing/setting legacyStudySubmission';
            }
        }

        reaction(
            () => this.allSelectedStudyIds,
            () => {
                this.studiesHaveChangedSinceInitialization = true;
            }
        );
    }

    public singlePageAppSubmitRoutine: (
        query: CancerStudyQueryUrlParams,
        currentTab?: ResultsViewTab
    ) => void;

    @observable studiesHaveChangedSinceInitialization: boolean = false;

    //temporary store to collect deleted studies.
    //it is used to restore virtual studies in current window
    @observable deletedVirtualStudies: string[] = [];

    //to remove a virtual study from users list
    deleteVirtualStudy(id: string) {
        sessionServiceClient.deleteVirtualStudy(id).then(
            action(() => {
                this.deletedVirtualStudies.push(id);
                //unselect if the virtual study is selected
                if (this.selectableSelectedStudyIds.indexOf(id) !== -1) {
                    this.selectableSelectedStudyIds = _.difference(
                        this.selectableSelectedStudyIds,
                        [id]
                    );
                }
            }),
            action((error: any) => {
                //TODO: how to handle if there is an error
            })
        );
    }

    //restore back a deleted virtual study, just in the current browser
    restoreVirtualStudy(id: string) {
        sessionServiceClient.addVirtualStudy(id).then(
            action(() => {
                this.deletedVirtualStudies = this.deletedVirtualStudies.filter(
                    x => x !== id
                );
            }),
            action((error: any) => {
                //TODO: how to handle if there is an error
            })
        );
    }

    @computed get virtualStudiesMap(): { [id: string]: VirtualStudy } {
        return _.keyBy(
            [
                ...this.userVirtualStudies.result,
                ...this.publicVirtualStudies.result,
            ],
            study => study.id
        );
    }

    @computed get selectedVirtualStudies(): VirtualStudy[] {
        return _.reduce(
            this.selectableSelectedStudies,
            (acc: VirtualStudy[], study) => {
                if (this.isVirtualStudy(study.studyId)) {
                    if (
                        this.virtualStudiesMap !== undefined &&
                        this.virtualStudiesMap[study.studyId]
                    ) {
                        acc.push(this.virtualStudiesMap[study.studyId]);
                    }
                }
                return acc;
            },
            []
        );
    }

    //gets a list of all physical studies in the selection
    //selection can be any combination of regualr physical and virtual studies
    @computed get physicalStudyIdsInSelection(): string[] {
        // Gives selected study ids and study ids that are in selected virtual studies
        const ret: { [id: string]: boolean } = {};
        for (const studyId of this.selectableSelectedStudyIds) {
            const virtualStudy = this.virtualStudiesMap[studyId];
            if (virtualStudy) {
                virtualStudy.data.studies.forEach(
                    study => (ret[study.id] = true)
                );
            } else {
                ret[studyId] = true;
            }
        }
        return Object.keys(ret);
    }

    @computed
    get onlyOneReferenceGenome() {
        const referenceGenomes = _.uniq(
            this.selectableSelectedStudies.map(s => s.referenceGenome)
        );
        return referenceGenomes.length === 1;
    }

    @computed
    get multipleReferenceGenomesPresentInAllStudies() {
        const allStudies = this.treeData.map_studyId_cancerStudy;
        const referenceGenomes = _.uniq(
            Array.from(allStudies.values()).map(s => s.referenceGenome)
        );
        return referenceGenomes.length > 1;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // QUERY PARAMETERS
    ////////////////////////////////////////////////////////////////////////////////

    @observable forDownloadTab: boolean = false;

    @observable transposeDataMatrix = false;

    @observable.ref searchClauses: SearchClause[] = [];

    @observable.ref dataTypeFilters: string[] = [];

    @observable _studyFilterOptions: IFilterDef[];

    @computed get searchText(): string {
        return toQueryString(this.searchClauses);
    }

    @computed get filterType(): string[] {
        return this.dataTypeFilters;
    }

    @observable private _allSelectedStudyIds: ObservableMap<
        string,
        boolean
    > = observable.map<string, boolean>();

    @computed get allSelectedStudyIds(): string[] {
        return Array.from(this._allSelectedStudyIds.keys());
    }

    @computed get selectableSelectedStudyIds(): string[] {
        let ids: string[] = Array.from(this._allSelectedStudyIds.keys());
        const selectableStudies = this.selectableStudiesSet.result;
        ids = ids.reduce((obj: string[], next) => {
            if (selectableStudies[next]) {
                return obj.concat(selectableStudies[next]);
            }
            return obj;
        }, []);
        ids = _.uniq(ids);
        return this.forDownloadTab ? ids.slice(-1) : ids;
    }

    set selectableSelectedStudyIds(val: string[]) {
        runInAction(() => {
            this.selectedSampleListId = undefined;
            this._allSelectedStudyIds = observable.map(stringListToSet(val));
        });
    }

    @action
    public setStudyIdSelected(studyId: string, selected: boolean) {
        if (this.forDownloadTab) {
            // only one can be selected at a time
            let newMap: { [studyId: string]: boolean } = {};
            if (selected) {
                newMap[studyId] = selected;
            }
            this._allSelectedStudyIds = observable.map(newMap);
        } else {
            if (selected) {
                this._allSelectedStudyIds.set(studyId, true);
            } else {
                this._allSelectedStudyIds.delete(studyId);
            }
        }
    }

    //this is to cache a selected ids in the query
    // used in when visualizing a shared another user virtual study
    private _defaultSelectedIds: ObservableMap<
        string,
        boolean
    > = observable.map<string, boolean>();

    @computed get defaultSelectedIds() {
        return this._defaultSelectedIds;
    }

    @observable private profileFilterSet?: ObservableMap<string, boolean>;

    dataTypePriorityFromUrl?: string;
    profileIdsFromUrl?: string[];
    profileFilterSetFromUrl?: string[];

    @computed get selectedProfileIdSet() {
        let selectedIdSet: { [is: string]: boolean } = {};
        if (this.validProfileIdSetForSelectedStudies.isComplete) {
            const groupedMolecularProfilesByType = this
                .validProfileIdSetForSelectedStudies.result;
            if (this.profileFilterSet === undefined) {
                if (!this.studiesHaveChangedSinceInitialization) {
                    if (!_.isEmpty(this.profileFilterSetFromUrl)) {
                        this.profileFilterSetFromUrl!.forEach(profileFilter => {
                            if (groupedMolecularProfilesByType[profileFilter]) {
                                selectedIdSet[profileFilter] = true;
                            }
                        });
                    } else if (!_.isEmpty(this.profileIdsFromUrl)) {
                        _.chain(this.profileIdsFromUrl)
                            .reduce((acc: MolecularProfile[], profileId) => {
                                const molecularProfile = this
                                    .dict_molecularProfileId_molecularProfile[
                                    profileId
                                ];
                                if (molecularProfile) {
                                    acc.push(molecularProfile);
                                    if (
                                        molecularProfile.molecularAlterationType ===
                                        AlterationTypeConstants.MUTATION_EXTENDED
                                    ) {
                                        acc = acc.concat(
                                            this.getFilteredProfiles(
                                                'STRUCTURAL_VARIANT'
                                            )
                                        );
                                    }
                                }
                                return acc;
                            }, [])
                            .forEach(profile => {
                                selectedIdSet[
                                    getSuffixOfMolecularProfile(profile)
                                ] = true;
                            })
                            .value();
                    } else {
                        const altTypes: MolecularProfile['molecularAlterationType'][] = [];
                        switch (this.dataTypePriorityFromUrl) {
                            default:
                            case '0':
                                altTypes.push('MUTATION_EXTENDED');
                                altTypes.push('STRUCTURAL_VARIANT');
                                altTypes.push('COPY_NUMBER_ALTERATION');
                                break;
                            case '1':
                                altTypes.push('MUTATION_EXTENDED');
                                altTypes.push('STRUCTURAL_VARIANT');
                                break;
                            case '2':
                                altTypes.push('COPY_NUMBER_ALTERATION');
                                break;
                        }

                        let profiles = _.flatMap(altTypes, altType =>
                            this.getFilteredProfiles(altType)
                        );

                        profiles.forEach(profile => {
                            selectedIdSet[
                                getSuffixOfMolecularProfile(profile)
                            ] = true;
                        });
                    }
                } else {
                    const altTypes: MolecularProfile['molecularAlterationType'][] = [
                        'MUTATION_EXTENDED',
                        'STRUCTURAL_VARIANT',
                        'COPY_NUMBER_ALTERATION',
                    ];
                    altTypes.forEach(altType => {
                        _(this.getFilteredProfiles(altType))
                            .groupBy(profile => profile.studyId)
                            .forEach(profiles => {
                                selectedIdSet[
                                    getSuffixOfMolecularProfile(profiles[0])
                                ] = true;
                            });
                    });
                }
            } else {
                selectedIdSet = _.fromPairs(this.profileFilterSet.toJSON());
            }
        }
        return selectedIdSet;
    }

    // used when single study is selected
    @action selectMolecularProfile(
        profile: MolecularProfile,
        checked: boolean
    ) {
        let groupProfiles = this.getFilteredProfiles(
            profile.molecularAlterationType
        );

        if (this.profileFilterSet === undefined) {
            this.profileFilterSet = observable.map(this.selectedProfileIdSet);
        }

        groupProfiles.forEach(profile =>
            this.profileFilterSet!.delete(getSuffixOfMolecularProfile(profile))
        );

        if (checked) {
            this.profileFilterSet!.set(
                getSuffixOfMolecularProfile(profile),
                true
            );
        }
    }

    // used when multi-study is selected
    @action setProfileTypes(profileTypes: string[], checked: boolean) {
        if (this.profileFilterSet === undefined) {
            this.profileFilterSet = observable.map(this.selectedProfileIdSet);
        }

        profileTypes.forEach(profileType => {
            if (checked) {
                this.profileFilterSet!.set(profileType, true);
            } else {
                this.profileFilterSet!.delete(profileType);
            }
        });
    }

    @observable zScoreThreshold: string = '2.0';

    @observable rppaScoreThreshold: string = '2.0';

    // sample list id
    @observable private _selectedSampleListId?: string = undefined; // user selection
    @computed
    public get selectedSampleListId() {
        // check to make sure selected sample list belongs to study
        // OR is custom list
        const matchesSelectedStudy =
            // custom list
            this._selectedSampleListId === CUSTOM_CASE_LIST_ID ||
            // if multiple studies selected, then we look for list classes enumerated in CaseSetId enum
            _.values(CaseSetId).includes(
                this._selectedSampleListId as CaseSetId
            ) ||
            // otherwise, we check that this sample list belongs to a selected study
            this.sampleListInSelectedStudies.result.some(
                sampleList =>
                    sampleList.sampleListId === this._selectedSampleListId
            );

        return matchesSelectedStudy
            ? this._selectedSampleListId
            : this.defaultSelectedSampleListId;
    }

    public set selectedSampleListId(value) {
        this._selectedSampleListId = value;
    }

    @computed
    public get selectedSampleList() {
        return this.selectedSampleListId
            ? this.dict_sampleListId_sampleList[this.selectedSampleListId]
            : undefined;
    }

    @observable caseIds = '';

    // this variable is used to set set custom case ids if the query is a shared virtual study query
    @observable _defaultStudySampleMap: { [id: string]: string[] } = {};

    @observable _caseIdsMode: 'sample' | 'patient' = 'sample';
    @computed get caseIdsMode() {
        return this.selectedSampleListId === CUSTOM_CASE_LIST_ID
            ? this._caseIdsMode
            : 'sample';
    }

    set caseIdsMode(value) {
        this._caseIdsMode = value;
    }

    @observable _geneQuery = '';
    get geneQuery() {
        return this._geneQuery;
    }

    set geneQuery(value: string) {
        // clear error when gene query is modified
        this.geneQueryErrorDisplayStatus = Focus.Unfocused;
        this._geneQuery = value;
    }

    @observable private rawGenesetQuery = '';
    get genesetQuery() {
        return this.rawGenesetQuery.toUpperCase();
    }

    set genesetQuery(value: string) {
        // clear error when gene query is modified
        this.genesetQueryErrorDisplayStatus = Focus.Unfocused;
        this.rawGenesetQuery = value;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // VISUAL OPTIONS
    ////////////////////////////////////////////////////////////////////////////////

    @observable geneQueryErrorDisplayStatus = Focus.Unfocused;
    @observable genesetQueryErrorDisplayStatus = Focus.Unfocused;
    @observable showMutSigPopup = false;
    @observable showGisticPopup = false;
    @observable showGenesetsHierarchyPopup = false;
    @observable showGenesetsVolcanoPopup = false;
    @observable priorityStudies = ServerConfigHelpers.parseConfigFormat(
        getServerConfig().priority_studies
    );
    @observable showSelectedStudiesOnly: boolean = false;
    @observable.shallow selectedCancerTypeIds: string[] = [];
    @observable clickAgainToDeselectSingle: boolean = true;
    @observable searchExampleMessage = '';
    @observable volcanoPlotSelectedPercentile: {
        label: string;
        value: string;
    } = { label: '75%', value: '75' };

    @observable private _maxTreeDepth: number = parseInt(
        getServerConfig().skin_query_max_tree_depth!,
        10
    );
    @computed get maxTreeDepth() {
        return this.forDownloadTab && this._maxTreeDepth > 0
            ? 1
            : this._maxTreeDepth;
    }

    set maxTreeDepth(value) {
        this._maxTreeDepth = value;
    }

    @computed get userLoggedIn() {
        return getBrowserWindow().globalStores.appStore.isLoggedIn;
    }

    get appStore(): AppStore {
        return getBrowserWindow().globalStores.appStore as AppStore;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // REMOTE DATA
    ////////////////////////////////////////////////////////////////////////////////

    readonly cancerTypes = remoteData(
        {
            invoke: async () => {
                return getClient()
                    .getAllCancerTypesUsingGET({})
                    .then(data => {
                        // all types should have parent. this is a correction for a data issue
                        // where there IS a top level (parent=null) item
                        return data.filter(cancerType => {
                            return cancerType.parent !== 'null';
                        });
                    });
            },
        },
        []
    );

    readonly cancerStudies = remoteData(
        getClient().getAllStudiesUsingGET({ projection: 'DETAILED' }),
        []
    );

    readonly cancerStudyIdsSet = remoteData<{ [studyId: string]: boolean }>({
        await: () => [this.cancerStudies],
        invoke: async () => {
            return stringListToSet(
                this.cancerStudies.result.map(x => x.studyId)
            );
        },
        default: {},
    });

    readonly cancerStudyTags = remoteData({
        await: () => [this.cancerStudies],
        invoke: async () => {
            if (getServerConfig().enable_study_tags) {
                const studyIds = this.cancerStudies.result
                    .filter(s => s.readPermission)
                    .map(s => s.studyId);
                return getClient().getTagsForMultipleStudiesUsingPOST({
                    studyIds,
                });
            } else {
                return [];
            }
        },
        default: [],
    });

    private readonly physicalStudiesIdsSet = remoteData<{
        [studyId: string]: string[];
    }>({
        await: () => [this.cancerStudies],
        invoke: async () => {
            return this.cancerStudies.result.reduce(
                (obj: { [studyId: string]: string[] }, item) => {
                    obj[item.studyId] = [item.studyId];
                    return obj;
                },
                {}
            );
        },
        default: {},
    });

    private readonly virtualStudiesIdsSet = remoteData<{
        [studyId: string]: string[];
    }>({
        await: () => [this.userVirtualStudies],
        invoke: async () => {
            return this.userVirtualStudies.result.reduce(
                (obj: { [studyId: string]: string[] }, item) => {
                    obj[item.id] = [item.id];
                    return obj;
                },
                {}
            );
        },
        default: {},
    });

    readonly sharedQueriedStudiesSet = remoteData<{
        [studyId: string]: string[];
    }>({
        await: () => [this.physicalStudiesIdsSet, this.virtualStudiesIdsSet],
        invoke: async () => {
            let physicalStudiesIdsSet: { [studyId: string]: string[] } = this
                .physicalStudiesIdsSet.result;
            let virtualStudiesIdsSet: { [studyId: string]: string[] } = this
                .virtualStudiesIdsSet.result;

            let knownSelectableIdsSet: {
                [studyId: string]: string[];
            } = Object.assign({}, physicalStudiesIdsSet, virtualStudiesIdsSet);

            //queried id that are not selectable(this would mostly be shared virtual study)
            const unknownQueriedIds: string[] = Array.from(
                this._defaultSelectedIds.keys()
            ).filter(id => !knownSelectableIdsSet[id]);

            let result: { [studyId: string]: string[] } = {};

            await Promise.all(
                unknownQueriedIds.map(id => {
                    return new Promise<void>((resolve, reject) => {
                        sessionServiceClient
                            .getVirtualStudy(id)
                            .then(virtualStudy => {
                                //physical study ids iin virtual study
                                let ids = virtualStudy.data.studies.map(
                                    study => study.id
                                );
                                //unknown/unauthorized studies within virtual study
                                let unKnownPhysicalStudyIds = ids.filter(
                                    id => !physicalStudiesIdsSet[id]
                                );
                                if (_.isEmpty(unKnownPhysicalStudyIds)) {
                                    result[id] = ids;
                                }
                                resolve();
                            })
                            .catch(() => {
                                //error is thrown when the id is not found
                                resolve();
                            });
                    });
                })
            );
            return result;
        },
        default: {},
    });

    public readonly physicalStudiesSet = remoteData<{
        [studyId: string]: CancerStudy;
    }>({
        await: () => [this.cancerStudies],
        invoke: async () => {
            return this.cancerStudies.result.reduce(
                (obj: { [studyId: string]: CancerStudy }, item) => {
                    obj[item.studyId] = item;
                    return obj;
                },
                {} as { [studyId: string]: CancerStudy }
            );
        },
        default: {},
    });

    public readonly selectedPhysicalStudies = remoteData({
        await: () => [this.physicalStudiesSet],
        invoke: async () => {
            return this.physicalStudyIdsInSelection.map(
                studyId => this.physicalStudiesSet.result[studyId]
            );
        },
    });

    readonly userVirtualStudies = remoteData(async () => {
        if (
            ServerConfigHelpers.sessionServiceIsEnabled() &&
            this.userLoggedIn
        ) {
            try {
                const studies = await sessionServiceClient.getUserVirtualStudies();
                return studies;
            } catch (ex) {
                return [];
            }
        } else {
            return [];
        }
    }, []);

    readonly publicVirtualStudies = remoteData(async () => {
        if (ServerConfigHelpers.sessionServiceIsEnabled()) {
            try {
                const studies = await sessionServiceClient.getPublicVirtualStudies();
                return studies;
            } catch (ex) {
                return [];
            }
        } else {
            return [];
        }
    }, []);

    private readonly userVirtualStudiesSet = remoteData<{
        [studyId: string]: VirtualStudy;
    }>({
        await: () => [this.userVirtualStudies],
        invoke: async () => {
            return this.userVirtualStudies.result.reduce(
                (obj: { [studyId: string]: VirtualStudy }, item) => {
                    obj[item.id] = item;
                    return obj;
                },
                {}
            );
        },
        default: {},
    });

    private readonly publicVirtualStudiesSet = remoteData<{
        [studyId: string]: VirtualStudy;
    }>({
        await: () => [this.publicVirtualStudies],
        invoke: async () => {
            return this.publicVirtualStudies.result.reduce(
                (obj: { [studyId: string]: VirtualStudy }, item) => {
                    obj[item.id] = item;
                    return obj;
                },
                {}
            );
        },
        default: {},
    });

    private readonly sharedVirtualStudiesSet = remoteData<{
        [studyId: string]: VirtualStudy;
    }>({
        await: () => [
            this.physicalStudiesSet,
            this.userVirtualStudiesSet,
            this.publicVirtualStudiesSet,
        ],
        invoke: async () => {
            let physicalStudiesIdsSet = this.physicalStudiesSet.result;
            let virtualStudiesIdsSet = this.userVirtualStudiesSet.result;
            let publicStudiesIdsSet = this.publicVirtualStudiesSet.result;

            let knownSelectableIds = Object.assign(
                [],
                Object.keys(physicalStudiesIdsSet),
                Object.keys(virtualStudiesIdsSet),
                Object.keys(publicStudiesIdsSet)
            );

            //queried id that are not selectable(this would mostly be shared virtual study)
            const unknownQueriedIds: string[] = Array.from(
                this._defaultSelectedIds.keys()
            ).filter(id => !_.includes(knownSelectableIds, id));

            let result: { [studyId: string]: VirtualStudy } = {};

            await Promise.all(
                unknownQueriedIds.map(id => {
                    return new Promise<void>((resolve, reject) => {
                        sessionServiceClient
                            .getVirtualStudy(id)
                            .then(virtualStudy => {
                                //physical study ids iin virtual study
                                let ids = virtualStudy.data.studies.map(
                                    study => study.id
                                );
                                //unknown/unauthorized studies within virtual study
                                let unKnownPhysicalStudyIds = ids.filter(
                                    id => !physicalStudiesIdsSet[id]
                                );
                                if (unKnownPhysicalStudyIds.length === 0) {
                                    result[id] = virtualStudy;
                                }
                                resolve();
                            })
                            .catch(() => {
                                //error is thrown when the id is not found
                                resolve();
                            });
                    });
                })
            );
            return result;
        },
        default: {},
    });

    //this is mainly used when custom case set is selected
    private readonly selectedStudyToSampleSet = remoteData<{
        [id: string]: { [id: string]: boolean };
    }>({
        await: () => [
            this.userVirtualStudiesSet,
            this.sharedVirtualStudiesSet,
            this.publicVirtualStudiesSet,
        ],
        invoke: async () => {
            let studyToSampleSet: {
                [id: string]: { [id: string]: boolean };
            } = {};
            const physicalStudyIds = _.filter(
                this.allSelectedStudyIds,
                studyId => this.physicalStudiesSet.result[studyId]
            );

            if (this._allSelectedStudyIds.size !== physicalStudyIds.length) {
                await Promise.all(
                    _.map(physicalStudyIds, studyId => {
                        return getClient()
                            .getAllSamplesInStudyUsingGET({
                                studyId: studyId,
                            })
                            .then(samples => {
                                studyToSampleSet[studyId] = stringListToSet(
                                    samples.map(sample => sample.sampleId)
                                );
                            });
                    })
                );

                const _vs = {
                    ...this.userVirtualStudiesSet.result,
                    ...this.sharedVirtualStudiesSet.result,
                    ...this.publicVirtualStudiesSet.result,
                };

                for (const id of this._allSelectedStudyIds.keys()) {
                    if (_vs[id]) {
                        let virtualStudy = _vs[id];
                        virtualStudy.data.studies.forEach(study => {
                            if (studyToSampleSet[study.id] === undefined) {
                                studyToSampleSet[study.id] = stringListToSet(
                                    study.samples
                                );
                            }
                        });
                    }
                }
            } else {
                physicalStudyIds.forEach(studyId => {
                    studyToSampleSet[studyId] = {};
                });
            }
            return studyToSampleSet;
        },
        default: {},
    });

    public readonly selectableStudiesSet = remoteData<{
        [studyId: string]: string[];
    }>({
        await: () => [this.physicalStudiesSet, this.selectedStudyToSampleSet],
        invoke: async () => {
            let result: { [studyId: string]: string[] } = {};

            _.each(this.physicalStudiesSet.result, (study, studyId) => {
                if (isQueriedStudyAuthorized(study)) {
                    result[studyId] = [studyId];
                }
            });

            _.each(
                this.userVirtualStudiesSet.result,
                (virtualStudy, studyId) => {
                    result[studyId] = [studyId];
                }
            );

            _.each(
                this.sharedVirtualStudiesSet.result,
                (virtualStudy, studyId) => {
                    result[studyId] = virtualStudy.data.studies.map(
                        study => study.id
                    );
                }
            );
            _.each(
                this.publicVirtualStudiesSet.result,
                (virtualStudy, studyId) => {
                    result[studyId] = [studyId];
                }
            );

            return result;
        },
        default: {},
        onResult: () => {
            // set case ids when case_set_id is not CUSTOM_CASE_LIST_ID(-1)
            if (this.selectedSampleListId !== CUSTOM_CASE_LIST_ID) {
                const sharedVirtualStudiesSet = this.sharedVirtualStudiesSet
                    .result;
                let sharedIds: string[] = _.filter(
                    [...this._allSelectedStudyIds.keys()],
                    id => sharedVirtualStudiesSet[id] !== undefined
                );

                //this block is executed when shared virtual study is queried and case_set_id is not set
                //in this scenario we override some parameters to correctly show selected cases to user
                if (!_.isEmpty(sharedIds)) {
                    let studySampleMap = this._defaultStudySampleMap;
                    if (
                        studySampleMap === undefined ||
                        _.isEmpty(studySampleMap)
                    ) {
                        studySampleMap = _.reduce(
                            this.selectedStudyToSampleSet.result,
                            (acc, next, studyId) => {
                                acc[studyId] = _.keys(next);
                                return acc;
                            },
                            {} as { [id: string]: string[] }
                        );
                    }

                    if (_.some(studySampleMap, samples => samples.length > 0)) {
                        this.setCaseIds(studySampleMap);
                    }
                } else {
                    this.caseIds = '';
                }
            }
        },
    });

    @action setCaseIds(studySampleMap: { [id: string]: string[] }) {
        this.selectedSampleListId = CUSTOM_CASE_LIST_ID;
        this.caseIdsMode = 'sample';
        this.caseIds = _.flatten<string>(
            Object.keys(studySampleMap).map(studyId => {
                return studySampleMap[studyId].map(
                    (sampleId: string) => `${studyId}:${sampleId}`
                );
            })
        ).join('\n');
    }

    // get all selected ids(that are set) that are not selectable in the cancer tree
    // this may be any unknow and unauthorized studies trying to query
    readonly unknownStudyIds = remoteData<string[]>({
        await: () => [this.selectableStudiesSet],
        invoke: async () => {
            const _selectableStudiesSet = this.selectableStudiesSet.result;
            let ids: string[] = [...this._allSelectedStudyIds.keys()];
            return ids.filter(id => !(id in _selectableStudiesSet));
        },
        default: [],
    });

    readonly molecularProfilesInSelectedStudies = remoteData<
        MolecularProfile[]
    >({
        invoke: async () => {
            const profiles: CacheData<
                MolecularProfile[],
                string
            >[] = await this.molecularProfilesInStudyCache.getPromise(
                this.physicalStudyIdsInSelection,
                true
            );
            return _.flatten(profiles.map(d => (d.data ? d.data : [])));
        },
        default: [],
        onResult: () => {
            if (
                !this.initiallySelected.profileIds ||
                this.studiesHaveChangedSinceInitialization
            ) {
                this.profileFilterSet = undefined;
            }
        },
    });

    readonly sampleListInSelectedStudies = remoteData<SampleList[]>({
        await: () => {
            return this.physicalStudyIdsInSelection.map(studyId => {
                return this.sampleListsInStudyCache.get(studyId);
            });
        },
        invoke: async () => {
            return _.reduce(
                this.physicalStudyIdsInSelection,
                (acc: SampleList[], studyId) => {
                    let sampleLists = this.sampleListsInStudyCache.get(studyId)
                        .result;
                    if (!_.isUndefined(sampleLists)) {
                        acc = acc.concat(sampleLists);
                    }
                    return acc;
                },
                []
            );
        },
        default: [],
    });

    readonly validProfileIdSetForSelectedStudies = remoteData({
        await: () => [this.molecularProfilesInSelectedStudies],
        invoke: async () => {
            const validProfileIds: string[] = _(
                this.molecularProfilesInSelectedStudies.result
            )
                .filter(
                    molecularProfile =>
                        molecularProfile.showProfileInAnalysisTab
                )
                .groupBy(molecularProfile => molecularProfile.studyId)
                .flatMap(studyProfiles => {
                    return _(studyProfiles)
                        .groupBy(
                            profile =>
                                profile.molecularAlterationType +
                                profile.datatype
                        )
                        .reduce((agg: string[], alterationTypeProfiles) => {
                            const profileTypes = alterationTypeProfiles.map(
                                p => {
                                    return getSuffixOfMolecularProfile(p);
                                }
                            );
                            agg.push(...profileTypes);
                            return agg;
                        }, []);
                })
                .value();

            return stringListToSet(validProfileIds);
        },
        default: {},
    });

    readonly profiledSamplesCount = remoteData<{
        w_mut: number;
        w_cna: number;
        w_mut_cna: number;
        all: number;
    }>({
        await: () => [this.sampleListInSelectedStudies],
        invoke: async () => {
            return categorizedSamplesCount(
                this.sampleListInSelectedStudies.result,
                this.selectableSelectedStudyIds,
                this.selectedVirtualStudies
            );
        },
        default: {
            w_mut: 0,
            w_cna: 0,
            w_mut_cna: 0,
            all: 0,
        },
    });

    @computed get sampleCountForSelectedStudies() {
        return _.sumBy(this.selectableSelectedStudies, s => s.allSampleCount);
    }

    @computed get sampleCountForAllStudies() {
        return _.sumBy(this.selectableStudies, s => s.allSampleCount);
    }

    readonly sampleLists = remoteData<SampleList[]>({
        invoke: async () => {
            if (!this.isSingleNonVirtualStudySelected) {
                return [];
            }
            this.sampleListsInStudyCache.get(this.selectableSelectedStudyIds[0])
                .result!;
            let sampleLists = await this.sampleListsInStudyCache.get(
                this.selectableSelectedStudyIds[0]
            ).result!;
            return _.sortBy(sampleLists, sampleList => sampleList.name);
        },
        default: [],
    });

    readonly mutSigForSingleStudy = remoteData({
        invoke: async () => {
            if (!this.isSingleNonVirtualStudySelected) {
                return [];
            }
            return await internalClient.getSignificantlyMutatedGenesUsingGET({
                studyId: this.selectableSelectedStudyIds[0],
            });
        },
        default: [],
    });

    readonly gisticForSingleStudy = remoteData({
        invoke: async () => {
            if (!this.isSingleNonVirtualStudySelected) {
                return [];
            }
            return await internalClient.getSignificantCopyNumberRegionsUsingGET(
                {
                    studyId: this.selectableSelectedStudyIds[0],
                }
            );
        },
        default: [],
    });

    readonly genes = remoteData({
        invoke: () => this.invokeGenesLater(this.geneIds),
        default: { found: [], suggestions: [] },
    });

    readonly genesets = remoteData({
        invoke: () => this.invokeGenesetsLater(this.genesetIds),
        default: { found: [], invalid: [] },
    });

    private invokeGenesLater = debounceAsync(
        async (
            geneIds: string[]
        ): Promise<{
            found: Gene[];
            suggestions: GeneReplacement[];
        }> => {
            let [entrezIds, hugoIds] = _.partition(_.uniq(geneIds), isInteger);

            let getEntrezResults = async () => {
                let found: Gene[];
                if (entrezIds.length)
                    found = await getClient().fetchGenesUsingPOST({
                        geneIdType: 'ENTREZ_GENE_ID',
                        geneIds: entrezIds,
                    });
                else found = [];
                let missingIds = _.difference(
                    entrezIds,
                    found.map(gene => gene.entrezGeneId + '')
                );
                let removals = missingIds.map(entrezId => ({
                    alias: entrezId,
                    genes: [],
                }));
                let replacements = found.map(gene => ({
                    alias: gene.entrezGeneId + '',
                    genes: [gene],
                }));
                let suggestions = [...removals, ...replacements];
                return { found, suggestions };
            };

            let getHugoResults = async () => {
                let found: Gene[];
                if (hugoIds.length)
                    found = await getClient().fetchGenesUsingPOST({
                        geneIdType: 'HUGO_GENE_SYMBOL',
                        geneIds: hugoIds,
                    });
                else found = [];
                let missingIds = _.difference(
                    hugoIds,
                    found.map(gene => gene.hugoGeneSymbol)
                );
                let suggestions = await Promise.all(
                    missingIds.map(alias => this.getGeneSuggestions(alias))
                );
                return { found, suggestions };
            };

            let [entrezResults, hugoResults] = await Promise.all([
                getEntrezResults(),
                getHugoResults(),
            ]);
            return {
                found: [...entrezResults.found, ...hugoResults.found],
                suggestions: [
                    ...entrezResults.suggestions,
                    ...hugoResults.suggestions,
                ],
            };
        },
        500
    );

    private invokeGenesetsLater = debounceAsync(
        async (
            genesetIds: string[]
        ): Promise<{
            found: Geneset[];
            invalid: string[];
        }> => {
            if (genesetIds.length > 0) {
                const found = await internalClient.fetchGenesetsUsingPOST({
                    genesetIds: genesetIds,
                });
                const invalid = _.difference(
                    genesetIds,
                    found.map(geneset => geneset.genesetId)
                );
                return { found, invalid };
            } else {
                return Promise.resolve({ found: [], invalid: [] });
            }
        },
        500
    );

    @memoize
    async getGeneSuggestions(alias: string): Promise<GeneReplacement> {
        return {
            alias,
            genes: await getClient().getAllGenesUsingGET({ alias }),
        };
    }

    @memoize
    getSamplesForStudyAndPatient(studyId: string, patientId: string) {
        return getClient()
            .getAllSamplesOfPatientInStudyUsingGET({ studyId, patientId })
            .then(
                samples => ({ studyId, patientId, samples, error: undefined }),
                error => ({
                    studyId,
                    patientId,
                    samples: [] as Sample[],
                    error,
                })
            );
    }

    asyncCustomCaseSet = remoteData<{ sampleId: string; studyId: string }[]>({
        invoke: async () => {
            if (
                this.selectedSampleListId !== CUSTOM_CASE_LIST_ID ||
                this.caseIds.trim().length === 0
            )
                return [];
            return this.invokeCustomCaseSetLater({
                isVirtualStudySelected: this.isVirtualStudySelected,
                caseIds: this.caseIds,
                caseIdsMode: this.caseIdsMode,
            });
        },
        default: [],
    });

    private invokeCustomCaseSetLater = debounceAsync(
        async (
            params: Pick<
                this,
                'isVirtualStudySelected' | 'caseIds' | 'caseIdsMode'
            >
        ) => {
            let singleSelectedStudyId = '';
            if (this.isSingleNonVirtualStudySelected) {
                singleSelectedStudyId = this.selectableSelectedStudyIds[0];
            }
            let entities = params.caseIds.trim().split(/\s+/g);
            const studyIdsInSelectionSet = stringListToSet(
                this.physicalStudyIdsInSelection
            );
            const cases: { id: string; study: string }[] = entities.map(
                entity => {
                    let splitEntity = entity.split(':');
                    if (splitEntity.length === 1) {
                        // no study specified
                        if (singleSelectedStudyId) {
                            // if only one study selected, fill it in
                            return {
                                id: entity,
                                study: singleSelectedStudyId,
                            };
                        } else {
                            // otherwise, throw error
                            throw new Error(
                                `No study specified for ${this.caseIdsMode} id: ${entity}, and more than one study selected for query.`
                            );
                        }
                    } else if (splitEntity.length === 2) {
                        const study = splitEntity[0];
                        const id = splitEntity[1];
                        if (!studyIdsInSelectionSet[study]) {
                            let virtualStudyMessagePart = '';
                            if (this.isVirtualStudySelected) {
                                virtualStudyMessagePart =
                                    ', nor part of a selected Saved Study';
                            }
                            throw new Error(
                                `Study ${study} is not selected${virtualStudyMessagePart}.`
                            );
                        }
                        return {
                            id,
                            study,
                        };
                    } else {
                        throw new Error(`Input error for entity: ${entity}.`);
                    }
                }
            );
            const caseOrder = stringListToIndexSet(
                cases.map(x => `${x.study}:${x.id}`)
            );
            let retSamples: { sampleId: string; studyId: string }[] = [];
            const validIds: { [studyColonId: string]: boolean } = {};
            let invalidIds: { id: string; study: string }[] = [];
            if (params.caseIdsMode === 'sample') {
                const sampleIdentifiers = cases.map(c => ({
                    studyId: c.study,
                    sampleId: c.id,
                }));
                if (sampleIdentifiers.length) {
                    let sampleObjs = await chunkMapReduce(
                        sampleIdentifiers,
                        chunk =>
                            getClient().fetchSamplesUsingPOST({
                                sampleFilter: {
                                    sampleIdentifiers: chunk,
                                } as SampleFilter,
                                projection: 'SUMMARY',
                            }),
                        990
                    );
                    // sort by input order
                    sampleObjs = _.sortBy(
                        sampleObjs,
                        sampleObj =>
                            caseOrder[
                                `${sampleObj.studyId}:${sampleObj.sampleId}`
                            ]
                    );

                    for (const sample of sampleObjs) {
                        retSamples.push({
                            studyId: sample.studyId,
                            sampleId: sample.sampleId,
                        });
                        validIds[`${sample.studyId}:${sample.sampleId}`] = true;
                    }
                }
            } else {
                // convert patient IDs to sample IDs
                const samplesPromises = cases.map(c =>
                    this.getSamplesForStudyAndPatient(c.study, c.id)
                );
                let result: {
                    studyId: string;
                    patientId: string;
                    samples: Sample[];
                    error?: Error;
                }[] = await Promise.all(samplesPromises);
                // sort by input order
                result = _.sortBy(
                    result,
                    obj => caseOrder[`${obj.studyId}:${obj.patientId}`]
                );

                for (const { studyId, patientId, samples, error } of result) {
                    if (!error && samples.length) {
                        retSamples = retSamples.concat(
                            samples.map(sample => {
                                validIds[
                                    `${sample.studyId}:${sample.patientId}`
                                ] = true;
                                return {
                                    studyId: sample.studyId,
                                    sampleId: sample.sampleId,
                                };
                            })
                        );
                    }
                }
            }

            invalidIds = invalidIds.concat(
                cases.filter(x => !validIds[`${x.study}:${x.id}`])
            );

            let selectedStudyToSampleSet = this.selectedStudyToSampleSet.result;

            //check if the valid samples are in selectable samples set
            //this is when a virtual study(which would have subset of samples) is selected
            retSamples.forEach(obj => {
                //if selectedStudyToSampleSet[obj.studyId] is empty indicates that all samples in that study are selectable
                if (
                    selectedStudyToSampleSet[obj.studyId] &&
                    !_.isEmpty(selectedStudyToSampleSet[obj.studyId])
                ) {
                    if (!selectedStudyToSampleSet[obj.studyId][obj.sampleId]) {
                        invalidIds.push({
                            id: obj.sampleId,
                            study: obj.studyId,
                        });
                    }
                }
            });

            if (invalidIds.length) {
                if (this.isSingleNonVirtualStudySelected) {
                    throw new Error(
                        `Invalid ${params.caseIdsMode}${
                            invalidIds.length > 1 ? 's' : ''
                        } for the selected cancer study: ${invalidIds
                            .map(x => x.id)
                            .join(', ')}`
                    );
                } else {
                    throw new Error(
                        `Invalid (study, ${params.caseIdsMode}) pair${
                            invalidIds.length > 1 ? 's' : ''
                        }: ${invalidIds
                            .map(x => `(${x.study}, ${x.id})`)
                            .join(', ')}
						`
                    );
                }
            }

            return retSamples;
        },
        500
    );

    ////////////////////////////////////////////////////////////////////////////////
    // DERIVED DATA
    ////////////////////////////////////////////////////////////////////////////////

    // CANCER STUDY

    @cached @computed get treeData() {
        return new CancerStudyTreeData({
            cancerTypes: this.cancerTypes.result,
            studies: this.cancerStudies.result,
            allStudyTags: this.cancerStudyTags.result,
            priorityStudies: this.priorityStudies,
            virtualStudies: this.forDownloadTab
                ? []
                : this.userVirtualStudies.result,
            publicVirtualStudies: this.forDownloadTab
                ? []
                : this.publicVirtualStudies.result,
            maxTreeDepth: this.maxTreeDepth,
        });
    }

    readonly studyListLogic = new StudyListLogic(this);

    @computed get selectedCancerTypes() {
        return this.selectedCancerTypeIds
            .map(
                id =>
                    this.treeData.map_cancerTypeId_cancerType.get(
                        id
                    ) as CancerType
            )
            .filter(_.identity);
    }

    @computed get referenceGenomes(): Set<string> {
        const studies = Array.from(this.treeData.map_node_meta.keys());
        const referenceGenomes = studies
            .map(n => (n as CancerStudy).referenceGenome)
            .filter(n => !!n);
        return new Set(referenceGenomes);
    }

    @computed get selectableSelectedStudies() {
        return this.selectableSelectedStudyIds
            .map(
                id =>
                    this.treeData.map_studyId_cancerStudy.get(id) as CancerStudy
            )
            .filter(_.identity);
    }

    @computed get selectableStudies() {
        return Array.from(this.treeData.map_studyId_cancerStudy.values());
    }

    readonly resourceDefinitions = remoteData({
        await: () => [
            this.cancerTypes,
            this.cancerStudies,
            this.cancerStudyTags,
            this.userVirtualStudies,
            this.publicVirtualStudies,
        ],
        invoke: () => {
            return getInternalClient().fetchResourceDefinitionsUsingPOST({
                studyIds: this.cancerStudies.result.map(study => study.studyId),
            });
        },
        default: [],
    });

    @action.bound setStudyFilterOptions(filterOptions: IFilterDef[]) {
        this._studyFilterOptions = filterOptions;
    }

    @computed get studyFilterOptions(): IFilterDef[] {
        return this._studyFilterOptions;
    }

    public isVirtualStudy(studyId: string): boolean {
        // if the study id doesn't correspond to one in this.cancerStudies, then its a virtual Study
        return !this.cancerStudyIdsSet.result[studyId];
    }

    public isPublicVirtualStudy(studyId: string): boolean {
        return !!this.publicVirtualStudies.result.find(ps => ps.id == studyId);
    }

    public isDeletedVirtualStudy(studyId: string): boolean {
        if (
            this.isVirtualStudy(studyId) &&
            this.deletedVirtualStudies.indexOf(studyId) > -1
        ) {
            return true;
        }
        return false;
    }

    private isSingleStudySelected(shouldBeVirtualStudy: boolean) {
        if (this.selectableSelectedStudyIds.length !== 1) {
            return false;
        }
        const selectedStudyId = this.selectableSelectedStudyIds[0];
        return this.isVirtualStudy(selectedStudyId) === shouldBeVirtualStudy;
    }

    @computed
    public get isSingleVirtualStudySelected() {
        return this.isSingleStudySelected(true);
    }

    @computed
    public get isSingleNonVirtualStudySelected() {
        return this.isSingleStudySelected(false);
    }

    @computed
    public get isMultipleNonVirtualStudiesSelected() {
        return (
            this.selectableSelectedStudyIds.filter(
                id => !this.isVirtualStudy(id)
            ).length > 1
        );
    }

    @computed
    public get getOverlappingStudiesMap() {
        const overlappingStudyGroups = getOverlappingStudies(
            this.selectableSelectedStudies
        );
        return _.chain(overlappingStudyGroups)
            .flatten()
            .keyBy((study: CancerStudy) => study.studyId)
            .value();
    }

    @computed
    public get isVirtualStudySelected() {
        let ret = false;
        for (const studyId of this.selectableSelectedStudyIds) {
            if (this.virtualStudiesMap[studyId]) {
                ret = true;
                break;
            }
        }
        return ret;
    }

    @computed
    public get isVirtualStudyQuery() {
        if (this.selectableSelectedStudyIds.length === 0) {
            return false;
        } else if (this.selectableSelectedStudyIds.length > 1) {
            return true;
        } else {
            return this.isSingleVirtualStudySelected;
        }
    }

    // MOLECULAR PROFILE

    @computed get dict_molecularProfileId_molecularProfile() {
        return _.keyBy(
            this.molecularProfilesInSelectedStudies.result,
            profile => profile.molecularProfileId
        );
    }

    getFilteredProfiles(
        molecularAlterationType: MolecularProfile['molecularAlterationType']
    ) {
        const ret = this.molecularProfilesInSelectedStudies.result.filter(
            profile => {
                if (profile.molecularAlterationType != molecularAlterationType)
                    return false;

                return profile.showProfileInAnalysisTab || this.forDownloadTab;
            }
        );

        return ret;
    }

    isProfileTypeSelected(profileType: string) {
        return this.selectedProfileIdSet[profileType] || false;
    }

    getSelectedProfileTypeFromMolecularAlterationType(
        molecularAlterationType: MolecularProfile['molecularAlterationType']
    ) {
        return this.getFilteredProfiles(molecularAlterationType)
            .map(profile => getSuffixOfMolecularProfile(profile))
            .find(profile => this.isProfileTypeSelected(profile));
    }

    get isGenesetProfileSelected() {
        const genesetProfiles = this.getFilteredProfiles('GENESET_SCORE');
        if (genesetProfiles.length > 0) {
            const profileType = getSuffixOfMolecularProfile(genesetProfiles[0]);
            return this.isProfileTypeSelected(profileType) || false;
        }
        return false;
    }

    @computed get defaultProfilesForOql() {
        if (this.molecularProfilesInSelectedStudies.isComplete) {
            return getDefaultProfilesForOql(
                this.molecularProfilesInSelectedStudies.result
            );
        }
        return undefined;
    }
    @computed get defaultMutationProfile() {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[
                AlterationTypeConstants.MUTATION_EXTENDED
            ]
        );
    }
    @computed get defaultStructuralVariantProfile() {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[
                AlterationTypeConstants.STRUCTURAL_VARIANT
            ]
        );
    }
    @computed get defaultCnaProfile() {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[
                AlterationTypeConstants.COPY_NUMBER_ALTERATION
            ]
        );
    }
    @computed get defaultMrnaProfile() {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[AlterationTypeConstants.MRNA_EXPRESSION]
        );
    }
    @computed get defaultProtProfile() {
        return (
            this.defaultProfilesForOql &&
            this.defaultProfilesForOql[AlterationTypeConstants.PROTEIN_LEVEL]
        );
    }

    // SAMPLE LIST

    @computed get defaultSelectedSampleListId() {
        if (this.isVirtualStudyQuery) {
            return ALL_CASES_LIST_ID;
        }

        if (this.selectableSelectedStudyIds.length !== 1) return undefined;

        let studyId = this.selectableSelectedStudyIds[0];
        let mutSelect = this.getSelectedProfileTypeFromMolecularAlterationType(
            'MUTATION_EXTENDED'
        );
        let cnaSelect = this.getSelectedProfileTypeFromMolecularAlterationType(
            'COPY_NUMBER_ALTERATION'
        );
        let expSelect = this.getSelectedProfileTypeFromMolecularAlterationType(
            'MRNA_EXPRESSION'
        );
        let rppaSelect = this.getSelectedProfileTypeFromMolecularAlterationType(
            'PROTEIN_LEVEL'
        );
        let sampleListId = studyId + '_all';

        if (mutSelect && cnaSelect && !expSelect && !rppaSelect)
            sampleListId = studyId + '_cnaseq';
        else if (mutSelect && !cnaSelect && !expSelect && !rppaSelect)
            sampleListId = studyId + '_sequenced';
        else if (!mutSelect && cnaSelect && !expSelect && !rppaSelect)
            sampleListId = studyId + '_cna';
        else if (!mutSelect && !cnaSelect && expSelect && !rppaSelect) {
            if (this.isProfileTypeSelected('mrna_median_Zscores'))
                sampleListId = studyId + '_mrna';
            else if (this.isProfileTypeSelected('rna_seq_mrna_median_Zscores'))
                sampleListId = studyId + '_rna_seq_mrna';
            else if (
                this.isProfileTypeSelected('rna_seq_v2_mrna_median_Zscores')
            )
                sampleListId = studyId + '_rna_seq_v2_mrna';
        } else if ((mutSelect || cnaSelect) && expSelect && !rppaSelect)
            sampleListId = studyId + '_3way_complete';
        else if (!mutSelect && !cnaSelect && !expSelect && rppaSelect)
            sampleListId = studyId + '_rppa';

        // BEGIN HACK if not found
        if (!this.dict_sampleListId_sampleList[sampleListId]) {
            if (sampleListId === studyId + '_cnaseq')
                sampleListId = studyId + '_cna_seq';
            else if (sampleListId === studyId + '_3way_complete')
                sampleListId = studyId + '_complete';
        }
        // END HACK

        // if still not found
        if (!this.dict_sampleListId_sampleList[sampleListId])
            sampleListId = studyId + '_all';

        return sampleListId;
    }

    @computed get dict_sampleListId_sampleList(): _.Dictionary<
        SampleList | undefined
    > {
        return _.keyBy(
            this.sampleLists.result,
            sampleList => sampleList.sampleListId
        );
    }

    // GENES

    @computed get oql(): {
        query: SingleGeneQuery[];
        error?: { start: number; end: number; message: string };
    } {
        try {
            return {
                query: this.geneQuery
                    ? parseOQLQuery(this.geneQuery.trim().toUpperCase())
                    : [],
                error: undefined,
            };
        } catch (error) {
            if (error.name !== 'SyntaxError')
                return {
                    query: [],
                    error: { start: 0, end: 0, message: `Unexpected ${error}` },
                };

            let {
                location: {
                    start: { offset },
                },
            } = error as SyntaxError;
            let near, start, end;
            if (offset === this.geneQuery.length)
                [near, start, end] = ['after', offset - 1, offset];
            else if (offset === 0)
                [near, start, end] = ['before', offset, offset + 1];
            else [near, start, end] = ['at', offset, offset + 1];
            let message = `OQL syntax error ${near} selected character; please fix and submit again.`;
            return {
                query: [],
                error: { start, end, message },
            };
        }
    }

    @computed get geneIds(): string[] {
        try {
            return this.oql.query.map(line => line.gene);
        } catch (e) {
            return [];
        }
    }

    // GENE SETS
    @computed get genesetIdsQuery(): {
        query: GenesetId[];
        error?: { start: number; end: number; message: string };
    } {
        try {
            const queriedGenesets: GenesetId[] = this.genesetQuery
                ? this.genesetQuery.split(/[ \n]+/)
                : [];
            return {
                query: queriedGenesets,
                error: undefined,
            };
        } catch (error) {
            if (error.name !== 'SyntaxError')
                return {
                    query: [],
                    error: { start: 0, end: 0, message: `Unexpected ${error}` },
                };

            let {
                location: {
                    start: { offset },
                },
            } = error as SyntaxError;
            let near, start, end;
            if (offset === this.geneQuery.length)
                [near, start, end] = ['after', offset - 1, offset];
            else if (offset === 0)
                [near, start, end] = ['before', offset, offset + 1];
            else [near, start, end] = ['at', offset, offset + 1];
            const message = `OQL syntax error ${near} selected character; please fix and submit again.`;
            return {
                query: [],
                error: { start, end, message },
            };
        }
    }

    @computed get genesetIds(): GenesetId[] {
        return this.genesetIdsQuery.query;
    }

    readonly hierarchyData = remoteData<any[]>({
        invoke: async () => {
            const hierarchyData = await getHierarchyData(
                this.getFilteredProfiles('GENESET_SCORE')[0].molecularProfileId,
                Number(this.volcanoPlotSelectedPercentile.value),
                0,
                1,
                this.selectedSampleListId
            );
            return hierarchyData;
        },
    });

    readonly volcanoPlotTableData = remoteData<Geneset[]>({
        await: () => [this.hierarchyData],
        invoke: async () => {
            return getGenesetsFromHierarchy(this.hierarchyData.result!);
        },
    });

    @computed get minYVolcanoPlot(): number | undefined {
        if (this.volcanoPlotTableData.result) {
            return getVolcanoPlotMinYValue(this.volcanoPlotTableData.result);
        } else {
            return undefined;
        }
    }

    @observable map_genesets_selected_volcano = new ObservableMap<
        string,
        boolean
    >();

    @computed get volcanoPlotGraphData():
        | { x: number; y: number; fill: string }[]
        | undefined {
        if (this.volcanoPlotTableData.result) {
            return getVolcanoPlotData(
                this.volcanoPlotTableData.result,
                this.map_genesets_selected_volcano
            );
        } else {
            return undefined;
        }
    }

    // SUBMIT

    @computed get submitEnabled() {
        return (
            (!this.submitError &&
                (this.genes.isComplete || this.genesets.isComplete) &&
                this.asyncUrlParams.isComplete) ||
            !!this.oql.error ||
            !!this.genesetIdsQuery.error
        ); // to make "Please click 'Submit' to see location of error." possible
    }

    @computed get summaryEnabled() {
        return this.selectableSelectedStudyIds.length > 0;
    }

    @computed get hasSelectedStudies() {
        return this.selectableSelectedStudyIds.length > 0;
    }

    @computed get oqlMessages(): string[] {
        return getOqlMessages(this.oql.query);
    }

    /**
     * Sample count can come from the following areas:
     * 1. The sum of the samples in the selected study(s)
     * 2. The number of cases (patients or samples) in caseIds
     *     This is _approximate_. Patients can have multiple samples
     * 3. The number of samples in the selected sample list
     * 4. The number of samples in the selected profiled samples result
     */
    @computed get approxSampleCount(): number {
        const sampleListId = this.selectedSampleListId;

        if (!sampleListId) {
            return this.profiledSamplesCount.result.all;
        }

        if (sampleListId === CUSTOM_CASE_LIST_ID) {
            return this.caseIds
                ? Math.max(this.caseIds.trim().split(/\s+/g).length, 1)
                : 1;
        }

        const sampleList = this.sampleLists.result.find(
            l => l.sampleListId === sampleListId
        );
        if (sampleList) {
            return sampleList.sampleCount;
        }

        if (sampleListId in this.profiledSamplesCount.result) {
            return (this.profiledSamplesCount.result as any)[sampleListId];
        }

        return this.profiledSamplesCount.result.all;
    }

    @computed get isQueryLimitReached(): boolean {
        return (
            this.oql.query.length * this.approxSampleCount >
            getServerConfig().query_product_limit
        );
    }

    @computed get geneLimit(): number {
        return Math.floor(
            getServerConfig().query_product_limit / this.approxSampleCount
        );
    }

    @computed get isMixedReferenceGenome() {
        if (
            this.physicalStudyIdsInSelection &&
            this.physicalStudiesSet.result
        ) {
            const studies = _.map(
                this.physicalStudyIdsInSelection,
                id => this.physicalStudiesSet.result[id]
            );
            return isMixedReferenceGenome(studies);
        }
    }

    @computed get alterationTypesInOQL() {
        return getAlterationTypesInOql(this.oql.query);
    }

    @computed get submitError() {
        if (!this.selectableSelectedStudyIds.length)
            return 'Please select one or more cancer studies.';

        if (_.isEmpty(this.selectedProfileIdSet))
            return 'Please select one or more molecular profiles.';

        if (this.isSingleNonVirtualStudySelected) {
            if (
                this.alterationTypesInOQL.haveMutInQuery &&
                !this.defaultMutationProfile
            )
                return 'Mutation data query specified in OQL, but no mutation profile is available for the selected study.';
            if (
                this.alterationTypesInOQL.haveStructuralVariantInQuery &&
                !this.defaultStructuralVariantProfile
            )
                return 'Structural variant data query specified in OQL, but no structural variant profile is available for the selected study.';
            if (
                this.alterationTypesInOQL.haveCnaInQuery &&
                !this.defaultCnaProfile
            )
                return 'CNA data query specified in OQL, but no CNA profile is available in the selected study.';
            if (
                this.alterationTypesInOQL.haveMrnaInQuery &&
                !this.defaultMrnaProfile
            )
                return 'mRNA expression data query specified in OQL, but no mRNA profile is available in the selected study.';
            if (
                this.alterationTypesInOQL.haveProtInQuery &&
                !this.defaultProtProfile
            )
                return 'Protein level data query specified in OQL, but no protein level profile is available in the selected study.';
        }

        if (
            this.selectableSelectedStudyIds.length &&
            this.selectedSampleListId === CUSTOM_CASE_LIST_ID
        ) {
            if (
                this.asyncCustomCaseSet.isComplete &&
                !this.asyncCustomCaseSet.result.length
            )
                return 'Please enter at least one ID in your custom case set.';
            if (this.asyncCustomCaseSet.error)
                return 'Error in custom case set.';
        } else if (
            this.alterationTypesInOQL.haveMrnaInQuery &&
            this.selectableSelectedStudyIds.length > 1
        ) {
            return 'Expression filtering in the gene list (the EXP command) is not supported when doing cross cancer queries.';
        } else if (
            this.alterationTypesInOQL.haveProtInQuery &&
            this.selectableSelectedStudyIds.length > 1
        ) {
            return 'Protein level filtering in the gene list (the PROT command) is not supported when doing cross cancer queries.';
        }

        if (!_.isEmpty(this.selectedProfileIdSet)) {
            if (Object.keys(this.selectedProfileIdSet).length === 1) {
                if (this.isGenesetProfileSelected) {
                    //Only geneset profile selected
                    if (!this.genesetQuery.length && !this.oql.query.length) {
                        return 'Please enter one or more gene symbols and gene sets.';
                    } else if (!this.genesetQuery.length) {
                        return 'Please enter one or more gene sets or deselect gene set profiles.';
                    } else if (!this.oql.query.length) {
                        return 'Please enter one or more gene symbols.';
                    }
                } else {
                    if (!this.oql.query.length) {
                        return 'Please enter one or more gene symbols.';
                    }
                }
            } else {
                //Geneset and other genetic profiles selected
                if (this.isGenesetProfileSelected) {
                    if (!this.genesetQuery.length && !this.oql.query.length) {
                        return 'Please enter one or more gene symbols and gene sets.';
                    } else if (!this.oql.query.length) {
                        return 'Please enter one or more gene symbols.';
                    }
                } else if (!this.oql.query.length) {
                    return 'Please enter one or more gene symbols.';
                }
            }
        } else {
            if (!this.oql.query.length) {
                return 'Please enter one or more gene symbols.';
            }
        }

        if (this.isQueryLimitReached) {
            return `Please limit your queries to ${this.geneLimit} genes or fewer.`;
        }

        if (this.genes.result.suggestions.length)
            return 'Please edit the gene symbols.';

        // TDOD: remove this condition once multiple entrez gene ids is supported
        const hugoGeneSymbolSet = _.groupBy(
            this.genes.result.found,
            gene => gene.hugoGeneSymbol
        );
        const hasGenesWithMultipleEntrezGeneIds = _.some(
            hugoGeneSymbolSet,
            genes => genes.length > 1
        );
        if (hasGenesWithMultipleEntrezGeneIds) {
            return 'Please edit the gene symbols.';
        }
    }

    readonly asyncUrlParams = remoteData({
        await: () => [this.asyncCustomCaseSet],
        invoke: async () => currentQueryParams(this),
    });

    ////////////////////////////////////////////////////////////////////////////////
    // ACTIONS
    ////////////////////////////////////////////////////////////////////////////////

    /**
     * This is used to prevent selections from being cleared automatically when new data is downloaded.
     */
    public initiallySelected = {
        profileIds: false,
        sampleListId: false,
    };

    sanitizeQueryParams(str?: string) {
        return str ? decodeURIComponent(str).replace(/\+/g, '\n') : '';
    }

    @action setParamsFromUrl(
        url: string | { [k: string]: Partial<CancerStudyQueryUrlParams> }
    ) {
        let params: Partial<CancerStudyQueryUrlParams>;
        if (typeof url === 'string') {
            let urlParts = URL.parse(url, true);
            params = urlParts.query as Partial<CancerStudyQueryUrlParams>;
        } else {
            params = url; // already an object
        }

        let profileIds = [
            params.genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
            params.genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
            params.genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
            params.genetic_profile_ids_PROFILE_METHYLATION,
            params.genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION,
            params.genetic_profile_ids_PROFILE_GENESET_SCORE,
            params.genetic_profile_ids_PROFILE_GENERIC_ASSAY,
        ];

        let queriedStudies = params.cancer_study_list
            ? params.cancer_study_list.split(',')
            : params.cancer_study_id
            ? [params.cancer_study_id]
            : [];
        this.selectableSelectedStudyIds = queriedStudies;
        this._defaultSelectedIds = observable.map(
            stringListToSet(queriedStudies)
        );

        this.profileIdsFromUrl = _.compact(profileIds);
        this.zScoreThreshold = params.Z_SCORE_THRESHOLD || '2.0';
        this.rppaScoreThreshold = params.RPPA_SCORE_THRESHOLD || '2.0';
        if (params.data_priority) {
            this.dataTypePriorityFromUrl = params.data_priority;
        }
        if (params.profileFilter) {
            if (isNaN(parseInt(params.profileFilter, 10))) {
                this.profileFilterSetFromUrl = params.profileFilter.split(',');
            }
        }

        this.selectedSampleListId = params.case_set_id
            ? params.case_set_id.toString()
            : ''; // must be a string even though it's integer
        this.caseIds = this.sanitizeQueryParams(params.case_ids);
        this.caseIdsMode = 'sample'; // url always contains sample IDs
        this.geneQuery = normalizeQuery(
            decodeURIComponent(params.gene_list || '')
        );
        this.genesetQuery = normalizeQuery(
            decodeURIComponent(
                params[ResultsViewURLQueryEnum.geneset_list] || ''
            )
        );
        this.forDownloadTab = params.tab_index === 'tab_download';
        this.initiallySelected.profileIds = true;
        this.initiallySelected.sampleListId = true;
    }

    // TODO: we should be able to merge this with the above since it accepts same interface
    @action setParamsFromLocalStorage(
        legacySubmission: Partial<ResultsViewURLQuery>
    ) {
        const caseIds = legacySubmission.case_ids;
        if (caseIds) {
            if (legacySubmission.case_set_id == CUSTOM_CASE_LIST_ID) {
                this.selectedSampleListId = CUSTOM_CASE_LIST_ID;
                this.caseIdsMode = 'sample';
                this.caseIds = caseIds.replace(/\+/g, '\n');
                this.initiallySelected.sampleListId = true;
            }
        }

        if (legacySubmission.cancer_study_list) {
            for (const studyId of legacySubmission.cancer_study_list.split(
                ','
            )) {
                if (studyId !== 'null') {
                    this.setStudyIdSelected(studyId, true);
                    this._defaultSelectedIds.set(studyId, true);
                }
            }
        }
    }

    @action selectCancerType(cancerType: CancerType, multiSelect?: boolean) {
        let clickedCancerTypeId = cancerType.cancerTypeId;

        if (multiSelect) {
            if (_.includes(this.selectedCancerTypeIds, clickedCancerTypeId))
                this.selectedCancerTypeIds = _.difference(
                    this.selectedCancerTypeIds,
                    [clickedCancerTypeId]
                );
            else
                this.selectedCancerTypeIds = _.union(
                    this.selectedCancerTypeIds,
                    [clickedCancerTypeId]
                );
        } else if (
            this.clickAgainToDeselectSingle &&
            _.isEqual(toJS(this.selectedCancerTypeIds), [clickedCancerTypeId])
        ) {
            this.selectedCancerTypeIds = [];
        } else {
            this.selectedCancerTypeIds = [clickedCancerTypeId];
        }
    }

    @action setSearchText(searchText: string) {
        this.clearSelectedCancerType();
        this.searchClauses = this.queryParser.parseSearchQuery(searchText);
    }

    @action setFilterType(filter: string) {
        this.dataTypeFilters.push(filter);
    }

    @action clearSelectedCancerType() {
        this.selectedCancerTypeIds = [];
    }

    @action replaceGene(oldSymbol: string, newSymbol: string) {
        this.geneQuery = normalizeQuery(
            this.geneQuery
                .toUpperCase()
                .replace(
                    new RegExp(`\\b${oldSymbol.toUpperCase()}\\b`, 'g'),
                    () => newSymbol.toUpperCase()
                )
        );
    }

    @action replaceGeneset(oldGeneset: string, newGeneset: string) {
        this.genesetQuery = normalizeQuery(
            this.genesetQuery
                .toUpperCase()
                .replace(
                    new RegExp(`\\b${oldGeneset.toUpperCase()}\\b`, 'g'),
                    () => newGeneset.toUpperCase()
                )
        );
    }

    @action applyGeneSelection(
        map_geneSymbol_selected: ObservableMap<string, boolean>
    ) {
        let [toAppend, toRemove] = _.partition(
            Array.from(map_geneSymbol_selected.keys()),
            geneSymbol => map_geneSymbol_selected.get(geneSymbol)
        );
        toAppend = _.difference(toAppend, this.geneIds);
        toRemove = _.intersection(toRemove, this.geneIds);
        for (let geneSymbol of toRemove) this.replaceGene(geneSymbol, '');
        this.geneQuery = normalizeQuery(
            [this.geneQuery, ...toAppend].join(' ')
        );
    }

    @action addToGenesetSelection(
        map_geneset_selected: ObservableMap<string, boolean>
    ) {
        let [toAppend, toRemove] = _.partition(
            Array.from(map_geneset_selected.keys()),
            geneSet => map_geneset_selected.get(geneSet)
        );
        const genesetQuery = _.union(toAppend, this.genesetIds).join(' ');
        this.genesetQuery = normalizeQuery(genesetQuery);
    }

    @action applyGenesetSelection(
        map_geneset_selected: ObservableMap<string, boolean>
    ) {
        const [toAppend, toRemove] = _.partition(
            Array.from(map_geneset_selected.keys()),
            geneSet => map_geneset_selected.get(geneSet)
        );
        let genesetQuery = this.genesetQuery;
        if (toAppend.length > 0) {
            let genesetList: string[] = [];
            for (const geneset of toAppend) {
                genesetList.push(geneset);
            }
            genesetQuery = genesetList.join(' ');
        }
        if (toRemove.length > 0) {
            let genesetList = genesetQuery.split(' ');
            for (const removeGeneset of toRemove) {
                for (const geneset of genesetList) {
                    if (removeGeneset === geneset) {
                        const index = genesetList.indexOf(geneset);
                        if (index >= 0) {
                            genesetList.splice(index, 1);
                        }
                    }
                }
            }
            genesetQuery = genesetList.join(' ');
        }
        genesetQuery = normalizeQuery(genesetQuery);
        this.genesetQuery = genesetQuery;
    }

    @action submit(currentTab?: ResultsViewTab) {
        if (this.oql.error) {
            this.geneQueryErrorDisplayStatus = Focus.ShouldFocus;
            this.genesetQueryErrorDisplayStatus = Focus.ShouldFocus;
            return false;
        }

        if (!this.submitEnabled || !this.asyncUrlParams.isComplete)
            return false;

        let urlParams = this.asyncUrlParams.result;

        this.singlePageAppSubmitRoutine(urlParams.query, currentTab);

        return true;
    }

    @action openSummary() {
        if (!this.summaryEnabled) {
            return;
        }

        redirectToStudyView(this.selectableSelectedStudyIds);
    }

    @cached @computed get molecularProfilesInStudyCache() {
        return new MolecularProfilesInStudyCache();
    }

    @cached @computed get sampleListsInStudyCache() {
        return new SampleListsInStudyCache();
    }
}

export enum Focus {
    Unfocused,
    ShouldFocus,
    Focused,
}

export const QueryStoreComponent = ComponentGetsStoreContext(QueryStore);

const selectedGeneSets = '';
export default selectedGeneSets;
