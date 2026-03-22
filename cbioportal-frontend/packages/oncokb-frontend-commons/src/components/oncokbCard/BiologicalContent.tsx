import React from 'react';
import { Citations } from 'oncokb-ts-api-client';

import { EvidenceReferenceContent } from './EvidenceReferenceContent';

export const BiologicalContent: React.FunctionComponent<{
    biologicalSummary: string;
    mutationEffectCitations: Citations;
}> = props => {
    return (
        <EvidenceReferenceContent
            description={props.biologicalSummary}
            citations={props.mutationEffectCitations}
            noInfoDisclaimer={'Mutation effect information is not available.'}
        />
    );
};
