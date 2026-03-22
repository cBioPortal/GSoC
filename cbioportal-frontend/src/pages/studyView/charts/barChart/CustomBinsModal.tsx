import * as React from 'react';
import _, { isInteger, isNumber } from 'lodash';
import { ChartMeta, customBinsAreValid } from 'pages/studyView/StudyViewUtils';
import autobind from 'autobind-decorator';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import {
    ControlLabel,
    FormControl,
    FormGroup,
    Modal,
    Radio,
} from 'react-bootstrap';
import {
    BinMethodOption,
    StudyViewPageStore,
} from 'pages/studyView/StudyViewPageStore';
import { BinsGeneratorConfig } from 'cbioportal-ts-api-client';

export type ICustomBinsProps = {
    show: boolean;
    onHide: () => void;
    chartMeta: ChartMeta;
    currentBins: number[];
    updateCustomBins: (
        uniqueKey: string,
        bins: number[],
        binMethod: BinMethodOption,
        binsGeneratorConfig: BinsGeneratorConfig
    ) => void;
    onChangeBinMethod: (uniqueKey: string, binMethod: BinMethodOption) => void;
    onChangeBinsGeneratorConfig: (
        uniqueKey: string,
        binSize: number,
        anchorValue: number
    ) => void;
    store: StudyViewPageStore;
};

@observer
export default class CustomBinsModal extends React.Component<
    ICustomBinsProps,
    {}
> {
    binSeparator: string = ',';
    @observable private currentBinsValue = '';
    defaultBinMethod = BinMethodOption.CUSTOM;
    defaultBinsGeneratorConfig = { binSize: 0, anchorValue: 0 };

    constructor(props: Readonly<ICustomBinsProps>) {
        super(props);
        makeObservable(this);
        if (this.props.currentBins) {
            const bins = _.sortBy(this.props.currentBins);
            this.currentBinsValue = bins.join(`${this.binSeparator} `);
        }
    }

    @computed get currentBinMethod() {
        return (
            this.props.store.chartsBinMethod[this.uniqueChartId] ||
            this.defaultBinMethod
        );
    }

    @computed get currentBinsGeneratorConfig() {
        return (
            this.props.store.chartsBinsGeneratorConfigs.get(
                this.uniqueChartId
            ) || this.defaultBinsGeneratorConfig
        );
    }

    @computed get uniqueChartId() {
        return this.props.chartMeta.uniqueKey;
    }

    @autobind
    updateCurrentBinsValue() {
        let newBins: number[] = [];
        if (this.currentBinMethod === BinMethodOption.CUSTOM) {
            newBins = _.sortBy(
                this.newStringBins
                    .filter(item => item !== '')
                    .map(item => Number(item.trim()))
            );
            this.currentBinsValue = newBins.join(`${this.binSeparator} `);
        }

        this.props.onChangeBinsGeneratorConfig(
            this.props.chartMeta.uniqueKey,
            this.currentBinsGeneratorConfig.binSize,
            this.currentBinsGeneratorConfig.anchorValue
        );

        this.props.updateCustomBins(
            this.props.chartMeta.uniqueKey,
            newBins,
            this.currentBinMethod,
            this.currentBinsGeneratorConfig
        );

        this.props.onHide();
    }

    @computed
    get newStringBins() {
        return this.currentBinsValue.trim().split(this.binSeparator);
    }

    @computed
    get contentIsValid(): boolean {
        return customBinsAreValid(this.newStringBins);
    }

    // TODO delegate to method in StudyViewPageStore
    @action
    changeBinsCheckbox(option: BinMethodOption) {
        this.props.onChangeBinMethod(this.uniqueChartId, option);
    }

    @action
    updateBinSize(value: number) {
        if (_.isNumber(value) && !_.isNaN(value)) {
            this.props.onChangeBinsGeneratorConfig(
                this.uniqueChartId,
                value,
                this.currentBinsGeneratorConfig.anchorValue
            );
        }
    }

    @action
    updateAnchorValue(value: number) {
        if (_.isNumber(value) && !_.isNaN(value)) {
            this.props.onChangeBinsGeneratorConfig(
                this.uniqueChartId,
                this.currentBinsGeneratorConfig.binSize,
                value
            );
        }
    }

    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onHide} keyboard>
                <Modal.Header closeButton>
                    <Modal.Title>Custom Bins</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <FormGroup>
                            <Radio
                                name="radioGroup"
                                defaultChecked={true}
                                checked={
                                    this.currentBinMethod ===
                                    BinMethodOption.QUARTILE
                                }
                                onChange={event =>
                                    this.changeBinsCheckbox(
                                        BinMethodOption.QUARTILE
                                    )
                                }
                            >
                                Quartiles
                            </Radio>
                        </FormGroup>
                        <FormGroup>
                            <Radio
                                name="radioGroup"
                                checked={
                                    this.currentBinMethod ===
                                    BinMethodOption.MEDIAN
                                }
                                onChange={event =>
                                    this.changeBinsCheckbox(
                                        BinMethodOption.MEDIAN
                                    )
                                }
                            >
                                Median split
                            </Radio>
                        </FormGroup>
                        <FormGroup>
                            <Radio
                                name="radioGroup"
                                checked={
                                    this.currentBinMethod ===
                                    BinMethodOption.GENERATE
                                }
                                onChange={event =>
                                    this.changeBinsCheckbox(
                                        BinMethodOption.GENERATE
                                    )
                                }
                            >
                                Generate bins
                            </Radio>
                        </FormGroup>
                        <FormGroup>
                            <Radio
                                name="radioGroup"
                                checked={
                                    this.currentBinMethod ===
                                    BinMethodOption.CUSTOM
                                }
                                onChange={event =>
                                    this.changeBinsCheckbox(
                                        BinMethodOption.CUSTOM
                                    )
                                }
                            >
                                Custom bins
                            </Radio>
                        </FormGroup>
                    </div>

                    {this.currentBinMethod === BinMethodOption.GENERATE && (
                        <div>
                            <FormGroup>
                                <ControlLabel>Bin size</ControlLabel>{' '}
                                <FormControl
                                    type="text"
                                    style={{ width: 70 }}
                                    data-test={'bin-size-input'}
                                    defaultValue={
                                        this.currentBinsGeneratorConfig.binSize
                                    }
                                    onChange={event => {
                                        const value = Number(
                                            ((event.currentTarget as unknown) as HTMLInputElement)
                                                .value
                                        );
                                        if (isNaN(value)) {
                                            ((event.currentTarget as unknown) as HTMLInputElement).value =
                                                '';
                                        } else {
                                            this.updateBinSize(Number(value));
                                        }
                                    }}
                                />
                            </FormGroup>
                            <FormGroup>
                                <ControlLabel>Min value</ControlLabel>{' '}
                                <FormControl
                                    type="text"
                                    style={{ width: 70 }}
                                    data-test={'anchorvalue-input'}
                                    defaultValue={
                                        this.currentBinsGeneratorConfig
                                            .anchorValue
                                    }
                                    onChange={event => {
                                        const value = Number(
                                            ((event.currentTarget as unknown) as HTMLInputElement)
                                                .value
                                        );
                                        if (isNaN(value)) {
                                            ((event.currentTarget as unknown) as HTMLInputElement).value =
                                                '';
                                        } else {
                                            this.updateAnchorValue(
                                                Number(value)
                                            );
                                        }
                                    }}
                                />
                            </FormGroup>
                        </div>
                    )}

                    {this.currentBinMethod === BinMethodOption.CUSTOM && (
                        <div>
                            <p>Please specify bin boundaries of the x axis</p>
                            <textarea
                                style={{ resize: 'none' }}
                                rows={5}
                                data-test={'custom-bins-textarea'}
                                value={this.currentBinsValue}
                                className="form-control input-sm"
                                onChange={event =>
                                    (this.currentBinsValue =
                                        event.currentTarget.value)
                                }
                            />
                        </div>
                    )}

                    {!this.contentIsValid && (
                        <div
                            className="alert alert-danger"
                            role="alert"
                            style={{ marginTop: '10px', marginBottom: '0' }}
                        >
                            Invalid bins
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={this.updateCurrentBinsValue}
                        disabled={!this.contentIsValid}
                        style={{ marginTop: '10px', marginBottom: '0' }}
                    >
                        Update
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}
