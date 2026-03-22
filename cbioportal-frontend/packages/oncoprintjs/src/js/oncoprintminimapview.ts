import gl_matrix from 'gl-matrix';
import OncoprintZoomSlider from './oncoprintzoomslider';
import $ from 'jquery';
import zoomToFitIcon from '../img/zoomtofit.svg';
import OncoprintModel, { ColumnIndex, TrackId } from './oncoprintmodel';
import OncoprintWebGLCellView, {
    OncoprintShaderProgram,
    OncoprintTrackBuffer,
    OncoprintVertexTrackBuffer,
    OncoprintWebGLContext,
} from './oncoprintwebglcellview';
import MouseMoveEvent = JQuery.MouseMoveEvent;
import { clamp, cloneShallow } from './utils';
import _ from 'lodash';

export type MinimapViewportSpec = {
    left_col: ColumnIndex; // leftmost col included in viewport
    right_col: ColumnIndex; // col at the boundary of viewport, first col to the right of viewport
    scroll_y_proportion: number; // between 0 and 1
    zoom_y: number; // between 0 and 1
};

type OverlayRectParams = {
    top: number;
    left_col: ColumnIndex;
    right_col: ColumnIndex;
    height: number;
};

class OverlayRectSpec {
    constructor(
        private params: OverlayRectParams,
        private getCellWidth: () => number
    ) {}

    public setParams(p: OverlayRectParams) {
        this.params = p;
    }

    public clone() {
        return new OverlayRectSpec(
            cloneShallow(this.params),
            this.getCellWidth
        );
    }

    public get left_col() {
        return this.params.left_col;
    }

    public get right_col() {
        return this.params.right_col;
    }

    public get top() {
        return this.params.top;
    }

    public get height() {
        return this.params.height;
    }

    public get num_cols() {
        return this.right_col - this.left_col;
    }

    public get left() {
        return this.left_col * this.getCellWidth();
    }

    public get right() {
        return this.right_col * this.getCellWidth();
    }

    public get width() {
        return this.right - this.left;
    }
}

export default class OncoprintMinimapView {
    private handleContextLost: () => void;
    private layout_numbers = {
        window_width: -1,
        window_height: -1,
        vertical_zoom_area_width: -1,
        horizontal_zoom_area_height: -1,
        padding: -1,
        window_bar_height: -1,
        canvas_left: -1,
        canvas_top: -1,
    };
    private current_rect: OverlayRectSpec;

    private $window_bar: JQuery;
    private $close_btn: JQuery;
    private horizontal_zoom: OncoprintZoomSlider;
    private vertical_zoom: OncoprintZoomSlider;

    private ctx: OncoprintWebGLContext | null;
    private ext: ANGLE_instanced_arrays | null;
    private overlay_ctx: CanvasRenderingContext2D | null;
    private pMatrix: any;
    private mvMatrix: any;
    private shader_program: OncoprintShaderProgram;

    private resize_hover:
        | 'r'
        | 'l'
        | 't'
        | 'b'
        | 'tl'
        | 'br'
        | 'bl'
        | 'tr'
        | false = false;

    private rendering_suppressed = false;
    private visible = false;

    constructor(
        private $div: JQuery,
        private $canvas: JQuery<HTMLCanvasElement>,
        private $overlay_canvas: JQuery<HTMLCanvasElement>,
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView,
        width: number,
        height: number,
        drag_callback: (x: number, y: number) => void,
        viewport_callback: (vp: MinimapViewportSpec) => void,
        horz_zoom_callback: (z: number) => void,
        vert_zoom_callback: (z: number) => void,
        zoom_to_fit_callback: () => void,
        close_callback: () => void
    ) {
        this.$div = $div;
        this.$canvas = $canvas;
        this.$overlay_canvas = $overlay_canvas;

        this.current_rect = new OverlayRectSpec(
            { top: 0, left_col: 0, right_col: 0, height: 0 },
            () => model.getCellWidth(true) * this.getZoom(model).x
        );

        const self = this;
        const padding = 4;
        const vertical_zoom_area_width = 20;
        const horizontal_zoom_area_height = 20;
        const window_bar_height = 20;

        this.handleContextLost = function() {
            // catch when context lost and refresh it
            // eg if cell view uses a ton of contexts, then browser clears oldest context,
            //	then the minimap would be empty until we refresh the context and rerender
            self.drawOncoprintAndOverlayRect(model, cell_view);
        }.bind(this);

        this.$canvas[0].addEventListener(
            'webglcontextlost',
            this.handleContextLost
        );

        this.layout_numbers = {
            window_width: padding + width + padding + vertical_zoom_area_width,
            window_height:
                window_bar_height +
                padding +
                height +
                padding +
                horizontal_zoom_area_height,
            vertical_zoom_area_width: vertical_zoom_area_width,
            horizontal_zoom_area_height: horizontal_zoom_area_height,
            padding: padding,
            window_bar_height: window_bar_height,
            canvas_left: padding,
            canvas_top: window_bar_height + padding,
        };

        this.$div.css({
            'min-width': this.layout_numbers.window_width,
            'min-height': this.layout_numbers.window_height,
            outline: 'solid 1px black',
            'background-color': '#ffffff',
        });

        this.$window_bar = $('<div>')
            .css({
                position: 'absolute',
                'min-width': this.layout_numbers.window_width,
                'min-height': this.layout_numbers.window_bar_height,
                'background-color': '#cccccc',
            })
            .appendTo(this.$div);

        this.$close_btn = $('<div>')
            .css({
                position: 'absolute',
                top: 3,
                left: 3,
                'min-width': this.layout_numbers.window_bar_height - 6,
                'min-height': this.layout_numbers.window_bar_height - 6,
                cursor: 'pointer',
            })
            .appendTo(this.$div);
        $('<span>')
            .addClass('icon fa fa-times-circle')
            .css('font-size', this.layout_numbers.window_bar_height - 6 + 'px')
            .appendTo(this.$close_btn);

        this.$close_btn.click(close_callback || function() {});

        this.$canvas[0].width = width;
        this.$canvas[0].height = height;
        this.$canvas.css({
            top: this.layout_numbers.canvas_top,
            left: this.layout_numbers.canvas_left,
        });
        this.$overlay_canvas[0].width = width;
        this.$overlay_canvas[0].height = width;
        this.$overlay_canvas.css({
            top: this.layout_numbers.canvas_top,
            left: this.layout_numbers.canvas_left,
            outline: 'solid 1px #444444',
        });

        this.horizontal_zoom = new OncoprintZoomSlider(this.$div, {
            btn_size: this.layout_numbers.horizontal_zoom_area_height - padding,
            horizontal: true,
            width: width,
            init_val: model.getHorzZoom(),
            left: padding,
            top: this.layout_numbers.canvas_top + height + padding,
            onChange: function(val) {
                horz_zoom_callback(val);
            },
        });
        this.vertical_zoom = new OncoprintZoomSlider(this.$div, {
            btn_size: this.layout_numbers.vertical_zoom_area_width - padding,
            vertical: true,
            height: height,
            init_val: model.getVertZoom(),
            left: this.layout_numbers.canvas_left + width + padding,
            top: this.layout_numbers.window_bar_height + padding,
            onChange: function(val) {
                vert_zoom_callback(val);
            },
        });

        (function setUpZoomToFitButton() {
            const btn_height =
                self.layout_numbers.horizontal_zoom_area_height - padding;
            const btn_width =
                self.layout_numbers.vertical_zoom_area_width - padding;
            const $btn = $('<div>')
                .css({
                    position: 'absolute',
                    height: btn_height,
                    width: btn_width,
                    outline: 'solid 1px black',
                    left: self.layout_numbers.canvas_left + width + padding,
                    top: self.layout_numbers.canvas_top + height + padding,
                    cursor: 'pointer',
                })
                .addClass('oncoprint-zoomtofit-btn')
                .appendTo($div);
            $(`<img src="${zoomToFitIcon}" alt="Zoom to Fit Icon" />`)
                .css({
                    height: btn_height - 4,
                    width: btn_width - 4,
                    'margin-top': -6,
                    'margin-left': 2,
                })
                .appendTo($btn);
            $btn.hover(
                function() {
                    $(this).css({ 'background-color': '#cccccc' });
                },
                function() {
                    $(this).css({ 'background-color': '#ffffff' });
                }
            );

            zoom_to_fit_callback = zoom_to_fit_callback || function() {};
            $btn.click(zoom_to_fit_callback);
        })();
        this.getWebGLContextAndSetUpMatrices();
        this.setUpShaders();
        this.overlay_ctx = $overlay_canvas[0].getContext('2d');

        // Set up dragging
        const resize_hit_zone = 5;
        function mouseInRectDragZone(x: number, y: number) {
            return (
                x >= self.current_rect.left + resize_hit_zone &&
                x <=
                    self.current_rect.left +
                        self.current_rect.width -
                        resize_hit_zone &&
                y >= self.current_rect.top + resize_hit_zone &&
                y <=
                    self.current_rect.top +
                        self.current_rect.height -
                        resize_hit_zone
            );
        }

        function mouseInsideRectHitZone(x: number, y: number) {
            return (
                x >= self.current_rect.left - resize_hit_zone &&
                x <=
                    self.current_rect.left +
                        self.current_rect.width +
                        resize_hit_zone &&
                y >= self.current_rect.top - resize_hit_zone &&
                y <=
                    self.current_rect.top +
                        self.current_rect.height +
                        resize_hit_zone
            );
        }

        function mouseInRightHorzResizeZone(x: number, y: number) {
            return (
                !mouseInTopLeftResizeZone(x, y) &&
                !mouseInTopRightResizeZone(x, y) &&
                !mouseInBottomLeftResizeZone(x, y) &&
                !mouseInBottomRightResizeZone(x, y) &&
                mouseInsideRectHitZone(x, y) &&
                Math.abs(
                    x - (self.current_rect.left + self.current_rect.width)
                ) < resize_hit_zone
            );
        }

        function mouseInLeftHorzResizeZone(x: number, y: number) {
            return (
                !mouseInTopLeftResizeZone(x, y) &&
                !mouseInTopRightResizeZone(x, y) &&
                !mouseInBottomLeftResizeZone(x, y) &&
                !mouseInBottomRightResizeZone(x, y) &&
                mouseInsideRectHitZone(x, y) &&
                Math.abs(x - self.current_rect.left) < resize_hit_zone
            );
        }

        function mouseInTopVertResizeZone(x: number, y: number) {
            return (
                !mouseInTopLeftResizeZone(x, y) &&
                !mouseInTopRightResizeZone(x, y) &&
                !mouseInBottomLeftResizeZone(x, y) &&
                !mouseInBottomRightResizeZone(x, y) &&
                mouseInsideRectHitZone(x, y) &&
                Math.abs(y - self.current_rect.top) < resize_hit_zone
            );
        }

        function mouseInBottomVertResizeZone(x: number, y: number) {
            return (
                !mouseInTopLeftResizeZone(x, y) &&
                !mouseInTopRightResizeZone(x, y) &&
                !mouseInBottomLeftResizeZone(x, y) &&
                !mouseInBottomRightResizeZone(x, y) &&
                mouseInsideRectHitZone(x, y) &&
                Math.abs(
                    y - (self.current_rect.top + self.current_rect.height)
                ) < resize_hit_zone
            );
        }

        function mouseInTopLeftResizeZone(x: number, y: number) {
            return (
                Math.abs(y - self.current_rect.top) < resize_hit_zone &&
                Math.abs(x - self.current_rect.left) < resize_hit_zone
            );
        }

        function mouseInBottomLeftResizeZone(x: number, y: number) {
            return (
                Math.abs(
                    y - (self.current_rect.top + self.current_rect.height)
                ) < resize_hit_zone &&
                Math.abs(x - self.current_rect.left) < resize_hit_zone
            );
        }

        function mouseInTopRightResizeZone(x: number, y: number) {
            return (
                Math.abs(y - self.current_rect.top) < resize_hit_zone &&
                Math.abs(
                    x - (self.current_rect.left + self.current_rect.width)
                ) < resize_hit_zone
            );
        }

        function mouseInBottomRightResizeZone(x: number, y: number) {
            return (
                Math.abs(
                    y - (self.current_rect.top + self.current_rect.height)
                ) < resize_hit_zone &&
                Math.abs(
                    x - (self.current_rect.left + self.current_rect.width)
                ) < resize_hit_zone
            );
        }

        function updateRectResizeHoverLocation(x?: number, y?: number) {
            if (typeof x === 'undefined') {
                self.resize_hover = false;
            } else {
                if (mouseInRightHorzResizeZone(x, y)) {
                    self.resize_hover = 'r';
                } else if (mouseInLeftHorzResizeZone(x, y)) {
                    self.resize_hover = 'l';
                } else if (mouseInTopVertResizeZone(x, y)) {
                    self.resize_hover = 't';
                } else if (mouseInBottomVertResizeZone(x, y)) {
                    self.resize_hover = 'b';
                } else if (mouseInTopLeftResizeZone(x, y)) {
                    self.resize_hover = 'tl';
                } else if (mouseInBottomRightResizeZone(x, y)) {
                    self.resize_hover = 'br';
                } else if (mouseInBottomLeftResizeZone(x, y)) {
                    self.resize_hover = 'bl';
                } else if (mouseInTopRightResizeZone(x, y)) {
                    self.resize_hover = 'tr';
                } else {
                    self.resize_hover = false;
                }
            }
        }

        function updateCSSCursor(x?: number, y?: number) {
            let cursor_val;
            if (typeof x === 'undefined') {
                cursor_val = 'auto';
            } else {
                if (mouseInRectDragZone(x, y)) {
                    cursor_val = 'move';
                } else if (
                    mouseInRightHorzResizeZone(x, y) ||
                    mouseInLeftHorzResizeZone(x, y)
                ) {
                    cursor_val = 'ew-resize';
                } else if (
                    mouseInTopVertResizeZone(x, y) ||
                    mouseInBottomVertResizeZone(x, y)
                ) {
                    cursor_val = 'ns-resize';
                } else if (
                    mouseInTopLeftResizeZone(x, y) ||
                    mouseInBottomRightResizeZone(x, y)
                ) {
                    cursor_val = 'nwse-resize';
                } else if (
                    mouseInBottomLeftResizeZone(x, y) ||
                    mouseInTopRightResizeZone(x, y)
                ) {
                    cursor_val = 'nesw-resize';
                } else {
                    cursor_val = 'auto';
                }
            }
            $div.css('cursor', cursor_val);
        }

        function getCanvasMouse(
            view: OncoprintMinimapView,
            div_mouse_x: number,
            div_mouse_y: number
        ) {
            const canv_top = parseInt(view.$canvas[0].style.top, 10);
            const canv_left = parseInt(view.$canvas[0].style.left, 10);
            const canv_width = parseInt(view.$canvas[0].width as any, 10);
            const canv_height = parseInt(view.$canvas[0].height as any, 10);

            const mouse_x = div_mouse_x - canv_left;
            const mouse_y = div_mouse_y - canv_top;

            const outside =
                mouse_x < 0 ||
                mouse_x >= canv_width ||
                mouse_y < 0 ||
                mouse_y >= canv_height;

            return { mouse_x: mouse_x, mouse_y: mouse_y, outside: outside };
        }

        let dragging = false;
        let drag_type:
            | 'move'
            | 'resize_r'
            | 'resize_l'
            | 'resize_b'
            | 'resize_t'
            | 'resize_tr'
            | 'resize_br'
            | 'resize_tl'
            | 'resize_bl'
            | false = false;
        let drag_start_col = -1;
        let drag_start_vert_scroll = -1;
        let drag_start_x = -1;
        let drag_start_y = -1;
        let drag_start_vert_zoom = -1;
        let y_ratio = -1;
        let drag_start_rect: OverlayRectSpec;

        $(document).on('mousedown', function(evt) {
            const offset = self.$div.offset();
            const overlay_mouse_x = evt.pageX - offset.left;
            const overlay_mouse_y = evt.pageY - offset.top;
            const mouse = getCanvasMouse(
                self,
                overlay_mouse_x,
                overlay_mouse_y
            );

            if (!mouse.outside) {
                const mouse_x = mouse.mouse_x;
                const mouse_y = mouse.mouse_y;
                dragging = false;
                drag_type = false;

                y_ratio =
                    model.getOncoprintHeight() /
                    parseInt(self.$canvas[0].height as any, 10);
                if (mouseInRectDragZone(mouse_x, mouse_y)) {
                    drag_type = 'move';
                } else if (mouseInRightHorzResizeZone(mouse_x, mouse_y)) {
                    drag_type = 'resize_r';
                } else if (mouseInLeftHorzResizeZone(mouse_x, mouse_y)) {
                    drag_type = 'resize_l';
                } else if (mouseInTopVertResizeZone(mouse_x, mouse_y)) {
                    drag_type = 'resize_t';
                } else if (mouseInBottomVertResizeZone(mouse_x, mouse_y)) {
                    drag_type = 'resize_b';
                } else if (mouseInTopRightResizeZone(mouse_x, mouse_y)) {
                    drag_type = 'resize_tr';
                } else if (mouseInBottomRightResizeZone(mouse_x, mouse_y)) {
                    drag_type = 'resize_br';
                } else if (mouseInTopLeftResizeZone(mouse_x, mouse_y)) {
                    drag_type = 'resize_tl';
                } else if (mouseInBottomLeftResizeZone(mouse_x, mouse_y)) {
                    drag_type = 'resize_bl';
                }
                if (drag_type !== false) {
                    dragging = true;
                    drag_start_x = mouse_x;
                    drag_start_y = mouse_y;
                    drag_start_col = model.getClosestColumnIndexToLeft(
                        model.getHorzScroll(),
                        true
                    );
                    drag_start_vert_scroll = model.getVertScroll();
                    drag_start_vert_zoom = model.getVertZoom();
                    drag_start_rect = self.current_rect.clone();
                }
            }
        });
        $(document).on('mousemove', function(evt) {
            const offset = self.$div.offset();
            const overlay_mouse_x = evt.pageX - offset.left;
            const overlay_mouse_y = evt.pageY - offset.top;
            const mouse = getCanvasMouse(
                self,
                overlay_mouse_x,
                overlay_mouse_y
            );
            const mouse_x = mouse.mouse_x;
            const mouse_y = mouse.mouse_y;
            let zoom = self.getZoom(model);
            let cell_width = model.getCellWidth(true) * zoom.x;
            if (dragging) {
                evt.preventDefault();
                let delta_col =
                    Math.floor(mouse_x / cell_width) -
                    Math.floor(drag_start_x / cell_width);
                let delta_y = mouse_y - drag_start_y;
                if (drag_type === 'move') {
                    const delta_y_scroll = delta_y * y_ratio;
                    drag_callback(
                        self.colToLeft(
                            model,
                            clamp(
                                drag_start_col + delta_col,
                                0,
                                model.getIdOrder().length - 1
                            )
                        ),
                        drag_start_vert_scroll + delta_y_scroll
                    );
                } else {
                    let render_rect: OverlayRectParams;
                    zoom = self.getZoom(model);
                    const max_num_cols = model.getIdOrder().length;
                    const min_num_cols = Math.ceil(
                        cell_view.getVisibleAreaWidth() /
                            (model.getCellWidth(true) +
                                model.getCellPadding(true, true))
                    );
                    const max_height = model.getOncoprintHeight(true) * zoom.y;
                    const min_height =
                        cell_view.getVisibleAreaHeight(model) * zoom.y;
                    const drag_start_right_col = drag_start_rect.right_col;
                    const drag_start_bottom =
                        drag_start_rect.top + drag_start_rect.height;
                    if (drag_type === 'resize_r') {
                        // Width must be valid
                        delta_col = clamp(
                            delta_col,
                            min_num_cols - drag_start_rect.num_cols,
                            max_num_cols - drag_start_rect.num_cols
                        );
                        // Right must be valid
                        delta_col = Math.min(
                            delta_col,
                            max_num_cols - drag_start_right_col
                        );
                        render_rect = {
                            top: drag_start_rect.top,
                            left_col: drag_start_rect.left_col,
                            right_col: drag_start_rect.right_col + delta_col,
                            height: drag_start_rect.height,
                        };
                    } else if (drag_type === 'resize_l') {
                        // Width must be valid
                        delta_col = clamp(
                            delta_col,
                            drag_start_rect.num_cols - max_num_cols,
                            drag_start_rect.num_cols - min_num_cols
                        );
                        // Left must be valid
                        delta_col = Math.max(
                            delta_col,
                            -drag_start_rect.left_col
                        );
                        render_rect = {
                            top: drag_start_rect.top,
                            left_col: drag_start_rect.left_col + delta_col,
                            right_col: drag_start_rect.right_col,
                            height: drag_start_rect.height,
                        };
                    } else if (drag_type === 'resize_t') {
                        // Height must be valid
                        delta_y = clamp(
                            delta_y,
                            drag_start_rect.height - max_height,
                            drag_start_rect.height - min_height
                        );
                        // Top must be valid
                        delta_y = Math.max(delta_y, -drag_start_rect.top);
                        render_rect = {
                            top: drag_start_rect.top + delta_y,
                            left_col: drag_start_rect.left_col,
                            right_col: drag_start_rect.right_col,
                            height: drag_start_rect.height - delta_y,
                        };
                    } else if (drag_type === 'resize_b') {
                        // Height must be valid
                        delta_y = clamp(
                            delta_y,
                            min_height - drag_start_rect.height,
                            max_height - drag_start_rect.height
                        );
                        // Bottom must be valid
                        delta_y = Math.min(
                            delta_y,
                            max_height - drag_start_bottom
                        );
                        render_rect = {
                            top: drag_start_rect.top,
                            left_col: drag_start_rect.left_col,
                            right_col: drag_start_rect.right_col,
                            height: drag_start_rect.height + delta_y,
                        };
                    } else if (drag_type === 'resize_tr') {
                        // Width must be valid
                        delta_col = clamp(
                            delta_col,
                            min_num_cols - drag_start_rect.num_cols,
                            max_num_cols - drag_start_rect.num_cols
                        );
                        // Right must be valid
                        delta_col = Math.min(
                            delta_col,
                            max_num_cols - drag_start_right_col
                        );
                        // Height must be valid
                        delta_y = clamp(
                            delta_y,
                            drag_start_rect.height - max_height,
                            drag_start_rect.height - min_height
                        );
                        // Top must be valid
                        delta_y = Math.max(delta_y, -drag_start_rect.top);
                        render_rect = {
                            top: drag_start_rect.top + delta_y,
                            left_col: drag_start_rect.left_col,
                            right_col: drag_start_rect.right_col + delta_col,
                            height: drag_start_rect.height - delta_y,
                        };
                    } else if (drag_type === 'resize_tl') {
                        // Width must be valid
                        delta_col = clamp(
                            delta_col,
                            drag_start_rect.num_cols - max_num_cols,
                            drag_start_rect.num_cols - min_num_cols
                        );
                        // Left must be valid
                        delta_col = Math.max(
                            delta_col,
                            -drag_start_rect.left_col
                        );
                        // Height must be valid
                        delta_y = clamp(
                            delta_y,
                            drag_start_rect.height - max_height,
                            drag_start_rect.height - min_height
                        );
                        // Top must be valid
                        delta_y = Math.max(delta_y, -drag_start_rect.top);
                        render_rect = {
                            top: drag_start_rect.top + delta_y,
                            left_col: drag_start_rect.left_col + delta_col,
                            right_col: drag_start_rect.right_col,
                            height: drag_start_rect.height - delta_y,
                        };
                    } else if (drag_type === 'resize_br') {
                        // Height must be valid
                        delta_y = clamp(
                            delta_y,
                            min_height - drag_start_rect.height,
                            max_height - drag_start_rect.height
                        );
                        // Bottom must be valid
                        delta_y = Math.min(
                            delta_y,
                            max_height - drag_start_bottom
                        );
                        // Width must be valid
                        delta_col = clamp(
                            delta_col,
                            min_num_cols - drag_start_rect.num_cols,
                            max_num_cols - drag_start_rect.num_cols
                        );
                        // Right must be valid
                        delta_col = Math.min(
                            delta_col,
                            max_num_cols - drag_start_right_col
                        );
                        render_rect = {
                            top: drag_start_rect.top,
                            left_col: drag_start_rect.left_col,
                            right_col: drag_start_rect.right_col + delta_col,
                            height: drag_start_rect.height + delta_y,
                        };
                    } else if (drag_type === 'resize_bl') {
                        // Height must be valid
                        delta_y = clamp(
                            delta_y,
                            min_height - drag_start_rect.height,
                            max_height - drag_start_rect.height
                        );
                        // Bottom must be valid
                        delta_y = Math.min(
                            delta_y,
                            max_height - drag_start_bottom
                        );
                        // Width must be valid
                        delta_col = clamp(
                            delta_col,
                            drag_start_rect.num_cols - max_num_cols,
                            drag_start_rect.num_cols - min_num_cols
                        );
                        // Left must be valid
                        delta_col = Math.max(
                            delta_col,
                            -drag_start_rect.left_col
                        );
                        render_rect = {
                            top: drag_start_rect.top,
                            left_col: drag_start_rect.left_col + delta_col,
                            right_col: drag_start_rect.right_col,
                            height: drag_start_rect.height + delta_y,
                        };
                    }
                    self.current_rect.setParams(render_rect);
                    self.drawOverlayRect(null, null, self.current_rect);
                }
            } else {
                if (mouse.outside) {
                    updateCSSCursor();
                    updateRectResizeHoverLocation();
                } else {
                    updateCSSCursor(mouse_x, mouse_y);
                    updateRectResizeHoverLocation(mouse_x, mouse_y);
                }
                self.drawOverlayRect(model, cell_view);
            }
        });

        function endDrag() {
            if (dragging) {
                if (
                    [
                        'resize_t',
                        'resize_b',
                        'resize_l',
                        'resize_r',
                        'resize_tl',
                        'resize_tr',
                        'resize_bl',
                        'resize_br',
                    ].indexOf(drag_type as any) > -1
                ) {
                    viewport_callback({
                        left_col: self.current_rect.left_col,
                        scroll_y_proportion:
                            self.current_rect.top /
                            parseInt(self.$canvas[0].height as any, 10),
                        right_col: self.current_rect.right_col,
                        zoom_y:
                            (drag_start_rect.height /
                                self.current_rect.height) *
                            drag_start_vert_zoom,
                    });
                }
                dragging = false;
                drag_type = false;
            }
        }

        $(document).on('mouseup', function(evt) {
            const offset = self.$div.offset();
            const overlay_mouse_x = evt.pageX - offset.left;
            const overlay_mouse_y = evt.pageY - offset.top;
            endDrag();
            const mouse = getCanvasMouse(
                self,
                overlay_mouse_x,
                overlay_mouse_y
            );
            if (!mouse.outside) {
                let mouse_x = mouse.mouse_x;
                let mouse_y = mouse.mouse_y;
                updateCSSCursor(mouse_x, mouse_y);
                updateRectResizeHoverLocation(mouse_x, mouse_y);
            } else {
                updateCSSCursor();
                updateRectResizeHoverLocation();
            }
            self.drawOverlayRect(model, cell_view);
        });

        (function setUpWindowDrag() {
            let start_mouse_x = 0;
            let start_mouse_y = 0;
            let start_left = 0;
            let start_top = 0;
            function handleDrag(evt: MouseMoveEvent) {
                evt.preventDefault();
                const delta_mouse_x = evt.pageX - start_mouse_x;
                const delta_mouse_y = evt.pageY - start_mouse_y;
                self.setWindowPosition(
                    start_left + delta_mouse_x,
                    start_top + delta_mouse_y
                );
            }
            self.$window_bar.hover(
                function() {
                    $(this).css({ cursor: 'move' });
                },
                function() {
                    $(this).css({ cursor: 'auto' });
                }
            );

            self.$window_bar.on('mousedown', function(evt) {
                start_mouse_x = evt.pageX;
                start_mouse_y = evt.pageY;
                start_left = parseInt(self.$div.css('left'), 10);
                start_top = parseInt(self.$div.css('top'), 10);
                $(document).on('mousemove', handleDrag);
            });
            $(document).on('mouseup click', function() {
                $(document).off('mousemove', handleDrag);
            });
        })();
    }

    private colToLeft(model: OncoprintModel, colIndex: number) {
        return model.getZoomedColumnLeft(model.getIdOrder()[colIndex]);
    }

    private get shouldRender() {
        return this.visible && !this.rendering_suppressed;
    }

    private getNewCanvas() {
        const old_canvas = this.$canvas[0];
        old_canvas.removeEventListener(
            'webglcontextlost',
            this.handleContextLost
        );
        const new_canvas = old_canvas.cloneNode();
        new_canvas.addEventListener('webglcontextlost', this.handleContextLost);
        const parent_node = old_canvas.parentNode;
        parent_node.removeChild(old_canvas);
        parent_node.insertBefore(new_canvas, this.$overlay_canvas[0]);
        this.$canvas = $(new_canvas) as JQuery<HTMLCanvasElement>;
        this.ctx = null;
        this.ext = null;
    }

    private getWebGLCanvasContext() {
        try {
            const canvas = this.$canvas[0];
            const ctx =
                this.ctx ||
                (canvas.getContext('experimental-webgl', {
                    alpha: false,
                    antialias: true,
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

    private ensureWebGLContext() {
        for (let i = 0; i < 5; i++) {
            if (!this.ctx || this.ctx.isContextLost()) {
                // have to get a new canvas when context is lost by browser
                this.getNewCanvas();
                this.ctx = this.getWebGLCanvasContext();
                this.setUpShaders();
            } else {
                break;
            }
        }
        if (!this.ctx || this.ctx.isContextLost()) {
            throw new Error(
                'Unable to get WebGL context for Oncoprint Minimap'
            );
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

    private getWebGLContextAndSetUpMatrices() {
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

    private setUpShaders() {
        const vertex_shader_source = [
            'precision highp float;',
            'attribute float aPosVertex;',
            'attribute float aColVertex;',
            'attribute float aVertexOncoprintColumn;',
            'uniform float columnWidth;',
            'uniform float zoomX;',
            'uniform float zoomY;',
            'uniform mat4 uMVMatrix;',
            'uniform mat4 uPMatrix;',
            'uniform float offsetY;',
            'uniform float positionBitPackBase;',
            'uniform float texSize;',
            'varying float texCoord;',
            'vec3 unpackVec3(float packedVec3, float base) {',
            '	float pos0 = floor(packedVec3 / (base*base));',
            '	float pos0Contr = pos0*base*base;',
            '	float pos1 = floor((packedVec3 - pos0Contr)/base);',
            '	float pos1Contr = pos1*base;',
            '	float pos2 = packedVec3 - pos0Contr - pos1Contr;',
            '	return vec3(pos0, pos1, pos2);',
            '}',
            'void main(void) {',
            '	gl_Position = vec4(unpackVec3(aPosVertex, positionBitPackBase), 1.0);',
            '	gl_Position[0] += aVertexOncoprintColumn*columnWidth;',
            '	gl_Position[1] += offsetY;',
            '	gl_Position *= vec4(zoomX, zoomY, 1.0, 1.0);',
            '	gl_Position = uPMatrix * uMVMatrix * gl_Position;',
            '	texCoord = (aColVertex + 0.5) / texSize;',
            '}',
        ].join('\n');
        const fragment_shader_source = [
            'precision mediump float;',
            'varying float texCoord;',
            'uniform sampler2D uSampler;',
            'void main(void) {',
            '   gl_FragColor = texture2D(uSampler, vec2(texCoord, 0.5));',
            '}',
        ].join('\n');
        const vertex_shader = this.createShader(
            vertex_shader_source,
            'VERTEX_SHADER'
        );
        const fragment_shader = this.createShader(
            fragment_shader_source,
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

    private getTrackBuffers(
        cell_view: OncoprintWebGLCellView,
        track_id: TrackId
    ) {
        const pos_buffer = this.ctx.createBuffer() as OncoprintVertexTrackBuffer;
        const pos_array = cell_view.vertex_data[track_id].pos_array;
        const universal_shapes_start_index =
            cell_view.vertex_data[track_id].universal_shapes_start_index;

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

        const col_buffer = this.ctx.createBuffer() as OncoprintVertexTrackBuffer;
        const col_array = cell_view.vertex_data[track_id].col_array;

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

        const tex = this.ctx.createTexture();
        this.ctx.bindTexture(this.ctx.TEXTURE_2D, tex);

        const color_bank = cell_view.vertex_data[track_id].col_bank;
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

        const color_texture = { texture: tex, size: width };

        const vertex_column_buffer = this.ctx.createBuffer() as OncoprintTrackBuffer;
        const vertex_column_array = cell_view.vertex_column_array[track_id];
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, vertex_column_buffer);
        this.ctx.bufferData(
            this.ctx.ARRAY_BUFFER,
            new Float32Array(vertex_column_array),
            this.ctx.STATIC_DRAW
        );
        vertex_column_buffer.itemSize = 1;
        vertex_column_buffer.numItems =
            vertex_column_array.length / vertex_column_buffer.itemSize;

        return {
            position: pos_buffer,
            color: col_buffer,
            color_tex: color_texture,
            column: vertex_column_buffer,
        };
    }

    private getSimpleCountBuffer(model: OncoprintModel) {
        const numColumns = model.getIdOrder().length;
        const buffer = this.ctx.createBuffer() as OncoprintTrackBuffer;
        this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, buffer);
        this.ctx.bufferData(
            this.ctx.ARRAY_BUFFER,
            new Float32Array(_.range(0, numColumns)),
            this.ctx.STATIC_DRAW
        );
        buffer.itemSize = 1;
        buffer.numItems = numColumns;
        return buffer;
    }

    private drawOncoprint(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        if (!this.shouldRender) {
            return;
        }

        this.ensureWebGLContext();

        const zoom = this.getZoom(model);

        this.ctx.clearColor(1.0, 1.0, 1.0, 1.0);
        this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT);

        const tracks = model.getTracks();
        const simple_count_buffer = this.getSimpleCountBuffer(model);
        for (let i = 0; i < tracks.length; i++) {
            const track_id = tracks[i];
            const cell_top = model.getCellTops(track_id, true);
            const buffers = this.getTrackBuffers(cell_view, track_id);
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
                        simple_count_buffer
                    );
                    this.ctx.vertexAttribPointer(
                        shader_program.vertexOncoprintColumnAttribute,
                        1,
                        this.ctx.FLOAT,
                        false,
                        0,
                        0
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
                this.ctx.uniform1i(this.shader_program.samplerUniform, 0);
                this.ctx.uniform1f(
                    this.shader_program.texSizeUniform,
                    buffers.color_tex.size
                );

                this.ctx.uniformMatrix4fv(
                    this.shader_program.pMatrixUniform,
                    false,
                    this.pMatrix
                );
                this.ctx.uniformMatrix4fv(
                    this.shader_program.mvMatrixUniform,
                    false,
                    this.mvMatrix
                );
                this.ctx.uniform1f(
                    this.shader_program.columnWidthUniform,
                    model.getCellWidth(true)
                );
                this.ctx.uniform1f(this.shader_program.zoomXUniform, zoom.x);
                this.ctx.uniform1f(this.shader_program.zoomYUniform, zoom.y);
                this.ctx.uniform1f(
                    this.shader_program.offsetYUniform,
                    cell_top
                );
                this.ctx.uniform1f(
                    this.shader_program.positionBitPackBaseUniform,
                    cell_view.position_bit_pack_base
                );

                if (forSpecificShapes) {
                    this.ctx.drawArrays(
                        this.ctx.TRIANGLES,
                        0,
                        buffers.position.specificShapesNumItems
                    );
                } else {
                    this.ext.drawArraysInstancedANGLE(
                        this.ctx.TRIANGLES,
                        0,
                        buffers.position.itemSize *
                            buffers.position.universalShapesNumItems,
                        simple_count_buffer.numItems
                    );
                }
            }
            this.ctx.flush();
        }
    }

    private getZoom(model: OncoprintModel) {
        let zoom_x =
            parseInt(this.$canvas[0].width as any, 10) /
            model.getOncoprintWidthNoColumnPaddingNoGaps();
        let zoom_y =
            parseInt(this.$canvas[0].height as any, 10) /
            model.getOncoprintHeight(true);
        zoom_x = Math.max(0, Math.min(1, zoom_x));
        zoom_y = Math.max(0, Math.min(1, zoom_y));
        return {
            x: zoom_x,
            y: zoom_y,
        };
    }

    private drawOverlayRect(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView,
        opt_rect?: OverlayRectSpec
    ) {
        if (!this.shouldRender) {
            return;
        }

        let left, width, top, height, left_col, right_col;
        if (opt_rect) {
            left = opt_rect.left;
            width = opt_rect.width;
            top = opt_rect.top;
            height = opt_rect.height;
            left_col = opt_rect.left_col;
            right_col = opt_rect.right_col;
        } else {
            const cell_width = model.getCellWidth(true);
            const cell_padding = model.getCellPadding(true);
            const viewport = cell_view.getViewportOncoprintSpace(model);

            const zoom = this.getZoom(model);
            left_col = model.getClosestColumnIndexToLeft(viewport.left, false);
            right_col = model.getClosestColumnIndexToLeft(
                viewport.right,
                false,
                true
            );
            left = left_col * cell_width * zoom.x;
            width = (right_col - left_col) * cell_width * zoom.x;
            top = viewport.top * zoom.y;
            height = (viewport.bottom - viewport.top) * zoom.y;
        }

        const ctx = this.overlay_ctx;
        const canv = this.$overlay_canvas[0];
        const canv_width = parseInt(canv.width as any, 10);
        const canv_height = parseInt(canv.height as any, 10);

        // Clear
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.clearRect(0, 0, canv_width, canv_height);
        // Draw rectangle
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(left, top, width, height);
        // Draw border line by line
        const unhover_color = 'rgba(0,0,0,0.75)';
        const hover_color = 'rgba(255,0,0,1)';
        const unhover_width = 1;
        const hover_width = 2;
        const top_is_hovered =
            this.resize_hover === 't' ||
            this.resize_hover === 'tr' ||
            this.resize_hover === 'tl';
        const right_is_hovered =
            this.resize_hover === 'r' ||
            this.resize_hover === 'tr' ||
            this.resize_hover === 'br';
        const bottom_is_hovered =
            this.resize_hover === 'b' ||
            this.resize_hover === 'br' ||
            this.resize_hover === 'bl';
        const left_is_hovered =
            this.resize_hover === 'l' ||
            this.resize_hover === 'tl' ||
            this.resize_hover === 'bl';
        // Draw top border
        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.strokeStyle = top_is_hovered ? hover_color : unhover_color;
        ctx.lineWidth = top_is_hovered ? hover_width : unhover_width;
        ctx.lineTo(left + width, top);
        ctx.stroke();
        // Draw right border
        ctx.beginPath();
        ctx.moveTo(left + width, top);
        ctx.strokeStyle = right_is_hovered ? hover_color : unhover_color;
        ctx.lineWidth = right_is_hovered ? hover_width : unhover_width;
        ctx.lineTo(left + width, top + height);
        ctx.stroke();
        // Draw bottom border
        ctx.beginPath();
        ctx.moveTo(left + width, top + height);
        ctx.strokeStyle = bottom_is_hovered ? hover_color : unhover_color;
        ctx.lineWidth = bottom_is_hovered ? hover_width : unhover_width;
        ctx.lineTo(left, top + height);
        ctx.stroke();
        // Draw left border
        ctx.beginPath();
        ctx.moveTo(left, top + height);
        ctx.strokeStyle = left_is_hovered ? hover_color : unhover_color;
        ctx.lineWidth = left_is_hovered ? hover_width : unhover_width;
        ctx.lineTo(left, top);
        ctx.stroke();

        this.current_rect.setParams({
            top: top,
            left_col: left_col,
            right_col: right_col,
            height: height,
        });
    }

    private drawOncoprintAndOverlayRect(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        if (!this.shouldRender) {
            return;
        }
        this.drawOncoprint(model, cell_view);
        this.drawOverlayRect(model, cell_view);
    }

    // API BEGINS HERE

    public moveTrack(model: OncoprintModel, cell_view: OncoprintWebGLCellView) {
        this.drawOncoprintAndOverlayRect(model, cell_view);
    }
    public addTracks(model: OncoprintModel, cell_view: OncoprintWebGLCellView) {
        this.drawOncoprintAndOverlayRect(model, cell_view);
    }
    public removeTrack(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        this.drawOncoprintAndOverlayRect(model, cell_view);
    }
    public setHorzZoom(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        this.drawOverlayRect(model, cell_view);
        this.horizontal_zoom.setSliderValue(model.getHorzZoom());
    }
    public setVertZoom(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        this.drawOverlayRect(model, cell_view);
        this.vertical_zoom.setSliderValue(model.getVertZoom());
    }
    public setZoom(model: OncoprintModel, cell_view: OncoprintWebGLCellView) {
        this.drawOverlayRect(model, cell_view);
        this.horizontal_zoom.setSliderValue(model.getHorzZoom());
        this.vertical_zoom.setSliderValue(model.getVertZoom());
    }
    public setScroll(model: OncoprintModel, cell_view: OncoprintWebGLCellView) {
        this.drawOverlayRect(model, cell_view);
    }
    public setHorzScroll(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        this.drawOverlayRect(model, cell_view);
    }
    public setVertScroll(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        this.drawOverlayRect(model, cell_view);
    }
    public setViewport(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        this.drawOverlayRect(model, cell_view);
        this.horizontal_zoom.setSliderValue(model.getHorzZoom());
        this.vertical_zoom.setSliderValue(model.getVertZoom());
    }
    public sort(model: OncoprintModel, cell_view: OncoprintWebGLCellView) {
        this.drawOncoprintAndOverlayRect(model, cell_view);
    }
    public setTrackData(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        this.drawOncoprintAndOverlayRect(model, cell_view);
    }
    public shareRuleSet(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        this.drawOncoprintAndOverlayRect(model, cell_view);
    }
    public setRuleSet(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        this.drawOncoprintAndOverlayRect(model, cell_view);
    }
    public setIdOrder(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        this.drawOncoprintAndOverlayRect(model, cell_view);
    }
    public setTrackGroupHeader(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        this.drawOncoprintAndOverlayRect(model, cell_view);
    }
    public suppressRendering() {
        this.rendering_suppressed = true;
    }
    public releaseRendering(
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        this.rendering_suppressed = false;
        this.drawOncoprintAndOverlayRect(model, cell_view);
    }
    public hideIds(model: OncoprintModel, cell_view: OncoprintWebGLCellView) {
        this.drawOncoprintAndOverlayRect(model, cell_view);
    }

    public setMinimapVisible(
        visible: boolean,
        model?: OncoprintModel,
        cell_view?: OncoprintWebGLCellView
    ) {
        this.visible = visible;

        if (this.visible && model && cell_view) {
            this.drawOncoprintAndOverlayRect(model, cell_view);
        }
    }

    public setWindowPosition(x: number, y: number) {
        this.$div.css({ top: y, left: x });
    }

    public setWidth(
        w: number,
        model: OncoprintModel,
        cell_view: OncoprintWebGLCellView
    ) {
        this.$canvas[0].width = w;
        this.$overlay_canvas[0].width = w;
        this.getWebGLContextAndSetUpMatrices();
        this.setUpShaders();
        this.overlay_ctx = this.$overlay_canvas[0].getContext('2d');

        this.drawOncoprintAndOverlayRect(model, cell_view);
    }
}
