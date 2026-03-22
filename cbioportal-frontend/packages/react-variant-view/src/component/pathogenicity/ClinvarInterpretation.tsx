import * as React from 'react';
import { observer } from 'mobx-react';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import { computed, makeObservable } from 'mobx';
import { Clinvar } from 'genome-nexus-ts-api-client';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

export interface IClinvarInterpretationProps {
    clinvar: Clinvar | undefined;
}

@observer
class ClinvarInterpretation extends React.Component<
    IClinvarInterpretationProps
> {
    constructor(props: IClinvarInterpretationProps) {
        super(props);
        makeObservable(this);
    }

    @computed get clinvarTooltip() {
        const clinvarUrl = this.props.clinvar
            ? `https://www.ncbi.nlm.nih.gov/clinvar/variation/${this.props.clinvar.clinvarId}/`
            : `https://www.ncbi.nlm.nih.gov/clinvar/`;
        return (
            <DefaultTooltip
                placement="top"
                overlay={<span>ClinVar Interpretation</span>}
            >
                <a href={clinvarUrl} target="_blank" rel="noopener noreferrer">
                    ClinVar Interpretation
                </a>
            </DefaultTooltip>
        );
    }

    @computed get clinvarInterpretationContent() {
        const clinvarUrl = this.props.clinvar
            ? `https://www.ncbi.nlm.nih.gov/clinvar/variation/${this.props.clinvar.clinvarId}/`
            : `https://www.ncbi.nlm.nih.gov/clinvar/`;
        if (this.props.clinvar) {
            if (
                this.props.clinvar.clinicalSignificance &&
                this.props.clinvar.conflictingClinicalSignificance
            ) {
                return (
                    <div className={featureTableStyle['data-with-link']}>
                        <a
                            href={clinvarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={featureTableStyle['data-with-link']}
                        >
                            {`${this.props.clinvar.clinicalSignificance} (${this.props.clinvar.conflictingClinicalSignificance})`}
                        </a>
                    </div>
                );
            } else if (this.props.clinvar.clinicalSignificance) {
                return (
                    <div className={featureTableStyle['data-with-link']}>
                        <a
                            href={clinvarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={featureTableStyle['data-with-link']}
                        >
                            {this.props.clinvar.clinicalSignificance}
                        </a>
                    </div>
                );
            }
        }

        return <div>N/A</div>;
    }

    public render() {
        return (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    {this.clinvarTooltip}
                </div>
                {this.clinvarInterpretationContent}
            </div>
        );
    }
}

export default ClinvarInterpretation;
