import svgfactory from './svgfactory';
import $ from 'jquery';
import OncoprintToolTip from './oncoprinttooltip';
import OncoprintModel from './oncoprintmodel';
import { isNumber } from 'lodash';

export default class OncoprintTrackInfoView {
    private $ctr: JQuery;
    private $text_ctr: JQuery;
    private base_font_size = 12;
    private font_family = 'Arial';
    private font_weight = 'bold';
    private width = 0;
    private $label_elts: JQuery[] = [];
    private rendering_suppressed = false;
    private minimum_track_height: number;

    constructor(private $div: JQuery, private tooltip: OncoprintToolTip) {
        this.tooltip.center = false;

        this.$ctr = $('<div></div>')
            .css({
                position: 'absolute',
                'overflow-y': 'hidden',
                'overflow-x': 'hidden',
            })
            .appendTo(this.$div);
        this.$text_ctr = $('<div></div>')
            .css({ position: 'absolute', overflow: 'visible', width: '100%' })
            .appendTo(this.$ctr);
    }

    private destroyLabelElts() {
        for (let i = 0; i < this.$label_elts.length; i++) {
            this.$label_elts[i].off('mousemove mouseleave');
        }
        this.$label_elts = [];
    }

    private renderAllInfo(model: OncoprintModel) {
        if (this.rendering_suppressed) {
            return;
        }
        this.$text_ctr.empty();
        this.destroyLabelElts();

        const tracks = model.getTracks();
        this.minimum_track_height = Number.POSITIVE_INFINITY;
        for (let i = 0; i < tracks.length; i++) {
            this.minimum_track_height = Math.min(
                this.minimum_track_height,
                model.getTrackHeight(tracks[i])
            );
        }

        this.width = 0;

        const label_tops = model.getLabelTops();
        this.scroll(model.getVertScroll());
        const font_size = this.getFontSize();

        const self = this;
        for (let j = 0; j < tracks.length; j++) {
            (function() {
                const i = j;
                const $new_label = $('<span>')
                    .css({
                        position: 'absolute',
                        'font-family': self.font_family,
                        'font-weight': self.font_weight,
                        'font-size': font_size,
                        right: '11px',
                    })
                    .addClass('noselect');
                const text = model.getTrackInfo(tracks[i]);
                if (!text) {
                    return;
                }

                const num = text.match(/^[\d\.]*/)?.[0];
                let suffix = text.match(/[^\d]*$/)?.[0];

                const float = parseFloat(num);
                let formattedPercent = '';

                if (isNaN(float)) {
                    formattedPercent = 'N/P';
                    suffix = ''; // we don't want any suffix in this case
                } else if (isNumber(float)) {
                    formattedPercent =
                        float < 1 && float > 0
                            ? '<1'
                            : Math.round(float).toString();
                } else {
                    // do nothing
                }

                $new_label.text(formattedPercent + suffix);
                $new_label.appendTo(self.$text_ctr);
                self.$label_elts.push($new_label);
                setTimeout(function() {
                    $new_label
                        .on('mousemove', function() {
                            const $tooltip_elt = model.$getTrackInfoTooltip(
                                tracks[i]
                            );
                            if ($tooltip_elt) {
                                const offset = $new_label[0].getBoundingClientRect();
                                self.tooltip.fadeIn(
                                    200,
                                    offset.left,
                                    offset.top,
                                    $tooltip_elt
                                );
                            }
                        })
                        .on('mouseleave', function() {
                            self.tooltip.hideIfNotAlreadyGoingTo(150);
                        });
                }, 0); // delay to give time for render before adding events
                const top =
                    label_tops[tracks[i]] +
                    (model.getCellHeight(tracks[i]) -
                        $new_label.outerHeight()) /
                        2;
                $new_label.css({ top: top + 'px' });
                self.width = Math.max(
                    32,
                    self.width,
                    $new_label[0].clientWidth
                );
            })();
        }
        if (this.width > 0) {
            this.width += 10;
        }
    }
    private scroll(scroll_y: number) {
        if (this.rendering_suppressed) {
            return;
        }
        this.$text_ctr.css({ top: -scroll_y });
    }

    private resize(model: OncoprintModel, getCellViewHeight: () => number) {
        if (this.rendering_suppressed) {
            return;
        }
        this.$div.css({ width: this.getWidth(), height: getCellViewHeight() });
        this.$ctr.css({ width: this.getWidth(), height: getCellViewHeight() });
    }

    public getFontSize() {
        return Math.max(
            Math.min(this.base_font_size, this.minimum_track_height),
            7
        );
    }
    public getWidth() {
        return this.width;
    }
    public addTracks(model: OncoprintModel, getCellViewHeight: () => number) {
        this.renderAllInfo(model);
        this.resize(model, getCellViewHeight);
    }
    public moveTrack(model: OncoprintModel, getCellViewHeight: () => number) {
        this.renderAllInfo(model);
        this.resize(model, getCellViewHeight);
    }
    public setTrackGroupOrder(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        this.renderAllInfo(model);
        this.resize(model, getCellViewHeight);
    }
    public removeTrack(model: OncoprintModel, getCellViewHeight: () => number) {
        this.renderAllInfo(model);
        this.resize(model, getCellViewHeight);
    }
    public setTrackInfo(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        this.renderAllInfo(model);
        this.resize(model, getCellViewHeight);
    }
    public setTrackGroupHeader(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        this.renderAllInfo(model);
        this.resize(model, getCellViewHeight);
    }
    public setScroll(model: OncoprintModel) {
        this.setVertScroll(model);
    }
    public setHorzScroll(model: OncoprintModel) {}
    public setVertScroll(model: OncoprintModel) {
        this.scroll(model.getVertScroll());
    }
    public setZoom(model: OncoprintModel, getCellViewHeight: () => number) {
        this.setVertZoom(model, getCellViewHeight);
    }

    public setViewport(model: OncoprintModel, getCellViewHeight: () => number) {
        this.renderAllInfo(model);
        this.resize(model, getCellViewHeight);
        this.scroll(model.getVertScroll());
    }
    public setVertZoom(model: OncoprintModel, getCellViewHeight: () => number) {
        this.renderAllInfo(model);
        this.resize(model, getCellViewHeight);
    }
    public suppressRendering() {
        this.rendering_suppressed = true;
    }
    public releaseRendering(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        this.rendering_suppressed = false;
        this.renderAllInfo(model);
        this.resize(model, getCellViewHeight);
        this.scroll(model.getVertScroll());
    }
    public destroy() {
        this.destroyLabelElts();
    }
    public toSVGGroup(
        model: OncoprintModel,
        offset_x: number,
        offset_y: number
    ) {
        const root = svgfactory.group(offset_x || 0, offset_y || 0);
        const cell_tops = model.getCellTops();
        const tracks = model.getTracks();

        const font_size = this.getFontSize();

        for (let i = 0; i < tracks.length; i++) {
            const track_id = tracks[i];
            const y = cell_tops[track_id] + model.getCellHeight(track_id) / 2;
            const info = model.getTrackInfo(track_id);
            const text_elt = svgfactory.text(
                info,
                0,
                y,
                font_size,
                this.font_family,
                this.font_weight,
                'bottom'
            );
            text_elt.setAttribute('dy', '0.35em');
            root.appendChild(text_elt);
        }
        return root;
    }
}
