import * as React from 'react';
import { observer } from 'mobx-react';
import UpSet from './UpSet';
import { ComparisonGroup } from './GroupComparisonUtils';
import { action, makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import CreateGroupFromOverlap from './CreateGroupFromOverlap';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import GroupComparisonStore from './GroupComparisonStore';
import { SessionGroupData } from 'shared/api/session-service/sessionServiceModels';

export interface IOverlapUpsetProps {
    store: ComparisonStore;
    sideBySide: boolean;
    maxWidth: number;
    samplesVennPartition: {
        key: { [uid: string]: boolean };
        value: string[];
    }[];
    patientsVennPartition: {
        key: { [uid: string]: boolean };
        value: string[];
    }[];
    uidToGroup: { [uid: string]: ComparisonGroup };
}

@observer
export default class OverlapUpset extends React.Component<
    IOverlapUpsetProps,
    {}
> {
    @observable.shallow sampleSelection: string[][] = [];
    @observable.shallow patientSelection: string[][] = [];

    @observable.ref sampleUpset: UpSet | null = null;
    @observable.ref patientUpset: UpSet | null = null;

    constructor(props: IOverlapUpsetProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private changeSelectedSampleRegions(combinations: string[][]) {
        this.sampleSelection = combinations;
    }

    @action.bound
    private changeSelectedPatientRegions(combinations: string[][]) {
        this.patientSelection = combinations;
    }

    @autobind
    private sampleUpsetRef(upset: UpSet | null) {
        this.sampleUpset = upset;
    }

    @autobind
    private patientUpsetRef(upset: UpSet | null) {
        this.patientUpset = upset;
    }

    @action.bound
    private submitSampleOverlapGroup(
        group: SessionGroupData,
        saveToUser: boolean
    ) {
        this.props.store.addGroup(group, saveToUser);
        this.sampleSelection = [];
    }

    @action.bound
    private submitPatientOverlapGroup(
        group: SessionGroupData,
        saveToUser: boolean
    ) {
        this.props.store.addGroup(group, saveToUser);
        this.patientSelection = [];
    }

    render() {
        return (
            <div
                style={{
                    position: 'relative',
                    display: `${this.props.sideBySide ? 'flex' : 'block'}`,
                    maxWidth: this.props.maxWidth,
                    overflow: 'auto hidden',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        paddingBottom: 20,
                        marginRight: this.props.sideBySide ? 10 : undefined,
                    }}
                >
                    <UpSet
                        ref={this.sampleUpsetRef}
                        groups={this.props.samplesVennPartition}
                        uidToGroup={this.props.uidToGroup}
                        caseType="sample"
                        title="Samples overlap"
                        onChangeSelectedCombinations={
                            this.changeSelectedSampleRegions
                        }
                        selectedCombinations={this.sampleSelection}
                    />
                    {this.sampleUpset &&
                        this.props.samplesVennPartition.length > 0 && (
                            <CreateGroupFromOverlap
                                store={this.props.store}
                                includedRegions={this.sampleSelection}
                                submitGroup={this.submitSampleOverlapGroup}
                                allGroupsInPlot={Object.keys(
                                    this.props.samplesVennPartition[0].key
                                )}
                                caseType="sample"
                                width={this.sampleUpset.svgWidth}
                            />
                        )}
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <UpSet
                        ref={this.patientUpsetRef}
                        groups={this.props.patientsVennPartition}
                        uidToGroup={this.props.uidToGroup}
                        caseType="patient"
                        title="Patients overlap"
                        onChangeSelectedCombinations={
                            this.changeSelectedPatientRegions
                        }
                        selectedCombinations={this.patientSelection}
                    />
                    {this.patientUpset &&
                        this.props.patientsVennPartition.length > 0 && (
                            <CreateGroupFromOverlap
                                store={this.props.store}
                                includedRegions={this.patientSelection}
                                submitGroup={this.submitPatientOverlapGroup}
                                allGroupsInPlot={Object.keys(
                                    this.props.patientsVennPartition[0].key
                                )}
                                caseType="patient"
                                width={this.patientUpset.svgWidth}
                            />
                        )}
                </div>
            </div>
        );
    }
}
