import * as React from 'react';
import classNames from 'classnames';
import { inject } from 'mobx-react';
import { AppStore } from '../../../AppStore';
import PortalFooter from '../../../appShell/App/PortalFooter';
import { RFC80Test } from 'shared/components/rfc80Tester';

interface IPageLayout {
    rightBar?: any;
    className?: string;
    noMargin?: boolean;
    appStore?: AppStore;
    hideFooter?: boolean;
}

@inject('appStore')
export class PageLayout extends React.Component<IPageLayout, {}> {
    render() {
        const noMargin = this.props.noMargin ? 'noMargin' : '';

        return (
            <div className={'mainContainer'}>
                <div
                    className={classNames(
                        'contentWidth',
                        this.props.className,
                        noMargin
                    )}
                >
                    <div id="mainColumn" data-tour="mainColumn">
                        <div>{this.props.children}</div>
                    </div>
                    {this.props.rightBar && (
                        <div id="rightColumn">{this.props.rightBar}</div>
                    )}
                </div>

                {!this.props.hideFooter && (
                    <PortalFooter appStore={this.props.appStore!} />
                )}

                {localStorage.rfc80 && <RFC80Test />}
            </div>
        );
    }
}
