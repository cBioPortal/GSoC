import _ from 'lodash';
import * as React from 'react';
import classnames from 'classnames';
import { observer } from 'mobx-react';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import { action, computed, makeObservable, observable } from 'mobx';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { SignalAnnotation, SignalMutation } from 'genome-nexus-ts-api-client';
import { signalLogoInTable } from '../featureTable/SignalLogo';
import mskImpactStyle from './MskImpact.module.scss';
import { formatFrequencyValue } from 'cbioportal-utils';
import { MskImpactFrequencyDigits } from '../../util/Constants';

interface IMskImpactProps {
    signalAnnotation: SignalAnnotation | undefined;
}

@observer
class MskImpact extends React.Component<IMskImpactProps> {
    @observable private showFrequencies = false;

    constructor(props: IMskImpactProps) {
        super(props);
        makeObservable(this);
    }

    @computed get mskImpactContent() {
        let mskImpactFrequency = (
            <div className={featureTableStyle['data-with-link']}>N/A</div>
        );
        if (
            this.props.signalAnnotation &&
            this.props.signalAnnotation.annotation.length > 0
        ) {
            _.forEach(this.props.signalAnnotation.annotation, annotation => {
                if (
                    annotation.generalPopulationStats &&
                    annotation.generalPopulationStats.frequencies
                ) {
                    // only germline mutation has generalPopulationStats, so mskImpactFrequency won't be overwritten by somatic
                    mskImpactFrequency = (
                        <div className={featureTableStyle['data-with-link']}>
                            {formatFrequencyValue(
                                annotation.generalPopulationStats.frequencies
                                    .impact,
                                MskImpactFrequencyDigits
                            )}
                            {`% `}
                            <i
                                className={`fa fa-chevron-circle-down ${
                                    this.showFrequencies
                                        ? mskImpactStyle['table-open']
                                        : ''
                                } `}
                                onClick={this.onClick}
                            />
                        </div>
                    );
                }
            });
        }
        return mskImpactFrequency;
    }

    private generateFrequencyCell(population: string, frequency: number) {
        return (
            <div className={featureTableStyle['feature-table-layout']}>
                <div
                    className={classnames(
                        featureTableStyle['data-source'],
                        mskImpactStyle['population']
                    )}
                >
                    {`> ${_.upperCase(population)}`}
                </div>
                <div className={featureTableStyle['data-with-link']}>
                    {`${formatFrequencyValue(
                        frequency,
                        MskImpactFrequencyDigits
                    )}%`}
                </div>
            </div>
        );
    }

    private frequenciesTable(signalAnnotation: SignalMutation[]) {
        let frequenciesTable: JSX.Element[] = [];
        // could have both somatic and germline mutations, only germline mutation has generalPopulationStats
        _.forEach(signalAnnotation, mutation => {
            if (
                mutation.generalPopulationStats &&
                mutation.generalPopulationStats.frequencies
            ) {
                // generate table element with population and frequency
                _.map(
                    mutation.generalPopulationStats.frequencies,
                    (frequency, population) => {
                        if (population !== 'impact') {
                            frequenciesTable.push(
                                this.generateFrequencyCell(
                                    population,
                                    frequency
                                )
                            );
                        }
                    }
                );
            }
        });
        return frequenciesTable;
    }

    public render() {
        return (
            <>
                <div className={featureTableStyle['feature-table-layout']}>
                    <div className={featureTableStyle['data-source']}>
                        <DefaultTooltip
                            placement="top"
                            overlay={
                                <span>
                                    Frequency of the variant in MSK-IMPACT
                                    cohort
                                </span>
                            }
                        >
                            <span
                                className={
                                    featureTableStyle[
                                        'data-source-without-linkout'
                                    ]
                                }
                            >
                                MSK-IMPACT
                            </span>
                        </DefaultTooltip>
                        {signalLogoInTable}
                    </div>
                    {this.mskImpactContent}
                </div>
                {/* only when frequencies data exists, showFrequencies could be true, otherwise showFrequencies is always false */}
                {this.showFrequencies &&
                    this.frequenciesTable(
                        this.props.signalAnnotation!.annotation
                    )}
            </>
        );
    }

    @action.bound
    public onClick() {
        this.showFrequencies = !this.showFrequencies;
    }
}

export default MskImpact;
