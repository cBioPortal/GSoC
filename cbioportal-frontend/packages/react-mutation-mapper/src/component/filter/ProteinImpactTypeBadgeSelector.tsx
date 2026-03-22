import { Option, ProteinImpactType } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import * as React from 'react';
import { CSSProperties } from 'react';

import { IProteinImpactTypeColors } from '../../model/ProteinImpact';
import { DEFAULT_PROTEIN_IMPACT_TYPE_COLORS } from '../../util/MutationTypeUtils';
import { BadgeLabel } from './BadgeLabel';
import BadgeSelector, {
    BadgeSelectorOption,
    BadgeSelectorProps,
    getBadgeStyleOverride,
} from './BadgeSelector';
import {
    getProteinImpactTypeColorMap,
    getProteinImpactTypeOptionDisplayValueMap,
} from './ProteinImpactTypeHelper';

export type ProteinImpactTypeBadgeSelectorProps = BadgeSelectorProps & {
    colors: IProteinImpactTypeColors;
    counts?: { [proteinImpactType: string]: number };
    excludedProteinTypes?: string[];
    groupIndex?: number;
    groupNameWithOrdinal?: string;
    height?: number;
};

const VALUES = [
    ProteinImpactType.MISSENSE,
    ProteinImpactType.TRUNCATING,
    ProteinImpactType.INFRAME,
    ProteinImpactType.SPLICE,
    ProteinImpactType.FUSION,
    ProteinImpactType.OTHER,
];

export function getProteinImpactTypeOptionLabel(option: Option): JSX.Element {
    return <span>{option.label || option.value}</span>;
}

export function getProteinImpactTypeBadgeLabel(
    option: BadgeSelectorOption,
    selectedValues: { [optionValue: string]: any },
    badgeClassName?: string,
    badgeAlignmentStyle?: CSSProperties,
    isDriverAnnotated?: boolean,
    badgeLabelFormat?: (
        label: JSX.Element | string,
        badgeFirst?: boolean,
        value?: string,
        badge?: JSX.Element | null
    ) => JSX.Element,
    badgeFirst?: boolean
): JSX.Element {
    return (
        <BadgeLabel
            label={option.label || option.value}
            badgeContent={option.badgeContent}
            badgeStyleOverride={getBadgeStyleOverride(
                option,
                selectedValues,
                badgeAlignmentStyle
            )}
            badgeClassName={badgeClassName}
            badgeFirst={badgeFirst}
            value={option.value}
            isDriverAnnotated={isDriverAnnotated}
            badgeLabelFormat={badgeLabelFormat}
        />
    );
}

@observer
export class ProteinImpactTypeBadgeSelector<
    P extends ProteinImpactTypeBadgeSelectorProps = ProteinImpactTypeBadgeSelectorProps
> extends React.Component<P, {}> {
    constructor(props: any) {
        super(props);
    }

    public static defaultProps: Partial<ProteinImpactTypeBadgeSelectorProps> = {
        colors: DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
        alignColumns: true,
        numberOfColumnsPerRow: 2,
    };

    protected get optionDisplayValueMap() {
        return getProteinImpactTypeOptionDisplayValueMap(
            this.proteinImpactTypeColors
        );
    }

    protected get proteinImpactTypeColors() {
        return getProteinImpactTypeColorMap(this.props.colors);
    }

    protected get options() {
        // get options, hide "Other" if it's 0
        return VALUES.map(value => ({
            value,
            label: this.optionDisplayValueMap[value],
            badgeContent: this.props.counts
                ? this.props.counts[value]
                : undefined,
            badgeStyleOverride: {
                backgroundColor: this.proteinImpactTypeColors[value],
            },
        })).filter(
            type =>
                !(
                    this.props.excludedProteinTypes?.includes(type.value) ||
                    (type.value === ProteinImpactType.OTHER &&
                        type.badgeContent === 0)
                )
        );
    }

    public render() {
        return (
            <div style={{ display: 'inline-flex' }}>
                <div>
                    <table style={{ height: this.props.height }}>
                        <BadgeSelector
                            options={this.options}
                            getOptionLabel={getProteinImpactTypeOptionLabel}
                            getBadgeLabel={getProteinImpactTypeBadgeLabel}
                            useOnlyFeature={true}
                            badgeFirst={true}
                            {...this.props}
                        />
                    </table>
                </div>
                {this.props.groupNameWithOrdinal && (
                    <div
                        style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            textAlign: 'center',
                            writingMode: 'vertical-lr',
                            transform: 'rotate(180deg)',
                        }}
                    >
                        {this.props.groupNameWithOrdinal}
                    </div>
                )}
            </div>
        );
    }
}

export default ProteinImpactTypeBadgeSelector;
