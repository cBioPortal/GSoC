import * as React from 'react';
import { ObservableMap, observable, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import GenesetsJsTree from './GenesetsJsTree';
import GenesetsHierarchyFilterForm, {
    validPercentile,
} from './GenesetsHierarchyFilterForm';
import { getServerConfig } from 'config/config';
import { SampleList } from 'cbioportal-ts-api-client';

export interface GenesetsHierarchySelectorProps {
    initialSelection: string[];
    gsvaProfile: string;
    sampleList: SampleList | undefined;
    onSelect: (map_geneSet_selected: ObservableMap<string, boolean>) => void;
}

@observer
export default class GenesetsHierarchySelector extends React.Component<
    GenesetsHierarchySelectorProps,
    {}
> {
    @observable percentile: validPercentile = 75;
    @observable pvalueThreshold = getServerConfig()
        .skin_geneset_hierarchy_default_p_value;
    @observable scoreThreshold = getServerConfig()
        .skin_geneset_hierarchy_default_gsva_score;
    @observable searchValue = '';

    constructor(props: GenesetsHierarchySelectorProps) {
        super(props);
        makeObservable(this);
        this.updateSelectionParameters = this.updateSelectionParameters.bind(
            this
        );
    }

    updateSelectionParameters(
        percentile: validPercentile,
        pvalueThreshold: number,
        scoreThreshold: number
    ) {
        this.percentile = percentile;
        this.pvalueThreshold = pvalueThreshold;
        this.scoreThreshold = scoreThreshold;
    }

    render() {
        return (
            <div>
                <div style={{ marginBottom: 15 }}>
                    <text>
                        Selected sample set:{' '}
                        <i>
                            {this.props.sampleList?.name} (
                            {this.props.sampleList?.sampleCount})
                        </i>
                    </text>
                    <br />
                    <text>
                        The outcome of score-based selection depends on the
                        geneset scores of samples included in the analysis.
                    </text>
                </div>
                <text>Search hierarchy</text>
                <div
                    className={`form-group has-feedback input-group-sm`}
                    style={{ display: 'inline-block' }}
                >
                    <input
                        type="text"
                        id="geneset-hierarchy-search"
                        className="form-control tableSearchInput"
                        style={{ width: 768 }}
                        value={this.searchValue}
                        onChange={event =>
                            (this.searchValue = event.target.value)
                        }
                    />
                    <span
                        className="fa fa-search form-control-feedback"
                        aria-hidden="true"
                    ></span>
                </div>
                <GenesetsHierarchyFilterForm
                    percentile={this.percentile}
                    pvalueThreshold={this.pvalueThreshold}
                    scoreThreshold={this.scoreThreshold}
                    onApply={this.updateSelectionParameters}
                />
                <GenesetsJsTree
                    initialSelection={this.props.initialSelection}
                    scoreThreshold={this.scoreThreshold}
                    pvalueThreshold={this.pvalueThreshold}
                    percentile={this.percentile}
                    gsvaProfile={this.props.gsvaProfile}
                    sampleListId={this.props.sampleList?.sampleListId}
                    searchValue={this.searchValue}
                    onSelect={this.props.onSelect}
                />
            </div>
        );
    }
}
