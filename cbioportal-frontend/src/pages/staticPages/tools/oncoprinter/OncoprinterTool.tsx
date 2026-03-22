import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import { Helmet } from 'react-helmet';
import { PageLayout } from '../../../../shared/components/PageLayout/PageLayout';
import OncoprinterStore from './OncoprinterStore';
import Oncoprinter from './Oncoprinter';
import { action, observable, runInAction, makeObservable } from 'mobx';
import { Button, ControlLabel, FormControl, FormGroup } from 'react-bootstrap';
import { Collapse } from 'react-collapse';
import autobind from 'autobind-decorator';
import {
    exampleClinicalData,
    exampleGeneticData,
    exampleHeatmapData,
} from './OncoprinterConstants';
import { MSKTab, MSKTabs } from '../../../../shared/components/MSKTabs/MSKTabs';
import MutualExclusivityTab from '../../../resultsView/mutualExclusivity/MutualExclusivityTab';
import { getDataForSubmission } from './OncoprinterToolUtils';
import {
    ClinicalTrackDataType,
    HeatmapTrackDataType,
    ONCOPRINTER_VAL_NA,
} from './OncoprinterClinicalAndHeatmapUtils';
import styles from './styles.module.scss';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import {
    ClinicalFormatHelp,
    GenomicFormatHelp,
    HeatmapFormatHelp,
} from './OncoprinterHelp';
import { buildCBioLink } from 'shared/api/urls';

export interface IOncoprinterToolProps {}

export enum OncoprinterTab {
    ONCOPRINT = 'oncoprint',
    MUTUAL_EXCLUSIVITY = 'mutualExclusivity',
}

@observer
export default class OncoprinterTool extends React.Component<
    IOncoprinterToolProps,
    {}
> {
    private store = new OncoprinterStore();
    private geneticFileInput: HTMLInputElement | null;
    private clinicalFileInput: HTMLInputElement | null;
    private heatmapFileInput: HTMLInputElement | null;
    @observable private activeTabId: OncoprinterTab = OncoprinterTab.ONCOPRINT;

    @observable dataInputOpened = true;
    @observable geneticHelpOpened = false;
    @observable clinicalHelpOpened = false;
    @observable heatmapHelpOpened = false;

    // help
    @observable helpOpened = false;

    // input
    @observable geneticDataInput = '';
    @observable clinicalDataInput = '';
    @observable heatmapDataInput = '';
    @observable geneOrderInput = '';
    @observable sampleOrderInput = '';

    // jupyter incoming data
    @observable mutations = '';
    @observable studyIds = '';

    constructor(props: IOncoprinterToolProps) {
        super(props);
        makeObservable(this);
        (window as any).oncoprinterTool = this;
    }

    componentDidMount() {
        // Load posted data, if it exists
        const postData = getBrowserWindow().clientPostedData;
        if (postData) {
            this.geneticDataInput = postData.genetic;
            this.clinicalDataInput = postData.clinical;
            this.heatmapDataInput = postData.heatmap;
            this.studyIds = postData.studyIds;
            this.mutations = postData.mutations;

            this.doSubmit(
                this.geneticDataInput,
                this.clinicalDataInput,
                this.heatmapDataInput
            );

            this.handleJupyterData(this.mutations, this.studyIds);

            getBrowserWindow().clientPostedData = null;
        }
    }

    @action.bound
    private toggleHelpOpened() {
        this.helpOpened = !this.helpOpened;
    }

    @action.bound
    private populateGeneticExampleData() {
        this.geneticDataInput = exampleGeneticData;
    }

    @action.bound
    private populateClinicalExampleData() {
        this.clinicalDataInput = exampleClinicalData;
    }

    @action.bound
    private populateHeatmapExampleData() {
        this.heatmapDataInput = exampleHeatmapData;
    }

    @action.bound
    public onGeneticDataInputChange(e: any) {
        this.geneticDataInput = e.currentTarget.value;
    }

    @action.bound
    private onClinicalDataInputChange(e: any) {
        this.clinicalDataInput = e.currentTarget.value;
    }

    @action.bound
    private onHeatmapDataInputChange(e: any) {
        this.heatmapDataInput = e.currentTarget.value;
    }

    @action.bound
    private onGeneOrderInputChange(e: any) {
        this.geneOrderInput = e.currentTarget.value;
    }

    @action.bound
    private onSampleOrderInputChange(e: any) {
        this.sampleOrderInput = e.currentTarget.value;
    }

    @action.bound
    private toggleGeneticHelp() {
        this.geneticHelpOpened = !this.geneticHelpOpened;
    }

    @action.bound
    private toggleClinicalHelp() {
        this.clinicalHelpOpened = !this.clinicalHelpOpened;
    }

    @action.bound
    private toggleHeatmapHelp() {
        this.heatmapHelpOpened = !this.heatmapHelpOpened;
    }

    @action private doSubmit(
        geneticDataInput: string,
        clinicalDataInput: string,
        heatmapDataInput: string
    ) {
        this.store.setInput(
            geneticDataInput,
            clinicalDataInput,
            heatmapDataInput,
            this.geneOrderInput,
            this.sampleOrderInput
        );

        if (this.store.parseErrors.length === 0) {
            this.dataInputOpened = false;
        }
    }

    @action private handleJupyterData(mutations: string, studyIds: string) {
        this.store.setJupyterInput(mutations, studyIds);
    }

    @autobind private geneticFileInputRef(input: HTMLInputElement | null) {
        this.geneticFileInput = input;
    }

    @autobind private clinicalFileInputRef(input: HTMLInputElement | null) {
        this.clinicalFileInput = input;
    }

    @autobind private heatmapFileInputRef(input: HTMLInputElement | null) {
        this.heatmapFileInput = input;
    }

    @autobind
    private getGeneticDataForSubmission() {
        return getDataForSubmission(
            this.geneticFileInput,
            this.geneticDataInput
        );
    }

    @autobind
    private getClinicalDataForSubmission() {
        return getDataForSubmission(
            this.clinicalFileInput,
            this.clinicalDataInput
        );
    }

    @autobind
    private getHeatmapDataForSubmission() {
        return getDataForSubmission(
            this.heatmapFileInput,
            this.heatmapDataInput
        );
    }

    @action.bound
    private async onClickSubmit() {
        const geneticData = await this.getGeneticDataForSubmission();
        const clinicalData = await this.getClinicalDataForSubmission();
        const heatmapData = await this.getHeatmapDataForSubmission();

        this.doSubmit(geneticData, clinicalData, heatmapData);
    }

    private openDataFormat(tab: 'genomic' | 'clinical' | 'heatmap') {
        window.open(`oncoprinterDataFormat?tab=${tab}`, '_blank');
    }

    @autobind
    private getInputSection() {
        return (
            <FormGroup
                style={{ display: this.dataInputOpened ? undefined : 'none' }}
            >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div>
                        <ControlLabel style={{ marginBottom: 7 }}>
                            Step 1) Input genomic alteration data (optional):
                        </ControlLabel>
                        <Button
                            className="oncoprinterGeneticExampleData"
                            style={{ marginLeft: 7 }}
                            bsStyle="primary"
                            bsSize="xs"
                            onClick={this.populateGeneticExampleData}
                        >
                            Load example data
                        </Button>
                        <Button
                            className="oncoprinterGeneticHelp"
                            style={{ marginLeft: 7 }}
                            bsStyle="primary"
                            bsSize="xs"
                            onClick={this.toggleGeneticHelp}
                        >
                            {this.geneticHelpOpened ? 'Close ' : 'View '}data
                            format
                        </Button>
                        <Collapse isOpened={this.geneticHelpOpened}>
                            <div style={{ paddingBottom: 10 }}>
                                {GenomicFormatHelp}
                            </div>
                        </Collapse>
                        <FormControl
                            className="oncoprinterGeneticDataInput"
                            componentClass="textarea"
                            value={this.geneticDataInput}
                            placeholder="Enter data here..."
                            onChange={this.onGeneticDataInputChange}
                            style={{ height: 200, width: '100%' }}
                        />
                        <ControlLabel>or input data from file:</ControlLabel>
                        <input ref={this.geneticFileInputRef} type="file" />
                    </div>
                    <hr style={{ width: '100%' }} />
                    <div>
                        <ControlLabel style={{ marginBottom: 7 }}>
                            Step 2) Input clinical data (optional):
                        </ControlLabel>
                        <Button
                            className="oncoprinterClinicalExampleData"
                            style={{ marginLeft: 7 }}
                            bsStyle="primary"
                            bsSize="xs"
                            onClick={this.populateClinicalExampleData}
                        >
                            Load example data
                        </Button>
                        <Button
                            className="oncoprinterClinicalHelp"
                            style={{ marginLeft: 7 }}
                            bsStyle="primary"
                            bsSize="xs"
                            onClick={this.toggleClinicalHelp}
                        >
                            {this.clinicalHelpOpened ? 'Close ' : 'View '}data
                            format
                        </Button>
                        <Collapse isOpened={this.clinicalHelpOpened}>
                            <div style={{ paddingBottom: 10 }}>
                                {ClinicalFormatHelp}
                            </div>
                        </Collapse>
                        <FormControl
                            className="oncoprinterClinicalDataInput"
                            componentClass="textarea"
                            value={this.clinicalDataInput}
                            placeholder="Enter data here..."
                            onChange={this.onClinicalDataInputChange}
                            style={{ height: 200, width: '100%' }}
                        />
                        <ControlLabel>or input data from file:</ControlLabel>
                        <input ref={this.clinicalFileInputRef} type="file" />
                    </div>
                    <hr style={{ width: '100%' }} />
                    <div>
                        <ControlLabel style={{ marginBottom: 7 }}>
                            Step 3) Input heatmap data (optional):
                        </ControlLabel>
                        <Button
                            className="oncoprinterHeatmapExampleData"
                            style={{ marginLeft: 7 }}
                            bsStyle="primary"
                            bsSize="xs"
                            onClick={this.populateHeatmapExampleData}
                        >
                            Load example data
                        </Button>
                        <Button
                            className="oncoprinterHeatmapHelp"
                            style={{ marginLeft: 7 }}
                            bsStyle="primary"
                            bsSize="xs"
                            onClick={this.toggleHeatmapHelp}
                        >
                            {this.heatmapHelpOpened ? 'Close ' : 'View '}data
                            format
                        </Button>
                        <Collapse isOpened={this.heatmapHelpOpened}>
                            <div style={{ paddingBottom: 10 }}>
                                {HeatmapFormatHelp}
                            </div>
                        </Collapse>
                        <FormControl
                            className="oncoprinterHeatmapDataInput"
                            componentClass="textarea"
                            value={this.heatmapDataInput}
                            placeholder="Enter data here..."
                            onChange={this.onHeatmapDataInputChange}
                            style={{ height: 200, width: '100%' }}
                        />
                        <ControlLabel>or input data from file:</ControlLabel>
                        <input ref={this.heatmapFileInputRef} type="file" />
                    </div>
                </div>
                <br />
                <ControlLabel>
                    Please define the order of genes (optional):
                </ControlLabel>
                <FormControl
                    className="oncoprinterGenesInput"
                    componentClass="textarea"
                    value={this.geneOrderInput}
                    placeholder="Enter genes here, comma- or whitespace-delimited..."
                    onChange={this.onGeneOrderInputChange}
                    style={{ height: 35, width: 475 }}
                />
                <br />
                <ControlLabel>
                    Please define the order of samples (optional):
                </ControlLabel>
                <FormControl
                    className="oncoprinterSamplesInput"
                    componentClass="textarea"
                    value={this.sampleOrderInput}
                    placeholder="Enter samples here, comma- or whitespace-delimited..."
                    onChange={this.onSampleOrderInputChange}
                    style={{ height: 35, width: 475 }}
                />
                <br />
                <Button
                    className="oncoprinterSubmit"
                    bsSize="large"
                    bsStyle="primary"
                    disabled={
                        this.geneticDataInput.trim().length === 0 &&
                        this.clinicalDataInput.trim().length === 0 &&
                        this.heatmapDataInput.trim().length === 0
                    }
                    onClick={this.onClickSubmit}
                    style={{ marginBottom: 20 }}
                >
                    Submit
                </Button>
                {this.store.parseErrors.length > 0 && (
                    <div
                        className="alert alert-danger"
                        style={{ marginTop: 5, whiteSpace: 'pre-wrap' }}
                    >
                        {this.store.parseErrors.map(err => (
                            <div>{err}</div>
                        ))}
                    </div>
                )}
            </FormGroup>
        );
    }

    render() {
        const numCells =
            this.store.hugoGeneSymbols.length * this.store.sampleIds.length;
        return (
            <PageLayout className={'whiteBackground staticPage'}>
                <Helmet>
                    <title>
                        {'cBioPortal for Cancer Genomics::Oncoprinter'}
                    </title>
                </Helmet>
                <div className="cbioportal-frontend">
                    <h1 style={{ display: 'inline', marginRight: 10 }}>
                        Oncoprinter
                    </h1>{' '}
                    Generate Oncoprints and perform mutual exclusivity analysis
                    from your own data.
                    <br />
                    <br />
                    <Observer>{this.getInputSection}</Observer>
                    {!this.dataInputOpened && (
                        <button
                            className="btn btn-primary btn-lg oncoprinterModifyInput"
                            style={{
                                paddingLeft: 50,
                                paddingRight: 50,
                                marginBottom: 15,
                            }}
                            onClick={() => {
                                this.dataInputOpened = true;
                            }}
                        >
                            Modify Input
                        </button>
                    )}
                    <div
                        style={{
                            display:
                                this.store.hasData() &&
                                !this.store.parseErrors.length
                                    ? 'block'
                                    : 'none',
                        }}
                    >
                        <MSKTabs
                            activeTabId={this.activeTabId}
                            unmountOnHide={false}
                            onTabClick={(id: string) => {
                                this.activeTabId = id as OncoprinterTab;
                            }}
                            className="mainTabs"
                        >
                            <MSKTab
                                key={0}
                                id={OncoprinterTab.ONCOPRINT}
                                linkText="Oncoprint"
                            >
                                {numCells > 100000 && (
                                    <div className="alert alert-warning">
                                        Warning: Because your inputted data is
                                        very large, the Oncoprinter may be slow,
                                        and downloaded PDF, SVG, and PNG may be
                                        huge and unresponsive. We recommend
                                        plotting data for fewer genes at a time.
                                    </div>
                                )}
                                <div style={{ marginTop: 10 }}>
                                    <Oncoprinter
                                        divId="oncoprinter"
                                        store={this.store}
                                    />
                                </div>
                            </MSKTab>
                            <MSKTab
                                key={1}
                                id={OncoprinterTab.MUTUAL_EXCLUSIVITY}
                                linkText="Mutual Exclusivity"
                            >
                                <MutualExclusivityTab
                                    isSampleAlteredMap={
                                        this.store.isSampleAlteredMap
                                    }
                                />
                            </MSKTab>
                        </MSKTabs>
                    </div>
                </div>
            </PageLayout>
        );
    }
}
