import * as React from 'react';

import 'cbioportal-frontend-commons/dist/styles.css';
import '../../globalStyles/prefixed-global.scss';
import { ToastContainer } from 'react-toastify';

import PortalHeader from './PortalHeader';
import { getBrowserWindow, isWebdriver } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';

import { getServerConfig } from 'config/config';
import Helmet from 'react-helmet';
import { If, Else, Then } from 'react-if';
import UserMessager from 'shared/components/userMessager/UserMessage';
import {
    formatErrorLog,
    formatErrorTitle,
    formatErrorMessages,
} from 'shared/lib/errorFormatter';
import { buildCBioPortalPageUrl } from 'shared/api/urls';
import ErrorScreen from 'shared/components/errorScreen/ErrorScreen';
import { ServerConfigHelpers } from 'config/config';
import {
    shouldShowStudyViewWarning,
    StudyAgreement,
} from 'appShell/App/usageAgreements/StudyAgreement';
import {
    GenieAgreement,
    shouldShowGenieWarning,
} from 'appShell/App/usageAgreements/GenieAgreement';
import makeRoutes from 'routes';
import { AppContext } from 'cbioportal-frontend-commons';
import { IAppContext } from 'cbioportal-frontend-commons';
import { ErrorAlert } from 'shared/components/errorScreen/ErrorAlert';
import { ErrorInfo } from 'react';
import { observable } from 'mobx';
import { sendToLoggly } from 'shared/lib/tracking';

interface IContainerProps {
    location: Location;
    children: React.ReactNode;
}

function isLocalDBServer() {
    try {
        return getServerConfig().app_name === 'localdbe2e';
    } catch (ex) {
        return false;
    }
}

@observer
export default class Container extends React.Component<IContainerProps, {}> {
    private get routingStore() {
        return getBrowserWindow().routingStore;
    }

    private get appStore() {
        return getBrowserWindow().globalStores.appStore;
    }

    renderChildren() {
        const childProps = { ...this.props };
        const { children } = this.props;
        return React.Children.map(children, c =>
            React.cloneElement(c as React.ReactElement<any>, childProps)
        );
    }

    get appContext(): IAppContext {
        return {};
    }

    render() {
        if (
            !isLocalDBServer() &&
            !isWebdriver() &&
            !ServerConfigHelpers.sessionServiceIsEnabled()
        ) {
            return (
                <div className="contentWrapper">
                    <ErrorScreen
                        title={'No session service configured'}
                        body={
                            <p>
                                As of version 3.0.0, all cBioPortal
                                installations require a session service. Please
                                review these instructions for how to do so.{' '}
                                <a href="https://docs.cbioportal.org/2.1.2-deploy-without-docker/deploying#run-cbioportal-session-service">
                                    https://docs.cbioportal.org/2.1.2-deploy-without-docker/deploying#run-cbioportal-session-service
                                </a>
                            </p>
                        }
                    />
                </div>
            );
        }

        return (
            <AppContext.Provider value={this.appContext}>
                <ErrorBoundary>
                    <div>
                        <ToastContainer />
                        <Helmet>
                            <meta charSet="utf-8" />
                            <title>{getServerConfig().skin_title}</title>
                            <meta
                                name="description"
                                content={getServerConfig().skin_description}
                            />
                        </Helmet>

                        <div id="pageTopContainer" className="pageTopContainer">
                            <UserMessager />

                            {shouldShowStudyViewWarning() && <StudyAgreement />}

                            {shouldShowGenieWarning() && <GenieAgreement />}

                            <div className="contentWidth">
                                <PortalHeader appStore={this.appStore} />
                            </div>
                        </div>
                        <If condition={this.appStore.isErrorCondition}>
                            <Then>
                                <div className="contentWrapper">
                                    <ErrorScreen
                                        title={
                                            formatErrorTitle(
                                                this.appStore.siteErrors
                                            ) ||
                                            'Oops. There was an error retrieving data.'
                                        }
                                        body={
                                            <a
                                                href={buildCBioPortalPageUrl(
                                                    '/'
                                                )}
                                            >
                                                Return to homepage
                                            </a>
                                        }
                                        errorLog={formatErrorLog(
                                            this.appStore.siteErrors
                                        )}
                                        errorMessages={formatErrorMessages(
                                            this.appStore.siteErrors
                                        )}
                                    />
                                </div>
                            </Then>
                            <Else>
                                <div className="contentWrapper">
                                    <ErrorAlert appStore={this.appStore} />

                                    {makeRoutes()}
                                </div>
                            </Else>
                        </If>
                    </div>
                </ErrorBoundary>
            </AppContext.Provider>
        );
    }
}

class ErrorBoundary extends React.Component<
    any,
    { hasError: boolean; error?: Error }
> {
    @observable hasError = false;

    constructor(props: any) {
        super(props);
        this.state = {
            hasError: false,
        };
    }

    static getDerivedStateFromError(error: any) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // You can also log the error to an error reporting service

        sendToLoggly({ message: error.message, tag: 'ERROR_JS' });
        this.hasError = true;
    }

    render() {
        if (this.state.hasError) {
            // fallback UI
            return (
                <ErrorScreen
                    title={'Oh no! We encountered an error.'}
                    errorLog={JSON.stringify({
                        type: 'ErrorBoundary',
                        log: this.state.error?.toString(),
                    })}
                />
            );
        } else {
            return this.props.children;
        }
    }
}
