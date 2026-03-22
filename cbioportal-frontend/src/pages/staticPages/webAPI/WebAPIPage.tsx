import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, makeObservable } from 'mobx';
import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';
import './styles.scss';
import Helmet from 'react-helmet';
import { getServerConfig } from 'config/config';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { buildCBioPortalAPIUrl } from 'shared/api/urls';
import { SUPPORTED_DAT_METHODS } from 'shared/constants';

export class UserDataAccessToken {
    @observable.ref token: string;
    @observable.ref creationDate: string;
    @observable.ref expirationDate: string;
    @observable.ref username: string;
    constructor(
        token: string,
        creationDate: string,
        expirationDate: string,
        username: string
    ) {
        makeObservable(this);
        this.token = token;
        this.creationDate = creationDate;
        this.expirationDate = expirationDate;
        this.username = username;
    }
}

@observer
export default class WebAPIPage extends React.Component<{}, {}> {
    private get appStore() {
        return getBrowserWindow().globalStores.appStore;
    }

    async downloadDataAccessTokenFile() {
        const tokenUrl = buildCBioPortalAPIUrl('api/data-access-token');
        window.open(tokenUrl, '_blank');
    }

    renderDataAccessTokensDiv() {
        if (
            getServerConfig().authenticationMethod === 'optional_oauth2' ||
            !SUPPORTED_DAT_METHODS.includes(getServerConfig().dat_method)
        ) {
            return <div></div>;
        } else {
            return (
                <div id="using-data-access-tokens">
                    <p>
                        To directly access the cBioPortal web services on
                        installations which require login, clients will need to
                        obtain a data access token and present this token with
                        each web service request.
                    </p>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={() => this.downloadDataAccessTokenFile()}
                        style={{ marginBottom: 15 }}
                    >
                        Download Token
                    </button>

                    <p>
                        There are instructions for making requests to the Web
                        API using Data Access Tokens&nbsp;
                        <a href="https://docs.cbioportal.org/2.2-authorization-and-authentication/authenticating-users-via-tokens#using-data-access-tokens">
                            here
                        </a>
                    </p>
                </div>
            );
        }
    }

    public render() {
        return (
            <PageLayout className={'whiteBackground staticPage'}>
                <Helmet>
                    <title>{'cBioPortal for Cancer Genomics::Helmet'}</title>
                </Helmet>

                <h1>Web API</h1>

                <p>
                    API documentation is now at{' '}
                    <a
                        target={'_blank'}
                        href="https://docs.cbioportal.org/web-api-and-clients/"
                    >
                        docs.cbioportal.org
                    </a>
                </p>
                {this.renderDataAccessTokensDiv()}

                <h2 id="linking-to-us">Linking to Us</h2>
                <p>
                    Once you have a cancer_study_id, it is very easy to create
                    stable links from your web site to the cBio Portal. Stable
                    links must point to ln, and can include the following
                    parameters:
                </p>
                <ul>
                    <li>
                        <strong>q</strong>=[a query following{' '}
                        <a href="oql" target="_blank">
                            Onco Query Language
                        </a>
                        , e.g. a space separated list of HUGO gene symbols]
                        (required)
                    </li>
                    <li>
                        <strong>cancer_study_id</strong>=[cancer study ID] (if
                        not specified, do a cross cancer query)
                    </li>
                    <li>
                        <strong>report</strong>=[report to display; can be one
                        of: full (default), oncoprint_html]
                    </li>
                </ul>
                <p>
                    For example, here is a link to the TCGA GBM data for EGFR
                    and NF1:
                </p>
                <p>
                    <a href="ln?cancer_study_id=gbm_tcga&amp;q=EGFR+NF1">
                        ln?cancer_study_id=gbm_tcga&amp;q=EGFR+NF1
                    </a>
                </p>
                <p>
                    And a link to TP53 mutations across a curated set of
                    non-redundant studies:
                </p>
                <p>
                    <a href="ln?q=TP53:MUT">ln?q=TP53:MUT</a>
                </p>
            </PageLayout>
        );
    }
}
