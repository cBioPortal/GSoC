import { VictorySelectionContainer } from 'victory';
import * as React from 'react';

export class VictorySelectionContainerWithLegend extends VictorySelectionContainer {
    // we have to do this because otherwise adding the legend element messes up the
    //  VictoryChart layout system

    render() {
        const {
            activateSelectedData,
            onSelection,
            containerRef,
            gradient,
            legend,
            children,
            ...rest
        } = this.props as any;
        return (
            <VictorySelectionContainer
                activateSelectedData={false}
                onSelection={onSelection}
                containerRef={containerRef}
                children={children
                    .concat(legend)
                    .concat(<defs>{gradient}</defs>)}
                {...rest}
            />
        );
    }
}

// need to do this for typescript reasons, because Victory isn't well typed
const VictorySelectionContainerWithLegendIgnoreType = VictorySelectionContainerWithLegend as any;

export default VictorySelectionContainerWithLegendIgnoreType;
