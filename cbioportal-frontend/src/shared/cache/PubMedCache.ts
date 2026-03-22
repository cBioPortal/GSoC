import LazyMobXCache from '../lib/LazyMobXCache';
import { AugmentedData } from '../lib/LazyMobXCache';
import request from 'superagent';
import { PubMedRecord } from '../model/PubMedRecord';

export type PubMedRecords = {
    [pmid: string]: PubMedRecord;
};

async function fetch(
    pmids: number[]
): Promise<AugmentedData<PubMedRecord, string>[]> {
    const pubMedRecords: PubMedRecords = await new Promise<PubMedRecords>(
        (resolve, reject) => {
            // TODO better to separate this call to a configurable client
            request
                .post(
                    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json'
                )
                .type('form')
                .send({ id: pmids.join(',') })
                .end((err, res) => {
                    if (!err && res.ok) {
                        const response = JSON.parse(res.text);
                        const result = response.result;
                        const uids = result.uids;
                        const ret: PubMedRecords = {};
                        for (let uid of uids) {
                            ret[uid] = result[uid];
                        }
                        resolve(ret);
                    } else {
                        reject(err);
                    }
                });
        }
    );

    const ret: AugmentedData<PubMedRecord, string>[] = [];
    for (const pmidStr of Object.keys(pubMedRecords)) {
        ret.push({
            data: [pubMedRecords[pmidStr]],
            meta: pmidStr,
        });
    }

    return ret;
}

export default class PubMedCache extends LazyMobXCache<
    PubMedRecord,
    number,
    string
> {
    constructor() {
        super(
            q => q + '',
            (d: any, pmidStr: string) => pmidStr,
            fetch
        );
    }
}
