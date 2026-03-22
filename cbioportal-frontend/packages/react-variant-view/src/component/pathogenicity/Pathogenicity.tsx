import _ from 'lodash';
import * as React from 'react';

import { observer } from 'mobx-react';
import { Clinvar, SignalAnnotation } from 'genome-nexus-ts-api-client';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import Oncokb from './Oncokb';
import Penetrance from './Penetrance';
import MSKExpertReview from './MSKExpertReview';
import ClinvarInterpretation from './ClinvarInterpretation';

interface IPathogenicityProps {
    clinvar?: Clinvar;
    oncokb?: IndicatorQueryResp;
    signalAnnotation?: SignalAnnotation;
    isCanonicalTranscriptSelected: boolean;
}

@observer
class Pathogenicity extends React.Component<IPathogenicityProps> {
    public render() {
        return (
            <div>
                <Penetrance signalAnnotation={this.props.signalAnnotation} />
                <ClinvarInterpretation clinvar={this.props.clinvar} />
                <Oncokb
                    oncokb={this.props.oncokb}
                    isCanonicalTranscriptSelected={
                        this.props.isCanonicalTranscriptSelected
                    }
                />
                <MSKExpertReview
                    signalAnnotation={this.props.signalAnnotation}
                />
            </div>
        );
    }
}

export default Pathogenicity;
