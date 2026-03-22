import $ from 'jquery';
import MouseMoveEvent = JQuery.MouseMoveEvent;
import MouseDownEvent = JQuery.MouseDownEvent;

const VERTICAL = 'v';
const HORIZONTAL = 'h';

function clamp(x: number) {
    return Math.max(Math.min(x, 1), 0);
}

export type OncoprintZoomSliderParams = {
    btn_size: number;
    horizontal?: boolean;
    width?: number;

    vertical?: boolean; // either horizontal and width, or vertical and height, must be set
    height?: number;

    init_val: number;
    left: number;
    top: number;
    onChange: (val: number) => void;
};

export default class OncoprintZoomSlider {
    private $div: JQuery;
    private onChange: OncoprintZoomSliderParams['onChange'];
    private value: number;
    private slider_bar_size: number;
    private orientation: 'v' | 'h';
    private $slider: JQuery;
    private $plus_btn: JQuery;
    private $minus_btn: JQuery;

    constructor(
        $container: JQuery,
        params?: Partial<OncoprintZoomSliderParams>
    ) {
        this.$div = $('<div>')
            .css({
                position: 'absolute',
                top: params.top || 0,
                left: params.left || 0,
            })
            .appendTo($container);
        params = params || {};
        params.btn_size = params.btn_size || 13;
        this.onChange = params.onChange || function() {};

        this.initialize(params as OncoprintZoomSliderParams);

        this.value = params.init_val === undefined ? 0.5 : params.init_val;
        this.slider_bar_size =
            (this.orientation === VERTICAL ? params.height : params.width) -
            2 * params.btn_size;
        this.updateSliderPos();
    }

    private initialize(params: OncoprintZoomSliderParams) {
        var $ctr = this.$div;
        var icon_size = Math.round(params.btn_size * 0.7);
        var icon_div_border_size = 1;
        var icon_padding = Math.round((params.btn_size - icon_size) / 2);
        var $slider_bar = $('<div>')
            .css({
                position: 'absolute',
                'background-color': '#ffffff',
                outline: 'solid 1px black',
            })
            .appendTo($ctr);
        var $slider = $('<div>')
            .css({
                position: 'absolute',
                'background-color': '#ffffff',
                border: 'solid 1px black',
                'border-radius': '3px',
                cursor: 'pointer',
            })
            .appendTo($ctr);

        var $plus_btn = $('<div>')
            .css({
                position: 'absolute',
                'min-height': params.btn_size,
                'min-width': params.btn_size,
                'background-color': '#ffffff',
                border: `solid ${icon_div_border_size}px black`,
                'border-radius': '3px',
                cursor: 'pointer',
            })
            .appendTo($ctr);
        $('<span>')
            .addClass('icon fa fa-plus')
            .css({
                position: 'absolute',
                top: icon_padding - icon_div_border_size,
                left: icon_padding - icon_div_border_size,
                'min-width': icon_size,
                'min-height': icon_size,
            })
            .appendTo($plus_btn);
        var $minus_btn = $('<div>')
            .css({
                position: 'absolute',
                'min-height': params.btn_size,
                'min-width': params.btn_size,
                'background-color': '#ffffff',
                border: `solid ${icon_div_border_size}px black`,
                'border-radius': '3px',
                cursor: 'pointer',
            })
            .appendTo($ctr);
        $('<span>')
            .addClass('icon fa fa-minus')
            .css({
                position: 'absolute',
                top: icon_padding - icon_div_border_size,
                left: icon_padding - icon_div_border_size,
                'min-width': icon_size,
                'min-height': icon_size,
            })
            .appendTo($minus_btn);
        if (params.vertical) {
            $slider_bar.css({
                'min-height': params.height - 2 * params.btn_size,
                'min-width': Math.round(params.btn_size / 5),
            });
            $slider.css({
                'min-height': Math.round(params.btn_size / 2),
                'min-width': params.btn_size,
            });

            $plus_btn.css({ top: 0, left: 0 });
            $minus_btn.css({ top: params.height - params.btn_size, left: 0 });
            $slider_bar.css({
                top: params.btn_size,
                left: 0.4 * params.btn_size,
            });
            $slider.css({ left: 0 });
            this.orientation = VERTICAL;
        } else {
            $slider_bar.css({
                'min-height': Math.round(params.btn_size / 5),
                'min-width': params.width - 2 * params.btn_size,
            });
            $slider.css({
                'min-height': params.btn_size,
                'min-width': Math.round(params.btn_size / 2),
            });

            $plus_btn.css({ top: 0, left: params.width - params.btn_size });
            $minus_btn.css({ top: 0, left: 0 });
            $slider_bar.css({
                top: 0.4 * params.btn_size,
                left: params.btn_size,
            });
            $slider.css({ top: 0 });
            this.orientation = HORIZONTAL;
        }

        const self = this;

        $plus_btn.click(function() {
            self.value /= 0.7;
            params.onChange(self.value);
        });
        $minus_btn.click(function() {
            self.value *= 0.7;
            params.onChange(self.value);
        });

        [$slider, $plus_btn, $minus_btn].map(function($btn) {
            $btn.hover(
                function() {
                    $(this).css({ 'background-color': '#cccccc' });
                },
                function() {
                    $(this).css({ 'background-color': '#ffffff' });
                }
            );
        });

        this.$slider = $slider;
        this.$plus_btn = $plus_btn;
        this.$minus_btn = $minus_btn;

        (function setUpSliderDrag() {
            let start_mouse: number;
            let start_val: number;
            let dragging: boolean;
            function handleSliderDrag(evt: MouseMoveEvent) {
                evt.stopPropagation();
                evt.preventDefault();
                let delta_mouse;
                if (self.orientation === VERTICAL) {
                    delta_mouse = start_mouse - evt.pageY; // vertical zoom, positive is up, but CSS positive is down, so we need to invert
                } else {
                    delta_mouse = evt.pageX - start_mouse;
                }
                const delta_val = delta_mouse / self.slider_bar_size;
                self.setSliderValue(start_val + delta_val);
            }
            function stopSliderDrag() {
                if (dragging && start_val !== self.value) {
                    self.onChange(self.value);
                }
                dragging = false;
            }
            self.$slider.on('mousedown', function(evt: MouseDownEvent) {
                if (self.orientation === VERTICAL) {
                    start_mouse = evt.pageY;
                } else {
                    start_mouse = evt.pageX;
                }
                start_val = self.value;
                dragging = true;
                $(document).on('mousemove', handleSliderDrag);
            });
            $(document).on('mouseup click', function() {
                $(document).off('mousemove', handleSliderDrag);
                stopSliderDrag();
            });
        })();
    }

    private updateSliderPos() {
        const proportion = this.value;
        var $slider = this.$slider;
        var bounds = this.getSliderBounds();
        if (this.orientation === VERTICAL) {
            $slider.css(
                'top',
                bounds.bottom * (1 - proportion) + bounds.top * proportion
            );
        } else if (this.orientation === HORIZONTAL) {
            $slider.css(
                'left',
                bounds.left * (1 - proportion) + bounds.right * proportion
            );
        }
    }

    private getSliderBounds() {
        if (this.orientation === VERTICAL) {
            return {
                bottom:
                    parseInt(this.$minus_btn.css('top'), 10) -
                    parseInt(this.$slider.css('min-height'), 10),
                top:
                    parseInt(this.$plus_btn.css('top'), 10) +
                    parseInt(this.$plus_btn.css('min-height'), 10),
            };
        } else {
            return {
                left:
                    parseInt(this.$minus_btn.css('left'), 10) +
                    parseInt(this.$minus_btn.css('min-width'), 10),
                right:
                    parseInt(this.$plus_btn.css('left'), 10) -
                    parseInt(this.$slider.css('min-width'), 10),
            };
        }
    }

    public setSliderValue(proportion: number) {
        this.value = clamp(proportion);
        this.updateSliderPos();
    }
}
