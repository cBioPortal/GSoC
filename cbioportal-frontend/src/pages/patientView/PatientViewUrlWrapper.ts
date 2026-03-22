import URLWrapper from 'shared/lib/URLWrapper';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import { PagePath } from 'shared/enums/PagePaths';
import { computed, makeObservable } from 'mobx';
import { PatientViewPageTabs } from './PatientViewPageTabs';

export type PatientViewUrlQuery = {
    studyId: string;
    caseId?: string;
    sampleId?: string;
    resourceUrl?: string;
    genomicEvolutionSettings: {
        showTimeline?: string;

        clusterHeatmap?: string;
        transposeHeatmap?: string;
        showMutationLabelsInHeatmap?: string;

        showOnlySelectedMutationsInChart?: string;
        logScaleChart?: string;
        yAxisDataRangeInChart?: string;

        showOnlySelectedMutationsInTable?: string;
    };
};

export default class PatientViewUrlWrapper extends URLWrapper<
    PatientViewUrlQuery
> {
    constructor(routing: ExtendedRouterStore) {
        super(routing, {
            studyId: { isSessionProp: false, isHashedProp: true },
            caseId: { isSessionProp: false, isHashedProp: true },
            sampleId: { isSessionProp: false, isHashedProp: true },
            resourceUrl: { isSessionProp: false },
            genomicEvolutionSettings: {
                isSessionProp: false,
                nestedObjectProps: {
                    showTimeline: '',

                    clusterHeatmap: '',
                    transposeHeatmap: '',
                    showMutationLabelsInHeatmap: '',

                    showOnlySelectedMutationsInChart: '',
                    logScaleChart: '',
                    yAxisDataRangeInChart: '',

                    showOnlySelectedMutationsInTable: '',
                },
            },
        });
        makeObservable(this);
    }

    public setActiveTab(tab: string): void {
        this.updateURL({}, `${PagePath.Patient}/${tab}`);
    }

    @computed public get activeTabId() {
        return this.pathName.split('/').pop() || PatientViewPageTabs.Summary;
    }

    public setResourceUrl(resourceUrl: string) {
        this.updateURL({ resourceUrl });
    }
}
