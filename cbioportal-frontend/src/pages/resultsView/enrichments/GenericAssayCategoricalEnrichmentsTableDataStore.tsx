import { SimpleGetterLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { GenericAssayCategoricalEnrichmentRow } from 'shared/model/EnrichmentRow';

export class GenericAssayCategoricalEnrichmentsTableDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    GenericAssayCategoricalEnrichmentRow
> {
    constructor(
        getData: () => GenericAssayCategoricalEnrichmentRow[],
        getHighlighted: () => GenericAssayCategoricalEnrichmentRow | undefined,
        public setHighlighted: (c: GenericAssayCategoricalEnrichmentRow) => void
    ) {
        super(getData);
        this.dataHighlighter = (d: GenericAssayCategoricalEnrichmentRow) => {
            const highlighted = getHighlighted();
            return !!(highlighted && d.stableId === highlighted.stableId);
        };
    }
}
