import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, computed, makeObservable } from 'mobx';
import styles from './styles.module.scss';
import { MolecularProfile, Sample } from 'cbioportal-ts-api-client';
import {
    ExpressionEnrichmentWithQ,
    getAlterationsTooltipContent,
    EnrichmentType,
    GenericAssayEnrichmentWithQ,
} from 'pages/resultsView/enrichments/EnrichmentsUtil';
import _ from 'lodash';
import autobind from 'autobind-decorator';
import {
    IBoxScatterPlotPoint,
    IStringAxisData,
    INumberAxisData,
    makeBoxScatterPlotData,
    getBoxPlotDownloadData,
} from 'shared/components/plots/PlotsTabUtils';
import BoxScatterPlot, {
    IBoxScatterPlotData,
} from 'shared/components/plots/BoxScatterPlot';
import {
    remoteData,
    DownloadControls,
    DownloadControlOption,
} from 'cbioportal-frontend-commons';
import client from 'shared/api/cbioportalClientInstance';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { getSampleViewUrl } from 'shared/api/urls';
import classNames from 'classnames';
import { getGeneSummary } from '../querySummary/QuerySummaryUtils';
import { EnrichmentAnalysisComparisonGroup } from 'pages/groupComparison/GroupComparisonUtils';
import {
    COMMON_GENERIC_ASSAY_PROPERTY,
    formatGenericAssayCompactLabelByNameAndId,
    getGenericAssayPropertyOrDefault,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { ExtendedAlteration } from 'shared/model/ExtendedAlteration';
import { getServerConfig } from 'config/config';

class EnrichmentsBoxPlotComponent extends BoxScatterPlot<
    IBoxScatterPlotPoint
> {}

export interface IExpressionEnrichmentsBoxPlotProps {
    selectedProfile: MolecularProfile;
    groups: EnrichmentAnalysisComparisonGroup[];
    sampleKeyToSample: {
        [uniqueSampleKey: string]: Sample;
    };
    enrichmentType: EnrichmentType;
    queriedHugoGeneSymbols?: string[];
    oqlFilteredCaseAggregatedData?: {
        [uniqueSampleKey: string]: ExtendedAlteration[];
    };
    selectedRow?: ExpressionEnrichmentWithQ | GenericAssayEnrichmentWithQ;
    genericAssayType?: string;
}

@observer
export default class ExpressionEnrichmentsBoxPlot extends React.Component<
    IExpressionEnrichmentsBoxPlotProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    static defaultProps: Partial<IExpressionEnrichmentsBoxPlotProps> = {};

    @observable private svgContainer: SVGElement | null = null;

    @autobind
    private getData() {
        if (this.props.selectedRow !== undefined) {
            return getBoxPlotDownloadData(
                this.boxPlotData.result!,
                'Group',
                this.axisLabelY,
                {}
            );
        }
        return '';
    }

    @computed get logScale() {
        return this.props.selectedProfile.molecularProfileId.includes(
            'rna_seq'
        );
    }

    @computed get isGenericAssay() {
        return !!this.props.genericAssayType;
    }

    private get entityName() {
        const selectedRow = this.props
            .selectedRow as GenericAssayEnrichmentWithQ;
        return formatGenericAssayCompactLabelByNameAndId(
            selectedRow.stableId,
            getGenericAssayPropertyOrDefault(
                selectedRow.genericEntityMetaProperties,
                COMMON_GENERIC_ASSAY_PROPERTY.NAME,
                selectedRow.stableId
            )
        );
    }

    @computed get axisLabelY() {
        if (this.props.selectedRow !== undefined) {
            if (this.isGenericAssay) {
                return `${this.entityName}, ${this.props.selectedProfile.name}`;
            } else {
                return `${
                    (this.props.selectedRow as ExpressionEnrichmentWithQ)
                        .hugoGeneSymbol
                }, ${this.props.selectedProfile.name}${
                    this.logScale ? ' (log2)' : ''
                }`;
            }
        }
        return '';
    }

    public readonly horzAxisData = remoteData({
        await: () => [],
        invoke: async () => {
            const categoryOrder = _.map(this.props.groups, group => group.name);
            const axisData = {
                data: [],
                datatype: 'string',
                categoryOrder,
            } as IStringAxisData;

            const sampleKeyToGroupSampleData = _.reduce(
                this.props.groups,
                (acc, group) => {
                    group.samples.forEach(sample => {
                        const uniqueSampleKey = sample.uniqueSampleKey;
                        if (acc[uniqueSampleKey] === undefined) {
                            acc[uniqueSampleKey] = {
                                uniqueSampleKey,
                                value: [],
                            };
                        }
                        acc[uniqueSampleKey].value.push(group.name);
                    });
                    return acc;
                },
                {} as {
                    [uniqueSampleKey: string]: {
                        uniqueSampleKey: string;
                        value: string[];
                    };
                }
            );

            axisData.data = _.values(sampleKeyToGroupSampleData);
            return Promise.resolve(axisData);
        },
    });

    readonly vertAxisData = remoteData({
        invoke: async () => {
            const axisData: INumberAxisData = { data: [], datatype: 'number' };
            if (this.props.selectedRow !== undefined) {
                if (this.isGenericAssay) {
                    const molecularData = await client.fetchGenericAssayDataInMolecularProfileUsingPOST(
                        {
                            molecularProfileId: this.props.selectedProfile
                                .molecularProfileId,
                            genericAssayFilter: {
                                genericAssayStableIds: [
                                    (this.props
                                        .selectedRow as GenericAssayEnrichmentWithQ)
                                        .stableId,
                                ],
                                sampleIds: _.map(
                                    this.props.sampleKeyToSample,
                                    sample => sample.sampleId
                                ),
                            } as any,
                        }
                    );

                    const axisData_Data = axisData.data;

                    for (const d of molecularData) {
                        // generic assay data can be any continuous number optionally prefixed with a '>' or '<' threshold symbol (e.g., '>8.00')
                        // but data with threshold is no a exact number, we should skip those.
                        if (/[<>]+/.test(d.value)) {
                            continue;
                        } else {
                            const value = parseFloat(d.value);
                            axisData_Data.push({
                                uniqueSampleKey: d.uniqueSampleKey,
                                value,
                            });
                        }
                    }
                } else {
                    const molecularData = await client.fetchAllMolecularDataInMolecularProfileUsingPOST(
                        {
                            molecularProfileId: this.props.selectedProfile
                                .molecularProfileId,
                            molecularDataFilter: {
                                entrezGeneIds: [
                                    (this.props
                                        .selectedRow as ExpressionEnrichmentWithQ)
                                        .entrezGeneId,
                                ],
                                sampleIds: _.map(
                                    this.props.sampleKeyToSample,
                                    sample => sample.sampleId
                                ),
                            } as any,
                        }
                    );

                    const axisData_Data = axisData.data;

                    for (const d of molecularData) {
                        const value = this.logScale
                            ? Math.log(d.value + 1) / Math.log(2)
                            : d.value;
                        axisData_Data.push({
                            uniqueSampleKey: d.uniqueSampleKey,
                            value,
                        });
                    }
                }
            }
            return Promise.resolve(axisData);
        },
    });

    private readonly boxPlotData = remoteData<
        IBoxScatterPlotData<IBoxScatterPlotPoint>[]
    >({
        await: () => [this.vertAxisData, this.horzAxisData],
        invoke: () => {
            const horzAxisData = this.horzAxisData.result!;
            const vertAxisData = this.vertAxisData.result;
            if (!horzAxisData || !vertAxisData) {
                return new Promise<any>(() => 0); // dont resolve
            } else {
                let categoryData: IStringAxisData = horzAxisData;
                let numberData: INumberAxisData = vertAxisData;

                return Promise.resolve(
                    makeBoxScatterPlotData(
                        categoryData,
                        numberData,
                        this.props.sampleKeyToSample,
                        {},
                        undefined,
                        undefined
                    )
                );
            }
        },
    });

    @computed get scatterPlotTooltip() {
        return (d: IBoxScatterPlotPoint) => {
            let alterationContent: string | undefined = undefined;
            if (this.props.oqlFilteredCaseAggregatedData) {
                const alterations = this.props.oqlFilteredCaseAggregatedData
                    ? this.props.oqlFilteredCaseAggregatedData[
                          d.uniqueSampleKey
                      ]
                    : [];
                alterationContent =
                    'Alteration(s): ' +
                    getAlterationsTooltipContent(alterations);
            }

            let content = (
                <span>
                    Loading... (this shouldnt appear because the box plot
                    shouldnt be visible)
                </span>
            );
            if (this.boxPlotData.isComplete) {
                if (this.isGenericAssay) {
                    content = (
                        <div>
                            <a
                                href={getSampleViewUrl(d.studyId, d.sampleId)}
                                target="_blank"
                            >
                                <b>{d.sampleId}</b>
                            </a>
                            <br />
                            {this.entityName}: {d.value.toFixed(3)}
                        </div>
                    );
                } else {
                    content = (
                        <div>
                            <a
                                href={getSampleViewUrl(d.studyId, d.sampleId)}
                                target="_blank"
                            >
                                <b>{d.sampleId}</b>
                            </a>
                            <br />
                            {this.props.enrichmentType}
                            {this.logScale ? ' (log2)' : ''}:{' '}
                            {d.value.toFixed(3)}
                            {!!alterationContent && <br />}
                            {alterationContent}
                        </div>
                    );
                }
            }
            return content;
        };
    }

    public render() {
        let plotElt: any = null;
        if (this.props.selectedRow === undefined) {
            plotElt = (
                <div className={classNames('text-center', styles.BoxEmpty)}>
                    Click on {this.isGenericAssay ? 'an entity' : 'gene'} in the
                    table to render this plot.
                </div>
            );
        } else if (this.boxPlotData.isPending) {
            plotElt = (
                <div className={classNames('text-center', styles.BoxEmpty)}>
                    <LoadingIndicator
                        isLoading={true}
                        size={'small'}
                        className={styles.ChartLoader}
                    />
                </div>
            );
        } else if (
            this.boxPlotData.isComplete &&
            this.boxPlotData.result.length > 0
        ) {
            let axisLabelX = `Group`;
            if (
                !this.isGenericAssay &&
                this.props.queriedHugoGeneSymbols !== undefined
            ) {
                axisLabelX = `Query: ${getGeneSummary(
                    this.props.queriedHugoGeneSymbols
                )}`;
            }

            let downloadFileName = '';
            if (this.isGenericAssay) {
                downloadFileName = `${this.props.selectedProfile.genericAssayType}_enrichment`;
            } else {
                downloadFileName = `${
                    this.props.enrichmentType === EnrichmentType.DNA_METHYLATION
                        ? 'methylation'
                        : 'expression'
                }_enrichment`;
            }

            plotElt = (
                <div className={styles.BoxPlot} data-test="MiniBoxPlot">
                    <DownloadControls
                        buttons={['SVG', 'PNG', 'Data']}
                        getSvg={() => this.svgContainer}
                        getData={this.getData}
                        filename={downloadFileName}
                        dontFade={true}
                        style={{ position: 'absolute', right: 10, top: 10 }}
                        type="button"
                        showDownload={
                            getServerConfig().skin_hide_download_controls ===
                            DownloadControlOption.SHOW_ALL
                        }
                    />
                    <EnrichmentsBoxPlotComponent
                        domainPadding={10}
                        startDataAxisAtZero={true}
                        boxWidth={this.boxPlotData.result.length > 7 ? 30 : 60}
                        axisLabelY={this.axisLabelY}
                        axisLabelX={axisLabelX}
                        data={this.boxPlotData.result!}
                        chartBase={320}
                        scatterPlotTooltip={this.scatterPlotTooltip}
                        horizontal={false}
                        fill={'#00AAF8'}
                        symbol="circle"
                        useLogSpaceTicks={true}
                        svgRef={ref => (this.svgContainer = ref)}
                        compressXAxis
                        legendData={[
                            {
                                name: `p-Value: ${toConditionalPrecision(
                                    this.props.selectedRow.pValue,
                                    3,
                                    0.01
                                )}`,
                                symbol: {
                                    fill: 'none',
                                    strokeWidth: 0,
                                },
                            },
                            {
                                name: `q-Value: ${toConditionalPrecision(
                                    this.props.selectedRow.qValue,
                                    3,
                                    0.01
                                )}`,
                                symbol: {
                                    fill: 'none',
                                    strokeWidth: 0,
                                },
                            },
                        ]}
                    />
                </div>
            );
        }
        return (
            <div
                style={{
                    position: 'relative',
                    display: 'inline-block',
                }}
                className="borderedChart"
            >
                {plotElt}
            </div>
        );
    }
}
