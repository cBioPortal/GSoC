import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import SampleManager from 'pages/patientView/SampleManager';
import {
    ClonalColor,
    getClonalCircleColor,
    getOptionalPattern,
    stripePattern,
} from 'shared/components/mutationTable/column/clonal/ClonalElement';
import { ClonalValue } from 'shared/components/mutationTable/column/clonal/ClonalColumnFormatter';

export const maxBarHeight = 12;
const barWidth = 5;
const barSpacing = 3;
export const indexToBarLeft = (n: number) => n * (barWidth + barSpacing);

function getSVGWidth(numberOfSamples: number) {
    return numberOfSamples * barWidth + (numberOfSamples - 1) * barSpacing;
}

export const CancerCellFractionElementTooltip: React.FunctionComponent<{
    sampleIds: string[];
    sampleToCCFValue: { [key: string]: string };
    sampleManager?: SampleManager | null;
}> = props => {
    const sampleOrder = props.sampleManager
        ? props.sampleManager.getSampleIdsInOrder()
        : [];
    const orderedSamplesWithValues = sampleOrder.filter(
        (sampleId, index, array) => {
            return props.sampleToCCFValue[sampleId];
        }
    );
    const tooltipLines = orderedSamplesWithValues.map(
        (sampleId, index, array) => (
            <span key={sampleId}>
                {props.sampleManager
                    ? props.sampleManager.getComponentForSample(sampleId, 1, '')
                    : null}{' '}
                {props.sampleToCCFValue[sampleId]}
                <br />
            </span>
        )
    );
    return <span data-test="ccf-tooltip">{tooltipLines}</span>;
};

const CancerCellFractionBar: React.FunctionComponent<{
    ccfValue: string;
    clonalValue: string;
    color: any;
    barX: number;
}> = props => {
    const barHeight =
        (isNaN(+props.ccfValue) ? 0 : +props.ccfValue) * maxBarHeight;
    const barY = maxBarHeight - barHeight;
    return (
        <svg>
            {getOptionalPattern(props.clonalValue)}
            <rect
                x={props.barX}
                y={barY}
                stroke={'black'}
                strokeWidth={1}
                width={barWidth}
                height={barHeight}
                fill={props.color}
            />
        </svg>
    );
};

const CancerCellFractionBarGraph: React.FunctionComponent<{
    sampleIds: string[];
    sampleToClonalValue: { [key: string]: string };
    sampleToCCFValue: { [key: string]: string };
    sampleManager?: SampleManager | null;
}> = props => {
    const sampleOrder = props.sampleManager
        ? props.sampleManager.getSampleIdsInOrder()
        : [];
    const barX = sampleOrder.reduce((map, sampleId: string, i: number) => {
        map[sampleId] = indexToBarLeft(i);
        return map;
    }, {} as { [s: string]: number });

    return (
        <svg width={getSVGWidth(sampleOrder.length)} height={maxBarHeight}>
            {sampleOrder.map((sample: string) => {
                return (
                    <CancerCellFractionBar
                        key={sample}
                        ccfValue={props.sampleToCCFValue[sample]}
                        clonalValue={props.sampleToClonalValue[sample]}
                        color={getClonalCircleColor(
                            props.sampleToClonalValue[sample]
                        )}
                        barX={barX[sample]}
                    />
                );
            })}
        </svg>
    );
};

const CancerCellFractionElement: React.FunctionComponent<{
    sampleIds: string[];
    sampleToClonalValue: { [key: string]: string };
    sampleToCCFValue: { [key: string]: string };
    sampleManager?: SampleManager | null;
}> = props => {
    const managerSampleIds = props.sampleManager?.getSampleIdsInOrder() ?? [];
    // Fall back to props.sampleIds if sampleManager has no samples
    const sampleIds =
        managerSampleIds.length > 0 ? managerSampleIds : props.sampleIds;
    if (props.sampleManager && sampleIds.length > 1) {
        return (
            <DefaultTooltip
                placement="left"
                overlay={<CancerCellFractionElementTooltip {...props} />}
            >
                <span>{<CancerCellFractionBarGraph {...props} />}</span>
            </DefaultTooltip>
        );
    } else {
        return <span>{props.sampleToCCFValue[sampleIds[0]]}</span>;
    }
};

export default CancerCellFractionElement;
