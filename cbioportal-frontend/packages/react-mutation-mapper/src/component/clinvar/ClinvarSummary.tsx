import { DefaultTooltip, TruncatedText } from 'cbioportal-frontend-commons';
import { Clinvar } from 'genome-nexus-ts-api-client';
import _ from 'lodash';
import * as React from 'react';

export type ClinvarSummaryProps = {
    clinvar?: Clinvar;
};

const NoClinvarData = () => {
    return (
        <DefaultTooltip
            placement="topLeft"
            overlay={<span>Variant has no ClinVar data.</span>}
        >
            <span
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'block',
                    overflow: 'hidden',
                }}
            >
                &nbsp;
            </span>
        </DefaultTooltip>
    );
};

const ClinvarSummary = (props: ClinvarSummaryProps) => {
    if (!props.clinvar) {
        return <NoClinvarData />;
    } else {
        const clinvarId = props.clinvar.clinvarId;
        const clinvarLink = `https://www.ncbi.nlm.nih.gov/clinvar/variation/${clinvarId}/`;
        const clinicalSignificance = props.clinvar.clinicalSignificance;
        const conflictingClinicalSignificance =
            props.clinvar.conflictingClinicalSignificance;
        return (
            <TruncatedText
                maxLength={30}
                text={clinicalSignificance}
                addTooltip="always"
                tooltip={
                    <div style={{ maxWidth: 300 }}>
                        <div>{clinicalSignificance}</div>
                        {conflictingClinicalSignificance && (
                            <div>{conflictingClinicalSignificance}</div>
                        )}
                        <div>
                            (ClinVar ID:{' '}
                            <a href={clinvarLink} target="_blank">
                                {clinvarId}
                            </a>
                            )
                        </div>
                    </div>
                }
            />
        );
    }
};

export default ClinvarSummary;
