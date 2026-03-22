import * as React from 'react';
import { VictoryLabel, Helpers } from 'victory';

export class BarChartAxisLabel extends VictoryLabel {
    // Contents mostly copied from https://github.com/FormidableLabs/victory-core/blob/master/src/victory-label/victory-label.js
    // The original renderElements function is designed to create multi-line labels.
    // This one is designed to create labels with superscript.
    renderElements(props: any, content: string[]) {
        const { datum, active, inline, className, title, desc, events } = props;
        const style = this.getStyles(props);
        const lineHeight = this.getHeight(props, 'lineHeight');
        const textAnchor = props.textAnchor
            ? Helpers.evaluateProp(props.textAnchor, datum, active)
            : 'start';
        const dx = props.dx ? Helpers.evaluateProp(props.dx, datum, active) : 0;
        const dy = this.getDy(props, style, content, lineHeight);
        const transform = this.getTransform(props, style);
        const x =
            props.x !== undefined ? props.x : this.getPosition(props, 'x');
        const y =
            props.y !== undefined ? props.y : this.getPosition(props, 'y');

        const tspanProps = {
            x: !inline ? props.x : undefined,
            dx,
            textAnchor: style[0].textAnchor || textAnchor,
            style: style[0],
            key: style[0].textAnchor || textAnchor,
        };

        let tspan = [];

        // add the second string as a superscript
        // we are not using baselineShift property due to compatibility issues, instead adjusting dy
        // for more details see https://stackoverflow.com/questions/12332448/subscripts-and-superscripts-in-svg
        if (content.length > 1) {
            tspan.push(<tspan {...tspanProps}>{content[0]}</tspan>);
            tspan.push(
                <tspan
                    dy={-style[0].fontSize / 2}
                    style={{ ...style[0], fontSize: style[0].fontSize * 0.7 }}
                >
                    {content[1]}
                </tspan>
            );
        } else {
            tspan.push(<tspan {...tspanProps}>{content[0]}</tspan>);
        }

        return React.cloneElement(
            props.textComponent,
            { dx, dy, x, y, events, transform, className, title, desc },
            tspan
        );
    }
}

// we need to ignore the type of BarChartAxisLabel to avoid typescript error
// TS2605: JSX element type 'BarChartAxisLabel' is not a constructor function for JSX elements.
// we get this error because VictoryLabel cannot be resolved as a valid react component (due to missing victory types)
const BarChartAxisLabelIgnoreType = BarChartAxisLabel as any;
export default BarChartAxisLabelIgnoreType;
