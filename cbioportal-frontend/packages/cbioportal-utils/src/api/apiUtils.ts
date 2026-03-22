import { Buffer } from 'buffer';
import _ from 'lodash';
import * as request from 'superagent';
// import {getServerConfig} from "../../../../src/config/config";
// import {getBrowserWindow} from "cbioportal-frontend-commons";

const BASE64_ENCODING = 'base64';
const UTF8_ENCODING = 'utf8';

export async function chunkCalls<ParamData, ResponseData>(
    callback: (chunk: ParamData[]) => Promise<ResponseData[]>,
    paramData: ParamData[],
    chunkSize: number
): Promise<ResponseData[]> {
    const chunks = _.chunk(paramData, chunkSize);
    const proms = chunks.map(callback);
    return _.flatten(await Promise.all(proms));
}

function monkify(obj: any) {
    return Buffer.from(_.isString(obj) ? obj : JSON.stringify(obj)).toString(
        BASE64_ENCODING
    );
}

function unmonkify(base64String: string) {
    return JSON.parse(
        Buffer.from(base64String, BASE64_ENCODING).toString(UTF8_ENCODING)
    );
}

function addCustomHeaders(
    headers: any,
    customHeaders?: { [key: string]: string }
) {
    if (!_.isEmpty(customHeaders)) {
        _.forEach(customHeaders, (value, key) => {
            headers[key] = value;
        });
    }
}

export function addCustomHeadersForApiRequests(
    apiClient: any,
    domain: string,
    customHeaders?: { [key: string]: string }
) {
    const oldRequestFunc = apiClient.prototype.request;

    apiClient.prototype.request = (
        method: string,
        url: string,
        body: any,
        headers: any,
        queryParameters: any,
        form: any,
        reject: any,
        resolve: any,
        errorHandlers: any[]
    ) => {
        addCustomHeaders(headers, customHeaders);

        oldRequestFunc(
            method,
            url,
            body,
            headers,
            queryParameters,
            form,
            reject,
            resolve,
            errorHandlers
        );
    };
}

export function maskApiRequests(
    apiClient: any,
    domain: string,
    customHeaders?: { [key: string]: string }
) {
    const oldRequestFunc = apiClient.prototype.request;

    apiClient.prototype.request = (
        method: string,
        url: string,
        body: any,
        headers: any,
        queryParameters: any,
        form: any,
        reject: any,
        resolve: any,
        errorHandlers: any[]
    ) => {
        const path = url.replace(domain, '');
        const maskedPath = monkify(path);
        const maskedUrl = `${domain}/${maskedPath}`;
        const maskedBody = body ? monkify(body) : body;
        const maskedParams = _.reduce(
            queryParameters,
            (acc, val, key) => {
                acc[monkify(key)] = monkify(val);
                return acc;
            },
            {} as any
        );

        const resolvePossiblyEncodedResponse = (
            res?: request.Response,
            ...args: any[]
        ) => {
            if (res && res.body) {
                try {
                    res.body = unmonkify(res.body);
                } catch (e) {
                    // failed decoding: either the response is not encoded, or there is a server side error
                }
            }

            resolve(res, ...args);
        };

        addCustomHeaders(headers, customHeaders);

        oldRequestFunc(
            method,
            maskedUrl,
            maskedBody,
            headers,
            maskedParams,
            form,
            reject,
            resolvePossiblyEncodedResponse,
            errorHandlers
        );
    };
}
