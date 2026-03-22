import * as React from 'react';
import { inject } from 'mobx-react';
import { AppStore } from 'AppStore';
import PortalHeader from 'appShell/App/PortalHeader';
import PortalFooter from 'appShell/App/PortalFooter';
import UserMessager from 'shared/components/userMessager/UserMessage';
import ErrorScreen from 'shared/components/errorScreen/ErrorScreen';
import { formatErrorTitle } from 'shared/lib/errorFormatter';
import { buildCBioPortalPageUrl } from 'shared/api/urls';

@inject('appStore')
export default class ErrorPage extends React.Component<
    { appStore?: AppStore },
    {}
> {
    render() {
        return (
            <div>
                <div className="pageTopContainer">
                    <UserMessager />
                    <div className="contentWidth">
                        <PortalHeader
                            appStore={this.props.appStore as AppStore}
                        />
                    </div>
                </div>
                <div className="contentWrapper">
                    <ErrorScreen
                        title={"Sorry, this page doesn't exist."}
                        body={
                            <a href={buildCBioPortalPageUrl('/')}>
                                Return to homepage
                            </a>
                        }
                    />
                </div>
            </div>
        );
    }
}
