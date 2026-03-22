import * as React from 'react';
import Icon from 'shared/components/cohort/LetterIcon';

export type MutSigProps = {
    qValue: number;
};

/**
 * MutSig Annotation Component.
 */
export default class MutSigAnnotation extends React.Component<MutSigProps> {
    public render() {
        let iconStyle = {
            cursor: 'default',
        };
        const tooltipCallback = () => this.getToolTip(this.props.qValue);
        return (
            <span style={iconStyle}>
                <Icon text="M" tooltip={tooltipCallback} />
            </span>
        );
    }

    /**
     * Gets the Tooltip Content.
     */
    private getToolTip(qValue: number) {
        return (
            <div>
                Candidate driver gene, as determined by the <b>MutSig</b>
                <br />
                algorithm.
                <p />
                MutSig identifies likely driver genes by evaluating the
                <br />
                frequency of observed mutations within the entire study.
                <p />
                Note that not all mutations in this gene are necessarily
                <br />
                functional/driver events.
                <p />
                <span> Q-value: {(qValue || 0).toExponential(3)}</span>
            </div>
        );
    }
}
