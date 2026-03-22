import React from 'react';
import { ClinicalDataBySampleId } from 'cbioportal-ts-api-client';
import SampleInline from 'pages/patientView/patientHeader/SampleInline';

const color = '#cccccc';
const fillOpacity = 1;

export interface ISampleLabelNotProfiledProps {
    sample: ClinicalDataBySampleId;
    onSelectGenePanel?: (name: string) => void;
    disableTooltip?: boolean;
}

export default class SampleLabelNotProfiled extends React.Component<
    ISampleLabelNotProfiledProps,
    {}
> {
    public render() {
        return (
            <SampleInline
                sample={this.props.sample}
                extraTooltipText={
                    'This gene was not profiled for this sample (absent from gene panel). It is unknown whether it is mutated.'
                }
                onSelectGenePanel={this.props.onSelectGenePanel}
                disableTooltip={this.props.disableTooltip}
            >
                <svg width="12" height="12" data-test="not-profiled-icon">
                    <g transform="translate(0,5)">
                        <rect
                            width="12"
                            height="2.5"
                            rx="1.25"
                            ry="1.25"
                            fill={color}
                            fillOpacity={fillOpacity}
                        />
                    </g>
                </svg>
            </SampleInline>
        );
    }
}
