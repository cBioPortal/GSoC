import { SimpleLazyMobXTableApplicationDataStore } from '../../../shared/lib/ILazyMobXTableApplicationDataStore';
import { IPdbChain } from '../../../shared/model/Pdb';
import { action, computed, observable, makeObservable } from 'mobx';
export default class PdbChainDataStore extends SimpleLazyMobXTableApplicationDataStore<
    IPdbChain
> {
    @observable.ref public selectedUid: string;

    public getChainUid(chain: IPdbChain) {
        return chain.pdbId + chain.chain;
    }

    @action public selectUid(uid?: string) {
        this.selectedUid = uid || '';
    }

    @computed public get selectedChain() {
        return this.getPdbChain(this.selectedUid);
    }

    @action public selectFirstChain() {
        if (this.allData.length > 0) {
            this.selectedUid = this.getChainUid(this.allData[0]);
        } else {
            this.selectedUid = '';
        }
    }

    public getPdbChain(chainUid: string) {
        return this.allData.find(c => this.getChainUid(c) === chainUid);
    }

    protected getTableData = () => {
        return this.sortedFilteredData;
    };

    constructor(data: IPdbChain[]) {
        super(data);
        makeObservable(this);
        this.selectedUid = '';
        this.dataSelector = (d: IPdbChain) =>
            this.getChainUid(d) === this.selectedUid;
        this.dataHighlighter = this.dataSelector;
    }
}
