import * as React from 'react';
import ErrorScreen from '../errorScreen/ErrorScreen';
import { buildCBioPortalPageUrl } from 'shared/api/urls';

const PageNotFound = () => (
    <div className={'errorScreen'}>
        <div className="contentWrapper">
            <ErrorScreen
                title={"Sorry, this page doesn't exist."}
                body={
                    <a href={buildCBioPortalPageUrl('/')}>Return to homepage</a>
                }
            />
        </div>
    </div>
);

export default PageNotFound;
