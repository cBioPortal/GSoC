import React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import annotationStyles from './../styles/annotation.module.scss';
import classNames from 'classnames';
import tooltipStyles from './styles/alphaMissenseTooltip.module.scss';

export interface IAlphaMissenseProps {
    alphaMissensePrediction: string | undefined; // benign, pathogenic, ambiguous
    alphaMissenseScore: number | undefined;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

export const AlphaMissenseUrl: string = 'https://alphamissense.hegelab.org/';

export const AlphaMissense: React.FC<IAlphaMissenseProps> = ({
    alphaMissensePrediction,
    alphaMissenseScore,
}) => {
    const tooltipContent = () => {
        const impact = alphaMissensePrediction ? (
            <div>
                <table className={tooltipStyles['alphaMissense-tooltip-table']}>
                    <tr>
                        <td>Source</td>
                        <td>
                            <a href={AlphaMissenseUrl}>AlphaMissense</a>
                        </td>
                    </tr>
                    <tr>
                        <td>Impact</td>
                        <td>
                            <span
                                className={
                                    (tooltipStyles as any)[
                                        `alphaMissense-${alphaMissensePrediction}`
                                    ]
                                }
                            >
                                {alphaMissensePrediction}
                            </span>
                        </td>
                    </tr>
                    {(alphaMissenseScore || alphaMissenseScore === 0) && (
                        <tr>
                            <td>Score</td>
                            <td>
                                <b>{alphaMissenseScore.toFixed(2)}</b>
                            </td>
                        </tr>
                    )}
                </table>
            </div>
        ) : null;

        return <span>{impact}</span>;
    };

    let content: JSX.Element = (
        <span className={`${annotationStyles['annotation-item-text']}`} />
    );

    if (alphaMissensePrediction && alphaMissensePrediction.length > 0) {
        content = (
            <span
                className={classNames(
                    annotationStyles['annotation-item-text'],
                    (tooltipStyles as any)[
                        `alphaMissense-${alphaMissensePrediction}`
                    ]
                )}
            >
                <i className="fa fa-circle" aria-hidden="true"></i>
            </span>
        );
        const arrowContent = <div className="rc-tooltip-arrow-inner" />;
        content = (
            <DefaultTooltip
                overlay={tooltipContent}
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
};
