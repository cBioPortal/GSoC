import * as React from 'react';
import _ from 'lodash';
import { observer, Observer } from 'mobx-react';
import './styles.scss';
import {
    CancerStudy,
    Gene,
    NumericGeneMolecularData,
    MolecularProfile,
} from 'cbioportal-ts-api-client';
import { computed, observable, makeObservable } from 'mobx';
import {
    ExpressionStyle,
    expressionTooltip,
    getPossibleRNASeqVersions,
} from './expressionHelpers';
import { Modal } from 'react-bootstrap';
import autobind from 'autobind-decorator';
import { ITooltipModel } from '../../../shared/model/ITooltipModel';
import ChartContainer from '../../../shared/components/ChartContainer/ChartContainer';
import { If, Then, Else } from 'react-if';
import jStat from 'jStat';
import classNames from 'classnames';
import { MSKTab, MSKTabs } from '../../../shared/components/MSKTabs/MSKTabs';
import { isPanCanStudy, isTCGAProvStudy } from '../ResultsViewPageStoreUtils';
import { CoverageInformation } from '../../../shared/lib/GenePanelUtils';
import {
    CNA_STROKE_WIDTH,
    IBoxScatterPlotPoint,
    INumberAxisData,
    IPlotSampleData,
    IStringAxisData,
    makeBoxScatterPlotData,
    makeScatterPlotPointAppearance,
    scatterPlotLegendData,
    scatterPlotZIndexSortBy,
    IAxisLogScaleParams,
    basicAppearance,
} from 'shared/components/plots/PlotsTabUtils';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import OqlStatusBanner from '../../../shared/components/banners/OqlStatusBanner';
import {
    MobxPromise,
    remoteData,
    stringListToSet,
} from 'cbioportal-frontend-commons';
import MobxPromiseCache from '../../../shared/lib/MobxPromiseCache';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import BoxScatterPlot, {
    IBoxScatterPlotData,
} from '../../../shared/components/plots/BoxScatterPlot';
import {
    ColoringType,
    PlotType,
    SelectedColoringTypes,
} from '../../../shared/components/plots/PlotsTab';
import AlterationFilterWarning from '../../../shared/components/banners/AlterationFilterWarning';
import CaseFilterWarning from '../../../shared/components/banners/CaseFilterWarning';
import { getBoxWidth } from 'shared/lib/boxPlotUtils';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';

export interface ExpressionWrapperProps {
    store: ResultsViewPageStore;
    expressionProfiles: MobxPromise<MolecularProfile[]>;
    numericGeneMolecularDataCache: MobxPromiseCache<
        { entrezGeneId: number; molecularProfileId: string },
        NumericGeneMolecularData[]
    >;
    studyMap: { [studyId: string]: CancerStudy };
    genes: Gene[];
    mutations: AnnotatedMutation[];
    coverageInformation: CoverageInformation;
}

class ExpressionTabBoxPlot extends BoxScatterPlot<IBoxScatterPlotPoint> {}

const SVG_ID = 'expression-tab-plot-svg';

export type ScatterPoint = { x: number; y: NumericGeneMolecularData };

type SortOptions = 'alphabetic' | 'median';

type ExpressionTooltipModel = {
    studyName: string;
    studyId: string;
    mutationType: string | null;
    proteinChange: string | null;
    sampleId: string;
    expression: number;
    style: ExpressionStyle;
};

@observer
export default class ExpressionWrapper extends React.Component<
    ExpressionWrapperProps,
    {}
> {
    constructor(props: ExpressionWrapperProps) {
        super(props);
        makeObservable(this);
        this.selectedGene = props.genes[0];
        (window as any).box = this;
    }

    componentWillMount() {
        // initialize selected study state. study is on except if it does not have any data (doesn't appear in data collection)
        this.selectedStudyIds = _.mapValues(this.props.studyMap, study => true);
    }

    svgContainer: SVGElement;

    @observable private _rnaSeqVersion: 'rna_seq_mrna' | 'rna_seq_v2_mrna';

    @observable.ref tooltipModel: ITooltipModel<
        ExpressionTooltipModel
    > | null = null;

    @observable.ref selectedGene: Gene;

    @observable studySelectorModalVisible = false;

    @observable showMutations: boolean = true;

    @observable showCna: boolean = false;

    @observable selectedStudyIds: { [studyId: string]: boolean } = {};

    @observable height = 700;

    @observable logScale = true;

    @observable sortBy: SortOptions = 'alphabetic';

    @observable isTooltipHovered = false;

    // for debugging
    @observable public showMutationType = [];

    tooltipCounter: number = 0;

    @computed get selectedStudies() {
        return _.filter(
            this.props.studyMap,
            study => this.selectedStudyIds[study.studyId] === true
        );
    }

    @computed get widthThreshold() {
        return this.selectedStudies.length > 7;
    }

    @computed get boxWidth() {
        return getBoxWidth(this.selectedStudies.length);
    }

    readonly sampleStudyData = remoteData<IStringAxisData>({
        await: () => [this.props.store.samples],
        invoke: () => {
            // data representing the horizontal axis - which sample is in which study
            return Promise.resolve({
                data: this.props.store.samples.result!.reduce(
                    (_data, sample) => {
                        // filter out data for unselected studies
                        if (this.selectedStudyIds[sample.studyId]) {
                            _data.push({
                                uniqueSampleKey: sample.uniqueSampleKey,
                                value: this.props.studyMap[sample.studyId].name,
                            });
                        }
                        return _data;
                    },
                    [] as IStringAxisData['data']
                ),
                datatype: 'string',
            });
        },
    });

    @computed get selectedRNASeqVersion() {
        return this._rnaSeqVersion
            ? this._rnaSeqVersion
            : this.possibleRNASeqVersions[0].value;
    }

    @computed get possibleRNASeqVersions() {
        if (this.props.expressionProfiles.isComplete) {
            return getPossibleRNASeqVersions(
                this.props.expressionProfiles.result!
            );
        }
        return [];
    }

    readonly selectedExpressionProfiles = remoteData<MolecularProfile[]>({
        await: () => [this.props.expressionProfiles],
        invoke: () => {
            return Promise.resolve(
                _.filter(
                    this.props.expressionProfiles.result,
                    expressionProfile => {
                        return RegExp(
                            `${this.selectedRNASeqVersion}$|pan_can_atlas_2018_${this.selectedRNASeqVersion}_median$`
                        ).test(expressionProfile.molecularProfileId);
                    }
                )
            );
        },
    });

    readonly expressionData = remoteData<NumericGeneMolecularData[]>({
        await: () =>
            this.props.numericGeneMolecularDataCache.await(
                [this.selectedExpressionProfiles],
                profiles =>
                    profiles.map((p: MolecularProfile) => ({
                        entrezGeneId: this.selectedGene.entrezGeneId,
                        molecularProfileId: p.molecularProfileId,
                    }))
            ),
        invoke: () => {
            // TODO: this cache is leading to some ugly code
            return Promise.resolve(
                _.flatten(
                    this.props.numericGeneMolecularDataCache
                        .getAll(
                            this.selectedExpressionProfiles.result!.map(p => ({
                                entrezGeneId: this.selectedGene.entrezGeneId,
                                molecularProfileId: p.molecularProfileId,
                            }))
                        )
                        .map(promise => promise.result!)
                ) as NumericGeneMolecularData[]
            );
        },
    });

    readonly studiesWithExpressionData = remoteData<{
        [studyId: string]: boolean;
    }>({
        await: () => [this.expressionData],
        invoke: () => {
            const studyIds = _.chain<NumericGeneMolecularData[]>(
                this.expressionData.result!
            )
                .map(d => d.studyId)
                .uniq()
                .value();
            return Promise.resolve(stringListToSet(studyIds));
        },
    });

    readonly mutationDataExists = remoteData({
        await: () => [this.props.store.studyToMutationMolecularProfile],
        invoke: () => {
            return Promise.resolve(
                !!_.values(this.props.store.studyToMutationMolecularProfile)
                    .length
            );
        },
    });

    readonly cnaDataExists = remoteData({
        await: () => [this.props.store.studyToMolecularProfileDiscreteCna],
        invoke: () => {
            return Promise.resolve(
                !!_.values(this.props.store.studyToMolecularProfileDiscreteCna)
                    .length
            );
        },
    });

    readonly cnaData = remoteData({
        await: () => {
            if (this.cnaDataShown && this.selectedGene !== undefined) {
                return [
                    this.props.store.annotatedCnaCache.get({
                        entrezGeneId: this.selectedGene.entrezGeneId,
                    }),
                ];
            } else {
                return [];
            }
        },
        invoke: () => {
            if (this.cnaDataShown && this.selectedGene !== undefined) {
                return Promise.resolve(
                    this.props.store.annotatedCnaCache.get({
                        entrezGeneId: this.selectedGene.entrezGeneId,
                    }).result!
                );
            } else {
                return Promise.resolve([]);
            }
        },
    });

    @computed get mutationDataShown() {
        return this.mutationDataExists.result && this.showMutations;
    }

    @computed get cnaDataShown() {
        return this.cnaDataExists.result && this.showCna;
    }

    readonly _unsortedBoxPlotData = remoteData({
        await: () => [
            this.sampleStudyData,
            this.expressionData,
            this.props.store.sampleKeyToSample,
            this.props.store.studyToMutationMolecularProfile,
            this.props.store.studyToMolecularProfileDiscreteCna,
            this.cnaData,
        ],
        invoke: () => {
            return Promise.resolve(
                makeBoxScatterPlotData(
                    this.sampleStudyData.result!,
                    {
                        data: this.expressionData.result!,
                        datatype: 'number',
                        hugoGeneSymbol: this.selectedGene.hugoGeneSymbol,
                    } as INumberAxisData,
                    this.props.store.sampleKeyToSample.result!,
                    this.props.coverageInformation.samples,
                    this.mutationDataExists.result
                        ? {
                              molecularProfileIds: _.values(
                                  this.props.store
                                      .studyToMutationMolecularProfile.result!
                              ).map(p => p.molecularProfileId),
                              data: this.props.mutations.filter(
                                  m =>
                                      m.entrezGeneId ===
                                      this.selectedGene.entrezGeneId
                              ),
                          }
                        : undefined,
                    this.cnaDataShown
                        ? {
                              molecularProfileIds: _.values(
                                  this.props.store
                                      .studyToMolecularProfileDiscreteCna
                                      .result!
                              ).map(p => p.molecularProfileId),
                              data: this.cnaData.result!,
                          }
                        : undefined
                )
            );
        },
    });

    readonly boxPlotData = remoteData({
        await: () => [this._unsortedBoxPlotData],
        invoke: () => {
            /*// sort data order within boxes, for rendering order (z-index)
            const sortedData = this._unsortedBoxPlotData.result!.map(labelAndData=>({
                label: labelAndData.label,
                data: sortScatterPlotDataForZIndex<IBoxScatterPlotPoint>(labelAndData.data, this.viewType)
            }));*/
            const sortedData = this._unsortedBoxPlotData.result!;

            // sort box order
            if (this.sortBy === 'alphabetic') {
                return Promise.resolve(
                    _.sortBy<any>(
                        sortedData,
                        (d: IBoxScatterPlotData<IBoxScatterPlotPoint>) =>
                            d.label
                    )
                );
            } else {
                return Promise.resolve(
                    _.sortBy<any>(
                        sortedData,
                        (d: IBoxScatterPlotData<IBoxScatterPlotPoint>) => {
                            //Note: we have to use slice to convert Seamless immutable array to real array, otherwise jStat chokes
                            return jStat.median(
                                Array.prototype.slice.apply(
                                    d.data.map(
                                        (v: IBoxScatterPlotPoint) =>
                                            v.value as number
                                    )
                                )
                            );
                        }
                    )
                );
            }
        },
    });

    @computed get studyTypeCounts() {
        const allStudies = _.values(this.props.studyMap);
        return {
            provisional: allStudies.filter(study =>
                isTCGAProvStudy(study.studyId)
            ),
            panCancer: allStudies.filter(study => isPanCanStudy(study.studyId)),
        };
    }

    @autobind
    handleStudySelection(event: React.SyntheticEvent<HTMLInputElement>) {
        // toggle state of it
        this.selectedStudyIds[event.currentTarget.value] = !this
            .selectedStudyIds[event.currentTarget.value];
    }

    @autobind
    handleRNASeqVersionChange(event: React.SyntheticEvent<HTMLSelectElement>) {
        this._rnaSeqVersion = event.currentTarget.value as any;
    }

    @autobind
    handleSortByChange(event: React.SyntheticEvent<HTMLSelectElement>) {
        this.sortBy = event.currentTarget.value as any;
    }

    @autobind
    handleSelectAllStudies() {
        if (this.studiesWithExpressionData.isComplete) {
            this.applyStudyFilter(study => {
                return study.studyId in this.studiesWithExpressionData.result!;
            });
        }
    }

    @autobind
    handleDeselectAllStudies() {
        this.applyStudyFilter(study => {
            return false;
        });
    }

    @computed get hasUnselectedStudies() {
        if (this.studiesWithExpressionData.isComplete) {
            return (
                undefined !==
                _.find(this.props.studyMap, study => {
                    const hasData =
                        study.studyId in this.studiesWithExpressionData.result!;
                    const isSelected = this.selectedStudies.includes(study);
                    return hasData && !isSelected;
                })
            );
        } else {
            return false;
        }
    }

    @computed
    get alphabetizedAndFilteredStudies() {
        return _.chain(this.props.studyMap)
            .values()
            .filter(
                (study: CancerStudy) =>
                    study.studyId in
                    (this.studiesWithExpressionData.result || {})
            )
            .sortBy((study: CancerStudy) => study.name)
            .value();
    }

    @computed
    get studySelectionModal() {
        return (
            <Modal
                data-test="ExpressionStudyModal"
                show={true}
                onHide={() => {
                    this.studySelectorModalVisible = false;
                }}
                className="cbioportal-frontend"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Select Studies</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <div>
                            <a
                                data-test="ExpressionStudySelectAll"
                                className={classNames({
                                    hidden: !this.hasUnselectedStudies,
                                })}
                                onClick={this.handleSelectAllStudies}
                            >
                                Select all
                            </a>
                            <span
                                className={classNames({
                                    hidden:
                                        !this.hasUnselectedStudies ||
                                        this.selectedStudies.length === 0,
                                })}
                            >
                                &nbsp;|&nbsp;
                            </span>
                            <a
                                data-test="ExpressionStudyUnselectAll"
                                className={classNames({
                                    hidden: this.selectedStudies.length === 0,
                                })}
                                onClick={this.handleDeselectAllStudies}
                            >
                                Deselect all
                            </a>
                        </div>
                        {_.map(
                            this.alphabetizedAndFilteredStudies,
                            (study: CancerStudy) => {
                                return (
                                    <div className="checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={
                                                    this.selectedStudyIds[
                                                        study.studyId
                                                    ] === true
                                                }
                                                value={study.studyId}
                                                onChange={
                                                    this.handleStudySelection
                                                }
                                            />
                                            {study.name}
                                        </label>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </Modal.Body>
            </Modal>
        );
    }

    @autobind
    public applyStudyFilter(test: (study: CancerStudy) => boolean) {
        this.selectedStudyIds = _.mapValues(
            this.props.studyMap,
            (study: CancerStudy, studyId: string) => {
                return test(study);
            }
        );
    }

    @autobind
    public handleTabClick(id: string, datum: Gene) {
        this.selectedGene = datum;
    }

    @computed
    get yAxisLabel() {
        const log = this.logScale ? ' (log2)' : '';
        let rnaSeqVersion = '1';
        if (this.selectedRNASeqVersion === 'rna_seq_v2_mrna') {
            rnaSeqVersion = '2';
        }
        return `${this.selectedGene.hugoGeneSymbol} Expression --- RNA Seq V${rnaSeqVersion}${log}`;
    }

    @computed get fill() {
        if (this.showCna || this.showMutations) {
            return (d: IPlotSampleData) => this.scatterPlotAppearance(d).fill!;
        } else {
            return basicAppearance.fill;
        }
    }

    @computed get fillOpacity() {
        if (!this.showMutations && this.showCna) {
            // no fill for CNA mode
            return 0;
        } else {
            return 0.7;
        }
    }

    @computed get strokeWidth() {
        if (this.showCna) {
            return CNA_STROKE_WIDTH;
        } else {
            return 1;
        }
    }

    @autobind
    private strokeOpacity(d: IPlotSampleData) {
        return this.scatterPlotAppearance(d).strokeOpacity;
    }

    @autobind
    private stroke(d: IPlotSampleData) {
        return this.scatterPlotAppearance(d).stroke;
    }

    @computed get scatterPlotAppearance() {
        return makeScatterPlotPointAppearance(
            this.coloringTypes,
            this.mutationDataExists.result!,
            this.cnaDataExists.result!,
            false,
            this.props.store.driverAnnotationSettings.driversAnnotated
        );
    }

    @computed get coloringTypes() {
        const ret: SelectedColoringTypes = {};
        if (this.showMutations) {
            ret[ColoringType.MutationType] = true;
        }
        if (this.showCna) {
            ret[ColoringType.CopyNumber] = true;
        }
        return ret;
    }

    private boxCalculationFilter(d: IBoxScatterPlotPoint) {
        // filter out zero values from box calculation
        return d.value !== 0;
    }

    @autobind
    private tooltip(d: IBoxScatterPlotPoint) {
        let content;
        if (this.props.store.studyIdToStudy.isComplete) {
            content = expressionTooltip(
                d,
                this.props.store.studyIdToStudy.result!
            );
        } else {
            content = <span>Loading...</span>;
        }
        return content;
    }

    @computed get zIndexSortBy() {
        return scatterPlotZIndexSortBy<IPlotSampleData>(this.coloringTypes);
    }

    @computed get axisLogScaleFunction(): IAxisLogScaleParams | undefined {
        const MIN_LOG_ARGUMENT = 0.01;

        if (!this.logScale) {
            return undefined;
        }
        return {
            label: 'log2',
            fLogScale: (x: number, offset: number) =>
                Math.log2(Math.max(x, MIN_LOG_ARGUMENT)),
            fInvLogScale: (x: number) => Math.pow(2, x),
        };
    }

    @autobind
    private getChart() {
        if (
            this.boxPlotData.isComplete &&
            this.mutationDataExists.isComplete &&
            this.cnaDataExists.isComplete
        ) {
            return (
                <ChartContainer
                    getSVGElement={this.getSvg}
                    exportFileName={this.exportFileName}
                >
                    <ExpressionTabBoxPlot
                        svgId={SVG_ID}
                        domainPadding={50}
                        startDataAxisAtZero={true}
                        boxWidth={this.boxWidth}
                        axisLabelY={this.yAxisLabel}
                        data={this.boxPlotData.result}
                        chartBase={550}
                        scatterPlotTooltip={this.tooltip}
                        horizontal={false}
                        logScale={this.axisLogScaleFunction}
                        size={4}
                        fill={this.fill}
                        stroke={this.stroke}
                        strokeOpacity={this.strokeOpacity}
                        zIndexSortBy={this.zIndexSortBy}
                        symbol="circle"
                        fillOpacity={this.fillOpacity}
                        strokeWidth={this.strokeWidth}
                        useLogSpaceTicks={true}
                        legendData={scatterPlotLegendData(
                            _.flatten(this.boxPlotData.result.map(d => d.data)),
                            this.coloringTypes,
                            PlotType.BoxPlot,
                            this.props.store.driverAnnotationSettings
                                .driversAnnotated,
                            []
                        )}
                        legendLocationWidthThreshold={900}
                        boxCalculationFilter={this.boxCalculationFilter}
                    />
                </ChartContainer>
            );
        } else {
            return <span></span>;
        }
    }

    @autobind
    private getSvg() {
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    @computed get exportFileName() {
        // TODO: more specific?
        return 'Expression';
    }

    render() {
        return (
            <div data-test="expressionTabDiv">
                <div className={'tabMessageContainer'}>
                    <OqlStatusBanner
                        className="expression-oql-status-banner"
                        queryContainsOql={this.props.store.queryContainsOql}
                        tabReflectsOql={false}
                        style={{ marginTop: -1, marginBottom: 12 }}
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
                {this.studySelectorModalVisible && this.studySelectionModal}
                <div style={{ marginBottom: 15 }}>
                    <MSKTabs
                        onTabClick={this.handleTabClick}
                        arrowStyle={{ 'line-height': 0.8 }}
                        unmountOnHide={true}
                        tabButtonStyle="pills"
                        activeTabId={
                            'summaryTab' + this.selectedGene.hugoGeneSymbol
                        }
                        className="pillTabs"
                    >
                        {this.props.genes.map((gene: Gene) => {
                            return (
                                <MSKTab
                                    key={gene.hugoGeneSymbol}
                                    datum={gene}
                                    id={'summaryTab' + gene.hugoGeneSymbol}
                                    linkText={gene.hugoGeneSymbol}
                                />
                            );
                        })}
                    </MSKTabs>

                    <form
                        className="form-inline expression-controls"
                        style={{ marginBottom: 10 }}
                    >
                        <div className="form-group">
                            <h5>Profile:</h5>

                            <select
                                className="form-control input-sm"
                                value={this.selectedRNASeqVersion}
                                onChange={this.handleRNASeqVersionChange}
                                title="Select profile"
                            >
                                {this.possibleRNASeqVersions.map(option => {
                                    return (
                                        <option value={option.value}>
                                            {option.label}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        {this.boxPlotData.isComplete &&
                            this.boxPlotData.result.length > 1 && (
                                <div className="form-group">
                                    <h5>Sort By:</h5>

                                    <select
                                        className="form-control input-sm"
                                        value={this.sortBy}
                                        onChange={this.handleSortByChange}
                                        title="Select profile"
                                    >
                                        <option value={'alphabetic'}>
                                            Cancer Study
                                        </option>
                                        <option value={'median'}>Median</option>
                                    </select>
                                </div>
                            )}

                        <div className="form-group">
                            <label className="checkbox-inline">
                                <input
                                    type="checkbox"
                                    checked={this.logScale}
                                    onChange={() =>
                                        (this.logScale = !this.logScale)
                                    }
                                    title="Log scale"
                                />
                                Log scale
                            </label>
                            {this.mutationDataExists.result && (
                                <label className="checkbox-inline">
                                    <input
                                        type="checkbox"
                                        checked={this.showMutations}
                                        onChange={() =>
                                            (this.showMutations = !this
                                                .showMutations)
                                        }
                                        title="Show mutations *"
                                    />
                                    Show mutations *
                                </label>
                            )}
                            {this.cnaDataExists.result && (
                                <label className="checkbox-inline">
                                    <input
                                        type="checkbox"
                                        checked={this.showCna}
                                        onChange={() =>
                                            (this.showCna = !this.showCna)
                                        }
                                        title="Show copy number alterations"
                                    />
                                    Show copy number alterations
                                </label>
                            )}
                        </div>
                    </form>

                    {this.studiesWithExpressionData.isComplete && (
                        <div>
                            <label>Select studies:</label>&nbsp;
                            <If
                                condition={
                                    this.studyTypeCounts.provisional.length > 0
                                }
                            >
                                <button
                                    className="btn btn-default btn-xs"
                                    style={{ marginRight: 5 }}
                                    onClick={() =>
                                        this.applyStudyFilter(
                                            (study: CancerStudy) =>
                                                isTCGAProvStudy(study.studyId)
                                        )
                                    }
                                >
                                    TCGA Provisional (
                                    {this.studyTypeCounts.provisional.length})
                                </button>
                            </If>
                            <If
                                condition={
                                    this.studyTypeCounts.panCancer.length > 0
                                }
                            >
                                <button
                                    className="btn btn-default btn-xs"
                                    style={{ marginRight: 5 }}
                                    onClick={() =>
                                        this.applyStudyFilter(
                                            (study: CancerStudy) =>
                                                isPanCanStudy(study.studyId)
                                        )
                                    }
                                >
                                    TCGA Pan-Can Atlas (
                                    {this.studyTypeCounts.panCancer.length})
                                </button>
                            </If>
                            <button
                                data-test="ExpressionStudyModalButton"
                                className="btn btn-default btn-xs"
                                onClick={() =>
                                    (this.studySelectorModalVisible = !this
                                        .studySelectorModalVisible)
                                }
                            >
                                Custom list
                            </button>
                        </div>
                    )}

                    <div className="collapse">
                        <div className="well"></div>
                    </div>
                </div>

                <LoadingIndicator
                    center={true}
                    size="big"
                    isLoading={
                        this.boxPlotData.isPending ||
                        this.studiesWithExpressionData.isPending
                    }
                />

                {this.boxPlotData.isComplete && (
                    <If condition={this.selectedStudies.length > 0}>
                        <Then>
                            <If
                                condition={_.size(this.boxPlotData.result!) > 0}
                            >
                                <Then>
                                    <div className="posRelative">
                                        <Observer>{this.getChart}</Observer>
                                        {this.mutationDataExists.result && (
                                            <div style={{ marginTop: 20 }}>
                                                * Driver annotation settings are
                                                located in the Mutation Color
                                                menu of the Oncoprint.
                                            </div>
                                        )}
                                    </div>
                                </Then>
                                <Else>
                                    <div className="alert alert-info">
                                        No expression data for this query.
                                    </div>
                                </Else>
                            </If>
                        </Then>
                        <Else>
                            <div className="alert alert-info">
                                No studies selected.
                            </div>
                        </Else>
                    </If>
                )}
            </div>
        );
    }
}
