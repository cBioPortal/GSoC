import React from 'react';
import { OncoKbCardDataType } from 'cbioportal-utils';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';

import { normalizeLevel, normalizeOncogenicity } from '../../util/OncoKbUtils';

const BIOLOGICAL_COLOR_MAP: { [level: string]: string } = {
    oncogenic: '#0968C3',
    'likely-oncogenic': '#0968C3',
    resistance: '#0968C3',
    neutral: '#696969',
    'likely-neutral': '#696969',
    inconclusive: '#AAAAAA',
    vus: '#696969',
    unknown: '#CCCCCC',
};

const LEVEL_COLOR_MAP: { [level: string]: string } = {
    '1': '#33A02C',
    '2': '#1F78B4',
    '3': '#984EA3',
    '3A': '#984EA3',
    '3B': '#BE98CE',
    '4': '#424242',
    R1: '#EE3424',
    R2: '#F79A92',
    R3: '#FCD6D3',
    Dx1: '#33A02C',
    Dx2: '#1F78B4',
    Dx3: '#984EA3',
    Px1: '#33A02C',
    Px2: '#1F78B4',
    Px3: '#984EA3',
};

function getLevelColor(
    highestLevel?: string,
    defaultColor: string = '#CCCCCC'
) {
    const level = normalizeLevel(highestLevel || null) || '';
    return LEVEL_COLOR_MAP[level] || defaultColor;
}

function shouldDrawShape(
    type: OncoKbCardDataType,
    level?: string,
    availableDataTypes?: OncoKbCardDataType[]
) {
    return (
        level &&
        availableDataTypes !== undefined &&
        availableDataTypes.includes(type)
    );
}

function getOncogenicShape(indicator?: IndicatorQueryResp) {
    const oncogenicity = normalizeOncogenicity(indicator?.oncogenic || '');
    const color = BIOLOGICAL_COLOR_MAP[oncogenicity] || '#CCCCCC';

    return (
        <g transform="translate(9, 9)">
            <circle r="6" fill="none" strokeWidth="2" stroke={color} />
            {// conditionally draw inner circles
            oncogenicity !== 'vus' && oncogenicity !== 'unknown' && (
                <g>
                    <circle r="3" fill="none" strokeWidth="2" stroke={color} />
                    <circle r="1.5" fill={color} stroke="none" />
                </g>
            )}
        </g>
    );
}

function getTherapeuticSensitivityShape(
    indicator?: IndicatorQueryResp,
    availableDataTypes?: OncoKbCardDataType[]
) {
    const highestLevel = indicator?.highestSensitiveLevel;
    if (
        !shouldDrawShape(
            OncoKbCardDataType.TXS,
            highestLevel,
            availableDataTypes
        )
    ) {
        return null;
    }

    const fillColor = getLevelColor(highestLevel, '#33A02C');

    return (
        <g transform="translate(14.5, 3.5)">
            <circle r="4" fill={fillColor} stroke="#ffffff" strokeWidth="1" />
        </g>
    );
}

function getTherapeuticResistanceShape(
    indicator?: IndicatorQueryResp,
    availableDataTypes?: OncoKbCardDataType[]
) {
    const highestLevel = indicator?.highestResistanceLevel;
    if (
        !shouldDrawShape(
            OncoKbCardDataType.TXR,
            highestLevel,
            availableDataTypes
        )
    ) {
        return null;
    }

    const fillColor = getLevelColor(highestLevel, '#EE3424');

    return (
        <g transform="translate(14.5, 14.5)">
            <circle r="4" fill={fillColor} stroke="#ffffff" strokeWidth="1" />
        </g>
    );
}

function getDiagnosticShape(
    indicator?: IndicatorQueryResp,
    availableDataTypes?: OncoKbCardDataType[]
) {
    const highestLevel = indicator?.highestDiagnosticImplicationLevel;
    if (
        !shouldDrawShape(
            OncoKbCardDataType.DX,
            highestLevel,
            availableDataTypes
        )
    ) {
        return null;
    }

    const fillColor = getLevelColor(highestLevel, '#33A02C');

    return (
        <g transform="translate(-0.5, -0.5)">
            <rect
                width="7"
                height="7"
                fill={fillColor}
                stroke="#ffffff"
                strokeWidth="1"
            />
        </g>
    );
}

function getPrognosticShape(
    indicator?: IndicatorQueryResp,
    availableDataTypes?: OncoKbCardDataType[]
) {
    const highestLevel = indicator?.highestPrognosticImplicationLevel;
    if (
        !shouldDrawShape(
            OncoKbCardDataType.PX,
            highestLevel,
            availableDataTypes
        )
    ) {
        return null;
    }

    const fillColor = getLevelColor(highestLevel, '#33A02C');

    return (
        <g transform="translate(0, 10.5)">
            <polygon
                points="3.5 0, 8 8, -1 8"
                fill={fillColor}
                stroke="#ffffff"
                strokeWidth="1"
            />
        </g>
    );
}

export const CompactAnnotationIcon: React.FunctionComponent<{
    usingPublicOncoKbInstance: boolean;
    indicator?: IndicatorQueryResp;
    availableDataTypes?: OncoKbCardDataType[];
}> = props => {
    const indicatorForLevelIcons = props.usingPublicOncoKbInstance
        ? undefined
        : props.indicator;

    return (
        <svg
            version="1.1"
            width="18"
            height="18"
            data-test="oncogenic-icon-image"
        >
            {getOncogenicShape(props.indicator)}
            {getTherapeuticSensitivityShape(
                indicatorForLevelIcons,
                props.availableDataTypes
            )}
            {getTherapeuticResistanceShape(
                indicatorForLevelIcons,
                props.availableDataTypes
            )}
            {getDiagnosticShape(
                indicatorForLevelIcons,
                props.availableDataTypes
            )}
            {getPrognosticShape(
                indicatorForLevelIcons,
                props.availableDataTypes
            )}
        </svg>
    );
};
