import './polyfill';

import OncoprintModel, {
    ColumnId,
    ColumnLabel,
    ColumnProp,
    CustomTrackOption,
    Datum,
    GAP_MODE_ENUM,
    LibraryTrackSpec,
    SortConfig,
    TrackGroupHeader,
    TrackGroupIndex,
    TrackId,
    TrackSortDirection,
    TrackSortSpecification,
    TrackTooltipFn,
    UserTrackSpec,
} from './oncoprintmodel';
import OncoprintWebGLCellView from './oncoprintwebglcellview';
import OncoprintLabelView from './oncoprintlabelview';
import OncoprintRuleSet, { RuleSetParams } from './oncoprintruleset';
import OncoprintTrackOptionsView from './oncoprinttrackoptionsview';
import OncoprintLegendView from './oncoprintlegendrenderer';
import OncoprintToolTip from './oncoprinttooltip';
import OncoprintTrackInfoView from './oncoprinttrackinfoview';
import OncoprintMinimapView, {
    MinimapViewportSpec,
} from './oncoprintminimapview';

import svgfactory from './svgfactory';

import $ from 'jquery';
import { clamp } from './utils';
import OncoprintHeaderView from './oncoprintheaderview';

export type InitParams = {
    init_cell_width?: number;
    init_cell_padding?: number;
    cell_padding_off_cell_width_threshold?: number;
    init_horz_zoom?: number;
    init_vert_zoom?: number;
    init_track_group_padding?: number;
    init_cell_padding_on?: boolean;
    max_height?: number;
};

export type HorzZoomCallback = (zoom: number) => void;
export type MinimapCloseCallback = () => void;
export type CellMouseOverCallback = (
    uid: ColumnId | null,
    track_id?: TrackId
) => void;
export type CellClickCallback = (
    uid: ColumnId | null,
    track_id?: TrackId
) => void;
export type ClipboardChangeCallback = (ids: ColumnId[]) => void;

const nextTrackId = (function() {
    let ctr = 0;
    return function() {
        ctr += 1;
        return ctr;
    };
})();

export default class Oncoprint {
    // this is the controller

    private lastSortId = 0;
    private incrementLastSortId() {
        this.lastSortId = (this.lastSortId + 1) % 1000000; // make sure we don't have any overflow problems. Definitely won't have a million sorts pending at once
    }

    public destroyed: boolean;
    public webgl_unavailable: boolean;
    private $ctr: JQuery;
    private $oncoprint_ctr: JQuery;
    private $cell_div: JQuery;
    private $header_div: JQuery;
    private $legend_div: JQuery;
    private $track_options_div: JQuery;
    private $track_info_div: JQuery;
    private $dummy_scroll_div: JQuery;
    private $minimap_div: JQuery;
    private $cell_canvas: JQuery;
    private $cell_overlay_canvas: JQuery;

    public model: OncoprintModel;
    public header_view: OncoprintHeaderView;
    public cell_view: OncoprintWebGLCellView;
    public minimap_view: OncoprintMinimapView;
    public track_options_view: OncoprintTrackOptionsView;
    public track_info_view: OncoprintTrackInfoView;
    public label_view: OncoprintLabelView;
    public legend_view: OncoprintLegendView;

    private keep_horz_zoomed_to_fit: boolean;
    private keep_horz_zoomed_to_fit_ids: ColumnId[];
    private pending_resize_and_organize: boolean;

    private horz_zoom_callbacks: HorzZoomCallback[];
    private minimap_close_callbacks: MinimapCloseCallback[];
    private cell_mouse_over_callbacks: CellMouseOverCallback[];
    private cell_click_callbacks: CellClickCallback[];
    private id_clipboard: ColumnId[];
    private clipboard_change_callbacks: ClipboardChangeCallback[];

    private target_dummy_scroll_left: number;
    private target_dummy_scroll_top: number;

    private getCellViewHeight = () =>
        this.cell_view.getVisibleAreaHeight(this.model);

    constructor(
        private ctr_selector: string,
        private width: number,
        params?: InitParams
    ) {
        params = params || {};

        const self = this;

        this.destroyed = false;
        this.webgl_unavailable =
            document
                .createElement('canvas')
                .getContext('experimental-webgl') === null;
        if (this.webgl_unavailable) {
            $(ctr_selector).append(
                "<p class='oncoprintjs__webgl_unavailable_message'>WebGL context cannot be retrieved, so oncoprint cannot be used. Please visit <a href='http://webglreport.com'>WebGL Report</a> to explore your browsers WebGL capabilities.</p>"
            );
            return;
        }

        const $ctr = $('<span></span>')
            .css({ position: 'relative', display: 'inline-block' })
            .appendTo(ctr_selector);
        const $oncoprint_ctr = $('<div></div>')
            .css({ position: 'absolute', display: 'inline-block' })
            .appendTo($ctr);

        const $tooltip_ctr = $('<span></span>')
            .css({ position: 'fixed', top: 0, left: 0, 'z-index': 99999 })
            .appendTo(ctr_selector);
        const $legend_ctr = $('<div></div>')
            .css({
                position: 'absolute',
                display: 'inline-block',
                top: 0,
                left: 0,
                'min-height': 1,
            })
            .appendTo($ctr);

        const $label_canvas = $('<canvas></canvas>')
            .css({
                display: 'inline-block',
                position: 'absolute',
                left: '0px',
                top: '0px',
            })
            .addClass('noselect')
            .attr({ width: '150', height: '250' }) as JQuery<HTMLCanvasElement>;

        const $header_div = $('<div></div>')
            .css({ position: 'absolute' })
            .addClass('oncoprintjs__header_div');

        const $track_options_div = $('<div></div>')
            .css({ position: 'absolute', left: '150px', top: '0px' })
            .addClass('noselect')
            .attr({ width: '50', height: '250' });

        const $legend_div = $('<div></div>')
            .css({ position: 'absolute', top: '250px', 'min-height': 1 })
            .addClass('noselect oncoprint-legend-div');

        const $cell_div = $('<div>')
            .css({
                width: width,
                display: 'inline-block',
                position: 'absolute',
                left: '200px',
                top: '0px',
            })
            .addClass('noselect');

        const $cell_canvas = $('<canvas></canvas>')
            .attr({ width: '0px', height: '0px' })
            .css({ position: 'absolute', top: '0px', left: '0px' })
            .addClass('noselect') as JQuery<HTMLCanvasElement>;

        const $gap_canvas = $('<canvas></canvas>')
            .attr({ width: '0px', height: '0px' })
            .css({ position: 'absolute', top: '0px', left: '0px' })
            .addClass('noselect gap_canvas') as JQuery<HTMLCanvasElement>;

        const $dummy_scroll_div = $('<div>')
            .css({
                position: 'absolute',
                'overflow-x': 'scroll',
                'overflow-y': 'scroll',
                top: '0',
                left: '0px',
                height: '1px',
            })
            .addClass('oncoprintjs__scroll_div');

        const $dummy_scroll_div_contents = $('<div>').appendTo(
            $dummy_scroll_div
        );

        const $cell_overlay_canvas = $('<canvas></canvas>')
            .attr({ width: '0px', height: '0px' })
            .css({ position: 'absolute', top: '0px', left: '0px' })
            .addClass('noselect')
            .addClass('oncoprintjs__cell_overlay_div') as JQuery<
            HTMLCanvasElement
        >;

        const $column_label_canvas = $('<canvas></canvas>')
            .attr({ width: '0px', height: '0px' })
            .css({
                position: 'absolute',
                top: '0px',
                left: '0px',
                'pointer-events': 'none', // since column label canvas is on top of cell overlay canvas, we need to make it not capture any mouse events
            })
            .addClass('noselect')
            .addClass('oncoprintjs__column_label_canvas') as JQuery<
            HTMLCanvasElement
        >;

        const $track_info_div = $('<div>').css({ position: 'absolute' });

        const $minimap_div = $('<div>')
            .css({
                position: 'absolute',
                outline: 'solid 1px black',
                display: 'none',
            })
            .addClass('noselect');

        const $minimap_canvas = $('<canvas></canvas>')
            .attr('width', 300)
            .attr('height', 300)
            .css({
                position: 'absolute',
                top: '0px',
                left: '0px',
                'z-index': 0,
            })
            .addClass('noselect') as JQuery<HTMLCanvasElement>;
        const $minimap_overlay_canvas = $('<canvas></canvas>')
            .attr('width', 300)
            .attr('height', 300)
            .css({
                position: 'absolute',
                top: '0px',
                left: '0px',
                'z-index': 1,
            })
            .addClass('noselect') as JQuery<HTMLCanvasElement>;

        $label_canvas.appendTo($oncoprint_ctr);
        $cell_div.appendTo($oncoprint_ctr);
        $track_options_div.appendTo($oncoprint_ctr);
        $track_info_div.appendTo($oncoprint_ctr);
        $header_div.appendTo($oncoprint_ctr); // this needs to go at the end because otherwise canvases cover it up

        $legend_div.appendTo($legend_ctr);

        $minimap_div.appendTo($ctr);

        $cell_canvas.appendTo($cell_div);
        $gap_canvas.appendTo($cell_div);
        $cell_overlay_canvas.appendTo($cell_div);
        $column_label_canvas.appendTo($cell_div); // column labels should show above the overlay canvas because the text should show over the highlights
        $dummy_scroll_div.appendTo($cell_div);
        $dummy_scroll_div.on('mousemove mousedown mouseup', function(evt) {
            $cell_overlay_canvas.trigger(evt);
        });
        $minimap_canvas.appendTo($minimap_div);
        $minimap_overlay_canvas.appendTo($minimap_div);

        this.$ctr = $ctr;
        this.$oncoprint_ctr = $oncoprint_ctr;
        this.$header_div = $header_div;
        this.$cell_div = $cell_div;
        this.$legend_div = $legend_div;
        this.$track_options_div = $track_options_div;
        this.$track_info_div = $track_info_div;
        this.$dummy_scroll_div = $dummy_scroll_div;
        this.$minimap_div = $minimap_div;

        this.$cell_canvas = $cell_canvas;
        this.$cell_overlay_canvas = $cell_overlay_canvas;

        this.model = new OncoprintModel(params);

        this.header_view = new OncoprintHeaderView(this.$header_div);

        this.cell_view = new OncoprintWebGLCellView(
            $cell_div,
            $cell_canvas,
            $cell_overlay_canvas,
            $gap_canvas,
            $column_label_canvas,
            $dummy_scroll_div_contents,
            this.model,
            new OncoprintToolTip($tooltip_ctr),
            function(left, right) {
                const enclosed_ids = self.model.getIdsInZoomedLeftInterval(
                    left,
                    right
                );
                self.setHorzZoom(
                    self.model.getHorzZoomToFit(
                        self.cell_view.getVisibleAreaWidth(),
                        enclosed_ids
                    )
                );
                self.$dummy_scroll_div.scrollLeft(
                    self.model.getZoomedColumnLeft(enclosed_ids[0])
                );
            },
            function(uid, track_id) {
                self.doCellMouseOver(uid, track_id);
            },
            function(uid, track_id) {
                self.doCellClick(uid, track_id);
            }
        );

        this.minimap_view = new OncoprintMinimapView(
            $minimap_div,
            $minimap_canvas,
            $minimap_overlay_canvas,
            this.model,
            this.cell_view,
            150,
            150,
            function(x, y) {
                self.setScroll(x, y);
            },
            function(vp: MinimapViewportSpec) {
                self.setViewport(vp);
            },
            function(val: number) {
                self.setHorzZoomCentered(val);
            },
            function(val: number) {
                // Save unzoomed vertical center pre-zoom
                const prev_viewport = self.cell_view.getViewportOncoprintSpace(
                    self.model
                );
                const center_onc_space =
                    (prev_viewport.top + prev_viewport.bottom) / 2;

                // Execute zoom
                self.setVertZoom(val);

                // Set scroll to recenter the vertical center
                const viewport = self.cell_view.getViewportOncoprintSpace(
                    self.model
                );
                const half_viewport_height_zoomed =
                    (self.model.getVertZoom() *
                        (viewport.bottom - viewport.top)) /
                    2;

                self.setVertScroll(
                    center_onc_space * self.model.getVertZoom() -
                        half_viewport_height_zoomed
                );
            },
            function() {
                self.updateHorzZoomToFit();
                const left = self.model.getZoomedColumnLeft();
                self.setHorzScroll(
                    Math.min.apply(
                        null,
                        self.keep_horz_zoomed_to_fit_ids.map(function(id) {
                            return left[id];
                        })
                    )
                );
            },
            function() {
                self.setMinimapVisible(false);
            }
        );

        this.track_options_view = new OncoprintTrackOptionsView(
            $track_options_div,
            function(track_id: TrackId) {
                // move up
                const tracks = self.model.getContainingTrackGroup(track_id);
                const index = tracks.indexOf(track_id);
                if (index > 0) {
                    let new_previous_track = null;
                    if (index >= 2) {
                        new_previous_track = tracks[index - 2];
                    }
                    self.moveTrack(track_id, new_previous_track);
                }
            },
            function(track_id: TrackId) {
                // move down
                const tracks = self.model.getContainingTrackGroup(track_id);
                const index = tracks.indexOf(track_id);
                if (index < tracks.length - 1) {
                    self.moveTrack(track_id, tracks[index + 1]);
                }
            },
            function(track_id: TrackId) {
                const callback = self.model.getTrackRemoveOptionCallback(
                    track_id
                );
                if (callback) {
                    callback(track_id);
                } else {
                    self.removeTrack(track_id);
                }
            },
            function(track_id, dir) {
                self.setTrackSortDirection(track_id, dir);
            },
            function(track_id: TrackId) {
                self.removeExpansionTracksFor(track_id);
            },
            self.setTrackShowGaps.bind(self)
        );
        this.track_info_view = new OncoprintTrackInfoView(
            $track_info_div,
            new OncoprintToolTip($tooltip_ctr)
        );

        //this.track_info_view = new OncoprintTrackInfoView($track_info_div);

        this.label_view = new OncoprintLabelView(
            $label_canvas,
            this.model,
            new OncoprintToolTip($tooltip_ctr, { noselect: true })
        );
        this.label_view.setDragCallback(function(
            target_track,
            new_previous_track
        ) {
            self.moveTrack(target_track, new_previous_track);
        });

        this.legend_view = new OncoprintLegendView($legend_div, 10, 20);

        this.keep_horz_zoomed_to_fit = false;
        this.keep_horz_zoomed_to_fit_ids = [];

        // We need to handle scrolling this way because for some reason huge
        //  canvas elements have terrible resolution.

        this.target_dummy_scroll_left = 0;
        this.target_dummy_scroll_top = 0;

        (function setUpOncoprintScroll(oncoprint) {
            $dummy_scroll_div.scroll(function(e) {
                const dummy_scroll_left = $dummy_scroll_div.scrollLeft();
                const dummy_scroll_top = $dummy_scroll_div.scrollTop();
                if (
                    dummy_scroll_left !== self.target_dummy_scroll_left ||
                    dummy_scroll_top !== self.target_dummy_scroll_top
                ) {
                    // In setDummyScrollDivScroll, where we intend to set the scroll programmatically without
                    //	triggering the handler, we set target_dummy_scroll_left and target_dummy_scroll_top,
                    //	so if they're not set (we get inside this block), then it's a user-triggered scroll.
                    //
                    // Set oncoprint scroll to match
                    self.target_dummy_scroll_left = dummy_scroll_left;
                    self.target_dummy_scroll_top = dummy_scroll_top;
                    const maximum_dummy_scroll_div_scroll = oncoprint.maxDummyScrollDivScroll();
                    const maximum_div_scroll_left =
                        maximum_dummy_scroll_div_scroll.left;
                    const maximum_div_scroll_top =
                        maximum_dummy_scroll_div_scroll.top;
                    let scroll_left_prop =
                        maximum_div_scroll_left > 0
                            ? dummy_scroll_left / maximum_div_scroll_left
                            : 0;
                    let scroll_top_prop =
                        maximum_div_scroll_top > 0
                            ? dummy_scroll_top / maximum_div_scroll_top
                            : 0;
                    scroll_left_prop = clamp(scroll_left_prop, 0, 1);
                    scroll_top_prop = clamp(scroll_top_prop, 0, 1);
                    const maximum_scroll_left = oncoprint.maxOncoprintScrollLeft();
                    const maximum_scroll_top = oncoprint.maxOncoprintScrollTop();
                    const scroll_left = Math.round(
                        maximum_scroll_left * scroll_left_prop
                    );
                    const scroll_top = Math.round(
                        maximum_scroll_top * scroll_top_prop
                    );
                    self.keep_horz_zoomed_to_fit = false;

                    oncoprint.doSetScroll(scroll_left, scroll_top);
                }
            });
        })(self);

        this.horz_zoom_callbacks = [];
        this.minimap_close_callbacks = [];
        this.cell_mouse_over_callbacks = [];
        this.cell_click_callbacks = [];

        this.id_clipboard = [];
        this.clipboard_change_callbacks = [];

        this.pending_resize_and_organize = false;
    }

    private _SetLegendTop() {
        if (this.model.rendering_suppressed_depth > 0) {
            return;
        }
        this.$legend_div.css({
            top: this.cell_view.getVisibleAreaHeight(this.model) + 30,
        });
    }
    private setLegendTopAfterTimeout() {
        if (this.model.rendering_suppressed_depth > 0) {
            return;
        }
        const self = this;
        setTimeout(function() {
            self.setHeight();
            self._SetLegendTop();
        }, 0);
    }

    private setHeight() {
        this.$ctr.css({
            'min-height':
                this.cell_view.getVisibleAreaHeight(this.model) +
                Math.max(
                    this.$legend_div.outerHeight(),
                    this.$minimap_div.is(':visible')
                        ? this.$minimap_div.outerHeight()
                        : 0
                ) +
                30,
        });
    }

    private resizeAndOrganize(onComplete?: () => void) {
        if (this.model.rendering_suppressed_depth > 0) {
            return;
        }
        const ctr_width = $(this.ctr_selector).width();
        if (ctr_width === 0) {
            // dont make any adjustments while oncoprint is offscreen, DOM size calculations would be messed up
            this.pending_resize_and_organize = true;
            return;
        }
        this.$track_options_div.css({ left: this.label_view.getWidth() });
        this.$header_div.css({
            left: 0,
            top: 0,
            width: this.width,
            height: this.cell_view.getVisibleAreaHeight(this.model),
        });
        this.$track_info_div.css({
            left:
                this.label_view.getWidth() + this.track_options_view.getWidth(),
        });
        const cell_div_left =
            this.label_view.getWidth() +
            this.track_options_view.getWidth() +
            this.track_info_view.getWidth();
        this.$cell_div.css('left', cell_div_left);
        this.cell_view.setWidth(this.width - cell_div_left - 20, this.model);

        this._SetLegendTop();
        this.legend_view.setWidth(
            this.width - this.$minimap_div.outerWidth() - 20,
            this.model
        );

        this.setHeight();
        this.$ctr.css({ 'min-width': this.width });

        const self = this;
        setTimeout(function() {
            if (self.keep_horz_zoomed_to_fit) {
                self.updateHorzZoomToFit();
            }
            onComplete && onComplete();
        }, 0);
    }

    private resizeAndOrganizeAfterTimeout(onComplete?: () => void) {
        if (this.model.rendering_suppressed_depth > 0) {
            return;
        }
        const self = this;
        setTimeout(function() {
            self.resizeAndOrganize(onComplete);
        }, 0);
    }

    private maxOncoprintScrollLeft() {
        return Math.max(
            0,
            this.cell_view.getTotalWidth(this.model) -
                this.cell_view.getVisibleAreaWidth()
        );
    }

    private maxOncoprintScrollTop() {
        return Math.max(
            0,
            this.cell_view.getTotalHeight(this.model) -
                this.cell_view.getVisibleAreaHeight(this.model)
        );
    }

    private maxDummyScrollDivScroll() {
        const dummy_scroll_div_client_size = this.cell_view.getDummyScrollDivClientSize();
        const maximum_div_scroll_left = Math.max(
            0,
            this.$dummy_scroll_div[0].scrollWidth -
                dummy_scroll_div_client_size.width
        );
        const maximum_div_scroll_top = Math.max(
            0,
            this.$dummy_scroll_div[0].scrollHeight -
                dummy_scroll_div_client_size.height
        );
        return { left: maximum_div_scroll_left, top: maximum_div_scroll_top };
    }

    public setMinimapVisible(visible: boolean) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        if (visible) {
            this.$minimap_div.css({
                display: 'block',
                top: 0,
                left:
                    $(this.ctr_selector).width() -
                    this.$minimap_div.outerWidth() -
                    10,
            });
            this.minimap_view.setMinimapVisible(
                true,
                this.model,
                this.cell_view
            );
        } else {
            this.$minimap_div.css('display', 'none');
            this.minimap_view.setMinimapVisible(false);
            this.executeMinimapCloseCallbacks();
        }
        this.resizeAndOrganizeAfterTimeout();
    }

    public scrollTo(left: number) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.$dummy_scroll_div.scrollLeft(left);
    }
    public onHorzZoom(callback: HorzZoomCallback) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.horz_zoom_callbacks.push(callback);
    }
    public onMinimapClose(callback: MinimapCloseCallback) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.minimap_close_callbacks.push(callback);
    }

    // methods that propagate/delegate to views
    public moveTrack(target_track: TrackId, new_previous_track: TrackId) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.moveTrack(target_track, new_previous_track);
        this.cell_view.moveTrack(this.model);
        this.header_view.render(this.model);
        this.label_view.moveTrack(this.model, this.getCellViewHeight);
        this.track_options_view.moveTrack(this.model, this.getCellViewHeight);
        this.track_info_view.moveTrack(this.model, this.getCellViewHeight);
        this.minimap_view.moveTrack(this.model, this.cell_view);

        if (
            this.model.keep_sorted &&
            this.model.isSortAffected(
                [target_track, new_previous_track],
                'track'
            )
        ) {
            this.sort();
        }

        this.resizeAndOrganizeAfterTimeout();
    }
    public setTrackGroupOrder(
        index: TrackGroupIndex,
        track_order: TrackId[],
        dont_sort?: boolean
    ) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackGroupOrder(index, track_order);
        this.cell_view.setTrackGroupOrder(this.model);
        this.header_view.render(this.model);
        this.label_view.setTrackGroupOrder(this.model, this.getCellViewHeight);
        this.track_options_view.setTrackGroupOrder(this.model);
        this.track_info_view.setTrackGroupOrder(
            this.model,
            this.getCellViewHeight
        );

        if (
            !dont_sort &&
            this.model.keep_sorted &&
            this.model.isSortAffected(index, 'group')
        ) {
            this.sort();
        }

        this.resizeAndOrganizeAfterTimeout();
    }
    public setTrackGroupLegendOrder(group_order: TrackGroupIndex[]) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackGroupLegendOrder(group_order);
        this.legend_view.setTrackGroupLegendOrder(this.model);

        this.resizeAndOrganizeAfterTimeout();
    }

    public keepSorted(keep_sorted?: boolean) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        const oldValue = this.model.keep_sorted;
        this.model.keep_sorted =
            typeof keep_sorted === 'undefined' ? true : keep_sorted;
        if (this.model.keep_sorted && this.model.keep_sorted !== oldValue) {
            this.sort();
        }
    }

    public addTracks(params_list: UserTrackSpec<Datum>[]) {
        if (this.webgl_unavailable || this.destroyed) {
            return [];
        }

        // Update model
        const track_ids: TrackId[] = [];
        const library_params_list = (params_list as LibraryTrackSpec<
            Datum
        >[]).map(function(o) {
            o.track_id = nextTrackId();
            o.rule_set = OncoprintRuleSet(o.rule_set_params);
            track_ids.push(o.track_id);
            return o;
        });

        this.model.addTracks(library_params_list);
        // Update views
        this.cell_view.addTracks(this.model, track_ids);
        this.label_view.addTracks(
            this.model,
            track_ids,
            this.getCellViewHeight
        );
        this.header_view.render(this.model);
        this.track_options_view.addTracks(this.model, this.getCellViewHeight);
        this.track_info_view.addTracks(this.model, this.getCellViewHeight);
        this.legend_view.addTracks(this.model);
        this.minimap_view.addTracks(this.model, this.cell_view);

        if (
            this.model.keep_sorted &&
            this.model.isSortAffected(track_ids, 'track')
        ) {
            this.sort();
        }
        this.resizeAndOrganizeAfterTimeout();
        return track_ids;
    }

    public removeTrack(track_id: TrackId) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Update model
        this.model.removeTrack(track_id);
        // Update views
        this.cell_view.removeTrack(this.model, track_id);
        this.header_view.render(this.model);
        this.label_view.removeTrack(this.model, this.getCellViewHeight);
        this.track_options_view.removeTrack(
            this.model,
            track_id,
            this.getCellViewHeight
        );
        this.track_info_view.removeTrack(this.model, this.getCellViewHeight);
        this.legend_view.removeTrack(this.model);
        this.minimap_view.removeTrack(this.model, this.cell_view);

        if (
            this.model.keep_sorted &&
            this.model.isSortAffected(track_id, 'track')
        ) {
            this.sort();
        }
        this.resizeAndOrganizeAfterTimeout();
    }

    public removeTracks(track_ids: TrackId[]) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        for (let i = 0; i < track_ids.length; i++) {
            this.removeTrack(track_ids[i]);
        }
    }

    public getTracks() {
        if (this.webgl_unavailable || this.destroyed) {
            return [];
        }
        return this.model.getTracks().slice();
    }

    public removeAllTracks() {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        const track_ids = this.model.getTracks();
        this.removeTracks(track_ids);
    }

    public removeExpansionTracksFor(track_id: TrackId) {
        // remove all expansion tracks for this track
        this.removeTracks(this.model.track_expansion_tracks[track_id].slice());
    }

    public disableTrackExpansion(track_id: TrackId) {
        this.model.disableTrackExpansion(track_id);
    }

    public enableTrackExpansion(track_id: TrackId) {
        this.model.enableTrackExpansion(track_id);
    }

    public removeAllExpansionTracksInGroup(index: TrackGroupIndex) {
        const tracks_in_group = this.model.getTrackGroups()[index].tracks,
            expanded_tracks = [];
        let i;
        for (i = 0; i < tracks_in_group.length; i++) {
            if (this.model.isTrackExpanded(tracks_in_group[i])) {
                expanded_tracks.push(tracks_in_group[i]);
            }
        }
        this.suppressRendering();
        for (i = 0; i < expanded_tracks.length; i++) {
            // assume that the expanded tracks are not themselves removed here
            this.removeExpansionTracksFor(expanded_tracks[i]);
        }
        this.releaseRendering();
    }

    public setHorzZoomToFit(ids: ColumnId[]) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.keep_horz_zoomed_to_fit = true;
        this.updateHorzZoomToFitIds(ids);
        this.updateHorzZoomToFit();
    }
    public updateHorzZoomToFitIds(ids: ColumnId[]) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.keep_horz_zoomed_to_fit_ids = ids.slice();
        if (this.keep_horz_zoomed_to_fit) {
            this.updateHorzZoomToFit();
        }
    }
    private updateHorzZoomToFit() {
        this.setHorzZoom(
            this.getHorzZoomToFit(this.keep_horz_zoomed_to_fit_ids),
            true
        );
    }
    private getHorzZoomToFit(ids: ColumnId[]) {
        ids = ids || [];
        return this.model.getHorzZoomToFit(
            this.cell_view.getVisibleAreaWidth(),
            ids
        );
    }
    private executeHorzZoomCallbacks() {
        for (let i = 0; i < this.horz_zoom_callbacks.length; i++) {
            this.horz_zoom_callbacks[i](this.model.getHorzZoom());
        }
    }

    private executeMinimapCloseCallbacks() {
        for (let i = 0; i < this.minimap_close_callbacks.length; i++) {
            this.minimap_close_callbacks[i]();
        }
    }

    private doCellMouseOver(uid: ColumnId, track_id: TrackId) {
        if (uid !== null) {
            this.highlightTrackLabelOnly(track_id);
        } else {
            this.highlightTrackLabelOnly(null);
        }
        for (let i = 0; i < this.cell_mouse_over_callbacks.length; i++) {
            this.cell_mouse_over_callbacks[i](uid, track_id);
        }
    }

    private doCellClick(uid: ColumnId, track_id: TrackId) {
        for (let i = 0; i < this.cell_click_callbacks.length; i++) {
            this.cell_click_callbacks[i](uid, track_id);
        }
    }

    public getHorzZoom() {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        return this.model.getHorzZoom();
    }

    public setHorzZoomCentered(z: number) {
        // Save id thats at center pre-zoom
        const centerColIndex = this.cell_view.getViewportOncoprintSpace(
            this.model
        ).center_col_index;
        const centerId = this.model.getIdOrder()[centerColIndex];

        // Execute zoom
        this.setHorzZoom(z);

        // Set scroll to recenter the saved id
        this.setHorzScroll(
            this.model.getZoomedColumnLeft(centerId) -
                this.cell_view.visible_area_width / 2
        );
    }

    public setHorzZoom(z: number, still_keep_horz_zoomed_to_fit?: boolean) {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        this.keep_horz_zoomed_to_fit =
            this.keep_horz_zoomed_to_fit && still_keep_horz_zoomed_to_fit;

        if (this.model.getHorzZoom() !== z) {
            // Update model if new zoom is different
            this.model.setHorzZoom(z);
            // Update views
            this.cell_view.setHorzZoom(this.model);
            this.minimap_view.setHorzZoom(this.model, this.cell_view);

            this.executeHorzZoomCallbacks();
            this.resizeAndOrganizeAfterTimeout();
        }
        return this.model.getHorzZoom();
    }

    public getVertZoom() {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        return this.model.getVertZoom();
    }

    public setVertZoom(z: number) {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        // Update model
        this.model.setVertZoom(z);
        // Update views
        this.cell_view.setVertZoom(this.model);
        this.header_view.render(this.model);
        this.label_view.setVertZoom(this.model, this.getCellViewHeight);
        this.track_info_view.setVertZoom(this.model, this.getCellViewHeight);
        this.track_options_view.setVertZoom(this.model, this.getCellViewHeight);
        this.minimap_view.setVertZoom(this.model, this.cell_view);

        this.resizeAndOrganizeAfterTimeout();
        return this.model.getVertZoom();
    }

    private doSetScroll(scroll_left: number, scroll_top: number) {
        // Update model
        scroll_left = Math.min(scroll_left, this.maxOncoprintScrollLeft());
        scroll_top = Math.min(scroll_top, this.maxOncoprintScrollTop());
        this.model.setScroll(scroll_left, scroll_top);
        // Update views

        this.cell_view.setScroll(this.model);
        this.header_view.setScroll(this.model);
        this.label_view.setScroll(this.model, this.getCellViewHeight);
        this.track_info_view.setScroll(this.model);
        this.track_options_view.setScroll(this.model);
        this.minimap_view.setScroll(this.model, this.cell_view);
    }

    private setDummyScrollDivScroll() {
        const scroll_left = this.model.getHorzScroll();
        const scroll_top = this.model.getVertScroll();

        const maximum_scroll_left = this.maxOncoprintScrollLeft();
        const maximum_scroll_top = this.maxOncoprintScrollTop();
        let onc_scroll_left_prop =
            maximum_scroll_left > 0 ? scroll_left / maximum_scroll_left : 0;
        let onc_scroll_top_prop =
            maximum_scroll_top > 0 ? scroll_top / maximum_scroll_top : 0;
        onc_scroll_left_prop = clamp(onc_scroll_left_prop, 0, 1);
        onc_scroll_top_prop = clamp(onc_scroll_top_prop, 0, 1);

        const maximum_dummy_scroll_div_scroll = this.maxDummyScrollDivScroll();
        const maximum_div_scroll_left = maximum_dummy_scroll_div_scroll.left;
        const maximum_div_scroll_top = maximum_dummy_scroll_div_scroll.top;

        this.target_dummy_scroll_left = Math.round(
            onc_scroll_left_prop * maximum_div_scroll_left
        );
        this.target_dummy_scroll_top = Math.round(
            onc_scroll_top_prop * maximum_div_scroll_top
        );
        this.$dummy_scroll_div.scrollLeft(this.target_dummy_scroll_left);
        this.$dummy_scroll_div.scrollTop(this.target_dummy_scroll_top);
    }

    public setScroll(scroll_left: number, scroll_top: number) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.doSetScroll(scroll_left, scroll_top);
        this.setDummyScrollDivScroll();
    }

    public setZoom(zoom_x: number, zoom_y: number) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Update model
        this.model.setZoom(zoom_x, zoom_y);
        // Update views
        this.cell_view.setZoom(this.model);
        this.header_view.render(this.model);
        this.label_view.setZoom(this.model, this.getCellViewHeight);
        this.track_info_view.setZoom(this.model, this.getCellViewHeight);
        this.track_options_view.setZoom(this.model, this.getCellViewHeight);
        this.minimap_view.setZoom(this.model, this.cell_view);
    }

    public setHorzScroll(s: number) {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        // Update model
        this.model.setHorzScroll(Math.min(s, this.maxOncoprintScrollLeft()));
        // Update views
        this.cell_view.setHorzScroll(this.model);
        this.label_view.setHorzScroll(this.model);
        this.track_info_view.setHorzScroll(this.model);
        this.track_options_view.setHorzScroll(this.model);
        this.minimap_view.setHorzScroll(this.model, this.cell_view);
        // Update dummy scroll div
        this.setDummyScrollDivScroll();

        return this.model.getHorzScroll();
    }
    public setVertScroll(s: number) {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        // Update model
        this.model.setVertScroll(Math.min(s, this.maxOncoprintScrollTop()));
        // Update views
        this.cell_view.setVertScroll(this.model);
        this.header_view.setVertScroll(this.model);
        this.label_view.setVertScroll(this.model, this.getCellViewHeight);
        this.track_info_view.setVertScroll(this.model);
        this.track_options_view.setVertScroll(this.model);
        this.minimap_view.setVertScroll(this.model, this.cell_view);
        // Update dummy scroll div
        this.setDummyScrollDivScroll();

        return this.model.getVertScroll();
    }
    public setViewport(vp: MinimapViewportSpec) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Zoom
        const zoom_x = this.model.getHorzZoomToFitCols(
            this.cell_view.getVisibleAreaWidth(),
            vp.left_col,
            vp.right_col
        );
        this.setZoom(zoom_x, vp.zoom_y);
        // Scroll
        const scroll_left = Math.min(
            this.model.getZoomedColumnLeft(
                this.model.getIdOrder()[vp.left_col]
            ),
            this.maxOncoprintScrollLeft()
        );
        const scroll_top = Math.min(
            vp.scroll_y_proportion * this.model.getOncoprintHeight(),
            this.maxOncoprintScrollTop()
        );
        this.setScroll(scroll_left, scroll_top);

        this.executeHorzZoomCallbacks();
    }

    public getTrackData(track_id: TrackId) {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        return this.model.getTrackData(track_id);
    }

    public getTrackDataIdKey(track_id: TrackId) {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        return this.model.getTrackDataIdKey(track_id);
    }

    /**
     * Sets the data for an Oncoprint track.
     *
     * @param track_id - the ID that identifies the track
     * @param {Object[]} data - the list of data for the cells
     * @param {string} data_id_key - name of the property of the
     * data objects to use as the (column) key
     */
    public setTrackData(
        track_id: TrackId,
        data: Datum[],
        data_id_key: string & keyof Datum
    ) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackData(track_id, data, data_id_key);
        this.cell_view.setTrackData(this.model, track_id);
        this.header_view.render(this.model);
        this.legend_view.setTrackData(this.model);
        this.minimap_view.setTrackData(this.model, this.cell_view);

        if (
            this.model.keep_sorted &&
            this.model.isSortAffected(track_id, 'track')
        ) {
            this.sort();
        }
        this.resizeAndOrganizeAfterTimeout();
    }

    public setTrackImportantIds(
        track_id: TrackId,
        ids: ColumnId[] | undefined
    ) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackImportantIds(track_id, ids);
        this.cell_view.setTrackImportantIds(this.model, track_id);
        this.legend_view.setTrackImportantIds(this.model);
        this.resizeAndOrganizeAfterTimeout();
    }

    public setTrackGroupSortPriority(priority: TrackGroupIndex[]) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackGroupSortPriority(priority);
        this.cell_view.setTrackGroupSortPriority(this.model);

        if (this.model.keep_sorted) {
            this.sort();
        }
        this.resizeAndOrganizeAfterTimeout();
    }

    public resetSortableTracksSortDirection() {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.resetSortableTracksSortDirection(true);

        if (this.model.keep_sorted) {
            this.sort();
        }
    }

    public setTrackSortDirection(track_id: TrackId, dir: TrackSortDirection) {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        if (this.model.isTrackSortDirectionChangeable(track_id)) {
            this.model.setTrackSortDirection(track_id, dir);

            if (
                this.model.keep_sorted &&
                this.model.isSortAffected(track_id, 'track')
            ) {
                this.sort();
            }

            if (this.model.getTrackSortDirection(track_id) === 0) {
                if (this.model.getTrackShowGaps(track_id)) {
                    this.setTrackShowGaps(track_id, GAP_MODE_ENUM.HIDE_GAPS);
                }
            }
        }
        return this.model.getTrackSortDirection(track_id);
    }

    public setTrackSortComparator(
        track_id: TrackId,
        sortCmpFn: TrackSortSpecification<Datum>
    ) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackSortComparator(track_id, sortCmpFn);
        if (
            this.model.keep_sorted &&
            this.model.isSortAffected(track_id, 'track')
        ) {
            this.sort();
        }
    }

    public getTrackSortDirection(track_id: TrackId) {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        return this.model.getTrackSortDirection(track_id);
    }

    public setTrackInfo(track_id: TrackId, msg: string) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackInfo(track_id, msg);
        this.track_info_view.setTrackInfo(this.model, this.getCellViewHeight);
    }

    public setTrackTooltipFn(
        track_id: TrackId,
        tooltipFn: TrackTooltipFn<Datum>
    ) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackTooltipFn(track_id, tooltipFn);
    }

    public setShowTrackSublabels(show: boolean) {
        this.model.setShowTrackSublabels(show);
        this.label_view.setShowTrackSublabels(
            this.model,
            this.getCellViewHeight
        );

        this.resizeAndOrganizeAfterTimeout();
    }

    public setTrackShowGaps(track_id: TrackId, gap_mode: GAP_MODE_ENUM) {
        this.model.setTrackShowGaps(track_id, gap_mode);
        if (
            this.model.getTrackSortDirection(track_id) === 0 &&
            gap_mode !== GAP_MODE_ENUM.HIDE_GAPS
        ) {
            this.setTrackSortDirection(track_id, 1);
        }
        this.track_options_view.setTrackShowGaps(
            this.model,
            this.getCellViewHeight
        );
        this.cell_view.setTrackShowGaps(this.model);
    }

    public sort() {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        const self = this;

        // Increment lastSortId in order to indicate that a new sort is initiated.
        this.incrementLastSortId();
        const thisSortId = this.lastSortId;

        this.model.sort().then(function(clusterSortResult) {
            // Make sure lastSortId is still the same as it was when we first called sort()
            // If not, then just skip updating.
            //
            // This prevents bugs due to stale sorts finishing asynchronously in the wrong order.
            if (self.lastSortId !== thisSortId) {
                return;
            }
            self.label_view.sort(self.model, self.getCellViewHeight);
            self.track_options_view.sort(self.model, self.getCellViewHeight);
            self.cell_view.sort(self.model);
            self.minimap_view.sort(self.model, self.cell_view);

            if (clusterSortResult) {
                self.setTrackGroupOrder(
                    clusterSortResult.track_group_index,
                    clusterSortResult.track_id_order,
                    true
                );
            }
        });
    }

    public shareRuleSet(source_track_id: TrackId, target_track_id: TrackId) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.shareRuleSet(source_track_id, target_track_id);
        this.cell_view.shareRuleSet(this.model, target_track_id);
        this.legend_view.shareRuleSet(this.model);
        this.minimap_view.shareRuleSet(this.model, this.cell_view);
    }

    public setRuleSet(track_id: TrackId, rule_set_params: RuleSetParams) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setRuleSet(track_id, OncoprintRuleSet(rule_set_params));
        this.cell_view.setRuleSet(this.model, track_id);
        this.legend_view.setRuleSet(this.model);
        this.minimap_view.setRuleSet(this.model, this.cell_view);
        this.resizeAndOrganizeAfterTimeout();
    }

    public setSortConfig(params: SortConfig) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setSortConfig(params);
        this.cell_view.setSortConfig(this.model);
        this.track_options_view.setSortConfig(this.model);

        if (this.model.keep_sorted) {
            this.sort();
        }
    }
    public setIdOrder(ids: ColumnId[]) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Update model
        this.model.setIdOrder(ids);
        // Update views
        this.cell_view.setIdOrder(this.model, ids);
        this.minimap_view.setIdOrder(this.model, this.cell_view);

        if (this.model.keep_sorted) {
            this.sort();
        }
    }

    public setTrackGroupHeader(
        index: TrackGroupIndex,
        header?: TrackGroupHeader
    ) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackGroupHeader(index, header);
        this.label_view.setTrackGroupHeader(this.model, this.getCellViewHeight);
        this.header_view.render(this.model);
        this.track_info_view.setTrackGroupHeader(
            this.model,
            this.getCellViewHeight
        );
        this.track_options_view.setTrackGroupHeader(
            this.model,
            this.getCellViewHeight
        );
        this.minimap_view.setTrackGroupHeader(this.model, this.cell_view);
        this.cell_view.setTrackGroupHeader(this.model);
        this.resizeAndOrganizeAfterTimeout();
    }

    public disableInteraction() {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        //this.label_view.disableInteraction();
        //this.cell_view.disableInteraction();
        this.track_options_view.disableInteraction();
        //this.track_info_view.disableInteraction();
        //this.legend_view.disableInteraction();
    }
    public enableInteraction() {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        //this.label_view.enableInteraction();
        //this.cell_view.enableInteraction();
        this.track_options_view.enableInteraction();
        //this.track_info_view.enableInteraction();
        //this.legend_view.enableInteraction();
    }
    public suppressRendering() {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.rendering_suppressed_depth += 1;
        this.label_view.suppressRendering();
        this.header_view.suppressRendering();
        this.cell_view.suppressRendering();
        this.track_options_view.suppressRendering();
        this.track_info_view.suppressRendering();
        this.legend_view.suppressRendering();
        this.minimap_view.suppressRendering();
    }

    public releaseRendering(onComplete?: () => void) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        if (this.model.rendering_suppressed_depth > 0) {
            this.model.rendering_suppressed_depth -= 1;
            this.model.rendering_suppressed_depth = Math.max(
                0,
                this.model.rendering_suppressed_depth
            );
            if (this.model.rendering_suppressed_depth === 0) {
                this.model.releaseRendering();
                this.label_view.releaseRendering(
                    this.model,
                    this.getCellViewHeight
                );
                this.header_view.releaseRendering(this.model);
                this.cell_view.releaseRendering(this.model);
                this.track_options_view.releaseRendering(
                    this.model,
                    this.getCellViewHeight
                );
                this.track_info_view.releaseRendering(
                    this.model,
                    this.getCellViewHeight
                );
                this.legend_view.releaseRendering(this.model);
                this.minimap_view.releaseRendering(this.model, this.cell_view);
                this.resizeAndOrganizeAfterTimeout(onComplete);
            }
        }
    }

    public triggerPendingResizeAndOrganize(onComplete?: () => void) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        if (this.pending_resize_and_organize) {
            this.pending_resize_and_organize = false;
            this.resizeAndOrganizeAfterTimeout(onComplete);
        }
    }

    public hideIds(to_hide: ColumnId[], show_others?: boolean) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.hideIds(to_hide, show_others);
        this.cell_view.hideIds(this.model);
        this.minimap_view.hideIds(this.model, this.cell_view);
    }

    public hideTrackLegends(track_ids: TrackId[]) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        track_ids = [].concat(track_ids);
        this.model.hideTrackLegends(track_ids);
        this.legend_view.hideTrackLegends(this.model);
        this.setLegendTopAfterTimeout();
    }

    public showTrackLegends(track_ids: TrackId[]) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        track_ids = [].concat(track_ids);
        this.model.showTrackLegends(track_ids);
        this.legend_view.showTrackLegends(this.model);
        this.setLegendTopAfterTimeout();
    }

    public setCellPaddingOn(cell_padding_on: boolean) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setCellPaddingOn(cell_padding_on);
        this.cell_view.setCellPaddingOn(this.model);
    }

    public setTrackCustomOptions(
        track_id: TrackId,
        options: CustomTrackOption[] | undefined
    ) {
        this.model.setTrackCustomOptions(track_id, options);
        this.track_options_view.setTrackCustomOptions(this.model);
    }

    public setTrackInfoTooltip(
        track_id: TrackId,
        $tooltip_elt: JQuery | undefined
    ) {
        this.model.setTrackInfoTooltip(track_id, $tooltip_elt);
    }

    public setTrackMovable(track_id: TrackId, movable: boolean) {
        this.model.setTrackMovable(track_id, movable);
        this.track_options_view.setTrackMovable(this.model);
        this.label_view.setTrackMovable(this.model);
    }

    public setWidth(width: number) {
        this.width = width;

        this.resizeAndOrganize();
    }

    public setColumnLabels(labels: ColumnProp<ColumnLabel>) {
        this.model.setColumnLabels(labels);
        this.cell_view.setColumnLabels(this.model);
        this.resizeAndOrganizeAfterTimeout();
    }

    public setShowTrackLabels(s: boolean) {
        this.model.setShowTrackLabels(s);
        this.label_view.setShowTrackLabels(this.model, this.getCellViewHeight);
        this.resizeAndOrganizeAfterTimeout();
    }

    public onCellMouseOver(callback: CellMouseOverCallback) {
        this.cell_mouse_over_callbacks.push(callback);
    }

    public onCellClick(callback: CellClickCallback) {
        this.cell_click_callbacks.push(callback);
    }

    public toSVG(with_background?: boolean) {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        // Returns svg DOM element
        const root = svgfactory.svg(10, 10);
        this.$ctr.append(root);
        const everything_group = svgfactory.group(0, 0);
        root.appendChild(everything_group);

        const bgrect = svgfactory.bgrect(10, 10, [255, 255, 255, 1]);

        if (with_background) {
            everything_group.appendChild(bgrect);
        }

        const label_view_group = this.label_view.toSVGGroup(
            this.model,
            true,
            0,
            0
        );
        everything_group.appendChild(label_view_group);

        const header_view_group = this.header_view.toSVGGroup(this.model, 0, 0);
        everything_group.appendChild(header_view_group);

        const label_view_width = label_view_group.getBBox().width;
        const label_view_padding = label_view_width > 0 ? 30 : 0;
        const track_info_group_x = label_view_width + label_view_padding;
        const track_info_group = this.track_info_view.toSVGGroup(
            this.model,
            track_info_group_x,
            0
        );
        everything_group.appendChild(track_info_group);

        const cell_view_group_x =
            track_info_group_x + track_info_group.getBBox().width + 10;
        const cell_view_group = this.cell_view.toSVGGroup(
            this.model,
            cell_view_group_x,
            0
        );
        everything_group.appendChild(cell_view_group);

        everything_group.appendChild(
            this.legend_view.toSVGGroup(
                this.model,
                0,
                cell_view_group.getBBox().y +
                    cell_view_group.getBBox().height +
                    20
            )
        );

        const everything_box = everything_group.getBBox();
        const everything_width = everything_box.x + everything_box.width;
        const everything_height = everything_box.y + everything_box.height;
        root.setAttribute('width', everything_width as any);
        root.setAttribute('height', everything_height as any);

        if (with_background) {
            bgrect.setAttribute('width', everything_width as any);
            bgrect.setAttribute('height', everything_height as any);
        }
        root.parentNode.removeChild(root);

        return root;
    }

    public toCanvas(
        callback: (canvas: HTMLCanvasElement, truncated: boolean) => void,
        resolution?: number
    ) {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        // Returns data url, requires IE >= 11

        const MAX_CANVAS_SIDE = 8192;
        const svg = this.toSVG(true);
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const width = parseInt(svg.getAttribute('width'), 10);
        const height = parseInt(svg.getAttribute('height'), 10);
        const canvas = document.createElement('canvas');

        resolution = resolution || 1;
        const truncated =
            width * resolution > MAX_CANVAS_SIDE ||
            height * resolution > MAX_CANVAS_SIDE;
        canvas.setAttribute(
            'width',
            Math.min(MAX_CANVAS_SIDE, width * resolution).toString()
        );
        canvas.setAttribute(
            'height',
            Math.min(MAX_CANVAS_SIDE, height * resolution).toString()
        );

        const container = document.createElement('div');
        container.appendChild(svg);
        const svg_data_str = container.innerHTML;
        const svg_data_uri =
            'data:image/svg+xml;base64,' + window.btoa(svg_data_str);

        const ctx = canvas.getContext('2d');
        ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
        const img = new Image();

        img.onload = function() {
            ctx.drawImage(img, 0, 0);
            callback(canvas, truncated);
        };
        img.onerror = function() {
            console.log('IMAGE LOAD ERROR');
        };

        img.src = svg_data_uri;
        return img;
    }

    public toDataUrl(callback: (dataURL: string) => void) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.toCanvas(function(canvas) {
            callback(canvas.toDataURL());
        });
    }

    public highlightTrackLabelOnly(track_id: TrackId) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.label_view.highlightTrackLabelOnly(track_id, this.model);
    }

    public setHighlightedTracks(track_ids: TrackId[]) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setHighlightedTracks(track_ids);
        this.label_view.setHighlightedTracks(this.model);
        this.cell_view.setHighlightedTracks(this.model);
    }

    public setHighlightedIds(ids: ColumnId[]) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setHighlightedIds(ids);
        this.cell_view.setHighlightedIds(this.model);
    }

    public getIdOrder(all?: boolean) {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        return this.model.getIdOrder(all);
    }

    public setIdClipboardContents(array: ColumnId[]) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.id_clipboard = array.slice();
        for (let i = 0; i < this.clipboard_change_callbacks.length; i++) {
            this.clipboard_change_callbacks[i](array);
        }
    }
    public getIdClipboardContents() {
        if (this.webgl_unavailable || this.destroyed) {
            return undefined;
        }
        return this.id_clipboard.slice();
    }
    public onClipboardChange(callback: ClipboardChangeCallback) {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.clipboard_change_callbacks.push(callback);
    }

    public destroy() {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.cell_view.destroy();
        this.header_view.destroy();
        this.track_options_view.destroy();
        this.track_info_view.destroy();
        this.destroyed = true;
    }

    public clearMouseOverEffects() {
        if (this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.cell_view.clearOverlay();
        this.label_view.highlightTrackLabelOnly(null, this.model);
    }
}
