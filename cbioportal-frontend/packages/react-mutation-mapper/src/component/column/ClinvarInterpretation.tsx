import { Clinvar, VariantAnnotation } from 'genome-nexus-ts-api-client';
import { observer } from 'mobx-react';
import * as React from 'react';

import { defaultSortMethod, Mutation, RemoteData } from 'cbioportal-utils';
import ClinvarSummary from '../clinvar/ClinvarSummary';
import { getClinvarData } from '../clinvar/ClinvarHelper';
import { errorIcon, loaderIcon } from '../StatusHelpers';

type ClinvarInterpretationProps = {
    mutation: Mutation;
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
};

export function download(clinvar?: Clinvar): string {
    const clinicalSignificance = clinvar?.clinicalSignificance;
    const conflictingClinicalSignificance =
        clinvar?.conflictingClinicalSignificance;
    if (clinicalSignificance && conflictingClinicalSignificance) {
        return (
            clinicalSignificance + '(' + conflictingClinicalSignificance + ')'
        );
    } else if (clinicalSignificance) {
        return clinicalSignificance;
    } else {
        return '';
    }
}

export function sortValue(clinvar?: Clinvar): string | null {
    if (clinvar && clinvar.clinicalSignificance) {
        return clinvar.clinicalSignificance;
    } else {
        return null;
    }
}

export function clinvarSortMethod(a: Clinvar, b: Clinvar) {
    return defaultSortMethod(sortValue(a), sortValue(b));
}

@observer
export default class ClinvarInterpretation extends React.Component<
    ClinvarInterpretationProps,
    {}
> {
    public render() {
        if (this.props.indexedVariantAnnotations) {
            let content;
            const status = this.props.indexedVariantAnnotations.status;
            if (status === 'pending') {
                content = loaderIcon();
            } else if (status === 'error') {
                content = errorIcon('Error fetching Genome Nexus annotation');
            } else {
                const clinvarData = getClinvarData(
                    this.props.mutation,
                    this.props.indexedVariantAnnotations
                );
                content = <ClinvarSummary clinvar={clinvarData} />;
            }
            return content;
        } else {
            return <div />;
        }
    }
}
