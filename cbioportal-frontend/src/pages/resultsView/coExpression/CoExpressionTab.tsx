import * as React from 'react';
import { MolecularProfile, Sample } from 'cbioportal-ts-api-client';
import { action, computed, observable, makeObservable } from 'mobx';
import { observer, Observer } from 'mobx-react';
import {
    ResultsViewPageStore,
    GeneticEntityType,
} from '../ResultsViewPageStore';
import Select from 'react-select1';
import { getInternalClient } from '../../../shared/api/cbioportalInternalClientInstance';
import { CoExpressionFilter, Geneset } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { MSKTab, MSKTabs } from '../../../shared/components/MSKTabs/MSKTabs';
import CoExpressionViz from './CoExpressionViz';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    filterAndSortProfiles,
    getGenesetProfiles,
    getProfileOptions,
    CoExpressionWithEntityInfo,
} from './CoExpressionTabUtils';
import MobxPromiseCache from '../../../shared/lib/MobxPromiseCache';
import { ICoExpressionPlotProps } from './CoExpressionPlot';
import { bind } from 'bind-decorator';
import OqlStatusBanner from '../../../shared/components/banners/OqlStatusBanner';
import { IDataQueryFilter } from 'shared/lib/StoreUtils';
import { remoteData } from 'cbioportal-frontend-commons';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';
import AlterationFilterWarning from '../../../shared/components/banners/AlterationFilterWarning';
import CaseFilterWarning from '../../../shared/components/banners/CaseFilterWarning';
import { AlterationTypeConstants } from 'shared/constants';
import { GeneticEntity } from 'shared/model/GeneticEntity';

export interface ICoExpressionTabProps {
    store: ResultsViewPageStore;
}

export class CoExpressionCache extends MobxPromiseCache<
    {
        profileX: MolecularProfile;
        profileY: MolecularProfile;
        geneticEntityId: string;
        geneticEntityType: GeneticEntityType;
        allData: boolean;
    },
    CoExpressionWithEntityInfo[]
> {}

@observer
export default class CoExpressionTab extends React.Component<
    ICoExpressionTabProps,
    {}
> {
    @observable.ref _selectedProfileX: string | undefined; // only undefined initially, until molecular profiles downloaded
    @observable.ref _selectedProfileY: string | undefined; // only undefined initially, until molecular profiles downloaded
    @observable _selectedGeneticEntity: GeneticEntity | undefined; // only undefined initially, until genes and gene sets downloaded

    readonly selectedProfileX = remoteData<string | undefined>({
        await: () => [this.xProfileOptions],
        invoke: () => {
            if (
                !this._selectedProfileX &&
                this.xProfileOptions.result!.length > 0
            ) {
                return Promise.resolve(this.xProfileOptions.result![0].value);
            } else {
                return Promise.resolve(this._selectedProfileX);
            }
        },
    });

    readonly selectedProfileY = remoteData<string | undefined>({
        await: () => [this.yProfileOptions],
        invoke: () => {
            if (
                !this._selectedProfileY &&
                this.yProfileOptions.result!.length > 0
            ) {
                return Promise.resolve(this.yProfileOptions.result![0].value);
            } else {
                return Promise.resolve(this._selectedProfileY);
            }
        },
    });

    readonly selectedGeneticEntity = remoteData<GeneticEntity>({
        await: () => [this.props.store.geneticEntities],
        invoke: () => {
            if (!this._selectedGeneticEntity) {
                return Promise.resolve(
                    this.props.store.geneticEntities.result![0]
                );
            } else {
                return Promise.resolve(this._selectedGeneticEntity);
            }
        },
    });

    readonly isSelectedGeneticEntityAGeneSet = remoteData<boolean>({
        await: () => [this.props.store.geneticEntities],
        invoke: () => {
            if (this._selectedGeneticEntity) {
                for (const geneticEntity of this.props.store.geneticEntities
                    .result!) {
                    if (
                        geneticEntity.geneticEntityType ===
                            GeneticEntityType.GENESET &&
                        geneticEntity.geneticEntityId ===
                            this._selectedGeneticEntity!.geneticEntityId
                    ) {
                        return Promise.resolve(true);
                    }
                }
            }
            return Promise.resolve(false);
        },
    });

    @observable private plotState = {
        plotLogScale: false,
        plotShowMutations: true,
        plotShowRegressionLine: false,
    };

    private plotHandlers: ICoExpressionPlotProps['handlers'];

    constructor(props: ICoExpressionTabProps) {
        super(props);

        makeObservable(this);

        (window as any).resultsViewCoExpressionTab = this; // for testing

        this.plotHandlers = {
            onClickLogScale: action(() => {
                this.plotState.plotLogScale = !this.plotState.plotLogScale;
            }),
            onClickShowMutations: action(() => {
                this.plotState.plotShowMutations = !this.plotState
                    .plotShowMutations;
            }),
            onClickShowRegressionLine: action(() => {
                this.plotState.plotShowRegressionLine = !this.plotState
                    .plotShowRegressionLine;
            }),
        };
    }

    @bind
    public onSelectProfileX(option: any) {
        this._selectedProfileX = option.value;
    }

    @bind
    public onSelectProfileY(option: any) {
        this._selectedProfileY = option.value;
    }

    @bind
    private onSelectGeneticEntity(geneticEntityId: string) {
        if (this.props.store.geneticEntities.isComplete) {
            for (const geneticEntity of this.props.store.geneticEntities
                .result) {
                if (
                    geneticEntity.geneticEntityId.toString() === geneticEntityId
                ) {
                    this._selectedGeneticEntity = geneticEntity;
                }
            }
        } else {
            throw new Error('Invalid Genetic Entity');
        }
    }

    @computed get hasMutationData() {
        return _.some(
            this.props.store.molecularProfilesWithData.result,
            profile =>
                profile.molecularAlterationType ===
                AlterationTypeConstants.MUTATION_EXTENDED
        );
    }

    readonly xProfileOptions = remoteData<{ label: string; value: string }[]>({
        await: () => [
            this.props.store.coexpressionTabMolecularProfiles,
            this.isSelectedGeneticEntityAGeneSet,
            this.props.store.molecularProfileIdToProfiledFilteredSamples,
        ],
        invoke: () => {
            let filteredProfiles: MolecularProfile[] = [];
            if (this.isSelectedGeneticEntityAGeneSet.result!) {
                filteredProfiles = getGenesetProfiles(
                    this.props.store.coexpressionTabMolecularProfiles.result!
                );
            } else {
                filteredProfiles = filterAndSortProfiles(
                    this.props.store.coexpressionTabMolecularProfiles.result!
                );
            }
            return Promise.resolve(
                getProfileOptions(
                    filteredProfiles,
                    this.props.store.molecularProfileIdToProfiledFilteredSamples
                        .result!
                )
            );
        },
    });

    readonly yProfileOptions = remoteData<{ label: string; value: string }[]>({
        await: () => [
            this.props.store.coexpressionTabMolecularProfiles,
            this.props.store.molecularProfileIdToProfiledFilteredSamples,
        ],
        invoke: () => {
            return Promise.resolve(
                getProfileOptions(
                    this.props.store.coexpressionTabMolecularProfiles.result!,
                    this.props.store.molecularProfileIdToProfiledFilteredSamples
                        .result!
                )
            );
        },
    });

    /**
     * We need a different "dataQueryFilter" from the rest of the functions in ResultsViewPageStore,
     * so this function is building a new object based on the dataQueryFilter obtained from
     * this.props.store.studyToDataQueryFilter.result.
     */
    private createDataQueryFilterForCoExpression(
        studyToDataQueryFilter: IDataQueryFilter,
        geneticEntityId: string,
        geneticEntityType: string
    ) {
        let dataQueryFilter:
            | {
                  entrezGeneId?: number;
                  genesetId?: string;
                  sampleIds?: string[];
                  sampleListId?: string;
              }
            | undefined = undefined;
        if (geneticEntityType === GeneticEntityType.GENE) {
            dataQueryFilter = {
                ...studyToDataQueryFilter,
                entrezGeneId: parseFloat(geneticEntityId),
            };
        } else if (geneticEntityType === GeneticEntityType.GENESET) {
            dataQueryFilter = {
                ...studyToDataQueryFilter,
                genesetId: geneticEntityId,
            };
        }
        return dataQueryFilter;
    }

    private coExpressionCache: CoExpressionCache = new CoExpressionCache(
        q => ({
            await: () => [
                this.props.store.entrezGeneIdToGeneAll,
                this.props.store.entrezGeneIdToReferenceGene,
                this.props.store.molecularProfileIdToProfiledFilteredSamples,
            ],
            invoke: async () => {
                let threshold = 0.3;
                if (q.allData) {
                    threshold = 0;
                }

                const profileXSamples = this.props.store
                    .molecularProfileIdToProfiledFilteredSamples.result![
                    q.profileX.molecularProfileId
                ];
                const profileYSamples = this.props.store
                    .molecularProfileIdToProfiledFilteredSamples.result![
                    q.profileY.molecularProfileId
                ];

                let dataFilter: IDataQueryFilter = {};
                if (
                    q.profileX.molecularProfileId ===
                    q.profileY.molecularProfileId
                ) {
                    dataFilter = this.props.store.studyToDataQueryFilter
                        .result![q.profileX.studyId];
                } else {
                    const commonSamples = _.intersectionWith(
                        profileXSamples,
                        profileYSamples,
                        (a: Sample, b: Sample) =>
                            a.uniqueSampleKey === b.uniqueSampleKey
                    );
                    dataFilter.sampleIds = commonSamples.map(
                        sample => sample.sampleId
                    );
                }

                if (
                    _.isEmpty(dataFilter.sampleIds) &&
                    _.isEmpty(dataFilter.sampleListId)
                ) {
                    return Promise.resolve([]);
                }

                const dataQueryFilter = this.createDataQueryFilterForCoExpression(
                    dataFilter,
                    q.geneticEntityId,
                    q.geneticEntityType
                );
                if (dataQueryFilter != undefined) {
                    // IF WE DON'T WANT To REDIRECT COEXP TRAFFIC:
                    let $domain = undefined;
                    // IF WE DO WANT TO DIRECT COEXPRESSION TRAFFIC:
                    // let $domain =
                    //     window.location.hostname === 'www.cbioportal.org'
                    //         ? 'https://master.cbioportal.org/api'
                    //         : undefined;

                    const data = await getInternalClient().fetchCoExpressionsUsingPOST(
                        {
                            molecularProfileIdA: q.profileX.molecularProfileId,
                            molecularProfileIdB: q.profileY.molecularProfileId,
                            coExpressionFilter: dataQueryFilter as CoExpressionFilter,
                            threshold,
                            $domain,
                        }
                    );

                    let genesetMap: { [id: string]: Geneset } = {};
                    if (
                        q.profileY.molecularAlterationType ===
                        AlterationTypeConstants.GENESET_SCORE
                    ) {
                        const genesetIds = _.chain(data)
                            .map(datum => datum.geneticEntityId)
                            .uniq()
                            .value();
                        const genesets = await getInternalClient().fetchGenesetsUsingPOST(
                            {
                                genesetIds,
                            }
                        );
                        genesetMap = _.keyBy(
                            genesets,
                            geneset => geneset.genesetId
                        );
                    }

                    const entrezGeneIdToReferenceGene =
                        this.props.store.entrezGeneIdToReferenceGene.result ||
                        {};

                    const entrezGeneIdToGeneMap =
                        this.props.store.entrezGeneIdToGeneAll.result || {};

                    return Promise.resolve(
                        _.reduce(
                            data,
                            (acc, datum) => {
                                let geneticEntityName:
                                    | string
                                    | undefined = undefined;
                                let cytoband = '-';
                                if (
                                    q.profileY.molecularAlterationType ===
                                    AlterationTypeConstants.GENESET_SCORE
                                ) {
                                    geneticEntityName =
                                        genesetMap[datum.geneticEntityId].name;
                                } else if (
                                    entrezGeneIdToReferenceGene[
                                        datum.geneticEntityId
                                    ] !== undefined
                                ) {
                                    geneticEntityName =
                                        entrezGeneIdToReferenceGene[
                                            datum.geneticEntityId
                                        ].hugoGeneSymbol;
                                    cytoband =
                                        entrezGeneIdToReferenceGene[
                                            datum.geneticEntityId
                                        ].cytoband;
                                } else if (
                                    entrezGeneIdToGeneMap[
                                        datum.geneticEntityId
                                    ] !== undefined
                                ) {
                                    geneticEntityName =
                                        entrezGeneIdToGeneMap[
                                            datum.geneticEntityId
                                        ].hugoGeneSymbol;
                                    cytoband = '';
                                }

                                if (geneticEntityName !== undefined) {
                                    acc.push({
                                        ...datum,
                                        geneticEntityName,
                                        cytoband,
                                    });
                                }

                                return acc;
                            },
                            [] as CoExpressionWithEntityInfo[]
                        )
                    );
                } else {
                    return Promise.resolve([]);
                }
            },
        }),
        q =>
            `${q.geneticEntityId},${q.profileX.molecularProfileId},${q.profileY.molecularProfileId}`
    );

    private get profilesSelector() {
        if (
            this.selectedGeneticEntity.isComplete &&
            this.selectedProfileX.isComplete &&
            this.selectedProfileY.isComplete &&
            this.xProfileOptions.isComplete &&
            this.yProfileOptions.isComplete &&
            this.props.store.coexpressionTabMolecularProfiles.isComplete &&
            this.isSelectedGeneticEntityAGeneSet.isComplete
        ) {
            return (
                <div>
                    <div
                        style={{
                            float: 'left',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <span>
                            Find{' '}
                            {getGenesetProfiles(
                                this.props.store
                                    .coexpressionTabMolecularProfiles.result
                            ).length > 0
                                ? 'genes/genesets'
                                : 'genes'}{' '}
                            in{' '}
                        </span>
                        <div
                            style={{
                                display: 'inline-block',
                                width: 376,
                                marginLeft: 4,
                                marginRight: 4,
                                zIndex: 10 /* so that on top when opened*/,
                            }}
                        >
                            <Select
                                name="query-profile-select"
                                value={this.selectedProfileY.result}
                                onChange={this.onSelectProfileY}
                                options={this.yProfileOptions.result}
                                searchable={false}
                                clearable={false}
                                className="coexpression-select-query-profile"
                            />
                        </div>
                        {
                            <span>
                                {' '}
                                that are correlated with{' '}
                                {
                                    this.selectedGeneticEntity.result
                                        .geneticEntityName
                                }{' '}
                                in{' '}
                            </span>
                        }
                        <div
                            style={{
                                display: 'inline-block',
                                width: 376,
                                marginLeft: 4,
                                marginRight: 4,
                                zIndex: 15 /* so that on top when opened*/,
                            }}
                        >
                            <Select
                                name="subject-profile-select"
                                value={this.selectedProfileX.result}
                                onChange={this.onSelectProfileX}
                                options={this.xProfileOptions.result}
                                searchable={false}
                                clearable={false}
                                disabled={
                                    this.isSelectedGeneticEntityAGeneSet.result
                                }
                                className="coexpression-select-subject-profile"
                            />
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <LoadingIndicator isLoading={true} center={true} size={'big'} />
            );
        }
    }

    @bind
    private header() {
        return <div style={{ marginBottom: 20 }}>{this.profilesSelector}</div>;
    }

    @bind
    private geneTabs() {
        // we hack together MSKTabs this way because of some particular responsiveness needs and mobxpromise behavior that may or may not still be relevant
        if (
            this.selectedGeneticEntity.isComplete &&
            this.selectedProfileX.isComplete &&
            this.selectedProfileY.isComplete &&
            this.props.store.geneticEntities.isComplete &&
            this.props.store.coexpressionTabMolecularProfiles.isComplete &&
            this.props.store.molecularProfileIdToProfiledFilteredSamples
                .isComplete
        ) {
            const coExpressionVizElements = [];
            for (const geneticEntity of this.props.store.geneticEntities
                .result) {
                for (const profileX of geneticEntity.geneticEntityType ===
                GeneticEntityType.GENE
                    ? filterAndSortProfiles(
                          this.props.store.coexpressionTabMolecularProfiles
                              .result
                      )
                    : getGenesetProfiles(
                          this.props.store.coexpressionTabMolecularProfiles
                              .result
                      )) {
                    for (const profileY of this.props.store
                        .coexpressionTabMolecularProfiles.result) {
                        const profileXSamples = this.props.store
                            .molecularProfileIdToProfiledFilteredSamples
                            .result![profileX.molecularProfileId];
                        coExpressionVizElements.push(
                            <CoExpressionViz
                                key={`${geneticEntity.geneticEntityId},${profileX.molecularProfileId},${profileY.molecularProfileId}`}
                                coExpressionCache={this.coExpressionCache}
                                geneticEntity={geneticEntity}
                                profileX={profileX}
                                profileY={profileY}
                                numericGeneMolecularDataCache={
                                    this.props.store
                                        .numericGeneMolecularDataCache
                                }
                                numericGenesetMolecularDataCache={
                                    this.props.store
                                        .numericGenesetMolecularDataCache
                                }
                                mutationCache={
                                    this.hasMutationData
                                        ? this.props.store.mutationCache
                                        : undefined
                                }
                                hidden={
                                    profileX.molecularProfileId !==
                                        this.selectedProfileX.result ||
                                    profileY.molecularProfileId !==
                                        this.selectedProfileY.result ||
                                    geneticEntity.geneticEntityId !==
                                        this.selectedGeneticEntity.result
                                            .geneticEntityId!
                                }
                                plotState={this.plotState}
                                plotHandlers={this.plotHandlers}
                                coverageInformation={
                                    this.props.store.coverageInformation
                                }
                                studyToMutationMolecularProfile={
                                    this.props.store
                                        .studyToMutationMolecularProfile
                                }
                                numSamples={
                                    profileXSamples
                                        ? profileXSamples.length
                                        : undefined
                                }
                            />
                        );
                    }
                }
            }

            return (
                <div>
                    <MSKTabs
                        id="coexpressionTabGeneTabs"
                        activeTabId={this.selectedGeneticEntity.result.geneticEntityId.toString()}
                        onTabClick={this.onSelectGeneticEntity}
                        className="coexpressionTabGeneTabs pillTabs"
                        unmountOnHide={true}
                        tabButtonStyle="pills"
                        arrowStyle={{ 'line-height': 0.8 }}
                    >
                        {this.props.store.geneticEntities.result!.map(
                            (geneticEntity: GeneticEntity, i: number) => {
                                return (
                                    <MSKTab
                                        key={i}
                                        id={geneticEntity.geneticEntityId.toString()}
                                        linkText={
                                            geneticEntity.geneticEntityName
                                        }
                                    ></MSKTab>
                                );
                            }
                        )}
                    </MSKTabs>
                    <Observer>{this.header}</Observer>
                    {coExpressionVizElements}
                </div>
            );
        } else {
            return (
                <LoadingIndicator isLoading={true} center={true} size={'big'} />
            );
        }
    }

    render() {
        let divContents = null;
        if (
            this.props.store.coexpressionTabMolecularProfiles.isComplete &&
            this.props.store.coexpressionTabMolecularProfiles.result.length > 0
        ) {
            divContents = (
                <div>
                    <Observer>{this.geneTabs}</Observer>
                </div>
            );
        } else {
            divContents = (
                <div className={'alert alert-info'}>
                    There are no available profiles in the queried studies.
                </div>
            );
        }

        const status = getRemoteDataGroupStatus(
            this.props.store.genes,
            this.props.store.molecularProfileIdToProfiledFilteredSamples,
            this.props.store.coexpressionTabMolecularProfiles
        );

        return (
            <div data-test="coExpressionTabDiv">
                <div className={'tabMessageContainer'}>
                    <OqlStatusBanner
                        className="coexp-oql-status-banner"
                        queryContainsOql={this.props.store.queryContainsOql}
                        tabReflectsOql={false}
                    />
                    <AlterationFilterWarning
                        driverAnnotationSettings={
                            this.props.store.driverAnnotationSettings
                        }
                        includeGermlineMutations={
                            this.props.store.includeGermlineMutations
                        }
                        mutationsReportByGene={
                            this.props.store.mutationsReportByGene
                        }
                        oqlFilteredMutationsReport={
                            this.props.store.oqlFilteredMutationsReport
                        }
                        oqlFilteredMolecularDataReport={
                            this.props.store.oqlFilteredMolecularDataReport
                        }
                        oqlFilteredStructuralVariantsReport={
                            this.props.store.oqlFilteredStructuralVariantsReport
                        }
                        isUnaffected={true}
                    />
                    <CaseFilterWarning
                        samples={this.props.store.samples}
                        filteredSamples={this.props.store.filteredSamples}
                        patients={this.props.store.patients}
                        filteredPatients={this.props.store.filteredPatients}
                        hideUnprofiledSamples={
                            this.props.store.hideUnprofiledSamples
                        }
                    />
                </div>

                {status === 'complete' && divContents}

                <LoadingIndicator
                    center={true}
                    size={'big'}
                    isLoading={status === 'pending'}
                />
            </div>
        );
    }
}
