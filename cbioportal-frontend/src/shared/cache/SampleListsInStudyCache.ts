import client from '../api/cbioportalClientInstance';
import { SampleList } from 'cbioportal-ts-api-client';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';

async function fetch(studyId: string) {
    return await client.getAllSampleListsInStudyUsingGET({
        studyId: studyId,
        projection: 'DETAILED',
    });
}

export default class SampleListsInStudyCache extends MobxPromiseCache<
    string,
    SampleList[]
> {
    constructor() {
        super(
            q => ({
                invoke: () => fetch(q),
            }),
            q => q
        );
    }
}
