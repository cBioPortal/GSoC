import React, { Component } from 'react';
import { Radio } from 'react-bootstrap';
import { observer } from 'mobx-react';

export interface IGeneFilterSelection {
    currentSelection: GeneFilterOption;
    onOptionChanged?: (currentSelection: GeneFilterOption) => void;
}

export enum GeneFilterOption {
    ANY_SAMPLE = 'anySample',
    ALL_SAMPLES = 'allSamples',
}

@observer
export default class GeneFilterMenu extends React.Component<
    IGeneFilterSelection,
    {}
> {
    constructor(props: IGeneFilterSelection) {
        super(props);
    }

    private handleOptionChange(e: React.FormEvent<Radio>) {
        if (this.props.onOptionChanged) {
            const target = e.target as HTMLInputElement;
            this.props.onOptionChanged(target.value as GeneFilterOption);
        }
    }

    render() {
        return (
            <React.Fragment>
                <div>Different gene panels were used for the samples.</div>
                <div>Filter mutations for:</div>
                <Radio
                    value={GeneFilterOption.ANY_SAMPLE}
                    checked={
                        this.props.currentSelection ===
                        GeneFilterOption.ANY_SAMPLE
                    }
                    onChange={(e: React.FormEvent<Radio>) =>
                        this.handleOptionChange(e)
                    }
                >
                    Genes profiled in any sample
                </Radio>
                <Radio
                    value={GeneFilterOption.ALL_SAMPLES}
                    checked={
                        this.props.currentSelection ===
                        GeneFilterOption.ALL_SAMPLES
                    }
                    onChange={(e: React.FormEvent<Radio>) =>
                        this.handleOptionChange(e)
                    }
                >
                    Genes profiled in all samples
                </Radio>
            </React.Fragment>
        );
    }
}
