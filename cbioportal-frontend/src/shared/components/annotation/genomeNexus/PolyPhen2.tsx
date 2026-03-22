import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import annotationStyles from './../styles/annotation.module.scss';
import classNames from 'classnames';
import tooltipStyles from './styles/polyPhen2Tooltip.module.scss';

export interface IPolyPhen2Props {
    polyPhenPrediction: string | undefined; // benign, possibly_damaging, probably_damging
    polyPhenScore: number | undefined;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

export default class PolyPhen2 extends React.Component<IPolyPhen2Props, {}> {
    static POLYPHEN2_URL: string = 'http://genetics.bwh.harvard.edu/pph2/';

    constructor(props: IPolyPhen2Props) {
        super(props);
        this.tooltipContent = this.tooltipContent.bind(this);
    }

    public render() {
        let content: JSX.Element = (
            <span className={`${annotationStyles['annotation-item-text']}`} />
        );

        if (
            this.props.polyPhenPrediction &&
            this.props.polyPhenPrediction.length > 0
        ) {
            content = (
                <span
                    className={classNames(
                        annotationStyles['annotation-item-text'],
                        (tooltipStyles as any)[
                            `polyPhen2-${this.props.polyPhenPrediction}`
                        ]
                    )}
                >
                    <i className="fa fa-circle" aria-hidden="true"></i>
                </span>
            );
            const arrowContent = <div className="rc-tooltip-arrow-inner" />;
            content = (
                <DefaultTooltip
                    overlay={this.tooltipContent}
                    placement="right"
                    trigger={['hover', 'focus']}
                    arrowContent={arrowContent}
                    onPopupAlign={hideArrow}
                    destroyTooltipOnHide={false}
                >
                    {content}
                </DefaultTooltip>
            );
        }

        return content;
    }

    private tooltipContent() {
        const impact = this.props.polyPhenPrediction ? (
            <div>
                <table className={tooltipStyles['polyPhen2-tooltip-table']}>
                    <tr>
                        <td>Source</td>
                        <td>
                            <a href="http://genetics.bwh.harvard.edu/pph2/">
                                PolyPhen-2
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td>Impact</td>
                        <td>
                            <span
                                className={
                                    (tooltipStyles as any)[
                                        `polyPhen2-${this.props.polyPhenPrediction}`
                                    ]
                                }
                            >
                                {this.props.polyPhenPrediction}
                            </span>
                        </td>
                    </tr>
                    {(this.props.polyPhenScore ||
                        this.props.polyPhenScore === 0) && (
                        <tr>
                            <td>Score</td>
                            <td>
                                <b>{this.props.polyPhenScore.toFixed(2)}</b>
                            </td>
                        </tr>
                    )}
                </table>
            </div>
        ) : null;

        return <span>{impact}</span>;
    }
}
