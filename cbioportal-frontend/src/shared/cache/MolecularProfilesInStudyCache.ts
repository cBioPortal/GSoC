import LazyMobXCache, { AugmentedData } from '../lib/LazyMobXCache';
import {
    MolecularProfile,
    MolecularProfileFilter,
} from 'cbioportal-ts-api-client';
import client from '../api/cbioportalClientInstance';
import _ from 'lodash';

function queryToKey(studyId: string) {
    return studyId;
}

function dataToKey(molecularProfiles: MolecularProfile[], studyId: string) {
    return studyId;
}

async function fetch(
    studyIds: string[]
): Promise<AugmentedData<MolecularProfile[], string>[]> {
    let profiles: MolecularProfile[] = await client.fetchMolecularProfilesUsingPOST(
        {
            molecularProfileFilter: {
                studyIds,
            } as MolecularProfileFilter,
        }
    );

    const profilesByStudy = _.groupBy(profiles, profile => profile.studyId);
    return studyIds.map(studyId => {
        const data = [profilesByStudy[studyId] || []];
        return {
            data,
            meta: studyId,
        };
    });
}

export default class MolecularProfilesInStudyCache extends LazyMobXCache<
    MolecularProfile[],
    string,
    string
> {
    constructor() {
        super(queryToKey, dataToKey, fetch);
    }
}
