import URLWrapper from '../../shared/lib/URLWrapper';
import ExtendedRouterStore from '../../shared/lib/ExtendedRouterStore';
import { computed, makeObservable } from 'mobx';
import { getTabId } from './GroupComparisonUtils';
import { GroupComparisonTab } from './GroupComparisonTabs';
import autobind from 'autobind-decorator';
import { OverlapStrategy } from '../../shared/lib/comparison/ComparisonStore';
import IComparisonURLWrapper from 'pages/groupComparison/IComparisonURLWrapper';
import {
    cnaGroup,
    CopyNumberEnrichmentEventType,
    EnrichmentEventType,
    MutationEnrichmentEventType,
    mutationGroup,
} from 'shared/lib/comparison/ComparisonStoreUtils';
import { getServerConfig } from 'config/config';
import { MapValues } from 'shared/lib/TypeScriptUtils';
import { AxisScale } from 'react-mutation-mapper';

export type GroupComparisonURLQuery = {
    comparisonId: string;
    groupOrder?: string; // json stringified array of names
    unselectedGroups?: string; // json stringified array of names
    overlapStrategy?: OverlapStrategy;
    patientEnrichments?: string;
    selectedEnrichmentEventTypes: string;
    selectedGene?: string;
    axisMode?: AxisScale;
};

export default class GroupComparisonURLWrapper
    extends URLWrapper<GroupComparisonURLQuery>
    implements IComparisonURLWrapper {
    constructor(routing: ExtendedRouterStore) {
        super(
            routing,
            {
                comparisonId: { isSessionProp: true, aliases: ['sessionId'] },
                groupOrder: { isSessionProp: false },
                unselectedGroups: { isSessionProp: false },
                overlapStrategy: { isSessionProp: false },
                patientEnrichments: { isSessionProp: false },
                selectedEnrichmentEventTypes: { isSessionProp: true },
                selectedGene: { isSessionProp: false },
                axisMode: { isSessionProp: false },
            },
            true,
            getServerConfig().session_url_length_threshold
                ? parseInt(getServerConfig().session_url_length_threshold)
                : undefined
        );
        makeObservable(this);
    }

    @computed public get tabId() {
        return getTabId(this.pathName) || GroupComparisonTab.OVERLAP;
    }

    @autobind
    public setTabId(tabId: GroupComparisonTab, replace?: boolean) {
        this.updateURL({}, `comparison/${tabId}`, false, replace);
    }

    @computed public get selectedEnrichmentEventTypes() {
        if (this.query.selectedEnrichmentEventTypes) {
            return JSON.parse(this.query.selectedEnrichmentEventTypes) as (
                | MutationEnrichmentEventType
                | CopyNumberEnrichmentEventType
            )[];
        } else {
            return undefined;
        }
    }

    @autobind
    public updateSelectedEnrichmentEventTypes(t: EnrichmentEventType[]) {
        this.updateURL({
            selectedEnrichmentEventTypes: JSON.stringify(t),
        });
    }
}
