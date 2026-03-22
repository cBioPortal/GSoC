import * as React from 'react';
import getOverlappingStudies from '../../lib/getOverlappingStudies';
import { CancerStudy } from 'cbioportal-ts-api-client';

export default class OverlappingStudiesWarning extends React.Component<
    { studies: CancerStudy[] },
    {}
> {
    render() {
        const overlapping = getOverlappingStudies(this.props.studies);
        if (overlapping.length > 0) {
            return (
                <div className="alert alert-danger" style={{ marginBottom: 0 }}>
                    <i className="fa fa-exclamation-triangle"></i> You have
                    selected multiple TCGA studies with overlapping samples,
                    highlighted in red below. Please limit your selection to one
                    TCGA study per cancer type.
                </div>
            );
        } else {
            return null;
        }
    }
}
