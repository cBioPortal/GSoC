import OncoprintModel from './oncoprintmodel';
import menuDotsIcon from '../img/menudots.svg';
import svgfactory from './svgfactory';
import $ from 'jquery';
import ClickEvent = JQuery.ClickEvent;
import { CLOSE_MENUS_EVENT as TRACK_OPTIONS_VIEW_CLOSE_MENUS_EVENT } from './oncoprinttrackoptionsview';

const MENU_DOTS_SIZE = 20;
const LABEL_CLASS = 'oncoprintjs__header__label';
const TOGGLE_BTN_CLASS = 'oncoprintjs__header__toggle_btn_img';
const TOGGLE_BTN_OPEN_CLASS = 'oncoprintjs__header__open';
const DROPDOWN_CLASS = 'oncoprintjs__header__dropdown';
const SEPARATOR_CLASS = 'oncoprintjs__header__separator';
const NTH_CLASS_PREFIX = 'track-group-';

const FADE_MS = 100;

const HEADER_FONT_SIZE = 16;

export const CLOSE_MENUS_EVENT = 'oncoprint-header-view.do-close-menus';

export default class OncoprintHeaderView {
    private rendering_suppressed = false;
    private $occluded_ctr: JQuery; // holds labels and menu buttons, which can be occluded by scrolling
    private $dropdowns_ctr: JQuery;
    private clickHandler: () => void;
    private $dropdowns: JQuery[] = [];

    constructor($div: JQuery) {
        $div.css({
            position: 'relative',
            'pointer-events': 'none',
        });

        const $occluding_superctr = $('<div/>')
            .appendTo($div)
            .css({
                position: 'relative',
                'overflow-y': 'hidden',
                'overflow-x': 'hidden',
                width: '100%',
                height: '100%',
            });
        this.$occluded_ctr = $('<div/>')
            .appendTo($occluding_superctr)
            .css({
                position: 'absolute',
                width: '100%',
                height: '100%',
            });

        this.$dropdowns_ctr = $('<div/>')
            .appendTo($div)
            .css({
                position: 'absolute',
                width: '100%',
                height: '100%',
            });

        this.clickHandler = () => {
            $(document).trigger(CLOSE_MENUS_EVENT);
        };
        $(document).on('click', this.clickHandler);

        $(document).on(CLOSE_MENUS_EVENT, () => {
            this.closeAllDropdowns();
        });
    }

    public destroy() {
        $(document).off('click', this.clickHandler);
        $(document).off(CLOSE_MENUS_EVENT);
    }

    private closeAllDropdowns() {
        for (const $dropdown of this.$dropdowns) {
            $dropdown.fadeOut(FADE_MS);
        }
    }

    private closeDropdownsExcept($keep_open_dropdown: JQuery) {
        for (const $dropdown of this.$dropdowns) {
            if ($dropdown !== $keep_open_dropdown) {
                $dropdown.fadeOut(FADE_MS);
            }
        }
        $(document).trigger(TRACK_OPTIONS_VIEW_CLOSE_MENUS_EVENT);
    }

    private static $makeDropdownOption(
        text: string,
        weight: string,
        isDisabled?: () => boolean,
        callback?: (evt: ClickEvent) => void
    ) {
        const li = $('<li>')
            .text(text)
            .css({
                'font-weight': weight,
                'font-size': 12,
                'border-bottom': '1px solid rgba(0,0,0,0.3)',
            });
        const disabled = isDisabled && isDisabled();
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

    public render(model: OncoprintModel) {
        // clear existing elements
        this.$occluded_ctr.empty();
        this.$occluded_ctr.css({
            top: -model.getVertScroll(),
        });
        this.$dropdowns_ctr.empty();
        this.$dropdowns_ctr.css({
            top: -model.getVertScroll(),
        });
        this.$dropdowns = [];

        // add headers
        const trackGroups = model.getTrackGroups();
        const headerTops = model.getZoomedHeaderTops();

        trackGroups.forEach((group, trackGroupIndex) => {
            if (group.header) {
                const $headerDiv = $('<div/>').css({
                    'pointer-events': 'auto',
                });

                // add label
                $(`<span>${group.header.label.text}</span>`)
                    .appendTo($headerDiv)
                    .css({
                        'margin-right': 10,
                        // TODO - custom styling
                        'font-weight': 'bold',
                        'text-decoration': 'underline',
                        'font-size': HEADER_FONT_SIZE,
                        'font-family': 'Arial',
                    })
                    .addClass(LABEL_CLASS);

                if (group.header.options.length > 0) {
                    // add dropdown menu
                    const $dropdown = $('<ul>')
                        .appendTo(this.$dropdowns_ctr)
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
                            top: headerTops[trackGroupIndex] + MENU_DOTS_SIZE,
                            'pointer-events': 'auto',
                        })
                        .addClass(DROPDOWN_CLASS)
                        .addClass(NTH_CLASS_PREFIX + trackGroupIndex);

                    this.$dropdowns.push($dropdown);

                    const populateDropdownOptions = () => {
                        // repopulate dropdown every time it opens, and every time an option is clicked,
                        //      in order to update dynamic disabled status and weight
                        $dropdown.empty();
                        // add dropdown options
                        group.header.options.forEach(option => {
                            if (option.separator) {
                                $dropdown.append(
                                    OncoprintHeaderView.$makeDropdownSeparator()
                                );
                            } else {
                                $dropdown.append(
                                    OncoprintHeaderView.$makeDropdownOption(
                                        option.label || '',
                                        option.weight
                                            ? option.weight()
                                            : 'normal',
                                        option.disabled,
                                        function(evt) {
                                            evt.stopPropagation();
                                            option.onClick &&
                                                option.onClick(trackGroupIndex);
                                            populateDropdownOptions();
                                        }
                                    )
                                );
                            }
                        });
                    };

                    // add dropdown button
                    const $img = $('<img/>')
                        .appendTo($headerDiv)
                        .attr({
                            src: menuDotsIcon,
                            alt: 'Menu Dots Icon',
                            width: MENU_DOTS_SIZE,
                            height: MENU_DOTS_SIZE,
                        })
                        .css({
                            cursor: 'pointer',
                            border: '1px solid rgba(125,125,125,0)',
                            display: 'inline-block',
                        })
                        .addClass(TOGGLE_BTN_CLASS)
                        .addClass(NTH_CLASS_PREFIX + trackGroupIndex)
                        .on('click', evt => {
                            evt.stopPropagation();
                            if ($dropdown.is(':visible')) {
                                $img.removeClass(TOGGLE_BTN_OPEN_CLASS);
                                $dropdown.fadeOut(FADE_MS);
                            } else {
                                populateDropdownOptions();
                                $dropdown.css('left', $img.offset().left);
                                $img.addClass(TOGGLE_BTN_OPEN_CLASS);
                                $dropdown.fadeIn(FADE_MS);
                                this.closeDropdownsExcept($dropdown);
                            }
                        });
                }

                $headerDiv.css({
                    position: 'absolute',
                    top: headerTops[trackGroupIndex],
                    left: 0,
                    width: '100%',
                });
                this.$occluded_ctr.append($headerDiv);
            }
        });
    }

    public setScroll(model: OncoprintModel) {
        this.$occluded_ctr.css({
            top: -model.getVertScroll(),
        });
        this.$dropdowns_ctr.css({
            top: -model.getVertScroll(),
        });

        this.closeAllDropdowns();
    }

    public setVertScroll(model: OncoprintModel) {
        this.setScroll(model);
    }

    public suppressRendering() {
        this.rendering_suppressed = true;
    }
    public releaseRendering(model: OncoprintModel) {
        this.rendering_suppressed = false;
        this.render(model);
    }
    public toSVGGroup(
        model: OncoprintModel,
        offset_x: number,
        offset_y: number
    ) {
        const group = svgfactory.group(offset_x || 0, offset_y || 0);
        const trackGroups = model.getTrackGroups();
        const headerTops = model.getZoomedHeaderTops();

        trackGroups.forEach((trackGroup, index) => {
            const header = trackGroup.header;
            if (header) {
                const y = headerTops[index];
                group.appendChild(
                    svgfactory.text(
                        header.label.text,
                        0,
                        y,
                        HEADER_FONT_SIZE,
                        'Arial',
                        'bold',
                        undefined,
                        undefined,
                        'underline'
                    )
                );
            }
        });

        return group;
    }
}
