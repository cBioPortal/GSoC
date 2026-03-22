import * as React from 'react';
import { computed, makeObservable } from 'mobx';
import { observer, Observer } from 'mobx-react';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { getSampleViewUrl } from '../../../shared/api/urls';
import './styles.scss';
import { bind } from 'bind-decorator';
import ScatterPlot from '../../../shared/components/plots/ScatterPlot';
import {
    DownloadControlOption,
    DownloadControls,
} from 'cbioportal-frontend-commons';
import {
    axisLabel,
    getDownloadData,
    isNotProfiled,
} from './CoExpressionPlotUtils';
import _ from 'lodash';
import { scatterPlotSize } from '../../../shared/components/plots/PlotUtils';
import { IAxisLogScaleParams } from 'shared/components/plots/PlotsTabUtils';
import autobind from 'autobind-decorator';
import { GeneticEntity } from 'shared/model/GeneticEntity';
import { getServerConfig } from 'config/config';

export interface ICoExpressionPlotProps {
    xAxisGeneticEntity: GeneticEntity;
    yAxisGeneticEntity: GeneticEntity;
    data: CoExpressionPlotData[];
    molecularProfileY: MolecularProfile;
    molecularProfileX: MolecularProfile;

    height: number;
    width: number;

    showLogScaleControls?: boolean;
    showMutationControls?: boolean;
    showMutations?: boolean;
    logScale?: boolean;
    showRegressionLine: boolean;
    handlers: {
        onClickShowMutations?: () => void;
        onClickLogScale?: () => void;
        onClickShowRegressionLine: () => void;
    };
}

export type CoExpressionPlotData = {
    x: number;
    y: number;
    mutationsX: string;
    mutationsY: string;
    profiledX: boolean;
    profiledY: boolean;
    studyId: string;
    sampleId: string;
};

class CoExpressionScatterPlot extends ScatterPlot<CoExpressionPlotData> {}

const NO_MUT_STROKE = '#0174df';
const NO_MUT_FILL = '#58acfa';
const X_MUT_STROKE = '#886A08';
const X_MUT_FILL = '#DBA901';
const Y_MUT_STROKE = '#F7819F';
const Y_MUT_FILL = '#F5A9F2';
const BOTH_MUT_STROKE = '#B40404';
const BOTH_MUT_FILL = '#FF0000';
const NOT_PROFILED_STROKE = '#d3d3d3';
const NOT_PROFILED_FILL = '#ffffff';

function noop() {}

const SVG_ID = 'coexpression-plot-svg';

@observer
export default class CoExpressionPlot extends React.Component<
    ICoExpressionPlotProps,
    {}
> {
    constructor(props: ICoExpressionPlotProps) {
        super(props);
        makeObservable(this);
    }

    @bind
    private getSvg() {
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    @computed get stroke() {
        if (this.props.showMutations) {
            return (d: {
                mutationsX: string;
                mutationsY: string;
                profiledX: boolean;
                profiledY: boolean;
            }) => {
                if (isNotProfiled(d)) {
                    return NOT_PROFILED_STROKE;
                } else if (d.mutationsX && d.mutationsY) {
                    return BOTH_MUT_STROKE;
                } else if (!d.mutationsX && !d.mutationsY) {
                    return NO_MUT_STROKE;
                } else if (d.mutationsX) {
                    return X_MUT_STROKE;
                } else {
                    return Y_MUT_STROKE;
                }
            };
        } else {
            return NO_MUT_STROKE;
        }
    }

    @computed get fill() {
        if (this.props.showMutations) {
            return (d: {
                mutationsX: string;
                mutationsY: string;
                profiledX: boolean;
                profiledY: boolean;
            }) => {
                if (isNotProfiled(d)) {
                    return NOT_PROFILED_FILL;
                } else if (d.mutationsX && d.mutationsY) {
                    return BOTH_MUT_FILL;
                } else if (!d.mutationsX && !d.mutationsY) {
                    return NO_MUT_FILL;
                } else if (d.mutationsX) {
                    return X_MUT_FILL;
                } else {
                    return Y_MUT_FILL;
                }
            };
        } else {
            return NO_MUT_FILL;
        }
    }

    @computed get mutationLegendElements() {
        if (!this.props.showMutations) {
            return [];
        }
        let hasBoth = false;
        let hasX = false;
        let hasY = false;
        let hasNone = false;
        let hasNotProfiled = false;
        for (const d of this.data) {
            if (isNotProfiled(d)) {
                hasNotProfiled = true;
            }
            if (d.mutationsX && d.mutationsY) {
                hasBoth = true;
            } else if (!d.mutationsX && !d.mutationsY) {
                hasNone = true;
            } else if (d.mutationsX) {
                hasX = true;
            } else {
                hasY = true;
            }
        }

        const ret = [];
        if (hasX) {
            ret.push({
                name: [
                    this.props.xAxisGeneticEntity.geneticEntityName,
                    'mutated',
                ],
                symbol: { fill: X_MUT_FILL, stroke: X_MUT_STROKE },
            });
        }
        if (hasY) {
            ret.push({
                name: [
                    this.props.yAxisGeneticEntity.geneticEntityName,
                    'mutated',
                ],
                symbol: { fill: Y_MUT_FILL, stroke: Y_MUT_STROKE },
            });
        }
        if (hasBoth) {
            ret.push({
                name: `Both mutated`,
                symbol: { fill: BOTH_MUT_FILL, stroke: BOTH_MUT_STROKE },
            });
        }
        if (hasNone) {
            ret.push({
                name: `Neither mutated`,
                symbol: { fill: NO_MUT_FILL, stroke: NO_MUT_STROKE },
            });
        }
        if (hasNotProfiled) {
            ret.push({
                name: 'Not profiled for mutations',
                symbol: {
                    fill: NOT_PROFILED_FILL,
                    stroke: NOT_PROFILED_STROKE,
                },
            });
        }
        return ret;
    }

    @computed get data() {
        // sort in order to set z index in plot
        // order: both mutated, one mutated, neither mutated, not profiled
        return _.sortBy(this.props.data, d => {
            if (d.mutationsX && d.mutationsY) {
                return 3;
            } else if (d.mutationsX || d.mutationsY) {
                return 2;
            } else if (!isNotProfiled(d)) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    private get title() {
        return `${this.props.xAxisGeneticEntity.geneticEntityName} vs. ${this.props.yAxisGeneticEntity.geneticEntityName}`;
    }

    @computed get axisLabelX() {
        return axisLabel(
            {
                geneticEntityName: this.props.xAxisGeneticEntity
                    .geneticEntityName,
                cytoband: this.props.xAxisGeneticEntity.cytoband,
            },
            this.axisLogScaleFunction,
            this.props.molecularProfileX.name
        );
    }

    @computed get axisLabelY() {
        return axisLabel(
            {
                geneticEntityName: this.props.yAxisGeneticEntity
                    .geneticEntityName,
            },
            this.axisLogScaleFunction,
            this.props.molecularProfileY.name
        );
    }

    @computed get axisLogScaleFunction(): IAxisLogScaleParams | undefined {
        const MIN_LOG_ARGUMENT = 0.01;

        if (!this.props.logScale) {
            return undefined;
        }
        return {
            label: 'log2',
            fLogScale: (x: number, offset: number) =>
                Math.log2(Math.max(x, MIN_LOG_ARGUMENT)),
            fInvLogScale: (x: number) => Math.pow(2, x),
        };
    }

    @bind
    private plot() {
        if (!this.data.length) {
            return <div className={'alert alert-info'}>No data to plot.</div>;
        }
        return (
            <CoExpressionScatterPlot
                svgId={SVG_ID}
                title={this.title}
                data={this.data}
                size={scatterPlotSize}
                chartWidth={this.props.width}
                chartHeight={this.props.height}
                stroke={this.stroke}
                fill={this.fill}
                strokeWidth={1.2}
                legendData={this.mutationLegendElements}
                showRegressionLine={this.props.showRegressionLine}
                logX={this.axisLogScaleFunction}
                logY={this.axisLogScaleFunction}
                useLogSpaceTicks={true}
                axisLabelX={this.axisLabelX}
                axisLabelY={this.axisLabelY}
                tooltip={this.tooltip}
                fontFamily="Arial,Helvetica"
            />
        );
    }

    @bind
    private toolbar() {
        return (
            <div style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ display: 'inline-block' }}>
                    {this.props.showMutationControls && (
                        <div className="checkbox coexpression-plot-toolbar-elt">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={this.props.showMutations}
                                    onClick={
                                        this.props.handlers
                                            .onClickShowMutations || noop
                                    }
                                    data-test="ShowMutations"
                                />
                                Show Mutations
                            </label>
                        </div>
                    )}
                    {this.props.showLogScaleControls && (
                        <div className="coexpression-plot-toolbar-elt">
                            <div className="checkbox coexpression-plot-toolbar-elt">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={this.props.logScale}
                                        onClick={
                                            this.props.handlers
                                                .onClickLogScale || noop
                                        }
                                        data-test="logScale"
                                    />
                                    Log Scale
                                </label>
                            </div>
                        </div>
                    )}
                    <div className="checkbox coexpression-plot-toolbar-elt">
                        <label>
                            <input
                                type="checkbox"
                                checked={this.props.showRegressionLine}
                                onClick={
                                    this.props.handlers
                                        .onClickShowRegressionLine
                                }
                                data-test="ShowRegressionLine"
                            />
                            Show Regression Line
                        </label>
                    </div>
                </div>

                <DownloadControls
                    getSvg={this.getSvg}
                    getData={this.getDownloadData}
                    buttons={['SVG', 'PNG', 'PDF', 'Data']}
                    filename="coexpression"
                    dontFade={true}
                    type="button"
                    style={{ position: 'absolute', top: 0, right: 0 }}
                    showDownload={
                        getServerConfig().skin_hide_download_controls ===
                        DownloadControlOption.SHOW_ALL
                    }
                />
            </div>
        );
    }

    @autobind
    private getDownloadData() {
        return getDownloadData(
            this.props.data,
            this.props.xAxisGeneticEntity,
            this.props.yAxisGeneticEntity,
            this.props.molecularProfileX,
            this.props.molecularProfileY,
            !!this.props.showMutations
        );
    }

    @bind
    private tooltip(d: CoExpressionPlotData) {
        return (
            <div>
                <div>
                    <span>Sample ID: </span>
                    <a href={getSampleViewUrl(d.studyId, d.sampleId)}>
                        {d.sampleId}
                    </a>
                </div>
                <div>
                    <span>
                        {this.props.xAxisGeneticEntity.geneticEntityName}:&nbsp;
                        <b>{d.x.toFixed(2)}</b>
                    </span>
                </div>
                <div>
                    <span>
                        {this.props.yAxisGeneticEntity.geneticEntityName}:&nbsp;
                        <b>{d.y.toFixed(2)}</b>
                    </span>
                </div>
                {d.mutationsX && (
                    <div>
                        <span>
                            {this.props.xAxisGeneticEntity.geneticEntityName}{' '}
                            Mutation:&nbsp;
                            <b>{d.mutationsX}</b>
                        </span>
                    </div>
                )}
                {d.mutationsY && (
                    <div>
                        <span>
                            {this.props.yAxisGeneticEntity.geneticEntityName}{' '}
                            Mutation:&nbsp;
                            <b>{d.mutationsY}</b>
                        </span>
                    </div>
                )}
            </div>
        );
    }

    render() {
        return (
            <div
                className="borderedChart inlineBlock"
                data-test="CoExpressionPlot"
            >
                <Observer>{this.toolbar}</Observer>
                <Observer>{this.plot}</Observer>
            </div>
        );
    }
}
