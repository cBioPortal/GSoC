import * as React from 'react';
import { observer } from 'mobx-react';
import { VictoryLabel, VictoryLegend } from 'victory';
import { CBIOPORTAL_VICTORY_THEME } from 'cbioportal-frontend-commons';
import { action, computed, makeObservable, observable } from 'mobx';
import { ComparisonGroup } from './GroupComparisonUtils';
import RectangleVennDiagram from './rectangleVennDiagram/RectangleVennDiagram';
import CreateGroupFromOverlap from './CreateGroupFromOverlap';
import autobind from 'autobind-decorator';
import { GroupLegendLabelComponent } from './labelComponents/GroupLegendLabelComponent';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import GroupComparisonStore from './GroupComparisonStore';
import { SessionGroupData } from 'shared/api/session-service/sessionServiceModels';

export interface IVennProps {
    svgId?: string;
    sampleGroups: {
        uid: string;
        cases: string[];
    }[];
    patientGroups: {
        uid: string;
        cases: string[];
    }[];
    uidToGroup: { [uid: string]: ComparisonGroup };
    store: ComparisonStore;
    onLayoutFailure: () => void;
}

const VENN_PLOT_WIDTH = 400;
const PADDING_BTWN_SAMPLE_AND_PATIENT = 10;
const VENN_PLOT_HEIGHT = 400;
const PADDING_BTWN_VENN_AND_LEGEND = 20;
const LEGEND_WIDTH = 180;

@observer
export default class Venn extends React.Component<IVennProps, {}> {
    constructor(props: IVennProps) {
        super(props);
        makeObservable(this);
    }

    @observable.shallow sampleSelection = {
        regions: [] as number[][],
    };
    @observable.shallow patientSelection = {
        regions: [] as number[][],
    };

    @computed get chartWidth() {
        return (
            this.vennPlotAreaWidth + PADDING_BTWN_VENN_AND_LEGEND + LEGEND_WIDTH
        );
    }

    @computed get chartHeight() {
        return 500;
    }

    @action.bound
    private submitSampleOverlapGroup(
        group: SessionGroupData,
        saveToUser: boolean
    ) {
        this.props.store.addGroup(group, saveToUser);
        this.sampleSelection.regions = [];
    }

    @action.bound
    private submitPatientOverlapGroup(
        group: SessionGroupData,
        saveToUser: boolean
    ) {
        this.props.store.addGroup(group, saveToUser);
        this.patientSelection.regions = [];
    }

    @action.bound
    private changeSelectedSampleRegions(regions: number[][]) {
        this.sampleSelection.regions = regions;
    }

    @action.bound
    private changeSelectedPatientRegions(regions: number[][]) {
        this.patientSelection.regions = regions;
    }

    @computed get sampleGroupUids() {
        return this.props.sampleGroups.map(g => g.uid);
    }

    @computed get patientGroupUids() {
        return this.props.patientGroups.map(g => g.uid);
    }

    @computed get legendData() {
        return this.props.sampleGroups.map(sampleGroup => {
            return {
                name: sampleGroup.uid,
                symbol: {
                    fill: this.props.uidToGroup[sampleGroup.uid].color,
                    strokeOpacity: 0,
                    type: 'square',
                    size: 6,
                },
            };
        });
    }

    @computed get vennPlotAreaWidth() {
        return 2 * VENN_PLOT_WIDTH + PADDING_BTWN_SAMPLE_AND_PATIENT;
    }

    @computed get sampleSelectedRegionsUids() {
        return this.sampleSelection.regions.map(comb =>
            comb.map(index => {
                return this.props.sampleGroups[index].uid;
            })
        );
    }
    @computed get patientSelectedRegionsUids() {
        return this.patientSelection.regions.map(comb =>
            comb.map(index => {
                return this.props.patientGroups[index].uid;
            })
        );
    }

    public render() {
        return (
            <div
                style={{
                    position: 'relative',
                    paddingBottom: `${Math.max(
                        this.sampleSelection.regions.length,
                        this.patientSelection.regions.length
                    ) + 1}em`,
                }}
            >
                <svg
                    id={this.props.svgId || ''}
                    aria-label={this.props.svgId || 'Overlap Venn'}
                    xmlns="http://www.w3.org/2000/svg"
                    width={this.chartWidth}
                    height={this.chartHeight}
                    role="img"
                    viewBox={`0 0 ${this.chartWidth} ${this.chartHeight}`}
                >
                    <VictoryLabel
                        style={{
                            fontWeight: 'bold',
                            fontFamily: 'Verdana,Arial,sans-serif',
                            textAnchor: 'middle',
                            userSelect: 'none',
                        }}
                        x={VENN_PLOT_WIDTH / 2}
                        y="1.2em"
                        text={'Samples overlap'}
                    />
                    <RectangleVennDiagram
                        uid="samples"
                        x={0}
                        y={15}
                        groups={this.props.sampleGroups}
                        uidToGroup={this.props.uidToGroup}
                        width={VENN_PLOT_WIDTH}
                        height={VENN_PLOT_HEIGHT}
                        selection={this.sampleSelection}
                        onChangeSelectedRegions={
                            this.changeSelectedSampleRegions
                        }
                        caseType="sample"
                        onLayoutFailure={this.props.onLayoutFailure}
                    />

                    <VictoryLabel
                        style={{
                            fontWeight: 'bold',
                            fontFamily: 'Verdana,Arial,sans-serif',
                            textAnchor: 'middle',
                            userSelect: 'none',
                        }}
                        x={VENN_PLOT_WIDTH / 2}
                        dx={VENN_PLOT_WIDTH + PADDING_BTWN_SAMPLE_AND_PATIENT}
                        y="1.2em"
                        text={'Patients overlap'}
                    />

                    <RectangleVennDiagram
                        uid="patients"
                        x={VENN_PLOT_WIDTH + PADDING_BTWN_SAMPLE_AND_PATIENT}
                        y={15}
                        groups={this.props.patientGroups}
                        uidToGroup={this.props.uidToGroup}
                        width={VENN_PLOT_WIDTH}
                        height={VENN_PLOT_HEIGHT}
                        selection={this.patientSelection}
                        onChangeSelectedRegions={
                            this.changeSelectedPatientRegions
                        }
                        caseType="patient"
                        onLayoutFailure={this.props.onLayoutFailure}
                    />

                    {this.legendData.length > 0 && (
                        <VictoryLegend
                            x={
                                this.vennPlotAreaWidth +
                                PADDING_BTWN_VENN_AND_LEGEND
                            }
                            y={100}
                            theme={CBIOPORTAL_VICTORY_THEME}
                            labelComponent={
                                <GroupLegendLabelComponent
                                    maxLabelWidth={100}
                                    uidToGroup={this.props.uidToGroup}
                                    dy="0.4em"
                                />
                            }
                            standalone={false}
                            data={this.legendData}
                        />
                    )}
                </svg>
                {[
                    <CreateGroupFromOverlap
                        store={this.props.store}
                        includedRegions={this.sampleSelectedRegionsUids}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: VENN_PLOT_HEIGHT + 20,
                        }}
                        submitGroup={this.submitSampleOverlapGroup}
                        allGroupsInPlot={this.sampleGroupUids}
                        caseType="sample"
                        width={VENN_PLOT_WIDTH}
                    />,
                    <CreateGroupFromOverlap
                        store={this.props.store}
                        includedRegions={this.patientSelectedRegionsUids}
                        style={{
                            position: 'absolute',
                            left:
                                VENN_PLOT_WIDTH +
                                PADDING_BTWN_SAMPLE_AND_PATIENT,
                            top: VENN_PLOT_HEIGHT + 20,
                        }}
                        submitGroup={this.submitPatientOverlapGroup}
                        allGroupsInPlot={this.patientGroupUids}
                        caseType="patient"
                        width={VENN_PLOT_WIDTH}
                    />,
                ]}
            </div>
        );
    }
}
