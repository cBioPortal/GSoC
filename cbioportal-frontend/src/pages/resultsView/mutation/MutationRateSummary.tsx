import * as React from 'react';
import { DataFilter } from 'react-mutation-mapper';
import {
    MolecularProfile,
    Mutation,
    SampleIdentifier,
} from 'cbioportal-ts-api-client';
import {
    germlineMutationRate,
    somaticMutationRate,
} from 'shared/lib/MutationUtils';
import { computed, makeObservable } from 'mobx';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';

import MutationStatusSelector from './MutationStatusSelector';

export interface IMutationRateSummaryProps {
    mutations: Mutation[];
    hugoGeneSymbol: string;
    samples: SampleIdentifier[];
    germlineConsentedSamples: MobxPromise<SampleIdentifier[]>;
    molecularProfileIdToMolecularProfile: MobxPromise<{
        [molecularProfileId: string]: MolecularProfile;
    }>;
    mutationStatusFilter?: DataFilter<string>;
    onMutationStatusSelect?: (
        selectedOptionIds: string[],
        allValuesSelected?: boolean
    ) => void;
}

@observer
export default class MutationRateSummary extends React.Component<
    IMutationRateSummaryProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @computed
    public get germlineMutationRate() {
        let samples: SampleIdentifier[] | undefined;

        if (this.props.germlineConsentedSamples.status !== 'pending') {
            // for germline mutation rate
            // - only use germline constented samples for impact study
            // - in all other cases assume that every sample had germline testing
            //   if > 0 germline mutations are found
            samples =
                this.props.germlineConsentedSamples &&
                this.props.germlineConsentedSamples.result &&
                this.props.germlineConsentedSamples.result.length > 0
                    ? this.props.germlineConsentedSamples.result
                    : this.props.samples;
        }

        return samples
            ? germlineMutationRate(
                  this.props.hugoGeneSymbol,
                  this.props.mutations,
                  this.props.molecularProfileIdToMolecularProfile.result!,
                  samples
              )
            : 0;
    }

    @computed
    public get somaticMutationRate() {
        return this.props.samples.length > 0
            ? somaticMutationRate(
                  this.props.hugoGeneSymbol,
                  this.props.mutations,
                  this.props.molecularProfileIdToMolecularProfile.result!,
                  this.props.samples
              )
            : 0;
    }

    render() {
        return (
            <span data-test="mutation-rate-summary">
                <MutationStatusSelector
                    filter={this.props.mutationStatusFilter}
                    onSelect={this.props.onMutationStatusSelect}
                    rates={{
                        Germline: this.germlineMutationRate,
                        Somatic: this.somaticMutationRate,
                    }}
                    somaticContent={{
                        title: 'Somatic Mutation Frequency',
                        description: `Percentage of samples with a somatic mutation in ${this.props.hugoGeneSymbol}`,
                    }}
                    germlineContent={
                        this.germlineMutationRate > 0
                            ? {
                                  title: 'Germline Mutation Frequency',
                                  description: `Percentage of samples with a germline mutation in ${this.props.hugoGeneSymbol}`,
                              }
                            : undefined
                    }
                />
            </span>
        );
    }
}
