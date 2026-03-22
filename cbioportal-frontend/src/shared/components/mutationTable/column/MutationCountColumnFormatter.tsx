import * as React from 'react';
import LazyLoadedTableCell from 'shared/lib/LazyLoadedTableCell';
import { Mutation, ClinicalData } from 'cbioportal-ts-api-client';
import MutationCountCache from '../../../cache/MutationCountCache';
import MutationTable, { IMutationTableProps } from '../MutationTable';
import generalStyles from './styles.module.scss';

export default class MutationCountColumnFormatter {
    public static makeRenderFunction<P extends IMutationTableProps>(
        table: MutationTable<P>
    ) {
        return LazyLoadedTableCell(
            (d: Mutation[]) => {
                const mutationCountCache: MutationCountCache | undefined =
                    table.props.mutationCountCache;
                if (mutationCountCache) {
                    return mutationCountCache.get({
                        sampleId: d[0].sampleId,
                        studyId: d[0].studyId,
                    });
                } else {
                    return {
                        status: 'error',
                        data: null,
                    };
                }
            },
            (t: ClinicalData) => (
                <div className={generalStyles['integer-data']}>{t.value}</div>
            ),
            'Mutation count not available for this sample.'
        );
    }

    public static sortBy(
        d: Mutation[],
        mutationCountCache?: MutationCountCache
    ): number | null {
        let ret: number | null = null;
        if (mutationCountCache) {
            const cacheDatum = mutationCountCache.get({
                sampleId: d[0].sampleId,
                studyId: d[0].studyId,
            });
            if (cacheDatum && cacheDatum.data) {
                ret = parseInt(cacheDatum.data.value);
            } else {
                ret = null;
            }
        } else {
            ret = null;
        }
        return ret;
    }

    public static download(
        d: Mutation[],
        mutationCountCache?: MutationCountCache
    ) {
        const sortValue = MutationCountColumnFormatter.sortBy(
            d,
            mutationCountCache
        );

        return sortValue ? `${sortValue}` : '';
    }
}
