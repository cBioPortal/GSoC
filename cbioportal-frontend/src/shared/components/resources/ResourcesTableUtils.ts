import { ResourceData, Sample } from 'cbioportal-ts-api-client';

export type ResourcesTableRowData = {
    sample: Sample;
    resources: ResourceData[];
};

const FILE_EXT_REGEX = /.+\.(.+)/;

export function getFileExtension(url: string) {
    // TODO: extract file type from URL
    const urlObj = new URL(url);
    const pathName = urlObj.pathname;
    if (!pathName) {
        return undefined;
    }
    const regexMatch = pathName.match(FILE_EXT_REGEX);
    if (!regexMatch) {
        return undefined;
    }

    return regexMatch[1].toLowerCase();
}

export function buildPDFUrl(url: string): string {
    return `https://docs.google.com/viewerng/viewer?url=${url}?pid=explorer&efh=false&a=v&chrome=false&embedded=true`;
}
