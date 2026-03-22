import { DefaultTooltip } from 'cbioportal-frontend-commons';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Table } from 'react-bootstrap';

import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import functionalImpactColor from '../featureTable/FunctionalImpactTooltip.module.scss';
import tooltipStyles from './SiftTooltip.module.scss';
import siftLogo from '../../image/siftFunnel.png';

// Most of this component comes from cBioPortal-frontend

export interface ISiftProps {
    siftPrediction: string | undefined; // deleterious, deleterious_low_confidence, tolerated, tolerated_low_confidence
    siftScore: number | undefined;
}

@observer
export default class Sift extends React.Component<ISiftProps, {}> {
    private static SIFT_URL: string = 'http://sift.bii.a-star.edu.sg/';

    private static siftText() {
        return (
            <div style={{ width: 450, height: 88 }}>
                <a
                    href={Sift.SIFT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    SIFT
                </a>{' '}
                predicts whether an amino acid substitution affects protein
                function based on sequence homology and the physical properties
                of amino acids. SIFT can be applied to naturally occurring
                nonsynonymous polymorphisms and laboratory-induced missense
                mutations.
            </div>
        );
    }

    private static siftTooltipTable() {
        return (
            <div>
                <Table striped={true} bordered={true} hover={true} sizes="sm">
                    <thead>
                        <tr>
                            <th>Legend</th>
                            <th>
                                <span
                                    style={{ display: 'inline-block' }}
                                    title="SIFT"
                                >
                                    <img
                                        height={14}
                                        src={siftLogo}
                                        alt="SIFT"
                                    />
                                    &nbsp;Qualitative prediction
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                <span>
                                    <i
                                        className={classNames(
                                            functionalImpactColor.high,
                                            'fa fa-circle'
                                        )}
                                        aria-hidden="true"
                                    />
                                </span>
                            </td>
                            <td>
                                <b>deleterious</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span>
                                    <i
                                        className={classNames(
                                            functionalImpactColor.low,
                                            'fa fa-circle'
                                        )}
                                        aria-hidden="true"
                                    />
                                </span>
                            </td>
                            <td>
                                <b>deleterious_low_confidence</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span>
                                    <i
                                        className={classNames(
                                            functionalImpactColor.neutral,
                                            'fa fa-circle'
                                        )}
                                        aria-hidden="true"
                                    />
                                </span>
                            </td>
                            <td>
                                <b>tolerated_low_confidence</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span>
                                    <i
                                        className={classNames(
                                            functionalImpactColor.neutral,
                                            'fa fa-circle'
                                        )}
                                        aria-hidden="true"
                                    />
                                </span>
                            </td>
                            <td>
                                <b>tolerated</b>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </div>
        );
    }

    constructor(props: ISiftProps) {
        super(props);
        this.siftData = this.siftData.bind(this);
    }

    public render() {
        let siftContent: JSX.Element = <span />;
        const dataSource = (
            <>
                SIFT&nbsp;
                <i className="fas fa-external-link-alt" />
            </>
        );

        if (this.props.siftPrediction && this.props.siftPrediction.length > 0) {
            siftContent = <span>{this.props.siftPrediction}</span>;
        } else {
            siftContent = <span>N/A</span>;
        }

        return (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    {this.siftTooltip(
                        <a
                            href={Sift.SIFT_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {dataSource}
                        </a>
                    )}
                </div>
                <div>
                    {this.siftTooltip(
                        <span className={featureTableStyle['data-with-link']}>
                            <a
                                href={Sift.SIFT_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {siftContent}
                            </a>
                        </span>
                    )}
                </div>
            </div>
        );
    }

    private siftData() {
        const impact = this.props.siftPrediction ? (
            <div>
                <table className={tooltipStyles['sift-tooltip-table']}>
                    {(this.props.siftScore || this.props.siftScore === 0) && (
                        <tbody>
                            <tr>
                                <td>Score</td>
                                <td>
                                    <b>{this.props.siftScore.toFixed(2)}</b>
                                </td>
                            </tr>
                        </tbody>
                    )}
                </table>
                <span>
                    Please refer to the score range{' '}
                    <a
                        href="https://useast.ensembl.org/info/genome/variation/prediction/protein_function.html"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        here
                    </a>
                    .
                </span>
            </div>
        ) : null;

        return (
            <div>
                {impact}
                <br />
            </div>
        );
    }

    private siftTooltip(tooltipTrigger: JSX.Element) {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <div>
                        {Sift.siftText()}
                        {this.siftData()}
                        {Sift.siftTooltipTable()}
                    </div>
                }
            >
                {tooltipTrigger}
            </DefaultTooltip>
        );
    }
}
