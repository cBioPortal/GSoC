import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';

import { Mutation } from 'cbioportal-ts-api-client';
import {
    getMyVariantInfoAnnotation,
    IMyVariantInfoIndex,
    RemoteData,
} from 'cbioportal-utils';
import { MyVariantInfo, VariantAnnotation } from 'genome-nexus-ts-api-client';
import { Dbsnp, dbsnpDownload, dbsnpSortValue } from 'react-mutation-mapper';

export default class DbsnpColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        indexedMyVariantInfoAnnotations?: RemoteData<
            IMyVariantInfoIndex | undefined
        >
    ) {
        return (
            <div data-test="dbsnp-data">
                <Dbsnp
                    className=""
                    mutation={data[0]}
                    indexedVariantAnnotations={indexedVariantAnnotations}
                    indexedMyVariantInfoAnnotations={
                        indexedMyVariantInfoAnnotations
                    }
                />
            </div>
        );
    }

    public static getData(
        data: Mutation[],
        indexedMyVariantInfoAnnotations?: RemoteData<
            IMyVariantInfoIndex | undefined
        >
    ): MyVariantInfo | undefined {
        return getMyVariantInfoAnnotation(
            data[0],
            indexedMyVariantInfoAnnotations
                ? indexedMyVariantInfoAnnotations.result
                : undefined
        );
    }

    public static download(
        data: Mutation[],
        indexedMyVariantInfoAnnotations?: RemoteData<
            IMyVariantInfoIndex | undefined
        >
    ): string {
        const myVariantInfo = DbsnpColumnFormatter.getData(
            data,
            indexedMyVariantInfoAnnotations
        );

        return dbsnpDownload(myVariantInfo);
    }

    public static getSortValue(
        data: Mutation[],
        indexedMyVariantInfoAnnotations?: RemoteData<
            IMyVariantInfoIndex | undefined
        >
    ): string | null {
        const myVariantInfo = DbsnpColumnFormatter.getData(
            data,
            indexedMyVariantInfoAnnotations
        );

        return dbsnpSortValue(myVariantInfo);
    }

    public static filter(
        d: Mutation[],
        filterStringUpper: string,
        indexedMyVariantInfoAnnotations?: RemoteData<
            IMyVariantInfoIndex | undefined
        >
    ): boolean {
        const sortValue = DbsnpColumnFormatter.getSortValue(
            d,
            indexedMyVariantInfoAnnotations
        );

        return (
            sortValue !== null &&
            sortValue.toUpperCase().includes(filterStringUpper)
        );
    }
}
