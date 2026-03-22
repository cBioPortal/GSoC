import * as React from 'react';
import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';
import './styles.scss';
import Helmet from 'react-helmet';
import { getServerConfig } from 'config/config';

export default class InstallationMap extends React.Component<{}, {}> {
    public render() {
        const installations_url = getServerConfig().installation_map_url;
        return (
            <PageLayout
                className={'whiteBackground staticPage installationMap'}
                hideFooter={true}
            >
                <Helmet>
                    <title>
                        {'cBioPortal for Cancer Genomics::Installation Map'}
                    </title>
                </Helmet>
                <iframe
                    frameBorder="0"
                    scrolling="yes"
                    src={installations_url}
                />
            </PageLayout>
        );
    }
}
