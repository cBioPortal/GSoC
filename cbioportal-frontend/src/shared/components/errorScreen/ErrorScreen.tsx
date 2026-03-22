import * as React from 'react';
import _ from 'lodash';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import styles from './errorScreen.module.scss';
import { getServerConfig } from 'config/config';
import { buildCBioPortalPageUrl } from 'shared/api/urls';
import { computed, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
var Clipboard = require('clipboard');

interface IErrorScreenProps {
    errorLog?: string;
    title?: string;
    body?: string | JSX.Element;
    errorMessages?: string[];
}

@observer
export default class ErrorScreen extends React.Component<
    IErrorScreenProps,
    {}
> {
    constructor(props: IErrorScreenProps) {
        super(props);
        makeObservable(this);
    }
    @autobind
    copyToClipRef(copyToClip: HTMLButtonElement | null) {
        if (copyToClip) {
            new Clipboard(copyToClip, {
                text: function() {
                    return JSON.stringify(this.errorLog);
                }.bind(this),
                container: copyToClip,
            });
        }
    }

    @computed get errorLog() {
        let errorLog: any;
        try {
            errorLog = this.props.errorLog
                ? JSON.parse(this.props.errorLog)
                : undefined;
            // add the current url to error log
            if (errorLog) errorLog.url = window.location.href;
        } catch (ex) {
            errorLog = this.props.errorLog;
        }

        return errorLog;
    }

    public render() {
        const location = getBrowserWindow().location.href;
        const subject = 'cBioPortal user reported error';

        return (
            <div className={styles.errorScreen}>
                <a
                    className={styles.errorLogo}
                    href={buildCBioPortalPageUrl('/')}
                >
                    <img
                        src={require('../../../globalStyles/images/cbioportal_logo.png')}
                        alt="cBioPortal Logo"
                    />
                </a>

                {this.props.title && <h4>{this.props.title}</h4>}

                {this.props.errorMessages && (
                    <div
                        style={{ marginTop: 20 }}
                        className={'alert alert-danger'}
                        role="alert"
                    >
                        <ul style={{ listStyleType: 'none' }}>
                            {this.props.errorMessages.map(
                                (errorMessage: string, index) => (
                                    <li>{`${index + 1}: ${errorMessage}`}</li>
                                )
                            )}
                        </ul>
                    </div>
                )}

                {this.props.body && <div>{this.props.body}</div>}

                {this.errorLog && getServerConfig().skin_email_contact && (
                    <div style={{ marginTop: 20 }}>
                        <p style={{ marginBottom: 20 }}>
                            Please contact us at{' '}
                            <a
                                href={`mailto:${
                                    getServerConfig().skin_email_contact
                                }?subject=${encodeURIComponent(
                                    subject
                                )}&body=${encodeURIComponent(
                                    window.location.href
                                )};${encodeURIComponent(
                                    this.props.errorLog || ''
                                )}`}
                            >
                                {getServerConfig().skin_email_contact}
                            </a>
                            .
                        </p>
                        <p>
                            Copy-paste the error log below and provide a
                            click-by-click description of how you arrived at the
                            error.
                        </p>
                    </div>
                )}

                {this.errorLog && (
                    <div style={{ marginTop: 20 }} className="form-group">
                        <button
                            style={{ marginBottom: 5 }}
                            ref={this.copyToClipRef}
                            className={'btn btn-xs'}
                        >
                            Copy Error Log to Clipboard
                        </button>
                        <textarea
                            value={JSON.stringify(this.errorLog)}
                            className={'form-control'}
                        ></textarea>
                    </div>
                )}
            </div>
        );
    }
}
