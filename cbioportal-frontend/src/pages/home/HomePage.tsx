import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { observable, makeObservable } from 'mobx';
import { getServerConfig } from 'config/config';
import 'react-select1/dist/react-select.css';
import { QueryStore } from '../../shared/components/query/QueryStore';
import QueryAndDownloadTabs from '../../shared/components/query/QueryAndDownloadTabs';
import { PageLayout } from '../../shared/components/PageLayout/PageLayout';
import RightBar from '../../shared/components/rightbar/RightBar';
// tslint:disable-next-line:no-import-side-effect
import './homePage.scss';
import autobind from 'autobind-decorator';
import { createQueryStore } from 'shared/lib/createQueryStore';
import { setTourLocalStorageFromURL } from 'tours';

const win = window as any;

export interface IResultsViewPageProps {
    routing: any;
}

@inject('routing')
@observer
export default class HomePage extends React.Component<
    IResultsViewPageProps,
    {}
> {
    @observable showQuerySelector = true;

    queryStore: QueryStore;

    constructor(props: IResultsViewPageProps) {
        super(props);
        makeObservable(this);
    }

    componentWillMount() {
        this.queryStore = createQueryStore();
    }

    componentDidMount() {
        setTourLocalStorageFromURL();
    }

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({ tab: id });
    }

    @autobind
    private getQueryStore() {
        return this.queryStore;
    }

    public render() {
        return (
            <PageLayout
                className="homePageLayout"
                noMargin={true}
                rightBar={<RightBar queryStore={this.queryStore} />}
            >
                <div
                    className={'headBlock'}
                    dangerouslySetInnerHTML={{
                        __html: getServerConfig().skin_blurb!,
                    }}
                ></div>

                <QueryAndDownloadTabs
                    getQueryStore={this.getQueryStore}
                    showQuickSearchTab={getServerConfig().quick_search_enabled}
                    showDownloadTab={false}
                />
            </PageLayout>
        );
    }
}
