import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import { Collapse } from 'react-collapse';
import {
    ControlLabel,
    FormControl,
    FormGroup,
    ButtonGroup,
    Radio,
} from 'react-bootstrap';
import { PageLayout } from 'shared/components/PageLayout/PageLayout';
import Helmet from 'react-helmet';

import Loader from 'shared/components/loadingIndicator/LoadingIndicator';
import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import { convertToMutationMapperProps } from 'shared/components/mutationMapper/MutationMapperServerConfig';
import MutationMapperUserSelectionStore from 'shared/components/mutationMapper/MutationMapperUserSelectionStore';
import { parseInput } from 'shared/lib/MutationInputParser';

import StandaloneMutationMapper from './StandaloneMutationMapper';
import MutationMapperToolStore from './MutationMapperToolStore';

import {
    getMutationAlignerUrlTemplate,
    getOncoKbApiUrl,
} from 'shared/api/urls';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { REFERENCE_GENOME } from 'shared/lib/referenceGenomeUtils';
import { getServerConfig } from 'config/config';
import { saveOncoKbIconStyleToLocalStorage } from 'shared/lib/AnnotationColumnUtils';

interface IMutationMapperToolProps {
    routing: any;
}

const ONCOKB_URL = 'https://www.oncokb.org/';
const CIVIC_URL = 'https://civicdb.org/';
const CANCER_HOTSPOTS_URL = 'https://www.cancerhotspots.org/';

@inject('routing')
@observer
export default class MutationMapperTool extends React.Component<
    IMutationMapperToolProps,
    {}
> {
    private userSelectionStore: MutationMapperUserSelectionStore;

    @observable.ref standaloneMutationMapperGeneTab:
        | string
        | undefined = undefined;
    @observable dataFormatCollapsed = true;
    @observable.ref inputText: string | undefined = undefined;
    @observable inputControlsVisible = true;
    @observable.ref inputFileContent: string | undefined = undefined;
    @observable showIncorrectInput = false;
    @observable.ref lastParsedInputContent: string | undefined = undefined;
    @observable referenceGenomeSelection: string = REFERENCE_GENOME.grch37.NCBI;

    private store: MutationMapperToolStore = new MutationMapperToolStore(
        undefined,
        { genomeBuild: REFERENCE_GENOME.grch37.NCBI }
    );

    constructor(props: IMutationMapperToolProps) {
        super(props);

        makeObservable(this);

        this.userSelectionStore = new MutationMapperUserSelectionStore();
        // set genomenexus url to grch38 instance if "show_mutation_mapper_tool_grch38" is true and choose "GRCh38", otherwise use default url
        if (
            getServerConfig().show_mutation_mapper_tool_grch38 &&
            getBrowserWindow().localStorage.getItem('referenceGenomeId') ===
                REFERENCE_GENOME.grch38.NCBI
        ) {
            this.store = new MutationMapperToolStore(undefined, {
                genomeBuild: REFERENCE_GENOME.grch38.UCSC,
            });
            this.referenceGenomeSelection = REFERENCE_GENOME.grch38.NCBI;
        }

        this.handleTabChange.bind(this);
    }

    public render() {
        return (
            <PageLayout className={'whiteBackground staticPage'}>
                <Helmet>
                    <title>
                        {'cBioPortal for Cancer Genomics::MutationMapper'}
                    </title>
                </Helmet>
                <div className="cbioportal-frontend">
                    <h1 style={{ display: 'inline' }}>MutationMapper</h1>{' '}
                    interprets mutations with protein annotations
                    <div style={{ padding: 4 }} />
                    {this.input()}
                    <div style={{ padding: 4 }} />
                    <Loader
                        isLoading={this.store.mutations.isPending}
                        children={
                            <span style={{ paddingLeft: 20 }}>
                                Annotating mutations with{' '}
                                <a
                                    href={'https://www.genomenexus.org'}
                                    target="_blank"
                                >
                                    Genome Nexus
                                </a>
                            </span>
                        }
                    />
                    {this.store.mutationsNotAnnotated.length > 0 &&
                        this.inputParseWarning()}
                    {this.shouldShowGrch38Warning && this.grch38Warning}
                    {this.store.mutationData && this.mainTabs()}
                </div>
            </PageLayout>
        );
    }

    @computed get activeTabId(): string | undefined {
        // use routing if available, if not fall back to the observable variable
        return this.props.routing
            ? this.props.routing.query.standaloneMutationMapperGeneTab
            : this.standaloneMutationMapperGeneTab;
    }

    @computed get inputContent(): string {
        // input field has priority over input file
        const content = this.inputText || this.inputFileContent;

        return content ? content.trim() : '';
    }

    @autobind
    toggleIncorrectInput() {
        this.showIncorrectInput = !this.showIncorrectInput;
    }

    protected inputParseWarning() {
        if (
            this.store.hugoGeneSymbols.isComplete &&
            this.store.hugoGeneSymbols.result &&
            this.store.hugoGeneSymbols.result.length > 0 &&
            this.lastParsedInputContent &&
            this.store.mutationsNotAnnotated.length > 0
        ) {
            return (
                <div className="alert alert-warning" role="alert">
                    Failed to annotate {this.store.mutationsNotAnnotated.length}{' '}
                    mutation
                    {this.store.mutationsNotAnnotated.length > 1 ? 's' : ''}
                    &nbsp;
                    {this.showIncorrectInput &&
                        this.lastParsedInputContent &&
                        this.store.mutationsNotAnnotated.map(
                            failedAnnotation => (
                                <div>
                                    Line {failedAnnotation.lineNumber}:{' '}
                                    {this.lastParsedInputContent &&
                                        this.lastParsedInputContent.split('\n')[
                                            failedAnnotation.lineNumber - 1
                                        ]}
                                </div>
                            )
                        )}
                    (
                    <a
                        data-test="ShowWarningsButton"
                        onClick={this.toggleIncorrectInput}
                    >
                        {this.showIncorrectInput ? 'Hide' : 'Show'}
                    </a>
                    )
                </div>
            );
        } else {
            return null;
        }
    }

    protected mainTabs() {
        if (
            this.store.hugoGeneSymbols.isComplete &&
            this.store.hugoGeneSymbols.result &&
            this.store.hugoGeneSymbols.result.length > 0
        ) {
            const activeTabId =
                this.activeTabId || this.store.hugoGeneSymbols.result[0];

            return (
                <div>
                    <Loader
                        isLoading={this.store.mutationMapperStores.isPending}
                    />
                    {this.store.mutationMapperStores.isComplete && (
                        <MSKTabs
                            id="mutationMapperToolTabs"
                            activeTabId={activeTabId}
                            onTabClick={(id: string) =>
                                this.handleTabChange(id)
                            }
                            className="pillTabs"
                            arrowStyle={{ 'line-height': 0.8 }}
                            tabButtonStyle="pills"
                            unmountOnHide={true}
                        >
                            {this.generateTabs(
                                this.store.hugoGeneSymbols.result
                            )}
                        </MSKTabs>
                    )}
                </div>
            );
        } else if (
            this.store.hugoGeneSymbols.isComplete &&
            !this.inputControlsVisible
        ) {
            return (
                <div className="alert alert-danger">
                    Error processing the input. Please review your input and try
                    again.
                </div>
            );
        } else if (this.store.criticalErrors.length > 0) {
            return (
                <div className="alert alert-danger">
                    Critical annotation error. Annotation services might be
                    temporarily down, or your input format might be invalid.
                </div>
            );
        } else {
            return null;
        }
    }

    protected input() {
        if (this.inputControlsVisible) {
            return (
                <div className="standalone-mutation-input">
                    {this.referenceGenomeSelector}
                    <p>
                        Please input <b>tab-delimited</b> or{' '}
                        <b>space-delimited</b> mutation data. (Load example
                        data:
                        <span>
                            {' '}
                            <a
                                onClick={
                                    this.handleLoadExampleGenomicCoordinates
                                }
                                data-test="GenomicChangesExampleButton"
                            >
                                Genomic Changes
                            </a>
                        </span>
                        ,
                        <span>
                            {' '}
                            <a
                                onClick={
                                    this.handleLoadExampleGeneAndProteinChange
                                }
                                data-test="ProteinChangesExampleButton"
                            >
                                Protein Changes
                            </a>
                        </span>
                        ,
                        <span>
                            {' '}
                            <a
                                onClick={
                                    this.handleLoadExamplePartiallyAnnotated
                                }
                                data-test="GenomicAndProteinChangesExampleButton"
                            >
                                Genomic and Protein Changes
                            </a>
                        </span>
                        )
                    </p>

                    {this.dataFormatToggler()}

                    <FormGroup controlId="standaloneMutationTextInput">
                        <ControlLabel>
                            Copy and paste your own mutation data
                        </ControlLabel>
                        <FormControl
                            componentClass="textarea"
                            rows={15}
                            cols={20}
                            value={this.inputText}
                            onChange={this.handleInputChange}
                        />
                    </FormGroup>

                    <FormGroup controlId="standaloneMutationFileUpload">
                        <ControlLabel>
                            Upload your own mutation file
                        </ControlLabel>
                        <FormControl
                            type="file"
                            accept="text/plain"
                            onChange={this.handleFileSelect}
                        />
                    </FormGroup>

                    <button
                        className="btn btn-lg btn-primary"
                        onClick={this.handleVisualize}
                        disabled={this.inputContent.length === 0}
                        data-test="MutationMapperToolVisualizeButton"
                    >
                        Visualize
                    </button>
                </div>
            );
        } else {
            return (
                <div className="mutation-input-field-expander">
                    <button
                        onClick={this.handleModifyInput}
                        className="btn btn-primary"
                    >
                        Modify Input
                    </button>
                </div>
            );
        }
    }

    protected dataFormatToggler() {
        return (
            <p>
                <div
                    className="collapsible-header"
                    onClick={this.handleDataFormatToggle}
                >
                    <a>Data Format</a>
                    <span style={{ paddingLeft: 4 }}>
                        {this.dataFormatCollapsed ? (
                            <i className="fa fa-chevron-down" />
                        ) : (
                            <i className="fa fa-chevron-up" />
                        )}
                    </span>
                </div>
                <Collapse isOpened={!this.dataFormatCollapsed}>
                    <div className="mutation-data-info">
                        {this.essentialColumnsInfo()}

                        <p>List of valid input headers:</p>
                        <div className="full-list-of-headers">
                            {this.inputFormatDesc()}
                        </div>
                    </div>
                </Collapse>
            </p>
        );
    }

    protected essentialColumnsInfo() {
        return (
            <div className="mutation-input-format-info">
                <p>
                    You can either copy and paste your input into the text field
                    below or select a file with mutation data for upload.
                    <br />
                </p>
                <p>
                    Mutation files should be tab delimited, and should at least
                    have the genomic location headers in the first line for a
                    successful annotation. Note that all variants have to be
                    reported for genome build GRCh37 (hg19).
                </p>
                <ul>
                    <li>Chromosome</li>
                    <li>Start_Position</li>
                    <li>End_Position</li>
                    <li>Reference_Allele</li>
                    <li>Variant_Allele</li>
                </ul>
                <p>
                    If your mutation input doesn't contain the genomic location
                    headers, but you still want to visualize your data, your
                    input should at least have the following headers:
                </p>
                <ul>
                    <li>Hugo_Symbol</li>
                    <li>Protein_Change</li>
                </ul>
            </div>
        );
    }
    protected inputFormatDesc() {
        // TODO add & support more columns
        return (
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Column Header</th>
                        <th>Description</th>
                        <th>Example</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Hugo_Symbol</td>
                        <td>HUGO symbol for the gene</td>
                        <td>TP53</td>
                    </tr>
                    <tr>
                        <td>Protein_Change</td>
                        <td>Amino acid change</td>
                        <td>V600E</td>
                    </tr>
                    <tr>
                        <td>Sample_ID</td>
                        <td>Tumor sample ID</td>
                        <td>TCGA-B5-A11E</td>
                    </tr>
                    <tr>
                        <td>Mutation_Type</td>
                        <td>Translational effect of variant allele</td>
                        <td>Missense_Mutation, Nonsense_Mutation, etc.</td>
                    </tr>
                    <tr>
                        <td>Chromosome</td>
                        <td>Chromosome number</td>
                        <td>X, Y, M, 1, 2, etc.</td>
                    </tr>
                    <tr>
                        <td>Start_Position</td>
                        <td>
                            Lowest numeric position of the reported variant on
                            the genomic reference sequence
                        </td>
                        <td>666</td>
                    </tr>
                    <tr>
                        <td>End_Position</td>
                        <td>
                            Highest numeric position of the reported variant on
                            the genomic reference sequence
                        </td>
                        <td>667</td>
                    </tr>
                    <tr>
                        <td>Reference_Allele</td>
                        <td>
                            The plus strand reference allele at this position
                        </td>
                        <td>A</td>
                    </tr>
                    <tr>
                        <td>Variant_Allele</td>
                        <td>Tumor sequencing (discovery) allele</td>
                        <td>C</td>
                    </tr>
                    <tr>
                        <td>Validation_Status</td>
                        <td>Second pass results from orthogonal technology</td>
                        <td>Valid</td>
                    </tr>
                    <tr>
                        <td>Mutation_Status</td>
                        <td>Mutation status</td>
                        <td>Somatic, Germline, etc.</td>
                    </tr>
                    <tr>
                        <td>Center</td>
                        <td>Center/Institute reporting the variant</td>
                        <td>mskcc.org</td>
                    </tr>
                </tbody>
            </table>
        );
    }

    @computed get referenceGenomeSelector() {
        // show reference genome selector if "show_mutation_mapper_tool_grch38" is true
        if (getServerConfig().show_mutation_mapper_tool_grch38) {
            return (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <strong style={{ paddingRight: '5px' }}>
                        Select Reference Genome:{' '}
                    </strong>
                    <ButtonGroup>
                        <Radio
                            checked={
                                this.referenceGenomeSelection ===
                                REFERENCE_GENOME.grch37.NCBI
                            }
                            onChange={() => {
                                this.handleReferenceGenomeSelectionChange(
                                    REFERENCE_GENOME.grch37.NCBI
                                );
                            }}
                            inline
                            data-value={REFERENCE_GENOME.grch37.NCBI}
                            data-test="MutationMapperToolGRCh37Button"
                        >
                            {REFERENCE_GENOME.grch37.NCBI}
                        </Radio>
                        <Radio
                            checked={
                                this.referenceGenomeSelection ===
                                REFERENCE_GENOME.grch38.NCBI
                            }
                            onChange={() => {
                                this.handleReferenceGenomeSelectionChange(
                                    REFERENCE_GENOME.grch38.NCBI
                                );
                            }}
                            inline
                            data-value={REFERENCE_GENOME.grch38.NCBI}
                            data-test="MutationMapperToolGRCh38Button"
                        >
                            {REFERENCE_GENOME.grch38.NCBI}{' '}
                            <strong className={'beta-text'}>Beta!</strong>
                        </Radio>
                    </ButtonGroup>
                </div>
            );
        } else {
            return (
                <div>
                    The annotations are based on genome build GRCh37 (hg19).
                </div>
            );
        }
    }

    protected generateTabs(genes: string[]) {
        const tabs: JSX.Element[] = [];

        genes.forEach((gene: string) => {
            const mutationMapperStore = this.store.getMutationMapperStore(gene);

            if (mutationMapperStore) {
                tabs.push(
                    <MSKTab key={gene} id={gene} linkText={gene}>
                        <StandaloneMutationMapper
                            {...convertToMutationMapperProps({
                                ...getServerConfig(),
                                //override ensemblLink
                                ensembl_transcript_url: this.ensemblLink,
                            })}
                            oncoKbPublicApiUrl={getOncoKbApiUrl()}
                            mergeOncoKbIcons={
                                this.userSelectionStore.mergeOncoKbIcons
                            }
                            onOncoKbIconToggle={this.handleOncoKbIconToggle}
                            store={mutationMapperStore}
                            trackVisibility={
                                this.userSelectionStore.trackVisibility
                            }
                            downloadDataFetcher={this.store.downloadDataFetcher}
                            genomeNexusCache={this.store.genomeNexusCache}
                            genomeNexusMutationAssessorCache={
                                this.store.genomeNexusMutationAssessorCache
                            }
                            pubMedCache={this.store.pubMedCache}
                            pdbHeaderCache={this.store.pdbHeaderCache}
                            showTranscriptDropDown={true}
                            showOnlyAnnotatedTranscriptsInDropdown={
                                !this.store.hasInputWithProteinChanges
                            }
                            generateGenomeNexusHgvsgUrl={
                                this.store.generateGenomeNexusHgvsgUrl
                            }
                            mutationAlignerUrlTemplate={getMutationAlignerUrlTemplate()}
                        />
                    </MSKTab>
                );
            }
        });

        return tabs;
    }

    @action.bound
    protected handleFileSelect(e: any) {
        const reader = new FileReader();
        reader.addEventListener('loadend', this.fileLoadEndHandler);

        if (e.target.files && e.target.files[0]) {
            // this will fire a "loadend" event
            reader.readAsText(e.target.files[0]);
        } else {
            // reset input file content if no file is selected
            this.inputFileContent = '';
        }
    }

    @action.bound
    protected fileLoadEndHandler(e: any) {
        if (e.srcElement && e.srcElement.result) {
            // update input file content
            this.inputFileContent = e.srcElement.result;

            // reset input text to avoid confusion
            this.inputText = '';
        }
    }

    @action.bound
    protected handleInputChange(e: any) {
        this.inputText = e.target.value;
    }

    @action.bound
    protected handleTabChange(id: string | undefined) {
        // update the hash if routing exits
        if (this.props.routing) {
            this.props.routing.updateRoute({
                standaloneMutationMapperGeneTab: id,
            });
        }
        // update the observable if no routing
        else {
            this.standaloneMutationMapperGeneTab = id;
        }
    }

    @action.bound
    protected handleModifyInput() {
        // clear previous critical errors
        this.store.clearCriticalErrors();

        // show input controls
        this.inputControlsVisible = true;
    }

    @action.bound
    protected handleVisualize() {
        // clear previous critical errors
        this.store.clearCriticalErrors();

        this.store.mutationData = parseInput(this.inputContent);

        // save to keep input content after user makes changes
        this.lastParsedInputContent = this.inputContent;

        // hide input controls
        this.inputControlsVisible = false;
    }

    @action.bound
    protected handleDataFormatToggle() {
        this.dataFormatCollapsed = !this.dataFormatCollapsed;
    }

    @action.bound
    protected handleLoadExamplePartiallyAnnotated() {
        if (this.referenceGenomeSelection === REFERENCE_GENOME.grch37.NCBI) {
            this.inputText = require('raw-loader!./resources/standaloneMutationDataExampleGrch37.txt');
        } else {
            this.inputText = require('raw-loader!./resources/standaloneMutationDataExampleGrch38.txt');
        }
    }

    @action.bound
    protected handleLoadExampleGenomicCoordinates() {
        if (this.referenceGenomeSelection === REFERENCE_GENOME.grch37.NCBI) {
            this.inputText = require('raw-loader!./resources/standaloneMutationDataExampleWithGenomicCoordinatesOnlyGrch37.txt');
        } else {
            this.inputText = require('raw-loader!./resources/standaloneMutationDataExampleWithGenomicCoordinatesOnlyGrch38.txt');
        }
    }

    @action.bound
    protected handleLoadExampleGeneAndProteinChange() {
        this.inputText = require('raw-loader!./resources/standaloneMutationDataExampleWithGeneAndProteinChangeOnly.txt');
    }

    @action.bound
    protected handleReferenceGenomeSelectionChange(selection: string) {
        // store the reference genome selection to localStorage
        getBrowserWindow().localStorage.setItem('referenceGenomeId', selection);
        // reload the page to initialize genome nexus api instance with correct url
        getBrowserWindow().location.reload();
    }

    @action.bound
    protected handleOncoKbIconToggle(mergeIcons: boolean) {
        this.userSelectionStore.mergeOncoKbIcons = mergeIcons;
        saveOncoKbIconStyleToLocalStorage({ mergeIcons });
    }

    @computed get grch38Warning() {
        return (
            <div className="alert alert-info" role="alert">
                <i
                    className={'banner-icon fa fa-md fa-exclamation-triangle'}
                    style={{
                        verticalAlign: 'middle !important',
                        marginRight: 6,
                        marginBottom: 1,
                    }}
                />
                Genome build GRCh38 is currently in beta. Several annotation
                sources displayed on the page might not have official GRCh38
                support i.e.&nbsp;
                <a href={ONCOKB_URL}>OncoKB™</a>,&nbsp;
                <a href={CIVIC_URL}>CIViC</a>,&nbsp;
                <a href={CANCER_HOTSPOTS_URL}>Cancer Hotspots</a>,&nbsp;
                <a href={getServerConfig().g2s_url!}>3D structures</a>. Although
                most of the time the canonical transcript for a gene will be the
                same between GRCh37 and GRCh38 be sure to look at the results
                from these annotation sources carefully.
            </div>
        );
    }

    @computed get isGrch38() {
        return this.referenceGenomeSelection === REFERENCE_GENOME.grch38.NCBI;
    }

    @computed get ensemblLink() {
        return this.isGrch38
            ? getServerConfig().ensembl_transcript_grch38_url
            : getServerConfig().ensembl_transcript_url;
    }

    @computed get shouldShowGrch38Warning() {
        return (
            this.isGrch38 &&
            !this.inputControlsVisible &&
            this.store.mutations.isComplete
        );
    }
}
