import * as React from 'react';
import { observable, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import ReactSelect from 'react-select1';

export type validPercentile = 50 | 75 | 100;

interface GenesetsHierarchyFilterFormProps {
    percentile: validPercentile;
    pvalueThreshold: number;
    scoreThreshold: number;
    onApply: (
        percentile: validPercentile,
        pvalueThreshold: number,
        scoreThreshold: number
    ) => void;
}

@observer
export default class GenesetsHierarchyFilterForm extends React.Component<
    GenesetsHierarchyFilterFormProps,
    {}
> {
    @observable percentile = this.props.percentile;
    @observable pvalueThreshold = String(this.props.pvalueThreshold);
    @observable scoreThreshold = String(this.props.scoreThreshold);
    readonly percentileOptions = [
        { label: '50%', value: 50 },
        { label: '75%', value: 75 },
        { label: '100%', value: 100 },
    ];
    constructor(props: GenesetsHierarchyFilterFormProps) {
        super(props);
        makeObservable(this);
        this.percentileChange = this.percentileChange.bind(this);
        this.applyFilter = this.applyFilter.bind(this);
    }

    percentileChange(val: { label: string; value: validPercentile } | null) {
        this.percentile = val ? val.value : 75;
    }

    applyFilter() {
        const pvalueThreshold = this.pvalueThreshold
            ? Number(this.pvalueThreshold)
            : NaN;
        const scoreThreshold = this.scoreThreshold
            ? Number(this.scoreThreshold)
            : NaN;
        if (!Number.isNaN(pvalueThreshold) && !Number.isNaN(scoreThreshold)) {
            this.props.onApply(
                this.percentile,
                pvalueThreshold,
                scoreThreshold
            );
        }
    }

    render() {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                    width: '100%',
                    background: '#eee',
                    padding: '10px 10px',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label htmlFor="GSVAScore">GSVA score</label>
                    <input
                        id="GSVAScore"
                        type="string"
                        value={this.scoreThreshold}
                        style={{ width: 160, height: 36, padding: 10 }}
                        onChange={event =>
                            (this.scoreThreshold = event.target.value)
                        }
                        step="0.1"
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label htmlFor="Pvalue">P-value</label>
                    <input
                        id="Pvalue"
                        type="string"
                        value={this.pvalueThreshold}
                        style={{ width: 160, height: 36, padding: 10 }}
                        onChange={event =>
                            (this.pvalueThreshold = event.target.value)
                        }
                        step="0.01"
                        min="0"
                    />
                </div>
                <div>
                    <label htmlFor="PercentileScoreCalculation">
                        Percentile for score calculation
                    </label>
                    <ReactSelect
                        addLabelText="Percentile for score calculation"
                        style={{ width: 160, borderRadius: '2px' }}
                        clearable={false}
                        name="PercentileScoreCalculation"
                        value={this.percentile}
                        options={this.percentileOptions}
                        onChange={this.percentileChange}
                    />
                </div>
                <div>
                    <button
                        id="filterButton"
                        className="btn btn-primary btn-sm"
                        style={{ padding: '20px 18px' }}
                        onClick={this.applyFilter}
                    >
                        Apply Filter
                    </button>
                </div>
            </div>
        );
    }
}
