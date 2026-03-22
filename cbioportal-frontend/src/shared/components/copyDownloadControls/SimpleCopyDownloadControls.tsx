import * as React from 'react';
import fileDownload from 'react-file-download';
import { observer } from 'mobx-react';
import { observable, makeObservable } from 'mobx';
import { CopyDownloadLinks } from './CopyDownloadLinks';
import { CopyDownloadButtons } from './CopyDownloadButtons';
import { ICopyDownloadControlsProps } from './ICopyDownloadControls';
import { CopyDownloadQueryLinks } from './CopyDownloadQueryLinks';
const Clipboard = require('clipboard');

export interface ISimpleCopyDownloadControlsProps
    extends ICopyDownloadControlsProps {
    downloadData?: () => string;
    showQuery?: boolean;
    showVirtualStudy?: boolean;
    handleQuery?: () => void;
    virtualStudyParams?: any;
    containerId?: string | undefined;
}

@observer
export class SimpleCopyDownloadControls extends React.Component<
    ISimpleCopyDownloadControlsProps,
    {}
> {
    public static defaultProps: ISimpleCopyDownloadControlsProps = {
        className: '',
        showCopy: true,
        copyMessageDuration: 3000,
        showDownload: true,
        showQuery: true,
        showVirtualStudy: true,
        copyLabel: 'Copy',
        downloadLabel: 'Download',
        downloadFilename: 'data.tsv',
        controlsStyle: 'LINK',
    };

    @observable
    private showCopyMessage = false;

    constructor(props: ISimpleCopyDownloadControlsProps) {
        super(props);

        makeObservable(this);

        this.handleDownload = this.handleDownload.bind(this);
        this.copyLinkRef = this.copyLinkRef.bind(this);
        this.copyButtonRef = this.copyButtonRef.bind(this);
        this.handleAfterCopy = this.handleAfterCopy.bind(this);
    }

    public render() {
        if (this.props.controlsStyle === 'LINK') {
            return (
                <CopyDownloadLinks
                    className={this.props.className}
                    handleDownload={this.handleDownload}
                    copyLinkRef={this.copyLinkRef}
                    handleCopy={this.handleAfterCopy}
                    copyLabel={this.props.copyLabel}
                    downloadLabel={this.props.downloadLabel}
                    showCopyMessage={this.showCopyMessage}
                />
            );
        } else if (this.props.controlsStyle === 'QUERY') {
            return (
                <CopyDownloadQueryLinks
                    className={this.props.className}
                    handleDownload={this.handleDownload}
                    copyLinkRef={this.copyLinkRef}
                    handleCopy={this.handleAfterCopy}
                    copyLabel={this.props.copyLabel}
                    downloadLabel={this.props.downloadLabel}
                    showCopyMessage={this.showCopyMessage}
                    showQuery={this.props.showQuery}
                    handleQuery={this.props.handleQuery}
                    showVirtualStudy={this.props.showVirtualStudy}
                    virtualStudyParams={this.props.virtualStudyParams}
                />
            );
        } else {
            return (
                <CopyDownloadButtons
                    className={this.props.className}
                    handleDownload={this.handleDownload}
                    downloadDataAsync={this.downloadDataAsPromise}
                    copyButtonRef={this.copyButtonRef}
                    handleCopy={this.handleAfterCopy}
                    showCopyMessage={this.showCopyMessage}
                    showCopy={this.props.showCopy}
                    showDownload={this.props.showDownload}
                />
            );
        }
    }

    /**
     * Wrapper around downloadData() to return as a Promise<string> for ICopyDownloadButtonsProps
     * See TECH_DOWNLOADDATA
     */
    private downloadDataAsPromise = (): Promise<string | undefined> => {
        const data = this.props.downloadData?.();
        return Promise.resolve(data);
    };

    private handleDownload() {
        if (this.props.downloadData) {
            fileDownload(
                this.props.downloadData(),
                this.props.downloadFilename
            );
        }
    }

    private copyLinkRef(el: HTMLAnchorElement | null) {
        this.handleCopyRef(el);
    }

    private copyButtonRef(el: HTMLButtonElement | null) {
        this.handleCopyRef(el);
    }

    private handleCopyRef(el: HTMLElement | null) {
        if (el) {
            const { downloadData, containerId } = this.props;
            const options = containerId
                ? {
                      text: downloadData,
                      container: document.getElementById(containerId), // point to the exact container of copy control if it is inside a modal dialog
                  }
                : {
                      text: downloadData,
                  };
            new Clipboard(el, options);
        }
    }

    private handleAfterCopy() {
        this.showCopyMessage = true;

        setTimeout(() => {
            this.showCopyMessage = false;
        }, this.props.copyMessageDuration);
    }
}
