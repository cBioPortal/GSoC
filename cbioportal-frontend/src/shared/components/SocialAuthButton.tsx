import * as React from 'react';
import { AppStore } from '../../AppStore';
import { openSocialAuthWindow } from '../lib/openSocialAuthWindow';

export interface ISocialAuthButtonProps {
    appStore: AppStore;
}

export default class SocialAuthButton extends React.Component<
    ISocialAuthButtonProps,
    {}
> {
    render() {
        return (
            <div className="identity">
                <button
                    className="btn btn-default"
                    onClick={() => openSocialAuthWindow(this.props.appStore)}
                >
                    Login
                </button>
            </div>
        );
    }
}
