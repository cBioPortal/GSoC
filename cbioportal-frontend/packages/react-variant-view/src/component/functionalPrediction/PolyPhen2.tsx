import { DefaultTooltip } from 'cbioportal-frontend-commons';
import classNames from 'classnames';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Table } from 'react-bootstrap';

import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import functionalImpactColor from '../featureTable/FunctionalImpactTooltip.module.scss';
import tooltipStyles from './PolyPhen2Tooltip.module.scss';
import polyPhen2Logo from '../../image/polyPhen-2.png';

// Most of this component comes from cBioPortal-frontend

export interface IPolyPhen2Props {
    polyPhenPrediction: string | undefined; // benign, possibly_damaging, probably_damging
    polyPhenScore: number | undefined;
}

@observer
export default class PolyPhen2 extends React.Component<IPolyPhen2Props, {}> {
    private static POLYPHEN2_URL: string =
        'http://genetics.bwh.harvard.edu/pph2/';

    private static polyPhenText() {
        return (
            <div style={{ width: 450, height: 77 }}>
                <a
                    href={PolyPhen2.POLYPHEN2_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    PolyPhen-2
                </a>{' '}
                (Polymorphism Phenotyping v2) is a tool which predicts possible
                impact of an amino acid substitution on the structure and
                function of a human protein using straightforward physical and
                comparative considerations.
            </div>
        );
    }

    private static polyPhenTooltipTable() {
        return (
            <div>
                <Table striped={true} bordered={true} hover={true} sizes="sm">
                    <thead>
                        <tr>
                            <th>Legend</th>
                            <th>
                                <span
                                    style={{ display: 'inline-block' }}
                                    title="PolyPhen-2"
                                >
                                    <img
                                        height={14}
                                        src={polyPhen2Logo}
                                        alt="PolyPhen-2"
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
                                <b>probably_damaging</b>
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
                                <b>possibly_damaging</b>
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
                                <b>benign</b>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <span>
                                    <i
                                        className={classNames(
                                            functionalImpactColor.unknown
                                        )}
                                        aria-hidden="true"
                                    />
                                </span>
                            </td>
                            <td>
                                <b>-</b>
                            </td>
                        </tr>
                    </tbody>
                </Table>
            </div>
        );
    }

    constructor(props: IPolyPhen2Props) {
        super(props);
        this.polyPhenData = this.polyPhenData.bind(this);
    }

    public render() {
        let polyPhen2content: JSX.Element = <span />;

        const dataSource = (
            <>
                PolyPhen-2&nbsp;
                <i className="fas fa-external-link-alt" />
            </>
        );

        if (
            this.props.polyPhenPrediction &&
            this.props.polyPhenPrediction.length > 0
        ) {
            polyPhen2content = <span>{this.props.polyPhenPrediction}</span>;
        } else {
            polyPhen2content = <span>N/A</span>;
        }

        return (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    {this.polyPhenTooltip(
                        <a
                            href={PolyPhen2.POLYPHEN2_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {dataSource}
                        </a>
                    )}
                </div>
                <div>
                    {this.polyPhenTooltip(
                        <span className={featureTableStyle['data-with-link']}>
                            <a
                                href={PolyPhen2.POLYPHEN2_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {polyPhen2content}
                            </a>
                        </span>
                    )}
                </div>
            </div>
        );
    }

    private polyPhenData() {
        const impact = this.props.polyPhenPrediction ? (
            <div>
                <table className={tooltipStyles['polyPhen2-tooltip-table']}>
                    {(this.props.polyPhenScore ||
                        this.props.polyPhenScore === 0) && (
                        <tbody>
                            <tr>
                                <td>Score</td>
                                <td>
                                    <b>{this.props.polyPhenScore.toFixed(2)}</b>
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

    private polyPhenTooltip(tooltipTrigger: JSX.Element) {
        return (
            <DefaultTooltip
                placement="top"
                overlay={
                    <div>
                        {PolyPhen2.polyPhenText()}
                        {this.polyPhenData()}
                        {PolyPhen2.polyPhenTooltipTable()}
                    </div>
                }
            >
                {tooltipTrigger}
            </DefaultTooltip>
        );
    }
}
