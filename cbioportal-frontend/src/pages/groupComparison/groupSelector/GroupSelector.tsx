import * as React from 'react';
import { observer } from 'mobx-react';
import { MakeMobxView } from 'shared/components/MobxView';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from 'shared/components/ErrorMessage';
import autobind from 'autobind-decorator';
import GroupSelectorButton from './GroupSelectorButton';
import GroupSelectorButtonList from './GroupSelectorButtonList';
import SelectAllDeselectAll from './SelectAllDeselectAll';
import ComparisonStore, {
    OverlapStrategy,
} from '../../../shared/lib/comparison/ComparisonStore';
import { action, computed, makeObservable, observable } from 'mobx';
import { ComparisonGroup } from '../GroupComparisonUtils';
import CollapsedGroupsButton from './CollapsedGroupsButton';
import { submitToStudyViewPage } from 'pages/resultsView/querySummary/QuerySummaryUtils';
import _ from 'lodash';

export interface IGroupSelectorProps {
    store: ComparisonStore;
    groupCollapseThreshold?: number;
    isGroupDeletable: (group: ComparisonGroup) => boolean;
}

@observer
export default class GroupSelector extends React.Component<
    IGroupSelectorProps,
    {}
> {
    @observable collapsedGroupsShown = false;
    private dragging = false;

    constructor(props: IGroupSelectorProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private toggleCollapsedGroups() {
        this.collapsedGroupsShown = !this.collapsedGroupsShown;
    }

    @autobind
    private isSelected(groupName: string) {
        return !!this.props.store.isGroupSelected(groupName);
    }

    // @autobind
    // private onClick(groupName: string) {
    //     const original = this.props.store._originalGroups.result!;

    //     if (!this.dragging) {
    //         this.props.store.toggleGroupSelected(groupName);
    //     }

    //     const matchingGroup = original.find(ele => ele.name === groupName)!

    //     const groupStudies = matchingGroup.studies.map((study) => {
    //         return {studyId: study.id}
    //     });

    //     const groupSamples = _(matchingGroup.studies).flatMap((study) => {
    //         return study.samples.map((sample => {
    //             return {
    //                 studyId: study.id,
    //                 sampleId: sample
    //             }
    //         }))
    //     }).value()

    //     submitToStudyViewPage(
    //         groupStudies,
    //         groupSamples,
    //         true
    //     );
    // }

    @autobind
    private onClick(groupName: string) {
        if (!this.dragging) {
            this.props.store.toggleGroupSelected(groupName);
        }
    }

    @autobind
    private onClickDelete(groupName: string) {
        if (!this.dragging) {
            this.props.store.deleteGroup(groupName);
        }
    }

    @autobind
    private onClickOpenStudyViewGroup(groupName: string) {
        const original = this.props.store._originalGroups.result!;

        const matchingGroup = original.find(ele => ele.name === groupName)!;

        const groupStudies = matchingGroup.studies.map(study => {
            return { studyId: study.id };
        });

        const groupSamples = _(matchingGroup.studies)
            .flatMap(study => {
                return study.samples.map(sample => {
                    return {
                        studyId: study.id,
                        sampleId: sample,
                    };
                });
            })
            .value();

        submitToStudyViewPage(groupStudies, groupSamples, true);
    }

    @autobind
    private onSortEnd(params: any) {
        if (params.oldIndex !== params.newIndex)
            this.props.store.updateGroupOrder(params.oldIndex, params.newIndex);

        this.dragging = false;
    }

    @autobind
    private onSortStart() {
        this.dragging = true;
    }

    @autobind
    private makeGroupButton(group: ComparisonGroup, index: number) {
        const excludedFromAnalysis =
            this.props.store.overlapStrategy === OverlapStrategy.EXCLUDE &&
            group.uid in
                this.props.store.overlapComputations.result!
                    .excludedFromAnalysis;

        return (
            <GroupSelectorButton
                isSelected={this.isSelected}
                deletable={this.props.isGroupDeletable(group)}
                onClick={this.onClick}
                onClickDelete={this.onClickDelete}
                onClickOpenStudyViewGroup={this.onClickOpenStudyViewGroup}
                sampleSet={this.props.store.sampleMap.result!}
                group={group}
                index={index}
                excludedFromAnalysis={excludedFromAnalysis}
            />
        );
    }

    readonly tabUI = MakeMobxView({
        await: () => [
            this.props.store._originalGroups,
            this.props.store.sampleMap,
            this.props.store.overlapComputations,
        ],
        render: () => {
            const numGroups = this.props.store._originalGroups.result!.length;
            if (numGroups === 0) {
                return null;
            } else {
                let buttons: any[] = [];
                if (
                    this.props.groupCollapseThreshold === undefined ||
                    numGroups <= this.props.groupCollapseThreshold ||
                    this.collapsedGroupsShown
                ) {
                    // don't collapse, show all buttons
                    buttons = this.props.store._originalGroups.result!.map(
                        this.makeGroupButton
                    );
                } else {
                    buttons.push(
                        ...this.props.store._originalGroups
                            .result!.slice(
                                0,
                                this.props.groupCollapseThreshold - 1
                            )
                            .map(this.makeGroupButton)
                    );
                }

                if (
                    this.props.groupCollapseThreshold !== undefined &&
                    numGroups > this.props.groupCollapseThreshold
                ) {
                    // show the collapse/decollapse button if there are more than threshold groups
                    const collapsedGroups =
                        numGroups - this.props.groupCollapseThreshold + 1;
                    buttons.push(
                        <CollapsedGroupsButton
                            numCollapsedGroups={collapsedGroups}
                            toggleCollapsedGroups={this.toggleCollapsedGroups}
                            collapsed={!this.collapsedGroupsShown}
                            disabled={true} // cant drag
                            index={buttons.length}
                        />
                    );
                }

                buttons.push(
                    <SelectAllDeselectAll
                        store={this.props.store}
                        disabled={true}
                        index={buttons.length}
                    />
                );
                return (
                    <div
                        data-tour="single-study-group-comparison-groups"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            position: 'relative',
                        }}
                    >
                        <strong style={{ marginRight: 5 }}>Groups: </strong>
                        <span style={{ fontSize: 12, marginRight: 3 }}>
                            (drag to reorder)
                        </span>
                        <GroupSelectorButtonList
                            buttons={buttons}
                            axis="xy"
                            onSortStart={this.onSortStart}
                            onSortEnd={this.onSortEnd}
                            distance={6}
                        />
                    </div>
                );
            }
        },
        renderPending: () => (
            <LoadingIndicator isLoading={true} size="big" center={true} />
        ),
        renderError: () => <ErrorMessage />,
    });

    render() {
        return this.tabUI.component;
    }
}
