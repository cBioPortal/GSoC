import { default as URL } from 'url';

export type QueryParams = {
    [key: string]: undefined | null | string | string[];
};

export type BuildUrlParams = {
    pathname: string;
    query?: QueryParams;
    hash?: string;
};

export function getNCBIlink(
    pathnameOrParams?: BuildUrlParams | string
): string {
    let params =
        typeof pathnameOrParams === 'string'
            ? { pathname: pathnameOrParams }
            : pathnameOrParams;
    return URL.format({
        protocol: 'https',
        host: 'www.ncbi.nlm.nih.gov',
        ...params,
    });
}
