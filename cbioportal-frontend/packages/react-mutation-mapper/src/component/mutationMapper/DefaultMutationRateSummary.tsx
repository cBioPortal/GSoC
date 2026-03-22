import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { formatPercentValue } from 'cbioportal-utils';
import * as React from 'react';

import styles from './defaultMutationRateSummary.module.scss';

export type MutationRate = {
    rate: number;
    title: string;
    description?: string;
};

export type DefaultMutationRateSummaryProps = {
    rates: MutationRate[];
    fractionDigits?: number;
};

export default class DefaultMutationRateSummary extends React.Component<
    DefaultMutationRateSummaryProps
> {
    public render() {
        return (
            <React.Fragment>
                {this.props.rates.map(r => (
                    <div key={r.title} className={styles.mutationRateSummary}>
                        <span>{r.title}: </span>
                        <span>
                            {formatPercentValue(
                                r.rate,
                                this.props.fractionDigits
                            )}
                            %
                        </span>
                        {r.description && (
                            <DefaultTooltip
                                placement="right"
                                overlay={<span>{r.description}</span>}
                            >
                                <i
                                    className="fa fa-info-circle"
                                    style={{ marginLeft: '0.2rem' }}
                                />
                            </DefaultTooltip>
                        )}
                    </div>
                ))}
            </React.Fragment>
        );
    }
}
