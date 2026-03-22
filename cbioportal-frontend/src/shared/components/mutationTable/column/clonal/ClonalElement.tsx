import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import SampleManager from 'pages/patientView/SampleManager';
import { ClonalValue } from './ClonalColumnFormatter';

export const stripePattern = (
    <svg>
        <defs>
            <pattern
                id="stripePattern"
                patternUnits="userSpaceOnUse"
                width="4"
                height="4"
            >
                <path
                    d="M-1,1 l2,-2
              M-.5,2.5 l3,-3
              M0,4 l4,-4
              M1.5,4.5 l3,-3d
              M3,5 l2,-2"
                    stroke="black"
                    strokeWidth=".5"
                />
            </pattern>
        </defs>
    </svg>
);

export enum ClonalColor {
    LIMEGREEN = 'limegreen',
    DIMGREY = 'dimgrey',
    LIGHTGREY = 'lightgrey',
    STRIPED = 'url(#stripePattern)',
    WHITE = 'white',
    BLACK = 'black',
}

export function getClonalCircleColor(clonalValue: string): ClonalColor {
    switch (clonalValue) {
        case ClonalValue.CLONAL:
            return ClonalColor.BLACK;
        case ClonalValue.SUBCLONAL:
            return ClonalColor.STRIPED;
        case ClonalValue.INDETERMINATE:
            return ClonalColor.LIGHTGREY;
        // Indeterminate/NA falls under this case
        default:
            return ClonalColor.DIMGREY;
    }
}

export function getOptionalPattern(clonalValue: string) {
    return clonalValue === ClonalValue.SUBCLONAL ? stripePattern : null;
}

function getClonalStrokeColor(clonalValue: string): ClonalColor {
    switch (clonalValue) {
        case ClonalValue.CLONAL:
            return ClonalColor.BLACK;
        case ClonalValue.SUBCLONAL:
            return ClonalColor.BLACK;
        case ClonalValue.INDETERMINATE:
            return ClonalColor.LIGHTGREY;
        // Indeterminate/NA falls under this case
        default:
            return ClonalColor.DIMGREY;
    }
}

export const ClonalElementTooltip: React.FunctionComponent<{
    sampleId: string;
    clonalValue: string;
    ccfExpectedCopies: string;
    sampleManager?: SampleManager | null;
}> = props => {
    const firstColumnStyle = {
        width: 40,
        display: 'inline-block',
    };
    return (
        <div data-test="clonal-tooltip">
            {props.sampleManager ? (
                <div>
                    {props.sampleManager.getComponentForSample(
                        props.sampleId,
                        1,
                        ''
                    )}
                </div>
            ) : null}
            <div>
                <span style={firstColumnStyle}>Clonal</span>
                <strong
                    style={{
                        color: `${getClonalStrokeColor(props.clonalValue)}`,
                    }}
                >
                    {props.clonalValue !== ClonalValue.NA
                        ? props.clonalValue.toLowerCase()
                        : props.clonalValue}
                </strong>
            </div>
            <div>
                <span style={firstColumnStyle}>CCF</span>
                <strong>{props.ccfExpectedCopies}</strong>
            </div>
        </div>
    );
};

const ClonalCircle: React.FunctionComponent<{
    clonalValue: string;
}> = props => {
    return (
        <svg
            height="10"
            width="10"
            data-test={`${
                props.clonalValue !== undefined
                    ? props.clonalValue.toLowerCase()
                    : 'na'
            }-icon`}
        >
            {getOptionalPattern(props.clonalValue)}
            <circle
                cx={5}
                cy={5}
                r={4}
                stroke={getClonalStrokeColor(props.clonalValue)}
                stroke-width={1}
                fill={getClonalCircleColor(props.clonalValue)}
                opacity={
                    getClonalCircleColor(props.clonalValue) !==
                    ClonalColor.DIMGREY
                        ? 100
                        : 0
                }
            />
        </svg>
    );
};

const ClonalElement: React.FunctionComponent<{
    sampleId: string;
    clonalValue: string; //clonal, subclonal, NA
    ccfExpectedCopies: string;
    sampleManager?: SampleManager | null;
}> = props => {
    if (props.clonalValue === ClonalValue.NA) {
        return (
            <span>
                <ClonalCircle clonalValue={props.clonalValue} />
            </span>
        );
    } else {
        return (
            <DefaultTooltip
                overlay={<ClonalElementTooltip {...props} />}
                placement="left"
            >
                <span>
                    <ClonalCircle clonalValue={props.clonalValue} />
                </span>
            </DefaultTooltip>
        );
    }
};

export default ClonalElement;
