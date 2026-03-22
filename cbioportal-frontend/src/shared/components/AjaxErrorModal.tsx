import * as React from 'react';
import { Modal } from 'react-bootstrap';

export interface IAjaxErrorModalProps {
    show: boolean;
    onHide: () => void;
    title?: string;
    troubleshooting?: string[];
}

export default class AjaxErrorModal extends React.Component<
    IAjaxErrorModalProps,
    {}
> {
    private defaultTitle = 'Sorry, something went wrong!';
    private defaultTroubleshooting = [
        'Check that your URL parameters are valid.',
        'Make sure you are connected to the internet.',
    ];
    public render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {typeof this.props.title === 'undefined'
                            ? this.defaultTitle
                            : this.props.title}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Troubleshooting:</p>
                    <ul>
                        {(
                            this.props.troubleshooting ||
                            this.defaultTroubleshooting
                        ).map(s => (
                            <li>{s}</li>
                        ))}
                    </ul>
                </Modal.Body>
            </Modal>
        );
    }
}
