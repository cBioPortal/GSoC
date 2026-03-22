import { SimpleGetterLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { IMutationalSignatureRow } from 'pages/patientView/clinicalInformation/ClinicalInformationMutationalSignatureTable';
import { action, computed, makeObservable, observable } from 'mobx';

function mutSigMatch(d: IMutationalSignatureRow, id: IMutationalSignatureRow) {
    return d.name === id.name;
}

function mutSigIdKey(c: IMutationalSignatureRow) {
    return `{ "name": "${c.name}" }`;
}

export class MutationalSignatureTableDataStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    IMutationalSignatureRow
> {
    private selectedMutSigMap = observable.map<
        string,
        IMutationalSignatureRow
    >();

    @action
    public toggleSelectedMutSig(c: Readonly<IMutationalSignatureRow>) {
        const key = mutSigIdKey(c);
        if (this.selectedMutSigMap.has(key)) {
            this.selectedMutSigMap.delete(key);
        } else {
            this.selectedMutSigMap.set(key, c);
        }
    }
    @computed public get selectedMutSig(): Readonly<IMutationalSignatureRow[]> {
        return Array.from(this.selectedMutSigMap.values());
    }
    @action
    public setSelectedMutSig(mutSig: Readonly<IMutationalSignatureRow>) {
        this.selectedMutSigMap.clear();
        let count = 0;

        this.toggleSelectedMutSig(mutSig);
    }
    @observable clickedMutsig: IMutationalSignatureRow = {
        name: '',
        sampleValues: {
            firstSample: {
                value: 1,
                confidence: 0.9,
            },
            secondSample: {
                value: 2,
                confidence: 0.8,
            },
        },
        description: '',
        url: '',
    };

    @action
    public setclickedMutSig(d: IMutationalSignatureRow) {
        this.clickedMutsig = d;
    }

    public isMutSigSelected(c: IMutationalSignatureRow) {
        return this.selectedMutSigMap.has(mutSigIdKey(c));
    }
    constructor(getData: () => IMutationalSignatureRow[]) {
        super(getData);
        makeObservable(this);
        this.dataHighlighter = (mergedMutSig: IMutationalSignatureRow) => {
            const highlightedMutSig = [];
            highlightedMutSig.push(...this.selectedMutSig);
            return mutSigMatch(mergedMutSig, this.clickedMutsig);
        };
    }
}
