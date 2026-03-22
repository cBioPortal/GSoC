import { ProteinImpactType } from 'cbioportal-frontend-commons';
import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import { IProteinImpactTypeColors } from '../../model/ProteinImpact';
import { DEFAULT_PROTEIN_IMPACT_TYPE_COLORS } from '../../util/MutationTypeUtils';
import DropdownSelector, { DropdownSelectorProps } from './DropdownSelector';
import {
    getProteinImpactTypeColorMap,
    getProteinImpactTypeOptionDisplayValueMap,
} from './ProteinImpactTypeHelper';

export type ProteinImpactTypeDropdownSelectorProps = DropdownSelectorProps & {
    colors: IProteinImpactTypeColors;
};

@observer
export class ProteinImpactTypeDropdownSelector extends React.Component<
    ProteinImpactTypeDropdownSelectorProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps: Partial<
        ProteinImpactTypeDropdownSelectorProps
    > = {
        colors: DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
    };

    @computed
    protected get optionDisplayValueMap() {
        return getProteinImpactTypeOptionDisplayValueMap(
            this.proteinImpactTypeColors
        );
    }

    @computed
    protected get proteinImpactTypeColors() {
        return getProteinImpactTypeColorMap(this.props.colors);
    }

    @computed
    protected get options() {
        return Object.values(ProteinImpactType).map(value => ({
            value,
            label: this.optionDisplayValueMap[value],
        }));
    }

    public render() {
        return (
            <DropdownSelector
                name="proteinImpactTypeFilter"
                placeholder="Protein Impact"
                showControls={true}
                options={this.options}
                {...this.props}
            />
        );
    }
}

export default ProteinImpactTypeDropdownSelector;
