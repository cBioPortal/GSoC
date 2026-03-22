import React from 'react';
import { observer } from 'mobx-react';
import {
    ClinicalEvent,
    ClinicalEventData,
    Sample,
} from 'cbioportal-ts-api-client';
import PatientViewMutationsDataStore from '../mutation/PatientViewMutationsDataStore';
import { VAFChartControls } from './VAFChartControls';
import VAFChart, { IColorPoint } from 'pages/patientView/timeline/VAFChart';
import VAFChartWrapperStore from './VAFChartWrapperStore';
import _ from 'lodash';
import 'cbioportal-clinical-timeline/dist/styles.css';

import {
    configureTracks,
    Timeline,
    TimelineStore,
} from 'cbioportal-clinical-timeline';
import SampleManager, {
    clinicalValueToSamplesMap,
} from 'pages/patientView/SampleManager';
import {
    buildBaseConfig,
    configureGenieTimeline,
    sortTracks,
} from 'pages/patientView/timeline/timeline_helpers';
import { CustomTrackSpecification } from 'cbioportal-clinical-timeline/dist/CustomTrack';
import { computed, makeObservable } from 'mobx';
import {
    ceil10,
    computeRenderData,
    floor10,
    getYAxisTickmarks,
    IPoint,
    numLeadingDecimalZeros,
    yValueScaleFunction,
    minimalDistinctTickStrings,
} from './VAFChartUtils';
import { VAFChartHeader } from './VAFChartHeader';
import {
    EllipsisTextTooltip,
    stringListToIndexSet,
} from 'cbioportal-frontend-commons';
import { makeUniqueColorGetter } from 'shared/components/plots/PlotUtils';
import { MultipleSampleMarker } from './SampleMarker';
import { downloadZippedTracks } from 'pages/patientView/timeline/timelineDataUtils';
import { CoverageInformation } from 'shared/lib/GenePanelUtils';

export interface ISampleMetaDeta {
    color: { [sampleId: string]: string };
    index: { [sampleId: string]: number };
    label: { [sampleId: string]: string };
}

export interface IVAFChartWrapperProps {
    wrapperStore: VAFChartWrapperStore;
    dataStore: PatientViewMutationsDataStore;
    data: ClinicalEvent[];
    caseMetaData: ISampleMetaDeta;
    sampleManager: SampleManager;
    width: number;
    samples: Sample[];
    mutationProfileId: string;
    coverageInformation: CoverageInformation;
    headerWidth?: number;
    timelineShowing?: boolean;
}

@observer
export default class VAFChartWrapper extends React.Component<
    IVAFChartWrapperProps,
    {}
> {
    store: TimelineStore;
    wrapperStore: VAFChartWrapperStore;

    constructor(props: IVAFChartWrapperProps) {
        super(props);

        makeObservable(this);

        var isGenieBpcStudy = window.location.href.includes('genie_bpc');

        const baseConfig: any = buildBaseConfig(
            props.sampleManager,
            props.caseMetaData
        );

        if (isGenieBpcStudy) {
            configureGenieTimeline(baseConfig);
        }

        const trackSpecifications = sortTracks(baseConfig, this.props.data);

        configureTracks(trackSpecifications, baseConfig.trackEventRenderers);

        // we can consider perhaps moving store into Timeline component
        // not sure if/why it needs to be out here
        this.store = new TimelineStore(trackSpecifications);
    }

    /** ticks dependencies **/

    @computed get maxYTickmarkValue() {
        if (
            !this.props.wrapperStore.vafChartYAxisToDataRange ||
            this.maxYValue === undefined
        )
            return 1;
        return ceil10(
            this.maxYValue,
            -numLeadingDecimalZeros(this.maxYValue) - 1
        );
    }

    @computed get minYTickmarkValue() {
        if (
            !this.props.wrapperStore.vafChartYAxisToDataRange ||
            this.minYValue === undefined
        )
            return 0;
        return floor10(
            this.minYValue,
            -numLeadingDecimalZeros(this.minYValue) - 1
        );
    }

    @computed get ticks(): { label: string; value: number; offset: number }[] {
        let tickmarkValues = getYAxisTickmarks(
            this.minYTickmarkValue,
            this.maxYTickmarkValue
        );
        const labels = minimalDistinctTickStrings(tickmarkValues);
        const ticksHasDuplicates = tickmarkValues.length !== labels.length;
        if (ticksHasDuplicates) {
            tickmarkValues = labels.map(label => Number(label));
        }
        return _.map(tickmarkValues, (v: number, indx: number) => {
            return {
                label: labels[indx],
                value: v,
                offset: this.scaleYValue(v),
            };
        });
    }

    @computed get yPosition() {
        let scaledY: { [originalY: number]: number } = {};
        this.lineData.forEach((data: IPoint[], index: number) => {
            data.forEach((d: IPoint, i: number) => {
                scaledY[d.y] = this.scaleYValue(d.y);
            });
        });
        return scaledY;
    }

    // returns function for scaling svg y-axis coordinate system
    @computed get scaleYValue() {
        return yValueScaleFunction(
            this.minYTickmarkValue,
            this.maxYTickmarkValue,
            this.props.wrapperStore.dataHeight,
            this.props.wrapperStore.vafChartLogScale
        );
    }

    @computed get mutations() {
        if (this.props.wrapperStore.onlyShowSelectedInVAFChart) {
            return this.props.dataStore.allData.filter(m =>
                this.props.dataStore.isMutationSelected(m[0])
            );
        } else {
            return this.props.dataStore.allData;
        }
    }

    @computed get lineData() {
        return computeRenderData(
            this.props.samples,
            this.mutations,
            this.props.sampleManager.sampleIdToIndexMap,
            this.props.mutationProfileId,
            this.props.coverageInformation,
            this.props.wrapperStore.groupByOption!,
            this.sampleIdToClinicalValue
        ).lineData;
    }

    @computed get scaledAndColoredLineData(): IColorPoint[][] {
        let scaledData: IColorPoint[][] = [];
        this.lineData.map((dataPoints: IPoint[], index: number) => {
            scaledData[index] = [];
            dataPoints.map((dataPoint: IPoint, i: number) => {
                scaledData[index].push({
                    x: this.xPosition[dataPoint.sampleId],
                    y: this.yPosition[dataPoint.y],
                    sampleId: dataPoint.sampleId,
                    mutation: dataPoint.mutation,
                    mutationStatus: dataPoint.mutationStatus,
                    color: this.groupColor(dataPoint.sampleId),
                });
            });
        });
        return scaledData;
    }

    @computed get minYValue() {
        return _(this.lineData)
            .flatten()
            .map((d: IPoint) => d.y)
            .min();
    }

    @computed get maxYValue() {
        return _(this.lineData)
            .flatten()
            .map((d: IPoint) => d.y)
            .max();
    }

    @computed get sampleIdToClinicalValue() {
        let sampleIdToClinicalValue: { [sampleId: string]: string } = {};
        if (this.props.wrapperStore.groupingByIsSelected) {
            this.props.sampleManager.samples.forEach((sample, i) => {
                const clinicalData = SampleManager!.getClinicalAttributeInSample(
                    sample,
                    this.props.wrapperStore.groupByOption!
                );
                sampleIdToClinicalValue[sample.id] =
                    clinicalData != undefined
                        ? clinicalData.value
                        : 'undefined-group';
            });
        }
        return sampleIdToClinicalValue;
    }

    @computed get sampleIconsTracks() {
        const tracks: CustomTrackSpecification[] = [];
        if (this.props.wrapperStore.groupingByIsSelected) {
            _.forIn(this.sampleGroups, (sampleIds: string[], key: string) => {
                const index = parseInt(key);
                tracks.push({
                    renderHeader: () => this.groupByTrackLabel(index),
                    renderTrack: () => this.sampleIcons(sampleIds),
                    height: () => 20,
                    labelForExport: this.clinicalValuesForGrouping[index],
                });
            });
        } else {
            tracks.push({
                renderHeader: () => '',
                renderTrack: () => this.sampleIcons(this.sampleIds),
                height: () => 20,
                labelForExport: 'VAF Samples',
            });
        }
        return tracks;
    }

    @computed get xPosition() {
        let sequentialDistance: number = 0;
        let sequentialPadding: number = 20;
        let samplePosition: { [sampleId: string]: number };
        if (this.props.wrapperStore.showSequentialMode) {
            // if in sequential mode, compute x coordinates using samples array,
            //  since we may not have sample event data
            sequentialDistance =
                (this.store.pixelWidth - sequentialPadding * 2) /
                (this.props.samples.length - 1);

            samplePosition = this.props.samples.reduce((map, sample) => {
                map[sample.sampleId] =
                    this.sampleIdOrder[sample.sampleId] * sequentialDistance +
                    sequentialPadding;
                return map;
            }, {} as { [sampleId: string]: number });
        } else {
            // if not in sequential mode, we use sample event data to compute position
            samplePosition = this.store.sampleEvents.reduce((map, sample) => {
                const sampleIdAttr = sample.event.attributes.find(
                    (a: ClinicalEventData) => a.key === 'SAMPLE_ID'
                )!;
                map[sampleIdAttr.value] = this.store.getPosition(
                    sample
                )!.pixelLeft;
                return map;
            }, {} as { [sampleId: string]: number });
        }
        return samplePosition;
    }

    @computed get sampleIdOrder() {
        return stringListToIndexSet(
            this.props.sampleManager.getSampleIdsInOrder()
        );
    }

    @computed get groupColor() {
        return (sampleId: string) => {
            const color = this.clinicalValueToColor[
                this.sampleIdToClinicalValue[sampleId]
            ];
            return this.props.wrapperStore.groupingByIsSelected &&
                this.numGroupByGroups > 1 &&
                color != undefined
                ? color
                : 'rgb(0,0,0)';
        };
    }

    @computed get clinicalValueToColor() {
        let clinicalValueToColor: { [clinicalValue: string]: string } = {};
        const uniqueColorGetter = makeUniqueColorGetter();
        const map = clinicalValueToSamplesMap(
            this.props.sampleManager.samples,
            this.props.wrapperStore.groupByOption!
        );
        map.forEach((sampleList: string[], clinicalValue: any) => {
            clinicalValueToColor[clinicalValue] = uniqueColorGetter();
        });
        return clinicalValueToColor;
    }

    sampleIcons(sampleIds: string[]) {
        const sampleidsByXCoordinate = _.groupBy(
            sampleIds,
            sampleId => this.xPosition[sampleId]
        );
        const sampleIcons = Object.values(sampleidsByXCoordinate).map(
            groupedSampleIds => {
                const firstSampleId = groupedSampleIds[0];
                const x = this.xPosition[firstSampleId];
                const y = 10;

                const colors = groupedSampleIds.map(
                    sampleId => this.props.caseMetaData.color[sampleId]
                ) || ['#333333'];
                const labels = groupedSampleIds.map(
                    sampleId => this.props.caseMetaData.label[sampleId]
                ) || ['-'];
                return (
                    <g transform={`translate(${x})`}>
                        <MultipleSampleMarker
                            colors={colors}
                            labels={labels}
                            y={y}
                        />
                    </g>
                );
            }
        );
        return <g>{sampleIcons}</g>;
    }

    groupByTrackLabel(groupIndex: number) {
        return (
            <EllipsisTextTooltip
                text={this.clinicalValuesForGrouping[groupIndex]}
                style={{
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    color: this.groupColorByGroupIndex(groupIndex),
                }}
            />
        );
    }

    groupColorByGroupIndex(groupIndex: number) {
        const groupColor = this.clinicalValueToColor[
            this.clinicalValuesForGrouping[groupIndex]
        ];
        return this.props.wrapperStore.groupingByIsSelected &&
            this.numGroupByGroups > 1 &&
            groupColor != undefined
            ? groupColor
            : 'rgb(0,0,0)';
    }

    @computed get numGroupByGroups() {
        return this.props.wrapperStore.groupingByIsSelected
            ? _.keys(this.sampleGroups).length
            : 0;
    }

    @computed get sampleIds() {
        return this.props.samples.map(s => s.sampleId);
    }

    @computed get sampleGroups() {
        let sampleGroups: { [groupIndex: number]: string[] } = {};
        this.sampleIds.forEach((sampleId, i) => {
            // check the group value of this sample id
            if (
                sampleGroups[
                    this.clinicalValuesForGrouping.indexOf(
                        this.sampleIdToClinicalValue[sampleId]
                    )
                ] == undefined
            )
                sampleGroups[
                    this.clinicalValuesForGrouping.indexOf(
                        this.sampleIdToClinicalValue[sampleId]
                    )
                ] = [];
            sampleGroups[
                this.clinicalValuesForGrouping.indexOf(
                    this.sampleIdToClinicalValue[sampleId]
                )
            ].push(sampleId);
        });
        return sampleGroups;
    }

    @computed get clinicalValuesForGrouping() {
        let clinicalValuesForGrouping: string[] = [];
        const map = clinicalValueToSamplesMap(
            this.props.sampleManager.samples,
            this.props.wrapperStore.groupByOption!
        );
        map.forEach((sampleList: string[], clinicalValue: any) => {
            clinicalValuesForGrouping.push(clinicalValue);
        });
        return clinicalValuesForGrouping;
    }

    @computed get vafChartHeight() {
        let footerHeight: number = 20;
        return _.sum([this.props.wrapperStore.dataHeight, footerHeight]);
    }

    @computed get customTracks() {
        const mouseOverMutation = this.props.dataStore.mouseOverMutation;
        const selectedMutations = this.props.dataStore.selectedMutations;
        const lineData = this.scaledAndColoredLineData;
        const height = this.vafChartHeight;
        const headerWidth =
            this.numGroupByGroups > 0 ? 150 : this.props.headerWidth;

        const vafPlotTrack = {
            renderHeader: (store: TimelineStore) => (
                <div className={'positionAbsolute'} style={{ right: -6 }}>
                    <VAFChartHeader
                        ticks={this.ticks}
                        legendHeight={this.vafChartHeight}
                    />
                </div>
            ),
            renderTrack: (store: TimelineStore) => {
                return (
                    <VAFChart
                        mouseOverMutation={mouseOverMutation}
                        onMutationMouseOver={m =>
                            this.props.dataStore.setMouseOverMutation(m)
                        }
                        selectedMutations={selectedMutations}
                        onMutationClick={m =>
                            this.props.dataStore.toggleSelectedMutation(m)
                        }
                        onlyShowSelectedInVAFChart={
                            this.props.wrapperStore.onlyShowSelectedInVAFChart
                        }
                        lineData={lineData}
                        height={height}
                        width={this.store.viewPortWidth}
                    />
                );
            },
            disableHover: true,
            height: (store: TimelineStore) => height,
            labelForExport: 'VAF',
        } as CustomTrackSpecification;

        return [vafPlotTrack].concat(this.sampleIconsTracks);
    }

    render() {
        if (!this.store || !this.props.wrapperStore) return null;

        return (
            <>
                <div style={{ marginTop: 20 }} data-test={'VAFChartWrapper'}>
                    <VAFChartControls
                        wrapperStore={this.props.wrapperStore}
                        sampleManager={this.props.sampleManager}
                    />
                    <Timeline
                        key={`this.props.headerWidth-${this.numGroupByGroups.toString()}-${
                            this.props.wrapperStore.showSequentialMode
                                ? 'seq'
                                : 'noseq'
                        }`}
                        store={this.store}
                        onClickDownload={() =>
                            downloadZippedTracks(this.props.data)
                        }
                        width={this.props.width}
                        hideLabels={false}
                        hideXAxis={this.props.wrapperStore.showSequentialMode}
                        visibleTracks={[]}
                        disableZoom={true}
                        customTracks={this.customTracks}
                        headerWidth={
                            this.numGroupByGroups > 0
                                ? 150
                                : this.props.headerWidth
                        }
                    />
                </div>
            </>
        );
    }
}
