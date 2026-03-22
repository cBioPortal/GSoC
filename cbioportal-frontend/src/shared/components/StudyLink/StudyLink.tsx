import * as React from 'react';
import { CancerStudy } from 'cbioportal-ts-api-client';
import { Link } from 'react-router-dom';

export class StudyLink extends React.Component<
    {
        studyId: string;
        className?: string;
        studyName?: string;
    },
    {}
> {
    render() {
        return (
            <Link
                to={`/study?id=${this.props.studyId}`}
                className={this.props.className}
                aria-label={`Open the study summary page for ${this.props.studyName} in a new tab`}
            >
                {this.props.children}
            </Link>
        );
    }
}
