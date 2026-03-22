import { SimpleGetterLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';

export class EnrichmentsTableDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    any
> {
    constructor(
        getData: () => any[],
        getHighlighted: () => any | undefined,
        public setHighlighted: (c: any) => void
    ) {
        super(getData);
        this.dataHighlighter = (d: any) => {
            const highlighted = getHighlighted();
            return !!(
                highlighted && d.entrezGeneId === highlighted.entrezGeneId
            );
        };
    }
}
