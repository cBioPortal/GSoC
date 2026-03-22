import autobind from 'autobind-decorator';
import { MobxPromise } from 'cbioportal-frontend-commons';
import {
    defaultHotspotFilter,
    IHotspotIndex,
    IOncoKbData,
    isHotspot,
    Mutation,
} from 'cbioportal-utils';

import { HotspotFilter } from '../filter/HotspotFilter';
import { MutationFilter } from '../filter/MutationFilter';
import { MutationStatusFilter } from '../filter/MutationStatusFilter';
import { OncoKbFilter } from '../filter/OncoKbFilter';
import { PositionFilter } from '../filter/PositionFilter';
import { ProteinImpactTypeFilter } from '../filter/ProteinImpactTypeFilter';
import { DataFilter, DataFilterType } from '../model/DataFilter';
import { ApplyFilterFn, FilterApplier } from '../model/FilterApplier';
import {
    applyDefaultMutationFilter,
    applyDefaultMutationStatusFilter,
    applyDefaultPositionFilter,
    applyDefaultProteinChangeFilter,
    applyDefaultProteinImpactTypeFilter,
} from '../util/FilterUtils';
import { defaultOncoKbFilter } from 'oncokb-frontend-commons';
import { ProteinChangeFilter } from '../filter/ProteinChangeFilter';

export class DefaultMutationMapperFilterApplier implements FilterApplier {
    protected get customFilterAppliers(): {
        [filterType: string]: ApplyFilterFn;
    } {
        return {
            [DataFilterType.POSITION]: this.applyPositionFilter,
            [DataFilterType.ONCOKB]: this.applyOncoKbFilter,
            [DataFilterType.HOTSPOT]: this.applyHostpotFilter,
            [DataFilterType.MUTATION]: this.applyMutationFilter,
            [DataFilterType.PROTEIN_IMPACT_TYPE]: this
                .applyProteinImpactTypeFilter,
            [DataFilterType.MUTATION_STATUS]: this.applyMutationStatusFilter,
            [DataFilterType.PROTEIN_CHANGE]: this.applyProteinChangeFilter,
            ...this.filterAppliersOverride,
        };
    }

    constructor(
        protected indexedHotspotData: MobxPromise<IHotspotIndex | undefined>,
        protected oncoKbData: MobxPromise<IOncoKbData | Error>,
        protected getDefaultTumorType: (mutation: Mutation) => string,
        protected getDefaultEntrezGeneId: (mutation: Mutation) => number,
        protected filterAppliersOverride?: {
            [filterType: string]: ApplyFilterFn;
        }
    ) {}

    @autobind
    public applyFilter(filter: DataFilter, mutation: Mutation) {
        const applyFilter = this.customFilterAppliers[filter.type];

        return !applyFilter || applyFilter(filter, mutation);
    }

    @autobind
    protected applyMutationFilter(filter: MutationFilter, mutation: Mutation) {
        return applyDefaultMutationFilter(filter, mutation);
    }

    @autobind
    protected applyOncoKbFilter(filter: OncoKbFilter, mutation: Mutation) {
        // TODO for now ignoring the actual filter value and treating as a boolean
        return (
            !filter.values ||
            !this.oncoKbData.result ||
            this.oncoKbData.result instanceof Error ||
            defaultOncoKbFilter(
                mutation,
                this.oncoKbData.result,
                this.getDefaultTumorType,
                this.getDefaultEntrezGeneId
            )
        );
    }

    @autobind
    protected applyHostpotFilter(filter: HotspotFilter, mutation: Mutation) {
        // TODO for now ignoring the actual filter value and treating as a boolean
        return (
            !filter.values ||
            !this.indexedHotspotData.result ||
            isHotspot(
                mutation,
                this.indexedHotspotData.result,
                defaultHotspotFilter
            )
        );
    }

    @autobind
    protected applyPositionFilter(filter: PositionFilter, mutation: Mutation) {
        return applyDefaultPositionFilter(filter, mutation);
    }

    @autobind
    protected applyProteinImpactTypeFilter(
        filter: ProteinImpactTypeFilter,
        mutation: Mutation
    ) {
        return applyDefaultProteinImpactTypeFilter(filter, mutation);
    }

    @autobind
    protected applyMutationStatusFilter(
        filter: MutationStatusFilter,
        mutation: Mutation
    ) {
        return applyDefaultMutationStatusFilter(filter, mutation);
    }

    @autobind
    protected applyProteinChangeFilter(
        filter: ProteinChangeFilter,
        mutation: Mutation
    ) {
        return applyDefaultProteinChangeFilter(filter, mutation);
    }
}

export default DefaultMutationMapperFilterApplier;
