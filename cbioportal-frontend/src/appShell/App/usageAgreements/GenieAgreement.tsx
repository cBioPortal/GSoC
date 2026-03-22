import React from 'react';
import UsageAgreement from 'shared/components/UsageAgreement';
import expiredStorage from 'expired-storage';
import { getServerConfig } from 'config/config';

export const GENIE_PERSISTENCE_KEY = 'genie-private-usage-agreement';

export function shouldShowGenieWarning() {
    // we want to show a warning message on private cbioportal instances
    // to prevent users from adding links in manuscripts
    const showGenieWarning = ['cbioportal-genie-private'].includes(
        getServerConfig().app_name!
    );

    return (
        showGenieWarning &&
        new expiredStorage().getItem(GENIE_PERSISTENCE_KEY) !== 'true'
    );
}

export const GenieAgreement: React.FunctionComponent<{}> = function({}) {
    return (
        <UsageAgreement
            useCheckboxes={false}
            alertMessage={
                <>
                    <span style={{ color: 'red' }}> Caution:</span>
                    &nbsp;Caveats of AACR Project GENIE BPC data and
                    considerations for its use
                </>
            }
            expirationInDays={90}
            persistenceKey={GENIE_PERSISTENCE_KEY}
            clauses={[
                <>
                    Data visualizations within cBioPortal the GENIE-BPC data are
                    provided to help users understand how genomic markers relate
                    to clinical outcomes and should be used for descriptive
                    analyses and hypothesis generation only.
                </>,
                <>
                    Cohort entry is based on many factors, including NGS
                    profiling in specific years. These selection criteria could
                    affect the ability to generalize to the entirety of patients
                    with the specific cancer type. Genomic profiling is not
                    always performed at diagnosis and therefore may lead to
                    several forms of bias, including immortal time bias.
                </>,
                <>
                    Investigators who wish to test specific hypotheses should
                    work with a statistician to perform analyses that account
                    for limitations of observational data. Failure to do so may
                    result in incorrect inferences.
                </>,
            ]}
        />
    );
};
