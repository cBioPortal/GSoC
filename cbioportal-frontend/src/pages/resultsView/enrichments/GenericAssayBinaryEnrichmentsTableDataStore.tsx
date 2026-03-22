import { SimpleGetterLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { GenericAssayBinaryEnrichmentRow } from 'shared/model/EnrichmentRow';

export class GenericAssayBinaryEnrichmentsTableDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    GenericAssayBinaryEnrichmentRow
> {
    constructor(
        getData: () => GenericAssayBinaryEnrichmentRow[],
        getHighlighted: () => GenericAssayBinaryEnrichmentRow | undefined,
        public setHighlighted: (c: GenericAssayBinaryEnrichmentRow) => void
    ) {
        super(getData);
        this.dataHighlighter = (d: GenericAssayBinaryEnrichmentRow) => {
            const highlighted = getHighlighted();
            return !!(highlighted && d.stableId === highlighted.stableId);
        };
    }
}
