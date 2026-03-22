import {
    MutationAssessor as MutationAssessorData,
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';
import { SHOW_MUTATION_ASSESSOR } from '../../util/Constants';
import MutationAssessor from './MutationAssessor';
import PolyPhen2 from './PolyPhen2';
import Sift from './Sift';
import SignalPrediction from './SignalPrediction';

// Most of this component comes from cBioPortal-frontend

interface IFunctionalPredictionProps {
    variantAnnotation?: VariantAnnotation;
    isCanonicalTranscriptSelected: boolean;
}

interface IFunctionalImpactData {
    mutationAssessor: MutationAssessorData | undefined;
    siftScore: number | undefined;
    siftPrediction: string | undefined;
    polyPhenScore: number | undefined;
    polyPhenPrediction: string | undefined;
}

@observer
class FunctionalPrediction extends React.Component<IFunctionalPredictionProps> {
    public getData(
        genomeNexusData: VariantAnnotation | undefined,
        selectedTranscriptId?: string
    ): IFunctionalImpactData {
        const mutationAssessor = genomeNexusData?.mutation_assessor;
        const transcriptConsequence =
            genomeNexusData && selectedTranscriptId
                ? genomeNexusData.transcript_consequences.find(
                      tc => tc.transcript_id === selectedTranscriptId
                  )
                : undefined;

        const siftScore = transcriptConsequence?.sift_score;
        const siftPrediction = transcriptConsequence?.sift_prediction;
        const polyPhenScore = transcriptConsequence?.polyphen_score;
        const polyPhenPrediction = transcriptConsequence?.polyphen_prediction;

        return {
            mutationAssessor,
            siftScore,
            siftPrediction,
            polyPhenScore,
            polyPhenPrediction,
        };
    }
    public render() {
        const data = this.getData(this.props.variantAnnotation);
        return (
            <div>
                <SignalPrediction
                    variantAnnotation={this.props.variantAnnotation}
                />
                <PolyPhen2
                    polyPhenScore={data.polyPhenScore}
                    polyPhenPrediction={data.polyPhenPrediction}
                />
                {SHOW_MUTATION_ASSESSOR && (
                    <MutationAssessor
                        mutationAssessor={data.mutationAssessor}
                        isCanonicalTranscriptSelected={
                            this.props.isCanonicalTranscriptSelected
                        }
                    />
                )}
                <Sift
                    siftScore={data.siftScore}
                    siftPrediction={data.siftPrediction}
                />
            </div>
        );
    }
}

export default FunctionalPrediction;
