import * as React from 'react';
import { SyntheticEvent } from 'react';
import { observer } from 'mobx-react';
import { StudyViewPageStore } from '../../studyView/StudyViewPageStore';
import { action, computed, makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import {
    DUPLICATE_GROUP_NAME_MSG,
    getDefaultGroupName,
    MAX_GROUPS_IN_SESSION,
    StudyViewComparisonGroup,
} from '../GroupComparisonUtils';
import {
    getComparisonLoadingUrl,
    redirectToComparisonPage,
} from '../../../shared/api/urls';
import styles, { sharedGroup } from '../styles.module.scss';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import {
    getGroupParameters,
    getSelectedGroups,
} from './ComparisonGroupManagerUtils';
import comparisonClient from '../../../shared/api/comparisonGroupClientInstance';
import { MakeMobxView } from '../../../shared/components/MobxView';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import GroupCheckbox from './GroupCheckbox';
import { sleepUntil } from '../../../shared/lib/TimeUtils';
import { LoadingPhase } from '../GroupComparisonLoading';
import _ from 'lodash';
import { serializeEvent } from 'shared/lib/tracking';
import { openSocialAuthWindow } from 'shared/lib/openSocialAuthWindow';
import classnames from 'classnames';
import { getReservedGroupColor } from 'shared/lib/Colors';

export interface IComparisonGroupManagerProps {
    store: StudyViewPageStore;
    shareGroups: (groups: StudyViewComparisonGroup[]) => void;
    onGroupColorChange?: (groupId: string, color: string) => void;
}

@observer
export default class ComparisonGroupManager extends React.Component<
    IComparisonGroupManagerProps,
    {}
> {
    @observable groupNameFilter: string = '';
    @observable addGroupPanelOpen = false;
    @observable _inputGroupName: string = '';
    @computed get inputGroupName() {
        return this._inputGroupName;
    }
    @observable addSamplesTargetGroupId: string = '';

    constructor(props: IComparisonGroupManagerProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private onChangeGroupNameFilter(e: SyntheticEvent<HTMLInputElement>) {
        this.groupNameFilter = (e.target as HTMLInputElement).value;
    }

    @action.bound
    private onChangeInputGroupName(e: SyntheticEvent<HTMLInputElement>) {
        this._inputGroupName = (e.target as HTMLInputElement).value;
    }

    readonly filteredGroups = remoteData({
        await: () => [this.props.store.comparisonGroups],
        invoke: () =>
            Promise.resolve(
                // TODO: fuzzy string search?
                _.sortBy(
                    this.props.store.comparisonGroups.result!.filter(group =>
                        new RegExp(this.groupNameFilter, 'i').test(group.name)
                    ),
                    group => group.name.toLowerCase()
                )
            ),
    });

    @action.bound
    private showAddGroupPanel() {
        this.addGroupPanelOpen = true;
        const preDefinedCustomChartFilterSet = _.reduce(
            Array.from(
                this.props.store.preDefinedCustomChartFilterSet.entries()
            ),
            (acc, [chartUniqueKey, clinicalDataFilter]) => {
                acc[chartUniqueKey] = clinicalDataFilter.values.map(
                    datum => datum.value
                );
                return acc;
            },
            {} as { [id: string]: string[] }
        );

        this._inputGroupName = getDefaultGroupName(
            this.props.store.filters,
            preDefinedCustomChartFilterSet,
            this.props.store.clinicalAttributeIdToDataType.result!
        );
    }

    @action.bound
    private cancelAddGroup() {
        this.addGroupPanelOpen = false;
        this._inputGroupName = '';
        this.addSamplesTargetGroupId = '';
    }

    @action.bound
    private deleteGroup(group: StudyViewComparisonGroup) {
        this.props.store.toggleComparisonGroupMarkedForDeletion(group.uid);
    }

    @action.bound
    private selectAllFiltered() {
        for (const group of this.filteredGroups.result!) {
            this.props.store.setComparisonGroupSelected(group.uid, true);
        }
        this.props.store.flagDuplicateColorsForSelectedGroups(
            undefined!,
            undefined!
        );
    }

    @action.bound
    private deselectAllFiltered() {
        for (const group of this.filteredGroups.result!) {
            this.props.store.setComparisonGroupSelected(group.uid, false);
            this.props.store.showComparisonGroupWarningSign(group.uid, false);
        }
    }

    private get header() {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '100%',
                    marginTop: 3,
                    alignItems: 'center',
                    marginBottom: 10,
                }}
            >
                <div className="btn-group" role="group">
                    <button
                        className="btn btn-default btn-xs"
                        onClick={this.selectAllFiltered}
                    >
                        Select all&nbsp;
                        {this.filteredGroups.isComplete
                            ? `(${this.filteredGroups.result!.length})`
                            : ''}
                    </button>
                    <button
                        className="btn btn-default btn-xs"
                        onClick={this.deselectAllFiltered}
                    >
                        Deselect all
                    </button>
                </div>
                <input
                    className="form-control"
                    style={{
                        right: 0,
                        width: 140,
                        height: 25,
                    }}
                    type="text"
                    placeholder="Search.."
                    value={this.groupNameFilter}
                    onChange={this.onChangeGroupNameFilter}
                />
            </div>
        );
    }

    @autobind
    private restoreGroup(group: StudyViewComparisonGroup) {
        this.props.store.toggleComparisonGroupMarkedForDeletion(group.uid);
    }

    @autobind
    private shareSingleGroup(group: StudyViewComparisonGroup) {
        this.props.shareGroups([group]);
    }

    @autobind
    private shareGroups() {
        const selectedGroups = getSelectedGroups(
            this.props.store.comparisonGroups.result || [],
            this.props.store
        );
        this.props.shareGroups(selectedGroups);
    }

    private readonly groupsSection = MakeMobxView({
        await: () => [
            this.props.store.comparisonGroups,
            this.filteredGroups,
            this.props.store.selectedSamples,
        ],
        render: () => {
            if (this.props.store.comparisonGroups.result!.length > 0) {
                // show this component if there are groups, and if filteredGroups is complete
                return (
                    <div
                        className={styles.groupCheckboxes}
                        data-test="group-checkboxes"
                    >
                        {this.filteredGroups.result!.length > 0 ? (
                            this.filteredGroups.result!.map(group => (
                                <GroupCheckbox
                                    group={group}
                                    color={
                                        this.props.store.userGroupColors[
                                            group.uid
                                        ]
                                    }
                                    store={this.props.store}
                                    markedForDeletion={this.props.store.isComparisonGroupMarkedForDeletion(
                                        group.uid
                                    )}
                                    markedWithWarningSign={this.props.store.isComparisonGroupMarkedWithWarningSign(
                                        group.uid
                                    )}
                                    restore={this.restoreGroup}
                                    delete={this.deleteGroup}
                                    studyIds={this.props.store.studyIds}
                                    shareGroup={this.shareSingleGroup}
                                    onChangeGroupColor={this.onGroupColorChange}
                                />
                            ))
                        ) : (
                            <div className={styles.noGroupsMessage}>
                                No results for your current search.
                            </div>
                        )}
                    </div>
                );
            } else {
                return (
                    <div className={styles.noGroupsMessage}>
                        Group comparison allows you to create custom groups and
                        compare their clinical and genomic features. Use the
                        button below to create groups based on selections.
                    </div>
                );
            }
        },
        renderPending: () => <LoadingIndicator isLoading={true} />,
        renderError: () => (
            <div className={styles.noGroupsMessage}>
                <ErrorMessage
                    message={
                        'There was an error loading saved groups. Please try again.'
                    }
                />
            </div>
        ),
    });

    private get viewButton() {
        if (
            this.props.store.comparisonGroups.isComplete &&
            this.props.store.comparisonGroups.result.length > 0
        ) {
            // only show select button if there are any groups
            return (
                <button
                    className="btn btn-sm btn-default"
                    disabled={
                        getSelectedGroups(
                            this.props.store.comparisonGroups.result,
                            this.props.store
                        ).length === 0
                    }
                    style={{ marginLeft: 7 }}
                    onClick={() => {
                        this.props.store.clearAllFilters();
                        this.props.store.updateComparisonGroupsFilter();
                    }}
                >
                    Filter
                </button>
            );
        } else {
            return null;
        }
    }

    private get shareButton() {
        if (
            this.props.store.comparisonGroups.isComplete &&
            this.props.store.comparisonGroups.result.length > 0
        ) {
            // only show select button if there are any groups
            return (
                <button
                    className="btn btn-sm btn-default"
                    disabled={
                        getSelectedGroups(
                            this.props.store.comparisonGroups.result,
                            this.props.store
                        ).length === 0
                    }
                    style={{ marginLeft: 7 }}
                    onClick={this.shareGroups}
                >
                    Share
                </button>
            );
        } else {
            return null;
        }
    }

    @computed get allGroupNames() {
        return this.props.store.comparisonGroups.isComplete
            ? this.props.store.comparisonGroups.result!.map(group => group.name)
            : undefined;
    }

    @computed get submitNewGroupDisabled() {
        const selectedSamples = this.props.store.selectedSamples.isComplete
            ? this.props.store.selectedSamples.result
            : undefined;
        return (
            !selectedSamples ||
            this.inputGroupName.length === 0 ||
            !this.allGroupNames ||
            this.allGroupNames.includes(this.inputGroupName)
        );
    }

    @action.bound
    private async onSubmitNewGroup() {
        const selectedSamples = this.props.store.selectedSamples.isComplete
            ? this.props.store.selectedSamples.result
            : undefined;
        const { id } = await comparisonClient.addGroup(
            getGroupParameters(
                this.inputGroupName,
                selectedSamples!,
                this.props.store.studyIds
            )
        );
        // check if there is any predefined color for this group and set the color
        const reservedColor = getReservedGroupColor(this.inputGroupName);
        if (reservedColor != undefined)
            this.props.store.onGroupColorChange(id, reservedColor);
        this.props.store.notifyComparisonGroupsChange();
        if (!this.props.store.isLoggedIn) {
            //save group id to page session only for non-logged in user.
            // this is to keep track of what groups are created by the user
            this.props.store.trackNewlyCreatedGroup(id);
        }
        this.cancelAddGroup();
    }

    @action.bound
    private async onGroupColorChange(
        group: StudyViewComparisonGroup,
        newColor: string
    ) {
        this.props.onGroupColorChange &&
            this.props.onGroupColorChange(group.uid, newColor);
    }

    private get compareButton() {
        if (this.props.store.comparisonGroups.isComplete) {
            // only show if there are enough groups to possibly compare (i.e. 2)
            const numSelectedGroups = getSelectedGroups(
                this.props.store.comparisonGroups.result,
                this.props.store
            ).length;
            const wrongNumberOfGroups =
                numSelectedGroups > MAX_GROUPS_IN_SESSION ||
                numSelectedGroups < 2;

            let tooltipText = '';
            if (this.props.store.comparisonGroups.result.length >= 2) {
                if (wrongNumberOfGroups) {
                    tooltipText = `Select between 2 and ${MAX_GROUPS_IN_SESSION} groups to enable comparison.`;
                } else {
                    tooltipText =
                        'Open a comparison session with selected groups';
                }
            } else {
                tooltipText =
                    'Create at least two groups to open a comparison session';
            }

            return (
                <DefaultTooltip overlay={tooltipText}>
                    <button
                        className="btn btn-sm btn-primary"
                        disabled={wrongNumberOfGroups}
                        data-event={serializeEvent({
                            action: 'createCustomComparisonSession',
                            label: this.props.store.comparisonGroups.result.length.toString(),
                            category: 'groupComparison',
                        })}
                        onClick={async () => {
                            // open window before the first `await` call - this makes it a synchronous window.open,
                            //  which doesnt trigger pop-up blockers. We'll send it to the correct url once we get the result
                            const comparisonWindow = window.open(
                                getComparisonLoadingUrl({
                                    phase: LoadingPhase.CREATING_SESSION,
                                }),
                                '_blank'
                            );

                            // wait until the new window has routingStore available
                            await sleepUntil(
                                () => !!(comparisonWindow as any).routingStore
                            );

                            // save comparison session, and get id
                            const groups = getSelectedGroups(
                                this.props.store.comparisonGroups.result!,
                                this.props.store
                            );
                            const {
                                id,
                            } = await comparisonClient.addComparisonSession({
                                groups,
                                origin: this.props.store.studyIds,
                            });

                            // redirect window to correct URL
                            redirectToComparisonPage(comparisonWindow!, {
                                comparisonId: id,
                            });
                        }}
                    >
                        Compare
                    </button>
                </DefaultTooltip>
            );
        } else {
            return null;
        }
    }

    private readonly actionButtons = MakeMobxView({
        await: () => [this.props.store.comparisonGroups],
        render: () => {
            if (this.props.store.comparisonGroups.result!.length > 0) {
                return (
                    <div
                        style={{
                            marginTop: 6,
                        }}
                    >
                        {this.compareButton}
                        {this.viewButton}
                        {this.shareButton}
                    </div>
                );
            } else {
                return null;
            }
        },
    });

    private get addGroupPanel() {
        let contents: any;
        const createOrAddButtonWidth = 58;
        const selectedSamples = this.props.store.selectedSamples.isComplete
            ? this.props.store.selectedSamples.result
            : undefined;
        if (this.addGroupPanelOpen) {
            contents = [
                <div
                    style={{
                        display: 'none',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        width: '100%',
                        marginTop: 3,
                    }}
                >
                    <h5>
                        Add{selectedSamples ? ` ${selectedSamples.length}` : ''}{' '}
                        selected samples
                    </h5>
                    <button
                        className="btn btn-xs btn-default"
                        style={{
                            right: 0,
                            marginTop: -4,
                        }}
                        onClick={this.cancelAddGroup}
                    >
                        Cancel
                    </button>
                </div>,
                <div style={{ width: '100%', marginTop: 7 }}>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                        }}
                    >
                        <DefaultTooltip
                            visible={
                                this.allGroupNames &&
                                this.allGroupNames.includes(this.inputGroupName)
                            }
                            overlay={
                                <div>
                                    <i
                                        className="fa fa-md fa-exclamation-triangle"
                                        style={{
                                            color: '#BB1700',
                                            marginRight: 5,
                                        }}
                                    />
                                    <span>{DUPLICATE_GROUP_NAME_MSG}</span>
                                </div>
                            }
                        >
                            <input
                                className="form-control"
                                style={{ marginRight: 5 }}
                                type="text"
                                placeholder="Enter a name for your new group"
                                value={this.inputGroupName}
                                onChange={this.onChangeInputGroupName}
                                onKeyPress={event => {
                                    if (
                                        event.key == 'Enter' &&
                                        !this.submitNewGroupDisabled
                                    ) {
                                        this.onSubmitNewGroup();
                                    }
                                }}
                            />
                        </DefaultTooltip>
                        <button
                            className="btn btn-sm btn-primary"
                            style={{ width: createOrAddButtonWidth }}
                            onClick={this.onSubmitNewGroup}
                            disabled={this.submitNewGroupDisabled}
                        >
                            Create
                        </button>
                    </div>
                </div>,
            ];
        } else {
            contents = (
                <button
                    className="btn btn-sm btn-primary"
                    data-event={serializeEvent({
                        action: 'createCustomGroup',
                        label: '',
                        category: 'groupComparison',
                    })}
                    data-test="create-new-group-btn"
                    onClick={this.showAddGroupPanel}
                    disabled={!selectedSamples}
                    style={{ width: '100%' }}
                >
                    Create new group from selected samples{' '}
                    {selectedSamples ? ` (${selectedSamples.length})` : ''}
                </button>
            );
        }
        return (
            <div
                style={{
                    width: '100%',
                }}
            >
                {contents}
            </div>
        );
    }

    componentWillUnmount() {
        this.props.store.deleteMarkedComparisonGroups();
    }

    @computed get existSharedGroups() {
        return (
            this.props.store.comparisonGroups.result.filter(
                group => group.isSharedGroup
            ).length > 0
        );
    }

    @computed get notificationMessages() {
        let notificationMessages: JSX.Element[] = [];
        if (this.props.store.comparisonGroups.result.length > 0) {
            // Notify if there any shared groups
            if (this.existSharedGroups) {
                notificationMessages.push(
                    <>
                        <span
                            className={classnames({
                                [styles.sharedGroup]: true,
                            })}
                        >
                            Highlighted rows
                        </span>{' '}
                        are shared groups.
                    </>
                );
            }
            // Notify that shared and page-session groups are not saved for non-logged users
            if (
                !this.props.store.isLoggedIn &&
                this.props.store.appStore.isSocialAuthenticated
            ) {
                notificationMessages.push(
                    <>
                        <br />
                        The groups above will not be saved without &nbsp;
                        <button
                            className="btn btn-default btn-xs"
                            onClick={() =>
                                openSocialAuthWindow(this.props.store.appStore)
                            }
                        >
                            Login
                        </button>
                        <br />
                    </>
                );
            } else if (this.existSharedGroups) {
                // Notify if shared groups are saved to user profile
                notificationMessages.push(
                    <>They have been saved to your profile.</>
                );
            }
        }
        return notificationMessages;
    }

    render() {
        return (
            <div
                className={styles.comparisonGroupManager}
                style={{ position: 'relative' }}
            >
                {this.header}
                {this.groupsSection.component}
                {this.notificationMessages.length > 0 && (
                    <>
                        <br />
                        <i className="text-warning">
                            Note: {this.notificationMessages}
                        </i>
                    </>
                )}
                {this.actionButtons.component}
                <hr />
                {this.addGroupPanel}
            </div>
        );
    }
}
