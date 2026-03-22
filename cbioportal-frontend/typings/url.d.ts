declare module 'url' {
    export type QueryParams = {
        [key: string]: undefined | null | string | string[];
    };

    export interface URLParts {
        auth: string | null;
        hash: string | null;
        host: string | null;
        hostname: string | null;
        href: string;
        path: string | null;
        pathname: string | null;
        port: string | null;
        protocol: string | null;
        query: string | QueryParams | null;
        search: string | null;
        slashes: true | null;
    }

    export type URLFormatParams = {
        auth?: string;
        hash?: string;
        pathname?: string;
        protocol?: string;
    } & ({ host?: string } | { hostname?: string; port?: string }) &
        ({ search?: string } | { query?: QueryParams });

    export function parse(
        urlStr: string,
        parseQueryString: true,
        slashesDenoteHost?: boolean
    ): URLParts & { query: QueryParams; search: string };
    export function parse(
        urlStr: string,
        parseQueryString?: false,
        slashesDenoteHost?: boolean
    ): URLParts & { query: string | null };

    export function format(urlObj: URLFormatParams): string;

    export function resolve(from: string, to: string): string;
}
