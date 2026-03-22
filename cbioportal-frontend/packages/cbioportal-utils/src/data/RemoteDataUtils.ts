import _ from 'lodash';

import { RemoteDataStatus } from '../model/RemoteData';

export function getRemoteDataGroupStatus(
    ...remoteData: { status: RemoteDataStatus }[]
): RemoteDataStatus {
    if (_.some(remoteData, r => r.status === 'error')) {
        return 'error';
    } else if (_.some(remoteData, r => r.status === 'pending')) {
        return 'pending';
    } else {
        return 'complete';
    }
}
