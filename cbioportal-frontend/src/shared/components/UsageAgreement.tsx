import React from 'react';
import { Alert, Button, Modal, Checkbox, ButtonGroup } from 'react-bootstrap';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { computed, makeObservable, observable, ObservableMap } from 'mobx';
import expiredStorage from 'expired-storage';

import _ from 'lodash';

const SECONDS_IN_DAY = 86400;

interface IUsageAgreement {
    alertMessage: JSX.Element;
    persistenceKey: string;
    clauses: JSX.Element[];
    useCheckboxes?: boolean;
    expirationInDays?: number;
    dismissButtonText?: string;
}

@observer
export default class UsageAgreement extends React.Component<
    IUsageAgreement,
    {}
> {
    @observable
    show: boolean = true;
    @observable
    modalShow: boolean = false;

    @observable checkedItems = observable.map<string, boolean>();

    constructor(props: IUsageAgreement) {
        super(props);
        makeObservable(this);
    }

    @computed get expirationInSeconds() {
        return this.props.expirationInDays
            ? this.props.expirationInDays * SECONDS_IN_DAY
            : undefined;
    }

    @computed get useCheckboxes() {
        return (
            this.props.useCheckboxes === true ||
            this.props.useCheckboxes === undefined
        );
    }

    @computed get isAgreementComplete(): boolean {
        return (
            this.useCheckboxes === false ||
            (this.checkedItems.size === this.props.clauses.length &&
                _.every(
                    Array.from(this.checkedItems.values()),
                    val => val === true
                ))
        );
    }

    @autobind
    handleDismiss() {
        this.show = false;
        this.modalShow = false;

        new expiredStorage().setItem(
            this.props.persistenceKey,
            'true',
            this.expirationInSeconds
        );
    }

    @autobind
    handleHide() {
        this.show = false;
    }
    @autobind
    handleShow() {
        this.show = true;
    }
    @autobind
    handleModalShow() {
        this.modalShow = true;
    }
    @autobind
    handleModalHide() {
        this.modalShow = false;
    }
    @autobind
    handleChecked(item: string) {
        this.checkedItems.set(item, !this.checkedItems.get(item));
    }

    render() {
        if (this.show) {
            return (
                <>
                    <Alert
                        bsStyle="warning"
                        style={{
                            position: 'absolute',
                            zIndex: 999,
                            width: '100%',
                            textAlign: 'center',
                        }}
                    >
                        {this.props.alertMessage}
                        <ButtonGroup style={{ marginLeft: '10px' }}>
                            <Button
                                bsSize="xsmall"
                                onClick={this.handleModalShow}
                            >
                                {this.props.dismissButtonText || 'Dismiss'}
                            </Button>
                        </ButtonGroup>
                    </Alert>

                    <Modal
                        show={this.modalShow}
                        onHide={this.handleModalHide}
                        container={this}
                        aria-labelledby="contained-modal-title"
                    >
                        <Modal.Header>
                            <Modal.Title
                                id="contained-modal-title"
                                style={{ textAlign: 'center' }}
                            >
                                Dismiss Agreement
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body style={{ textAlign: 'left' }}>
                            {this.useCheckboxes &&
                                this.props.clauses.map((label, i) => {
                                    return (
                                        <Checkbox
                                            onClick={() => {
                                                this.handleChecked(`item${i}`);
                                            }}
                                        >
                                            {label}
                                        </Checkbox>
                                    );
                                })}

                            {this.props.useCheckboxes === false && (
                                <ul>
                                    {this.props.clauses.map(label => {
                                        return <li>{label}</li>;
                                    })}
                                </ul>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            {this.isAgreementComplete ? (
                                <Button
                                    bsStyle="primary"
                                    onClick={this.handleDismiss}
                                >
                                    I Agree
                                </Button>
                            ) : (
                                <Button
                                    bsStyle="primary"
                                    onClick={this.handleDismiss}
                                    disabled
                                >
                                    I Agree
                                </Button>
                            )}
                        </Modal.Footer>
                    </Modal>
                </>
            );
        } else {
            return null;
        }
    }
}
