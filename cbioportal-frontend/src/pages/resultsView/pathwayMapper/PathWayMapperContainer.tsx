import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import { ResultsViewPathwaysSubTab } from 'pages/resultsView/ResultsViewPageHelpers';
import { getServerConfig } from 'config/config';
import ResultsViewPathwayMapper from 'pages/resultsView/pathwayMapper/ResultsViewPathwayMapper';
import IFrameLoader from 'shared/components/iframeLoader/IFrameLoader';
import * as React from 'react';
import { observer } from 'mobx-react';
import { ResultsViewPageStore } from 'pages/resultsView/ResultsViewPageStore';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';
import { AppStore } from 'AppStore';
import { useLocalObservable } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import request from 'superagent';
import { remoteData } from 'cbioportal-frontend-commons';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

interface IPathwayMapperContainerProps {
    resultsViewPageStore: ResultsViewPageStore;
    appStore: AppStore;
    urlWrapper: ResultsViewURLWrapper;
}

interface ResultItem {
    databases: DatabaseItem[];
}
interface DatabaseItem {
    name: string;
    numberOfNetworks: string;
    url: string;
}
interface ApiResponse {
    results: ResultItem[];
}

function makeRemoteData() {
    return remoteData<DatabaseItem[]>({
        await: () => [],
        invoke: async () => {
            const getResponse = await request
                .get(
                    'https://iquery-cbio-dev.ucsd.edu/integratedsearch/v1/source'
                )
                .set('Accept', 'application/json')
                .timeout(60000)
                .redirects(0);

            const jsonData: ApiResponse = getResponse.body;
            const extractedData: DatabaseItem[] = jsonData.results[0]?.databases.map(
                result => ({
                    name: result.name,
                    numberOfNetworks: parseInt(
                        result.numberOfNetworks,
                        10
                    ).toString(),
                    url: result.url,
                })
            );

            return extractedData;
        },
        default: [],
    });
}

function formatUrl(url: string) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    } else {
        return 'http://' + url;
    }
}

const TooltipContent: React.FC = observer(() => {
    const store = useLocalObservable(() => ({
        tooltipContent: null as DatabaseItem[] | null,
        tooltipData: makeRemoteData(),
    }));

    return (
        <div style={{ maxWidth: 400 }}>
            <a href="https://www.ndexbio.org/" target="_blank">
                NDEx
            </a>{' '}
            shows 1,352 pathways:
            {store.tooltipData.isPending ? (
                <div>
                    <LoadingIndicator
                        isLoading={true}
                        size={'small'}
                        inline={true}
                    />{' '}
                    Loading networks
                </div>
            ) : (
                <div>
                    {store.tooltipData.result && (
                        <ul>
                            {store.tooltipData.result.map(
                                (item: DatabaseItem, index: number) => (
                                    <li key={index}>
                                        {item.numberOfNetworks} from{' '}
                                        <a
                                            href={formatUrl(item.url)}
                                            target="_blank"
                                        >
                                            {item.name}
                                        </a>
                                    </li>
                                )
                            )}
                        </ul>
                    )}
                    {store.tooltipData.isError && (
                        <div className={'text-warning'}>
                            Error: Failed to load tooltip content.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

const PathWayMapperContainer: React.FunctionComponent<IPathwayMapperContainerProps> = observer(
    function({
        resultsViewPageStore,
        appStore,
        urlWrapper,
    }: IPathwayMapperContainerProps) {
        const store = useLocalObservable(() => ({
            activeTab: urlWrapper.subTab,
        }));

        return (
            <>
                <span
                    style={{
                        float: 'left',
                        paddingRight: 10,
                    }}
                >
                    Choose Pathway Source:
                </span>
                <MSKTabs
                    id="pathwaysPageTabs"
                    activeTabId={store.activeTab}
                    onTabClick={(id: ResultsViewPathwaysSubTab) => {
                        runInAction(() => {
                            store.activeTab = id;
                            urlWrapper.setSubTab(id);
                        });
                    }}
                    className="pillTabs resultsPagePathwaysTabs"
                    arrowStyle={{ 'line-height': 0.8 }}
                    tabButtonStyle="pills"
                    unmountOnHide={true}
                >
                    <MSKTab
                        key={ResultsViewPathwaysSubTab.PATHWAY_MAPPER}
                        id={ResultsViewPathwaysSubTab.PATHWAY_MAPPER}
                        linkText={ResultsViewPathwaysSubTab.PATHWAY_MAPPER}
                        linkTooltip={
                            <div style={{ maxWidth: 400 }}>
                                <a
                                    href="https://www.pathwaymapper.org/"
                                    target="_blank"
                                >
                                    PathwayMapper
                                </a>{' '}
                                shows pathways from over fifty cancer related
                                pathways and provides a collaborative web-based
                                editor for creating new ones.
                            </div>
                        }
                        hide={!getServerConfig().show_pathway_mapper}
                    >
                        <ResultsViewPathwayMapper
                            store={resultsViewPageStore}
                            appStore={appStore}
                            urlWrapper={resultsViewPageStore.urlWrapper}
                        />
                    </MSKTab>
                    <MSKTab
                        key={ResultsViewPathwaysSubTab.NDEX}
                        id={ResultsViewPathwaysSubTab.NDEX}
                        linkText={ResultsViewPathwaysSubTab.NDEX}
                        linkTooltip={<TooltipContent />}
                        hide={
                            !getServerConfig().show_ndex ||
                            !resultsViewPageStore.remoteNdexUrl.isComplete ||
                            !resultsViewPageStore.remoteNdexUrl.result
                        }
                    >
                        <IFrameLoader
                            height={800}
                            url={`${resultsViewPageStore.remoteNdexUrl.result}`}
                        />
                    </MSKTab>
                </MSKTabs>
            </>
        );
    }
);

export default PathWayMapperContainer;
