import request from 'superagent';

import { DefaultStringQueryCache } from './DefaultStringQueryCache';

export class DefaultPubMedCache extends DefaultStringQueryCache<any> {
    public async fetch(query: string) {
        const pubMedRecords = await new Promise<any>((resolve, reject) => {
            // TODO duplicate code from cbioportal-frontend
            request
                .post(
                    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json'
                )
                .type('form')
                .send({ id: query })
                .end((err, res) => {
                    if (!err && res.ok) {
                        const response = JSON.parse(res.text);
                        const result = response.result;
                        const uids = result.uids;
                        const ret: any = {};
                        for (let uid of uids) {
                            ret[uid] = result[uid];
                        }
                        resolve(ret);
                    } else {
                        reject(err);
                    }
                });
        });

        return pubMedRecords[query];
    }
}
