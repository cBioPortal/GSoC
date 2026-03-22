import { VariantAnnotationSummary } from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';
import { getTranscriptConsequenceSummary } from '../../util/AnnotationSummaryUtil';
import './TranscriptSummaryTable.module.scss';
import TranscriptTable from './TranscriptTable';

interface ITranscriptSummaryTableProps {
    annotation: VariantAnnotationSummary | undefined;
    isOpen: boolean;
    allValidTranscripts: string[];
    onTranscriptSelect(transcriptId: string): void;
}

export interface ITranscript {
    transcript: string | undefined;
    hugoGeneSymbol: string | undefined;
    hgvsShort: string | undefined;
    refSeq: string | undefined;
    variantClassification: string | undefined;
    hgvsc: string | undefined;
    consequenceTerms: string | undefined;
    exon: string | undefined;
}

@observer
class TranscriptSummaryTable extends React.Component<
    ITranscriptSummaryTableProps
> {
    public render() {
        return (
            <div className="transcript-table">
                <TranscriptTable
                    isOpen={this.props.isOpen}
                    canonicalTranscript={this.putCanonicalTranscriptInTable(
                        this.props.annotation
                    )}
                    otherTranscripts={this.putOtherTranscriptsInTable(
                        this.props.annotation
                    )}
                    allValidTranscripts={this.props.allValidTranscripts}
                    onTranscriptSelect={this.props.onTranscriptSelect}
                />
            </div>
        );
    }

    private putCanonicalTranscriptInTable(
        annotation: VariantAnnotationSummary | undefined
    ) {
        const transcriptConsequenceSummary = getTranscriptConsequenceSummary(
            annotation
        );

        const canonicalTranscript = {
            transcript: transcriptConsequenceSummary.transcriptId,
            hugoGeneSymbol: transcriptConsequenceSummary.hugoGeneSymbol,
            hgvsShort: transcriptConsequenceSummary.hgvspShort,
            refSeq: transcriptConsequenceSummary.refSeq,
            variantClassification:
                transcriptConsequenceSummary.variantClassification,
            hgvsc: transcriptConsequenceSummary.hgvsc,
            consequenceTerms: transcriptConsequenceSummary.consequenceTerms,
            exon: transcriptConsequenceSummary.exon,
        };

        return canonicalTranscript;
    }

    private putOtherTranscriptsInTable(
        annotation: VariantAnnotationSummary | undefined
    ) {
        const otherTranscript: ITranscript[] = [];
        const canonicalTranscriptId = this.putCanonicalTranscriptInTable(
            annotation
        ).transcript;
        if (
            annotation !== undefined &&
            annotation.transcriptConsequenceSummaries
        ) {
            annotation.transcriptConsequenceSummaries.forEach(transcript => {
                if (transcript.transcriptId !== canonicalTranscriptId) {
                    otherTranscript.push({
                        transcript: transcript.transcriptId,
                        hugoGeneSymbol: transcript.hugoGeneSymbol,
                        hgvsShort: transcript.hgvspShort,
                        refSeq: transcript.refSeq,
                        variantClassification: transcript.variantClassification,
                        hgvsc: transcript.hgvsc,
                        consequenceTerms: transcript.consequenceTerms,
                        exon: transcript.exon,
                    });
                }
            });
        }
        return otherTranscript;
    }
}

export default TranscriptSummaryTable;
