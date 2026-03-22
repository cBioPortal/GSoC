import React from 'react';
import Tooltip from 'rc-tooltip';
import { OncoKbCardDataType } from 'cbioportal-utils';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';

import {
    annotationIconClassNames,
    calcHighestIndicatorLevel,
} from '../../util/OncoKbUtils';

import annotationStyles from '../annotation.module.scss';

function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

export const AnnotationIcon: React.FunctionComponent<{
    type: OncoKbCardDataType;
    tooltipOverlay?: JSX.Element;
    indicator?: IndicatorQueryResp;
    availableDataTypes?: OncoKbCardDataType[];
}> = props => {
    if (
        props.availableDataTypes !== undefined &&
        !props.availableDataTypes.includes(props.type)
    ) {
        return null;
    }
    const highestLevel = calcHighestIndicatorLevel(props.type, props.indicator);

    return (
        <AnnotationIconWithTooltip
            tooltipOverlay={props.tooltipOverlay}
            icon={
                <i
                    className={annotationIconClassNames(
                        props.type,
                        highestLevel,
                        props.indicator
                    )}
                    data-test="oncogenic-icon-image"
                />
            }
        />
    );
};

export const AnnotationIconWithTooltip: React.FunctionComponent<{
    tooltipOverlay?: JSX.Element;
    icon?: JSX.Element;
}> = props => {
    if (props.icon) {
        return (
            <Tooltip
                overlayClassName="oncokb-tooltip"
                overlay={() =>
                    props.tooltipOverlay ? props.tooltipOverlay : null
                }
                placement="right"
                trigger={['hover', 'focus']}
                onPopupAlign={hideArrow}
                destroyTooltipOnHide={true}
            >
                <span className={`${annotationStyles['annotation-item']}`}>
                    {props.icon}
                </span>
            </Tooltip>
        );
    } else {
        return null;
    }
};
