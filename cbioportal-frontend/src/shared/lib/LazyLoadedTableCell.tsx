import * as React from 'react';
import { CacheData } from './LazyMobXCache';
import {
    TableCellStatus,
    TableCellStatusIndicator,
} from 'cbioportal-frontend-commons';
export default function LazyLoadedTableCell<D, T, M = any>(
    getCacheData: (d: D) => CacheData<T, M> | null,
    render: (t: T, d?: D) => JSX.Element,
    naAlt?: string
): (d: D) => JSX.Element {
    return (d: D) => {
        const cacheData: CacheData<T, M> | null = getCacheData(d);
        if (cacheData === null) {
            return (
                <TableCellStatusIndicator status={TableCellStatus.LOADING} />
            );
        } else if (cacheData.status === 'error') {
            return <TableCellStatusIndicator status={TableCellStatus.ERROR} />;
        } else if (cacheData.data === null) {
            return (
                <TableCellStatusIndicator
                    status={TableCellStatus.NA}
                    naAlt={naAlt}
                />
            );
        } else {
            return render(cacheData.data, d);
        }
    };
}
