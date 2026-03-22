import * as React from 'react';
import { observer } from 'mobx-react';
import { remoteData, isWebdriver } from 'cbioportal-frontend-commons';
import { action, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import _ from 'lodash';
import styles from './styles.module.scss';
import classNames from 'classnames';
import { Portal } from 'react-portal';
import { getBrowserWindow, MobxPromise } from 'cbioportal-frontend-commons';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import { getServerConfig } from 'config/config';
import { STATUS_PROVIDERS } from 'shared/lib/statusProviders';

export interface IUserMessage {
    dateStart?: number;
    dateEnd: number;
    content: string | JSX.Element;
    id: string;
    showCondition?: (routingStore: ExtendedRouterStore) => void;
    backgroundColor?: string;
}

function makeMessageKey(id: string) {
    return `portalMessageKey-${id}`;
}

let MESSAGE_DATA: IUserMessage[];

if (
    [
        'www.cbioportal.org',
        'cbioportal.mskcc.org',
        'genie.cbioportal.org',
        'localhost',
    ].includes(getBrowserWindow().location.hostname) ||
    getBrowserWindow().location.hostname.endsWith('.preview.cbioportal.org')
) {
    MESSAGE_DATA = [
        // ADD MESSAGE IN FOLLOWING FORMAT
        // UNIQUE ID IS IMPORTANT B/C WE REMEMBER A MESSAGE HAS BEEN SHOWN
        // BASED ON USERS LOCALSTORAGE
        // TODO: THIS SHOULD BE LOADED FROM CONFIGURATION
        //
        // {
        //     dateEnd: 100000000000000,
        //     content: `Re-introducing the cBioPortal Newsletter! Subscribe via <a href="https://www.linkedin.com/newsletters/cbioportal-newsletter-7178731490539634689/" target="_blank">LinkedIn</a> or <a href="https://groups.google.com/g/cbioportal-news" target="_blank">Google Groups</a>`,
        //     showCondition: routingStore => {
        //         return getServerConfig().app_name === 'public-portal';
        //     },
        //     id: '2024_newsletter_intro',
        // },
    ];

}

interface IUserMessagerProps {
    dataUrl?: string;
    messages?: IUserMessage[];
}

@observer
export default class UserMessager extends React.Component<
    IUserMessagerProps,
    {}
> {
    constructor(props: IUserMessagerProps) {
        super(props);
        makeObservable(this);
        this.messageData = remoteData<IUserMessage[]>(async () => {
            const staticMessages = props.messages || MESSAGE_DATA || [];

            // Fetch messages from all status providers
            const statusMessages = await this.fetchStatusProviderMessages();

            // Combine status provider messages with static messages
            // Status provider messages take priority (appear first)
            return [...statusMessages, ...staticMessages];
        });
    }
    private messageData: MobxPromise<IUserMessage[]>;

    /**
     * Fetches messages from all registered status providers
     */
    private async fetchStatusProviderMessages(): Promise<IUserMessage[]> {
        try {
            // Fetch from all providers in parallel
            const providerResults = await Promise.all(
                STATUS_PROVIDERS.map((provider) => provider.fetchMessages())
            );

            // Flatten the results into a single array
            return _.flatten(providerResults);
        } catch (error) {
            console.error('Error fetching status provider messages:', error);
            return [];
        }
    }

    @observable dismissed = false;

    get shownMessage() {
        const messageToShow = _.find(this.messageData.result, (message) => {
            // not shown in either session or local storage
            // (session is used for remind
            const notYetShown =
                !localStorage.getItem(makeMessageKey(message.id)) &&
                !sessionStorage.getItem(makeMessageKey(message.id));
            const expired = Date.now() > message.dateEnd;

            const showCondition = message.showCondition
                ? message.showCondition(getBrowserWindow().routingStore)
                : true;

            return notYetShown && !expired && showCondition;
        });

        return messageToShow;
    }

    @autobind
    close() {
        this.markMessageDismissed(this.shownMessage!);
    }

    @action
    markMessageDismissed(message: IUserMessage) {
        localStorage.setItem(makeMessageKey(message.id), 'shown');
        this.dismissed = true;
    }

    @action
    markMessageRemind(message: IUserMessage) {
        sessionStorage.setItem(makeMessageKey(message.id), 'shown');
        this.dismissed = true;
    }

    @autobind
    handleClick(e: any) {
        console.log(e.target.getAttribute('data-action'));
        switch (e.target.getAttribute('data-action')) {
            case 'remind':
                this.shownMessage && this.markMessageRemind(this.shownMessage);
                break;
            case 'dismiss':
                this.shownMessage &&
                    this.markMessageDismissed(this.shownMessage);
                break;
        }
        //;
    }

    render() {
        if (
            !isWebdriver() &&
            !this.dismissed &&
            this.messageData.isComplete &&
            this.shownMessage
        ) {
            const bannerStyle: React.CSSProperties = this.shownMessage
                .backgroundColor
                ? { backgroundColor: this.shownMessage.backgroundColor }
                : {};

            return (
                <Portal
                    isOpened={true}
                    node={document.getElementById('pageTopContainer')}
                >
                    <div
                        className={styles.messager}
                        onClick={this.handleClick}
                        style={bannerStyle}
                    >
                        <i
                            className={classNames(
                                styles.close,
                                'fa',
                                'fa-close'
                            )}
                            onClick={this.close}
                        />
                        {typeof this.shownMessage.content === 'string' ? (
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: this.shownMessage.content,
                                }}
                            />
                        ) : (
                            <div>{this.shownMessage.content}</div>
                        )}
                    </div>
                </Portal>
            );
        } else {
            return null;
        }
    }
}
