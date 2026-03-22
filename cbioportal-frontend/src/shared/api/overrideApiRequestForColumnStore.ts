import _ from 'lodash';
import pako from 'pako';
import { getServerConfig } from 'config/config';

export function overrideApiRequestForColumnStore(client: any) {
    const oldRequest = client.request;
    client.request = function(...args: any) {
        args[1] = args[1].replace(/column-store\/api/, 'column-store');
        // Compress request body if enabled
        if (getServerConfig().enable_request_body_gzip_compression) {
            if (args[0] === 'POST' && !_.isEmpty(args[2])) {
                let bodyString = JSON.stringify(args[2]);
                if (bodyString.length > 10000) {
                    args[3]['Content-Encoding'] = 'gzip';
                    args[2] = pako.gzip(bodyString).buffer;
                } else {
                    // Store stringified body, so that stringify only runs once.
                    args[2] = bodyString;
                }
            }
        }
        return oldRequest.apply(this, args);
    };
}

export default overrideApiRequestForColumnStore;
