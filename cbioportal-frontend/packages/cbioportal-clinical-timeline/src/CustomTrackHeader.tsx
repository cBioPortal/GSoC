import * as React from 'react';
import { CustomTrackSpecification } from './CustomTrack';
import { TimelineStore } from './TimelineStore';
import classNames from 'classnames';

interface ICustomTrackHeaderProps {
    store: TimelineStore;
    specification: CustomTrackSpecification;
    handleTrackHover: (e: React.MouseEvent<any>) => void;
    disableHover?: boolean;
}

const CustomTrackHeader: React.FunctionComponent<ICustomTrackHeaderProps> = function({
    store,
    specification,
    handleTrackHover,
    disableHover,
}: ICustomTrackHeaderProps) {
    return (
        <div
            className={classNames('tl-custom-track-header', {
                'tl-hover-disabled': disableHover,
            })}
            style={{ paddingLeft: 5, height: specification.height(store) }}
            onMouseEnter={handleTrackHover}
            onMouseLeave={handleTrackHover}
        >
            {specification.renderHeader(store)}
        </div>
    );
};

export default CustomTrackHeader;
