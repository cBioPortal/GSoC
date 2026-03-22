import * as React from 'react';

import { HotspotInfo } from '../hotspot/HotspotInfo';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { loaderIcon } from '../StatusHelpers';

import hotspotImg from '../../images/cancer-hotspots.svg';
import hotspot3dImg from '../../images/3d-hotspots.svg';
import annotationStyles from './annotation.module.scss';

export interface ICancerHotspotsProps {
    status: 'pending' | 'error' | 'complete';
    isHotspot: boolean;
    is3dHotspot: boolean;
}

export function sortValue(isHotspot: boolean, is3dHotspot: boolean): number {
    let score: number = 0;

    if (isHotspot) {
        score += 1;
    }

    if (is3dHotspot) {
        score += 0.5;
    }

    return score;
}

export function placeArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.left = '10px';
}

export default class HotspotAnnotation extends React.Component<
    ICancerHotspotsProps,
    {}
> {
    constructor(props: ICancerHotspotsProps) {
        super(props);
        this.state = {};
    }

    public render() {
        const { isHotspot, is3dHotspot } = this.props;

        let hotspotContent = (
            <span className={`${annotationStyles['annotation-item']}`} />
        );

        if (this.props.status === 'pending') {
            hotspotContent = loaderIcon('pull-left');
        } else if (isHotspot || is3dHotspot) {
            const hotspotsImgWidth: number = 14;
            let hotspotsImgHeight: number = 14;
            let hotspotsImgSrc = hotspotImg;

            // if it is a 3D hotspot but not a recurrent hotspot, show the 3D hotspot icon
            if (!isHotspot) {
                hotspotsImgSrc = hotspot3dImg;
                hotspotsImgHeight = 18;
            }

            const arrowContent = <div className="rc-tooltip-arrow-inner" />;
            const tooltipContent = (
                <HotspotInfo isHotspot={isHotspot} is3dHotspot={is3dHotspot} />
            );

            hotspotContent = (
                <DefaultTooltip
                    overlay={tooltipContent}
                    placement="topLeft"
                    trigger={['hover', 'focus']}
                    arrowContent={arrowContent}
                    onPopupAlign={placeArrow}
                >
                    <span
                        className={`${annotationStyles['annotation-item']} chang_hotspot`}
                    >
                        <img
                            width={hotspotsImgWidth}
                            height={hotspotsImgHeight}
                            src={hotspotsImgSrc}
                            alt="Recurrent Hotspot Symbol"
                        />
                    </span>
                </DefaultTooltip>
            );
        }

        return hotspotContent;
    }
}
