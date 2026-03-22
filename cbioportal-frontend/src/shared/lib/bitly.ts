import request from 'superagent';
import { getEncodedRedirectUrl } from '../api/urls';

export const EncodedURLParam = 'encodedURL';

export async function getBitlyShortenedUrl(
    url: string,
    bitlyAccessToken?: string | null
): Promise<string | undefined> {
    // we have to pass through a base64 encoded URL, and decode it, because bitly messes with URI-encoded URL params
    //  in ways that can break the page (for example, if we have a URI-encoded square bracket in a query param value,
    //  bitly decodes it, thus creating an invalid URL.
    const encodedRedirectUrl = getEncodedRedirectUrl(url);

    let bitlyResponse;

    // now lets shorten with bityly, if we have key
    // WE ARE DISABLING BITLY PENDING DISCUSSION
    if (bitlyAccessToken) {
        try {
            bitlyResponse = await request
                .post('https://api-ssl.bitly.com/v4/bitlinks')
                .send({
                    long_url: encodedRedirectUrl,
                })
                .set({
                    Authorization: `Bearer ${bitlyAccessToken}`,
                });
        } catch (ex) {
            // fail silently.  we can just reutrn sessionUrl without shortening
        }
    }

    if (bitlyResponse && bitlyResponse.body && bitlyResponse.body.link) {
        return bitlyResponse.body.link as string;
    } else {
        return undefined;
    }
}
