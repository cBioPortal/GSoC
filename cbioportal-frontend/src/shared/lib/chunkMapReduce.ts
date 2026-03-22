import _ from 'lodash';

export default async function chunkMapReduce<T, U>(
    arr: T[],
    chunkFunc: (chunk: T[]) => Promise<U[]>,
    chunkSize: number
): Promise<U[]> {
    const chunks = _.chunk(arr, chunkSize);
    const promises = chunks.map(chunkFunc);
    return _.flatten(await Promise.all(promises));
}
