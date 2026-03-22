import * as React from 'react';
import { observer } from 'mobx-react';
import {
    computed,
    action,
    makeObservable,
    observable,
    runInAction,
} from 'mobx';
import {
    IMutationalSignature,
    IMutationalCounts,
} from 'shared/model/MutationalSignature';
import ClinicalInformationMutationalSignatureTable, {
    IMutationalSignatureRow,
} from '../clinicalInformation/ClinicalInformationMutationalSignatureTable';
import Select from 'react-select';
import autobind from 'autobind-decorator';
import FeatureInstruction from 'shared/FeatureInstruction/FeatureInstruction';

import { MolecularProfile } from 'cbioportal-ts-api-client';
import {
    getVersionOption,
    getVersionOptions,
    getSampleOptions,
    getSampleOption,
} from 'shared/lib/GenericAssayUtils/MutationalSignaturesUtils';
import _ from 'lodash';
import { ButtonGroup } from 'react-bootstrap';

import MutationalBarChart from 'pages/patientView/mutationalSignatures/MutationalSignatureBarChart';
import {
    formatMutationalSignatureLabel,
    getPercentageOfMutationalCount,
    prepareMutationalSignatureDataForTable,
} from './MutationalSignatureBarChartUtils';
import {
    DefaultTooltip,
    DownloadControlOption,
    DownloadControls,
    EditableSpan,
    getBrowserWindow,
} from 'cbioportal-frontend-commons';
import classNames from 'classnames';
import { MutationalSignatureTableDataStore } from 'pages/patientView/mutationalSignatures/MutationalSignaturesDataStore';
import WindowStore from 'shared/components/window/WindowStore';
import { getServerConfig } from 'config/config';
import Slider from 'react-rangeslider';
import { numberOfLeadingDecimalZeros } from 'cbioportal-utils';
import classnames from 'classnames';
import { useLocalObservable } from 'mobx-react-lite';

export interface IMutationalSignaturesContainerProps {
    data: { [version: string]: IMutationalSignature[] };
    profiles: MolecularProfile[];
    version: string;
    sample: string;
    samples: string[];
    samplesNotProfiled: string[];
    onVersionChange: (version: string) => void;
    onSampleChange: (sample: string) => void;
    dataCount: { [version: string]: IMutationalCounts[] };
}

const CONTENT_TO_SHOW_ABOVE_TABLE =
    'Click on a mutational signature to update reference plot';

interface IAxisScaleSwitchProps {
    onChange: (selectedScale: AxisScale) => void;
    selectedScale: AxisScale;
}

const WrappedSlider: React.FunctionComponent<any> = observer(function({
    yMaxSliderStep,
    yMaxSliderMax,
    onYAxisMaxSliderChange,
    onChange,
    yMaxSlider,
    value,
}) {
    const store = useLocalObservable(() => ({
        value: 100,
        external: value,
    }));

    if (value !== store.external) {
        runInAction(() => {
            store.value = value;
            store.external = value;
        });
    }

    return (
        <Slider
            min={yMaxSliderStep}
            max={yMaxSliderMax}
            tooltip={false}
            step={yMaxSliderStep}
            onChange={(value: number) => {
                store.value = value;
            }}
            onChangeComplete={() => {
                onChange(store.value);
            }}
            value={store.value}
        />
    );
});

export enum AxisScale {
    PERCENT = '%',
    COUNT = '#',
}

function formatInputValue(value: number, step: number = 1) {
    const decimalZeros = numberOfLeadingDecimalZeros(step);
    const fixed = decimalZeros < 0 ? 0 : decimalZeros + 1;

    return value.toFixed(fixed);
}

@observer
export default class MutationalSignaturesContainer extends React.Component<
    IMutationalSignaturesContainerProps,
    {}
> {
    public mutationalSignatureTableStore: MutationalSignatureTableDataStore;
    @observable signatureProfile: string = this.props.data[
        this.props.version
    ][0].meta.name;
    @observable signatureToPlot: string = this.props.data[this.props.version][0]
        .meta.name;
    private plotSvg: SVGElement | null = null;
    @observable signatureURL: string = this.props.data[this.props.version][0]
        .meta.url;
    @observable signatureDescription: string = this.props.data[
        this.props.version
    ][0].meta.description;
    @observable isSignatureInformationToolTipVisible: boolean = false;
    @observable updateReferencePlot: boolean = false;
    public static defaultProps: Partial<IAxisScaleSwitchProps> = {
        selectedScale: AxisScale.COUNT,
    };

    @observable
    selectedScale: string = AxisScale.PERCENT;

    constructor(props: IMutationalSignaturesContainerProps) {
        super(props);
        makeObservable(this);
        getBrowserWindow().moo = this;

        this.mutationalSignatureTableStore = new MutationalSignatureTableDataStore(
            () => {
                return this.mutationalSignatureDataForTable;
            }
        );
    }

    @observable _selectedData: IMutationalCounts[] = this.props.dataCount[
        this.props.version
    ];
    @computed get availableVersions() {
        // mutational signatures version is stored in the profile id
        // split the id by "_", the last part is the version info
        // we know split will always have results
        // use uniq function to get all unique versions
        return _.chain(this.props.profiles)
            .map(profile => _.last(profile.molecularProfileId.split('_'))!)
            .filter(item => item in this.props.data)
            .uniq()
            .value();
    }

    @computed get selectedVersion(): string {
        // all versions is defined in the MutationalSignaturesVersion
        return (
            _.find(
                this.availableVersions,
                version => version === this.props.version
            ) || this.availableVersions[0]
        );
    }

    public toggleButton(scale: AxisScale, onClick: () => void) {
        return (
            <DefaultTooltip
                overlay={
                    scale === AxisScale.PERCENT
                        ? 'Y-axis by percent'
                        : 'Y-axis by absolute count'
                }
            >
                <button
                    className={classNames(
                        {
                            'btn-secondary': this.selectedScale === scale,
                            'btn-default': this.selectedScale != scale,
                        },
                        'btn',
                        'btn-axis-switch'
                    )}
                    data-test={`AxisScaleSwitch${scale}`}
                    style={{
                        lineHeight: 1,
                        cursor:
                            this.selectedScale === scale
                                ? 'default'
                                : 'pointer',
                        fontWeight:
                            this.selectedScale === scale ? 'bolder' : 'normal',
                        color:
                            this.selectedScale === scale ? '#fff' : '#6c757d',
                        backgroundColor:
                            this.selectedScale === scale ? '#6c757d' : '#fff',
                    }}
                    onClick={onClick}
                >
                    {scale}
                </button>
            </DefaultTooltip>
        );
    }

    @observable currentVersion: string = this.props.version;
    @observable yLabelString: string = this.updateYaxisLabel;
    @observable yAxisLabel: string = this.yLabelString;

    @action.bound
    private handlePercentClick() {
        this.resetSlider();
        this.selectedScale = AxisScale.PERCENT;
        this.yAxisLabel = this.updateYaxisLabel;
    }

    resetSlider() {
        this.yMaxSliderValue = 100;
    }

    @computed get updateYaxisLabel() {
        const unitAxis = this.selectedScale == '%' ? ' (%)' : ' (#)';
        const yLabel =
            this.currentVersion == 'SBS'
                ? 'Single Base Substitution'
                : this.currentVersion == 'DBS'
                ? 'Double Base Substitutions'
                : 'Indels';
        return yLabel + unitAxis;
    }

    @action.bound
    private handleCountClick() {
        this.resetSlider();
        this.selectedScale = AxisScale.COUNT;
        this.yAxisLabel = this.updateYaxisLabel;
    }

    @computed get getDataForGraph(): IMutationalCounts[] {
        if (this.selectedScale == AxisScale.PERCENT) {
            return getPercentageOfMutationalCount(
                this.mutationalSignatureCountDataGroupedByVersionForSample
            );
        } else {
            return this.mutationalSignatureCountDataGroupedByVersionForSample;
        }
    }

    @observable
    _mutationalSignatureCountDataGroupedByVersionForSample: IMutationalCounts[];
    @computed
    get mutationalSignatureCountDataGroupedByVersionForSample(): IMutationalCounts[] {
        const sumValue = _.sum(
            this.props.dataCount[this.props.version].map(item => item.value)
        );

        return (
            this._mutationalSignatureCountDataGroupedByVersionForSample ||
            this.props.dataCount[this.props.version]
                .map((obj, index) => {
                    obj[
                        'mutationalSignatureLabel'
                    ] = formatMutationalSignatureLabel(
                        obj.mutationalSignatureLabel,
                        this.props.version
                    );
                    obj['percentage'] =
                        sumValue == 0
                            ? 0
                            : Math.round((obj.value / sumValue!) * 100);
                    return obj;
                })
                .filter(subItem => subItem.sampleId === this.sampleIdToFilter)
        );
    }

    @action.bound
    private onVersionChange(option: { label: string; value: string }): void {
        this.props.onVersionChange(option.value);
        this.signatureProfile = this.props.data[option.value][0].meta.name;
        this.signatureToPlot = this.props.data[option.value][0].meta.name;
        this.updateReferencePlot = false;
        this.isSignatureInformationToolTipVisible = false;
        this.currentVersion = option.value;
        this.yAxisLabel = this.updateYaxisLabel;
        this.resetSlider();
    }

    @autobind
    private onSampleChange(sample: { label: string; value: string }): void {
        this.getTotalMutationalCount;
        this.props.onSampleChange(sample.value);
    }

    @autobind
    private assignPlotSvgRef(el: SVGElement | null) {
        this.plotSvg = el;
    }

    @autobind
    private getSvg() {
        return this.plotSvg;
    }

    @autobind
    onMutationalSignatureTableRowClick(d: IMutationalSignatureRow) {
        this.signatureProfile = d.name;
        this.signatureURL = d.url;
        this.signatureDescription = d.description;
        this.signatureProfile = d.name;
        this.signatureToPlot = d.name;
        this.updateReferencePlot = true;
        this.mutationalSignatureTableStore.setSelectedMutSig(d);
        if (this.mutationalSignatureTableStore.selectedMutSig.length > 0) {
            this.mutationalSignatureTableStore.setclickedMutSig(d);
            this.mutationalSignatureTableStore.toggleSelectedMutSig(
                this.mutationalSignatureTableStore.selectedMutSig[0]
            );
        }
    }

    @autobind
    onMutationalSignatureTableMouseOver(d: IMutationalSignatureRow) {
        this.signatureProfile = d.name;
        this.signatureDescription = d.description;
        this.signatureURL = d.url;
        this.signatureProfile = d.name;
    }

    @computed get mutationalSignatureDataForTable() {
        return prepareMutationalSignatureDataForTable(
            this.props.data[this.props.version],
            this.props.samples
        );
    }

    @computed get sampleIdToFilter() {
        return this.props.samples.includes(this.props.sample)
            ? this.props.sample
            : undefined;
    }

    @computed get getTotalMutationalCount() {
        const countPerVersion = this.props.dataCount[this.props.version]
            .filter(subItem => subItem.sampleId === this.sampleIdToFilter)
            .map(item => {
                return item.value;
            });
        const mutTotalCount = countPerVersion.reduce((a, b) => a + b, 0);
        const versionLabel =
            this.props.version == 'SBS'
                ? 'Single Base Substitution (SBS)'
                : this.props.version == 'DBS'
                ? 'Double Base Substitution (DBS)'
                : this.props.version == 'ID'
                ? 'Small insertions and deletions (ID)'
                : this.props.version;
        return [versionLabel, mutTotalCount];
    }

    @action.bound
    updateYAxisDomain(obj: number) {
        this.yMaxSliderValue = obj;
    }

    @computed get yMaxSlider(): any {
        return (
            <div
                className={classnames('lollipop_mutation_plot__controls')}
                style={{ display: 'flex', alignItems: 'center' }}
            >
                Y-axis Max:&nbsp;
                <div style={{ width: 100 }}>
                    <WrappedSlider
                        min={1}
                        max={100}
                        tooltip={false}
                        step={1}
                        onChange={(val: number) => this.updateYAxisDomain(val)}
                        defaultValue={100}
                        value={this.yMaxSliderValue}
                    />
                </div>
            </div>
        );
    }

    @observable yMaxSliderValue = 100;

    public render() {
        return (
            <div data-test="MutationalSignaturesContainer">
                <div>
                    {this.props.samplesNotProfiled.length > 0 && (
                        <div className={'alert alert-info'}>
                            <span>
                                {this.props.samplesNotProfiled.length > 1
                                    ? this.props.samplesNotProfiled.join(',')
                                    : this.props.samplesNotProfiled}{' '}
                                {this.props.samplesNotProfiled.length > 1
                                    ? ' are'
                                    : ' is'}{' '}
                                not profiled for mutational signatures
                            </span>
                        </div>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ whiteSpace: 'nowrap' }}>
                                Mutational Signature Type:&nbsp;
                            </div>
                            <div style={{ width: 300 }}>
                                <Select
                                    className="basic-single"
                                    name={'mutationalSignaturesVersionSelector'}
                                    classNamePrefix={
                                        'mutationalSignaturesVersionSelector'
                                    }
                                    value={getVersionOption(this.props.version)}
                                    onChange={this.onVersionChange}
                                    options={getVersionOptions(
                                        this.availableVersions
                                    )}
                                    searchable={false}
                                    clearable={false}
                                />
                            </div>
                        </div>

                        {this.props.samples.length > 1 && (
                            <>
                                <div
                                    style={{
                                        whiteSpace: 'nowrap',
                                        marginLeft: 20,
                                    }}
                                >
                                    Sample:&nbsp;
                                </div>
                                <div
                                    style={{
                                        width: 200,
                                    }}
                                >
                                    <Select
                                        className="basic-single"
                                        name={
                                            'mutationalSignatureSampleSelector'
                                        }
                                        classNamePrefix={
                                            'mutationalSignatureSampleSelector'
                                        }
                                        value={getSampleOption(
                                            this.props.sample
                                        )}
                                        options={getSampleOptions(
                                            this.props.samples
                                        )}
                                        onChange={this.onSampleChange}
                                        searchable={false}
                                        clearable={false}
                                    />
                                </div>
                            </>
                        )}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginLeft: 20,
                            }}
                        >
                            {!_.isEmpty(this.props.dataCount) && (
                                <ButtonGroup
                                    className={'displayFlex'}
                                    style={{ marginRight: 20 }}
                                >
                                    {this.toggleButton(
                                        AxisScale.PERCENT,
                                        this.handlePercentClick
                                    )}
                                    {this.toggleButton(
                                        AxisScale.COUNT,
                                        this.handleCountClick
                                    )}
                                </ButtonGroup>
                            )}
                            {!_.isEmpty(this.props.dataCount) && (
                                <div>{this.yMaxSlider}</div>
                            )}
                        </div>
                    </div>
                </div>

                {this.props.data && (
                    <div style={{ marginTop: 10 }}>
                        {!_.isEmpty(this.props.dataCount) && (
                            <>
                                <p style={{ marginTop: 10 }}>
                                    <strong>Sample:</strong>&nbsp;
                                    {this.props.sample}&nbsp;|&nbsp;
                                    <strong>
                                        {this.getTotalMutationalCount[0]} count:
                                    </strong>
                                    &nbsp;
                                    {this.getTotalMutationalCount[1]}
                                    <DefaultTooltip
                                        placement="right"
                                        overlay={
                                            <span>
                                                Mutation count may include
                                                silent, noncoding and other
                                                types of mutations that may not
                                                be shown elsewhere in
                                                cBioPortal.
                                            </span>
                                        }
                                        destroyTooltipOnHide={true}
                                    >
                                        <i
                                            className="fa fa-md fa-info-circle"
                                            style={{
                                                verticalAlign:
                                                    'middle !important',
                                                marginRight: 6,
                                                marginBottom: 1,
                                                marginLeft: 5,
                                            }}
                                        />
                                    </DefaultTooltip>
                                </p>

                                <div className={'borderedChart'}>
                                    <div
                                        style={{
                                            zIndex: 10,
                                            position: 'absolute',
                                            right: 10,
                                            top: 10,
                                        }}
                                    >
                                        <DownloadControls
                                            filename="mutationalBarChart"
                                            getSvg={this.getSvg}
                                            buttons={['SVG', 'PNG', 'PDF']}
                                            type="button"
                                            dontFade
                                            showDownload={
                                                getServerConfig()
                                                    .skin_hide_download_controls ===
                                                DownloadControlOption.SHOW_ALL
                                            }
                                        />
                                    </div>
                                    <div style={{ overflow: 'auto' }}>
                                        <MutationalBarChart
                                            signature={this.signatureToPlot}
                                            height={230}
                                            width={WindowStore.size.width - 100}
                                            refStatus={false}
                                            svgId={'MutationalBarChart'}
                                            svgRef={this.assignPlotSvgRef}
                                            data={this.getDataForGraph}
                                            version={this.props.version}
                                            sample={this.props.sample}
                                            label={this.yAxisLabel}
                                            selectedScale={this.selectedScale}
                                            updateReference={
                                                this.updateReferencePlot
                                            }
                                            initialReference={
                                                this.props.data[
                                                    this.props.version
                                                ][0].meta.name
                                            }
                                            domainMaxPercentage={
                                                this.yMaxSliderValue
                                            }
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div style={{ marginTop: 20 }}>
                            <FeatureInstruction
                                content={CONTENT_TO_SHOW_ABOVE_TABLE}
                            >
                                <ClinicalInformationMutationalSignatureTable
                                    data={this.mutationalSignatureDataForTable}
                                    url={this.signatureURL}
                                    description={this.signatureDescription}
                                    signature={this.signatureProfile}
                                    samples={this.props.samples}
                                    onRowClick={
                                        this.onMutationalSignatureTableRowClick
                                    }
                                    onRowMouseEnter={
                                        this.onMutationalSignatureTableMouseOver
                                    }
                                    dataStore={
                                        this.mutationalSignatureTableStore
                                    }
                                />
                            </FeatureInstruction>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
