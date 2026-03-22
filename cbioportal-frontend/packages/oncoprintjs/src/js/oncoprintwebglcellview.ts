import gl_matrix from 'gl-matrix';
import svgfactory from './svgfactory';
import makeSvgElement from './makesvgelement';
import shapeToVertexes, {
    getNumWebGLVertexes,
} from './oncoprintshapetovertexes';
import CachedProperty from './CachedProperty';
import { ComputedShapeParams, Shape } from './oncoprintshape';
import $ from 'jquery';
import OncoprintModel, {
    ColumnId,
    ColumnLabel,
    ColumnProp,
    GAP_MODE_ENUM,
    IdentifiedShapeList,
    TrackId,
    TrackOverlappingCells,
    TrackProp,
} from './oncoprintmodel';
import OncoprintToolTip from './oncoprinttooltip';
import { ifndef, sgndiff } from './utils';
import { CellClickCallback, CellMouseOverCallback } from './oncoprint';
import { getFragmentShaderSource, getVertexShaderSource } from './shaders';
import _ from 'lodash';
import MouseUpEvent = JQuery.MouseUpEvent;
import MouseMoveEvent = JQuery.MouseMoveEvent;

type ColorBankIndex = number; // index into vertex bank (e.g. 0, 4, 8, ...)
type ColorBank = number[]; // flat list of color: [c0,c0,c0,c0,v1,v1,v1,c1,c1,c1,c1,...]
type ColumnIdIndex = number;
type PositionVertex = [number, number, number];
type ColorVertex = [number, number, number, number];

type OncoprintGap = {
    origin_x: number;
    origin_y: number;
    data: OncoprintGapConfig;
};

export type OncoprintGapConfig = {
    labelFormatter: () => string;
    tooltipFormatter: () => string;
};

export type OncoprintWebGLContext = WebGLRenderingContext & {
    viewportWidth: number;
    viewportHeight: number;
}; // TODO: handle this differently, considered an anti-pattern https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html

export type OncoprintShaderProgram = WebGLProgram & {
    vertexPositionAttribute: any;
    vertexColorAttribute: any;
    vertexOncoprintColumnAttribute: any;

    gapSizeUniform: WebGLUniformLocation;
    columnsRightAfterGapsUniform: WebGLUniformLocation;

    samplerUniform: WebGLUniformLocation;
    pMatrixUniform: WebGLUniformLocation;
    mvMatrixUniform: WebGLUniformLocation;
    columnWidthUniform: WebGLUniformLocation;
    scrollXUniform: WebGLUniformLocation;
    scrollYUniform: WebGLUniformLocation;
    zoomXUniform: WebGLUniformLocation;
    zoomYUniform: WebGLUniformLocation;
    offsetYUniform: WebGLUniformLocation;
    supersamplingRatioUniform: WebGLUniformLocation;
    positionBitPackBaseUniform: WebGLUniformLocation;
    texSizeUniform: WebGLUniformLocation;
}; // TODO: handle this differently, considered an anti-pattern https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html

export type OncoprintTrackBuffer = WebGLBuffer & {
    itemSize: number;
    numItems: number;
}; // TODO: handle this differently, considered an anti-pattern https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html

export type OncoprintVertexTrackBuffer = OncoprintTrackBuffer & {
    // the universal shapes vertexes start at index itemSize*numItems, and go on for itemSize*universalShapesNumItems indexes
    specificShapesNumItems: number;
    universalShapesNumItems: number;
};

const COLUMN_LABEL_ANGLE = 65;
const COLUMN_LABEL_MARGIN = 30;

const CELL_HIGHLIGHT_STROKE = 'rgba(0,0,0,0.5)';

export default class OncoprintWebGLCellView {
    public readonly position_bit_pack_base = 128;
    private readonly supersampling_ratio = 2;
    private readonly antialias_on_cell_width_thresh = 5;
    private antialias = true;

    private dummy_scroll_div_client_size: CachedProperty<{
        width: number;
        height: number;
    }>;
    public visible_area_width: number;
    private mouseMoveHandler: (evt: MouseMoveEvent) => void;

    private ctx: OncoprintWebGLContext | null;
    private gap_ctx: CanvasRenderingContext2D | null;
    private ext: ANGLE_instanced_arrays | null;
    private overlay_ctx: CanvasRenderingContext2D | null;
    private column_label_ctx: CanvasRenderingContext2D | null;
    private mvMatrix: any;
    private pMatrix: any;
    private shader_program: OncoprintShaderProgram;

    private scroll_x: number = 0;
    private scroll_y: number = 0;
    private maximum_column_label_width = 0;
    private maximum_column_label_height = 0;
    private rendering_suppressed = false;

    private specific_shapes: TrackProp<IdentifiedShapeList[]> = {};
    private universal_shapes: TrackProp<ComputedShapeParams[]> = {};
    public vertex_data: TrackProp<{
        pos_array: Float32Array;
        col_array: Float32Array; //ColorBankIndex[],
        col_bank: ColorBank;
        universal_shapes_start_index: number;
    }> = {};
    public vertex_column_array: TrackProp<Float32Array> = {}; // ColumnIdIndex[]
    private vertex_position_buffer: TrackProp<OncoprintVertexTrackBuffer> = {};
    private vertex_color_buffer: TrackProp<OncoprintVertexTrackBuffer> = {};
    private vertex_column_buffer: TrackProp<OncoprintTrackBuffer> = {};
    private simple_count_buffer: OncoprintTrackBuffer | null = null;
    private is_buffer_empty: TrackProp<{
        position: boolean;
        color: boolean;
        column: boolean;
        color_texture: boolean;
    }> = {};
    private color_texture: TrackProp<{
        texture: WebGLTexture;
        size: number;
    }> = {};
    private id_to_first_vertex_index: TrackProp<ColumnProp<number>> = {}; // index of first vertex corresponding to given id for given track, e.g. 0, 3, 6, ...

    constructor(
        private $container: JQuery,
        private $canvas: JQuery<HTMLCanvasElement>,
        private $overlay_canvas: JQuery<HTMLCanvasElement>,
        private $gap_canvas: JQuery<HTMLCanvasElement>,
        private $column_label_canvas: JQuery<HTMLCanvasElement>,
        private $dummy_scroll_div_contents: JQuery,
        model: OncoprintModel,
        private tooltip: OncoprintToolTip,
        private highlight_area_callback:
            | undefined
            | ((left: number, right: number) => void),
        cell_over_callback: CellMouseOverCallback,
        cell_click_callback: CellClickCallback
    ) {
        this.getWebGLContextAndSetUpMatrices();
        this.setUpShaders(model);
        this.getOverlayContextAndClear();
        this.visible_area_width = $canvas[0].width;

        const self = this;

        this.tooltip.center = true;

        this.scroll_x = 0;
        this.scroll_y = 0;
        this.dummy_scroll_div_client_size = new CachedProperty(
            {
                width: $dummy_scroll_div_contents.parent()[0].clientWidth,
                height: $dummy_scroll_div_contents.parent()[0].clientHeight,
            },
            function() {
                return {
                    width: $dummy_scroll_div_contents.parent()[0].clientWidth,
                    height: $dummy_scroll_div_contents.parent()[0].clientHeight,
                };
            }
        );

        this.highlight_area_callback =
            typeof highlight_area_callback === 'undefined'
                ? function() {}
                : highlight_area_callback; // function(left, right) { ... }

        (function initializeOverlayEvents(self) {
            let dragging = false;
            let drag_diff_minimum = 10;
            let drag_start_x: number;
            let drag_end_x: number;
            let last_cell_over: TrackOverlappingCells | null = null;

            function dragIsValid(drag_start_x: number, drag_end_x: number) {
                return Math.abs(drag_start_x - drag_end_x) >= drag_diff_minimum;
            }

            function executeDragOrClick(mouse_up_evt?: MouseUpEvent) {
                if (!dragging) {
                    return;
                }
                dragging = false;

                if (!dragIsValid(drag_start_x, drag_end_x)) {
                    if (mouse_up_evt) {
                        // its a click
                        const offset = self.$overlay_canvas.offset();
                        const mouseX = mouse_up_evt.pageX - offset.left;
                        const mouseY = mouse_up_evt.pageY - offset.top;
                        const overlapping_cells = model.getOverlappingCells(
                            mouseX + self.scroll_x,
                            mouseY + self.scroll_y
                        );
                        if (overlapping_cells === null) {
                            cell_click_callback(null);
                        } else {
                            cell_click_callback(
                                overlapping_cells.ids[0],
                                overlapping_cells.track
                            );
                        }
                    }
                    return;
                }
                const left = Math.min(drag_start_x, drag_end_x);
                const right = Math.max(drag_start_x, drag_end_x);
                self.highlight_area_callback(
                    left + self.scroll_x,
                    right + self.scroll_x
                );
            }

            function mouseInOverlayCanvas(mouse_x: number, mouse_y: number) {
                const offset = self.$overlay_canvas.offset();
                const width = self.$overlay_canvas.width();
                const height = self.$overlay_canvas.height();
                return (
                    mouse_x >= offset.left &&
                    mouse_x < width + offset.left &&
                    mouse_y >= offset.top &&
                    mouse_y < height + offset.top
                );
            }

            self.mouseMoveHandler = function(evt) {
                if (!mouseInOverlayCanvas(evt.pageX, evt.pageY)) {
                    self.clearOverlay();
                    self.highlightHighlightedIds(model);
                    self.highlightHighlightedTracks(model);
                    tooltip.hide();
                    if (last_cell_over !== null) {
                        last_cell_over = null;
                        cell_over_callback(null);
                    }
                }
            };

            $(document).on('mousemove', self.mouseMoveHandler);
            self.$overlay_canvas.on('mousemove', function(evt) {
                if (self.rendering_suppressed) {
                    return;
                }
                self.clearOverlay();

                const offset = self.$overlay_canvas.offset();
                const mouseX = evt.pageX - offset.left;
                const mouseY = evt.pageY - offset.top;

                let overlapping_cells = model.getOverlappingCells(
                    mouseX + self.scroll_x,
                    mouseY + self.scroll_y
                );
                if (!dragging) {
                    const overlapping_data =
                        overlapping_cells === null
                            ? null
                            : overlapping_cells.ids.map(function(id) {
                                  return model.getTrackDatum(
                                      overlapping_cells.track,
                                      id
                                  );
                              });
                    if (overlapping_data !== null) {
                        last_cell_over = overlapping_cells;
                        cell_over_callback(
                            overlapping_cells.ids[0],
                            overlapping_cells.track
                        );

                        self.highlightCell(
                            model,
                            overlapping_cells.track,
                            overlapping_cells.ids[0]
                        );
                        self.highlightColumn(model, overlapping_cells.ids[0]);

                        const clientRect = self.$overlay_canvas[0].getBoundingClientRect();
                        tooltip.show(
                            250,
                            model.getZoomedColumnLeft(
                                overlapping_cells.ids[0]
                            ) +
                                model.getCellWidth() / 2 +
                                clientRect.left -
                                self.scroll_x,
                            model.getCellTops(overlapping_cells.track) +
                                clientRect.top -
                                self.scroll_y,
                            model.getTrackTooltipFn(overlapping_cells.track)(
                                overlapping_data
                            )
                        );
                    } else {
                        overlapping_cells = null;
                    }

                    // find a gap which is in range of mouse position
                    const overlappingGap = self.gapTooltipTargets.find(
                        (t: any) => {
                            return (
                                _.inRange(mouseX - t.origin_x, 0, 20) &&
                                _.inRange(t.origin_y - mouseY, -10, 15)
                            );
                        }
                    );

                    // if there is no gap, turn
                    if (overlappingGap === undefined) {
                        self.hoveredGap = undefined;
                    } else if (self.hoveredGap === overlappingGap) {
                        // tooltip should already be showing, so do nothing
                    } else {
                        // we have a new hovered gap, so show a tooltip
                        const clientRect = self.$overlay_canvas[0].getBoundingClientRect();
                        self.hoveredGap = overlappingGap;
                        tooltip.center = false;
                        tooltip.show(
                            250,
                            clientRect.left + overlappingGap.origin_x,
                            clientRect.top + overlappingGap.origin_y - 20,
                            $(
                                `<span>${overlappingGap.data.tooltipFormatter()}</span>`
                            ),
                            false
                        );
                    }

                    if (!overlapping_data && !overlappingGap) {
                        tooltip.hideIfNotAlreadyGoingTo(150);
                    }
                } else {
                    overlapping_cells = null;
                    drag_end_x = mouseX;
                    const left = Math.min(mouseX, drag_start_x);
                    const right = Math.max(mouseX, drag_start_x);
                    const drag_rect_fill = dragIsValid(drag_start_x, drag_end_x)
                        ? 'rgba(0,0,0,0.3)'
                        : 'rgba(0,0,0,0.2)';
                    self.overlayFillRect(
                        left,
                        0,
                        right - left,
                        self.getVisibleAreaHeight(model),
                        drag_rect_fill
                    );
                }
                if (overlapping_cells === null) {
                    last_cell_over = null;
                    cell_over_callback(null);
                }

                self.highlightHighlightedIds(
                    model,
                    overlapping_cells ? overlapping_cells.ids : []
                );
                self.highlightHighlightedTracks(model);
            });

            self.$overlay_canvas.on('mousedown', function(evt) {
                if (!mouseInOverlayCanvas(evt.pageX, evt.pageY)) {
                    return;
                }
                dragging = true;
                drag_start_x = evt.pageX - self.$overlay_canvas.offset().left;
                drag_end_x = drag_start_x;

                tooltip.hide();
            });
            self.$overlay_canvas.on('mouseup', function(evt) {
                if (!mouseInOverlayCanvas(evt.pageX, evt.pageY)) {
                    return;
                }
                executeDragOrClick(evt);
            });
            self.$overlay_canvas.on('mouseleave', function(evt) {
                executeDragOrClick();
            });
        })(this);

        $dummy_scroll_div_contents.parent().scroll(function() {
            self.clearOverlay();
            self.highlightHighlightedIds(model);
            self.highlightHighlightedTracks(model);
        });
    }

    private drawGapLabel(txt: string, x: number, y: number) {
        this.gap_ctx.font = '15pt Arial';
        this.gap_ctx.textAlign = 'right';

        const origin_x = x * this.supersampling_ratio + 52;
        const origin_y = y * this.supersampling_ratio + 4;

        this.gap_ctx.fillText(txt, origin_x, origin_y);

        return {
            origin_x: x,
            origin_y: y,
        };
    }

    private getNewCanvas() {
        const old_canvas = this.$canvas[0];
        const new_canvas = old_canvas.cloneNode() as HTMLCanvasElement;
        const parent_node = old_canvas.parentNode;
        parent_node.removeChild(old_canvas);
        parent_node.insertBefore(new_canvas, parent_node.childNodes[0]); // keep on bottom since we need overlays to not be hidden
        this.$canvas = $(new_canvas);
        this.ctx = null;
        this.ext = null;
    }

    private getGapContext() {
        try {
            return this.$gap_canvas[0].getContext('2d');
        } catch (e) {
            return null;
        }
    }

    private getWebGLCanvasContext() {
        try {
            const canvas = this.$canvas[0];
            const ctx =
                this.ctx ||
                (canvas.getContext('experimental-webgl', {
                    alpha: false,
                    antialias: this.antialias,
                }) as OncoprintWebGLContext);
            ctx.clearColor(1.0, 1.0, 1.0, 1.0);
            ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
            ctx.viewportWidth = canvas.width;
            ctx.viewportHeight = canvas.height;
            ctx.viewport(0, 0, ctx.viewportWidth, ctx.viewportHeight);
            ctx.enable(ctx.DEPTH_TEST);
            ctx.enable(ctx.BLEND);
            ctx.blendEquation(ctx.FUNC_ADD);
            ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
            ctx.depthMask(false);

            return ctx;
        } catch (e) {
            return null;
        }
    }

    private createShaderProgram(
        vertex_shader: WebGLShader,
        fragment_shader: WebGLShader
    ) {
        const program = this.ctx.createProgram();
        this.ctx.attachShader(program, vertex_shader);
        this.ctx.attachShader(program, fragment_shader);

        this.ctx.linkProgram(program);

        const success = this.ctx.getProgramParameter(
            program,
            this.ctx.LINK_STATUS
        );
        if (!success) {
            const msg = this.ctx.getProgramInfoLog(program);
            this.ctx.deleteProgram(program);
            throw 'Unable to link shader program: ' + msg;
        }

        return program;
    }

    private createShader(
        source: string,
        type: 'VERTEX_SHADER' | 'FRAGMENT_SHADER'
    ) {
        const shader = this.ctx.createShader(this.ctx[type]);
        this.ctx.shaderSource(shader, source);
        this.ctx.compileShader(shader);

        const success = this.ctx.getShaderParameter(
            shader,
            this.ctx.COMPILE_STATUS
        );
        if (!success) {
            const msg = this.ctx.getShaderInfoLog(shader);
            this.ctx.deleteShader(shader);
            throw 'Unable to compile shader: ' + msg;
        }

        return shader;
    }

    private overlayStrokeRect(
        x: number,
        y: number,
        width: number,
        height: number,
        color: string
    ) {
        const ctx = this.overlay_ctx;
        ctx.strokeStyle = color;
        (ctx as any).strokeWidth = 10;
        ctx.strokeRect(
            this.supersampling_ratio * x,
            this.supersampling_ratio * y,
            this.supersampling_ratio * width,
            this.supersampling_ratio * height
        );
    }

    private overlayFillRect(
        x: number,
        y: number,
        width: number,
        height: number,
        color: string
    ) {
        const ctx = this.overlay_ctx;
        ctx.fillStyle = color;
        ctx.fillRect(
            this.supersampling_ratio * x,
            this.supersampling_ratio * y,
            this.supersampling_ratio * width,
            this.supersampling_ratio * height
        );
    }

    public clearOverlay() {
        this.overlay_ctx.fillStyle = 'rgba(0,0,0,0)';
        this.overlay_ctx.clearRect(
            0,
            0,
            this.$overlay_canvas[0].width,
            this.$overlay_canvas[0].height
        );
    }

    private getOverlayContextAndClear() {
        this.overlay_ctx = this.$overlay_canvas[0].getContext('2d');
        this.clearOverlay();
    }

    private getColumnLabelsContext() {
        this.column_label_ctx = this.$column_label_canvas[0].getContext('2d');
    }

    private getColumnLabelY(model: OncoprintModel) {
        return (
            (model.getOncoprintHeight() + 10 - this.scroll_y) *
            this.supersampling_ratio
        );
    }

    private overlayColumnLabelHighlight(model: OncoprintModel, id: ColumnId) {
        const label = model.getColumnLabels()[id];
        if (label) {
            this.prepareContextForColumnLabelText(model, this.overlay_ctx);
            const cell_width = model.getCellWidth();
            const left_padding =
                ((label.left_padding_percent || 0) * cell_width) / 100;
            let highlightHeight = cell_width * this.supersampling_ratio;
            let highlightWidth =
                this.overlay_ctx.measureText(label.text).width +
                left_padding * this.supersampling_ratio +
                20;
            let dx = left_padding * this.supersampling_ratio;
            if (label.circle_color) {
                const circleDiameter =
                    2 *
                    this.getColumnLabelCircleSpec(model).radius *
                    this.supersampling_ratio;
                highlightHeight = Math.max(highlightHeight, circleDiameter);
                highlightWidth = Math.max(highlightWidth, circleDiameter);
                dx = Math.min(dx, -circleDiameter / 2);
            }
            const origin_x =
                (model.getZoomedColumnLeft(id) +
                    cell_width / 2 -
                    this.scroll_x) *
                this.supersampling_ratio;
            const origin_y = this.getColumnLabelY(model);
            this.overlay_ctx.save();
            this.overlay_ctx.translate(origin_x, origin_y);
            const angle = this.getColumnLabelAngleRadians(label);
            this.overlay_ctx.rotate(angle);
            this.overlay_ctx.fillStyle = 'rgba(255,255,0,0.4)';
            this.overlay_ctx.fillRect(
                dx,
                -highlightHeight / 2,
                highlightWidth,
                highlightHeight
            );

            this.overlay_ctx.restore();
        }
    }

    private getWebGLContextAndSetUpMatrices() {
        this.gap_ctx = this.getGapContext();

        this.ctx = this.getWebGLCanvasContext();
        if (this.ctx) {
            this.ext = this.ctx.getExtension('ANGLE_instanced_arrays');
        }
        (function initializeMatrices(self) {
            const mvMatrix = gl_matrix.mat4.create();
            gl_matrix.mat4.lookAt(mvMatrix, [0, 0, 1], [0, 0, 0], [0, 1, 0]);
            self.mvMatrix = mvMatrix;

            const pMatrix = gl_matrix.mat4.create();
            gl_matrix.mat4.ortho(
                pMatrix,
                0,
                self.ctx.viewportWidth,
                self.ctx.viewportHeight,
                0,
                -5,
                1000
            ); // y axis inverted so that y increases down like SVG
            self.pMatrix = pMatrix;
        })(this);
    }

    private getColumnIndexesAfterAGap(model: OncoprintModel) {
        // uniform length is minimum 1
        return model
            .getColumnIndexesAfterAGap()
            .concat([Number.POSITIVE_INFINITY]);
    }

    private setUpShaders(model: OncoprintModel) {
        const columnsRightAfterGapsSize = this.getColumnIndexesAfterAGap(model)
            .length;
        const vertex_shader = this.createShader(
            getVertexShaderSource(columnsRightAfterGapsSize),
            'VERTEX_SHADER'
        );
        const fragment_shader = this.createShader(
            getFragmentShaderSource(),
            'FRAGMENT_SHADER'
        );

        const shader_program = this.createShaderProgram(
            vertex_shader,
            fragment_shader
        ) as OncoprintShaderProgram;
        shader_program.vertexPositionAttribute = this.ctx.getAttribLocation(
            shader_program,
            'aPosVertex'
        );
        this.ctx.enableVertexAttribArray(
            shader_program.vertexPositionAttribute
        );
        shader_program.vertexColorAttribute = this.ctx.getAttribLocation(
            shader_program,
            'aColVertex'
        );
        this.ctx.enableVertexAttribArray(shader_program.vertexColorAttribute);
        shader_program.vertexOncoprintColumnAttribute = this.ctx.getAttribLocation(
            shader_program,
            'aVertexOncoprintColumn'
        );
        this.ctx.enableVertexAttribArray(
            shader_program.vertexOncoprintColumnAttribute
        );

        shader_program.gapSizeUniform = this.ctx.getUniformLocation(
            shader_program,
            'gapSize'
        );
        shader_program.columnsRightAfterGapsUniform = this.ctx.getUniformLocation(
            shader_program,
            'columnsRightAfterGaps'
        );
        shader_program.samplerUniform = this.ctx.getUniformLocation(
            shader_program,
            'uSampler'
        );
        shader_program.pMatrixUniform = this.ctx.getUniformLocation(
            shader_program,
            'uPMatrix'
        );
        shader_program.mvMatrixUniform = this.ctx.getUniformLocation(
            shader_program,
            'uMVMatrix'
        );
        shader_program.columnWidthUniform = this.ctx.getUniformLocation(
            shader_program,
            'columnWidth'
        );
        shader_program.scrollXUniform = this.ctx.getUniformLocation(
            shader_program,
            'scrollX'
        );
        shader_program.scrollYUniform = this.ctx.getUniformLocation(
            shader_program,
            'scrollY'
        );
        shader_program.zoomXUniform = this.ctx.getUniformLocation(
            shader_program,
            'zoomX'
        );
        shader_program.zoomYUniform = this.ctx.getUniformLocation(
            shader_program,
            'zoomY'
        );
        shader_program.offsetYUniform = this.ctx.getUniformLocation(
            shader_program,
            'offsetY'
        );
        shader_program.supersamplingRatioUniform = this.ctx.getUniformLocation(
            shader_program,
            'supersamplingRatio'
        );
        shader_program.positionBitPackBaseUniform = this.ctx.getUniformLocation(
            shader_program,
            'positionBitPackBase'
        );
        shader_program.texSizeUniform = this.ctx.getUniformLocation(
            shader_program,
            'texSize'
        );

        this.shader_program = shader_program;
    }

    private resizeAndClear(model: OncoprintModel) {
        const height = this.getVisibleAreaHeight(model);
        const total_width = this.getTotalWidth(model);
        const visible_area_width = this.visible_area_width;
        const scrollbar_slack = 20;
        this.$dummy_scroll_div_contents.css({
            'min-width': total_width,
            'min-height': model.getOncoprintHeight(),
        });
        this.$dummy_scroll_div_contents.parent().css({
            height: height + scrollbar_slack,
            width: visible_area_width + scrollbar_slack,
        }); // add space for scrollbars
        this.dummy_scroll_div_client_size.update();
        this.$canvas[0].height = this.supersampling_ratio * height;
        this.$canvas[0].style.height = height + 'px';
        this.$gap_canvas[0].height = this.supersampling_ratio * height;
        this.$gap_canvas[0].style.height = height + 'px';

        this.$gap_canvas[0].width =
            this.supersampling_ratio * visible_area_width;
        this.$gap_canvas[0].style.width = visible_area_width + 'px';

        this.$overlay_canvas[0].height = this.supersampling_ratio * height;
        this.$overlay_canvas[0].style.height = height + 'px';
        this.$column_label_canvas[0].height = this.supersampling_ratio * height;
        this.$column_label_canvas[0].style.height = height + 'px';
        this.$canvas[0].width = this.supersampling_ratio * visible_area_width;
        this.$canvas[0].style.width = visible_area_width + 'px';
        this.$overlay_canvas[0].width =
            this.supersampling_ratio * visible_area_width;
        this.$overlay_canvas[0].style.width = visible_area_width + 'px';
        this.$column_label_canvas[0].width =
            this.supersampling_ratio * visible_area_width;
        this.$column_label_canvas[0].style.width = visible_area_width + 'px';
        this.$container.css('height', height);
        this.$container.css('width', visible_area_width);
        this.getWebGLContextAndSetUpMatrices();
        this.setUpShaders(model);
        this.getOverlayContextAndClear();
        this.getColumnLabelsContext();
    }

    public gapTooltipTargets: OncoprintGap[] = [];

    public hoveredGap: OncoprintGap;

    private renderAllTracks(model: OncoprintModel, dont_resize?: boolean) {
        if (this.rendering_suppressed) {
            return;
        }

        const scroll_x = this.scroll_x;
        const scroll_y = this.scroll_y;
        const zoom_x = model.getHorzZoom();
        const zoom_y = model.getVertZoom();

        const viewport = this.getViewportOncoprintSpace(model);
        const window_left = viewport.left;
        const window_right = viewport.right;
        const window_top = viewport.top;
        const window_bottom = viewport.bottom;
        const id_order = model.getIdOrder();
        let horz_first_id_in_window_index = model.getClosestColumnIndexToLeft(
            window_left
        );
        const horz_first_id_after_window_index = model.getClosestColumnIndexToLeft(
            window_right,
            false,
            true
        );
        horz_first_id_in_window_index =
            horz_first_id_in_window_index < 1
                ? 0
                : horz_first_id_in_window_index - 1;

        const horz_first_id_in_window = id_order[horz_first_id_in_window_index];
        const horz_first_id_after_window =
            horz_first_id_after_window_index === -1 ||
            horz_first_id_after_window_index === id_order.length
                ? null
                : id_order[horz_first_id_after_window_index];

        if (!dont_resize) {
            this.resizeAndClear(model);
        }
        this.ctx.clearColor(1.0, 1.0, 1.0, 1.0);
        this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT);

        this.gap_ctx.clearRect(
            0,
            0,
            this.$gap_canvas[0].width,
            this.$gap_canvas[0].height
        );

        const gapOffsets = model.getGapOffsets();

        const tracks = model.getTracks();

        this.gapTooltipTargets = [];

        for (let i = 0; i < tracks.length; i++) {
            const track_id = tracks[i];
            const cell_top = model.getCellTops(track_id);
            const cell_height = model.getCellHeight(track_id);

            if (
                model.showGaps() &&
                model.gapMode() === GAP_MODE_ENUM.SHOW_GAPS_PERCENT
            ) {
                const gaps = this.getGaps(model, track_id);
                if (gaps) {
                    gaps.forEach((gap: OncoprintGapConfig, i: number) => {
                        const x = gapOffsets[i] - scroll_x - model.getGapSize();
                        const y =
                            model.getZoomedTrackTops()[track_id] +
                            cell_height -
                            scroll_y -
                            4;

                        this.drawGapLabel(gap.labelFormatter(), x, y);

                        this.gapTooltipTargets.push({
                            origin_x: x,
                            origin_y: y,
                            data: gap,
                        });
                    });
                }
            }

            if (
                cell_top / zoom_y >= window_bottom ||
                (cell_top + cell_height) / zoom_y < window_top
            ) {
                // vertical clipping
                continue;
            }
            const buffers = this.getTrackBuffers(track_id);

            if (buffers.position.numItems === 0) {
                continue;
            }

            for (const forSpecificShapes of [false, true]) {
                const shader_program = this.shader_program;
                this.ctx.useProgram(shader_program);

                if (forSpecificShapes) {
                    this.ctx.bindBuffer(
                        this.ctx.ARRAY_BUFFER,
                        buffers.position
                    );
                    this.ctx.vertexAttribPointer(
                        shader_program.vertexPositionAttribute,
                        buffers.position.itemSize,
                        this.ctx.FLOAT,
                        false,
                        0,
                        0
                    );
                    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, buffers.color);
                    this.ctx.vertexAttribPointer(
                        shader_program.vertexColorAttribute,
                        buffers.color.itemSize,
                        this.ctx.FLOAT,
                        false,
                        0,
                        0
                    );
                    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, buffers.column);
                    this.ctx.vertexAttribPointer(
                        shader_program.vertexOncoprintColumnAttribute,
                        buffers.column.itemSize,
                        this.ctx.FLOAT,
                        false,
                        0,
                        0
                    );
                    // make sure to set divisor 0, otherwise the track will only use the first item in the column buffer
                    this.ext.vertexAttribDivisorANGLE(
                        shader_program.vertexOncoprintColumnAttribute,
                        0
                    );
                } else {
                    // set up for drawArraysInstanced
                    const universalShapesStart =
                        buffers.position.specificShapesNumItems *
                        buffers.position.itemSize;
                    this.ctx.bindBuffer(
                        this.ctx.ARRAY_BUFFER,
                        buffers.position
                    );
                    this.ctx.vertexAttribPointer(
                        shader_program.vertexPositionAttribute,
                        buffers.position.itemSize,
                        this.ctx.FLOAT,
                        false,
                        0,
                        4 * universalShapesStart
                    );

                    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, buffers.color);
                    this.ctx.vertexAttribPointer(
                        shader_program.vertexColorAttribute,
                        buffers.color.itemSize,
                        this.ctx.FLOAT,
                        false,
                        0,
                        4 * universalShapesStart
                    );

                    this.ctx.bindBuffer(
                        this.ctx.ARRAY_BUFFER,
                        this.simple_count_buffer
                    );
                    this.ctx.vertexAttribPointer(
                        shader_program.vertexOncoprintColumnAttribute,
                        1,
                        this.ctx.FLOAT,
                        false,
                        0,
                        4 * horz_first_id_in_window_index
                    );
                    this.ext.vertexAttribDivisorANGLE(
                        shader_program.vertexOncoprintColumnAttribute,
                        1
                    );
                }

                this.ctx.activeTexture(this.ctx.TEXTURE0);
                this.ctx.bindTexture(
                    this.ctx.TEXTURE_2D,
                    buffers.color_tex.texture
                );
                this.ctx.uniform1i(shader_program.samplerUniform, 0);
                this.ctx.uniform1f(
                    shader_program.texSizeUniform,
                    buffers.color_tex.size
                );

                this.ctx.uniform1fv(
                    shader_program.columnsRightAfterGapsUniform,
                    this.getColumnIndexesAfterAGap(model)
                ); // need min size of 1
                this.ctx.uniform1f(
                    shader_program.gapSizeUniform,
                    model.getGapSize()
                );

                this.ctx.uniformMatrix4fv(
                    shader_program.pMatrixUniform,
                    false,
                    this.pMatrix
                );
                this.ctx.uniformMatrix4fv(
                    shader_program.mvMatrixUniform,
                    false,
                    this.mvMatrix
                );
                this.ctx.uniform1f(
                    shader_program.columnWidthUniform,
                    model.getCellWidth(true) + model.getCellPadding(true)
                );
                this.ctx.uniform1f(shader_program.scrollXUniform, scroll_x);
                this.ctx.uniform1f(shader_program.scrollYUniform, scroll_y);
                this.ctx.uniform1f(shader_program.zoomXUniform, zoom_x);
                this.ctx.uniform1f(shader_program.zoomYUniform, zoom_y);
                this.ctx.uniform1f(shader_program.offsetYUniform, cell_top);
                this.ctx.uniform1f(
                    shader_program.supersamplingRatioUniform,
                    this.supersampling_ratio
                );
                this.ctx.uniform1f(
                    shader_program.positionBitPackBaseUniform,
                    this.position_bit_pack_base
                );
                if (forSpecificShapes) {
                    const first_index = this.id_to_first_vertex_index[track_id][
                        horz_first_id_in_window
                    ];
                    const first_index_out =
                        horz_first_id_after_window === null
                            ? buffers.position.specificShapesNumItems
                            : this.id_to_first_vertex_index[track_id][
                                  horz_first_id_after_window
                              ];
                    this.ctx.drawArrays(
                        this.ctx.TRIANGLES,
                        first_index,
                        first_index_out - first_index
                    );
                } else {
                    this.ext.drawArraysInstancedANGLE(
                        this.ctx.TRIANGLES,
                        0,
                        buffers.position.itemSize *
                            buffers.position.universalShapesNumItems,
                        horz_first_id_after_window_index -
                            horz_first_id_in_window_index
                    );
                }
            }
        }
        this.ctx.flush();
        this.renderColumnLabels(
            model,
            id_order.slice(
                horz_first_id_in_window_index,
                horz_first_id_after_window_index === -1
                    ? undefined
                    : horz_first_id_after_window_index
            )
        );

        // finally, refresh overlay (highlights)
        this.clearOverlay();
        this.highlightHighlightedIds(model);
        this.highlightHighlightedTracks(model);
    }

    private static getColumnLabelsFontSize(model: OncoprintModel) {
        return model.getCellWidth() / 2 + 2;
    }

    private prepareContextForColumnLabelText(
        model: OncoprintModel,
        ctx: CanvasRenderingContext2D
    ) {
        const font_size = OncoprintWebGLCellView.getColumnLabelsFontSize(model);
        const font_family = 'Arial';
        ctx.font = this.supersampling_ratio * font_size + 'px ' + font_family;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
    }

    private renderColumnLabels(model: OncoprintModel, ids: ColumnId[]) {
        // first clear
        this.column_label_ctx.fillStyle = 'rgba(0,0,0,0)';
        this.column_label_ctx.clearRect(
            0,
            0,
            this.$column_label_canvas[0].width,
            this.$column_label_canvas[0].height
        );
        this.maximum_column_label_width = 0;
        this.maximum_column_label_height = 0;

        // continue to rendering
        const labels = model.getColumnLabels();

        // dont do anything if theres no labels
        if (Object.keys(labels).length === 0) {
            return;
        }

        const origin_y = this.getColumnLabelY(model);
        const x_map = model.getZoomedColumnLeft();
        const scroll_x = this.scroll_x;
        const cell_width = model.getCellWidth();

        this.prepareContextForColumnLabelText(model, this.column_label_ctx);
        for (let i = 0; i < ids.length; i++) {
            const label = labels[ids[i]];
            let label_height =
                this.column_label_ctx.measureText('m').width /
                this.supersampling_ratio;
            if (label) {
                const origin_x =
                    (x_map[ids[i]] + cell_width / 2 - scroll_x) *
                    this.supersampling_ratio;
                if (label.circle_color) {
                    // draw circle if specified
                    this.column_label_ctx.save();
                    const circleSpec = this.getColumnLabelCircleSpec(model);
                    label_height = Math.max(
                        2 * circleSpec.radius,
                        label_height
                    );
                    this.column_label_ctx.translate(origin_x, origin_y);
                    this.column_label_ctx.fillStyle = label.circle_color;
                    this.column_label_ctx.beginPath();
                    this.column_label_ctx.arc(
                        0,
                        0,
                        this.supersampling_ratio * circleSpec.radius,
                        0,
                        2 * Math.PI
                    );
                    this.column_label_ctx.fill();
                    this.column_label_ctx.restore();
                }
                this.column_label_ctx.save();
                const text_angle = this.getColumnLabelAngleRadians(label);
                const left_padding =
                    ((label.left_padding_percent || 0) * cell_width) / 100;
                this.column_label_ctx.translate(origin_x, origin_y);
                this.column_label_ctx.rotate(text_angle);
                this.column_label_ctx.fillStyle =
                    label.text_color || 'rgba(0,0,0,1)';
                this.column_label_ctx.fillText(
                    label.text,
                    left_padding * this.supersampling_ratio,
                    0
                );
                const text_width =
                    this.column_label_ctx.measureText(label.text).width /
                    this.supersampling_ratio;

                this.maximum_column_label_width = Math.max(
                    this.maximum_column_label_width,
                    Math.cos(text_angle) * text_width
                );

                this.maximum_column_label_height = Math.max(
                    this.maximum_column_label_height,
                    Math.sin(text_angle) * text_width,
                    label_height
                );

                this.column_label_ctx.restore();
            }
        }
    }

    private getColumnLabelAngleRadians(label: ColumnLabel) {
        return (
            (ifndef(label.angle_in_degrees, COLUMN_LABEL_ANGLE) * Math.PI) / 180
        );
    }

    private getColumnLabelCircleSpec(model: OncoprintModel) {
        const radius = 0.9 * (model.getCellWidth() / 2);
        return { radius };
    }

    private ensureSimpleCountBuffer(model: OncoprintModel) {
        const numColumns = model.getIdOrder().length;
        if (
            !this.simple_count_buffer ||
            this.simple_count_buffer.numItems !== numColumns
        ) {
            const buffer = this.ctx.createBuffer() as OncoprintTrackBuffer;
            this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, buffer);
            this.ctx.bufferData(
                this.ctx.ARRAY_BUFFER,
                new Float32Array(_.range(0, numColumns)),
                this.ctx.STATIC_DRAW
            );
            buffer.itemSize = 1;
            buffer.numItems = numColumns;
            this.simple_count_buffer = buffer;
        }
    }

    private clearTrackPositionAndColorBuffers(
        model: OncoprintModel,
        track_id?: TrackId
    ) {
        let tracks_to_clear;
        if (typeof track_id === 'undefined') {
            tracks_to_clear = model.getTracks();
        } else {
            tracks_to_clear = [track_id];
        }
        for (let i = 0; i < tracks_to_clear.length; i++) {
            if (this.is_buffer_empty[tracks_to_clear[i]]) {
                this.is_buffer_empty[tracks_to_clear[i]].position = true;
                this.is_buffer_empty[tracks_to_clear[i]].color = true;
                this.is_buffer_empty[tracks_to_clear[i]].color_texture = true;
            }
        }
    }

    private clearTrackColumnBuffers(model: OncoprintModel, track_id?: TrackId) {
        let tracks_to_clear;
        if (typeof track_id === 'undefined') {
            tracks_to_clear = model.getTracks();
        } else {
            tracks_to_clear = [track_id];
        }
        for (let i = 0; i < tracks_to_clear.length; i++) {
            if (this.is_buffer_empty[tracks_to_clear[i]]) {
                this.is_buffer_empty[tracks_to_clear[i]].column = true;
            }
        }
    }

    private deleteBuffers(model: OncoprintModel, track_id?: TrackId) {
        let tracks_to_clear;
        if (typeof track_id === 'undefined') {
            tracks_to_clear = model.getTracks();
        } else {
            tracks_to_clear = [track_id];
        }
        for (let i = 0; i < tracks_to_clear.length; i++) {
            const track_id = tracks_to_clear[i];
            if (this.vertex_position_buffer[track_id]) {
                this.ctx.deleteBuffer(this.vertex_position_buffer[track_id]);
                delete this.vertex_position_buffer[track_id];
            }
            if (this.vertex_color_buffer[track_id]) {
                this.ctx.deleteBuffer(this.vertex_color_buffer[track_id]);
                delete this.vertex_color_buffer[track_id];
            }
            if (this.vertex_column_buffer[track_id]) {
                this.ctx.deleteBuffer(this.vertex_column_buffer[track_id]);
                delete this.vertex_column_buffer[track_id];
            }
            if (this.color_texture[track_id]) {
                this.ctx.deleteTexture(this.color_texture[track_id].texture);
                delete this.color_texture[track_id];
            }
            this.is_buffer_empty[track_id] = {
                position: true,
                color: true,
                color_texture: true,
                column: true,
            };
        }
    }

    private deleteSimpleCountBuffer(model: OncoprintModel) {
        if (this.simple_count_buffer) {
            this.ctx.deleteBuffer(this.simple_count_buffer);
            this.simple_count_buffer = null;
        }
    }

    private getTrackBuffers(track_id: TrackId) {
        this.is_buffer_empty[track_id] = this.is_buffer_empty[track_id] || {
            position: true,
            color: true,
            color_texture: true,
            column: true,
        };

        if (this.is_buffer_empty[track_id].position) {
            const pos_buffer =
                this.vertex_position_buffer[track_id] ||
                (this.ctx.createBuffer() as OncoprintVertexTrackBuffer);
            const pos_array = this.vertex_data[track_id].pos_array;
            const universal_shapes_start_index = this.vertex_data[track_id]
                .universal_shapes_start_index;

            this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, pos_buffer);
            this.ctx.bufferData(
                this.ctx.ARRAY_BUFFER,
                pos_array,
                this.ctx.STATIC_DRAW
            );
            pos_buffer.itemSize = 1;
            pos_buffer.specificShapesNumItems =
                universal_shapes_start_index / pos_buffer.itemSize;
            pos_buffer.universalShapesNumItems =
                (pos_array.length - universal_shapes_start_index) /
                pos_buffer.itemSize;

            this.vertex_position_buffer[track_id] = pos_buffer;
        }

        if (this.is_buffer_empty[track_id].color) {
            const col_buffer =
                this.vertex_color_buffer[track_id] ||
                (this.ctx.createBuffer() as OncoprintVertexTrackBuffer);
            const col_array = this.vertex_data[track_id].col_array;
            const universal_shapes_start_index = this.vertex_data[track_id]
                .universal_shapes_start_index;

            this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, col_buffer);
            this.ctx.bufferData(
                this.ctx.ARRAY_BUFFER,
                col_array,
                this.ctx.STATIC_DRAW
            );
            col_buffer.itemSize = 1;
            col_buffer.specificShapesNumItems =
                universal_shapes_start_index / col_buffer.itemSize;
            col_buffer.universalShapesNumItems =
                (col_array.length - universal_shapes_start_index) /
                col_buffer.itemSize;

            this.vertex_color_buffer[track_id] = col_buffer;
        }

        if (this.is_buffer_empty[track_id].color_texture) {
            const tex = this.color_texture[track_id]
                ? this.color_texture[track_id].texture
                : this.ctx.createTexture();
            this.ctx.bindTexture(this.ctx.TEXTURE_2D, tex);

            const color_bank = this.vertex_data[track_id].col_bank;
            const width = Math.pow(
                2,
                Math.ceil((Math as any).log2(color_bank.length / 4))
            );
            while (color_bank.length < 4 * width) {
                color_bank.push(0);
            }
            const height = 1;
            this.ctx.texImage2D(
                this.ctx.TEXTURE_2D,
                0,
                this.ctx.RGBA,
                width,
                height,
                0,
                this.ctx.RGBA,
                this.ctx.UNSIGNED_BYTE,
                new Uint8Array(color_bank)
            );
            this.ctx.texParameteri(
                this.ctx.TEXTURE_2D,
                this.ctx.TEXTURE_MIN_FILTER,
                this.ctx.NEAREST
            );
            this.ctx.texParameteri(
                this.ctx.TEXTURE_2D,
                this.ctx.TEXTURE_MAG_FILTER,
                this.ctx.NEAREST
            );
            this.color_texture[track_id] = { texture: tex, size: width };
        }

        if (this.is_buffer_empty[track_id].column) {
            const vertex_column_buffer =
                this.vertex_column_buffer[track_id] ||
                (this.ctx.createBuffer() as OncoprintTrackBuffer);
            const vertex_column_array = this.vertex_column_array[track_id];
            this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, vertex_column_buffer);
            this.ctx.bufferData(
                this.ctx.ARRAY_BUFFER,
                vertex_column_array,
                this.ctx.STATIC_DRAW
            );
            vertex_column_buffer.itemSize = 1;
            vertex_column_buffer.numItems =
                vertex_column_array.length / vertex_column_buffer.itemSize;

            this.vertex_column_buffer[track_id] = vertex_column_buffer;
        }
        this.is_buffer_empty[track_id] = {
            position: false,
            color: false,
            column: false,
            color_texture: false,
        };

        return {
            position: this.vertex_position_buffer[track_id],
            color: this.vertex_color_buffer[track_id],
            color_tex: this.color_texture[track_id],
            column: this.vertex_column_buffer[track_id],
        };
    }

    private computeVertexColumns(model: OncoprintModel, track_id: TrackId) {
        if (this.rendering_suppressed) {
            return;
        }
        const num_items = this.vertex_data[track_id].pos_array.length;
        const id_to_first_vertex_index = this.id_to_first_vertex_index[
            track_id
        ];
        const id_to_index = model.getVisibleIdToIndexMap();
        const id_and_first_vertex: [ColumnId, number][] = Object.keys(
            id_to_first_vertex_index
        )
            .map(function(id) {
                return [id, id_to_first_vertex_index[id]] as [ColumnId, number];
            })
            .sort(function(a, b) {
                return sgndiff(a[1], b[1]);
            });
        const vertex_column_array = new Float32Array(num_items);
        let vertex_index = 0;
        for (let i = 0; i < id_and_first_vertex.length; i++) {
            const num_to_add =
                (i === id_and_first_vertex.length - 1
                    ? num_items
                    : id_and_first_vertex[i + 1][1]) -
                id_and_first_vertex[i][1];
            const column = id_to_index[id_and_first_vertex[i][0]];
            for (let j = 0; j < num_to_add; j++) {
                vertex_column_array[vertex_index] = column;
                vertex_index += 1;
            }
        }
        this.vertex_column_array[track_id] = vertex_column_array;
        this.clearTrackColumnBuffers(model, track_id);
    }

    private computeVertexPositionsAndVertexColors(
        model: OncoprintModel,
        track_id: TrackId
    ) {
        if (this.rendering_suppressed) {
            return;
        }

        // check simple count buffer whenever we recompute vertexes
        this.ensureSimpleCountBuffer(model);

        const universal_shapes = this.universal_shapes[track_id];
        const id_to_index = model.getIdToIndexMap();
        const specific_shapes = _.sortBy(
            this.specific_shapes[track_id],
            o => id_to_index[o.id]
        );
        // Compute vertex array
        const num_vertexes =
            _.sumBy(specific_shapes, (shapeList: IdentifiedShapeList) => {
                return _.sumBy(shapeList.shape_list, getNumWebGLVertexes);
            }) +
            (universal_shapes
                ? _.sumBy(universal_shapes, getNumWebGLVertexes)
                : 0);
        const vertex_pos_array = new Float32Array(num_vertexes);
        const vertex_col_array = new Float32Array(num_vertexes);

        // original values dont mean anything but its faster to create an object with all the keys
        //  already in it than to slowly grow it
        const id_to_first_vertex_index: {
            [columnId: string]: number;
        } = _.clone(id_to_index);

        const color_vertexes: ColorVertex[] = [];
        const color_bank_index: { [colorHash: string]: ColorBankIndex } = {};

        const position_bit_pack_base = this.position_bit_pack_base;
        function packPos(posVertex: number[]) {
            // values must be in [0,255] (integer)
            return (
                position_bit_pack_base * position_bit_pack_base * posVertex[0] +
                position_bit_pack_base * posVertex[1] +
                posVertex[2]
            );
        }

        const vertexifiedShapes: {
            [shapeHash: string]: { position: number[]; color: number[] };
        } = {};
        let vertex_array_index = 0;

        function addShapeVertexes(_shape: ComputedShapeParams, zindex: number) {
            const hash = Shape.hashComputedShape(_shape, zindex);
            if (!(hash in vertexifiedShapes)) {
                vertexifiedShapes[hash] = { position: [], color: [] };
                const position = vertexifiedShapes[hash].position;
                const color = vertexifiedShapes[hash].color;
                shapeToVertexes(_shape, zindex, function(
                    pos: PositionVertex,
                    col: ColorVertex
                ) {
                    pos = pos.map(Math.round) as PositionVertex;

                    position.push(packPos(pos));

                    const col_hash = `${col[0]},${col[1]},${col[2]},${col[3]}`;
                    let col_index = color_bank_index[col_hash];
                    if (typeof col_index === 'undefined') {
                        col_index = color_vertexes.length;
                        color_vertexes.push(col);
                        color_bank_index[col_hash] = col_index;
                    }
                    color.push(col_index);
                });
            }
            const positionVertexes = vertexifiedShapes[hash].position;
            const colorVertexes = vertexifiedShapes[hash].color;
            for (let i = 0; i < positionVertexes.length; i++) {
                vertex_pos_array[vertex_array_index] = positionVertexes[i];
                vertex_col_array[vertex_array_index] = colorVertexes[i];
                vertex_array_index += 1;
            }
        }

        for (let i = 0; i < specific_shapes.length; i++) {
            const shape_list = specific_shapes[i].shape_list;
            const id = specific_shapes[i].id;

            id_to_first_vertex_index[id] = vertex_array_index;

            for (let j = 0; j < shape_list.length; j++) {
                const shape = shape_list[j];
                addShapeVertexes(shape, j);
            }
        }

        // record start index of universal shapes
        const universal_shapes_start_index = vertex_array_index;
        if (universal_shapes) {
            for (let j = 0; j < universal_shapes.length; j++) {
                const shape = universal_shapes[j];
                addShapeVertexes(shape, j);
            }
        }

        const color_bank: ColorBank = color_vertexes.reduce(function(
            arr,
            next
        ) {
            return arr.concat(next);
        },
        []);
        // minimum color bank to avoid webGL texture errors
        if (color_bank.length === 0) {
            color_bank.push(0, 0, 0, 0);
        }
        this.vertex_data[track_id] = {
            pos_array: vertex_pos_array,
            col_array: vertex_col_array,
            col_bank: color_bank,
            universal_shapes_start_index,
        };
        this.id_to_first_vertex_index[track_id] = id_to_first_vertex_index;

        this.clearTrackPositionAndColorBuffers(model, track_id);
    }

    private getShapes(model: OncoprintModel, track_id: TrackId) {
        if (this.rendering_suppressed) {
            return;
        }
        this.specific_shapes[track_id] = model.getSpecificShapesForData(
            track_id,
            true
        );
        this.universal_shapes[track_id] = model.getTrackUniversalShapes(
            track_id,
            true
        );
    }

    private refreshCanvas(model: OncoprintModel) {
        // whenever you get a new context, you have to get new buffers
        this.deleteBuffers(model);
        this.deleteSimpleCountBuffer(model);
        this.getNewCanvas();
        this.getWebGLContextAndSetUpMatrices();
        this.setUpShaders(model);
        this.ensureSimpleCountBuffer(model);
    }

    private highlightCell(
        model: OncoprintModel,
        track_id: TrackId,
        uid: ColumnId
    ) {
        this.overlayStrokeRect(
            model.getZoomedColumnLeft(uid) - this.scroll_x,
            model.getCellTops(track_id) - this.scroll_y,
            model.getCellWidth() +
                (model.getTrackHasColumnSpacing(track_id)
                    ? 0
                    : model.getCellPadding()),
            model.getCellHeight(track_id),
            'rgba(0,0,0,1)'
        );
    }

    private highlightTrack(model: OncoprintModel, track_id: TrackId) {
        const highlight_width =
            model.getCellWidth() +
            (model.getTrackHasColumnSpacing(track_id)
                ? 0
                : model.getCellPadding());
        const cell_height = model.getCellHeight(track_id);
        const uids = model.getIdOrder();
        const left = model.getZoomedColumnLeft();
        const top = model.getCellTops(track_id) - this.scroll_y;

        for (const uid of uids) {
            if (model.getTrackDatum(track_id, uid) !== null && uid in left) {
                this.overlayStrokeRect(
                    left[uid] - this.scroll_x,
                    top,
                    highlight_width,
                    cell_height,
                    CELL_HIGHLIGHT_STROKE
                );
            }
        }
    }

    private highlightColumn(model: OncoprintModel, uid: ColumnId) {
        const left = model.getZoomedColumnLeft(uid) - this.scroll_x;
        const cell_padding = model.getCellPadding();
        const cell_width = model.getCellWidth();
        const tracks = model.getTracks();
        for (let i = 0; i < tracks.length; i++) {
            if (model.getTrackDatum(tracks[i], uid) !== null) {
                this.overlayStrokeRect(
                    left,
                    model.getCellTops(tracks[i]) - this.scroll_y,
                    cell_width +
                        (model.getTrackHasColumnSpacing(tracks[i])
                            ? 0
                            : cell_padding),
                    model.getCellHeight(tracks[i]),
                    CELL_HIGHLIGHT_STROKE
                );
            }
        }
        this.overlayColumnLabelHighlight(model, uid);
    }

    public getViewportOncoprintSpace(model: OncoprintModel) {
        const scroll_y = this.scroll_y;
        const zoom_y = model.getVertZoom();

        const id_order = model.getIdOrder();
        const left_index = model.getClosestColumnIndexToLeft(
            this.scroll_x,
            true
        );
        const left_id = id_order[left_index];
        const right_index = model.getClosestColumnIndexToLeft(
            this.scroll_x + this.visible_area_width,
            true,
            true
        );

        let right;
        if (right_index < id_order.length) {
            right = model.getColumnLeft(id_order[right_index]);
        } else {
            right =
                model.getColumnLeft(id_order[id_order.length - 1]) +
                model.getCellWidth(true);
        }

        return {
            top: Math.round(scroll_y / zoom_y),
            bottom: Math.round(
                (scroll_y + this.getVisibleAreaHeight(model)) / zoom_y
            ),
            left: model.getColumnLeft(left_id),
            right,
            center_col_index: Math.floor((right_index + left_index) / 2),
        };
    }

    public isUsable() {
        return this.ctx !== null;
    }

    public removeTrack(model: OncoprintModel, track_id: TrackId) {
        this.deleteBuffers(model, track_id);

        delete this.specific_shapes[track_id];
        delete this.vertex_data[track_id];
        delete this.vertex_column_array[track_id];
        delete this.id_to_first_vertex_index[track_id];
        delete this.is_buffer_empty[track_id];
        delete this.universal_shapes[track_id];

        if (!this.rendering_suppressed) {
            this.renderAllTracks(model);
        }
    }

    public moveTrack(model: OncoprintModel) {
        if (!this.rendering_suppressed) {
            this.renderAllTracks(model);
        }
    }

    public setTrackGroupOrder(model: OncoprintModel) {
        if (!this.rendering_suppressed) {
            this.renderAllTracks(model);
        }
    }

    public setTrackShowGaps(model: OncoprintModel) {
        if (!this.rendering_suppressed) {
            // shader depends on gaps
            this.setUpShaders(model);
            this.renderAllTracks(model);
        }
    }

    public setColumnLabels(model: OncoprintModel) {
        if (!this.rendering_suppressed) {
            this.renderAllTracks(model);
        }
    }

    public addTracks(model: OncoprintModel, track_ids: TrackId[]) {
        if (this.rendering_suppressed) {
            return;
        }
        for (let i = 0; i < track_ids.length; i++) {
            this.getShapes(model, track_ids[i]);
            this.computeVertexPositionsAndVertexColors(model, track_ids[i]);
            this.computeVertexColumns(model, track_ids[i]);
        }
        this.renderAllTracks(model);
    }
    public setIdOrder(model: OncoprintModel, ids: ColumnId[]) {
        if (this.rendering_suppressed) {
            return;
        }
        const track_ids = model.getTracks();
        for (let i = 0; i < track_ids.length; i++) {
            this.computeVertexColumns(model, track_ids[i]);
        }
        this.renderAllTracks(model);
    }
    public setTrackGroupSortPriority(model: OncoprintModel) {
        if (this.rendering_suppressed) {
            return;
        }
        this.renderAllTracks(model);
    }
    public sort(model: OncoprintModel) {
        if (this.rendering_suppressed) {
            return;
        }
        const track_ids = model.getTracks();
        for (let i = 0; i < track_ids.length; i++) {
            this.computeVertexPositionsAndVertexColors(model, track_ids[i]); // need to recompute because the vertexes are in sorted order for clipping
            this.computeVertexColumns(model, track_ids[i]);
        }
        this.renderAllTracks(model);
    }
    public suppressRendering() {
        this.rendering_suppressed = true;
    }
    public releaseRendering(model: OncoprintModel) {
        this.rendering_suppressed = false;
        this.updateAntialiasSetting(model);
        const track_ids = model.getTracks();
        for (let i = 0; i < track_ids.length; i++) {
            this.getShapes(model, track_ids[i]);
            this.computeVertexPositionsAndVertexColors(model, track_ids[i]);
            this.computeVertexColumns(model, track_ids[i]);
        }
        this.setUpShaders(model); // due to possible changes in gaps
        this.renderAllTracks(model);
    }
    public hideIds(model: OncoprintModel) {
        if (this.rendering_suppressed) {
            return;
        }
        const track_ids = model.getTracks();
        for (let i = 0; i < track_ids.length; i++) {
            this.computeVertexColumns(model, track_ids[i]);
        }
        this.renderAllTracks(model);
    }
    public setTrackImportantIds(model: OncoprintModel, track_id: TrackId) {
        if (this.rendering_suppressed) {
            return;
        }
        this.getShapes(model, track_id);
        this.computeVertexPositionsAndVertexColors(model, track_id);
        this.computeVertexColumns(model, track_id);
        this.renderAllTracks(model);
    }
    public setTrackData(model: OncoprintModel, track_id: TrackId) {
        if (this.rendering_suppressed) {
            return;
        }
        this.getShapes(model, track_id);
        this.computeVertexPositionsAndVertexColors(model, track_id);
        this.computeVertexColumns(model, track_id);
        this.renderAllTracks(model);
    }
    public setRuleSet(model: OncoprintModel, target_track_id: TrackId) {
        if (this.rendering_suppressed) {
            return;
        }
        this.getShapes(model, target_track_id);
        this.computeVertexPositionsAndVertexColors(model, target_track_id);
        this.renderAllTracks(model);
    }
    public shareRuleSet(model: OncoprintModel, target_track_id: TrackId) {
        if (this.rendering_suppressed) {
            return;
        }
        this.getShapes(model, target_track_id);
        this.computeVertexPositionsAndVertexColors(model, target_track_id);
        this.renderAllTracks(model);
    }
    public setSortConfig(model: OncoprintModel) {
        if (this.rendering_suppressed) {
            return;
        }
        this.sort(model);
    }

    public setHorzScroll(model: OncoprintModel) {
        this.setScroll(model);
    }

    public setVertScroll(model: OncoprintModel) {
        this.setScroll(model);
    }

    public setScroll(model: OncoprintModel) {
        this.scroll_x = model.getHorzScroll();
        this.scroll_y = model.getVertScroll();
        if (!this.rendering_suppressed) {
            this.renderAllTracks(model, true);
        }
    }

    private updateAntialiasSetting(model: OncoprintModel) {
        const cell_width = model.getCellWidth();
        if (cell_width < this.antialias_on_cell_width_thresh) {
            if (!this.antialias) {
                this.antialias = true;
                this.refreshCanvas(model);
            }
        } else {
            if (this.antialias) {
                this.antialias = false;
                this.refreshCanvas(model);
            }
        }
    }

    public setZoom(model: OncoprintModel) {
        if (!this.rendering_suppressed) {
            this.updateAntialiasSetting(model);
            this.renderAllTracks(model);
        }
    }

    public setHorzZoom(model: OncoprintModel) {
        if (!this.rendering_suppressed) {
            this.updateAntialiasSetting(model);
            this.renderAllTracks(model);
        }
    }

    public setVertZoom(model: OncoprintModel) {
        if (this.rendering_suppressed) {
            return;
        }
        this.renderAllTracks(model);
    }

    public setTrackGroupHeader(model: OncoprintModel) {
        if (this.rendering_suppressed) {
            return;
        }
        this.renderAllTracks(model);
    }

    public setViewport(model: OncoprintModel) {
        this.scroll_x = model.getHorzScroll();
        this.scroll_y = model.getVertScroll();
        if (!this.rendering_suppressed) {
            this.updateAntialiasSetting(model);
            this.renderAllTracks(model);
        }
    }

    public getTotalWidth(model: OncoprintModel, base?: boolean) {
        let width = model.getOncoprintWidth(base);

        if (this.maximum_column_label_width > 0) {
            width += this.maximum_column_label_width;
        }

        return width;
    }

    public getVisibleAreaWidth() {
        return this.visible_area_width;
    }

    public setWidth(w: number, model: OncoprintModel) {
        this.visible_area_width = w;
        if (this.rendering_suppressed) {
            return;
        }
        this.renderAllTracks(model); // in the process it will call resizeAndClear
    }

    private getColumnLabelsHeight() {
        let height = 0;

        if (this.maximum_column_label_height > 0) {
            height += COLUMN_LABEL_MARGIN;
            height += this.maximum_column_label_height;
        }

        return height;
    }

    public getTotalHeight(model: OncoprintModel) {
        return model.getOncoprintHeight() + this.getColumnLabelsHeight();
    }

    public getVisibleAreaHeight(model: OncoprintModel) {
        return (
            Math.min(model.getOncoprintHeight(), model.max_height) +
            this.getColumnLabelsHeight()
        );
    }

    public setCellPaddingOn(model: OncoprintModel) {
        if (this.rendering_suppressed) {
            return;
        }
        const track_ids = model.getTracks();
        for (let i = 0; i < track_ids.length; i++) {
            if (!model.getTrackHasColumnSpacing(track_ids[i])) {
                // We need to recompute shapes for tracks that don't have column spacing,
                // because for those we're redefining the base width for shape generation.
                this.getShapes(model, track_ids[i]);
                this.computeVertexPositionsAndVertexColors(model, track_ids[i]);
            }
            this.computeVertexColumns(model, track_ids[i]);
        }
        this.renderAllTracks(model);
    }

    public setHighlightedIds(model: OncoprintModel) {
        this.clearOverlay();
        this.highlightHighlightedIds(model);
        this.highlightHighlightedTracks(model);
    }

    public setHighlightedTracks(model: OncoprintModel) {
        this.clearOverlay();
        this.highlightHighlightedIds(model);
        this.highlightHighlightedTracks(model);
    }

    public highlightHighlightedIds(
        model: OncoprintModel,
        opt_exclude_ids?: ColumnId[]
    ) {
        // Highlight highlighted ids
        const highlightedIds = model.getVisibleHighlightedIds();
        for (let i = 0; i < highlightedIds.length; i++) {
            if (
                !opt_exclude_ids ||
                opt_exclude_ids.indexOf(highlightedIds[i]) === -1
            ) {
                this.highlightColumn(model, highlightedIds[i]);
            }
        }
    }

    public highlightHighlightedTracks(model: OncoprintModel) {
        // Highlight highlighted ids
        const highlightedTracks = model.getHighlightedTracks();
        for (let i = 0; i < highlightedTracks.length; i++) {
            this.highlightTrack(model, highlightedTracks[i]);
        }
    }

    public getDummyScrollDivClientSize() {
        return this.dummy_scroll_div_client_size.get();
    }

    getGaps(model: OncoprintModel, track_id: number) {
        const custom = model.getTrackCustomOptions(track_id);
        return _.isEmpty(model.ids_after_a_gap.get())
            ? undefined
            : custom.find(t => !!t.gapLabelsFn)?.gapLabelsFn(model);
    }

    public toSVGGroup(
        model: OncoprintModel,
        offset_x: number,
        offset_y: number
    ) {
        const root = svgfactory.group(offset_x || 0, offset_y || 0);
        const cell_tops = model.getCellTops();
        const tracks = model.getTracks();
        const zoomedColumnLeft = model.getZoomedColumnLeft();
        // add cell shapes

        const gapOffsets = model.getGapOffsets();

        for (let i = 0; i < tracks.length; i++) {
            const track_id = tracks[i];
            const offset_y = cell_tops[track_id];
            const cell_height = model.getCellHeight(track_id);
            const universal_shapes = model.getTrackUniversalShapes(
                track_id,
                false
            );
            const identified_shape_list_list = model.getSpecificShapesForData(
                track_id,
                false
            );

            const custom = model.getTrackCustomOptions(track_id);
            if (gapOffsets[0]) {
                const gaps = _.isEmpty(model.ids_after_a_gap.get())
                    ? undefined
                    : custom.find(t => !!t.gapLabelsFn)?.gapLabelsFn(model);

                if (gaps) {
                    gaps.forEach((gap: any, i: number) => {
                        const textElt = makeSvgElement('text', {
                            x: gapOffsets[i] - model.getGapSize() + 25,
                            y: offset_y + cell_height - 3,
                            'font-size': '10',
                            'font-family': 'Arial',
                            'font-weight': 'normal',
                            'text-anchor': 'end',
                            'alignment-baseline': 'top',
                        });

                        textElt.textContent = gap.labelFormatter();
                        root.appendChild(textElt);
                    });
                }
            }

            for (let j = 0; j < identified_shape_list_list.length; j++) {
                const id_sl = identified_shape_list_list[j];
                const id = id_sl.id;
                const sl = id_sl.shape_list;
                const offset_x = zoomedColumnLeft[id];
                if (typeof offset_x === 'undefined') {
                    // hidden id
                    continue;
                }

                // draw universal shapes first
                for (let h = 0; h < universal_shapes.length; h++) {
                    root.appendChild(
                        svgfactory.fromShape(
                            universal_shapes[h],
                            offset_x,
                            offset_y
                        )
                    );
                }
                // next draw specific shapes
                for (let h = 0; h < sl.length; h++) {
                    root.appendChild(
                        svgfactory.fromShape(sl[h], offset_x, offset_y)
                    );
                }
            }
        }
        // add column labels
        const labels = model.getColumnLabels();
        const left = model.getZoomedColumnLeft();
        const ids_with_labels = Object.keys(labels);
        const column_label_y = model.getOncoprintHeight() + 10;
        const font_size = OncoprintWebGLCellView.getColumnLabelsFontSize(model);
        const cell_width = model.getCellWidth();
        for (let i = 0; i < ids_with_labels.length; i++) {
            const id = ids_with_labels[i];

            if (!(id in left)) {
                // skip hidden id
                continue;
            }

            const label = labels[id];

            const x = left[id] + cell_width / 2;
            if (label.circle_color) {
                // add circle
                const spec = this.getColumnLabelCircleSpec(model);
                root.appendChild(
                    makeSvgElement('ellipse', {
                        cx: x,
                        cy: column_label_y,
                        rx: spec.radius,
                        ry: spec.radius,
                        stroke: 'rgba(0,0,0,0)',
                        fill: label.circle_color,
                    })
                );
            }

            const text_x =
                x + ((label.left_padding_percent || 0) / 100) * cell_width;

            const angle = ifndef(label.angle_in_degrees, COLUMN_LABEL_ANGLE);
            const textElt = makeSvgElement('text', {
                x: text_x,
                y: column_label_y,
                fill: label.text_color || '#000000',
                'font-size': font_size,
                'font-family': 'Arial',
                'font-weight': 'normal',
                'text-anchor': 'start',
                transform:
                    'rotate(' +
                    angle +
                    ',' +
                    text_x +
                    ',' +
                    column_label_y +
                    ')',
                'alignment-baseline': 'middle',
            });

            textElt.textContent = label.text;
            root.appendChild(textElt);
        }

        return root;
    }

    public destroy() {
        this.$overlay_canvas.off(); // clear all handlers so that it can be garbage collected
        $(document).off('mousemove', this.mouseMoveHandler);
    }
}
