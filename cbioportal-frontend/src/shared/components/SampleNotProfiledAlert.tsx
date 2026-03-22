import { getSamplesProfiledStatus } from 'pages/patientView/PatientViewPageUtils';
import * as React from 'react';
import { FunctionComponent } from 'react';
import SampleManager from 'pages/patientView/SampleManager';
import { IGenePanelDataByProfileIdAndSample } from 'shared/lib/isSampleProfiled';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { AlterationTypeText } from 'shared/constants';

interface ISampleNotProfiledAlertProps {
    sampleManager: SampleManager;
    genePanelDataByMolecularProfileIdAndSampleId: IGenePanelDataByProfileIdAndSample;
    molecularProfiles: MolecularProfile[];
}

const SampleNotProfiledAlert: FunctionComponent<ISampleNotProfiledAlertProps> = ({
    sampleManager,
    genePanelDataByMolecularProfileIdAndSampleId,
    molecularProfiles,
}) => {
    const messages = molecularProfiles.reduce(
        (aggr: JSX.Element[], profile) => {
            const { notProfiledIds } = getSamplesProfiledStatus(
                sampleManager!.getActiveSampleIdsInOrder(),
                genePanelDataByMolecularProfileIdAndSampleId,
                profile.molecularProfileId
            );

            if (notProfiledIds.length) {
                aggr.push(
                    <p>
                        {notProfiledIds.length > 1 ? 'Samples' : 'Sample'}
                        {notProfiledIds.map(id => (
                            <span style={{ marginLeft: 5 }}>
                                {sampleManager?.getComponentForSample(id)}
                            </span>
                        ))}{' '}
                        not profiled for{' '}
                        {AlterationTypeText[profile.molecularAlterationType]}
                    </p>
                );
            }

            return aggr;
        },
        []
    );

    if (messages.length) {
        return (
            <div
                className="alert alert-info"
                role="alert"
                data-test={'partialProfileAlert'}
            >
                {messages}
            </div>
        );
    } else {
        return null;
    }
};

export default SampleNotProfiledAlert;
