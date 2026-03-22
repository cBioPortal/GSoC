import * as React from 'react';
import annotationStyles from './../styles/annotation.module.scss';
import classNames from 'classnames';
import tooltipStyles from './styles/mutationAssessorTooltip.module.scss';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { MutationAssessor as MutationAssessorData } from 'genome-nexus-ts-api-client';
import mutationAssessorColumn from './styles/mutationAssessorColumn.module.scss';

export interface IMutationAssessorProps {
    mutationAssessor: MutationAssessorData | undefined;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

export default class MutationAssessor extends React.Component<
    IMutationAssessorProps,
    {}
> {
    // TODO Replace to new url when manuscript is available
    // static MUTATION_ASSESSOR_URL: string = 'http://mutationassessor.org/r3/';

    constructor(props: IMutationAssessorProps) {
        super(props);

        this.tooltipContent = this.tooltipContent.bind(this);
    }

    public render() {
        let maContent: JSX.Element = (
            <span className={`${annotationStyles['annotation-item-text']}`} />
        );

        if (
            this.props.mutationAssessor &&
            this.props.mutationAssessor.functionalImpactPrediction !== null
        ) {
            const maData = this.props.mutationAssessor;
            maContent = (
                <span
                    data-test="mutation-assessor-dot"
                    className={classNames(
                        annotationStyles['annotation-item-text'],
                        (mutationAssessorColumn as any)[
                            `ma-${maData.functionalImpactPrediction}`
                        ]
                    )}
                >
                    <i className="fa fa-circle" aria-hidden="true"></i>
                </span>
            );
            const arrowContent = <div className="rc-tooltip-arrow-inner" />;
            maContent = (
                <DefaultTooltip
                    overlay={this.tooltipContent}
                    placement="right"
                    trigger={['hover', 'focus']}
                    arrowContent={arrowContent}
                    onPopupAlign={hideArrow}
                    destroyTooltipOnHide={false}
                >
                    {maContent}
                </DefaultTooltip>
            );
        }

        return maContent;
    }

    private tooltipContent() {
        if (this.props.mutationAssessor) {
            const maData = this.props.mutationAssessor;
            const impact = maData.functionalImpactPrediction ? (
                <div>
                    <table className={tooltipStyles['ma-tooltip-table']}>
                        <tr>
                            <td>Source</td>
                            <td>
                                {/* TODO Add link when manuscript is available */}
                                Mutation Assessor
                            </td>
                        </tr>
                        <tr>
                            <td>Impact</td>
                            <td>
                                <span
                                    className={
                                        (mutationAssessorColumn as any)[
                                            `ma-${maData.functionalImpactPrediction}`
                                        ]
                                    }
                                >
                                    {maData.functionalImpactPrediction}
                                </span>
                            </td>
                        </tr>
                        {(maData.functionalImpactScore ||
                            maData.functionalImpactScore === 0) && (
                            <tr>
                                <td>Score</td>
                                <td>
                                    <b>
                                        {maData.functionalImpactScore.toFixed(
                                            2
                                        )}
                                    </b>
                                </td>
                            </tr>
                        )}
                        {maData.msa && (
                            <tr>
                                <td>Multiple sequence alignment file: </td>
                                <td>
                                    <a
                                        href={`https://projects.sanderlab.org/av/?url=https://genome-nexus-static-data.s3.us-east-1.amazonaws.com/mutationassessor-v4-multiple-sequence-alignment-files-uncompressed/${maData.msa}.fa`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View
                                    </a>
                                    {' | '}
                                    <a
                                        href={`https://genome-nexus-static-data.s3.us-east-1.amazonaws.com/mutationassessor-v4-multiple-sequence-alignment-files-uncompressed/${maData.msa}.fa`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Download
                                    </a>
                                </td>
                            </tr>
                        )}
                    </table>
                </div>
            ) : null;

            return impact;
        }
    }
}
