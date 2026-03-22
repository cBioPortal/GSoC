import * as React from 'react';
import { SyntheticEvent } from 'react';
import { observer } from 'mobx-react';
import GroupComparisonStore from './GroupComparisonStore';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import autobind from 'autobind-decorator';
import { action, computed, makeObservable, observable } from 'mobx';
import {
    ComparisonGroup,
    DUPLICATE_GROUP_NAME_MSG,
} from './GroupComparisonUtils';
import { MakeMobxView } from '../../shared/components/MobxView';
import LoadingIndicator from '../../shared/components/loadingIndicator/LoadingIndicator';
import {
    getStudiesAttrForPatientOverlapGroup,
    getStudiesAttrForSampleOverlapGroup,
    joinGroupNames,
} from './OverlapUtils';
import InfoIcon from '../../shared/components/InfoIcon';
import FlexAlignedCheckbox from '../../shared/components/FlexAlignedCheckbox';
import { serializeEvent } from 'shared/lib/tracking';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import { SessionGroupData } from 'shared/api/session-service/sessionServiceModels';

export interface ICreateGroupFromOverlapProps {
    store: ComparisonStore;
    includedRegions: string[][]; // group.uid[][]
    allGroupsInPlot: string[]; // uid[]
    submitGroup: (group: SessionGroupData, saveToUser: boolean) => void;
    caseType: 'sample' | 'patient';
    width: number;
    style?: any;
}

function getRegionSummary(
    region: string[],
    allGroupsInVenn: string[],
    uidToGroup: { [uid: string]: ComparisonGroup },
    caseType: 'sample' | 'patient'
) {
    const includedGroups = region.map(uid => uidToGroup[uid]);

    let ret = (
        <span>
            {caseType[0].toUpperCase()}
            {caseType.substring(1)}s only in{' '}
            {joinGroupNames(includedGroups, 'and')}
        </span>
    );
    ret = <span>{ret}.</span>;

    return ret;
}

@observer
export default class CreateGroupFromOverlap extends React.Component<
    ICreateGroupFromOverlapProps,
    {}
> {
    @observable inputGroupName = '';
    @observable saveGroupToUser = true;

    constructor(props: ICreateGroupFromOverlapProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private toggleSaveGroupToUser() {
        this.saveGroupToUser = !this.saveGroupToUser;
    }

    @action.bound
    private onChangeInputGroupName(e: SyntheticEvent<HTMLInputElement>) {
        this.inputGroupName = (e.target as HTMLInputElement).value;
    }

    @action.bound
    private submit() {
        let studiesAttr: SessionGroupData['studies'];
        if (this.props.caseType === 'sample') {
            studiesAttr = getStudiesAttrForSampleOverlapGroup(
                this.props.store._originalGroups.result!,
                this.props.includedRegions,
                this.props.allGroupsInPlot
            );
        } else {
            studiesAttr = getStudiesAttrForPatientOverlapGroup(
                this.props.store._originalGroups.result!,
                this.props.includedRegions,
                this.props.allGroupsInPlot,
                this.props.store.patientToSamplesSet.result!
            );
        }

        this.props.submitGroup(
            {
                name: this.inputGroupName,
                description: '',
                studies: studiesAttr,
                origin: this.props.store.origin.result!,
                color: undefined,
            },
            this.saveGroupToUser
        );
    }

    @computed get isDuplicateName() {
        const existingGroupNamesObj = this.props.store.existingGroupNames
            .result!;
        let existingGroupNames = existingGroupNamesObj.session;
        if (this.saveGroupToUser) {
            // if we're going to save the group to the user, we have to compare the group name
            //  with all existing groups on the user for these studies
            existingGroupNames = existingGroupNames.concat(
                existingGroupNamesObj.user
            );
        }
        return existingGroupNames.includes(this.inputGroupName.trim());
    }

    private readonly enterNameInterface = MakeMobxView({
        await: () => [
            this.props.store.origin,
            this.props.store.sampleMap,
            this.props.store.existingGroupNames,
            this.props.store._originalGroups,
            this.props.store.patientToSamplesSet,
        ],
        render: () => (
            <div style={{ width: 250 }}>
                {this.props.store.isLoggedIn && (
                    <FlexAlignedCheckbox
                        checked={this.saveGroupToUser}
                        onClick={this.toggleSaveGroupToUser}
                        label={[
                            <span style={{ marginRight: 5 }}>
                                Save group to user account
                            </span>,
                            <InfoIcon
                                divStyle={{ display: 'inline' }}
                                tooltip={
                                    <span>
                                        Selecting this will save the new group
                                        with the associated study in your user
                                        account.
                                    </span>
                                }
                            />,
                        ]}
                    />
                )}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <input
                        className="form-control"
                        style={{ marginRight: 5 }}
                        type="text"
                        placeholder="Enter a group name.."
                        value={this.inputGroupName}
                        onChange={this.onChangeInputGroupName}
                        data-test={this.props.caseType + 'GroupNameInputField'}
                    />
                    <button
                        className="btn btm-sm btn-primary"
                        disabled={
                            this.inputGroupName.length === 0 ||
                            this.isDuplicateName
                        }
                        onClick={this.submit}
                        data-test={
                            this.props.caseType + 'GroupNameSubmitButton'
                        }
                    >
                        Submit
                    </button>
                </div>
                {this.isDuplicateName && (
                    <div
                        style={{ marginTop: 4 }}
                        data-test={
                            this.props.caseType + 'DuplicateGroupNameMessage'
                        }
                    >
                        {DUPLICATE_GROUP_NAME_MSG}
                    </div>
                )}
            </div>
        ),
        renderPending: () => <LoadingIndicator isLoading={true} />,
    });

    private readonly includedRegionsDescription = MakeMobxView({
        await: () => [this.props.store.uidToGroup],
        render: () => {
            return (
                <div>
                    {this.props.includedRegions.map(region => (
                        <div>
                            {getRegionSummary(
                                region,
                                this.props.allGroupsInPlot,
                                this.props.store.uidToGroup.result!,
                                this.props.caseType
                            )}
                        </div>
                    ))}
                </div>
            );
        },
    });

    render() {
        return (
            <div
                style={Object.assign(
                    {
                        width: this.props.width,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                    this.props.style
                )}
            >
                <DefaultTooltip
                    trigger={['click']}
                    overlay={this.enterNameInterface.component}
                    placement="top"
                >
                    <button
                        className="btn btn-md btn-primary"
                        disabled={this.props.includedRegions.length === 0}
                        data-event={serializeEvent({
                            action: 'createGroupFromVenn',
                            label: '',
                            category: 'groupComparison',
                        })}
                        data-test={
                            this.props.caseType +
                            'GroupComparisonCreateGroupButton'
                        }
                    >
                        Create Group From Selected Diagram Areas
                    </button>
                </DefaultTooltip>
                <div style={{ marginTop: 20 }}>
                    {this.includedRegionsDescription.component}
                </div>
            </div>
        );
    }
}
