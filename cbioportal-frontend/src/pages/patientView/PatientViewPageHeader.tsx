import React from 'react';
import { observer } from 'mobx-react-lite';
import PatientHeader from 'pages/patientView/patientHeader/PatientHeader';
import SampleSummaryList from 'pages/patientView/sampleHeader/SampleSummaryList';
import { PatientViewPageStore } from 'pages/patientView/clinicalInformation/PatientViewPageStore';
import { IGenePanelModal } from 'pages/patientView/PatientViewPage';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';

interface IPatientPageHeaderProps {
    handlePatientClick: (id: string) => void;
    pageStore: PatientViewPageStore;
    handleSampleClick: (
        id: string,
        e: React.MouseEvent<HTMLAnchorElement>
    ) => void;
    toggleGenePanelModal: (genePanelId?: string | undefined) => void;
    genePanelModal: IGenePanelModal;
}

const PatientViewPageHeader: React.FC<IPatientPageHeaderProps> = observer(
    function(props) {
        return (
            <div className="patientDataTable">
                <table>
                    <tr>
                        <td>Patient:</td>
                        <td>
                            <PatientHeader
                                handlePatientClick={(id: string) =>
                                    props.handlePatientClick(id)
                                }
                                patient={
                                    props.pageStore.patientViewData.result
                                        .patient
                                }
                                studyId={props.pageStore.studyId}
                                darwinUrl={props.pageStore.darwinUrl.result}
                                sampleManager={
                                    props.pageStore.sampleManager.result
                                }
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>Samples:</td>
                        <td>
                            <div className="patientSamples">
                                {getRemoteDataGroupStatus(
                                    props.pageStore.studyMetaData,
                                    props.pageStore.hasMutationalSignatureData,
                                    props.pageStore
                                        .mutationalSignatureDataGroupByVersion,
                                    props.pageStore.allSamplesForPatient
                                ) === 'complete' && (
                                    <SampleSummaryList
                                        sampleManager={
                                            props.pageStore.sampleManager
                                                .result!
                                        }
                                        patientViewPageStore={props.pageStore}
                                        handleSampleClick={
                                            props.handleSampleClick
                                        }
                                        toggleGenePanelModal={
                                            props.toggleGenePanelModal
                                        }
                                        genePanelModal={props.genePanelModal}
                                        handlePatientClick={
                                            props.handlePatientClick
                                        }
                                    />
                                )}
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        );
    }
);

export default PatientViewPageHeader;
