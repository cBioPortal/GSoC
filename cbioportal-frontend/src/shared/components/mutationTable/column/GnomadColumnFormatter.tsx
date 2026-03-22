import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';
import { Mutation } from 'cbioportal-ts-api-client';
import {
    getMyVariantInfoAnnotation,
    IMyVariantInfoIndex,
    RemoteData,
} from 'cbioportal-utils';
import { MyVariantInfo, VariantAnnotation } from 'genome-nexus-ts-api-client';
import { Gnomad, gnomadDownload, gnomadSortValue } from 'react-mutation-mapper';

export default class GnomadColumnFormatter {
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
            <span data-test="gnomad-column" data-test2={data[0].sampleId}>
                <Gnomad
                    className=""
                    mutation={data[0]}
                    indexedVariantAnnotations={indexedVariantAnnotations}
                    indexedMyVariantInfoAnnotations={
                        indexedMyVariantInfoAnnotations
                    }
                />
            </span>
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

    public static getSortValue(
        data: Mutation[],
        indexedMyVariantInfoAnnotations?: RemoteData<
            IMyVariantInfoIndex | undefined
        >
    ): number | null {
        const myVariantInfo = GnomadColumnFormatter.getData(
            data,
            indexedMyVariantInfoAnnotations
        );

        return gnomadSortValue(myVariantInfo);
    }

    public static download(
        data: Mutation[],
        indexedMyVariantInfoAnnotations?: RemoteData<
            IMyVariantInfoIndex | undefined
        >
    ): string {
        const myVariantInfo = GnomadColumnFormatter.getData(
            data,
            indexedMyVariantInfoAnnotations
        );

        return gnomadDownload(myVariantInfo);
    }
}
