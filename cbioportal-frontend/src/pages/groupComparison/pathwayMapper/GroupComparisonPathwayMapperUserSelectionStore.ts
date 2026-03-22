import { action, makeObservable, observable } from 'mobx';
export interface IRankingChoices {
    dropDownTitle: string;
    isPercentageMatch: number;
    isAlterationEnabled: number;
    considerOnlyTCGAPanPathways: boolean;
}

export default class GroupComparisonPathwayMapperUserSelectionStore {
    constructor() {
        makeObservable(this);
    }
    @observable
    currentPathway: string = '';
    @observable.ref
    rankingChoices: IRankingChoices = {
        dropDownTitle: 'Match count',
        isPercentageMatch: 0,
        isAlterationEnabled: 0,
        considerOnlyTCGAPanPathways: true,
    };
    @observable selectedGenes: string[] | undefined = undefined;

    @action.bound
    updateRankingChoices(
        dropDownTitle: string,
        isAlterationEnabled: number,
        considerOnlyTCGAPanPathways: boolean,
        isPercentageMatch: number,
        selectedPathway: string
    ) {
        this.currentPathway = selectedPathway;
        this.rankingChoices = {
            dropDownTitle,
            isPercentageMatch,
            isAlterationEnabled,
            considerOnlyTCGAPanPathways,
        };
    }
}
