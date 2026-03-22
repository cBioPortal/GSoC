import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { TooltipDatum } from 'pages/patientView/timeline/VAFChart';
import { VAFReport } from 'shared/lib/MutationUtils';

export enum MutationStatus {
    MUTATED_WITH_VAF,
    MUTATED_BUT_NO_VAF,
    PROFILED_WITH_READS_BUT_UNCALLED,
    PROFILED_BUT_NOT_MUTATED,
    NOT_PROFILED,
}

export function mutationTooltip(
    mutation: Mutation,
    sampleSpecificInfo?: TooltipDatum
) {
    function vafFraction(vafReport: VAFReport) {
        return `${vafReport.variantReadCount} reads of ${vafReport.totalReadCount} total`;
    }

    let sampleSpecificSection: any = null;
    if (sampleSpecificInfo) {
        // show tooltip when hovering a point
        let vafExplanation: string;
        switch (sampleSpecificInfo.mutationStatus) {
            case MutationStatus.MUTATED_WITH_VAF:
                vafExplanation = `VAF: ${sampleSpecificInfo.vafReport!.vaf.toFixed(
                    2
                )} (${vafFraction(sampleSpecificInfo.vafReport!)})`;
                break;
            case MutationStatus.MUTATED_BUT_NO_VAF:
                vafExplanation = `Mutated, but we don't have VAF data.`;
                break;
            case MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED:
            case MutationStatus.PROFILED_BUT_NOT_MUTATED:
                vafExplanation = `Mutation not detected (VAF: ${(
                    sampleSpecificInfo.vafReport?.vaf || 0
                ).toFixed(2)} (${vafFraction(sampleSpecificInfo.vafReport!)}))`;
                break;
            case MutationStatus.NOT_PROFILED:
            default:
                vafExplanation = `${sampleSpecificInfo.sampleId} is not sequenced for ${mutation.gene.hugoGeneSymbol} mutations.`;
                break;
        }
        sampleSpecificSection = [
            <span>Sample ID: {sampleSpecificInfo.sampleId}</span>,
            <br />,
            <span>{vafExplanation}</span>,
        ];
    }
    return (
        <div>
            <span>Gene: {mutation.gene.hugoGeneSymbol}</span>
            <br />
            <span>Protein Change: {mutation.proteinChange}</span>
            <br />
            {sampleSpecificSection}
        </div>
    );
}
