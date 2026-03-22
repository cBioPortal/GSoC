export type RemoteDataStatus = 'pending' | 'error' | 'complete';

export interface RemoteData<T> {
    status: RemoteDataStatus;
    result: T;
    isComplete: boolean;
    isPending: boolean;
    isError: boolean;
}
