import { ProteinImpactType } from 'cbioportal-frontend-commons';
import * as React from 'react';

import { IProteinImpactTypeColors } from '../../model/ProteinImpact';

export function getProteinImpactTypeOptionDisplayValueMap(proteinImpactTypeColorMap: {
    [proteinImpactType: string]: string;
}): { [proteinImpactType: string]: JSX.Element } {
    return {
        [ProteinImpactType.MISSENSE]: (
            <strong
                style={{
                    color:
                        proteinImpactTypeColorMap[ProteinImpactType.MISSENSE],
                }}
            >
                Missense
            </strong>
        ),
        [ProteinImpactType.TRUNCATING]: (
            <strong
                style={{
                    color:
                        proteinImpactTypeColorMap[ProteinImpactType.TRUNCATING],
                }}
            >
                Truncating
            </strong>
        ),
        [ProteinImpactType.INFRAME]: (
            <strong
                style={{
                    color: proteinImpactTypeColorMap[ProteinImpactType.INFRAME],
                }}
            >
                Inframe
            </strong>
        ),
        [ProteinImpactType.SPLICE]: (
            <strong
                style={{
                    color: proteinImpactTypeColorMap[ProteinImpactType.SPLICE],
                }}
            >
                Splice
            </strong>
        ),
        [ProteinImpactType.FUSION]: (
            <strong
                style={{
                    color: proteinImpactTypeColorMap[ProteinImpactType.FUSION],
                }}
            >
                SV/Fusion
            </strong>
        ),
        [ProteinImpactType.OTHER]: (
            <strong
                style={{
                    color: proteinImpactTypeColorMap[ProteinImpactType.OTHER],
                }}
            >
                Other
            </strong>
        ),
    };
}

export function getProteinImpactTypeColorMap(
    colors: IProteinImpactTypeColors
): { [proteinImpactType: string]: string } {
    return {
        [ProteinImpactType.MISSENSE]: colors.missenseColor,
        [ProteinImpactType.TRUNCATING]: colors.truncatingColor,
        [ProteinImpactType.INFRAME]: colors.inframeColor,
        [ProteinImpactType.SPLICE]: colors.spliceColor,
        [ProteinImpactType.FUSION]: colors.fusionColor,
        [ProteinImpactType.OTHER]: colors.otherColor,
    };
}
