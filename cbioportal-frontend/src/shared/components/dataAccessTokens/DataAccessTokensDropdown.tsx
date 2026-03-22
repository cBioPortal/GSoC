import * as React from 'react';
import { getServerConfig } from 'config/config';
import { Link } from 'react-router-dom';
import { AppStore } from '../../../AppStore';
import LoadingIndicator from '../loadingIndicator/LoadingIndicator';
import { observer } from 'mobx-react';
import { observable, computed, makeObservable } from 'mobx';
import { buildCBioPortalPageUrl } from '../../api/urls';
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

export interface IDataAccessTokensProps {
    token?: string;
    creationDate?: string;
    expirationDate?: string;
    loadingComponent?: JSX.Element;
    appStore: AppStore;
}

@observer
export class DataAccessTokensDropdown extends React.Component<
    IDataAccessTokensProps,
    {}
> {
    public static defaultProps: Partial<IDataAccessTokensProps> = {
        loadingComponent: <LoadingIndicator isLoading={true} />,
    };

    constructor(props: IDataAccessTokensProps) {
        super(props);
        makeObservable(this);
    }

    @computed get getDatDropdownList(): any {
        const listItems = [
            {
                id: 'signout',
                action: (
                    <a
                        href={buildCBioPortalPageUrl(
                            this.props.appStore.logoutUrl,
                            {
                                local: getServerConfig().saml_logout_local.toString(),
                            }
                        )}
                    >
                        Sign out
                    </a>
                ),
                hide: false,
            },
            {
                id: 'datDownload',
                action: (
                    <Link to="/webAPI#using-data-access-tokens">
                        Data Access Token
                    </Link>
                ),
                hide:
                    this.props.appStore.isSocialAuthenticated ||
                    !SUPPORTED_DAT_METHODS.includes(
                        getServerConfig().dat_method
                    ),
            },
        ];
        const shownListItems = listItems.filter(l => {
            return !l.hide;
        });

        return shownListItems.map(l => {
            return <li>{l.action}</li>;
        });
    }

    render() {
        return <ul className="list-unstyled">{this.getDatDropdownList}</ul>;
    }
}
