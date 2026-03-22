import * as React from 'react';
import LazyLoadedTableCell from 'shared/lib/LazyLoadedTableCell';
import { Mutation } from 'cbioportal-ts-api-client';
import CancerTypeCache from '../../../cache/CancerTypeCache';
import { CacheData } from '../../../lib/LazyMobXCache';

export default class CancerTypeColumnFormatter {
    public static getData(
        d: Mutation[],
        studyId?: string,
        cancerTypeCache?: CancerTypeCache,
        studyCancerTypeMap?: { [studyId: string]: string }
    ): CacheData<{ value: string }> | null {
        if (cancerTypeCache && studyId) {
            let cacheDatum: CacheData<{
                value: string;
            }> | null = cancerTypeCache.get({
                entityId: d[0].sampleId,
                studyId,
            });

            if (
                cacheDatum &&
                cacheDatum.status === 'complete' &&
                cacheDatum.data === null
            ) {
                // If no clinical data, use study cancer type if we have it
                if (studyCancerTypeMap) {
                    const cancerType = studyCancerTypeMap[studyId];
                    if (cancerType) {
                        cacheDatum = {
                            status: 'complete',
                            data: {
                                value: cancerType,
                            },
                        };
                    }
                }
            }
            return cacheDatum;
        } else {
            return {
                status: 'error',
                data: null,
            };
        }
    }

    public static makeRenderFunction(
        studyId?: string,
        cancerTypeCache?: CancerTypeCache,
        studyCancerTypeMap?: { [studyId: string]: string }
    ) {
        return LazyLoadedTableCell<Mutation[], { value: string }>(
            (d: Mutation[]) => {
                return CancerTypeColumnFormatter.getData(
                    d,
                    studyId,
                    cancerTypeCache,
                    studyCancerTypeMap
                );
            },
            (t: { value: string }) => <span>{t.value}</span>,
            'Cancer type not available for this sample.'
        );
    }

    public static sortBy(
        d: Mutation[],
        studyId?: string,
        cancerTypeCache?: CancerTypeCache
    ) {
        let ret;
        if (cancerTypeCache && studyId) {
            const cacheDatum = cancerTypeCache.get({
                entityId: d[0].sampleId,
                studyId: studyId,
            });
            if (cacheDatum && cacheDatum.data) {
                ret = cacheDatum.data.value;
            } else {
                ret = null;
            }
        } else {
            ret = null;
        }
        return ret;
    }

    public static filter(
        d: Mutation[],
        filterStringUpper: string,
        studyId?: string,
        cancerTypeCache?: CancerTypeCache,
        studyCancerTypeMap?: { [studyId: string]: string }
    ): boolean {
        const cacheDatum = CancerTypeColumnFormatter.getData(
            d,
            studyId,
            cancerTypeCache,
            studyCancerTypeMap
        );

        return (
            cacheDatum !== null &&
            cacheDatum.data !== null &&
            cacheDatum.data.value.toUpperCase().indexOf(filterStringUpper) > -1
        );
    }
}
