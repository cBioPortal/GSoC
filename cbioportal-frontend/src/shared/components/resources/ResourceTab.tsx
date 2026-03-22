import * as React from 'react';
import { observer } from 'mobx-react';
import FeatureTitle from '../featureTitle/FeatureTitle';
import WindowStore from '../window/WindowStore';
import { action, computed, makeObservable } from 'mobx';
import styles from './styles.module.scss';
import classNames from 'classnames';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { ResourceData } from 'cbioportal-ts-api-client';
import { buildPDFUrl, getFileExtension } from './ResourcesTableUtils';
import IFrameLoader from 'shared/components/iframeLoader/IFrameLoader';
import { getServerConfig } from 'config/config';
import { CUSTOM_URL_TRANSFORMERS } from 'shared/components/resources/customResourceHelpers';

export interface IResourceTabProps {
    resourceData: ResourceData[];
    urlWrapper: {
        setResourceUrl: (resourceUrl: string) => void;
        query: { resourceUrl?: string };
    };
}

@observer
export default class ResourceTab extends React.Component<
    IResourceTabProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @computed get iframeHeight() {
        return WindowStore.size.height - 275;
    }

    @computed get currentResourceIndex() {
        if (!this.props.urlWrapper.query.resourceUrl) {
            return 0;
        } else {
            const index = this.props.resourceData.findIndex(
                d => d.url === this.props.urlWrapper.query.resourceUrl
            );
            if (index === -1) {
                return 0;
            } else {
                return index;
            }
        }
    }

    @computed get currentResourceDatum() {
        return this.props.resourceData[this.currentResourceIndex];
    }

    @action.bound
    private goToNextDatum() {
        if (!this.isLastDatum) {
            this.props.urlWrapper.setResourceUrl(
                this.props.resourceData[this.currentResourceIndex + 1].url
            );
        }
    }

    @action.bound
    private goToPrevDatum() {
        if (!this.isFirstDatum) {
            this.props.urlWrapper.setResourceUrl(
                this.props.resourceData[this.currentResourceIndex - 1].url
            );
        }
    }

    @computed get isFirstDatum() {
        return this.currentResourceIndex === 0;
    }

    @computed get isLastDatum() {
        return this.currentResourceIndex === this.props.resourceData.length - 1;
    }

    @computed get httpIframeWithHttpsPortal() {
        return (
            getBrowserWindow().location.protocol === 'https:' &&
            new URL(this.currentResourceDatum.url).protocol === 'http:'
        );
    }

    @computed get iframeUrl() {
        const fileExtension = getFileExtension(this.currentResourceDatum.url);
        let url = this.currentResourceDatum.url;
        switch (fileExtension) {
            case 'pdf':
                url = buildPDFUrl(this.currentResourceDatum.url);
                break;
        }

        try {
            // apply instance specific transformation on url (e.g. to keep state)
            CUSTOM_URL_TRANSFORMERS.forEach(config => {
                if (config.test(this.currentResourceDatum) === true) {
                    url = config.transformer(this.currentResourceDatum);
                }
            });
        } catch (ex) {
            console.error(ex);
            // it's just some configuration failure so let things proceed
            // with unprocessed url
        }

        return url;
    }

    render() {
        const multipleData = this.props.resourceData.length > 1;

        return (
            <div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <FeatureTitle
                        title={
                            this.currentResourceDatum.resourceDefinition
                                .displayName
                        }
                        isLoading={false}
                        className="pull-left"
                        style={{ marginBottom: 10 }}
                    />
                    <p style={{ marginLeft: 10 }}>
                        {this.currentResourceDatum.sampleId
                            ? this.currentResourceDatum.sampleId
                            : this.currentResourceDatum.patientId}
                        {this.currentResourceDatum.resourceDefinition
                            .description &&
                            ` | ${this.currentResourceDatum.resourceDefinition.description}`}
                    </p>
                </div>
                <div
                    style={{
                        width: '100%',
                        height: this.iframeHeight,
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    {multipleData && (
                        <div
                            className={classNames(styles.carouselButton, {
                                [styles.active]: !this.isFirstDatum,
                            })}
                            onClick={this.goToPrevDatum}
                        >
                            <i
                                style={{ marginRight: 15 }}
                                className="fa fa-4x fa-chevron-left"
                            />
                        </div>
                    )}
                    {this.httpIframeWithHttpsPortal ? (
                        <div>
                            <span>
                                We can't show this URL in the portal. Please use
                                the link below:
                            </span>
                            <br />
                            <a href={this.currentResourceDatum.url}>
                                {this.currentResourceDatum.url}
                            </a>
                        </div>
                    ) : (
                        <IFrameLoader
                            url={this.iframeUrl}
                            height={this.iframeHeight}
                            width={'100%'}
                        />
                    )}
                    {multipleData && (
                        <div
                            className={classNames(styles.carouselButton, {
                                [styles.active]: !this.isLastDatum,
                            })}
                            onClick={this.goToNextDatum}
                        >
                            <i
                                style={{ marginLeft: 15 }}
                                className="fa fa-4x fa-chevron-right"
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
