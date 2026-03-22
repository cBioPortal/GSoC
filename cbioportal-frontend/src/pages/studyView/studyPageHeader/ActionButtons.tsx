import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import styles from '../styles.module.scss';
import autobind from 'autobind-decorator';
import { getPatientViewUrl } from 'shared/api/urls';
import { DefaultTooltip, getBrowserWindow } from 'cbioportal-frontend-commons';
import VirtualStudy from 'pages/studyView/virtualStudy/VirtualStudy';
import fileDownload from 'react-file-download';
import { Else, If, Then } from 'react-if';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import classNames from 'classnames';
import { AppStore } from '../../../AppStore';
import { serializeEvent } from '../../../shared/lib/tracking';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
import { Modal } from 'react-bootstrap';
import { VirtualStudyModal } from 'pages/studyView/virtualStudy/VirtualStudyModal';

export interface ActionButtonsProps {
    loadingComplete: boolean;
    store: StudyViewPageStore;
    appStore: AppStore;
}

// this is for list of patients
export const MAX_URL_LENGTH = 4500;

@observer
export default class ActionButtons extends React.Component<
    ActionButtonsProps,
    {}
> {
    constructor(props: ActionButtonsProps) {
        super(props);

        makeObservable(this);
    }
    @observable downloadingData = false;
    @observable showDownloadErrorMessage = false;
    @observable showVirtualStudiesDialog = false;

    @autobind
    private initiateDownload() {
        this.downloadingData = true;
        this.showDownloadErrorMessage = false;
        this.props.store
            .getDownloadDataPromise()
            .then(text => {
                this.downloadingData = false;
                fileDownload(
                    text,
                    this.props.store.clinicalDataDownloadFilename
                );
            })
            .catch(() => {
                this.downloadingData = false;
                this.showDownloadErrorMessage = true;
            });
    }

    @autobind
    private toggleVirtualStudiesDialog() {
        this.showVirtualStudiesDialog = !this.showVirtualStudiesDialog;
    }

    @autobind
    private openCases() {
        if (!_.isEmpty(this.props.store.selectedPatients)) {
            const firstPatient = this.props.store.selectedPatients[0];

            let navCaseIds = _.map(
                this.props.store.selectedPatients,
                patient => {
                    return {
                        patientId: patient.patientId,
                        studyId: patient.studyId,
                    };
                }
            );

            const url = getPatientViewUrl(
                firstPatient.studyId,
                firstPatient.patientId,
                navCaseIds
            );

            // if length is great than 4500 it will crash browsers
            // so use alternative method passing ids
            if (url.length > MAX_URL_LENGTH) {
                const patientViewWindow = window.open(
                    getPatientViewUrl(
                        firstPatient.studyId,
                        firstPatient.patientId
                    )
                ) as any;
                patientViewWindow.clientPostedData = {
                    navCaseIds: navCaseIds,
                };
            } else {
                // add navCaseIds into url if number of cases less than MAXIMUM_NAV_CASE_IDS_IN_URL
                window.open(url);
            }
        }
    }

    @computed
    get virtualStudyButtonTooltip() {
        return (
            (!this.props.appStore.isLoggedIn ? '' : 'Save/') +
            'Share Virtual Study'
        );
    }

    @computed
    get downloadButtonTooltip() {
        if (this.showDownloadErrorMessage) {
            return 'An error occurred while downloading the data. Please try again.';
        }
        return 'Download clinical data for the selected cases';
    }

    // @computed
    // get virtualStudy(): JSX.Element | null {
    //     return (
    //         <VirtualStudy
    //             user={this.props.appStore.userName}
    //             name={
    //                 this.props.store.isSingleVirtualStudyPageWithoutFilter
    //                     ? this.props.store.filteredVirtualStudies.result[0].data
    //                           .name
    //                     : undefined
    //             }
    //             description={
    //                 this.props.store.isSingleVirtualStudyPageWithoutFilter
    //                     ? this.props.store.filteredVirtualStudies.result[0].data
    //                           .description
    //                     : undefined
    //             }
    //             studyWithSamples={this.props.store.studyWithSamples.result}
    //             selectedSamples={this.props.store.selectedSamples.result}
    //             filter={this.props.store.userSelections}
    //             attributesMetaSet={this.props.store.chartMetaSet}
    //             molecularProfileNameSet={
    //                 this.props.store.molecularProfileNameSet.result || {}
    //             }
    //             caseListNameSet={this.props.store.caseListNameSet.result || {}}
    //         />
    //     );
    // }

    render() {
        return (
            <div className={classNames(styles.actionButtons, 'btn-group')}>
                {this.showVirtualStudiesDialog && (
                    <VirtualStudyModal
                        appStore={this.props.appStore}
                        pageStore={this.props.store}
                        onHide={this.toggleVirtualStudiesDialog}
                    ></VirtualStudyModal>
                )}

                <DefaultTooltip
                    trigger={['hover']}
                    placement={'top'}
                    overlay={<span>View selected cases</span>}
                >
                    <button
                        className="btn btn-default btn-sm"
                        disabled={this.props.store.selectedPatients?.length < 1}
                        onClick={this.openCases}
                        data-event={serializeEvent({
                            category: 'studyPage',
                            action: 'viewPatientCohort',
                            label: this.props.store.queriedPhysicalStudyIds
                                .result,
                        })}
                        aria-label="View selected cases"
                    >
                        <i className="fa-solid fa-circle-user fa-lg"></i>
                    </button>
                </DefaultTooltip>

                <DefaultTooltip
                    placement={'top'}
                    trigger={['hover']}
                    overlay={<span>{this.virtualStudyButtonTooltip}</span>}
                >
                    <button
                        data-tour="action-button-bookmark"
                        className="btn btn-default btn-sm"
                        onClick={this.toggleVirtualStudiesDialog}
                        disabled={
                            this.props.store.filteredVirtualStudies.isPending ||
                            this.props.store.selectedSamples.isPending ||
                            this.props.store.molecularProfileNameSet
                                .isPending ||
                            this.props.store.caseListNameSet.isPending
                        }
                        aria-label={this.virtualStudyButtonTooltip}
                    >
                        <i className="fa-solid fa-bookmark fa-lg"></i>
                    </button>
                </DefaultTooltip>

                {getServerConfig().skin_hide_download_controls ===
                    DownloadControlOption.SHOW_ALL && (
                    <DefaultTooltip
                        trigger={['hover']}
                        placement={'top'}
                        overlay={<span>{this.downloadButtonTooltip}</span>}
                    >
                        <button
                            className="btn btn-default btn-sm"
                            disabled={!this.props.loadingComplete}
                            onClick={this.initiateDownload}
                            data-event={serializeEvent({
                                category: 'studyPage',
                                action: 'dataDownload',
                                label: this.props.store.queriedPhysicalStudyIds
                                    .result,
                            })}
                            aria-label={this.downloadButtonTooltip}
                        >
                            <If condition={this.downloadingData}>
                                <Then>
                                    <i className="fa-solid fa-spinner fa-spin fa-lg"></i>
                                </Then>
                                <Else>
                                    <i className="fa-solid fa-download fa-lg"></i>
                                </Else>
                            </If>
                        </button>
                    </DefaultTooltip>
                )}
            </div>
        );
    }
}
