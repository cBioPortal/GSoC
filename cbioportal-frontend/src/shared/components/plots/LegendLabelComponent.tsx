import * as React from 'react';
import { LegendDataWithId } from './PlotUtils';
import { VictoryLabel } from 'victory';

export interface ILegendLabelComponentProps {
    orientation: 'horizontal' | 'vertical';
    // these props are typed as optional because of the way victory api works:
    //  dataComponent={<LegendDataComponent/>},
    // but they are always passed in
    datum?: LegendDataWithId<any>;
    x?: number;
    y?: number;
}

export default class LegendLabelComponent extends React.Component<
    ILegendLabelComponentProps,
    {}
> {
    render() {
        // default victory component
        const horizontal = this.props.orientation === 'horizontal';
        const text = (
            <VictoryLabel
                className={`legendLabel_${(this.props as any).text}`}
                {...this.props}
            />
        );
        if (this.props.datum!.margin !== undefined) {
            const dx = horizontal ? this.props.datum!.margin : 0;
            const dy = horizontal ? 0 : this.props.datum!.margin;
            return <g transform={`translate(${dx},${dy})`}>{text}</g>;
        } else {
            return text;
        }
    }
}
