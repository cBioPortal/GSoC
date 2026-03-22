import $ from 'jquery';

const TOOLTIP_CLASS = 'oncoprintjs__tooltip';

export type OncoprintTooltipParams = { noselect?: boolean };

export default class OncoprintToolTip {
    private $div: JQuery;
    private hide_timeout_id: number | undefined;
    private show_timeout_id: number | undefined;
    public center: boolean;
    private shown: boolean;

    constructor(private $container: JQuery, params?: OncoprintTooltipParams) {
        params = params || {};

        this.$div = $('<div></div>')
            .addClass(TOOLTIP_CLASS)
            .appendTo($container)
            .css({
                'background-color': 'rgba(255,255,255,1)',
                position: 'absolute',
                display: 'none',
                border: '1px solid black',
                'max-width': 300,
                'min-width': 150,
            });
        if (params.noselect) {
            this.$div.addClass('noselect');
        }
        this.hide_timeout_id = undefined;
        this.show_timeout_id = undefined;
        this.center = false;

        this.shown = false;

        const self = this;
        this.$div.on('mousemove', function(evt) {
            evt.stopPropagation();
            self.cancelScheduledHide();
        });
        this.$div.on('mouseleave', function(evt) {
            evt.stopPropagation();
            self.hide();
        });
    }
    public show(
        wait: number | undefined,
        viewport_x: number,
        viewport_y: number,
        $contents: JQuery,
        fade?: boolean
    ) {
        this.cancelScheduledHide();

        if (typeof wait !== 'undefined' && !this.shown) {
            const self = this;
            this.cancelScheduledShow();
            this.show_timeout_id = setTimeout(function() {
                self.doShow(viewport_x, viewport_y, $contents, fade);
            }, wait) as any;
        } else {
            this.doShow(viewport_x, viewport_y, $contents, fade);
        }
    }
    private doShow(
        viewport_x: number,
        viewport_y: number,
        $contents: JQuery,
        fade?: boolean
    ) {
        this.cancelScheduledShow();
        this.show_timeout_id = undefined;
        this.$div.empty();
        this.$div.css({ top: 0, left: 0, 'z-index': 9999 }); // put up top left so that it doesnt cause any page expansion, before the position calculation which depends on page size
        this.$div.append($contents);
        if (!fade) {
            this.$div.show();
        } else {
            this.$div.stop().fadeIn('fast');
        }
        // adjust tooltip position based on size of contents
        let x = viewport_x - (this.center ? this.$div.width() / 2 : 0);
        let y = viewport_y - this.$div.height();
        // clamp to visible area
        const min_padding = 20;
        y = Math.max(y, min_padding); // make sure not too high
        y = Math.min(y, $(window).height() - this.$div.height()); // make sure not too low
        x = Math.max(x, min_padding); // make sure not too left
        x = Math.min(x, $(window).width() - this.$div.width() - min_padding); // make sure not too right

        this.$div.css({ top: y, left: x, 'z-index': 9999 });
        this.shown = true;
    }
    private doHide(fade?: boolean) {
        this.cancelScheduledHide();
        this.hide_timeout_id = undefined;
        if (!fade) {
            this.$div.hide();
        } else {
            this.$div.fadeOut();
        }
        this.shown = false;
    }
    private cancelScheduledShow() {
        clearTimeout(this.show_timeout_id);
        this.show_timeout_id = undefined;
    }
    private cancelScheduledHide() {
        clearTimeout(this.hide_timeout_id);
        this.hide_timeout_id = undefined;
    }
    public showIfNotAlreadyGoingTo(
        wait: number | undefined,
        viewport_x: number,
        viewport_y: number,
        $contents: JQuery
    ) {
        if (typeof this.show_timeout_id === 'undefined') {
            this.show(wait, viewport_x, viewport_y, $contents);
        }
    }
    public hideIfNotAlreadyGoingTo(wait?: number) {
        if (typeof this.hide_timeout_id === 'undefined') {
            this.hide(wait);
        }
    }
    public hide(wait?: number) {
        this.cancelScheduledShow();

        if (!this.shown) {
            return;
        }

        if (typeof wait !== 'undefined') {
            const self = this;
            this.cancelScheduledHide();
            this.hide_timeout_id = setTimeout(function() {
                self.doHide();
            }, wait) as any;
        } else {
            this.doHide();
        }
    }
    public fadeIn(
        wait: number | undefined,
        viewport_x: number,
        viewport_y: number,
        $contents: JQuery
    ) {
        this.show(wait, viewport_x, viewport_y, $contents, true);
    }
}
