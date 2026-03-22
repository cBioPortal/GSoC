import { SimpleGetterLazyMobXTableApplicationDataStore } from '../../../shared/lib/ILazyMobXTableApplicationDataStore';
import { DiscreteCopyNumberData } from 'cbioportal-ts-api-client';
import { action, computed, observable, makeObservable } from 'mobx';
import _ from 'lodash';
import PatientViewUrlWrapper from '../PatientViewUrlWrapper';

function cnaMatch(d: DiscreteCopyNumberData[], id: DiscreteCopyNumberData) {
    return (
        d[0].entrezGeneId === id.entrezGeneId &&
        d[0].gene.hugoGeneSymbol === id.gene.hugoGeneSymbol
    );
}

function cnaIdKey(c: DiscreteCopyNumberData) {
    return `{ "entrezGeneId": "${c.entrezGeneId}", "hugoGeneSymbol": "${c.gene.hugoGeneSymbol}" }`;
}

type CnaIdKey = string;

export default class PatientViewCnaDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    DiscreteCopyNumberData[]
> {
    private selectedCnasMap = observable.map<string, DiscreteCopyNumberData>();

    @action
    public toggleSelectedCna(c: Readonly<DiscreteCopyNumberData>) {
        const key = cnaIdKey(c);
        if (this.selectedCnasMap.has(key)) {
            this.selectedCnasMap.delete(key);
        } else {
            this.selectedCnasMap.set(key, c);
        }
    }

    @action
    public setSelectedCna(cna: Readonly<DiscreteCopyNumberData[]>) {
        this.selectedCnasMap.clear();
        let count = 0;
        for (const c of cna) {
            this.toggleSelectedCna(c);
            count += 1;
        }
    }

    @computed public get selectedCna(): Readonly<DiscreteCopyNumberData[]> {
        return Array.from(this.selectedCnasMap.values());
    }

    public isCnaSelected(c: DiscreteCopyNumberData) {
        return this.selectedCnasMap.has(cnaIdKey(c));
    }

    constructor(
        getData: () => DiscreteCopyNumberData[][],
        private urlWrapper: PatientViewUrlWrapper
    ) {
        super(getData);

        makeObservable(this);

        this.dataHighlighter = (mergedCna: DiscreteCopyNumberData[]) => {
            const highlightedCnas = [];
            highlightedCnas.push(...this.selectedCna);
            return _.some(highlightedCnas, cna => cnaMatch(mergedCna, cna));
        };
    }
}
