import * as React from 'react';
import _ from 'lodash';
import DatasetList from './DatasetList';
import { inject, observer } from 'mobx-react';
import { getClient } from 'shared/api/cbioportalClientInstance';
import { remoteData } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
import styles from './styles.module.scss';
import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import Helmet from 'react-helmet';
import request from 'superagent';
import { getStudyDownloadListUrl } from 'shared/api/urls';

export class DatasetPageStore {
    readonly data = remoteData({
        invoke: () => {
            return getClient().getAllStudiesUsingGET({
                projection: 'DETAILED',
            });
        },
    });

    readonly downloadList = remoteData(async () => {
        if (getServerConfig().study_download_url) {
            const resp = await request(
                getStudyDownloadListUrl()
            ).catch(reason => Promise.resolve({ body: '' }));
            return resp.body;
        } else {
            return Promise.resolve([]);
        }
    });
}

@observer
export default class DatasetPage extends React.Component<{}, {}> {
    private store: DatasetPageStore;

    constructor(props: any) {
        super(props);
        this.store = new DatasetPageStore();
    }

    public render() {
        const header: JSX.Element | null = !_.isEmpty(
            getServerConfig().skin_data_sets_header
        ) ? (
            <p
                style={{ marginBottom: '20px' }}
                dangerouslySetInnerHTML={{
                    __html: getServerConfig().skin_data_sets_header!,
                }}
            ></p>
        ) : null;

        return (
            <PageLayout className={'whiteBackground'}>
                <div className={styles.dataSets}>
                    <Helmet>
                        <title>
                            {'cBioPortal for Cancer Genomics::Datasets'}
                        </title>
                    </Helmet>

                    <h1>Datasets</h1>

                    {this.store.data.isComplete &&
                        this.store.downloadList.isComplete && (
                            <div className={styles.dataSets}>
                                {header}
                                <DatasetList
                                    downloadables={
                                        this.store.downloadList.result
                                    }
                                    datasets={this.store.data.result}
                                />
                            </div>
                        )}

                    {(this.store.data.isPending ||
                        this.store.downloadList.isPending) && (
                        <LoadingIndicator
                            isLoading={true}
                            size={'big'}
                            center={true}
                        ></LoadingIndicator>
                    )}
                </div>
            </PageLayout>
        );
    }
}
