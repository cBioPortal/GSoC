import { observer } from 'mobx-react';
import * as React from 'react';

import { Mutation } from 'cbioportal-utils';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import {
    Clinvar,
    MyVariantInfo,
    SignalAnnotation,
    VariantAnnotation,
    VariantAnnotationSummary,
} from 'genome-nexus-ts-api-client';

import FunctionalPrediction from '../functionalPrediction/FunctionalPrediction';
import GeneralPopulationPrevalence from '../generalPopulationPrevalence/GeneralPopulationPrevalence';
import TherapeuticImplication from '../therapeuticImplication/TherapeuticImplication';
import Pathogenicity from '../pathogenicity/Pathogenicity';
import FrequencyTable from '../frequencyTable/FrequencyTable';
import CancerPatientPopulation from '../cancerPatientPopulation/CancerPatientPrevalence';

import featureTableStyle from './FeatureTable.module.scss';

interface IFeatureTableProps {
    annotationInternal?: VariantAnnotationSummary;
    myVariantInfo?: MyVariantInfo;
    variantAnnotation?: VariantAnnotation;
    oncokb?: IndicatorQueryResp;
    clinvar?: Clinvar;
    signalAnnotation?: SignalAnnotation;
    isCanonicalTranscriptSelected: boolean;
    mutation: Mutation;
}

@observer
class FeatureTable extends React.Component<IFeatureTableProps> {
    public render() {
        return (
            <div className={featureTableStyle['feature-table']}>
                <table className={'table'}>
                    <tbody>
                        <tr>
                            <th>Pathogenicity:</th>
                            <td>
                                <Pathogenicity
                                    clinvar={this.props.clinvar}
                                    oncokb={this.props.oncokb}
                                    signalAnnotation={
                                        this.props.signalAnnotation
                                    }
                                    isCanonicalTranscriptSelected={
                                        this.props.isCanonicalTranscriptSelected
                                    }
                                />
                            </td>
                        </tr>
                        <tr>
                            <th>Therapeutic implication:</th>
                            <td>
                                <TherapeuticImplication
                                    oncokb={this.props.oncokb}
                                    isCanonicalTranscriptSelected={
                                        this.props.isCanonicalTranscriptSelected
                                    }
                                />
                            </td>
                        </tr>

                        <tr>
                            <th>Functional prediction:</th>
                            <td>
                                <FunctionalPrediction
                                    variantAnnotation={
                                        this.props.variantAnnotation
                                    }
                                    isCanonicalTranscriptSelected={
                                        this.props.isCanonicalTranscriptSelected
                                    }
                                />
                            </td>
                        </tr>

                        <tr>
                            <th>General population prevalence:</th>
                            <td>
                                <GeneralPopulationPrevalence
                                    myVariantInfo={this.props.myVariantInfo}
                                    chromosome={
                                        this.props.annotationInternal
                                            ? this.props.annotationInternal
                                                  .genomicLocation.chromosome
                                            : null
                                    }
                                    mutation={this.props.mutation}
                                    variantAnnotation={
                                        this.props.variantAnnotation
                                    }
                                />
                            </td>
                        </tr>

                        <tr>
                            <th>Cancer patient prevalence:</th>
                            <td>
                                <CancerPatientPopulation
                                    variantAnnotation={
                                        this.props.variantAnnotation
                                    }
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
                <FrequencyTable
                    signalAnnotation={this.props.signalAnnotation}
                />
            </div>
        );
    }
}

export default FeatureTable;
