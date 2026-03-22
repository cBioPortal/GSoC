import * as React from 'react';
import { If } from 'react-if';
// tslint:disable-next-line:no-import-side-effect
import './footer.scss';
import _ from 'lodash';
import { Link } from 'react-router-dom';
import { AppStore } from '../../AppStore';
import { observer } from 'mobx-react';
import { getLoadConfig, getServerConfig } from 'config/config';

@observer
export default class PortalFooter extends React.Component<
    { appStore: AppStore },
    {}
> {
    render() {
        var version;
        if (
            this.props.appStore.portalVersion.isComplete &&
            !this.props.appStore.portalVersion.isError &&
            this.props.appStore.portalVersion.result
        ) {
            version = this.props.appStore.portalVersion.result;
        } else {
            version = '--';
        }
        if (
            getServerConfig().skin_footer &&
            !_.isEmpty(getServerConfig().skin_footer)
        ) {
            return (
                <div
                    id="footer"
                    dangerouslySetInnerHTML={{
                        __html:
                            "<a href='http://www.cbioportal.org'>cBioPortal</a> | " +
                            `<a href='${
                                getLoadConfig().apiRoot
                            }api/info'>${version}</a> ` +
                            getServerConfig().skin_footer +
                            '<br />' +
                            `Questions and Feedback: <a href="mailto:${
                                getServerConfig().skin_email_contact
                            }">${getServerConfig().skin_email_contact}</a>`,
                    }}
                ></div>
            );
        } else {
            return (
                <div id="footer">
                    <div className="footer-layout">
                        <div className="footer-elem">
                            <img
                                src={require('../../globalStyles/images/cbioportal_logo.png')}
                                style={{
                                    width: 142,
                                    filter: 'grayscale(100%)',
                                }}
                                alt="cBioPortal Logo"
                            />
                            {version && (
                                <a href={`${getLoadConfig().apiRoot}api/info`}>
                                    <div
                                        style={{
                                            paddingTop: 9,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {version}
                                    </div>
                                </a>
                            )}
                        </div>
                        <If
                            condition={
                                getServerConfig().skin_show_tutorials_tab !==
                                    false ||
                                getServerConfig().skin_show_faqs_tab
                            }
                        >
                            <div className="footer-elem">
                                <h3>HELP</h3>
                                <ul>
                                    <If
                                        condition={
                                            getServerConfig()
                                                .skin_show_tutorials_tab !==
                                            false
                                        }
                                    >
                                        <li>
                                            <a
                                                target="_blank"
                                                href="https://docs.cbioportal.org/user-guide/overview/"
                                            >
                                                Tutorials
                                            </a>
                                        </li>
                                    </If>
                                    <If
                                        condition={
                                            getServerConfig().skin_show_faqs_tab
                                        }
                                    >
                                        <li>
                                            <a
                                                target={'_blank'}
                                                href="https://docs.cbioportal.org/user-guide/faq/"
                                            >
                                                FAQ
                                            </a>
                                        </li>
                                    </If>
                                    <li>
                                        <a
                                            target="_blank"
                                            href="https://groups.google.com/forum/#!forum/cbioportal"
                                        >
                                            User Group
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </If>
                        <If
                            condition={
                                getServerConfig().skin_show_news_tab ||
                                getServerConfig().skin_show_about_tab
                            }
                        >
                            <div className="footer-elem">
                                <h3>INFO</h3>
                                <ul>
                                    <If
                                        condition={
                                            getServerConfig().skin_show_news_tab
                                        }
                                    >
                                        <li>
                                            <a
                                                target="_blank"
                                                href="https://docs.cbioportal.org/news/"
                                            >
                                                News
                                            </a>
                                        </li>
                                    </If>
                                    <If
                                        condition={
                                            getServerConfig()
                                                .skin_show_about_tab
                                        }
                                    >
                                        <li>
                                            <a
                                                target={'_blank'}
                                                href="https://about.cbioportal.org/"
                                            >
                                                About
                                            </a>
                                        </li>
                                    </If>
                                    <If
                                        condition={
                                            getServerConfig()
                                                .skin_show_roadmap_tab
                                        }
                                    >
                                        <li>
                                            <a
                                                target={'_blank'}
                                                href="https://about.cbioportal.org/roadmap"
                                            >
                                                Roadmap
                                            </a>
                                        </li>
                                    </If>
                                    <If
                                        condition={
                                            getServerConfig()
                                                .skin_show_r_matlab_tab ||
                                            getServerConfig()
                                                .skin_show_web_api_tab
                                        }
                                    >
                                        <li>
                                            <a
                                                href={`${
                                                    getLoadConfig().apiRoot
                                                }api`}
                                            >
                                                API Docs
                                            </a>
                                        </li>
                                    </If>
                                    <If
                                        condition={
                                            getServerConfig()
                                                .skin_right_nav_show_twitter
                                        }
                                    >
                                        <li>
                                            <a
                                                target="_blank"
                                                href="https://www.twitter.com/cbioportal"
                                            >
                                                Twitter
                                            </a>
                                        </li>
                                    </If>
                                </ul>
                            </div>
                        </If>
                        <If condition={getServerConfig().skin_footer_show_dev}>
                            <div className="footer-elem">
                                <h3>DEV</h3>
                                <ul>
                                    <li>
                                        <Link to="/software">Software</Link>
                                    </li>
                                    <li>
                                        <a
                                            target="_blank"
                                            href="https://github.com/cBioPortal/"
                                        >
                                            GitHub
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            target="_blank"
                                            href="https://slack.cbioportal.org"
                                        >
                                            Slack
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <div className="footer-elem">
                                <h3>STATUS</h3>
                                <ul>
                                    <li>
                                        <a href="https://status.cbioportal.org">
                                            cBioPortal Status
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </If>
                        <div className="footer-elem">
                            <h3>CONTACT</h3>
                            <ul>
                                <li>
                                    <a
                                        href={`mailto:${
                                            getServerConfig().skin_email_contact
                                        }`}
                                    >
                                        {getServerConfig().skin_email_contact}
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }
    }
}
