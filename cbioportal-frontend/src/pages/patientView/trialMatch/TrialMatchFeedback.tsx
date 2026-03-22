import * as React from 'react';
import _ from 'lodash';
import { Modal } from 'react-bootstrap';
import { ISelectedTrialFeedbackFormData } from './TrialMatchTable';

interface ITrialMatchFeedbackProps {
    show: boolean;
    data?: ISelectedTrialFeedbackFormData;
    isTrialFeedback?: boolean;
    title: string;
    userDisplayName: string;
    onHide: () => void;
}

export default class TrialMatchFeedback extends React.Component<
    ITrialMatchFeedbackProps,
    {}
> {
    public render() {
        let src = '';
        if (this.props.show) {
            if (
                !_.isUndefined(this.props.isTrialFeedback) &&
                this.props.isTrialFeedback
            ) {
                const url =
                    'https://docs.google.com/forms/d/e/1FAIpQLSfcoLRG0iWO_qUb4hfzWFQ1toP575EKCTwqPcXE9DmMzuS34w/viewform';
                const userParam = `entry.1655318994=${this.props
                    .userDisplayName || ''}`;
                const uriParam = `entry.1782078941=${encodeURIComponent(
                    window.location.href
                )}`;
                src = `${url}?${userParam}&${uriParam}&embedded=true`;
                if (!_.isUndefined(this.props.data)) {
                    const nctIdParam = `entry.1070287537=${this.props.data
                        .nctId || ''}`;
                    const protocolNoParam = `entry.699867040=${this.props.data
                        .protocolNo || ''}`;
                    src = `${url}?${userParam}&${uriParam}&${nctIdParam}&${protocolNoParam}&embedded=true`;
                }
            } else {
                const url =
                    'https://docs.google.com/forms/d/e/1FAIpQLSes1WuMattmo_aT8-34LaPRTC47vVzvdWMgYZ5tSuw8EHoLZw/viewform';
                const userParam = `entry.251841421=${this.props
                    .userDisplayName || ''}`;
                const uriParam = `entry.1295500928=${encodeURIComponent(
                    window.location.href
                )}`;
                src = `${url}?${userParam}&${uriParam}&embedded=true`;
            }
        }

        return (
            <Modal show={this.props.show} onHide={this.props.onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>{this.props.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <iframe
                        src={src}
                        style={{
                            width: 550,
                            height: 700,
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
