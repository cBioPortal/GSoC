import { VariantAnnotationSummary } from 'genome-nexus-ts-api-client';
import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import {
    MutationMapper as ReactMutationMapper,
    MutationMapperProps,
} from 'react-mutation-mapper';

interface IVariantViewMutationMapperProps extends MutationMapperProps {
    variantData?: VariantAnnotationSummary | undefined;
    onInit?: (mutationMapper: VariantViewMutationMapper) => void;
}

@observer
class VariantViewMutationMapper extends ReactMutationMapper<
    IVariantViewMutationMapperProps
> {
    constructor(props: any) {
        super(props);

        makeObservable<VariantViewMutationMapper, 'geneWidth'>(this);
    }

    protected get mutationTableComponent() {
        return null;
    }

    @computed
    protected get geneWidth() {
        if (this.lollipopPlotGeneX) {
            if (this.windowWrapper.size.width >= 1391) {
                return 1220;
            } else {
                return (
                    this.windowWrapper.size.width * 0.93 -
                    this.lollipopPlotGeneX
                );
            }
        } else {
            return 640;
        }
    }
}

export default VariantViewMutationMapper;
