export type CopyDownloadControlsStyle = 'BUTTON' | 'LINK' | 'QUERY';

export interface ICopyDownloadControlsProps {
    className?: string;
    downloadFilename?: string;
    showCopy?: boolean;
    copyLabel?: string;
    downloadLabel?: string;
    copyMessageDuration?: number;
    showDownload?: boolean;
    controlsStyle?: CopyDownloadControlsStyle;
}

export interface ICopyDownloadInputsProps {
    className?: string;
    showCopy?: boolean;
    showCopyMessage?: boolean;
    showDownload?: boolean;
    copyLabel?: string;
    downloadLabel?: string;
    handleDownload?: () => void;
    handleCopy?: () => void;
    // expose downloadData() to allow button to handle the data on it's own.
    // TECH_DOWNLOADDATA: CopyDownloadButtons.downloadData needs to be async so it can work with either async context (IAsyncCopyDownloadControlsProps) or synchronous context (SimpleCopyDownloadControls)
    downloadDataAsync?: () => Promise<string | undefined>;
}
