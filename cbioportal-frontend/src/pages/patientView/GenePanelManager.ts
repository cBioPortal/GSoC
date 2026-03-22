import { computed } from 'mobx';
import {
    genePanelIdToIconData,
    getGenePanelIds,
    IKeyedIconData,
    sampleIdToIconData,
} from 'pages/patientView/genomicOverview/GenomicOverviewUtils';

class GenePanelManager {
    constructor(
        private sampleIdToMutationGenePanelId?: { [sampleId: string]: string },
        private sampleIdToCopyNumberGenePanelId?: { [sampleId: string]: string }
    ) {}

    @computed get genePanelIds() {
        return getGenePanelIds(
            this.sampleIdToMutationGenePanelId,
            this.sampleIdToCopyNumberGenePanelId
        );
    }

    @computed get genePanelIdToIconData(): IKeyedIconData {
        return genePanelIdToIconData(this.genePanelIds);
    }

    @computed get sampleIdToMutationGenePanelIconData(): IKeyedIconData {
        return sampleIdToIconData(
            this.sampleIdToMutationGenePanelId,
            this.genePanelIdToIconData
        );
    }

    @computed get sampleIdToCopyNumberGenePanelIconData(): IKeyedIconData {
        return sampleIdToIconData(
            this.sampleIdToCopyNumberGenePanelId,
            this.genePanelIdToIconData
        );
    }
}

export default GenePanelManager;
