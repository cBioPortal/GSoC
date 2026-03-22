import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

import { SegmentTrackFeatures } from 'shared/lib/IGVUtils';

import styles from './styles.module.scss';

interface ICnaTrackSampleSummaryProps {
    data: SegmentTrackFeatures[];
}

const CN_LENGTH_THRESHOLD = 50000;
const CN_VALUE_THRESHOLD = 0.2;

function calcAlterationPercentage(data: SegmentTrackFeatures[]) {
    let genomeMeasured = 0;
    let genomeAltered = 0;

    data.forEach(seg => {
        const diff = seg.end - seg.start;
        genomeMeasured += diff;

        if (
            diff >= CN_LENGTH_THRESHOLD &&
            Math.abs(seg.value) >= CN_VALUE_THRESHOLD
        ) {
            genomeAltered += diff;
        }
    });

    if (genomeMeasured === 0) {
        return undefined;
    } else {
        return (100 * genomeAltered) / genomeMeasured;
    }
}

const CnaTrackSampleSummary: React.FunctionComponent<ICnaTrackSampleSummaryProps> = props => {
    const alterationPercentage = calcAlterationPercentage(props.data);

    const summaryText =
        alterationPercentage === undefined
            ? 'N/A'
            : `${alterationPercentage.toFixed(1)}%`;

    const overlayText =
        alterationPercentage === undefined
            ? 'Copy number segment data not available'
            : 'Percentage of copy number altered chromosome regions (mean copy number log value >0.2 or <-0.2) out of measured regions.';

    return (
        <DefaultTooltip
            overlay={<div style={{ maxWidth: 400 }}>{overlayText}</div>}
            placement="topRight"
        >
            <div className={styles.igvTrackSampleSummaryText}>
                {summaryText}
            </div>
        </DefaultTooltip>
    );
};

export default CnaTrackSampleSummary;
