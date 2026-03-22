import LazyMemo from './LazyMemo';
import { SyntheticEvent } from 'react';

function shallowAlphabeticalStringify(obj: any) {
    return JSON.stringify(obj, Object.keys(obj).sort());
}

export default function MemoizedHandlerFactory<Params, Target>(
    handler: (e: React.MouseEvent<Target>, params: Params) => void,
    key: (params: Params) => string = shallowAlphabeticalStringify
) {
    const memo = new LazyMemo<Params, (e: React.MouseEvent<Target>) => void>(
        key,
        (params: Params) => {
            return (e: React.MouseEvent<Target>) => handler(e, params);
        }
    );

    return (params: Params) => memo.get(params);
}
