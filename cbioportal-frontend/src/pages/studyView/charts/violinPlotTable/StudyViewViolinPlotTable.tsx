import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import FixedHeaderTable from 'pages/studyView/table/FixedHeaderTable';
import { action, computed, makeObservable, observable } from 'mobx';
import StudyViewViolinPlot from 'pages/studyView/charts/violinPlotTable/StudyViewViolinPlot';
import {
    ClinicalViolinPlotBoxData,
    ClinicalViolinPlotRowData,
} from 'cbioportal-ts-api-client';
import {
    ChartDimension,
    STUDY_VIEW_CONFIG,
} from 'pages/studyView/StudyViewConfig';
import { toFixedWithoutTrailingZeros } from 'shared/lib/FormatUtils';
import { SortDirection } from 'react-virtualized';
import { EditableSpan } from 'cbioportal-frontend-commons';
import {
    getDataX,
    getTickValues,
    getViolinX,
    renderTooltipForBoxPlot,
    renderTooltipForPoint,
    violinPlotXPadding,
} from 'pages/studyView/charts/violinPlotTable/StudyViewViolinPlotUtils';
import { ClinicalViolinPlotIndividualPoint } from 'cbioportal-ts-api-client';
import classnames from 'classnames';
import styles from 'pages/resultsView/survival/styles.module.scss';
import chartStyles from 'pages/studyView/charts/styles.module.scss';
import { Popover } from 'react-bootstrap';
import * as ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';
import { getSampleViewUrl, getStudySummaryUrl } from 'shared/api/urls';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import tableStyles from '../../table/tables.module.scss';
import { clamp } from 'shared/lib/NumberUtils';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

const NUM_SAMPLES_COL_NAME = '#';
const HEADER_HEIGHT = 50;
const ROWS_Y_START = 72;
const FIRST_COLUMN_WIDTH = 120;
const VIOLIN_PLOT_START_X = 140;

export interface IStudyViewViolinPlotTableProps {
    width: number;
    height: number;
    dimension: ChartDimension;
    categoryColumnName: string;
    violinColumnName: string;
    violinBounds: {
        min: number;
        max: number;
    };
    violinFilterRange?: {
        min?: number;
        max?: number;
    };
    rows: ClinicalViolinPlotRowData[];
    showViolin: boolean;
    showBox: boolean;
    logScale: boolean;
    selectedCategories: string[];
    setFilters: (
        type: 'categorical' | 'numerical',
        values: string[] | { start: number; end: number }
    ) => void;
    isLoading: boolean;
}

@observer
export default class StudyViewViolinPlotTable extends React.Component<
    IStudyViewViolinPlotTableProps,
    {}
> {
    private ref: any;

    @observable categoryColumnDragging = {
        _extraCategoryColumnWidth: 0,
        dragging: false,
        mouseXStart: -1,
        _extraWidthStart: 0,
    };

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @computed get extraCategoryColumnWidth() {
        // only allow growing the column so that it shrinks the violin column by half
        return clamp(
            this.categoryColumnDragging._extraCategoryColumnWidth,
            0,
            this.violinColumnWidthWithoutColumnResize / 2
        );
    }

    @autobind
    private setRef(r: any) {
        this.ref = r;
    }

    @observable rangeSelection = {
        mouseX: undefined as undefined | number,
        startX: undefined as undefined | number,
        dragging: false,
        get rectX() {
            return Math.min(this.mouseX, this.startX);
        },
        get rectWidth() {
            return Math.abs(this.mouseX - this.startX);
        },
    };

    @observable tooltipModel: {
        point?: ClinicalViolinPlotIndividualPoint;
        boxData?: ClinicalViolinPlotBoxData;
        category: string;
        mouseX: number;
        mouseY: number;
    } | null = null;
    private tooltipResetTimer: any = null;
    private mouseInTooltip = false;

    @autobind
    private onMouseEnterTooltip() {
        this.mouseInTooltip = true;
    }

    @autobind
    private onMouseLeaveTooltip() {
        this.mouseInTooltip = false;
    }

    @observable sampleNumberFilter = '10';

    @action.bound
    private setSampleNumberFilter(s: string) {
        this.sampleNumberFilter = s;
    }

    private violinX(v: number) {
        return getViolinX(v, this.props.violinBounds, this.violinPlotWidth);
    }
    @computed get violinColumnWidthWithoutColumnResize() {
        const baseViolinWidth = 160; //180;
        let additionalViolinWidth = 0;
        if (this.props.dimension.w > 3) {
            // starting after grid width 3, we will absorb
            //  all grid width increases directly into the violin plot
            additionalViolinWidth =
                (this.props.dimension.w - 3) * STUDY_VIEW_CONFIG.layout.grid.w;
        }
        return baseViolinWidth + additionalViolinWidth;
    }
    @computed get violinColumnWidth() {
        return (
            this.violinColumnWidthWithoutColumnResize -
            this.extraCategoryColumnWidth
        );
    }
    @computed get violinPlotWidth() {
        return this.violinColumnWidth - 2 * violinPlotXPadding;
    }

    @action.bound
    private onMouseOverBoxPlot(
        boxData: ClinicalViolinPlotBoxData,
        mouseX: number,
        mouseY: number,
        category: string
    ) {
        // mouse on point means mouse not in tooltip
        this.onMouseLeaveTooltip();
        // cancel hiding the tooltip
        this.cancelResetTooltip();
        // Only update tooltip if this is not the same data as we're already showing
        if (
            !this.tooltipModel ||
            this.tooltipModel.category !== category ||
            !_.isEqual(this.tooltipModel.boxData, boxData)
        ) {
            this.tooltipModel = { boxData, category, mouseX, mouseY };
        }
    }

    @action.bound
    private onMouseOverPoint(
        point: ClinicalViolinPlotIndividualPoint,
        mouseX: number,
        mouseY: number,
        category: string
    ) {
        // mouse on point means mouse not in tooltip
        this.onMouseLeaveTooltip();
        // cancel hiding the tooltip
        this.cancelResetTooltip();
        // Only update tooltip if this is not the same data as we're already showing
        if (
            !this.tooltipModel ||
            this.tooltipModel.category !== category ||
            !_.isEqual(this.tooltipModel.point, point)
        ) {
            this.tooltipModel = { point, category, mouseX, mouseY };
        }
    }

    @action.bound
    private onMouseOverBackground() {
        // mouse hovering background means mouse not in tooltip
        this.onMouseLeaveTooltip();
        if (this.tooltipResetTimer === null) {
            // add hide timer if it's not already pending
            this.tooltipResetTimer = setTimeout(() => {
                this.tooltipResetTimer = null;
                if (!this.mouseInTooltip) {
                    this.tooltipModel = null;
                }
            }, 400);
        }
    }

    private cancelResetTooltip() {
        clearTimeout(this.tooltipResetTimer);
        this.tooltipResetTimer = null;
    }

    private isCategorySelected(category: string) {
        return category in this.selectedCategories;
    }

    @action.bound
    private onSelectCategory(category: string) {
        if (this.props.selectedCategories.includes(category)) {
            this.props.setFilters(
                'categorical',
                this.props.selectedCategories.filter(x => x !== category)
            );
        } else {
            this.props.setFilters('categorical', [
                category,
                ...this.props.selectedCategories,
            ]);
        }
    }

    @action.bound
    private onSelectRange(range: { start: number; end: number }) {
        this.props.setFilters('numerical', range);
    }

    @action.bound
    private startCategoryColumnDrag(e: any) {
        e.stopPropagation();
        e.preventDefault();
        this.categoryColumnDragging.dragging = true;
        this.categoryColumnDragging.mouseXStart = e.clientX;
        this.categoryColumnDragging._extraWidthStart = this.extraCategoryColumnWidth;
    }

    @action.bound
    private doCategoryColumnDrag(e: any) {
        if (!this.categoryColumnDragging.dragging) {
            return;
        }
        this.categoryColumnDragging._extraCategoryColumnWidth =
            this.categoryColumnDragging._extraWidthStart +
            e.clientX -
            this.categoryColumnDragging.mouseXStart;
    }

    @action.bound
    private stopCategoryColumnDrag(e: any) {
        if (this.categoryColumnDragging.dragging) {
            e.stopPropagation();
            e.preventDefault();
        }
        this.categoryColumnDragging.dragging = false;
    }

    @action.bound
    private executeRangeSelection() {
        if (this.rangeSelection.rectWidth > 5) {
            // execute zoom
            let start = clamp(
                getDataX(
                    this.rangeSelection.rectX - this.violinPlotStartX,
                    this.props.violinBounds,
                    this.violinPlotWidth
                ),
                this.props.violinBounds.min,
                this.props.violinBounds.max
            );
            let end = clamp(
                getDataX(
                    this.rangeSelection.rectX +
                        this.rangeSelection.rectWidth -
                        this.violinPlotStartX,
                    this.props.violinBounds,
                    this.violinPlotWidth
                ),
                this.props.violinBounds.min,
                this.props.violinBounds.max
            );
            if (this.props.logScale) {
                start = Math.exp(start) - 1;
                end = Math.exp(end) - 1;
            }
            this.onSelectRange({ start, end });
        }
    }

    @action.bound
    private stopRangeSelectionDrag(e: any) {
        this.rangeSelection.mouseX = undefined;
        this.rangeSelection.dragging = false;
    }

    @computed get selectedCategories() {
        return _.keyBy(this.props.selectedCategories);
    }

    @computed get columns() {
        return [
            {
                name: this.props.categoryColumnName,
                render: (row: ClinicalViolinPlotRowData) => (
                    <span>{row.category}</span>
                ),
                headerRender: () => {
                    return (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                width: '100%',
                            }}
                        >
                            <span>{this.props.categoryColumnName}</span>
                            <div
                                onMouseDown={this.startCategoryColumnDrag}
                                style={{
                                    color: '#ddd',
                                    width: 1,
                                    height: 15,
                                    cursor: 'ew-resize',
                                }}
                            >
                                |
                            </div>
                        </div>
                    );
                },
                width: FIRST_COLUMN_WIDTH + this.extraCategoryColumnWidth,
                sortBy: (row: ClinicalViolinPlotRowData) => row.category,
                filter: (
                    row: ClinicalViolinPlotRowData,
                    filterString: string,
                    filterStringUpper: string
                ) => row.category.toUpperCase().includes(filterStringUpper),
                visible: true,
                resizable: true,
            },
            {
                name: this.props.violinColumnName,
                render: (row: ClinicalViolinPlotRowData, rowIndex: number) => {
                    return (
                        <StudyViewViolinPlot
                            curveMagnitudes={row.curveData}
                            violinBounds={this.props.violinBounds}
                            individualPoints={row.individualPoints}
                            boxData={row.boxData}
                            showViolin={this.props.showViolin}
                            showBox={this.props.showBox}
                            width={this.violinColumnWidth}
                            gridValues={this.gridTicks}
                            onMouseOverPoint={(p, x, y) =>
                                this.onMouseOverPoint(p, x, y, row.category)
                            }
                            onMouseOverBoxPlot={(x, y) => {
                                this.onMouseOverBoxPlot(
                                    row.boxData,
                                    x,
                                    y,
                                    row.category
                                );
                            }}
                            onMouseOverBackground={this.onMouseOverBackground}
                        />
                    );
                },
                sortBy: (row: ClinicalViolinPlotRowData) => row.boxData.median,
                width: this.violinColumnWidth,
                visible: true,
            },
            {
                name: NUM_SAMPLES_COL_NAME,
                render: (row: ClinicalViolinPlotRowData) => (
                    <LabeledCheckbox
                        checked={this.isCategorySelected(row.category)}
                        onChange={() => this.onSelectCategory(row.category)}
                        labelProps={{
                            style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                            },
                        }}
                        inputProps={{
                            className: tableStyles.autoMarginCheckbox,
                        }}
                    >
                        <span data-test={'fixedHeaderTableRightJustified'}>
                            {row.numSamples}
                        </span>
                    </LabeledCheckbox>
                ),
                sortBy: (row: ClinicalViolinPlotRowData) => row.numSamples,
                visible: true,
                width: 60,
            },
            {
                name: 'Median',
                render: (row: ClinicalViolinPlotRowData) => (
                    <span className={'fixedHeaderTableRightJustified'}>
                        {toFixedWithoutTrailingZeros(row.boxData.median, 2)}
                    </span>
                ),
                sortBy: (row: ClinicalViolinPlotRowData) => row.boxData.median,
                visible: this.props.dimension.w > 2,
                width: 42,
            },
            {
                name: 'Quartile 1',
                render: (row: ClinicalViolinPlotRowData) => (
                    <span className={'fixedHeaderTableRightJustified'}>
                        {toFixedWithoutTrailingZeros(row.boxData.q1, 2)}
                    </span>
                ),
                sortBy: (row: ClinicalViolinPlotRowData) => row.boxData.q1,
                visible: this.props.dimension.w > 2,
                width: 50,
            },
            {
                name: 'Quartile 3',
                render: (row: ClinicalViolinPlotRowData) => (
                    <span className={'fixedHeaderTableRightJustified'}>
                        {toFixedWithoutTrailingZeros(row.boxData.q3, 2)}
                    </span>
                ),
                sortBy: (row: ClinicalViolinPlotRowData) => row.boxData.q3,
                visible: this.props.dimension.w > 2,
                width: 50,
            },
        ].filter(c => c.visible);
    }

    @computed get gridLabelsOffset() {
        let offset = 0;
        if (this.props.dimension.w > 2) {
            offset += 140;
        } else {
            offset += 139;
        }
        offset += this.extraCategoryColumnWidth;
        return offset;
    }

    @computed get gridTicks() {
        if (this.data.length > 0) {
            const allTicks = getTickValues(
                this.props.violinBounds,
                this.props.dimension.w,
                this.props.logScale
            );
            // The first and last ticks, which are the endpoints of the scale,
            //  might happen to overlap with their neighbors. If so, remove the neighbors.
            const guaranteedTickGap = 30;
            if (allTicks.length > 2) {
                if (
                    this.violinX(allTicks[1]) <
                    this.violinX(allTicks[0]) + guaranteedTickGap
                ) {
                    allTicks.splice(1, 1);
                }
            }
            if (allTicks.length > 2) {
                if (
                    this.violinX(allTicks[allTicks.length - 2]) >
                    this.violinX(allTicks[allTicks.length - 1]) -
                        guaranteedTickGap
                ) {
                    allTicks.splice(allTicks.length - 2, 1);
                }
            }
            return allTicks;
        } else {
            return [];
        }
    }
    renderGridLabels() {
        return (
            <svg
                style={{
                    // We position the grid labels manually at the top of the violin column
                    //  because it's too hard to put them into the column through the
                    //  table library
                    position: 'absolute',
                    top: 52,
                }}
                width={this.props.width}
                height={20}
            >
                <rect width={this.props.width} height={20} fill={'#ffffff'} />
                <g transform={`translate(${this.gridLabelsOffset},0)`}>
                    {this.gridTicks.map((val, index) => {
                        const x = this.violinX(val);
                        return (
                            <text
                                x={x}
                                y={15}
                                textAnchor={'middle'}
                                fill={'#aaa'}
                                fontSize={10}
                            >
                                {this.props.logScale
                                    ? toFixedWithoutTrailingZeros(
                                          Math.exp(val) - 1,
                                          1
                                      )
                                    : toFixedWithoutTrailingZeros(val, 2)}
                            </text>
                        );
                    })}
                </g>
            </svg>
        );
    }

    @computed get data() {
        return this.props.rows.filter(
            row => row.numSamples >= parseFloat(this.sampleNumberFilter)
        );
    }

    @computed get extraFooterElements() {
        const ret = [
            <div
                style={{
                    border: '1px solid #cccccc',
                    padding: '1px 4px 1px 4px',
                    borderRadius: 4,
                }}
            >
                <span>{`Hide # <`}</span>
                <EditableSpan
                    value={this.sampleNumberFilter}
                    setValue={this.setSampleNumberFilter}
                    style={{
                        width: 50,
                        marginTop: 0,
                        marginLeft: 5,
                        lineHeight: '15px',
                    }}
                    numericOnly={true}
                    textFieldAppearance={true}
                />
            </div>,
        ];
        if (this.props.dimension.w <= 2) {
            ret.push(
                <div
                    style={{
                        width: 71, //99,
                        position: 'absolute',
                        right: 18, //-10,
                        fontSize: 11,
                        lineHeight: 1.1,
                    }}
                >
                    Expand to see quartiles →
                </div>
            );
        }
        return ret;
    }

    private renderTooltip() {
        const model = this.tooltipModel;
        if (!model) {
            return null;
        }
        let body;
        if (model.point) {
            body = renderTooltipForPoint(
                model.point,
                this.props.violinColumnName,
                this.props.logScale
            );
        } else if (model.boxData) {
            body = renderTooltipForBoxPlot(model.boxData, this.props.logScale);
        }

        return (ReactDOM as any).createPortal(
            <Popover
                arrowOffsetTop={17}
                className={classnames(
                    'cbioportal-frontend',
                    'cbioTooltip',
                    styles.Tooltip
                )}
                positionLeft={model.mouseX + 7}
                positionTop={model.mouseY - 19}
                onMouseEnter={this.onMouseEnterTooltip}
                onMouseLeave={this.onMouseLeaveTooltip}
            >
                {body}
            </Popover>,
            document.body
        );
    }

    @action.bound onScroll() {
        // hide tooltip on scroll
        this.tooltipModel = null;
        this.cancelResetTooltip();
    }

    private renderRangeFilterIndicator() {
        if (
            !this.props.isLoading &&
            this.props.violinFilterRange &&
            this.data.length > 0
        ) {
            const range = {
                min:
                    this.props.logScale &&
                    this.props.violinFilterRange.min !== undefined
                        ? Math.log(this.props.violinFilterRange.min + 1)
                        : this.props.violinFilterRange.min,
                max:
                    this.props.logScale &&
                    this.props.violinFilterRange.max !== undefined
                        ? Math.log(this.props.violinFilterRange.max + 1)
                        : this.props.violinFilterRange.max,
            };
            return (
                <>
                    {this.props.violinFilterRange.min !== undefined && (
                        <div
                            style={{
                                top: ROWS_Y_START,
                                height: this.props.height - HEADER_HEIGHT - 0.5,
                                position: 'absolute',
                                background: '#fff',
                                borderRight: '1px solid #404040',
                                left:
                                    this.violinPlotStartX +
                                    this.violinX(this.props.violinBounds.min) -
                                    1,
                                width:
                                    1 +
                                    this.violinX(range.min!) -
                                    this.violinX(this.props.violinBounds.min),
                                zIndex: 100,
                                opacity: 0.95,
                                pointerEvents: 'none',
                            }}
                        />
                    )}
                    {this.props.violinFilterRange.max !== undefined && (
                        <div
                            style={{
                                top: ROWS_Y_START,
                                height: this.props.height - HEADER_HEIGHT - 0.5,
                                position: 'absolute',
                                background: '#fff',
                                borderLeft: '1px solid #404040',
                                left:
                                    this.violinPlotStartX +
                                    this.violinX(range.max!),
                                width:
                                    1 +
                                    this.violinX(this.props.violinBounds.max) -
                                    this.violinX(range.max!),
                                zIndex: 100,
                                opacity: 0.95,
                                pointerEvents: 'none',
                            }}
                        />
                    )}
                </>
            );
        } else {
            return null;
        }
    }

    private renderRangeSelectUI() {
        if (!this.mouseInteractionPossible) {
            return null;
        }
        if (this.rangeSelection.dragging) {
            return (
                <div
                    style={{
                        top: ROWS_Y_START,
                        height: this.props.height - HEADER_HEIGHT - 0.5,
                        position: 'absolute',
                        background: '#ccc',
                        left: this.rangeSelection.rectX,
                        width: this.rangeSelection.rectWidth,
                        zIndex: 100,
                        opacity: 0.3,
                    }}
                />
            );
        } else if (
            this.rangeSelection.mouseX !== undefined &&
            !this.categoryColumnDragging.dragging
        ) {
            return (
                <div
                    style={{
                        top: ROWS_Y_START,
                        height: this.props.height - HEADER_HEIGHT - 0.5,
                        position: 'absolute',
                        left: this.rangeSelection.mouseX,
                        borderLeft: '1px dashed #999',
                        width: 1,
                        zIndex: 100,
                        overflow: 'visible',
                        pointerEvents: 'none',
                    }}
                />
            );
        }
    }

    @computed get mouseInteractionPossible() {
        return !this.props.isLoading && this.data.length > 0;
    }

    @computed get violinPlotStartX() {
        return this.extraCategoryColumnWidth + VIOLIN_PLOT_START_X;
    }

    private handlers = {
        isMouseInside: (mouseX: number, mouseY: number) => {
            return (
                mouseX >= this.violinPlotStartX &&
                mouseX <=
                    this.violinPlotStartX +
                        this.violinColumnWidth -
                        2 * violinPlotXPadding +
                        6 &&
                mouseY >= HEADER_HEIGHT &&
                mouseY <= this.props.height
            );
        },
        onMouseMove: action((e: any) => {
            if (!this.mouseInteractionPossible) {
                return;
            }
            this.doCategoryColumnDrag(e);
            const elementX = this.ref!.getBoundingClientRect().x;
            const elementY = this.ref!.getBoundingClientRect().y;
            const mouseX = e.clientX - elementX;
            const mouseY = e.clientY - elementY;
            if (this.handlers.isMouseInside(mouseX, mouseY)) {
                this.rangeSelection.mouseX = mouseX;
            } else {
                if (this.rangeSelection.dragging) {
                    this.executeRangeSelection();
                }
                this.stopRangeSelectionDrag(e);
            }
        }),
        onMouseLeave: action((e: any) => {
            this.stopRangeSelectionDrag(e);
            this.stopCategoryColumnDrag(e);
        }),
        onMouseDown: action((e: any) => {
            if (!this.mouseInteractionPossible) {
                return;
            }
            const elementX = this.ref!.getBoundingClientRect().x;
            const elementY = this.ref!.getBoundingClientRect().y;
            const mouseX = e.clientX - elementX;
            const mouseY = e.clientY - elementY;
            if (this.handlers.isMouseInside(mouseX, mouseY)) {
                this.rangeSelection.startX = mouseX;
                this.rangeSelection.dragging = true;
            }
        }),
        onMouseUp: action((e: any) => {
            if (!this.mouseInteractionPossible) {
                return;
            }
            if (this.rangeSelection.dragging) {
                this.executeRangeSelection();
            }
            this.stopRangeSelectionDrag(e);
            this.stopCategoryColumnDrag(e);
        }),
    };
    private renderLoadingIndicator() {
        if (!this.props.isLoading) {
            return null;
        }
        return (
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: this.props.width,
                    height: this.props.height + 50,
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: this.props.height + 2,
                        top: 20,
                        background: '#fff',
                        left: 0,
                        opacity: 0.8,
                    }}
                />

                <LoadingIndicator
                    centerRelativeToContainer={true}
                    isLoading={true}
                    className={chartStyles.chartLoader}
                />
            </div>
        );
    }

    render() {
        return (
            <div
                ref={this.setRef}
                onMouseMove={this.handlers.onMouseMove}
                onMouseLeave={this.handlers.onMouseLeave}
                onMouseDown={this.handlers.onMouseDown}
                onMouseUp={this.handlers.onMouseUp}
                className={
                    this.rangeSelection.dragging ||
                    this.categoryColumnDragging.dragging
                        ? 'noselect'
                        : ''
                }
            >
                <>
                    <FixedHeaderTable
                        columns={this.columns}
                        data={this.data}
                        headerHeight={HEADER_HEIGHT}
                        headerClassName={classnames('violinPlotTableHeader', {
                            nomouse: this.categoryColumnDragging.dragging,
                        })}
                        rowHeight={30}
                        width={this.props.width}
                        height={this.props.height}
                        sortBy={NUM_SAMPLES_COL_NAME}
                        sortDirection={'desc'}
                        extraFooterElements={this.extraFooterElements}
                        onScroll={this.onScroll}
                    />
                    {this.renderGridLabels()}
                    {this.renderRangeFilterIndicator()}
                    {this.renderRangeSelectUI()}
                    {this.renderTooltip()}
                    {this.renderLoadingIndicator()}
                </>
                {this.data.length === 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 70,
                            width: this.props.width,
                            height: this.props.height - 70,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        No data.
                    </div>
                )}
            </div>
        );
    }
}
