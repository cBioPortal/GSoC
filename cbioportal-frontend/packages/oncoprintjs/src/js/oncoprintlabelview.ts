import svgfactory from './svgfactory';
import $ from 'jquery';
import makeSvgElement from './makesvgelement';
import OncoprintModel, { TrackId, TrackProp } from './oncoprintmodel';
import OncoprintToolTip from './oncoprinttooltip';
import Oncoprint from './oncoprint';

const CIRCLE_X = 25;

export default class OncoprintLabelView {
    private supersampling_ratio = 2;
    private base_font_size = 14;
    // stuff from model
    private track_tops: TrackProp<number> = {};
    private cell_tops: TrackProp<number> = {};
    private cell_tops_view_space: TrackProp<number> = {};
    private cell_tops_this_space: TrackProp<number> = {};
    private cell_heights: TrackProp<number> = {};
    private cell_heights_view_space: TrackProp<number> = {};
    private cell_heights_this_space: TrackProp<number> = {};
    private label_middles_view_space: TrackProp<number> = {};
    private label_middles_this_space: TrackProp<number> = {};
    private label_left_padding: TrackProp<number> = {};
    private labels: TrackProp<string> = {};
    private sublabels: TrackProp<string> = {};
    private label_colors: TrackProp<string> = {};
    private label_circle_colors: TrackProp<string> = {};
    private label_font_weight: TrackProp<string> = {};
    private html_labels: TrackProp<string> = {};
    private track_link_urls: TrackProp<string> = {};
    private track_descriptions: TrackProp<string> = {};
    private minimum_track_height = Number.POSITIVE_INFINITY;
    private maximum_label_width = Number.NEGATIVE_INFINITY;
    private tracks: TrackId[] = [];
    private show_sublabels: boolean;

    private rendering_suppressed = false;
    private highlighted_track_label_only: TrackId | null = null;
    private drag_callback: (
        target_track: TrackId,
        new_previous_track: TrackId
    ) => void;
    private dragged_label_track_id: TrackId | null;
    private drag_mouse_y: number | null;
    private scroll_y: number = 0;
    private ctx: CanvasRenderingContext2D;

    constructor(
        private $canvas: JQuery<HTMLCanvasElement>,
        private model: OncoprintModel,
        private tooltip: OncoprintToolTip
    ) {
        const view = this;
        this.show_sublabels = model.getShowTrackSublabels();

        this.setUpContext();

        (function setUpDragging(view) {
            view.drag_callback = function(target_track, new_previous_track) {};
            view.dragged_label_track_id = null;
            view.drag_mouse_y = null;

            view.$canvas.on('mousedown', function(evt) {
                view.tooltip.hide();
                const track_id = view.isMouseOnLabel(evt.offsetY);
                if (
                    track_id !== null &&
                    model.getContainingTrackGroup(track_id).length > 1 &&
                    !model.isTrackInClusteredGroup(track_id) &&
                    model.getTrackMovable(track_id)
                ) {
                    view.startDragging(model, track_id, evt.offsetY);
                }
            });

            view.$canvas.on('mousemove', function(evt) {
                if (view.dragged_label_track_id !== null) {
                    const track_group = model.getContainingTrackGroup(
                        view.dragged_label_track_id
                    );
                    const bottommost_track = model.getLastExpansion(
                        track_group[track_group.length - 1]
                    );
                    const max_drag_y =
                        view.track_tops[bottommost_track] +
                        model.getTrackHeight(bottommost_track) -
                        view.scroll_y;
                    const min_drag_y =
                        view.track_tops[track_group[0]] - 5 - view.scroll_y;
                    view.drag_mouse_y = Math.min(
                        evt.pageY - view.$canvas.offset().top,
                        max_drag_y
                    );
                    view.drag_mouse_y = Math.max(view.drag_mouse_y, min_drag_y);
                    view.renderAllLabels(model);
                } else {
                    const hovered_track = view.isMouseOnLabel(
                        evt.pageY - view.$canvas.offset().top
                    );
                    if (hovered_track !== null) {
                        const $tooltip_div = $('<div>');
                        const offset = view.$canvas[0].getBoundingClientRect();
                        if (
                            view.isNecessaryToShortenLabel(
                                view.labels[hovered_track]
                            ) ||
                            view.track_link_urls[hovered_track]
                        ) {
                            $tooltip_div.append(
                                OncoprintLabelView.formatTooltipHeader(
                                    view.labels[hovered_track],
                                    view.html_labels[hovered_track],
                                    view.track_link_urls[hovered_track]
                                )
                            );
                        }
                        const track_description =
                            view.track_descriptions[hovered_track];
                        if (track_description.length > 0) {
                            $tooltip_div.append(
                                $('<div>').text(track_description)
                            );
                        }
                        // dragging info
                        if (model.getTrackMovable(hovered_track)) {
                            if (model.isTrackInClusteredGroup(hovered_track)) {
                                view.$canvas.css('cursor', 'not-allowed');
                                $tooltip_div.append(
                                    '<b>dragging disabled for clustered tracks</b>'
                                );
                            } else if (
                                model.getContainingTrackGroup(hovered_track)
                                    .length > 1
                            ) {
                                view.$canvas.css('cursor', 'move');
                                $tooltip_div.append('<b>hold to drag</b>');
                            }
                        }
                        if ($tooltip_div.contents().length > 0) {
                            view.tooltip.fadeIn(
                                200,
                                view.renderedLabelWidth(
                                    view.labels[hovered_track]
                                ) + offset.left,
                                view.cell_tops[hovered_track] +
                                    offset.top -
                                    view.scroll_y,
                                $tooltip_div
                            );
                        }
                    } else {
                        view.$canvas.css('cursor', 'auto');
                        view.tooltip.hide();
                    }
                }
            });

            view.$canvas.on('mouseup mouseleave', function(evt) {
                if (view.dragged_label_track_id !== null) {
                    const track_group = model.getContainingTrackGroup(
                        view.dragged_label_track_id
                    );
                    const previous_track_id = view.getLabelAboveMouseSpace(
                        track_group,
                        evt.offsetY,
                        view.dragged_label_track_id
                    );
                    view.stopDragging(model, previous_track_id);
                }
                view.tooltip.hideIfNotAlreadyGoingTo(150);
            });
        })(this);
    }

    private circleRadius() {
        return (this.minimum_track_height * 0.8) / 2;
    }

    private renderedLabelWidth(label: string) {
        return (
            this.ctx.measureText(this.shortenLabelIfNecessary(label)).width /
            this.supersampling_ratio
        );
    }

    private updateFromModel(model: OncoprintModel) {
        if (this.rendering_suppressed) {
            return;
        }
        this.show_sublabels = model.getShowTrackSublabels();
        this.scroll_y = model.getVertScroll();
        this.track_tops = model.getZoomedTrackTops() as TrackProp<number>;
        this.cell_tops = model.getCellTops() as TrackProp<number>;
        this.cell_tops_this_space = {};
        this.cell_heights = {};
        this.tracks = model.getTracks();
        this.track_descriptions = {};

        this.ctx.font = 'bold ' + this.getFontSize() + 'px Arial';
        this.minimum_track_height = Number.POSITIVE_INFINITY;
        this.maximum_label_width = 0;
        for (let i = 0; i < this.tracks.length; i++) {
            this.minimum_track_height = Math.min(
                this.minimum_track_height,
                model.getTrackHeight(this.tracks[i])
            );
            const shortened_label = this.shortenLabelIfNecessary(
                this.labels[this.tracks[i]]
            );
            const shortened_sublabel = this.shortenLabelIfNecessary(
                this.sublabels[this.tracks[i]]
            );
            const measured_width =
                this.ctx.measureText(shortened_label).width +
                (this.show_sublabels
                    ? this.ctx.measureText(shortened_sublabel).width
                    : 0);
            this.maximum_label_width = Math.max(
                this.maximum_label_width,
                measured_width
            );

            this.cell_tops_this_space[this.tracks[i]] =
                this.cell_tops[this.tracks[i]] * this.supersampling_ratio -
                this.scroll_y * this.supersampling_ratio;
            this.track_descriptions[this.tracks[i]] = model.getTrackDescription(
                this.tracks[i]
            );
            this.cell_heights[this.tracks[i]] = model.getCellHeight(
                this.tracks[i]
            );
            this.cell_heights_this_space[this.tracks[i]] =
                this.cell_heights[this.tracks[i]] * this.supersampling_ratio;
            this.label_middles_this_space[this.tracks[i]] =
                this.cell_tops_this_space[this.tracks[i]] +
                this.cell_heights_this_space[this.tracks[i]] / 2;
        }
    }
    private setUpContext() {
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.textAlign = 'start';
        this.ctx.textBaseline = 'middle';
    }
    private resizeAndClear(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        if (this.rendering_suppressed) {
            return;
        }
        const visible_height = getCellViewHeight();
        const visible_width = this.getWidth();
        this.$canvas[0].height = this.supersampling_ratio * visible_height;
        this.$canvas[0].width = this.supersampling_ratio * visible_width;
        this.$canvas[0].style.height = visible_height + 'px';
        this.$canvas[0].style.width = visible_width + 'px';
        this.setUpContext();
    }
    private isNecessaryToShortenLabel(label: string) {
        return label.length > this.getMaximumLabelLength();
    }
    private shortenLabelIfNecessary(label: string) {
        if (this.isNecessaryToShortenLabel(label)) {
            return label.substring(0, this.getMaximumLabelLength() - 3) + '...';
        } else {
            return label;
        }
    }
    private static formatTooltipHeader(
        label: string,
        html_label: any,
        link_url: string
    ) {
        let header_contents;
        if (link_url) {
            header_contents = $(
                '<a target="_blank" rel="noopener noreferrer">'
            ).attr('href', link_url);
        } else {
            header_contents = $('<span>');
        }
        header_contents.append(html_label || document.createTextNode(label));
        return $('<b style="display: block;">').append(header_contents);
    }
    private renderAllLabels(model: OncoprintModel) {
        if (this.rendering_suppressed) {
            return;
        }
        this.ctx.clearRect(0, 0, this.$canvas[0].width, this.$canvas[0].height);

        const highlightedTracks = [];
        highlightedTracks.push(...model.getHighlightedTracks());
        if (this.highlighted_track_label_only !== null) {
            highlightedTracks.push(this.highlighted_track_label_only);
        }
        for (const track_id of highlightedTracks) {
            if (this.cell_tops_this_space.hasOwnProperty(track_id)) {
                this.ctx.fillStyle = 'rgba(255,255,0,0.4)';
                this.ctx.fillRect(
                    0,
                    this.cell_tops_this_space[track_id],
                    this.getWidth() * this.supersampling_ratio,
                    this.cell_heights_this_space[track_id]
                );
            }
        }
        const font_size = this.getFontSize();
        const tracks = this.tracks;
        const sublabelX: TrackProp<number> = {};
        for (let i = 0; i < tracks.length; i++) {
            if (this.label_circle_colors[tracks[i]]) {
                // draw circle if specified
                this.ctx.fillStyle = this.label_circle_colors[tracks[i]];
                this.ctx.beginPath();
                this.ctx.arc(
                    CIRCLE_X * this.supersampling_ratio,
                    this.label_middles_this_space[tracks[i]],
                    this.supersampling_ratio * this.circleRadius(),
                    0,
                    2 * Math.PI
                );
                this.ctx.fill();
            }

            this.ctx.font =
                (this.label_font_weight[tracks[i]] || 'bold') +
                ' ' +
                font_size +
                'px Arial';
            this.ctx.fillStyle = 'black';
            if (this.label_colors && this.label_colors[tracks[i]]) {
                //override color, if set:
                this.ctx.fillStyle = this.label_colors[tracks[i]];
            }
            const label = this.shortenLabelIfNecessary(this.labels[tracks[i]]);
            this.ctx.fillText(
                label,
                this.label_left_padding[tracks[i]] * this.supersampling_ratio,
                this.label_middles_this_space[tracks[i]]
            );
            sublabelX[tracks[i]] = this.ctx.measureText(label).width;
        }
        if (this.show_sublabels) {
            // render sublabels - not bold, gray
            this.ctx.font = font_size + 'px Arial';
            this.ctx.fillStyle = 'rgb(166,166,166)';
            for (let i = 0; i < tracks.length; i++) {
                if (this.sublabels[tracks[i]]) {
                    this.ctx.fillText(
                        this.shortenLabelIfNecessary(this.sublabels[tracks[i]]),
                        sublabelX[tracks[i]],
                        this.label_middles_this_space[tracks[i]]
                    );
                }
            }
        }
        if (this.dragged_label_track_id !== null) {
            this.ctx.font = 'bold ' + font_size + 'px Arial';
            this.ctx.fillStyle = 'rgba(255,0,0,0.95)';
            this.ctx.fillText(
                this.shortenLabelIfNecessary(
                    this.labels[this.dragged_label_track_id]
                ),
                0,
                this.supersampling_ratio * this.drag_mouse_y
            );
            this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
            const group = this.model.getContainingTrackGroup(
                this.dragged_label_track_id
            );
            const label_above_mouse = this.model.getLastExpansion(
                this.getLabelAboveMouseSpace(group, this.drag_mouse_y, null)
            );
            const label_below_mouse = this.getLabelBelowMouseSpace(
                group,
                this.drag_mouse_y,
                null
            );
            let rect_y, rect_height;
            if (
                label_above_mouse === this.dragged_label_track_id ||
                label_below_mouse === this.dragged_label_track_id
            ) {
                return;
            }
            if (label_above_mouse !== null && label_below_mouse !== null) {
                rect_y =
                    this.cell_tops_this_space[label_above_mouse] +
                    this.cell_heights_this_space[label_above_mouse];
                rect_height =
                    this.cell_tops_this_space[label_below_mouse] - rect_y;
            } else if (label_above_mouse === null) {
                rect_y =
                    this.cell_tops_this_space[group[0]] -
                    this.ctx.measureText('m').width;
                rect_height = this.ctx.measureText('m').width;
            } else if (label_below_mouse === null) {
                rect_y =
                    this.cell_tops_this_space[label_above_mouse] +
                    this.cell_heights_this_space[label_above_mouse];
                rect_height = this.ctx.measureText('m').width;
            }

            const min_rect_height = 4;
            rect_height = Math.max(rect_height, min_rect_height);
            this.ctx.fillRect(
                this.label_left_padding[tracks[tracks.length - 1]] *
                    this.supersampling_ratio,
                rect_y,
                this.getWidth() * this.supersampling_ratio,
                rect_height
            );
        }
    }

    private isMouseOnLabel(mouse_y: number) {
        const candidate_track = this.getLabelAboveMouseSpace(
            this.tracks,
            mouse_y,
            null
        );
        if (candidate_track === null) {
            return null;
        }
        if (
            mouse_y <=
            this.cell_tops[candidate_track] -
                this.scroll_y +
                this.cell_heights[candidate_track]
        ) {
            return candidate_track;
        } else {
            return null;
        }
    }
    private getLabelAboveMouseSpace(
        track_ids: TrackId[],
        y: number,
        track_to_exclude: TrackId | null
    ) {
        if (y < this.cell_tops[track_ids[0]] - this.scroll_y) {
            return null;
        } else {
            let candidate_track = null;
            for (let i = 0; i < track_ids.length; i++) {
                if (
                    track_to_exclude !== null &&
                    track_to_exclude === track_ids[i]
                ) {
                    continue;
                }
                if (this.cell_tops[track_ids[i]] - this.scroll_y > y) {
                    break;
                } else {
                    candidate_track = track_ids[i];
                }
            }
            return candidate_track;
        }
    }
    private getLabelBelowMouseSpace(
        track_ids: TrackId[],
        y: number,
        track_to_exclude: TrackId | null
    ) {
        if (
            y >
            this.cell_tops[track_ids[track_ids.length - 1]] - this.scroll_y
        ) {
            return null;
        } else {
            let candidate_track = null;
            for (let i = track_ids.length - 1; i >= 0; i--) {
                if (
                    track_to_exclude !== null &&
                    track_to_exclude === track_ids[i]
                ) {
                    continue;
                }
                if (this.cell_tops[track_ids[i]] - this.scroll_y < y) {
                    break;
                } else {
                    candidate_track = track_ids[i];
                }
            }
            return candidate_track;
        }
    }

    private startDragging(
        model: OncoprintModel,
        track_id: TrackId,
        mouse_y: number
    ) {
        this.dragged_label_track_id = track_id;
        this.drag_mouse_y = mouse_y;
        this.renderAllLabels(model);
    }
    private stopDragging(
        model: OncoprintModel,
        new_previous_track_id: TrackId
    ) {
        this.drag_callback(this.dragged_label_track_id, new_previous_track_id);
        this.dragged_label_track_id = null;
        this.renderAllLabels(model);
    }

    private getMaximumLabelLength() {
        return 18;
    }

    public getWidth() {
        if (this.model.getShowTrackLabels()) {
            return Math.max(
                this.maximum_label_width / this.supersampling_ratio + 10,
                70
            );
        } else {
            return 0;
        }
    }
    public getFontSize(no_supersampling_adjustment?: boolean) {
        return (
            (no_supersampling_adjustment ? 1 : this.supersampling_ratio) *
            Math.max(
                Math.min(this.base_font_size, this.minimum_track_height),
                7
            )
        );
    }
    public setDragCallback(callback: OncoprintLabelView['drag_callback']) {
        this.drag_callback = callback;
    }
    public removeTrack(model: OncoprintModel, getCellViewHeight: () => number) {
        this.updateFromModel(model);
        this.resizeAndClear(model, getCellViewHeight);
        this.renderAllLabels(model);
    }
    public moveTrack(model: OncoprintModel, getCellViewHeight: () => number) {
        this.updateFromModel(model);
        this.resizeAndClear(model, getCellViewHeight);
        this.renderAllLabels(model);
    }
    public setTrackGroupOrder(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        this.updateFromModel(model);
        this.resizeAndClear(model, getCellViewHeight);
        this.renderAllLabels(model);
    }
    public setShowTrackLabels(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        this.updateFromModel(model);
        this.resizeAndClear(model, getCellViewHeight);
        this.renderAllLabels(model);
    }
    public addTracks(
        model: OncoprintModel,
        track_ids: TrackId[],
        getCellViewHeight: () => number
    ) {
        for (let i = 0; i < track_ids.length; i++) {
            this.labels[track_ids[i]] = model.getTrackLabel(track_ids[i]);
            this.sublabels[track_ids[i]] = model.getTrackSublabel(track_ids[i]);
            this.label_colors[track_ids[i]] = model.getTrackLabelColor(
                track_ids[i]
            );
            this.label_circle_colors[
                track_ids[i]
            ] = model.getTrackLabelCircleColor(track_ids[i]);
            this.label_left_padding[
                track_ids[i]
            ] = model.getTrackLabelLeftPadding(track_ids[i]);
            this.label_font_weight[
                track_ids[i]
            ] = model.getTrackLabelFontWeight(track_ids[i]);
            this.html_labels[track_ids[i]] = model.getOptionalHtmlTrackLabel(
                track_ids[i]
            );
            this.track_link_urls[track_ids[i]] = model.getTrackLinkUrl(
                track_ids[i]
            );
        }
        this.updateFromModel(model);
        this.resizeAndClear(model, getCellViewHeight);
        this.renderAllLabels(model);
    }

    public setShowTrackSublabels(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        this.updateFromModel(model);
        this.resizeAndClear(model, getCellViewHeight);
        this.renderAllLabels(model);
    }

    public setScroll(model: OncoprintModel, getCellViewHeight: () => number) {
        this.setVertScroll(model, getCellViewHeight);
    }

    public setHorzScroll(model: OncoprintModel) {}

    public setViewport(model: OncoprintModel, getCellViewHeight: () => number) {
        this.setVertScroll(model, getCellViewHeight);
    }

    public setVertScroll(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        this.updateFromModel(model);
        this.resizeAndClear(model, getCellViewHeight);
        this.renderAllLabels(model);
    }

    public setVertZoom(model: OncoprintModel, getCellViewHeight: () => number) {
        this.updateFromModel(model);
        this.resizeAndClear(model, getCellViewHeight);
        this.renderAllLabels(model);
    }

    public setZoom(model: OncoprintModel, getCellViewHeight: () => number) {
        this.setVertZoom(model, getCellViewHeight);
    }

    public highlightTrackLabelOnly(track_id: TrackId, model: OncoprintModel) {
        // track_id is a track id, or null to clear highlight
        this.highlighted_track_label_only = track_id;
        this.renderAllLabels(model);
    }

    public setHighlightedTracks(model: OncoprintModel) {
        this.renderAllLabels(model);
    }

    public setTrackMovable(model: OncoprintModel) {
        this.renderAllLabels(model);
    }

    public setTrackGroupHeader(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        this.updateFromModel(model);
        this.resizeAndClear(model, getCellViewHeight);
        this.renderAllLabels(model);
    }

    public sort(model: OncoprintModel, getCellViewHeight: () => number) {
        this.updateFromModel(model);
        this.resizeAndClear(model, getCellViewHeight);
        this.renderAllLabels(model);
    }

    public suppressRendering() {
        this.rendering_suppressed = true;
    }

    public releaseRendering(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        this.rendering_suppressed = false;
        this.updateFromModel(model);
        this.resizeAndClear(model, getCellViewHeight);
        this.renderAllLabels(model);
    }

    public toSVGGroup(
        model: OncoprintModel,
        full_labels: boolean,
        offset_x: number,
        offset_y: number
    ) {
        const root = svgfactory.group(offset_x || 0, offset_y || 0);
        if (!model.getShowTrackLabels()) {
            // dont add anything if hiding track labels
            return root;
        }

        const cell_tops = model.getCellTops() as TrackProp<number>;
        const tracks = model.getTracks();
        for (let i = 0; i < tracks.length; i++) {
            const track_id = tracks[i];
            const y = cell_tops[track_id] + model.getCellHeight(track_id) / 2;
            const label = model.getTrackLabel(track_id);
            const circleColor = model.getTrackLabelCircleColor(track_id);
            if (circleColor) {
                // add circle
                root.appendChild(
                    makeSvgElement('ellipse', {
                        cx: CIRCLE_X.toString(),
                        cy: y.toString(),
                        rx: this.circleRadius().toString(),
                        ry: this.circleRadius().toString(),
                        stroke: 'rgba(0,0,0,0)',
                        fill: circleColor,
                    })
                );
            }
            const text_elt = svgfactory.text(
                full_labels ? label : this.shortenLabelIfNecessary(label),
                model.getTrackLabelLeftPadding(track_id),
                y,
                this.getFontSize(true),
                'Arial',
                model.getTrackLabelFontWeight(track_id) || 'bold',
                'bottom',
                circleColor ? 'white' : 'black'
            );
            text_elt.setAttribute('dy', '0.35em');
            root.appendChild(text_elt);
        }
        return root;
    }
}
