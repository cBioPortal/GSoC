import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { observer } from 'mobx-react';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import autobind from 'autobind-decorator';

interface IGeneModalProps {
    panelName: string;
    show: boolean;
    onHide: () => void;
    isLoading?: boolean;
    className?: string;
}

@observer
export default class GenePanelModal extends React.Component<
    IGeneModalProps,
    {}
> {
    @autobind handleClose() {
        // `handleClose` receives an event object on each call,
        // so calling the `onHide` prop here to prevent unneccessary
        // passing of the event object to the parent component
        this.props.onHide();
    }

    render() {
        return (
            <Modal
                show={this.props.show}
                onHide={this.handleClose}
                keyboard
                className={this.props.className}
            >
                <Modal.Header closeButton>
                    <Modal.Title data-test="gene-panel-modal-title">
                        {this.props.panelName}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body
                    style={{
                        maxHeight: 'calc(100vh - 210px)',
                        overflowY: 'auto',
                    }}
                >
                    {this.props.show && this.props.isLoading && (
                        <LoadingIndicator isLoading={true} />
                    )}
                    {this.props.show && !this.props.isLoading && (
                        <div data-test="gene-panel-modal-body">
                            {this.props.children}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button data-test="modal-button" onClick={this.handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
