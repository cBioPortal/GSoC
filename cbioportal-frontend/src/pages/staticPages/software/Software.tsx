import * as React from 'react';
import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';
import './styles.scss';
import { getServerConfig } from 'config/config';
import StaticContent from '../../../shared/components/staticContent/StaticContent';
import Helmet from 'react-helmet';

export default class Software extends React.Component<{}, {}> {
    public render() {
        return (
            <PageLayout className={'whiteBackground staticPage'}>
                <Helmet>
                    <title>{'cBioPortal for Cancer Genomics::Software'}</title>
                </Helmet>
                <StaticContent
                    sourceUrl={getServerConfig().skin_documentation_software!}
                    title={'Software'}
                />
            </PageLayout>
        );
    }
}
