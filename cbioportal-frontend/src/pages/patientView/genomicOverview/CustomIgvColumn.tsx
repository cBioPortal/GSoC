import classnames from 'classnames';
import * as React from 'react';
import { RULER_TRACK_FULL_HEIGHT } from 'shared/lib/IGVUtils';

import styles from './styles.module.scss';

interface ICustomIgvColumnProps {
    classname?: string;
    compactView?: boolean;
    navTrack?: JSX.Element;
    rulerTrack?: JSX.Element;
    sequenceTrack?: JSX.Element;
    ideogramTrack?: JSX.Element;
    mutationTrack?: JSX.Element[];
    mutationTrackHeight?: number;
    cnaTrack?: JSX.Element[];
    cnaTrackHeight?: number;
}

const Z_INDEX_FOR_INTERACTIVE_COMPONENTS = 666;

const CustomIgvColumn: React.FunctionComponent<ICustomIgvColumnProps> = props => {
    return (
        <div
            className={classnames(
                'igv-axis-column',
                styles.customIgvColumn,
                props.classname
            )}
        >
            <div
                style={{
                    height: 36,
                    display: props.compactView ? 'none' : undefined,
                }}
            >
                {!props.compactView && props.navTrack}
            </div>
            <div
                style={{
                    height: 16,
                    display: props.compactView ? 'none' : undefined,
                    zIndex: Z_INDEX_FOR_INTERACTIVE_COMPONENTS,
                }}
            >
                {!props.compactView && props.ideogramTrack}
            </div>
            <div
                style={{
                    height: props.compactView
                        ? RULER_TRACK_FULL_HEIGHT / 2
                        : RULER_TRACK_FULL_HEIGHT,
                    zIndex: Z_INDEX_FOR_INTERACTIVE_COMPONENTS,
                }}
            >
                {props.rulerTrack}
            </div>
            <div
                style={{
                    height: 25,
                    display: props.compactView ? 'none' : undefined,
                    zIndex: Z_INDEX_FOR_INTERACTIVE_COMPONENTS,
                }}
            >
                {!props.compactView && props.sequenceTrack}
            </div>
            <div
                style={{
                    height: props.mutationTrackHeight || 0,
                    display: props.mutationTrackHeight ? undefined : 'none',
                    zIndex: Z_INDEX_FOR_INTERACTIVE_COMPONENTS,
                }}
            >
                {props.mutationTrack}
            </div>
            <div
                style={{
                    height: props.cnaTrackHeight || 0,
                    display: props.cnaTrackHeight ? undefined : 'none',
                    zIndex: Z_INDEX_FOR_INTERACTIVE_COMPONENTS,
                }}
            >
                {props.cnaTrack}
            </div>
        </div>
    );
};

export default CustomIgvColumn;
