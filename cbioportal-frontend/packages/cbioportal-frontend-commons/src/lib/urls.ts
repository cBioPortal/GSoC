import { default as URL, QueryParams } from 'url';

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
