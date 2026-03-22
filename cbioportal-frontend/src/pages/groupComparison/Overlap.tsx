import * as React from 'react';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import Venn from './OverlapVenn';
import _ from 'lodash';
import autobind from 'autobind-decorator';
import {
    DownloadControlOption,
    DownloadControls,
    remoteData,
} from 'cbioportal-frontend-commons';
import { MakeMobxView } from '../../shared/components/MobxView';
import Loader from '../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../shared/components/ErrorMessage';
import {
    getSampleIdentifiers,
    OVERLAP_NOT_ENOUGH_GROUPS_MSG,
    partitionCasesByGroupMembership,
} from './GroupComparisonUtils';
import * as ReactDOM from 'react-dom';
import WindowStore from 'shared/components/window/WindowStore';
import { getPatientIdentifiers } from '../studyView/StudyViewUtils';
import OverlapExclusionIndicator from './OverlapExclusionIndicator';
import OverlapUpset from './OverlapUpset';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import { getServerConfig } from 'config/config';

export interface IOverlapProps {
    store: ComparisonStore;
}

const SVG_ID = 'comparison-tab-overlap-svg';

enum PlotType {
    Upset,
    Venn,
}

@observer
export default class Overlap extends React.Component<IOverlapProps, {}> {
    @observable vennFailed = false;

    constructor(props: IOverlapProps) {
        super(props);
        makeObservable(this);
        (window as any).blah = this;
    }

    @computed get plotExists() {
        return this.plotType.isComplete && !this.vennFailed;
    }

    @action.bound
    private onVennLayoutFailure() {
        this.vennFailed = true;
    }

    readonly tabUI = MakeMobxView({
        await: () => {
            if (
                this.props.store._selectedGroups.isComplete &&
                this.props.store._selectedGroups.result.length < 2
            ) {
                // dont bother loading data for and computing overlap if not enough groups for it
                return [this.props.store._selectedGroups];
            } else {
                return [this.props.store._selectedGroups, this.overlapUI];
            }
        },
        render: () => {
            const content: any[] = [];

            if (this.props.store._selectedGroups.result!.length < 2) {
                content.push(<span>{OVERLAP_NOT_ENOUGH_GROUPS_MSG}</span>);
            } else {
                content.push(
                    <OverlapExclusionIndicator
                        overlapTabMode={true}
                        store={this.props.store}
                    />
                );
                if (this.vennFailed) {
                    content.push(
                        <div className="alert alert-info">
                            We couldn't find a good Venn diagram layout, so
                            showing UpSet diagram instead.
                        </div>
                    );
                }
                content.push(this.overlapUI.component);
            }
            return <div data-test="ComparisonPageOverlapTabDiv">{content}</div>;
        },
        renderPending: () => (
            <Loader isLoading={true} center={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    @autobind
    private getSvg() {
        if (this.plotType.result! === PlotType.Upset) {
            let node = ReactDOM.findDOMNode(this);

            const svg = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            ) as SVGElement;
            const childSVGs = $(node!).find('svg');
            const sampleElement = childSVGs[0].cloneNode(true) as Element;
            const patientElement = childSVGs[1].cloneNode(true) as Element;
            $(node!).find('svg');

            let height = 0;
            let width = 0;

            svg.appendChild(sampleElement);
            //move patient element down by sample element size
            if (this.areUpsetPlotsSidebySide) {
                patientElement.setAttribute('x', `${$(sampleElement).width()}`);
                height = Math.max(
                    $(sampleElement).height()!,
                    $(patientElement).height()!
                );
                width = $(sampleElement).width()! + $(patientElement).width()!;
            } else {
                patientElement.setAttribute(
                    'y',
                    `${$(sampleElement).height()}`
                );
                height =
                    $(sampleElement).height()! + $(patientElement).height()!;
                width = Math.max(
                    $(sampleElement).width()!,
                    $(patientElement).width()!
                );
            }

            $(svg).attr('height', height);
            $(svg).attr('width', width);
            $(svg).css({ height, width });

            svg.appendChild(patientElement);
            return svg;
        }
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    readonly plotType = remoteData({
        await: () => [this.props.store._selectedGroups],
        invoke: () => {
            if (
                this.vennFailed ||
                this.props.store._selectedGroups.result!.length > 3
            ) {
                return Promise.resolve(PlotType.Upset);
            } else {
                return Promise.resolve(PlotType.Venn);
            }
        },
    });

    public readonly sampleGroupsWithCases = remoteData(
        {
            await: () => [
                this.props.store._selectedGroups,
                this.props.store.sampleMap,
            ],
            invoke: () => {
                const sampleSet = this.props.store.sampleMap.result!;
                const groupsWithSamples = _.map(
                    this.props.store._selectedGroups.result,
                    group => {
                        let samples = getSampleIdentifiers([group]).map(
                            sampleIdentifier =>
                                sampleSet.get({
                                    studyId: sampleIdentifier.studyId,
                                    sampleId: sampleIdentifier.sampleId,
                                })
                        );
                        return {
                            uid: group.uid,
                            cases: _.map(
                                samples,
                                sample => sample!.uniqueSampleKey
                            ),
                        };
                    }
                );
                return Promise.resolve(groupsWithSamples);
            },
        },
        []
    );

    public readonly patientGroupsWithCases = remoteData(
        {
            await: () => [
                this.props.store._selectedGroups,
                this.props.store.sampleMap,
            ],
            invoke: () => {
                const sampleSet = this.props.store.sampleMap.result!;
                const groupsWithPatients = _.map(
                    this.props.store._selectedGroups.result,
                    group => {
                        let samples = getSampleIdentifiers([group]).map(
                            sampleIdentifier =>
                                sampleSet.get({
                                    studyId: sampleIdentifier.studyId,
                                    sampleId: sampleIdentifier.sampleId,
                                })
                        );
                        return {
                            uid: group.uid,
                            cases: _.uniq(
                                _.map(
                                    samples,
                                    sample => sample!.uniquePatientKey
                                )
                            ),
                        };
                    }
                );
                return Promise.resolve(groupsWithPatients);
            },
        },
        []
    );

    private activeSamples = remoteData({
        await: () => [
            this.props.store._selectedGroups,
            this.props.store.sampleMap,
        ],
        invoke: () => {
            const sampleSet = this.props.store.sampleMap.result!;
            const activeSampleIdentifiers = getSampleIdentifiers(
                this.props.store._selectedGroups.result!
            );
            const activeSamples = activeSampleIdentifiers.map(
                sampleIdentifier => sampleSet.get(sampleIdentifier)!
            );
            return Promise.resolve(activeSamples);
        },
    });

    private readonly samplesVennPartition = remoteData({
        await: () => [
            this.props.store._selectedGroups,
            this.props.store.sampleMap,
            this.activeSamples,
        ],
        invoke: () => {
            const sampleSet = this.props.store.sampleMap.result!;
            return Promise.resolve(
                partitionCasesByGroupMembership(
                    this.props.store._selectedGroups.result!,
                    group => getSampleIdentifiers([group]),
                    sampleIdentifier =>
                        sampleSet.get({
                            studyId: sampleIdentifier.studyId,
                            sampleId: sampleIdentifier.sampleId,
                        })!.uniqueSampleKey,
                    this.activeSamples.result!.map(s => s.uniqueSampleKey)
                ) as { key: { [uid: string]: boolean }; value: string[] }[]
            );
        },
    });

    private readonly patientsVennPartition = remoteData({
        await: () => [
            this.props.store._selectedGroups,
            this.props.store.patientToSamplesSet,
            this.activeSamples,
        ],
        invoke: () => {
            const patientToSamplesSet = this.props.store.patientToSamplesSet
                .result!;
            return Promise.resolve(
                partitionCasesByGroupMembership(
                    this.props.store._selectedGroups.result!,
                    group => getPatientIdentifiers([group]),
                    patientIdentifier =>
                        patientToSamplesSet.get({
                            studyId: patientIdentifier.studyId,
                            patientId: patientIdentifier.patientId,
                        })![0].uniquePatientKey,
                    _.uniq(
                        this.activeSamples.result!.map(s => s.uniquePatientKey)
                    )
                ) as { key: { [uid: string]: boolean }; value: string[] }[]
            );
        },
    });

    readonly uidToGroup = remoteData({
        await: () => [this.props.store._selectedGroups],
        invoke: () =>
            Promise.resolve(
                _.keyBy(
                    this.props.store._selectedGroups.result!,
                    group => group.uid
                )
            ),
    });

    // whether to display sample and patient sets intersection charts side by side
    @computed get areUpsetPlotsSidebySide() {
        if (
            this.samplesVennPartition.isComplete &&
            this.patientsVennPartition.isComplete
        ) {
            return (
                this.samplesVennPartition.result!.length +
                    this.patientsVennPartition.result!.length <=
                100
            );
        } else {
            return true;
        }
    }

    @computed private get maxWidth() {
        return WindowStore.size.width - 80;
    }

    readonly plot = MakeMobxView({
        await: () => [
            this.plotType,
            this.samplesVennPartition,
            this.patientsVennPartition,
            this.sampleGroupsWithCases,
            this.patientGroupsWithCases,
            this.uidToGroup,
        ],
        render: () => {
            let plotElt: any = null;
            switch (this.plotType.result!) {
                case PlotType.Upset: {
                    plotElt = (
                        <OverlapUpset
                            store={this.props.store}
                            sideBySide={this.areUpsetPlotsSidebySide}
                            maxWidth={this.maxWidth}
                            samplesVennPartition={
                                this.samplesVennPartition.result!
                            }
                            patientsVennPartition={
                                this.patientsVennPartition.result!
                            }
                            uidToGroup={this.uidToGroup.result!}
                        />
                    );
                    break;
                }
                case PlotType.Venn:
                    plotElt = (
                        <Venn
                            svgId={SVG_ID}
                            sampleGroups={this.sampleGroupsWithCases.result!}
                            patientGroups={this.patientGroupsWithCases.result!}
                            uidToGroup={this.uidToGroup.result!}
                            store={this.props.store}
                            onLayoutFailure={this.onVennLayoutFailure}
                        />
                    );
                    break;
                default:
                    return <span>Not implemented yet</span>;
            }
            return plotElt;
        },
        renderPending: () => <Loader isLoading={true} size={'big'} />,
        renderError: () => <ErrorMessage />,
    });

    readonly overlapUI = MakeMobxView({
        await: () => [this.plot],
        render: () => (
            <div
                data-test="ComparisonPageOverlapTabContent"
                className="borderedChart posRelative"
            >
                {this.plotExists && (
                    <DownloadControls
                        getSvg={this.getSvg}
                        getData={this.props.store.getGroupsDownloadDataPromise}
                        buttons={['SVG', 'PNG', 'PDF', 'Data']}
                        filename={'overlap'}
                        dontFade={true}
                        style={{ position: 'absolute', right: 10, top: 10 }}
                        type="button"
                        showDownload={
                            getServerConfig().skin_hide_download_controls ===
                            DownloadControlOption.SHOW_ALL
                        }
                    />
                )}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    {this.plot.component}
                </div>
            </div>
        ),
        renderPending: () => (
            <LoadingIndicator
                isLoading={true}
                centerRelativeToContainer={true}
                size="big"
            />
        ),
        renderError: () => <ErrorMessage />,
    });

    public render() {
        return <div className="inlineBlock">{this.tabUI.component}</div>;
    }
}
