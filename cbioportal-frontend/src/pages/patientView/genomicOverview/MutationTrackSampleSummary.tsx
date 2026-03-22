import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

import { MutationTrackFeatures } from 'shared/lib/IGVUtils';

import styles from './styles.module.scss';

interface IMutationTrackSampleSummaryProps {
    data: MutationTrackFeatures[];
}

const MutationTrackSampleSummary: React.FunctionComponent<IMutationTrackSampleSummaryProps> = props => {
    return (
        <DefaultTooltip
            overlay="Number of mutation events."
            placement="topRight"
        >
            <div className={styles.igvTrackSampleSummaryText}>
                {props.data.length}
            </div>
        </DefaultTooltip>
    );
};

export default MutationTrackSampleSummary;
