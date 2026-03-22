import * as React from 'react';
import { Modal } from 'react-bootstrap';

interface IOncoKbFeedbackProps {
    showFeedback: boolean;
    hugoSymbol?: string;
    alteration?: string;
    userDisplayName?: string;
    handleFeedbackClose: () => void;
}

export default class OncoKbFeedback extends React.Component<
    IOncoKbFeedbackProps,
    {}
> {
    public render() {
        const url =
            'https://docs.google.com/forms/d/1lt6TtecxHrhIE06gAKVF_JW4zKFoowNFzxn6PJv4g7A/viewform';
        const geneParam = `entry.1744186665=${this.props.hugoSymbol || ''}`;
        const alterationParam = `entry.1671960263=${this.props.alteration ||
            ''}`;
        const userParam = `entry.1381123986=${this.props.userDisplayName ||
            ''}`;
        const uriParam = `entry.1083850662=${encodeURIComponent(
            window.location.href
        )}`;

        return (
            <Modal
                show={this.props.showFeedback}
                onHide={this.props.handleFeedbackClose}
            >
                <Modal.Header closeButton>
                    <Modal.Title>OncoKB™ Annotation Feedback</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <iframe
                        src={`${url}?${geneParam}&${alterationParam}&entry.118699694&entry.1568641202&${userParam}&${uriParam}&embedded=true`}
                        style={{
                            width: 550,
                            height: 500,
                            border: 'none',
                            marginLeft: '10px',
                        }}
                        marginHeight={0}
                        marginWidth={0}
                    >
                        <i className="fa fa-spinner fa-pulse fa-2x" />
                    </iframe>
                </Modal.Body>
            </Modal>
        );
    }
}
