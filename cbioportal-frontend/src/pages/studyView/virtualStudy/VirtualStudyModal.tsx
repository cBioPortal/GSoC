import { Modal } from 'react-bootstrap';
import * as React from 'react';
import VirtualStudy from 'pages/studyView/virtualStudy/VirtualStudy';
import { AppStore } from 'AppStore';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { observer } from 'mobx-react';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

export interface IVirtualStudyModalProps {
    appStore: AppStore;
    pageStore: StudyViewPageStore;
    message?: JSX.Element | string;
    onHide: () => void;
}

export const VirtualStudyModal: React.FunctionComponent<IVirtualStudyModalProps> = observer(
    ({ appStore, pageStore, message, onHide }) => {
        const isLoading = [
            pageStore.filteredVirtualStudies,
            pageStore.studyWithSamples,
            pageStore.filteredVirtualStudies,
            pageStore.molecularProfileNameSet,
            pageStore.molecularProfileNameSet,
        ].some(result => result.isPending);
        return (
            <Modal onHide={onHide} show={true}>
                <Modal.Header closeButton>
                    <Modal.Title>Create a Virtual Study</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {isLoading ? (
                        <LoadingIndicator isLoading={true} />
                    ) : (
                        <>
                            {message || null}
                            <VirtualStudy
                                user={appStore.userName}
                                name={
                                    pageStore.isSingleVirtualStudyPageWithoutFilter
                                        ? pageStore.filteredVirtualStudies
                                              .result[0].data.name
                                        : undefined
                                }
                                description={
                                    pageStore.isSingleVirtualStudyPageWithoutFilter
                                        ? pageStore.filteredVirtualStudies
                                              .result[0].data.description
                                        : undefined
                                }
                                studyWithSamples={
                                    pageStore.studyWithSamples.result
                                }
                                selectedSamples={
                                    pageStore.selectedSamples.result
                                }
                                filter={pageStore.userSelections}
                                attributesMetaSet={pageStore.chartMetaSet}
                                molecularProfileNameSet={
                                    pageStore.molecularProfileNameSet.result ||
                                    {}
                                }
                                caseListNameSet={
                                    pageStore.caseListNameSet.result || {}
                                }
                            />
                        </>
                    )}
                </Modal.Body>
            </Modal>
        );
    }
);
