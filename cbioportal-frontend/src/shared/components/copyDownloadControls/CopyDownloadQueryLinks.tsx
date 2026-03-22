import * as React from 'react';
import { ICopyDownloadInputsProps } from './ICopyDownloadControls';
import classnames from 'classnames';
import styles from './copyDownloadControls.module.scss';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import VirtualStudy, {
    IVirtualStudyProps,
} from 'pages/studyView/virtualStudy/VirtualStudy';
import { computed } from 'mobx';

export interface ICopyDownloadLinksProps extends ICopyDownloadInputsProps {
    copyLinkRef?: (el: HTMLAnchorElement | null) => void;
    showQuery?: boolean;
    showVirtualStudy?: boolean;
    queryButtonLabel?: string;
    virtualStudyButtonLabel?: string;
    handleQuery?: () => void;
    virtualStudyParams?: IVirtualStudyProps;
}

export class CopyDownloadQueryLinks extends React.Component<
    ICopyDownloadLinksProps,
    {}
> {
    public static defaultProps = {
        className: '',
        copyButtonLabel: 'Copy',
        downloadButtonLabel: 'Download',
        queryButtonLabel: 'Query',
        virtualStudyButtonLabel: 'Virtual Study',
        showCopy: true,
        showDownload: true,
        showQuery: false,
        showVirtualStudy: false,
    };

    @computed
    get showDownload() {
        return this.props.showDownload;
    }

    @computed
    get showCopy() {
        return this.props.showCopy;
    }

    public render() {
        return (
            <span
                className={classnames(
                    styles.downloadTabLinksGroup,
                    this.props.className
                )}
            >
                {this.showCopy && (
                    <a
                        onClick={this.props.handleCopy}
                        ref={this.props.copyLinkRef}
                    >
                        <i className="fa fa-clipboard" />
                        {this.props.copyLabel}
                    </a>
                )}
                {this.showCopy && this.showDownload && <span>|</span>}
                {this.showDownload && (
                    <a onClick={this.props.handleDownload}>
                        <i className="fa fa-cloud-download" />
                        {this.props.downloadLabel}
                    </a>
                )}
                {this.showDownload && this.props.showQuery && <span>|</span>}
                {this.props.showQuery && (
                    <a onClick={this.props.handleQuery}>
                        <i className="fa fa-external-link-square" />
                        {this.props.queryButtonLabel}
                    </a>
                )}
                {this.props.showQuery && this.props.showVirtualStudy && (
                    <span>|</span>
                )}
                {this.props.showVirtualStudy && (
                    <DefaultTooltip
                        trigger={['click']}
                        destroyTooltipOnHide={true}
                        overlay={
                            this.props.virtualStudyParams && (
                                <VirtualStudy
                                    user={this.props.virtualStudyParams.user}
                                    name={this.props.virtualStudyParams.name}
                                    description={
                                        this.props.virtualStudyParams
                                            .description
                                    }
                                    studyWithSamples={
                                        this.props.virtualStudyParams
                                            .studyWithSamples
                                    }
                                    selectedSamples={
                                        this.props.virtualStudyParams
                                            .selectedSamples
                                    }
                                    filter={
                                        this.props.virtualStudyParams.filter
                                    }
                                    attributesMetaSet={
                                        this.props.virtualStudyParams
                                            .attributesMetaSet
                                    }
                                    molecularProfileNameSet={
                                        this.props.virtualStudyParams
                                            .molecularProfileNameSet
                                    }
                                    caseListNameSet={
                                        this.props.virtualStudyParams
                                            .caseListNameSet
                                    }
                                />
                            )
                        }
                        placement="bottom"
                    >
                        <a>
                            <i className="fa fa-pie-chart" />
                            {this.props.virtualStudyButtonLabel}
                        </a>
                    </DefaultTooltip>
                )}
                {this.props.showCopyMessage && (
                    <span className="alert-success">Copied!</span>
                )}
            </span>
        );
    }
}
