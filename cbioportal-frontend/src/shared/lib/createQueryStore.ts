import {
    CancerStudyQueryUrlParams,
    QueryStore,
} from 'shared/components/query/QueryStore';
import { ResultsViewTab } from 'pages/resultsView/ResultsViewPageHelpers';
import ResultsViewURLWrapper, {
    ResultsViewURLQuery,
} from 'pages/resultsView/ResultsViewURLWrapper';
import ifNotDefined from './ifNotDefined';

export function createQueryStore(
    currentQuery?: any,
    urlWrapper?: ResultsViewURLWrapper,
    clearUrl = true
) {
    const win: any = window;

    const queryStore = new QueryStore(currentQuery);

    queryStore.singlePageAppSubmitRoutine = function(
        query: CancerStudyQueryUrlParams,
        currentTab?: ResultsViewTab
    ) {
        // normalize this
        query.cancer_study_list =
            query.cancer_study_list || query.cancer_study_id;
        delete (query as Partial<CancerStudyQueryUrlParams>).cancer_study_id;

        // check if certain parameters should be reset
        if (currentQuery) {
            const importantQueryDetailsChanged =
                currentQuery.cancer_study_id !== query.cancer_study_id ||
                currentQuery.cancer_study_list !== query.cancer_study_list ||
                ifNotDefined(currentQuery.case_ids, '') !==
                    ifNotDefined(query.case_ids, '') ||
                currentQuery.case_set_id !== query.case_set_id;

            if (importantQueryDetailsChanged) {
                // reset comparison groups
                (query as Partial<
                    ResultsViewURLQuery
                >).comparison_createdGroupsSessionId = undefined;

                // reset plots tab selection, because available data may change
                (query as Partial<
                    ResultsViewURLQuery
                >).plots_horz_selection = undefined;
                (query as Partial<
                    ResultsViewURLQuery
                >).plots_vert_selection = undefined;
                (query as Partial<
                    ResultsViewURLQuery
                >).plots_coloring_selection = undefined;
            }
        }

        const tab = currentTab ? currentTab : ResultsViewTab.ONCOPRINT;

        const wrapper =
            urlWrapper || new ResultsViewURLWrapper(win.routingStore);

        wrapper.updateURL(query, `results/${tab}`, clearUrl, false);

        // we only want to destroy the urlwrapper if we just created it for submission purpose
        // i.e. it was NOT passed to us
        if (urlWrapper === undefined) {
            wrapper.destroy();
        }
    };

    return queryStore;
}
