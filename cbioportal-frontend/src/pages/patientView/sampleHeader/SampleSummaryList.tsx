import * as React from 'react';
import SampleManager from '../SampleManager';
import { observer } from 'mobx-react';
import { ClinicalDataBySampleId } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { getSpanElementsFromCleanData } from '../clinicalInformation/lib/clinicalAttributesUtil';
import { getSampleViewUrl } from 'shared/api/urls';
import SignificantMutationalSignatures from '../patientHeader/SignificantMutationalSignatures';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { If, Then, Else } from 'react-if';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    getSampleNumericalClinicalDataValue,
    OTHER_BIOMARKERS_CLINICAL_ATTR,
} from 'shared/lib/StoreUtils';
import { OtherBiomarkersQueryType } from 'oncokb-frontend-commons';
import { OtherBiomarkerAnnotation } from '../oncokb/OtherBiomarkerAnnotation';
import { IGenePanelModal } from 'pages/patientView/PatientViewPage';

import mouseIcon from './mouse_icon.svg';
import organoidIcon from './organoid_icon.svg';

import styles from '../patientHeader/style/clinicalAttributes.module.scss';

export type ISampleSummaryListProps = {
    sampleManager: SampleManager;
    patientViewPageStore: PatientViewPageStore;
    handleSampleClick: (
        id: string,
        e: React.MouseEvent<HTMLAnchorElement>
    ) => void;
    toggleGenePanelModal: (genePanelId?: string) => void;
    genePanelModal: IGenePanelModal;
    handlePatientClick: (id: string) => void;
};

@observer
export default class SampleSummaryList extends React.Component<
    ISampleSummaryListProps,
    {}
> {
    private getOncoKbOtherBiomarkerAnnotationComponent(
        type: OtherBiomarkersQueryType,
        sampleId: string
    ) {
        const numericalData = getSampleNumericalClinicalDataValue(
            this.props.patientViewPageStore.clinicalDataForSamples.result,
            sampleId,
            OTHER_BIOMARKERS_CLINICAL_ATTR[type]
        );

        return this.props.patientViewPageStore.getOtherBiomarkersOncoKbData
            .result[sampleId][type] && numericalData !== undefined ? (
            <span>
                ,{' '}
                <OtherBiomarkerAnnotation
                    type={type}
                    isPublicOncoKbInstance={
                        this.props.patientViewPageStore
                            .usingPublicOncoKbInstance
                    }
                    annotation={
                        this.props.patientViewPageStore
                            .getOtherBiomarkersOncoKbData.result[sampleId][type]
                    }
                />
            </span>
        ) : null;
    }

    private getDerivedNormalizedCaseType(
        sample: ClinicalDataBySampleId
    ): string | undefined {
        return (
            this.props.sampleManager &&
            this.props.sampleManager.clinicalDataLegacyCleanAndDerived &&
            this.props.sampleManager.clinicalDataLegacyCleanAndDerived[
                sample.id
            ] &&
            this.props.sampleManager.clinicalDataLegacyCleanAndDerived[
                sample.id
            ].DERIVED_NORMALIZED_CASE_TYPE
        );
    }

    private isPDX(sample: ClinicalDataBySampleId): boolean {
        return this.getDerivedNormalizedCaseType(sample) === 'Xenograft';
    }

    private isOrganoid(sample: ClinicalDataBySampleId): boolean {
        return this.getDerivedNormalizedCaseType(sample) === 'Organoid';
    }

    public render() {
        let sampleHeader: (JSX.Element | undefined)[] | null = null;
        sampleHeader = _.map(
            this.props.sampleManager.samples,
            (sample: ClinicalDataBySampleId) => {
                if (
                    !this.props.sampleManager.isSampleVisibleInHeader(sample.id)
                ) {
                    return undefined;
                }

                const isPDX = this.isPDX(sample);
                const isOrganoid = this.isOrganoid(sample);

                return (
                    <div className="patientSample">
                        <span
                            data-test="patientSamplesClinicalSpans"
                            className={styles['clinical-spans']}
                        >
                            {this.props.sampleManager.getComponentForSample(
                                sample.id,
                                1,
                                '',
                                <span style={{ display: 'inline-flex' }}>
                                    {'\u00A0'}
                                    {isPDX && (
                                        <img src={mouseIcon} alt="Mouse Icon" />
                                    )}
                                    {isOrganoid && (
                                        <img
                                            src={organoidIcon}
                                            alt="Organoid Icon"
                                        />
                                    )}
                                    {(isPDX || isOrganoid) && '\u00A0'}
                                    <a
                                        href={getSampleViewUrl(
                                            this.props.patientViewPageStore
                                                .studyMetaData.result!.studyId,
                                            sample.id
                                        )}
                                        target="_blank"
                                        onClick={(
                                            e: React.MouseEvent<
                                                HTMLAnchorElement
                                            >
                                        ) =>
                                            this.props.handleSampleClick(
                                                sample.id,
                                                e
                                            )
                                        }
                                    >
                                        {SampleManager.getClinicalAttributeInSample(
                                            sample,
                                            'DISPLAY_SAMPLE_NAME'
                                        )
                                            ? `${
                                                  SampleManager.getClinicalAttributeInSample(
                                                      sample,
                                                      'DISPLAY_SAMPLE_NAME'
                                                  )!.value
                                              } (${sample.id})`
                                            : sample.id}
                                    </a>
                                    {this.props.sampleManager &&
                                        this.props.sampleManager
                                            .clinicalDataLegacyCleanAndDerived[
                                            sample.id
                                        ] &&
                                        getSpanElementsFromCleanData(
                                            this.props.sampleManager
                                                .clinicalDataLegacyCleanAndDerived[
                                                sample.id
                                            ]
                                        )}
                                </span>,
                                this.props.toggleGenePanelModal,
                                this.props.genePanelModal.isOpen
                            )}

                            {this.props.patientViewPageStore
                                .getOtherBiomarkersOncoKbData.result[
                                sample.id
                            ] && (
                                <>
                                    {this.getOncoKbOtherBiomarkerAnnotationComponent(
                                        OtherBiomarkersQueryType.MSIH,
                                        sample.id
                                    )}
                                    {this.getOncoKbOtherBiomarkerAnnotationComponent(
                                        OtherBiomarkersQueryType.TMBH,
                                        sample.id
                                    )}
                                </>
                            )}

                            {/* mutational signatures progress bar */}
                            <If
                                condition={
                                    this.props.patientViewPageStore
                                        .hasMutationalSignatureData.result
                                }
                            >
                                <Then>
                                    <If
                                        condition={
                                            this.props.patientViewPageStore
                                                .mutationalSignatureDataGroupByVersion
                                                .isComplete
                                        }
                                    >
                                        <Then>
                                            <SignificantMutationalSignatures
                                                data={
                                                    this.props
                                                        .patientViewPageStore
                                                        .mutationalSignatureDataGroupByVersion
                                                        .result
                                                }
                                                sampleId={sample.id}
                                                version={
                                                    this.props
                                                        .patientViewPageStore
                                                        .selectedMutationalSignatureVersion
                                                }
                                            />
                                        </Then>
                                        <Else>
                                            <LoadingIndicator
                                                isLoading={true}
                                            />
                                        </Else>
                                    </If>
                                </Then>
                            </If>
                        </span>
                    </div>
                );
            }
        );

        if (
            sampleHeader &&
            sampleHeader.length > 0 &&
            this.props.patientViewPageStore.pageMode === 'sample' &&
            this.props.patientViewPageStore.patientId &&
            this.props.patientViewPageStore.allSamplesForPatient.result &&
            this.props.patientViewPageStore.allSamplesForPatient.result.length >
                1
        ) {
            sampleHeader.push(
                <button
                    className="btn btn-default btn-xs"
                    onClick={() =>
                        this.props.handlePatientClick(
                            this.props.patientViewPageStore.patientId
                        )
                    }
                >
                    Show all{' '}
                    {
                        this.props.patientViewPageStore.allSamplesForPatient
                            .result.length
                    }{' '}
                    samples
                </button>
            );
        }

        return sampleHeader;
    }
}
