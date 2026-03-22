import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import SampleManager from 'pages/patientView/SampleManager';

export enum ExpectedAltCopiesColor {
    WHITE = 'white',
    LIGHTGREY = 'lightgrey',
    BLACK = 'black',
    DARKGREY = 'darkgrey',
}

export const ExpectedAltCopiesElementTooltip: React.FunctionComponent<{
    sampleId: string;
    totalCopyNumberValue: string;
    expectedAltCopiesValue: string;
    sampleManager?: SampleManager | null;
}> = props => {
    return (
        <span data-test="eac-tooltip">
            {props.sampleManager ? (
                <span>
                    {props.sampleManager.getComponentForSample(
                        props.sampleId,
                        1,
                        ''
                    )}{' '}
                </span>
            ) : null}
            {props.expectedAltCopiesValue === 'INDETERMINATE' ? (
                <span>{'Indeterminate sample'}</span>
            ) : (
                <span>
                    {` ${props.expectedAltCopiesValue} out of ${props.totalCopyNumberValue} copies of this gene are mutated.`}
                </span>
            )}
        </span>
    );
};

function getOpacity(expectedAltCopiesValue: string): number {
    return expectedAltCopiesValue !== 'NA' ? 100 : 0;
}

function getTextColor(expectedAltCopiesValue: string): string {
    return expectedAltCopiesValue && expectedAltCopiesValue !== 'INDETERMINATE'
        ? ExpectedAltCopiesColor.BLACK
        : ExpectedAltCopiesColor.WHITE;
}

function getFillColor(expectedAltCopiesValue: string): string {
    return expectedAltCopiesValue && expectedAltCopiesValue !== 'INDETERMINATE'
        ? ExpectedAltCopiesColor.WHITE
        : ExpectedAltCopiesColor.LIGHTGREY;
}

function getStrokeColor(expectedAltCopiesValue: string): string {
    return expectedAltCopiesValue && expectedAltCopiesValue !== 'INDETERMINATE'
        ? ExpectedAltCopiesColor.DARKGREY
        : ExpectedAltCopiesColor.LIGHTGREY;
}

function getTextSize(expectedAltCopiesValue: string): number {
    return expectedAltCopiesValue && expectedAltCopiesValue !== 'INDETERMINATE'
        ? 9
        : 12;
}

const MutantIntegerCopyNumberIcon: React.FunctionComponent<{
    expectedAltCopiesValue: string;
}> = props => {
    return (
        <svg width="18" height="20" className="case-label-header">
            <g transform="translate(3,8)">
                <rect
                    width="11"
                    height="11"
                    rx="15%"
                    ry="15%"
                    stroke={getStrokeColor(props.expectedAltCopiesValue)}
                    stroke-width="1"
                    fill={getFillColor(props.expectedAltCopiesValue)}
                    opacity={getOpacity(props.expectedAltCopiesValue)}
                />
                <svg>
                    <text
                        x="5.5"
                        y="6"
                        dominantBaseline="middle"
                        textAnchor="middle"
                        fontSize={getTextSize(props.expectedAltCopiesValue)}
                        fill={getTextColor(props.expectedAltCopiesValue)}
                        opacity={getOpacity(props.expectedAltCopiesValue)}
                    >
                        {props.expectedAltCopiesValue === 'INDETERMINATE'
                            ? '-'
                            : props.expectedAltCopiesValue}
                    </text>
                </svg>
            </g>
        </svg>
    );
};

const ExpectedAltCopiesElement: React.FunctionComponent<{
    sampleId: string;
    totalCopyNumberValue: string;
    expectedAltCopiesValue: string;
    sampleManager?: SampleManager | null;
}> = props => {
    return props.expectedAltCopiesValue === 'NA' ? (
        <span>
            <MutantIntegerCopyNumberIcon
                expectedAltCopiesValue={props.expectedAltCopiesValue}
            />
        </span>
    ) : (
        <DefaultTooltip
            overlay={<ExpectedAltCopiesElementTooltip {...props} />}
            placement="left"
        >
            <span>
                <MutantIntegerCopyNumberIcon
                    expectedAltCopiesValue={props.expectedAltCopiesValue}
                />
            </span>
        </DefaultTooltip>
    );
};

export default ExpectedAltCopiesElement;
