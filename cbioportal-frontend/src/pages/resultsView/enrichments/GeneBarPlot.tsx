import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import {
    DownloadControls,
    DefaultTooltip,
    DownloadControlOption,
} from 'cbioportal-frontend-commons';
import autobind from 'autobind-decorator';
import MultipleCategoryBarPlot from 'shared/components/plots/MultipleCategoryBarPlot';
import ReactSelect from 'react-select';
import OQLTextArea, {
    GeneBoxType,
} from 'shared/components/GeneSelectionBox/OQLTextArea';
import _ from 'lodash';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { Gene } from 'cbioportal-ts-api-client';
import {
    getEnrichmentBarPlotData,
    getGeneListOptions,
    CNA_TO_ALTERATION,
    GeneOptionLabel,
} from './EnrichmentsUtil';
import styles from './frequencyPlotStyles.module.scss';
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { FormControl } from 'react-bootstrap';
import { GeneReplacement } from 'shared/components/query/QueryStore';
import { EnrichmentsTableDataStore } from './EnrichmentsTableDataStore';
import { getServerConfig } from 'config/config';

export interface IGeneBarPlotProps {
    data: AlterationEnrichmentRow[];
    groupOrder?: string[];
    isTwoGroupAnalysis?: boolean;
    showCNAInTable?: boolean;
    yAxisLabel: string;
    categoryToColor?: {
        [id: string]: string;
    };
    dataStore: EnrichmentsTableDataStore;
}

const DEFAULT_GENES_COUNT = 10;

const MAXIMUM_ALLOWED_GENES = 100;

const CHART_BAR_WIDTH = 10;

const ALLOWED_CNA_TYPES = ['AMP', 'HOMDEL'];

@observer
export default class GeneBarPlot extends React.Component<
    IGeneBarPlotProps,
    {}
> {
    @observable tooltipModel: any;
    @observable.ref _geneQuery: string | undefined = undefined;
    @observable selectedGenes: SingleGeneQuery[] | undefined;
    @observable _label: GeneOptionLabel | undefined;
    @observable isGeneSelectionPopupVisible: boolean | undefined = false;
    @observable private svgContainer: SVGElement | null;

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @computed get geneListOptions() {
        return getGeneListOptions(this.props.data, this.props.showCNAInTable);
    }

    @computed get defaultOption() {
        return this.geneListOptions.length > 1
            ? this.geneListOptions[1]
            : this.geneListOptions[0];
    }

    @computed get geneDataSet() {
        return _.keyBy(this.props.data, datum => {
            if (this.props.showCNAInTable) {
                //add copy number alteration type 'amp' or 'del'
                return (
                    datum.hugoGeneSymbol +
                    `: ${CNA_TO_ALTERATION[datum.value!]}`
                );
            } else {
                return datum.hugoGeneSymbol;
            }
        });
    }

    @computed get barPlotData() {
        return getEnrichmentBarPlotData(
            this.geneDataSet,
            this.barPlotOrderedGenes
        );
    }

    @computed get barPlotOrderedGenes() {
        let genes: string[] = [];
        if (this._label === GeneOptionLabel.SYNC_WITH_TABLE) {
            return this.tableSelectedGenes;
        }
        if (!this.selectedGenes) {
            genes = this.defaultOption.genes.slice(0, DEFAULT_GENES_COUNT);
        } else {
            // Add alteration to genes in case when both AMP and DEL both show togehter in table
            if (this.props.showCNAInTable) {
                genes = _.flatMap(this.selectedGenes, geneWithAlteration => {
                    //if no alteration sepcified include both AMP and HOMDEL
                    if (geneWithAlteration.alterations === false) {
                        return [
                            geneWithAlteration.gene + ': AMP',
                            geneWithAlteration.gene + ': HOMDEL',
                        ];
                    }

                    const geneKeys: string[] = [];
                    _.each(geneWithAlteration.alterations, alteration => {
                        if (
                            alteration.alteration_type === 'cna' &&
                            alteration.constr_rel === '=' &&
                            ALLOWED_CNA_TYPES.includes(alteration.constr_val!)
                        ) {
                            geneKeys.push(
                                geneWithAlteration.gene +
                                    ': ' +
                                    alteration.constr_val
                            );
                        }
                    });
                    return geneKeys;
                });
            } else {
                genes = this.selectedGenes.map(
                    geneWithAlteration => geneWithAlteration.gene
                );
            }
        }
        return genes;
    }

    @computed get horzCategoryOrder() {
        //include significant genes
        return _.flatMap(this.barPlotOrderedGenes, gene => [gene + '*', gene]);
    }

    @autobind
    private getTooltip(datum: any) {
        let geneSymbol = datum.majorCategory as string;
        // get rid of a trailing *
        geneSymbol = geneSymbol.replace(/\*$/, '');
        let geneData = this.geneDataSet[geneSymbol];
        //use groupOrder inorder of sorted groups
        let groupRows = _.map(this.props.groupOrder, groupName => {
            const group = geneData.groupsSet[groupName];
            let style: any = {};
            //bold row corresponding to highlighed bar
            if (datum.minorCategory === group.name) {
                style = { fontWeight: 'bold' };
            }
            return (
                <tr style={style}>
                    <td>{group.name}</td>
                    <td>
                        {group.alteredPercentage.toFixed(2)}% (
                        {group.alteredCount}/{group.profiledCount})
                    </td>
                </tr>
            );
        });

        return (
            <div>
                <strong>
                    {geneSymbol} {this.props.yAxisLabel}
                </strong>
                <br />
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th scope="col">Group</th>
                            <th scope="col">Percentage Altered</th>
                        </tr>
                    </thead>
                    <tbody>{groupRows}</tbody>
                </table>
                <strong>p-Value</strong>:{' '}
                {geneData.pValue
                    ? toConditionalPrecision(geneData.pValue, 3, 0.01)
                    : '-'}
                <br />
                <strong>q-Value</strong>:{' '}
                {geneData.qValue
                    ? toConditionalPrecision(geneData.qValue, 3, 0.01)
                    : '-'}
            </div>
        );
    }

    @computed private get selectedOption() {
        if (this._label && this._geneQuery !== undefined) {
            return {
                label: this._label,
                value: this._geneQuery,
            };
        }
        //default option
        return {
            label: this.defaultOption.label,
            value: this.defaultOption.genes
                .slice(0, DEFAULT_GENES_COUNT)
                .join('\n'),
        };
    }

    @computed get toolbar() {
        return (
            <React.Fragment>
                <div
                    style={{
                        zIndex: 10,
                        position: 'absolute',
                        top: '10px',
                        left: '15px',
                    }}
                >
                    <strong>{this.selectedOption.label}</strong>
                </div>
                <div
                    style={{
                        zIndex: 10,
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                    }}
                >
                    <div className={styles.ChartControls}>
                        <DefaultTooltip
                            trigger={['click']}
                            destroyTooltipOnHide={false}
                            visible={this.isGeneSelectionPopupVisible}
                            onVisibleChange={visible => {
                                this.isGeneSelectionPopupVisible = visible;
                            }}
                            overlay={
                                <GenesSelection
                                    options={this.geneListOptions}
                                    selectedOption={this.selectedOption}
                                    onSelectedGenesChange={(
                                        value,
                                        genes,
                                        label
                                    ) => {
                                        this._geneQuery = value;
                                        this.selectedGenes = genes;
                                        this._label = label;
                                        this.isGeneSelectionPopupVisible = false;
                                    }}
                                    defaultNumberOfGenes={DEFAULT_GENES_COUNT}
                                />
                            }
                            placement="bottomLeft"
                        >
                            <div>
                                <button
                                    data-test="selectGenes"
                                    className="btn btn-default btn-xs"
                                >
                                    Select genes
                                </button>
                            </div>
                        </DefaultTooltip>
                        <DownloadControls
                            getSvg={() => this.svgContainer}
                            filename={'GroupComparisonGeneFrequencyPlot'}
                            dontFade={true}
                            type="button"
                            showDownload={
                                getServerConfig()
                                    .skin_hide_download_controls ===
                                DownloadControlOption.SHOW_ALL
                            }
                        />
                    </div>
                </div>
            </React.Fragment>
        );
    }

    @computed private get tableSelectedGenes() {
        if (this.props.dataStore.visibleData !== null) {
            return this.props.dataStore.visibleData
                .map(x => x.hugoGeneSymbol)
                .slice(0, MAXIMUM_ALLOWED_GENES);
        }
        return [];
    }

    public render() {
        return (
            <div
                data-test="GeneBarPlotDiv"
                className="borderedChart"
                style={{ position: 'relative', display: 'inline-block' }}
            >
                {this.toolbar}
                <div style={{ overflow: 'auto hidden', position: 'relative' }}>
                    <MultipleCategoryBarPlot
                        barWidth={CHART_BAR_WIDTH}
                        domainPadding={CHART_BAR_WIDTH}
                        chartBase={300}
                        legendLocationWidthThreshold={800}
                        ticksCount={6}
                        horizontalBars={false}
                        percentage={false}
                        stacked={false}
                        plotData={this.barPlotData}
                        axisStyle={{ tickLabels: { fontSize: 10 } }}
                        horzCategoryOrder={this.horzCategoryOrder}
                        vertCategoryOrder={this.props.groupOrder}
                        countAxisLabel={`${this.props.yAxisLabel} (%)`}
                        tooltip={this.getTooltip}
                        categoryToColor={this.props.categoryToColor}
                        svgRef={ref => (this.svgContainer = ref)}
                    />
                </div>
            </div>
        );
    }
}

interface IGeneSelectionProps {
    options: { label: GeneOptionLabel; genes: string[] }[];
    selectedOption?: { label: GeneOptionLabel; value: string };
    onSelectedGenesChange: (
        value: string,
        orderedGenes: SingleGeneQuery[],
        label: GeneOptionLabel
    ) => void;
    defaultNumberOfGenes: number;
    maxNumberOfGenes?: number;
}

@observer
export class GenesSelection extends React.Component<IGeneSelectionProps, {}> {
    static defaultProps: Partial<IGeneSelectionProps> = {
        maxNumberOfGenes: MAXIMUM_ALLOWED_GENES,
    };

    constructor(props: IGeneSelectionProps) {
        super(props);
        makeObservable(this);
        (window as any).genesSelection = this;
    }

    @observable.ref _geneQuery: string | undefined = undefined;
    @observable selectedGenesHasError = false;
    @observable private numberOfGenes = this.props.defaultNumberOfGenes;
    @observable private _selectedGeneListOption:
        | {
              label: GeneOptionLabel;
              value: string;
              genes: string[];
          }
        | undefined;
    @observable.ref genesToPlot: SingleGeneQuery[] = [];

    @computed get geneListOptions() {
        return _.map(this.props.options, option => {
            return {
                label: option.label,
                value: option.genes.join('\n'),
            };
        });
    }

    @computed get geneOptionSet() {
        return _.keyBy(this.props.options, option => option.label);
    }

    @computed get selectedGeneListOption() {
        if (
            this._selectedGeneListOption === undefined &&
            this.props.selectedOption
        ) {
            const selectedOption = this.props.selectedOption;
            return this.geneListOptions.find(opt =>
                opt.value.startsWith(selectedOption.value)
            );
        }
        return this._selectedGeneListOption;
    }

    @computed get isCustomGeneSelection() {
        return (
            this.selectedGeneListOption === undefined ||
            this.selectedGeneListOption.label ===
                GeneOptionLabel.USER_DEFINED_OPTION
        );
    }

    @computed get geneQuery() {
        return this._geneQuery === undefined && this.props.selectedOption
            ? this.props.selectedOption.value
            : this._geneQuery || '';
    }

    @action.bound
    private onChangeGeneInput(
        oql: { query: SingleGeneQuery[]; error?: any },
        genes: { found: Gene[]; suggestions: GeneReplacement[] },
        queryStr: string
    ) {
        const foundGenes = _.keyBy(genes.found, gene =>
            gene.hugoGeneSymbol.toUpperCase()
        );
        const queriedGenes = _.map(oql.query, query =>
            query.gene.toUpperCase()
        );
        if (!_.isEmpty(foundGenes) || !_.isEmpty(genes.suggestions)) {
            this.selectedGenesHasError = !_.every(
                queriedGenes,
                gene => gene in foundGenes
            );
        }
        if (!this.selectedGenesHasError) {
            this.genesToPlot = oql.query;
        }
        if (this.geneQuery !== queryStr) {
            this._selectedGeneListOption = {
                label: GeneOptionLabel.USER_DEFINED_OPTION,
                genes: [],
                value: '',
            };
        }
        this._geneQuery = queryStr;
    }

    @computed get hasUnsupportedOQL() {
        const geneWithUnsupportedOql = _.find(this.genesToPlot, gene => {
            if (gene.alterations && gene.alterations.length > 0) {
                let unsupportedAlteration = _.find(
                    gene.alterations,
                    alteration => {
                        // CNAs must have '=', and 'AMP or 'HOMDEL'
                        if (alteration.alteration_type === 'cna') {
                            return (
                                alteration.constr_rel !== '=' ||
                                !ALLOWED_CNA_TYPES.includes(
                                    alteration.constr_val!
                                )
                            );
                        }
                        // For other alteration types anything is allowed
                        return false;
                    }
                );
                return unsupportedAlteration !== undefined;
            }
            return false;
        });
        return geneWithUnsupportedOql !== undefined;
    }

    @computed get addGenesButtonDisabled() {
        if (this.inSyncMode) {
            return (
                this.props.selectedOption !== undefined &&
                this.props.selectedOption.label ===
                    GeneOptionLabel.SYNC_WITH_TABLE
            );
        } else {
            return (
                this.hasUnsupportedOQL ||
                (this.props.selectedOption &&
                    this.props.selectedOption.value === this._geneQuery) ||
                this.selectedGenesHasError ||
                _.isEmpty(this._geneQuery)
            );
        }
    }

    @action.bound
    public onGeneListOptionChange(option: any) {
        this._selectedGeneListOption = option;
        if (option.value !== '') {
            const genes = this.geneOptionSet[option.label].genes;
            this._geneQuery = genes.slice(0, this.numberOfGenes).join('\n');
        } else {
            this._geneQuery = '';
        }
    }

    @computed private get inSyncMode() {
        return (
            this._selectedGeneListOption &&
            this._selectedGeneListOption.label ===
                GeneOptionLabel.SYNC_WITH_TABLE
        );
    }

    @action.bound
    private handleTotalInputChange(e: any) {
        const newCount: number = e.target.value.replace(/[^0-9]/g, '');
        if (newCount <= this.props.maxNumberOfGenes!) {
            this.numberOfGenes = newCount;
        }
    }

    @action.bound
    private handleTotalInputKeyPress(target: any) {
        if (target.charCode === 13) {
            if (isNaN(this.numberOfGenes)) {
                this.numberOfGenes = 0;
                return;
            }
            this.updateGeneQuery();
        }
    }

    @action.bound
    private onBlur() {
        if (isNaN(this.numberOfGenes)) {
            this.numberOfGenes = 0;
            return;
        }
        this.updateGeneQuery();
    }

    @action.bound
    private updateGeneQuery() {
        //removes leading 0s
        this.numberOfGenes = Number(this.numberOfGenes);
        if (this.selectedGeneListOption) {
            const label = this.selectedGeneListOption.label;
            const genes = this.geneOptionSet[label].genes;
            if (genes.length > 0) {
                this._geneQuery = genes.slice(0, this.numberOfGenes).join('\n');
            }
        }
    }

    public render() {
        return (
            <div style={{ width: 300 }}>
                {this.props.options.length > 0 && (
                    <div data-test="genesSelector">
                        <ReactSelect
                            value={this.selectedGeneListOption}
                            options={this.geneListOptions}
                            onChange={this.onGeneListOptionChange}
                            isClearable={false}
                            isSearchable={false}
                        />
                    </div>
                )}
                {!this.inSyncMode && !this.isCustomGeneSelection && (
                    <div>
                        <br />
                        <div style={{ display: 'table-row' }}>
                            <label
                                style={{
                                    display: 'table-cell',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Number of Genes (max.{' '}
                                {this.props.maxNumberOfGenes}): &nbsp;
                            </label>
                            <FormControl
                                data-test="numberOfGenes"
                                type="text"
                                value={this.numberOfGenes}
                                onChange={this.handleTotalInputChange}
                                onKeyPress={this.handleTotalInputKeyPress}
                                onBlur={this.onBlur}
                            />
                        </div>
                    </div>
                )}
                <div>
                    <br />
                    {!this.inSyncMode && (
                        <div>
                            <OQLTextArea
                                inputGeneQuery={this.geneQuery}
                                validateInputGeneQuery={false}
                                callback={this.onChangeGeneInput}
                                location={GeneBoxType.ONCOPRINT_HEATMAP}
                            />
                            {this.hasUnsupportedOQL && (
                                <strong
                                    style={{
                                        display: 'block',
                                    }}
                                >
                                    <span style={{ color: '#a71111' }}>
                                        {`OQL is not allowed`}
                                    </span>
                                </strong>
                            )}
                            <br />
                        </div>
                    )}

                    <button
                        key="addGenestoBarPlot"
                        data-test="addGenestoBarPlot"
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                            this.props.onSelectedGenesChange(
                                this._geneQuery!,
                                this.genesToPlot,
                                this.selectedGeneListOption!.label
                            );
                        }}
                        disabled={this.addGenesButtonDisabled}
                    >
                        Submit
                    </button>
                </div>
            </div>
        );
    }
}
