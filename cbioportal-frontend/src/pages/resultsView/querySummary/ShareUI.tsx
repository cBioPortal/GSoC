import { DefaultTooltip, getBrowserWindow } from 'cbioportal-frontend-commons';
import { observer } from 'mobx-react';
import * as React from 'react';
import styles from './shareUI.module.scss';
import { BookmarkModal } from '../bookmark/BookmarkModal';
import { action, makeObservable, observable } from 'mobx';
import { getBitlyShortenedUrl } from '../../../shared/lib/bitly';
import { PageSettingsData } from 'shared/api/session-service/sessionServiceModels';
import { USER_SETTINGS_QUERY_PARAM } from 'pages/resultsView/ResultsViewURLWrapper';

interface IShareUI {
    bitlyAccessToken?: string | null;
    userSettings?: PageSettingsData;
}

const win = getBrowserWindow();

export interface ShareUrls {
    bitlyUrl: string | undefined;
    fullUrl: string;
    sessionUrl: string | undefined;
}

@observer
export class ShareUI extends React.Component<IShareUI, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @observable showBookmarkDialog: boolean = false;

    async getUrls(): Promise<ShareUrls> {
        const sessionUrl = new URL(win.location.href);
        if (this.props.userSettings) {
            const json = JSON.stringify(this.props.userSettings);
            sessionUrl.hash = `${USER_SETTINGS_QUERY_PARAM}=${json}`;
        }

        const bitlyUrl = await getBitlyShortenedUrl(
            sessionUrl.toString(),
            this.props.bitlyAccessToken
        );

        return {
            bitlyUrl,
            fullUrl: sessionUrl.toString(),
            sessionUrl: sessionUrl.toString(),
        };
    }

    @action.bound
    toggleBookmarkDialog() {
        this.showBookmarkDialog = !this.showBookmarkDialog;
    }

    render() {
        return (
            <div className={styles.shareModule}>
                <DefaultTooltip
                    placement={'topLeft'}
                    overlay={<div>Get bookmark link</div>}
                >
                    <a
                        data-test="bookmark-link"
                        onClick={this.toggleBookmarkDialog}
                    >
                        <span className="fa-stack fa-4x">
                            <i className="fa fa-circle fa-stack-2x"></i>
                            <i className="fa fa-link fa-stack-1x"></i>
                        </span>
                    </a>
                </DefaultTooltip>
                {this.showBookmarkDialog && (
                    <BookmarkModal
                        onHide={this.toggleBookmarkDialog}
                        urlPromise={this.getUrls()}
                        title={'Bookmark Query'}
                    />
                )}
            </div>
        );
    }
}
