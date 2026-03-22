import * as React from 'react';
import SampleManager from 'pages/patientView/SampleManager';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { ASCN_BLACK } from 'shared/lib/Colors';
import {
    getASCNCopyNumberColor,
    getASCNCopyNumberStrokeColor,
    getASCNCopyNumberTextColor,
} from 'shared/lib/ASCNUtils';

export enum ASCNCopyNumberValueEnum {
    WGD = 'WGD',
    NA = 'NA',
    INDETERMINATE = 'INDETERMINATE',
    AMPBALANCED = 'Amp (Balanced)',
    AMPLOH = 'Amp (LOH)',
    AMP = 'Amp',
    CNLOHGAIN = 'CNLOH & Gain',
    CNLOHAFTER = 'CNLOH After',
    CNLOHBEFOREGAIN = 'CNLOH Before & Gain',
    CNLOHBEFORELOSS = 'CNLOH Before & Loss',
    CNLOHBEFORE = 'CNLOH Before',
    CNLOH = 'CNLOH',
    DIPLOID = 'Diploid',
    DOUBLELOSSAFTER = 'Double Loss After',
    GAIN = 'Gain',
    HETLOSS = 'Hetloss',
    HOMDEL = 'Homdel',
    LOSSGAIN = 'Loss & Gain',
    LOSSAFTER = 'Loss After',
    LOSSBEFOREAFTER = 'Loss Before & After',
    LOSSBEFORE = 'Loss Before',
    TETRAPLOID = 'Tetraploid',
}

const ASCNCallTable: { [key: string]: string } = {
    'no WGD,0,0': ASCNCopyNumberValueEnum.HOMDEL,
    'no WGD,1,0': ASCNCopyNumberValueEnum.HETLOSS,
    'no WGD,2,0': ASCNCopyNumberValueEnum.CNLOH,
    'no WGD,3,0': ASCNCopyNumberValueEnum.CNLOHGAIN,
    'no WGD,4,0': ASCNCopyNumberValueEnum.CNLOHGAIN,
    'no WGD,5,0': ASCNCopyNumberValueEnum.AMPLOH,
    'no WGD,6,0': ASCNCopyNumberValueEnum.AMPLOH,
    'no WGD,1,1': ASCNCopyNumberValueEnum.DIPLOID,
    'no WGD,2,1': ASCNCopyNumberValueEnum.GAIN,
    'no WGD,3,1': ASCNCopyNumberValueEnum.GAIN,
    'no WGD,4,1': ASCNCopyNumberValueEnum.AMP,
    'no WGD,5,1': ASCNCopyNumberValueEnum.AMP,
    'no WGD,6,1': ASCNCopyNumberValueEnum.AMP,
    'no WGD,2,2': ASCNCopyNumberValueEnum.TETRAPLOID,
    'no WGD,3,2': ASCNCopyNumberValueEnum.AMP,
    'no WGD,4,2': ASCNCopyNumberValueEnum.AMP,
    'no WGD,5,2': ASCNCopyNumberValueEnum.AMP,
    'no WGD,6,2': ASCNCopyNumberValueEnum.AMP,
    'no WGD,3,3': ASCNCopyNumberValueEnum.AMPBALANCED,
    'no WGD,4,3': ASCNCopyNumberValueEnum.AMP,
    'no WGD,5,3': ASCNCopyNumberValueEnum.AMP,
    'no WGD,6,3': ASCNCopyNumberValueEnum.AMP,
    'WGD,0,0': ASCNCopyNumberValueEnum.HOMDEL,
    'WGD,1,0': ASCNCopyNumberValueEnum.LOSSBEFOREAFTER,
    'WGD,2,0': ASCNCopyNumberValueEnum.LOSSBEFORE,
    'WGD,3,0': ASCNCopyNumberValueEnum.CNLOHBEFORELOSS,
    'WGD,4,0': ASCNCopyNumberValueEnum.CNLOHBEFORE,
    'WGD,5,0': ASCNCopyNumberValueEnum.CNLOHBEFOREGAIN,
    'WGD,6,0': ASCNCopyNumberValueEnum.AMPLOH,
    'WGD,1,1': ASCNCopyNumberValueEnum.DOUBLELOSSAFTER,
    'WGD,2,1': ASCNCopyNumberValueEnum.LOSSAFTER,
    'WGD,3,1': ASCNCopyNumberValueEnum.CNLOHAFTER,
    'WGD,4,1': ASCNCopyNumberValueEnum.LOSSGAIN,
    'WGD,5,1': ASCNCopyNumberValueEnum.AMP,
    'WGD,6,1': ASCNCopyNumberValueEnum.AMP,
    'WGD,2,2': ASCNCopyNumberValueEnum.TETRAPLOID,
    'WGD,3,2': ASCNCopyNumberValueEnum.GAIN,
    'WGD,4,2': ASCNCopyNumberValueEnum.AMP,
    'WGD,5,2': ASCNCopyNumberValueEnum.AMP,
    'WGD,6,2': ASCNCopyNumberValueEnum.AMP,
    'WGD,3,3': ASCNCopyNumberValueEnum.AMPBALANCED,
    'WGD,4,3': ASCNCopyNumberValueEnum.AMP,
    'WGD,5,3': ASCNCopyNumberValueEnum.AMP,
    'WGD,6,3': ASCNCopyNumberValueEnum.AMP,
};

enum ASCNCopyNumberOpacityEnum {
    TRANSPARENT = 0,
    OPAQUE = 100,
}

function getASCNCopyNumberOpacity(
    ASCNCopyNumberValueEnum: string
): ASCNCopyNumberOpacityEnum {
    switch (ASCNCopyNumberValueEnum) {
        case '2':
        case '1':
        case '0':
        case '-1':
        case '-2':
        case 'INDETERMINATE':
            return ASCNCopyNumberOpacityEnum.OPAQUE;
        default:
            return ASCNCopyNumberOpacityEnum.TRANSPARENT;
    }
}

function getASCNCopyNumberCall(
    wgdValue: string,
    totalCopyNumberValue: string,
    minorCopyNumberValue: string
) {
    const majorCopyNumberValue: string = (
        Number(totalCopyNumberValue) - Number(minorCopyNumberValue)
    ).toString();
    const key: string = [
        wgdValue,
        majorCopyNumberValue,
        minorCopyNumberValue,
    ].join(',');
    return key in ASCNCallTable
        ? ASCNCallTable[key].toLowerCase()
        : ASCNCopyNumberValueEnum.NA;
}

export const ASCNCopyNumberElementTooltip: React.FunctionComponent<{
    sampleId: string;
    wgdValue: string;
    totalCopyNumberValue: string;
    minorCopyNumberValue: string;
    ascnCopyNumberValue: string;
    sampleManager?: SampleManager | null;
}> = props => {
    const ascnCopyNumberCall: string = getASCNCopyNumberCall(
        props.wgdValue,
        props.totalCopyNumberValue,
        props.minorCopyNumberValue
    );
    return (
        <span data-test="ascn-copy-number-tooltip">
            {props.sampleManager ? (
                <span>
                    {props.sampleManager.getComponentForSample(
                        props.sampleId,
                        1,
                        ''
                    )}{' '}
                </span>
            ) : null}
            <span>
                {ascnCopyNumberCall !== ASCNCopyNumberValueEnum.NA ? (
                    <span>
                        <b>{ascnCopyNumberCall}</b>
                        {` (${props.wgdValue} with total copy number of ${props.totalCopyNumberValue} and a minor copy number of ${props.minorCopyNumberValue})`}
                    </span>
                ) : (
                    <span>{'Indeterminate sample'}</span>
                )}
            </span>
        </span>
    );
};

const ASCNCopyNumberIcon: React.FunctionComponent<{
    wgdValue: string;
    totalCopyNumberValue: string;
    ascnCopyNumberValue: string;
}> = props => {
    return (
        <svg width="18" height="20" className="case-label-header">
            {props.wgdValue === ASCNCopyNumberValueEnum.WGD ? (
                <svg>
                    <text
                        x="9"
                        y="5"
                        dominantBaseline="middle"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontSize="7"
                        fill="black"
                    >
                        WGD
                    </text>
                </svg>
            ) : null}
            <g transform="translate(3,8)">
                <rect
                    width="11"
                    height="11"
                    rx="15%"
                    ry="15%"
                    stroke={getASCNCopyNumberStrokeColor(
                        props.ascnCopyNumberValue
                    )}
                    stroke-width="1"
                    fill={getASCNCopyNumberColor(props.ascnCopyNumberValue)}
                    opacity={getASCNCopyNumberOpacity(
                        props.ascnCopyNumberValue
                    )}
                />
                <svg>
                    <text
                        x="5.5"
                        y="6"
                        dominantBaseline="middle"
                        textAnchor="middle"
                        fontSize={9}
                        fill={getASCNCopyNumberTextColor(
                            props.ascnCopyNumberValue
                        )}
                    >
                        {props.totalCopyNumberValue === 'INDETERMINATE'
                            ? '-'
                            : props.totalCopyNumberValue}
                    </text>
                </svg>
            </g>
        </svg>
    );
};

// this will return an icon as long as ascnCopyNumberValue(icon color), wgdValue(wgd label), totalCopyNumber(icon number) are not "NA"
// this does not enforce an limits on possible numerical values (e.g bad data such as tcn=99 would show up as 99 in the portal)
const ASCNCopyNumberElement: React.FunctionComponent<{
    sampleId: string;
    wgdValue: string;
    totalCopyNumberValue: string;
    minorCopyNumberValue: string;
    ascnCopyNumberValue: string;
    sampleManager?: SampleManager | null;
}> = props => {
    const hasAllRequiredValues: boolean =
        props.totalCopyNumberValue !== ASCNCopyNumberValueEnum.NA &&
        props.wgdValue !== ASCNCopyNumberValueEnum.NA;

    if (hasAllRequiredValues) {
        return (
            <DefaultTooltip
                overlay={<ASCNCopyNumberElementTooltip {...props} />}
                placement="left"
            >
                <span>
                    <ASCNCopyNumberIcon
                        wgdValue={props.wgdValue}
                        totalCopyNumberValue={props.totalCopyNumberValue}
                        ascnCopyNumberValue={props.ascnCopyNumberValue}
                    />
                </span>
            </DefaultTooltip>
        );
    } else {
        return (
            <span>
                <ASCNCopyNumberIcon
                    wgdValue={ASCNCopyNumberValueEnum.NA}
                    totalCopyNumberValue=""
                    ascnCopyNumberValue={ASCNCopyNumberValueEnum.NA}
                />
            </span>
        );
    }
};

export default ASCNCopyNumberElement;
