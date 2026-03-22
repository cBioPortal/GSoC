import _ from 'lodash';
import * as React from 'react';

import { observer } from 'mobx-react';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import { computed, makeObservable } from 'mobx';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { SignalAnnotation } from 'genome-nexus-ts-api-client';
import { signalLogoInTable } from '../featureTable/SignalLogo';

interface IMSKExpertReviewProps {
    signalAnnotation?: SignalAnnotation;
}

@observer
class MSKExpertReview extends React.Component<IMSKExpertReviewProps> {
    constructor(props: IMSKExpertReviewProps) {
        super(props);
        makeObservable(this);
    }

    @computed get mskExpertReviewData() {
        let mskExpertReviewData: string = 'N/A';
        if (
            this.props.signalAnnotation &&
            this.props.signalAnnotation.annotation.length > 0
        ) {
            // only germline mutations have mskExperReview
            _.forEach(this.props.signalAnnotation.annotation, annotation => {
                if (annotation.mskExperReview !== undefined) {
                    mskExpertReviewData = _.upperFirst(
                        `${annotation.mskExperReview}`
                    );
                }
            });
        }
        return mskExpertReviewData;
    }

    public render() {
        return (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    <DefaultTooltip
                        placement="top"
                        overlay={
                            <span>
                                variant curated by MSK's clinical molecular
                                geneticists
                                <br />
                                in the clinical setting using the ACMG
                                guidelines
                            </span>
                        }
                    >
                        <span
                            className={
                                featureTableStyle['data-source-without-linkout']
                            }
                        >
                            MSK Expert Review
                        </span>
                    </DefaultTooltip>
                    {signalLogoInTable}
                </div>
                <div className={featureTableStyle['data-with-link']}>
                    {this.mskExpertReviewData}
                </div>
            </div>
        );
    }
}

export default MSKExpertReview;
