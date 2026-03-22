import * as React from 'react';
import {
    MolecularProfile,
    Mutation,
    NumericGeneMolecularData,
    Gene,
} from 'cbioportal-ts-api-client';
import { observer, Observer } from 'mobx-react';
import CoExpressionTableGenes from './CoExpressionTableGenes';
import CoExpressionTableGenesets from './CoExpressionTableGenesets';
import {
    action,
    autorun,
    computed,
    IReactionDisposer,
    makeObservable,
    observable,
} from 'mobx';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { SimpleGetterLazyMobXTableApplicationDataStore } from '../../../shared/lib/ILazyMobXTableApplicationDataStore';
import { logScalePossibleForProfile } from 'shared/components/plots/PlotsTabUtils';
import CoExpressionPlot, { ICoExpressionPlotProps } from './CoExpressionPlot';
import { MobxPromise, remoteData } from 'cbioportal-frontend-commons';
import { computePlotData, requestAllDataMessage } from './CoExpressionVizUtils';
import { Button } from 'react-bootstrap';
import { CoExpressionCache } from './CoExpressionTab';
import { bind } from 'bind-decorator';
import MobxPromiseCache from '../../../shared/lib/MobxPromiseCache';
import { GeneticEntityType } from '../ResultsViewPageStore';
import { AlterationTypeConstants } from 'shared/constants';
import { CoverageInformation } from '../../../shared/lib/GenePanelUtils';
import _ from 'lodash';
import { calculateQValues } from '../../../shared/lib/calculation/BenjaminiHochbergFDRCalculator';
import { CoExpressionWithQ } from './CoExpressionTabUtils';
import { GenesetMolecularData } from 'cbioportal-ts-api-client';
import { GeneticEntity } from 'shared/model/GeneticEntity';

export interface ICoExpressionVizProps {
    plotState: {
        plotLogScale: boolean;
        plotShowMutations: boolean;
        plotShowRegressionLine: boolean;
    };
    plotHandlers: ICoExpressionPlotProps['handlers'];
    geneticEntity: GeneticEntity;
    profileX: MolecularProfile;
    profileY: MolecularProfile;
    coExpressionCache: CoExpressionCache;
    numericGeneMolecularDataCache: MobxPromiseCache<
        { entrezGeneId: number; molecularProfileId: string },
        NumericGeneMolecularData[]
    >;
    numericGenesetMolecularDataCache: MobxPromiseCache<
        { genesetId: string; molecularProfileId: string },
        GenesetMolecularData[]
    >;
    coverageInformation: MobxPromise<CoverageInformation>;
    studyToMutationMolecularProfile: MobxPromise<{
        [studyId: string]: MolecularProfile;
    }>;
    mutationCache?: MobxPromiseCache<{ entrezGeneId: number }, Mutation[]>;
    hidden?: boolean;
    numSamples?: number;
}

export enum TableMode {
    SHOW_ALL,
    SHOW_POSITIVE,
    SHOW_NEGATIVE,
}

export class CoExpressionDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    CoExpressionWithQ
> {
    @observable public tableMode: TableMode;

    private reactionDisposer: IReactionDisposer;

    constructor(
        getData: () => CoExpressionWithQ[],
        getHighlighted: () => CoExpressionWithQ | undefined,
        public setHighlighted: (c: CoExpressionWithQ) => void
    ) {
        super(getData);
        makeObservable(this);
        this.tableMode = TableMode.SHOW_ALL;
        this.dataHighlighter = (d: CoExpressionWithQ) => {
            const highlighted = getHighlighted();
            return !!(
                highlighted && d.geneticEntityId === highlighted.geneticEntityId
            );
        };
        this.dataSelector = (d: CoExpressionWithQ) => {
            let selected;
            switch (this.tableMode) {
                case TableMode.SHOW_POSITIVE:
                    selected =
                        d.spearmansCorrelation !== null &&
                        d.spearmansCorrelation !== undefined &&
                        d.spearmansCorrelation >= 0;
                    break;
                case TableMode.SHOW_NEGATIVE:
                    selected =
                        d.spearmansCorrelation !== null &&
                        d.spearmansCorrelation !== undefined &&
                        d.spearmansCorrelation <= 0;
                    break;
                default:
                    selected = true;
                    break;
            }
            return selected;
        };

        this.reactionDisposer = autorun(() => {
            if (
                this.sortMetric &&
                this.sortedFilteredData.length > 0 &&
                !getHighlighted()
            ) {
                this.setHighlighted(this.sortedFilteredData[0]);
            }
        });
    }

    public destroy() {
        this.reactionDisposer();
    }
}

@observer
export default class CoExpressionViz extends React.Component<
    ICoExpressionVizProps,
    {}
> {
    @observable.ref highlightedCoExpression: CoExpressionWithQ | undefined; // only undefined initially, before data loaded
    @observable allDataRequested: boolean = true; // set to true to request all data by default

    private lastCoExpressionData: CoExpressionWithQ[];

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    get coExpressionDataPromise() {
        return this.props.coExpressionCache.get({
            geneticEntityId: this.props.geneticEntity.geneticEntityId.toString(),
            geneticEntityType: this.props.geneticEntity.geneticEntityType,
            profileX: this.props.profileX,
            profileY: this.props.profileY,
            allData: this.allDataRequested,
        });
    }

    readonly coExpressionsWithQValues = remoteData<CoExpressionWithQ[]>({
        await: () => [this.coExpressionDataPromise],
        invoke: () => {
            const coexpressions = this.coExpressionDataPromise.result!;

            // Separate entries with valid pValues from those with null pValues
            const withPValue = coexpressions.filter(
                c => c.pValue !== null && c.pValue !== undefined
            );
            const withoutPValue = coexpressions.filter(
                c => c.pValue === null || c.pValue === undefined
            );

            const sortedByPvalue = _.sortBy(withPValue, [
                c => c.pValue,
                c => c.geneticEntityName,
            ]);

            const qValues = calculateQValues(sortedByPvalue.map(c => c.pValue));
            qValues.forEach((qValue, index) => {
                (sortedByPvalue[index] as CoExpressionWithQ).qValue = qValue;
            });

            // Assign null qValue to entries without pValue
            withoutPValue.forEach(c => {
                (c as CoExpressionWithQ).qValue = null as any;
            });

            return Promise.resolve([
                ...sortedByPvalue,
                ...withoutPValue,
            ] as CoExpressionWithQ[]);
        },
    });

    private dataStore = new CoExpressionDataStore(
        () => {
            if (this.props.hidden) {
                // dont download any data or trigger anything if element is hidden
                // need to return last result, because if we just return empty,
                //  the table page will be reset to 0 and we'll lose our page
                //  when this tab is no longer hidden
                return this.lastCoExpressionData || [];
            }

            if (this.coExpressionsWithQValues.isComplete) {
                this.lastCoExpressionData = this.coExpressionsWithQValues.result!;
                return this.coExpressionsWithQValues.result!;
            } else {
                return [];
            }
        },
        () => {
            return this.highlightedCoExpression;
        },
        (c: CoExpressionWithQ) => {
            this.highlightedCoExpression = c;
        }
    );

    @action.bound
    private onSelectTableMode(t: TableMode) {
        this.dataStore.tableMode = t;
    }

    @action.bound
    private requestAllData() {
        this.allDataRequested = true;
    }

    private getPlotDataPromises(yAxisCoExpression?: CoExpressionWithQ) {
        const ret: {
            molecularX:
                | MobxPromise<NumericGeneMolecularData[]>
                | MobxPromise<GenesetMolecularData[]>;
            molecularY:
                | MobxPromise<NumericGeneMolecularData[]>
                | MobxPromise<GenesetMolecularData[]>
                | undefined;
            mutationX: MobxPromise<Mutation[]> | undefined;
            mutationY: MobxPromise<Mutation[]> | undefined;
        } = {
            molecularX:
                this.props.profileX.molecularAlterationType ===
                AlterationTypeConstants.GENESET_SCORE
                    ? this.props.numericGenesetMolecularDataCache.get({
                          genesetId: this.props.geneticEntity.geneticEntityId.toString(),
                          molecularProfileId: this.props.profileX
                              .molecularProfileId,
                      })
                    : this.props.numericGeneMolecularDataCache.get({
                          entrezGeneId: parseInt(
                              String(this.props.geneticEntity.geneticEntityId),
                              10
                          ),
                          molecularProfileId: this.props.profileX
                              .molecularProfileId,
                      }),
            mutationX: undefined,
            molecularY: undefined,
            mutationY: undefined,
        };

        if (yAxisCoExpression) {
            ret.molecularY =
                this.props.profileY.molecularAlterationType ===
                AlterationTypeConstants.GENESET_SCORE
                    ? this.props.numericGenesetMolecularDataCache.get({
                          genesetId: yAxisCoExpression.geneticEntityId,
                          molecularProfileId: this.props.profileY
                              .molecularProfileId,
                      })
                    : this.props.numericGeneMolecularDataCache.get({
                          entrezGeneId: parseInt(
                              yAxisCoExpression.geneticEntityId,
                              10
                          ),
                          molecularProfileId: this.props.profileY
                              .molecularProfileId,
                      });
        }

        if (this.props.mutationCache) {
            ret.mutationX = this.props.mutationCache.get({
                entrezGeneId: parseInt(
                    String(this.props.geneticEntity.geneticEntityId),
                    10
                ),
            });
            if (yAxisCoExpression) {
                ret.mutationY = this.props.mutationCache.get({
                    entrezGeneId: parseInt(
                        yAxisCoExpression.geneticEntityId,
                        10
                    ),
                });
            }
        }

        return ret;
    }

    readonly plotData = remoteData({
        await: () => {
            if (this.props.hidden)
                // dont download any data or trigger anything if element is hidden
                return [];

            const promises = this.getPlotDataPromises(
                this.highlightedCoExpression
            );
            const ret: MobxPromise<any>[] = [
                this.props.coverageInformation,
                this.props.studyToMutationMolecularProfile,
                promises.molecularX,
            ];

            if (promises.mutationX) ret.push(promises.mutationX);
            if (promises.molecularY) ret.push(promises.molecularY);
            if (promises.mutationY) ret.push(promises.mutationY);

            return ret;
        },
        invoke: () => {
            if (this.props.hidden) {
                // dont download any data or trigger anything if element is hidden
                return Promise.resolve([]);
            }

            if (!this.highlightedCoExpression) {
                // no data if y axis not specified
                return Promise.resolve([]);
            }

            const promises = this.getPlotDataPromises(
                this.highlightedCoExpression
            );
            let numericGeneMolecularData:
                | NumericGeneMolecularData[]
                | GenesetMolecularData[] = [];
            if (promises.molecularX && promises.molecularX.isComplete)
                numericGeneMolecularData = (numericGeneMolecularData as any[]).concat(
                    promises.molecularX.result!
                );
            if (promises.molecularY && promises.molecularY.isComplete)
                numericGeneMolecularData = (numericGeneMolecularData as any[]).concat(
                    promises.molecularY.result!
                );

            let mutations: Mutation[] = [];
            if (promises.mutationX && promises.mutationX.isComplete)
                mutations = mutations.concat(promises.mutationX.result!);
            if (promises.mutationY && promises.mutationY.isComplete)
                mutations = mutations.concat(promises.mutationY.result!);

            return Promise.resolve(
                computePlotData(
                    numericGeneMolecularData,
                    mutations,
                    this.props.geneticEntity.geneticEntityId,
                    isNaN(Number(this.highlightedCoExpression.geneticEntityId))
                        ? this.highlightedCoExpression.geneticEntityId
                        : Number(this.highlightedCoExpression.geneticEntityId),
                    this.props.geneticEntity.geneticEntityName,
                    this.highlightedCoExpression.geneticEntityName,
                    this.props.coverageInformation.result!,
                    this.props.studyToMutationMolecularProfile.result!
                )
            );
        },
    });

    @computed get plotShowMutations() {
        return (
            this.props.plotState.plotShowMutations && this.showMutationControls
        );
    }

    @computed get plotLogScale() {
        return this.props.plotState.plotLogScale && this.showLogScaleControls;
    }

    @computed get showMutationControls() {
        return !!this.props.mutationCache;
    }

    @computed get showLogScaleControls() {
        const profileXId = this.props.profileX.molecularProfileId.toLowerCase();
        const profileYId = this.props.profileY.molecularProfileId.toLowerCase();
        return (
            logScalePossibleForProfile(profileXId) ||
            logScalePossibleForProfile(profileYId)
        );
    }

    private get requestAllDataButton() {
        if (
            this.plotData.isComplete &&
            !this.dataStore.allData.length &&
            !this.allDataRequested
        ) {
            return (
                <div>
                    <span style={{ marginRight: 5 }}>
                        {requestAllDataMessage(
                            this.props.geneticEntity.geneticEntityName
                        )}
                    </span>
                    <Button onClick={this.requestAllData}>
                        Load data for all genes.
                    </Button>
                </div>
            );
        } else {
            return null;
        }
    }

    @bind
    private table() {
        if (
            this.props.profileY.molecularAlterationType !==
            AlterationTypeConstants.GENESET_SCORE
        ) {
            return (
                <div>
                    <CoExpressionTableGenes
                        referenceGeneticEntity={
                            this.props.geneticEntity.geneticEntityData
                        }
                        dataStore={this.dataStore}
                        tableMode={this.dataStore.tableMode}
                        onSelectTableMode={this.onSelectTableMode}
                    />
                    {this.requestAllDataButton}
                </div>
            );
        } else {
            return (
                <div>
                    <CoExpressionTableGenesets
                        referenceGeneticEntity={
                            this.props.geneticEntity.geneticEntityData
                        }
                        dataStore={this.dataStore}
                        tableMode={this.dataStore.tableMode}
                        onSelectTableMode={this.onSelectTableMode}
                    />
                    {this.requestAllDataButton}
                </div>
            );
        }
    }

    @bind
    private plot() {
        if (this.props.hidden) return <span></span>;

        if (this.plotData.isError) {
            return (
                <span>
                    Error fetching data. Please refresh the page and try again.
                </span>
            );
        } else {
            //Create a GeneticEntity object based on this.highlightedCoExpression
            let yGeneticEntity: GeneticEntity;
            if (this.highlightedCoExpression) {
                const emptyGeneEntityData: Gene = {
                    geneticEntityId: 0,
                    entrezGeneId: 0,
                    hugoGeneSymbol: '',
                    type: '',
                };
                yGeneticEntity = {
                    geneticEntityName: this.highlightedCoExpression
                        .geneticEntityName,
                    geneticEntityType: this.highlightedCoExpression
                        .geneticEntityType as GeneticEntityType,
                    geneticEntityId: this.highlightedCoExpression
                        .geneticEntityId,
                    cytoband: this.highlightedCoExpression.cytoband,
                    geneticEntityData: emptyGeneEntityData,
                };
            }
            return (
                <div style={{ position: 'relative' }}>
                    <LoadingIndicator
                        isLoading={
                            this.dataStore.allData.length > 0 && // dont show indicator if theres no data
                            (this.plotData.isPending ||
                                !this.highlightedCoExpression)
                        }
                        center={true}
                        size={'big'}
                    />
                    {this.plotData.isComplete && this.highlightedCoExpression && (
                        <div style={{ marginLeft: 10 }}>
                            <CoExpressionPlot
                                xAxisGeneticEntity={this.props.geneticEntity}
                                yAxisGeneticEntity={yGeneticEntity!}
                                data={this.plotData.result}
                                showLogScaleControls={this.showLogScaleControls}
                                showMutationControls={this.showMutationControls}
                                showMutations={this.plotShowMutations}
                                showRegressionLine={
                                    this.props.plotState.plotShowRegressionLine
                                }
                                logScale={this.plotLogScale}
                                handlers={this.props.plotHandlers}
                                molecularProfileY={this.props.profileY}
                                molecularProfileX={this.props.profileX}
                                height={530}
                                width={530}
                            />
                        </div>
                    )}
                </div>
            );
        }
    }

    componentWillUnmount() {
        this.dataStore.destroy();
    }

    render() {
        // need to short circuit all references to coExpressionsWithQValues with `this.props.hidden` so that the promise doesnt
        //  fetch until its not hidden
        let innerElt = (
            <div
                style={{
                    display:
                        !this.props.hidden &&
                        this.coExpressionsWithQValues.isComplete
                            ? 'inherit'
                            : 'none',
                }}
                data-test="CoExpressionGeneTabContent"
            >
                <div className="clearfix">
                    {this.dataStore.allData.length > 0 ? (
                        [
                            <div
                                style={{
                                    width: '40%',
                                    float: 'left',
                                    marginTop: 6,
                                }}
                            >
                                <Observer>{this.table}</Observer>
                            </div>,
                            <div
                                style={{
                                    width: '60%',
                                    float: 'right',
                                    marginTop: 6 /*align with table controls*/,
                                }}
                            >
                                <Observer>{this.plot}</Observer>
                            </div>,
                        ]
                    ) : (
                        <div
                            style={{
                                position: 'absolute',
                                top: 200,
                                left: '50%',
                                transform: 'translate(-50%, 0)',
                            }}
                        >
                            There is no expression data for{' '}
                            <strong>
                                {this.props.geneticEntity.geneticEntityName}
                            </strong>{' '}
                            with the selected samples in{' '}
                            <strong>{this.props.profileX.name}</strong>.
                        </div>
                    )}
                </div>
            </div>
        );
        return (
            <div
                style={{
                    display: this.props.hidden ? 'none' : 'inherit',
                    minHeight: 826,
                    position: 'relative',
                }}
            >
                {innerElt}
                <LoadingIndicator
                    isLoading={
                        !this.props.hidden &&
                        this.coExpressionsWithQValues.isPending
                    }
                    center={true}
                    size={'big'}
                >
                    {this.props.numSamples !== undefined &&
                        (this.props.numSamples <= 500
                            ? 'Computing correlations across all genes. This may take a few seconds.'
                            : 'This study has a large number of samples. Computing correlations may take up to 2 minutes.')}
                </LoadingIndicator>
            </div>
        );
    }
}
