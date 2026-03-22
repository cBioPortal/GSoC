import { OncoKbCardDataType } from 'cbioportal-utils';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import * as React from 'react';

import {
    calcDiagnosticLevelScore,
    calcOncogenicScore,
    calcPrognosticLevelScore,
    calcResistanceLevelScore,
    calcSensitivityLevelScore,
} from '../util/OncoKbUtils';
import { errorIcon, loaderIcon } from './StatusHelpers';
import {
    AnnotationIcon,
    AnnotationIconWithTooltip,
} from './icon/AnnotationIcon';
import { CompactAnnotationIcon } from './icon/CompactAnnotationIcon';
import { OncoKbTooltip } from './OncoKbTooltip';
import OncoKbFeedback from './OncoKbFeedback';

import './oncokb.scss';
import 'oncokb-styles/dist/oncokb.css';

export interface IOncoKbProps {
    status: 'pending' | 'error' | 'complete';
    indicator?: IndicatorQueryResp;
    availableDataTypes?: OncoKbCardDataType[];
    mergeAnnotationIcons?: boolean;
    usingPublicOncoKbInstance?: boolean;
    isCancerGene: boolean;
    geneNotExist: boolean;
    hugoGeneSymbol: string;
    userDisplayName?: string;
    disableFeedback?: boolean;
    contentPadding?: number;
    hasMultipleCancerTypes?: boolean;
}

export function sortValue(
    indicator?: IndicatorQueryResp | undefined | null
): number[] {
    const values: number[] = [];

    if (indicator) {
        values[0] = calcOncogenicScore(indicator.oncogenic);
        values[1] = calcSensitivityLevelScore(indicator.highestSensitiveLevel);
        values[2] = calcResistanceLevelScore(indicator.highestResistanceLevel);
        values[3] = calcDiagnosticLevelScore(
            indicator.highestDiagnosticImplicationLevel
        );
        values[4] = calcPrognosticLevelScore(
            indicator.highestPrognosticImplicationLevel
        );
    }

    return values;
}

export function download(
    indicator?: IndicatorQueryResp | undefined | null
): string {
    if (!indicator) {
        return 'NA';
    }

    const oncogenic = indicator.oncogenic ? indicator.oncogenic : 'Unknown';
    const sensitivityLevel =
        indicator.highestSensitiveLevel?.toLowerCase() || 'level NA';
    const resistanceLevel =
        indicator.highestResistanceLevel?.toLowerCase() || 'resistance NA';

    return `${oncogenic}, ${sensitivityLevel}, ${resistanceLevel}`;
}

function findDefaultDataTypeForTooltip(
    usingPublicOncoKbInstance: boolean,
    indicator?: IndicatorQueryResp,
    availableDataTypes?: OncoKbCardDataType[]
) {
    if (usingPublicOncoKbInstance || !indicator) {
        return OncoKbCardDataType.BIOLOGICAL;
    }

    // priority is in this order: Tx > Dx > Px > Biological
    if (
        indicator.highestSensitiveLevel &&
        availableDataTypes &&
        availableDataTypes.includes(OncoKbCardDataType.TXS)
    ) {
        return OncoKbCardDataType.TXS;
    } else if (
        indicator.highestResistanceLevel &&
        availableDataTypes &&
        availableDataTypes.includes(OncoKbCardDataType.TXR)
    ) {
        return OncoKbCardDataType.TXR;
    } else if (
        indicator.highestDiagnosticImplicationLevel &&
        availableDataTypes &&
        availableDataTypes.includes(OncoKbCardDataType.DX)
    ) {
        return OncoKbCardDataType.DX;
    } else if (
        indicator.highestPrognosticImplicationLevel &&
        availableDataTypes &&
        availableDataTypes.includes(OncoKbCardDataType.PX)
    ) {
        return OncoKbCardDataType.PX;
    }

    return OncoKbCardDataType.BIOLOGICAL;
}

function multiAnnotationIcon(
    props: IOncoKbProps,
    handleFeedbackOpen: () => void
) {
    return (
        <span className="oncokb-content" style={{ display: 'inline-flex' }}>
            <AnnotationIcon
                type={OncoKbCardDataType.BIOLOGICAL}
                tooltipOverlay={tooltipContent(
                    OncoKbCardDataType.BIOLOGICAL,
                    props,
                    handleFeedbackOpen
                )}
                indicator={props.indicator}
                availableDataTypes={props.availableDataTypes}
            />
            {levelIcons(props, handleFeedbackOpen)}
        </span>
    );
}

function levelIcons(props: IOncoKbProps, handleFeedbackOpen: () => void) {
    if (props.usingPublicOncoKbInstance) {
        return null;
    }

    if (props.indicator) {
        return (
            <>
                {[
                    OncoKbCardDataType.TXS,
                    OncoKbCardDataType.TXR,
                    OncoKbCardDataType.DX,
                    OncoKbCardDataType.PX,
                ].map(dataType => (
                    <AnnotationIcon
                        type={dataType}
                        tooltipOverlay={tooltipContent(
                            dataType,
                            props,
                            handleFeedbackOpen
                        )}
                        indicator={props.indicator}
                        availableDataTypes={props.availableDataTypes}
                    />
                ))}
            </>
        );
    } else {
        // workaround: use content padding value to draw an empty icon when there is no indicator data.
        // this is to keep the icon alignment consistent with the rest of the column.
        // ideally we should implement grouped columns to avoid these kind of workarounds
        // (see https://github.com/cBioPortal/cbioportal/issues/8723)
        return <i style={{ paddingRight: props.contentPadding }} />;
    }
}

function singleAnnotationIcon(
    props: IOncoKbProps,
    handleFeedbackOpen: () => void
) {
    return (
        <span className="oncokb-content" style={{ display: 'inline-flex' }}>
            <AnnotationIconWithTooltip
                tooltipOverlay={tooltipContent(
                    findDefaultDataTypeForTooltip(
                        props.usingPublicOncoKbInstance || false,
                        props.indicator,
                        props.availableDataTypes
                    ),
                    props,
                    handleFeedbackOpen
                )}
                icon={
                    <CompactAnnotationIcon
                        indicator={props.indicator}
                        availableDataTypes={props.availableDataTypes}
                        usingPublicOncoKbInstance={
                            props.usingPublicOncoKbInstance || false
                        }
                    />
                }
            />
        </span>
    );
}

function tooltipContent(
    type: OncoKbCardDataType,
    props: IOncoKbProps,
    handleFeedbackOpen: () => void
): JSX.Element {
    return (
        <OncoKbTooltip
            type={type}
            usingPublicOncoKbInstance={props.usingPublicOncoKbInstance || false}
            hugoSymbol={props.hugoGeneSymbol}
            geneNotExist={props.geneNotExist}
            isCancerGene={props.isCancerGene}
            indicator={props.indicator || undefined}
            handleFeedbackOpen={
                props.disableFeedback ? undefined : handleFeedbackOpen
            }
            hasMultipleCancerTypes={props.hasMultipleCancerTypes}
        />
    );
}

export const OncoKB: React.FunctionComponent<IOncoKbProps> = (
    props: IOncoKbProps
) => {
    const [showFeedback, setShowFeedback] = React.useState(false);
    const [
        tooltipDataLoadComplete,
        setTooltipDataLoadComplete,
    ] = React.useState(false);

    const handleFeedbackOpen = React.useCallback(
        () => setShowFeedback(true),
        []
    );

    const handleFeedbackClose = React.useCallback(
        () => setShowFeedback(false),
        []
    );

    let oncoKbContent: JSX.Element;

    if (props.status === 'error') {
        oncoKbContent = errorIcon('Error fetching OncoKB data');
    } else if (props.status === 'pending') {
        oncoKbContent = loaderIcon('pull-left');
    } else {
        oncoKbContent = props.mergeAnnotationIcons
            ? singleAnnotationIcon(props, handleFeedbackOpen)
            : multiAnnotationIcon(props, handleFeedbackOpen);

        if (!props.disableFeedback && showFeedback) {
            oncoKbContent = (
                <span>
                    {oncoKbContent}
                    <OncoKbFeedback
                        userDisplayName={props.userDisplayName}
                        hugoSymbol={props.hugoGeneSymbol}
                        alteration={
                            props.indicator
                                ? props.indicator.query.alteration
                                : undefined
                        }
                        showFeedback={showFeedback}
                        handleFeedbackClose={handleFeedbackClose}
                    />
                </span>
            );
        }
    }
    return oncoKbContent;
};
