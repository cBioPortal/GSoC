import * as React from 'react';
import { Modal } from 'react-bootstrap';
import browser from 'bowser';

interface IBrowserState {
    show: boolean;
    name: string;
    version: string;
    noShowModal: boolean;
}

export default class UnsupportedBrowserModal extends React.Component<
    {},
    IBrowserState
> {
    constructor(props: any) {
        super(props);

        this.state = {
            name: browser.name,
            show: false,
            version: browser.version.toString(),
            noShowModal: window.localStorage.noShowModal || false,
        };

        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
        this.handleHideClick = this.handleHideClick.bind(this);
    }

    componentDidMount() {
        this.handleUnsupportedBrowsers(
            this.state.name,
            this.state.version,
            this.state.noShowModal
        );
    }

    handleCheckboxChange(e: any) {
        this.setState({ noShowModal: e.target.checked });
    }

    componentWillUnmount() {
        window.localStorage.noShowModal = this.state.noShowModal;
    }

    handleUnsupportedBrowsers(
        name: string,
        version: string,
        localStorage: boolean
    ) {
        if (localStorage) {
            this.setState({ show: false });
            return;
        }
        const sessionStorage = window.sessionStorage.browserError || false;
        if (sessionStorage === true) {
            this.setState({ show: false });
        } else {
            name = name.toLowerCase();
            const isIE11 =
                (name === 'internet explorer' || name === 'msie') &&
                Number(version.slice(0, 2)) === 11;

            if (
                !(
                    name === 'chrome' ||
                    name === 'firefox' ||
                    name === 'microsoft edge' ||
                    name === 'msedge' ||
                    name === 'safari' ||
                    isIE11
                )
            ) {
                window.sessionStorage.browserError = true;
                this.setState({ show: true });
            } else {
                this.setState({ show: false });
                window.sessionStorage.browserError = true;
            }
        }
    }

    handleHideClick() {
        this.setState({ show: false });
        window.localStorage.noShowModal = this.state.noShowModal;
    }

    public render() {
        const { show, name } = this.state;
        return (
            <Modal show={show} onHide={this.handleHideClick}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Sorry, we do not support your browser version!
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ul>
                        <li>
                            It looks like your using an{' '}
                            {name === 'msie' || name === 'internet explorer'
                                ? 'old version of Internet Explorer'
                                : 'unsupported browser'}
                            .
                        </li>
                        <li>
                            Please consider using the latest version of Chrome,
                            Safari, Firefox or Microsoft Edge.
                        </li>
                    </ul>
                    <div style={{ paddingLeft: 22 }}>
                        <input
                            type="checkbox"
                            onChange={this.handleCheckboxChange}
                            checked={this.state.noShowModal}
                        />
                        <span style={{ paddingLeft: 10 }}>
                            Do not show me this pop-up again.
                        </span>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}
