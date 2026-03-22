import * as React from 'react';
import styles from './styles.module.scss';
import { If } from 'react-if';
import {
    ChartType,
    NumericalGroupComparisonType,
} from 'pages/studyView/StudyViewUtils';
import classnames from 'classnames';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { ChartTypeEnum } from '../StudyViewConfig';
import { ChartMeta, getClinicalAttributeOverlay } from '../StudyViewUtils';
import {
    DataType,
    DefaultTooltip,
    DownloadControls,
    DownloadControlsButton,
} from 'cbioportal-frontend-commons';
import FlexAlignedCheckbox from '../../../shared/components/FlexAlignedCheckbox';
import CustomBinsModal from 'pages/studyView/charts/barChart/CustomBinsModal';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import { ISurvivalDescription } from 'pages/resultsView/survival/SurvivalDescriptionTable';
import ComparisonVsIcon from 'shared/components/ComparisonVsIcon';
import { getComparisonParamsForTable } from 'pages/studyView/StudyViewComparisonUtils';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';

export interface IChartHeaderProps {
    chartMeta: ChartMeta;
    chartType: ChartType;
    store: StudyViewPageStore;
    title: string;
    height: number;
    placement: 'left' | 'right';
    active: boolean;
    resetChart: () => void;
    deleteChart: () => void;
    selectedRowsKeys?: string[];
    toggleLogScale?: () => void;
    toggleLogScaleX?: () => void;
    toggleLogScaleY?: () => void;
    toggleBoxPlot?: () => void;
    toggleViolinPlot?: () => void;
    toggleNAValue?: () => void;
    isLeftTruncationAvailable?: boolean;
    toggleSurvivalPlotLeftTruncation?: () => void;
    swapAxes?: () => void;
    hideLabel?: boolean;
    chartControls?: ChartControls;
    changeChartType: (chartType: ChartType) => void;
    toggleRenderPieChartForDownload: () => void;
    getSVG?: () => Promise<SVGElement | null>;
    getData?:
        | ((dataType?: DataType) => Promise<string | null>)
        | ((dataType?: DataType) => string);
    downloadTypes?: DownloadControlsButton[];
    description?: ISurvivalDescription;
    openComparisonPage: (params: {
        categorizationType?: NumericalGroupComparisonType;
        hugoGeneSymbols?: string[];
        treatmentUniqueKeys?: string[];
    }) => void;
    isCompactSurvivalChart?: boolean;
}

export interface ChartControls {
    showResetIcon?: boolean;
    showTableIcon?: boolean;
    showPieIcon?: boolean;
    showComparisonPageIcon?: boolean;
    showLogScaleToggle?: boolean;
    logScaleChecked?: boolean;
    showLogScaleXToggle?: boolean;
    logScaleXChecked?: boolean;
    showLogScaleYToggle?: boolean;
    logScaleYChecked?: boolean;
    showBoxPlotToggle?: boolean;
    boxPlotChecked?: boolean;
    showViolinPlotToggle?: boolean;
    violinPlotChecked?: boolean;
    isShowNAChecked?: boolean;
    showNAToggle?: boolean;
    showSwapAxes?: boolean;
    showSurvivalPlotLeftTruncationToggle?: boolean;
    survivalPlotLeftTruncationChecked?: boolean;
}

@observer
export class ChartHeader extends React.Component<IChartHeaderProps, {}> {
    @observable menuOpen = false;
    @observable downloadSubmenuOpen = false;
    @observable comparisonSubmenuOpen = false;
    @observable showCustomBinModal: boolean = false;
    private closeMenuTimeout: number | undefined = undefined;

    constructor(props: IChartHeaderProps) {
        super(props);
        makeObservable(this);
    }

    @computed
    get fileName() {
        return this.props.chartMeta.displayName.replace(/[ \t]/g, '_');
    }

    @action.bound
    private openMenu() {
        this.menuOpen = true;
        window.clearTimeout(this.closeMenuTimeout);
        this.closeMenuTimeout = undefined;
    }

    @action.bound
    private closeMenu() {
        if (!this.closeMenuTimeout) {
            this.closeMenuTimeout = window.setTimeout(() => {
                this.menuOpen = false;
                this.closeMenuTimeout = undefined;
            }, 125);
        }
    }

    @computed get active() {
        return this.menuOpen || this.props.active;
    }

    @computed get comparisonButton() {
        const submenuWidth = 120;
        switch (this.props.chartType) {
            case ChartTypeEnum.BAR_CHART:
                return (
                    <div
                        className={classnames(
                            'dropdown-item',
                            styles.dropdownHoverEffect
                        )}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '3px 20px',
                        }}
                        onMouseEnter={() => (this.comparisonSubmenuOpen = true)}
                        onMouseLeave={() =>
                            (this.comparisonSubmenuOpen = false)
                        }
                    >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <ComparisonVsIcon
                                className={classnames(
                                    'fa fa-fw',
                                    styles.menuItemIcon
                                )}
                            />
                            <span>Compare Groups</span>
                        </div>
                        <i
                            className={'fa fa-xs fa-fw fa-caret-right'}
                            style={{ lineHeight: 'inherit' }}
                        />

                        {this.comparisonSubmenuOpen && (
                            <ul
                                className={classnames('dropdown-menu', {
                                    show: this.comparisonSubmenuOpen,
                                })}
                                style={{
                                    top: 0,
                                    margin: '-6px 0',
                                    left:
                                        this.props.placement === 'left'
                                            ? -submenuWidth
                                            : '100%',
                                    minWidth: submenuWidth,
                                }}
                            >
                                <li>
                                    <a
                                        className="dropdown-item"
                                        onClick={() => {
                                            this.props.openComparisonPage({
                                                categorizationType:
                                                    NumericalGroupComparisonType.QUARTILES,
                                            });
                                        }}
                                    >
                                        Quartiles
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="dropdown-item"
                                        onClick={() => {
                                            this.props.openComparisonPage({
                                                categorizationType:
                                                    NumericalGroupComparisonType.MEDIAN,
                                            });
                                        }}
                                    >
                                        Median
                                    </a>
                                </li>
                                <li>
                                    <a
                                        className="dropdown-item"
                                        onClick={() =>
                                            this.props.openComparisonPage({
                                                categorizationType:
                                                    NumericalGroupComparisonType.BINS,
                                            })
                                        }
                                    >
                                        Current bins
                                    </a>
                                </li>
                            </ul>
                        )}
                    </div>
                );
            case ChartTypeEnum.MUTATED_GENES_TABLE:
            case ChartTypeEnum.VARIANT_ANNOTATIONS_TABLE:
            case ChartTypeEnum.CNA_GENES_TABLE:
            case ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE:
            case ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE:
            case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE:
            case ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE:
            case ChartTypeEnum.PATIENT_TREATMENTS_TABLE:
                return (
                    <a
                        className={classnames('dropdown-item', {
                            [styles.disabledMenuItem]:
                                this.props.selectedRowsKeys!.length < 2,
                        })}
                        onClick={() => {
                            if (this.props.selectedRowsKeys!.length >= 2) {
                                this.props.openComparisonPage(
                                    getComparisonParamsForTable(
                                        this.props.selectedRowsKeys!,
                                        this.props.chartType
                                    )
                                );
                            }
                        }}
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <ComparisonVsIcon
                            className={classnames(
                                'fa fa-fw',
                                styles.menuItemIcon
                            )}
                        />
                        Compare Groups
                    </a>
                );
            default:
                return (
                    <a
                        className="dropdown-item"
                        onClick={() => this.props.openComparisonPage({})}
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <ComparisonVsIcon
                            className={classnames(
                                'fa fa-fw',
                                styles.menuItemIcon
                            )}
                        />
                        Compare Groups
                    </a>
                );
        }
    }

    @computed get showDownload() {
        return (
            this.props.chartControls &&
            this.props.downloadTypes &&
            this.props.downloadTypes.length > 0 &&
            getServerConfig().skin_hide_download_controls !==
                DownloadControlOption.HIDE_ALL
        );
    }

    @computed get menuItems() {
        const items = [];
        if (
            this.props.chartControls &&
            this.props.chartControls.showLogScaleToggle &&
            this.props.toggleLogScale
        ) {
            items.push(
                <li>
                    <a
                        className="dropdown-item logScaleCheckbox"
                        onClick={this.props.toggleLogScale}
                    >
                        <FlexAlignedCheckbox
                            checked={
                                !!(
                                    this.props.chartControls &&
                                    this.props.chartControls.logScaleChecked
                                )
                            }
                            label={
                                <span style={{ marginTop: -3 }}>Log Scale</span>
                            }
                            style={{ marginTop: 1, marginBottom: -3 }}
                        />
                    </a>
                </li>
            );
        }
        if (
            this.props.chartControls &&
            this.props.chartControls.showSwapAxes &&
            this.props.swapAxes
        ) {
            items.push(
                <li>
                    <a
                        className="dropdown-item"
                        data-test={'swapAxes'}
                        onClick={this.props.swapAxes}
                    >
                        <i className={'fa fa-arrow-up'} />
                        {` Swap Axes `}
                        <i className={'fa fa-arrow-down'} />
                    </a>
                </li>
            );
        }
        if (
            this.props.chartControls &&
            this.props.chartControls.showLogScaleXToggle &&
            this.props.toggleLogScaleX
        ) {
            items.push(
                <li>
                    <a
                        className="dropdown-item logScaleCheckbox"
                        onClick={this.props.toggleLogScaleX}
                    >
                        <FlexAlignedCheckbox
                            checked={
                                !!(
                                    this.props.chartControls &&
                                    this.props.chartControls.logScaleXChecked
                                )
                            }
                            label={
                                <span style={{ marginTop: -3 }}>
                                    Log Scale X
                                </span>
                            }
                            style={{ marginTop: 1, marginBottom: -3 }}
                        />
                    </a>
                </li>
            );
        }
        if (
            this.props.chartControls &&
            this.props.chartControls.showLogScaleYToggle &&
            this.props.toggleLogScaleY
        ) {
            items.push(
                <li>
                    <a
                        className="dropdown-item logScaleCheckbox"
                        onClick={this.props.toggleLogScaleY}
                    >
                        <FlexAlignedCheckbox
                            checked={
                                !!(
                                    this.props.chartControls &&
                                    this.props.chartControls.logScaleYChecked
                                )
                            }
                            label={
                                <span style={{ marginTop: -3 }}>
                                    Log Scale Y
                                </span>
                            }
                            style={{ marginTop: 1, marginBottom: -3 }}
                        />
                    </a>
                </li>
            );
        }
        if (
            this.props.chartControls &&
            this.props.chartControls.showViolinPlotToggle &&
            this.props.toggleViolinPlot
        ) {
            items.push(
                <li>
                    <a
                        className="dropdown-item violinCheckbox"
                        onClick={this.props.toggleViolinPlot}
                    >
                        <FlexAlignedCheckbox
                            checked={
                                !!(
                                    this.props.chartControls &&
                                    this.props.chartControls.violinPlotChecked
                                )
                            }
                            label={
                                <span style={{ marginTop: -3 }}>
                                    Show Violin Plot
                                </span>
                            }
                            style={{ marginTop: 1, marginBottom: -3 }}
                        />
                    </a>
                </li>
            );
        }

        if (
            this.props.chartControls &&
            this.props.chartControls.showBoxPlotToggle &&
            this.props.toggleBoxPlot
        ) {
            items.push(
                <li>
                    <a
                        className="dropdown-item violinCheckbox"
                        onClick={this.props.toggleBoxPlot}
                    >
                        <FlexAlignedCheckbox
                            checked={
                                !!(
                                    this.props.chartControls &&
                                    this.props.chartControls.boxPlotChecked
                                )
                            }
                            label={
                                <span style={{ marginTop: -3 }}>
                                    Show Box Plot
                                </span>
                            }
                            style={{ marginTop: 1, marginBottom: -3 }}
                        />
                    </a>
                </li>
            );
        }

        if (
            this.props.chartControls &&
            !!this.props.chartControls.showTableIcon
        ) {
            items.push(
                <li>
                    <a
                        className="dropdown-item"
                        onClick={() =>
                            this.props.changeChartType(ChartTypeEnum.TABLE)
                        }
                    >
                        <i
                            className={classnames(
                                'fa fa-xs fa-fw',
                                'fa-table',
                                styles.menuItemIcon
                            )}
                            aria-hidden="true"
                        />
                        Show Table
                    </a>
                </li>
            );
        }

        if (
            this.props.chartControls &&
            !!this.props.chartControls.showPieIcon
        ) {
            items.push(
                <li>
                    <a
                        className="dropdown-item"
                        onClick={() =>
                            this.props.changeChartType(ChartTypeEnum.PIE_CHART)
                        }
                    >
                        <i
                            className={classnames(
                                'fa fa-xs fa-fw',
                                'fa-pie-chart',
                                styles.menuItemIcon
                            )}
                            aria-hidden="true"
                        />
                        Show Pie
                    </a>
                </li>
            );
        }

        if (
            this.props.chartControls &&
            this.props.chartControls.showComparisonPageIcon
        ) {
            items.push(
                <li style={{ position: 'relative' }}>
                    {this.comparisonButton}
                </li>
            );
        }

        if (
            this.props.chartControls &&
            this.props.chartControls.showSurvivalPlotLeftTruncationToggle &&
            this.props.toggleSurvivalPlotLeftTruncation
        ) {
            items.push(
                <li>
                    <a
                        className="dropdown-item"
                        onClick={this.props.toggleSurvivalPlotLeftTruncation}
                    >
                        <FlexAlignedCheckbox
                            checked={
                                !!(
                                    this.props.chartControls &&
                                    this.props.chartControls
                                        .survivalPlotLeftTruncationChecked
                                )
                            }
                            label={
                                <span
                                    style={{ marginTop: -3, paddingRight: 10 }}
                                >
                                    Left truncation
                                </span>
                            }
                            style={{ marginTop: 1, marginBottom: -3 }}
                        />
                    </a>
                </li>
            );
        }

        if (this.props.chartType === ChartTypeEnum.BAR_CHART) {
            items.push(
                <li>
                    <a
                        className="dropdown-item"
                        onClick={() => (this.showCustomBinModal = true)}
                    >
                        <i
                            className={classnames(
                                'fa fa-xs fa-fw',
                                'fa-bar-chart',
                                styles.menuItemIcon
                            )}
                            aria-hidden="true"
                        />
                        Custom Bins
                    </a>
                    <CustomBinsModal
                        show={this.showCustomBinModal}
                        onHide={() => (this.showCustomBinModal = false)}
                        chartMeta={this.props.chartMeta}
                        currentBins={this.props.store.getCurrentBins(
                            this.props.chartMeta
                        )}
                        updateCustomBins={this.props.store.updateCustomBins}
                        onChangeBinMethod={this.props.store.updateBinMethod}
                        onChangeBinsGeneratorConfig={
                            this.props.store.updateGenerateBinsConfig
                        }
                        store={this.props.store}
                    />
                </li>
            );
            if (
                this.props.chartControls &&
                this.props.chartControls.showNAToggle &&
                this.props.toggleNAValue
            ) {
                items.push(
                    <li>
                        <a
                            className="dropdown-item"
                            onClick={this.props.toggleNAValue}
                        >
                            <FlexAlignedCheckbox
                                checked={
                                    !!(
                                        this.props.chartControls &&
                                        this.props.chartControls.isShowNAChecked
                                    )
                                }
                                label={
                                    <span style={{ marginTop: -3 }}>
                                        Show NA
                                    </span>
                                }
                                style={{ marginTop: 1, marginBottom: -3 }}
                            />
                        </a>
                    </li>
                );
            }
        }

        if (this.showDownload) {
            const downloadSubmenuWidth = 70;
            items.push(
                <li style={{ position: 'relative' }}>
                    <div
                        className={classnames(
                            'dropdown-item',
                            styles.dropdownHoverEffect
                        )}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '3px 20px',
                        }}
                        onMouseEnter={() => (this.downloadSubmenuOpen = true)}
                        onMouseLeave={() => (this.downloadSubmenuOpen = false)}
                    >
                        <div>
                            <i
                                className={classnames(
                                    'fa fa-xs',
                                    'fa-download',
                                    styles.menuItemIcon
                                )}
                                aria-hidden="true"
                            />
                            <span>Download</span>
                        </div>
                        <i
                            className={'fa fa-xs fa-fw fa-caret-right'}
                            style={{ lineHeight: 'inherit' }}
                        />

                        {this.downloadSubmenuOpen && (
                            <DownloadControls
                                filename={this.fileName}
                                buttons={this.props.downloadTypes}
                                getSvg={this.props.getSVG}
                                getData={this.props.getData}
                                type="dropdown"
                                className={classnames({
                                    show: this.downloadSubmenuOpen,
                                })}
                                style={{
                                    top: 0,
                                    margin: '-6px 0',
                                    left:
                                        this.props.placement === 'left'
                                            ? -downloadSubmenuWidth
                                            : '100%',
                                    minWidth: downloadSubmenuWidth,
                                }}
                                dontFade={true}
                                showDownload={
                                    getServerConfig()
                                        .skin_hide_download_controls ===
                                    DownloadControlOption.SHOW_ALL
                                }
                                toggleRenderSvgForDownload={
                                    this.props.toggleRenderPieChartForDownload
                                }
                            />
                        )}
                    </div>
                </li>
            );
        }
        return items;
    }

    // there's some incompatiblity with rc-tooltip and study view layout
    // these adjustments force tooltips to open on different directions because tooltips
    // were breaking at far right of page
    @computed
    get tooltipPosition() {
        return this.props.placement == 'left' ? 'topRight' : 'top';
    }

    @computed
    get tooltipAlign() {
        return this.props.placement == 'left' ? { offset: [0, -6] } : undefined;
    }

    public render() {
        return (
            <div
                className={classnames(styles.header, 'chartHeader')}
                style={{
                    position: 'relative',
                    height: `${this.props.height}px`,
                    lineHeight: `${this.props.height}px`,
                }}
            >
                <div className={classnames(styles.name, styles.draggable)}>
                    {!this.props.hideLabel && (
                        <span className="chartTitle">{this.props.title}</span>
                    )}
                </div>
                {this.active && (
                    <div className={classnames(styles.controls, 'controls')}>
                        <div className="btn-group">
                            <If condition={!!this.props.description}>
                                <DefaultTooltip
                                    mouseEnterDelay={0}
                                    trigger={['hover']}
                                    placement={this.tooltipPosition}
                                    align={this.tooltipAlign}
                                    overlay={getClinicalAttributeOverlay(
                                        this.props.title,
                                        this.props.description
                                            ? this.props.description.description
                                            : '',
                                        this.props.chartMeta.uniqueKey,
                                        this.props.isCompactSurvivalChart
                                    )}
                                    destroyTooltipOnHide={true}
                                >
                                    <div
                                        className={classnames(
                                            'btn btn-xs btn-default',
                                            styles.item
                                        )}
                                    >
                                        <i
                                            className={classnames(
                                                'fa fa-xs fa-fw',
                                                'fa-info-circle'
                                            )}
                                            aria-hidden="true"
                                        />
                                    </div>
                                </DefaultTooltip>
                            </If>
                            <If
                                condition={
                                    !!!this.props.description &&
                                    (!!this.props.chartMeta.clinicalAttribute ||
                                        !!this.props.chartMeta.description)
                                }
                            >
                                <DefaultTooltip
                                    mouseEnterDelay={0}
                                    trigger={['hover']}
                                    placement={this.tooltipPosition}
                                    align={this.tooltipAlign}
                                    overlay={getClinicalAttributeOverlay(
                                        this.props.chartMeta.displayName,
                                        this.props.chartMeta.description,
                                        this.props.chartMeta.clinicalAttribute
                                            ? this.props.chartMeta
                                                  .clinicalAttribute
                                                  .clinicalAttributeId
                                            : undefined
                                    )}
                                    destroyTooltipOnHide={true}
                                >
                                    <div
                                        className={classnames(
                                            'btn btn-xs btn-default',
                                            styles.item
                                        )}
                                    >
                                        <i
                                            className={classnames(
                                                'fa fa-xs fa-fw',
                                                'fa-info-circle'
                                            )}
                                            aria-hidden="true"
                                        />
                                    </div>
                                </DefaultTooltip>
                            </If>
                            <If
                                condition={
                                    this.props.chartControls &&
                                    !!this.props.chartControls.showResetIcon
                                }
                            >
                                <DefaultTooltip
                                    placement={this.tooltipPosition}
                                    align={this.tooltipAlign}
                                    overlay={
                                        <span>Reset filters in chart</span>
                                    }
                                    destroyTooltipOnHide={true}
                                >
                                    <button
                                        className={classnames(
                                            'btn btn-xs btn-default',
                                            styles.item
                                        )}
                                        onClick={this.props.resetChart}
                                    >
                                        <i
                                            className={classnames(
                                                'fa fa-xs fa-fw',
                                                'fa-undo',
                                                styles.undo,
                                                styles.clickable
                                            )}
                                            aria-hidden="true"
                                        />
                                    </button>
                                </DefaultTooltip>
                            </If>
                            <DefaultTooltip
                                placement={this.tooltipPosition}
                                align={this.tooltipAlign}
                                overlay={<span>Delete chart</span>}
                            >
                                <button
                                    className={classnames(
                                        'btn btn-xs btn-default',
                                        styles.item
                                    )}
                                    data-test={'deleteChart'}
                                    onClick={this.props.deleteChart}
                                >
                                    <i
                                        className={classnames(
                                            'fa fa-xs fa-fw',
                                            'fa-times',
                                            styles.clickable
                                        )}
                                        aria-hidden="true"
                                    ></i>
                                </button>
                            </DefaultTooltip>
                            {this.menuItems.length > 0 && (
                                <div
                                    onMouseEnter={this.openMenu}
                                    onMouseLeave={this.closeMenu}
                                    data-test="chart-header-hamburger-icon"
                                    className={classnames(
                                        'dropdown btn-group',
                                        { show: this.menuOpen }
                                    )}
                                >
                                    <button
                                        className={classnames(
                                            'btn btn-xs btn-default dropdown-toggle',
                                            { active: this.menuOpen }
                                        )}
                                    >
                                        <i
                                            className={classnames(
                                                'fa fa-xs fa-fw fa-bars'
                                            )}
                                        />
                                    </button>
                                    <ul
                                        data-test="chart-header-hamburger-icon-menu"
                                        className={classnames(
                                            'dropdown-menu pull-right',
                                            { show: this.menuOpen }
                                        )}
                                        style={{ width: '190px' }}
                                    >
                                        {this.menuItems}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {this.active && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                        }}
                    ></div>
                )}
            </div>
        );
    }
}
