import * as React from 'react';
import { GenePanel } from 'cbioportal-ts-api-client';
import { observer } from 'mobx-react';
import GenePanelModal from 'shared/components/GenePanelModal/GenePanelModal';
import GenesList from './GenesList';
import styles from './styles.module.scss';

interface IPatientViewGenePanelModalProps {
    genePanel: GenePanel;
    show: boolean;
    onHide: () => void;
    columns?: number;
}

@observer
export default class PatientViewGenePanelModal extends React.Component<
    IPatientViewGenePanelModalProps,
    {}
> {
    render() {
        return (
            <GenePanelModal
                panelName="Gene Panel"
                show={this.props.show}
                onHide={this.props.onHide}
                className={styles.patientViewModal}
            >
                <GenesList
                    id="patient-view-gene-panel"
                    genePanel={this.props.genePanel}
                    columns={this.props.columns}
                />
            </GenePanelModal>
        );
    }
}
