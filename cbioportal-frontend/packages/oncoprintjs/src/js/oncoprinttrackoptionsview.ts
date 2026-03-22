import $ from 'jquery';
import menuDotsIcon from '../img/menudots.svg';
import OncoprintModel, {
    GAP_MODE_ENUM,
    TrackId,
    TrackProp,
    TrackSortDirection,
} from './oncoprintmodel';
import { CLOSE_MENUS_EVENT as HEADER_VIEW_CLOSE_MENUS_EVENT } from './oncoprintheaderview';
import ClickEvent = JQuery.ClickEvent;

const TOGGLE_BTN_CLASS = 'oncoprintjs__track_options__toggle_btn_img';
const TOGGLE_BTN_OPEN_CLASS = 'oncoprintjs__track_options__open';
const DROPDOWN_CLASS = 'oncoprintjs__track_options__dropdown';
const SEPARATOR_CLASS = 'oncoprintjs__track_options__separator';
const NTH_CLASS_PREFIX = 'nth-';

export const CLOSE_MENUS_EVENT = 'oncoprint-track-options-view.do-close-menus';

type TrackCallback = (trackId: TrackId) => void;
export default class OncoprintTrackOptionsView {
    private $ctr: JQuery;
    private $buttons_ctr: JQuery;
    private $dropdown_ctr: JQuery;

    private img_size: number;
    private rendering_suppressed = false;
    private track_options_$elts: TrackProp<{
        $div: JQuery;
        $img: JQuery;
        $dropdown: JQuery;
    }> = {};
    private menu_shown: TrackProp<boolean> = {};
    private clickHandler: () => void;
    private interaction_disabled = false;

    constructor(
        private $div: JQuery,
        private moveUpCallback: TrackCallback,
        private moveDownCallback: TrackCallback,
        private removeCallback: TrackCallback,
        private sortChangeCallback: (
            trackId: TrackId,
            sortDirection: TrackSortDirection
        ) => void,
        private unexpandCallback: TrackCallback,
        private showGapsCallback: (
            trackId: TrackId,
            showGaps: GAP_MODE_ENUM
        ) => void
    ) {
        const position = $div.css('position');
        if (position !== 'absolute' && position !== 'relative') {
            console.log(
                'WARNING: div passed to OncoprintTrackOptionsView must be absolute or relative positioned - layout problems will occur'
            );
        }

        this.$ctr = $('<div></div>')
            .css({
                position: 'absolute',
                'overflow-y': 'hidden',
                'overflow-x': 'hidden',
            })
            .appendTo(this.$div);
        this.$buttons_ctr = $('<div></div>')
            .css({ position: 'absolute' })
            .appendTo(this.$ctr);
        this.$dropdown_ctr = $('<div></div>')
            .css({ position: 'absolute' })
            .appendTo(this.$div);

        const self = this;
        this.clickHandler = function() {
            $(document).trigger(CLOSE_MENUS_EVENT);
        };
        $(document).on('click', this.clickHandler);
    }

    private renderAllOptions(model: OncoprintModel) {
        if (this.rendering_suppressed) {
            return;
        }
        const self = this;
        $(document).off(CLOSE_MENUS_EVENT);
        $(document).on(CLOSE_MENUS_EVENT, function() {
            self.hideAllMenus();
        });

        this.$buttons_ctr.empty();
        this.$dropdown_ctr.empty();
        this.scroll(model.getVertScroll());

        var tracks = model.getTracks();
        var minimum_track_height = Number.POSITIVE_INFINITY;
        for (let i = 0; i < tracks.length; i++) {
            minimum_track_height = Math.min(
                minimum_track_height,
                model.getTrackHeight(tracks[i])
            );
        }
        this.img_size = Math.floor(minimum_track_height * 0.75);

        for (let i = 0; i < tracks.length; i++) {
            this.renderTrackOptions(model, tracks[i], i);
        }
    }

    private scroll(scroll_y: number) {
        if (this.rendering_suppressed) {
            return;
        }
        this.$buttons_ctr.css({ top: -scroll_y });
        this.$dropdown_ctr.css({ top: -scroll_y });

        this.hideAllMenus();
    }

    private resize(model: OncoprintModel, getCellViewHeight: () => number) {
        if (this.rendering_suppressed) {
            return;
        }
        this.$div.css({ width: this.getWidth(), height: getCellViewHeight() });
        this.$ctr.css({ width: this.getWidth(), height: getCellViewHeight() });
    }

    private hideTrackMenu(track_id: TrackId) {
        this.menu_shown[track_id] = false;
        const $elts = this.track_options_$elts[track_id];
        $elts.$dropdown.css({ 'z-index': 1 });
        $elts.$dropdown.css({ border: '1px solid rgba(125,125,125,0)' });
        $elts.$img.css({ border: '1px solid rgba(125,125,125,0)' });
        $elts.$dropdown.fadeOut(100);
    }

    private showTrackMenu(track_id: TrackId) {
        this.menu_shown[track_id] = true;
        const $elts = this.track_options_$elts[track_id];
        $elts.$dropdown.css({ 'z-index': 10 });
        $elts.$dropdown.css({ border: '1px solid rgba(125,125,125,1)' });
        $elts.$img.css({ border: '1px solid rgba(125,125,125,1)' });
        $elts.$dropdown.fadeIn(100);
    }

    private hideAllMenus() {
        for (const track_id in this.track_options_$elts) {
            if (this.track_options_$elts.hasOwnProperty(track_id)) {
                this.hideTrackMenu(parseInt(track_id, 10));
            }
        }
    }

    private hideMenusExcept(track_id: TrackId) {
        for (const _other_track_id in this.track_options_$elts) {
            if (this.track_options_$elts.hasOwnProperty(_other_track_id)) {
                const other_track_id = parseInt(_other_track_id, 10);
                if (other_track_id === track_id) {
                    continue;
                }
                this.hideTrackMenu(other_track_id);
            }
        }

        $(document).trigger(HEADER_VIEW_CLOSE_MENUS_EVENT);
    }

    private static $makeDropdownOption(
        text: string,
        weight: string,
        disabled?: boolean,
        callback?: (evt: ClickEvent) => void
    ) {
        const li = $('<li>')
            .text(text)
            .css({
                'font-weight': weight,
                'font-size': 12,
                'border-bottom': '1px solid rgba(0,0,0,0.3)',
            });
        if (!disabled) {
            if (callback) {
                li.addClass('clickable');
                li.css({ cursor: 'pointer' });
                li.click(callback).hover(
                    function() {
                        $(this).css({ 'background-color': 'rgb(200,200,200)' });
                    },
                    function() {
                        $(this).css({
                            'background-color': 'rgba(255,255,255,0)',
                        });
                    }
                );
            } else {
                li.click(function(evt) {
                    evt.stopPropagation();
                });
            }
        } else {
            li.addClass('disabled');
            li.css({ color: 'rgb(200, 200, 200)', cursor: 'default' });
        }
        return li;
    }

    private static $makeDropdownSeparator() {
        return $('<li>')
            .css({ 'border-top': '1px solid black' })
            .addClass(SEPARATOR_CLASS);
    }

    // 11/2/2023 we are removing sort arrow
    // leaving commented out if it needs to be restored based on complaint
    private static renderSortArrow(
        $sortarrow: JQuery,
        model: OncoprintModel,
        track_id: TrackId
    ) {
        // let sortarrow_char = '';
        // if (model.isTrackSortDirectionChangeable(track_id)) {
        //     sortarrow_char = {
        //         '1':
        //             '<i class="fa fa-signal" aria-hidden="true" title="Sorted ascending"></i>',
        //         '-1':
        //             '<i class="fa fa-signal" style="transform: scaleX(-1);" aria-hidden="true" title="Sorted descending"></i>',
        //         '0': '',
        //     }[model.getTrackSortDirection(track_id)];
        // }
        // $sortarrow.html(sortarrow_char);
    }

    private renderTrackOptions(
        model: OncoprintModel,
        track_id: TrackId,
        index: number
    ) {
        let $div: JQuery, $img: JQuery, $sortarrow: JQuery, $dropdown: JQuery;
        const top = model.getZoomedTrackTops(track_id);
        $div = $('<div>')
            .appendTo(this.$buttons_ctr)
            .css({
                position: 'absolute',
                left: '0px',
                top: top + 'px',
                'white-space': 'nowrap',
            });
        $img = $('<img/>')
            .appendTo($div)
            .attr({
                src: menuDotsIcon,
                alt: 'Menu Dots Icon',
                width: this.img_size,
                height: this.img_size,
            })
            .css({
                float: 'left',
                cursor: 'pointer',
                border: '1px solid rgba(125,125,125,0)',
            })
            .addClass(TOGGLE_BTN_CLASS)
            .addClass(NTH_CLASS_PREFIX + (index + 1));
        $sortarrow = $('<span>')
            .appendTo($div)
            .css({
                position: 'absolute',
                top: Math.floor(this.img_size / 4) + 'px',
            });
        $dropdown = $('<ul>')
            .appendTo(this.$dropdown_ctr)
            .css({
                position: 'absolute',
                width: 120,
                display: 'none',
                'list-style-type': 'none',
                'padding-left': '6',
                'padding-right': '6',
                float: 'right',
                'background-color': 'rgb(255,255,255)',
                left: '0px',
                top: top + this.img_size + 'px',
            })
            .addClass(DROPDOWN_CLASS)
            .addClass(NTH_CLASS_PREFIX + (index + 1));
        this.track_options_$elts[track_id] = {
            $div: $div,
            $img: $img,
            $dropdown: $dropdown,
        };

        OncoprintTrackOptionsView.renderSortArrow($sortarrow, model, track_id);

        const self = this;
        $img.hover(
            function(evt) {
                if (!self.menu_shown[track_id]) {
                    $(this).css({ border: '1px solid rgba(125,125,125,0.3)' });
                }
            },
            function(evt) {
                if (!self.menu_shown[track_id]) {
                    $(this).css({ border: '1px solid rgba(125,125,125,0)' });
                }
            }
        );
        $img.click(function(evt) {
            evt.stopPropagation();
            if ($dropdown.is(':visible')) {
                $img.addClass(TOGGLE_BTN_OPEN_CLASS);
                self.hideTrackMenu(track_id);
            } else {
                $img.removeClass(TOGGLE_BTN_OPEN_CLASS);
                self.showTrackMenu(track_id);
            }
            self.hideMenusExcept(track_id);
        });

        const movingDisabled =
            model.getTrackMovable(track_id) &&
            model.isTrackInClusteredGroup(track_id);

        if (model.getTrackMovable(track_id)) {
            $dropdown.append(
                OncoprintTrackOptionsView.$makeDropdownOption(
                    'Move up',
                    'normal',
                    movingDisabled,
                    function(evt) {
                        evt.stopPropagation();
                        self.moveUpCallback(track_id);
                    }
                )
            );
            $dropdown.append(
                OncoprintTrackOptionsView.$makeDropdownOption(
                    'Move down',
                    'normal',
                    movingDisabled,
                    function(evt) {
                        evt.stopPropagation();
                        self.moveDownCallback(track_id);
                    }
                )
            );
        }
        if (model.isTrackRemovable(track_id)) {
            $dropdown.append(
                OncoprintTrackOptionsView.$makeDropdownOption(
                    'Remove track',
                    'normal',
                    false,
                    function(evt) {
                        evt.stopPropagation();
                        self.removeCallback(track_id);
                    }
                )
            );
        }
        if (model.isTrackSortDirectionChangeable(track_id)) {
            $dropdown.append(
                OncoprintTrackOptionsView.$makeDropdownSeparator()
            );
            let $sort_inc_li: JQuery;
            let $sort_dec_li: JQuery;
            let $dont_sort_li: JQuery;
            $sort_inc_li = OncoprintTrackOptionsView.$makeDropdownOption(
                'Sort a-Z',
                model.getTrackSortDirection(track_id) === 1 ? 'bold' : 'normal',
                false,
                function(evt) {
                    evt.stopPropagation();
                    $sort_inc_li.css('font-weight', 'bold');
                    $sort_dec_li.css('font-weight', 'normal');
                    $dont_sort_li.css('font-weight', 'normal');
                    self.sortChangeCallback(track_id, 1);
                    OncoprintTrackOptionsView.renderSortArrow(
                        $sortarrow,
                        model,
                        track_id
                    );
                }
            );
            $sort_dec_li = OncoprintTrackOptionsView.$makeDropdownOption(
                'Sort Z-a',
                model.getTrackSortDirection(track_id) === -1
                    ? 'bold'
                    : 'normal',
                false,
                function(evt) {
                    evt.stopPropagation();
                    $sort_inc_li.css('font-weight', 'normal');
                    $sort_dec_li.css('font-weight', 'bold');
                    $dont_sort_li.css('font-weight', 'normal');
                    self.sortChangeCallback(track_id, -1);
                    OncoprintTrackOptionsView.renderSortArrow(
                        $sortarrow,
                        model,
                        track_id
                    );
                }
            );
            $dont_sort_li = OncoprintTrackOptionsView.$makeDropdownOption(
                "Don't sort track",
                model.getTrackSortDirection(track_id) === 0 ? 'bold' : 'normal',
                false,
                function(evt) {
                    evt.stopPropagation();
                    $sort_inc_li.css('font-weight', 'normal');
                    $sort_dec_li.css('font-weight', 'normal');
                    $dont_sort_li.css('font-weight', 'bold');
                    self.sortChangeCallback(track_id, 0);
                    OncoprintTrackOptionsView.renderSortArrow(
                        $sortarrow,
                        model,
                        track_id
                    );
                }
            );
            $dropdown.append($sort_inc_li);
            $dropdown.append($sort_dec_li);
            $dropdown.append($dont_sort_li);
        }
        if (model.isTrackExpandable(track_id)) {
            $dropdown.append(
                OncoprintTrackOptionsView.$makeDropdownOption(
                    model.getExpandButtonText(track_id),
                    'normal',
                    false,
                    function(evt) {
                        evt.stopPropagation();
                        // close the menu to discourage clicking again, as it
                        // may take a moment to finish expanding
                        self.renderAllOptions(model);
                        model.expandTrack(track_id);
                    }
                )
            );
        }
        if (model.isTrackExpanded(track_id)) {
            $dropdown.append(
                OncoprintTrackOptionsView.$makeDropdownOption(
                    'Remove expansion',
                    'normal',
                    false,
                    function(evt) {
                        evt.stopPropagation();
                        self.unexpandCallback(track_id);
                    }
                )
            );
        }
        if (model.getTrackCanShowGaps(track_id)) {
            $dropdown.append(
                OncoprintTrackOptionsView.$makeDropdownSeparator()
            );

            const $show_gaps_percent_opt = OncoprintTrackOptionsView.$makeDropdownOption(
                model.getTrackShowGaps(track_id) ===
                    GAP_MODE_ENUM.SHOW_GAPS_PERCENT
                    ? 'Hide gaps (w/%)'
                    : 'Show Gaps (w/%)',
                model.getTrackShowGaps(track_id) ===
                    GAP_MODE_ENUM.SHOW_GAPS_PERCENT
                    ? 'bold'
                    : 'normal',
                false,
                function(evt) {
                    evt.stopPropagation();
                    $show_gaps_opt.css('font-weight', 'bold');
                    const mode: GAP_MODE_ENUM = [
                        GAP_MODE_ENUM.SHOW_GAPS_PERCENT,
                    ].includes(model.getTrackShowGaps(track_id))
                        ? GAP_MODE_ENUM.HIDE_GAPS
                        : GAP_MODE_ENUM.SHOW_GAPS_PERCENT;
                    self.showGapsCallback(track_id, mode);
                }
            );

            const $show_gaps_opt = OncoprintTrackOptionsView.$makeDropdownOption(
                model.getTrackShowGaps(track_id) === GAP_MODE_ENUM.SHOW_GAPS
                    ? 'Hide gaps'
                    : 'Show Gaps',
                model.getTrackShowGaps(track_id) === GAP_MODE_ENUM.SHOW_GAPS
                    ? 'bold'
                    : 'normal',
                false,
                function(evt) {
                    evt.stopPropagation();
                    $show_gaps_opt.css('font-weight', 'bold');
                    const mode: GAP_MODE_ENUM = [
                        GAP_MODE_ENUM.SHOW_GAPS,
                    ].includes(model.getTrackShowGaps(track_id))
                        ? GAP_MODE_ENUM.HIDE_GAPS
                        : GAP_MODE_ENUM.SHOW_GAPS;
                    self.showGapsCallback(track_id, mode);
                }
            );

            $dropdown.append($show_gaps_opt);
            $dropdown.append($show_gaps_percent_opt);
        }
        // Add custom options
        const custom_options = model.getTrackCustomOptions(track_id);
        if (custom_options && custom_options.length > 0) {
            for (var i = 0; i < custom_options.length; i++) {
                (function() {
                    // wrapped in function to prevent scope issues
                    var option = custom_options[i];
                    if (option.separator) {
                        $dropdown.append(
                            OncoprintTrackOptionsView.$makeDropdownSeparator()
                        );
                    } else {
                        $dropdown.append(
                            OncoprintTrackOptionsView.$makeDropdownOption(
                                option.label || '',
                                option.weight || 'normal',
                                option.disabled,
                                option.onClick &&
                                    function(evt) {
                                        evt.stopPropagation();
                                        option.onClick(track_id);
                                    }
                            )
                        );
                    }
                })();
            }
        }

        if ($dropdown.is(':empty')) {
            // if no options, then delete elements
            $div.remove();
            $dropdown.remove();
        }
    }

    public enableInteraction() {
        this.interaction_disabled = false;
    }
    public disableInteraction() {
        this.interaction_disabled = true;
    }
    public suppressRendering() {
        this.rendering_suppressed = true;
    }
    public releaseRendering(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        this.rendering_suppressed = false;
        this.renderAllOptions(model);
        this.resize(model, getCellViewHeight);
        this.scroll(model.getVertScroll());
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
    public setVertZoom(model: OncoprintModel, getCellViewHeight: () => number) {
        this.renderAllOptions(model);
        this.resize(model, getCellViewHeight);
    }
    public setTrackGroupHeader(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        this.renderAllOptions(model);
        this.resize(model, getCellViewHeight);
    }
    public sort(model: OncoprintModel, getCellViewHeight: () => number) {
        this.renderAllOptions(model);
        this.resize(model, getCellViewHeight);
    }
    public setViewport(model: OncoprintModel, getCellViewHeight: () => number) {
        this.renderAllOptions(model);
        this.resize(model, getCellViewHeight);
        this.scroll(model.getVertScroll());
    }
    public getWidth() {
        if (this.$buttons_ctr.is(':empty')) {
            return 0;
        } else {
            return 18 + this.img_size;
        }
    }
    public setTrackShowGaps(
        model: OncoprintModel,
        getCellViewHeight: () => number
    ) {
        this.renderAllOptions(model);
        this.resize(model, getCellViewHeight);
    }
    public addTracks(model: OncoprintModel, getCellViewHeight: () => number) {
        this.setTrackShowGaps(model, getCellViewHeight);
        this.renderAllOptions(model);
        this.resize(model, getCellViewHeight);
    }
    public moveTrack(model: OncoprintModel, getCellViewHeight: () => number) {
        this.renderAllOptions(model);
        this.resize(model, getCellViewHeight);
    }
    public setTrackGroupOrder(model: OncoprintModel) {
        this.renderAllOptions(model);
    }
    public setSortConfig(model: OncoprintModel) {
        this.renderAllOptions(model);
    }
    public removeTrack(
        model: OncoprintModel,
        track_id: TrackId,
        getCellViewHeight: () => number
    ) {
        delete this.track_options_$elts[track_id];
        this.renderAllOptions(model);
        this.resize(model, getCellViewHeight);
    }
    public destroy() {
        $(document).off('click', this.clickHandler);
        $(document).off(CLOSE_MENUS_EVENT);
    }
    public setTrackCustomOptions(model: OncoprintModel) {
        this.renderAllOptions(model);
    }
    public setTrackMovable(model: OncoprintModel) {
        this.renderAllOptions(model);
    }
}
