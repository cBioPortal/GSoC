import { SimpleGetterLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { GenericAssayEnrichmentRow } from 'shared/model/EnrichmentRow';

export class GenericAssayEnrichmentsTableDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    GenericAssayEnrichmentRow
> {
    constructor(
        getData: () => GenericAssayEnrichmentRow[],
        getHighlighted: () => GenericAssayEnrichmentRow | undefined,
        public setHighlighted: (c: GenericAssayEnrichmentRow) => void
    ) {
        super(getData);
        this.dataHighlighter = (d: GenericAssayEnrichmentRow) => {
            const highlighted = getHighlighted();
            return !!(highlighted && d.stableId === highlighted.stableId);
        };
    }
}
