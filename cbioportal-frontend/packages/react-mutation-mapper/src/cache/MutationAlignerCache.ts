import request from 'superagent';

import {
    DEFAULT_MUTATION_ALIGNER_PROXY_URL_TEMPLATE,
    getUrl,
} from '../util/DataFetcherUtils';
import { DefaultStringQueryCache } from './DefaultStringQueryCache';

export function fetchMutationAlignerLink(
    pfamDomainId: string,
    mutationAlignerUrlTemplate: string = DEFAULT_MUTATION_ALIGNER_PROXY_URL_TEMPLATE
): request.SuperAgentRequest {
    return request
        .get(getUrl(mutationAlignerUrlTemplate, { pfamDomainId }))
        .accept('application/json');
}

export class MutationAlignerCache extends DefaultStringQueryCache<string> {
    constructor(private mutationAlignerUrlTemplate?: string) {
        super();
    }

    public fetch(pfamAccession: string): Promise<string> {
        // The code below is only to check if there is data for a specific domain
        // Since mutation aligner is not HTTPS we need to use proxy for that
        // We can enable this check again if we can directly query the API
        // For now we just return the link without checking the existence of the data

        // return fetchMutationAlignerLink(
        //     pfamAccession,
        //     this.mutationAlignerUrlTemplate
        // )
        //     .then(res =>
        //         Promise.resolve(
        //             `http://mutationaligner.org/domains/${res.body.pfamId}`
        //         )
        //     )
        //     .catch(e => Promise.reject(e));

        return Promise.resolve(
            `http://mutationaligner.org/domains/${pfamAccession}`
        );
    }
}
