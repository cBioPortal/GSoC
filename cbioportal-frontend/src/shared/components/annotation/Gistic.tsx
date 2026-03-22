import * as React from 'react';
import Icon from 'shared/components/cohort/LetterIcon';
import { If, Then, Else } from 'react-if';

export type GisticProps = {
    qValue: number;
    peakGeneCount?: number;
};

/**
 * GISTIC Annotation Component.
 */
export default class GisticAnnotation extends React.Component<GisticProps> {
    public render() {
        const tooltipCallback = () =>
            this.getToolTip(this.props.qValue, this.props.peakGeneCount);
        let iconStyle = {
            cursor: 'default',
        };
        return (
            <span style={iconStyle}>
                <Icon text="G" tooltip={tooltipCallback} />
            </span>
        );
    }

    private getToolTip(qValue: number, peakGeneCount = 0) {
        return (
            <div>
                Candidate driver gene, as determined by the <b>GISTIC</b>
                <br />
                algorithm.
                <p />
                The GISTIC algorithm identifies likely driver copy number
                <br />
                alterations by evaluating the frequency and amplitude of
                <br />
                observed CNA events within the entire study.
                <p />
                <span> Q-value: {(qValue || 0).toExponential(3)}</span>
                <If condition={peakGeneCount > 0}>
                    <Then>
                        <br />
                        <span>
                            {' '}
                            Number of genes in the peak: {peakGeneCount}
                        </span>
                    </Then>
                </If>
            </div>
        );
    }
}
