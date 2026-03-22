import {
    ComparisonGroup,
    defaultGroupOrder,
    finalizeStudiesAttr,
    getOrdinals,
    getStudyIds,
} from './GroupComparisonUtils';
import { remoteData, stringListToIndexSet } from 'cbioportal-frontend-commons';
import {
    SampleFilter,
    CancerStudy,
    MutationMultipleStudyFilter,
    GenePanelDataMultipleStudyFilter,
    Mutation,
    Gene,
    GenePanelData,
    Sample,
    MutationCountByPosition,
} from 'cbioportal-ts-api-client';
import { action, observable, makeObservable, computed } from 'mobx';
import { getClient } from '../../shared/api/cbioportalClientInstance';
import comparisonClient from '../../shared/api/comparisonGroupClientInstance';
import _ from 'lodash';
import autobind from 'autobind-decorator';
import { pickClinicalDataColors } from 'pages/studyView/StudyViewUtils';
import { AppStore } from '../../AppStore';
import { GACustomFieldsEnum, trackEvent } from 'shared/lib/tracking';
import ifNotDefined from '../../shared/lib/ifNotDefined';
import GroupComparisonURLWrapper from './GroupComparisonURLWrapper';
import ComparisonStore, {
    OverlapStrategy,
} from '../../shared/lib/comparison/ComparisonStore';
import sessionServiceClient from 'shared/api//sessionServiceInstance';
import { COLORS } from '../studyView/StudyViewUtils';
import {
    ComparisonSession,
    SessionGroupData,
    VirtualStudy,
} from 'shared/api/session-service/sessionServiceModels';
import ComplexKeySet from 'shared/lib/complexKeyDataStructures/ComplexKeySet';
import { REQUEST_ARG_ENUM } from 'shared/constants';
import { AxisScale, DataFilter } from 'react-mutation-mapper';
import { fetchGenes, getAllGenes } from 'shared/lib/StoreUtils';
import {
    CoverageInformation,
    getCoverageInformation,
} from 'shared/lib/GenePanelUtils';
import { fetchPatients } from 'pages/resultsView/ResultsViewPageStoreUtils';
import { isSampleProfiled } from 'shared/lib/isSampleProfiled';
import { getSampleMolecularIdentifiers } from 'pages/studyView/StudyViewComparisonUtils';
import { FeatureFlagEnum } from 'shared/featureFlags';

export default class GroupComparisonStore extends ComparisonStore {
    @observable private sessionId: string;
    @observable public isSettingsMenuVisible = false;

    constructor(
        sessionId: string,
        appStore: AppStore,
        protected urlWrapper: GroupComparisonURLWrapper
    ) {
        super(appStore, urlWrapper);

        makeObservable(this);

        this.sessionId = sessionId;
    }

    @action public updateOverlapStrategy(strategy: OverlapStrategy) {
        this.urlWrapper.updateURL({ overlapStrategy: strategy });
    }

    @computed get overlapStrategy() {
        return this.urlWrapper.query.overlapStrategy || OverlapStrategy.EXCLUDE;
    }

    @computed
    public get usePatientLevelEnrichments() {
        return this.urlWrapper.query.patientEnrichments === 'true';
    }

    @action.bound
    public setUsePatientLevelEnrichments(e: boolean) {
        this.urlWrapper.updateURL({ patientEnrichments: e.toString() });
    }

    @computed get groupOrder() {
        const param = this.urlWrapper.query.groupOrder;
        if (param) {
            return JSON.parse(param);
        } else {
            return undefined;
        }
    }

    @action public updateGroupOrder(oldIndex: number, newIndex: number) {
        let groupOrder = this.groupOrder;
        if (!groupOrder) {
            groupOrder = this._originalGroups.result!.map(g => g.name);
        }
        groupOrder = groupOrder.slice();
        const poppedUid = groupOrder.splice(oldIndex, 1)[0];
        groupOrder.splice(newIndex, 0, poppedUid);

        this.urlWrapper.updateURL({ groupOrder: JSON.stringify(groupOrder) });
    }

    @action private updateUnselectedGroups(names: string[]) {
        this.urlWrapper.updateURL({ unselectedGroups: JSON.stringify(names) });
    }

    @computed get unselectedGroups() {
        const param = this.urlWrapper.query.unselectedGroups;
        if (param) {
            return JSON.parse(param);
        } else {
            return [];
        }
    }

    @action.bound
    public toggleGroupSelected(name: string) {
        const groups = this.unselectedGroups.slice();
        if (groups.includes(name)) {
            groups.splice(groups.indexOf(name), 1);
        } else {
            groups.push(name);
        }
        this.updateUnselectedGroups(groups);
    }

    @action.bound
    public selectAllGroups() {
        this.updateUnselectedGroups([]);
    }

    @action.bound
    public deselectAllGroups() {
        const groups = this._originalGroups.result!; // assumed complete
        this.updateUnselectedGroups(groups.map(g => g.name));
    }

    @autobind
    public isGroupSelected(name: string) {
        return !this.unselectedGroups.includes(name);
    }

    @action
    protected async saveAndGoToSession(newSession: ComparisonSession) {
        const { id } = await comparisonClient.addComparisonSession(newSession);
        this.urlWrapper.updateURL({ comparisonId: id });
    }

    get _session() {
        return this.__session;
    }

    private readonly __session = remoteData<ComparisonSession>({
        invoke: () => {
            return comparisonClient.getComparisonSession(this.sessionId);
        },
        onResult(data: ComparisonSession) {
            try {
                const studies = _.chain(data.groups)
                    .flatMap(group => group.studies)
                    .map(study => study.id)
                    .uniq()
                    .value();
            } catch (ex) {
                throw 'Failure to track comparisonSessionViewed';
            }
        },
    });

    @computed get sessionClinicalAttributeName() {
        if (this._session.isComplete) {
            return this._session.result.clinicalAttributeName;
        } else {
            return undefined;
        }
    }

    readonly _unsortedOriginalGroups = remoteData<ComparisonGroup[]>({
        await: () => [this._session, this.sampleMap],
        invoke: () => {
            // (1) ensure color
            // (2) filter out, and add list of, nonexistent samples
            // (3) add patients

            let ret: ComparisonGroup[] = [];
            const sampleSet = this.sampleMap.result!;

            // filter colors (remove those that were already selected by user for some groups)
            // and get the list of groups with no color
            let colors: string[] = COLORS;
            let filteredColors = colors;
            let groupsWithoutColor: SessionGroupData[] = [];
            this._session.result!.groups.forEach((group, i) => {
                if (group.color != undefined) {
                    filteredColors = filteredColors.filter(
                        color => color != group.color!.toUpperCase()
                    );
                } else {
                    groupsWithoutColor.push(group);
                }
            });

            // pick a color for groups without color
            let defaultGroupColors = pickClinicalDataColors(
                _.map(groupsWithoutColor, group => ({
                    value: group.name,
                })) as any,
                filteredColors
            );

            const finalizeGroup = (
                groupData: SessionGroupData,
                index: number
            ) => {
                // assign color to group if no color given
                let color =
                    groupData.color || defaultGroupColors[groupData.name];

                const { nonExistentSamples, studies } = finalizeStudiesAttr(
                    groupData,
                    sampleSet
                );

                return Object.assign({}, groupData, {
                    color,
                    studies,
                    nonExistentSamples,
                    uid: groupData.name,
                    nameWithOrdinal: '', // fill in later
                    ordinal: '', // fill in later
                });
            };

            this._session.result!.groups.forEach((groupData, index) => {
                ret.push(finalizeGroup(groupData, index));
            });
            return Promise.resolve(ret);
        },
    });

    readonly _originalGroups = remoteData<ComparisonGroup[]>({
        await: () => [this._session, this._unsortedOriginalGroups],
        invoke: () => {
            // sort and add ordinals
            let sorted: ComparisonGroup[];
            if (this.groupOrder) {
                const order = stringListToIndexSet(this.groupOrder);
                sorted = _.sortBy<ComparisonGroup>(
                    this._unsortedOriginalGroups.result!,
                    g =>
                        ifNotDefined<number>(
                            order[g.name],
                            Number.POSITIVE_INFINITY
                        )
                );
            } else if (this._session.result!.groupNameOrder) {
                const order = stringListToIndexSet(
                    this._session.result!.groupNameOrder!
                );
                sorted = _.sortBy<ComparisonGroup>(
                    this._unsortedOriginalGroups.result!,
                    g =>
                        ifNotDefined<number>(
                            order[g.name],
                            Number.POSITIVE_INFINITY
                        )
                );
            } else {
                sorted = defaultGroupOrder(
                    this._unsortedOriginalGroups.result!
                );
            }

            const ordinals = getOrdinals(sorted.length, 26);
            sorted.forEach((group, index) => {
                const ordinal = ordinals[index];
                group.nameWithOrdinal = `(${ordinal}) ${group.name}`;
                group.ordinal = ordinal;
            });
            return Promise.resolve(sorted);
        },
    });

    public get samples() {
        return this._samples;
    }
    private readonly _samples = remoteData({
        await: () => [this._session, this.allSamples],
        invoke: async () => {
            // filter to get samples in our groups
            const sampleSet = new ComplexKeySet();
            for (const groupData of this._session.result!.groups) {
                for (const studySpec of groupData.studies) {
                    const studyId = studySpec.id;
                    for (const sampleId of studySpec.samples) {
                        sampleSet.add({
                            studyId,
                            sampleId,
                        });
                    }
                }
            }

            return this.allSamples.result!.filter(sample => {
                return sampleSet.has({
                    studyId: sample.studyId,
                    sampleId: sample.sampleId,
                });
            });
        },
    });

    public readonly groupToProfiledPatients = remoteData({
        await: () => [
            this.activeGroups,
            this.sampleMap,
            this.mutationEnrichmentProfiles,
            this.coverageInformation,
        ],
        invoke: () => {
            const sampleSet = this.sampleMap.result!;
            const groups = this.activeGroups.result!;
            const ret: {
                [groupUid: string]: string[];
            } = {};
            for (const group of groups) {
                for (const studyObject of group.studies) {
                    const studyId = studyObject.id;
                    for (const sampleId of studyObject.samples) {
                        const sample = sampleSet.get({ sampleId, studyId });
                        if (
                            sample &&
                            this.mutationEnrichmentProfiles.result!.some(p =>
                                isSampleProfiled(
                                    sample.uniqueSampleKey,
                                    p.molecularProfileId,
                                    this.activeMutationMapperGene!
                                        .hugoGeneSymbol,
                                    this.coverageInformation.result!
                                )
                            )
                        ) {
                            ret[group.name] = ret[group.name] || [];
                            ret[group.name].push(sample.patientId);
                        }
                    }
                }
                ret[group.name] = _.uniq(ret[group.name]);
            }
            return Promise.resolve(ret);
        },
    });

    public readonly profiledPatientCounts = remoteData({
        await: () => [this.groupToProfiledPatients],
        invoke: () => {
            return Promise.resolve(
                _.map(this.groupToProfiledPatients.result!, g => g.length)
            );
        },
    });

    readonly mutations = remoteData({
        await: () => [this.samples, this.mutationEnrichmentProfiles],
        invoke: async () => {
            const sampleMolecularIdentifiers = getSampleMolecularIdentifiers(
                this.samples.result!,
                this.mutationEnrichmentProfiles.result!
            );
            const mutations = await getClient().fetchMutationsInMultipleMolecularProfilesUsingPOST(
                {
                    projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                    mutationMultipleStudyFilter: {
                        entrezGeneIds: [
                            this.activeMutationMapperGene!.entrezGeneId,
                        ],
                        sampleMolecularIdentifiers,
                    } as MutationMultipleStudyFilter,
                }
            );
            return mutations;
        },
    });

    readonly allSamples = remoteData({
        await: () => [this._session],
        invoke: async () => {
            const allStudies = _(this._session.result!.groups)
                .flatMapDeep(groupData => groupData.studies.map(s => s.id))
                .uniq()
                .value();
            // fetch all samples - faster backend processing time
            const allSamples = await getClient().fetchSamplesUsingPOST({
                sampleFilter: {
                    sampleListIds: allStudies.map(studyId => `${studyId}_all`),
                } as SampleFilter,
                projection: 'DETAILED',
            });

            return allSamples;
        },
    });

    readonly genePanelDataForMutationProfiles = remoteData({
        await: () => [this.samples, this.mutationEnrichmentProfiles],
        invoke: async () => {
            const sampleMolecularIdentifiers = getSampleMolecularIdentifiers(
                this.samples.result!,
                this.mutationEnrichmentProfiles.result!
            );
            const genePanelData = getClient().fetchGenePanelDataInMultipleMolecularProfilesUsingPOST(
                {
                    genePanelDataMultipleStudyFilter: {
                        sampleMolecularIdentifiers,
                    } as GenePanelDataMultipleStudyFilter,
                }
            );
            return genePanelData;
        },
    });

    readonly coverageInformation = remoteData<CoverageInformation | undefined>({
        await: () => [
            this.genePanelDataForMutationProfiles,
            this.sampleKeyToSample,
            this.patients,
        ],
        invoke: async () => {
            return getCoverageInformation(
                this.genePanelDataForMutationProfiles.result!,
                this.sampleKeyToSample.result!,
                this.patients.result!,
                [this.activeMutationMapperGene!]
            );
        },
    });

    readonly patients = remoteData({
        await: () => [this.samples],
        invoke: () => fetchPatients(this.samples.result!),
        default: [],
    });

    readonly genes = remoteData<Gene[]>({
        invoke: async () => {
            const genes = await getAllGenes();
            return genes.sort((a, b) =>
                a.hugoGeneSymbol < b.hugoGeneSymbol ? -1 : 1
            );
        },
        onResult: (genes: Gene[]) => {
            this.geneCache.addData(genes);
        },
        onError: err => {
            // throwing this allows sentry to report it
            throw err;
        },
    });

    readonly genesWithMutations = remoteData<Gene[]>({
        await: () => [this.genesSortedByMutationFrequency, this.genes],
        invoke: async () => {
            return this.genesSortedByMutationFrequency.result!.map(
                gene => this.genes.result!.find(g => gene === g.hugoGeneSymbol)!
            );
        },
    });

    @computed get userSelectedMutationMapperGene() {
        return this.urlWrapper.query.selectedGene;
    }

    @computed get axisMode() {
        return this.urlWrapper.query.axisMode || AxisScale.PERCENT;
    }

    @computed get activeMutationMapperGene() {
        let gene =
            this.genes.result!.find(
                g => g.hugoGeneSymbol === this.userSelectedMutationMapperGene
            ) ||
            this.genes.result!.find(
                g =>
                    g.hugoGeneSymbol ===
                    this.genesSortedByMutationFrequency.result![0]
            );
        return gene;
    }

    @autobind
    public shouldApplySampleIdFilter(
        filter: DataFilter<string>,
        mutation: Mutation
    ): boolean {
        return this.mutationsByGroup.result![filter.values[0]].some(
            m => m.sampleId === mutation.sampleId
        );
    }

    readonly mutationsByGroup = remoteData({
        await: () => [this.mutations, this.activeGroups],
        invoke: async () => {
            const mutationsBySampleId = _.keyBy(
                this.mutations.result!,
                m => m.sampleId
            );

            const ret = this.activeGroups.result!.reduce(
                (aggr: { [groupId: string]: Mutation[] }, group) => {
                    const samplesInGroup = _(group.studies)
                        .map(g => g.samples)
                        .flatten()
                        .value();

                    const mutations = _(samplesInGroup)
                        .map(s => {
                            return mutationsBySampleId[s];
                        })
                        .flatten()
                        .compact()
                        .value();

                    aggr[group.uid] = mutations;
                    return aggr;
                },
                {}
            );
            return ret;
        },
    });

    readonly allStudies = remoteData(
        {
            invoke: async () =>
                await getClient().getAllStudiesUsingGET({
                    projection: 'SUMMARY',
                }),
        },
        []
    );

    readonly allStudyIdToStudy = remoteData({
        await: () => [this.allStudies],
        invoke: () =>
            Promise.resolve(_.keyBy(this.allStudies.result!, s => s.studyId)),
    });

    // contains queried physical studies
    private readonly queriedPhysicalStudies = remoteData({
        await: () => [this._session],
        invoke: async () => {
            const originStudies = this._session.result!.origin;
            const everyStudyIdToStudy = this.allStudyIdToStudy.result!;
            return _.reduce(
                originStudies,
                (acc: CancerStudy[], next) => {
                    if (everyStudyIdToStudy[next]) {
                        acc.push(everyStudyIdToStudy[next]);
                    }
                    return acc;
                },
                []
            );
        },
        default: [],
    });

    // virtual studies in session
    private readonly queriedVirtualStudies = remoteData({
        await: () => [this.queriedPhysicalStudies, this._session],
        invoke: async () => {
            const originStudies = this._session.result!.origin;
            if (
                this.queriedPhysicalStudies.result.length ===
                originStudies.length
            ) {
                return [];
            }
            let filteredVirtualStudies: VirtualStudy[] = [];
            let validFilteredPhysicalStudyIds = this.queriedPhysicalStudies.result.map(
                study => study.studyId
            );

            let virtualStudyIds = originStudies.filter(
                id => !validFilteredPhysicalStudyIds.includes(id)
            );

            await Promise.all(
                virtualStudyIds.map(id =>
                    sessionServiceClient
                        .getVirtualStudy(id)
                        .then(res => {
                            filteredVirtualStudies.push(res);
                        })
                        .catch(error => {
                            /*do nothing*/
                        })
                )
            );
            return filteredVirtualStudies;
        },
        default: [],
    });

    // all queried studies, includes both physcial and virtual studies
    // this is used in page header name
    readonly displayedStudies = remoteData({
        await: () => [this.queriedVirtualStudies, this.queriedPhysicalStudies],
        invoke: async () => {
            return [
                ...this.queriedPhysicalStudies.result,
                ...this.queriedVirtualStudies.result.map(virtualStudy => {
                    return {
                        name: virtualStudy.data.name,
                        description: virtualStudy.data.description,
                        studyId: virtualStudy.id,
                    } as CancerStudy;
                }),
            ];
        },
        default: [],
    });

    public get studies() {
        return this._studies;
    }
    private readonly _studies = remoteData(
        {
            await: () => [this._session, this.allStudyIdToStudy],
            invoke: () => {
                const studyIds = getStudyIds(this._session.result!.groups);
                return Promise.resolve(
                    studyIds.map(
                        studyId => this.allStudyIdToStudy.result![studyId]
                    )
                );
            },
        },
        []
    );

    @computed get hasCustomDriverAnnotations() {
        return (
            this.customDriverAnnotationReport.isComplete &&
            (!!this.customDriverAnnotationReport.result!.hasBinary ||
                this.customDriverAnnotationReport.result!.tiers.length > 0)
        );
    }

    // override parent method
    protected get isLeftTruncationFeatureFlagEnabled() {
        return this.appStore.featureFlagStore.has(
            FeatureFlagEnum.LEFT_TRUNCATION_ADJUSTMENT
        );
    }
}
