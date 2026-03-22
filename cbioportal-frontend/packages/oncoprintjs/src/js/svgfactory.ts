import makeSVGElement from './makesvgelement';
import shapeToSVG from './oncoprintshapetosvg';
import { ComputedShapeParams } from './oncoprintshape';
import { RGBAColor } from './oncoprintruleset';
import { rgbString } from './utils';

function makeIdCounter() {
    let id = 0;
    return function() {
        id += 1;
        return id;
    };
}

const gradientId = makeIdCounter();

export default {
    text: function(
        content: string,
        x?: number,
        y?: number,
        size?: number,
        family?: string,
        weight?: string,
        alignment_baseline?: string,
        fill?: string,
        text_decoration?: string
    ) {
        size = size || 12;
        var alignment_baseline_y_offset = size;
        if (alignment_baseline === 'middle') {
            alignment_baseline_y_offset = size / 2;
        } else if (alignment_baseline === 'bottom') {
            alignment_baseline_y_offset = 0;
        }
        var elt = makeSVGElement('text', {
            x: x || 0,
            y: (y || 0) + alignment_baseline_y_offset,
            'font-size': size,
            'font-family': family || 'serif',
            'font-weight': weight || 'normal',
            'text-anchor': 'start',
            fill: fill,
            'text-decoration': text_decoration,
        });
        elt.textContent = content + '';
        return elt as SVGTextElement;
    },
    group: function(x: number | undefined, y: number | undefined) {
        x = x || 0;
        y = y || 0;
        return makeSVGElement('g', {
            transform: 'translate(' + x + ',' + y + ')',
        }) as SVGGElement;
    },
    svg: function(width: number | undefined, height: number | undefined) {
        return makeSVGElement('svg', {
            width: width || 0,
            height: height || 0,
        }) as SVGSVGElement;
    },
    wrapText: function(in_dom_text_svg_elt: SVGTextElement, width: number) {
        const text = in_dom_text_svg_elt.textContent;
        in_dom_text_svg_elt.textContent = '';

        const words = text.split(' ');
        let dy = 0;
        let tspan = makeSVGElement('tspan', {
            x: '0',
            dy: dy,
        }) as SVGTSpanElement;
        in_dom_text_svg_elt.appendChild(tspan);

        let curr_tspan_words: string[] = [];
        for (var i = 0; i < words.length; i++) {
            curr_tspan_words.push(words[i]);
            tspan.textContent = curr_tspan_words.join(' ');
            if (tspan.getComputedTextLength() > width) {
                tspan.textContent = curr_tspan_words
                    .slice(0, curr_tspan_words.length - 1)
                    .join(' ');
                dy = in_dom_text_svg_elt.getBBox().height;
                curr_tspan_words = [words[i]];
                tspan = makeSVGElement('tspan', {
                    x: '0',
                    dy: dy,
                }) as SVGTSpanElement;
                in_dom_text_svg_elt.appendChild(tspan);
                tspan.textContent = words[i];
            }
        }
    },
    fromShape: function(
        oncoprint_shape_computed_params: ComputedShapeParams,
        offset_x: number,
        offset_y: number
    ) {
        return shapeToSVG(oncoprint_shape_computed_params, offset_x, offset_y);
    },
    polygon: function(points: [number, number][], fill: RGBAColor) {
        return makeSVGElement('polygon', {
            points: points,
            fill: rgbString(fill),
            'fill-opacity': fill[3],
        }) as SVGPolygonElement;
    },
    rect: function(
        x: number,
        y: number,
        width: number,
        height: number,
        fillSpecification:
            | {
                  type: 'rgba';
                  value: RGBAColor;
              }
            | {
                  type: 'gradientId';
                  value: string;
              }
    ) {
        let fill: string;
        let fillOpacity = 1;
        if (fillSpecification.type === 'rgba') {
            fill = rgbString(fillSpecification.value);
            fillOpacity = fillSpecification.value[3];
        } else {
            fill = `url(#${fillSpecification.value})`;
        }
        return makeSVGElement('rect', {
            x: x,
            y: y,
            width: width,
            height: height,
            fill: fill,
            'fill-opacity': fillOpacity,
        }) as SVGRectElement;
    },
    bgrect: function(width: number, height: number, fill: RGBAColor) {
        return makeSVGElement('rect', {
            width: width,
            height: height,
            fill: rgbString(fill),
            'fill-opacity': fill[3],
        }) as SVGRectElement;
    },
    path: function(
        points: [number, number][],
        stroke: RGBAColor,
        fill: RGBAColor,
        linearGradient: SVGGradientElement
    ) {
        let pointsStrArray = points.map(function(pt) {
            return pt.join(',');
        });
        pointsStrArray[0] = 'M' + points[0];
        for (var i = 1; i < points.length; i++) {
            pointsStrArray[i] = 'L' + points[i];
        }
        return makeSVGElement('path', {
            d: pointsStrArray.join(' '),
            stroke: linearGradient
                ? 'url(#' + linearGradient.getAttribute('id') + ')'
                : rgbString(stroke),
            'stroke-opacity': linearGradient ? 0 : stroke[3],
            fill: linearGradient
                ? 'url(#' + linearGradient.getAttribute('id') + ')'
                : rgbString(fill),
            'fill-opacity': linearGradient ? 1 : fill[3],
        }) as SVGPathElement;
    },
    stop: function(offset: number, color: RGBAColor) {
        return makeSVGElement('stop', {
            offset: offset + '%',
            'stop-color': rgbString(color),
            'stop-opacity': color[3],
        }) as SVGStopElement;
    },
    linearGradient: function() {
        return makeSVGElement('linearGradient', {
            id: 'linearGradient' + gradientId(),
        }) as SVGLinearGradientElement;
    },
    defs: function() {
        return makeSVGElement('defs', {}) as SVGDefsElement;
    },
    gradient: function(colorFn: (val: number) => RGBAColor) {
        const gradient = makeSVGElement('linearGradient', {
            id: 'gradient' + gradientId(),
            x1: 0,
            y1: 0,
            x2: 1,
            y2: 0,
        });
        for (let i = 0; i <= 100; i++) {
            gradient.appendChild(this.stop(i, colorFn(i / 100)));
        }
        return gradient as SVGLinearGradientElement;
    },
};
