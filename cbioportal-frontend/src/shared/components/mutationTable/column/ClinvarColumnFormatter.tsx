import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';

import { Mutation } from 'cbioportal-ts-api-client';
import { MyVariantInfo, VariantAnnotation } from 'genome-nexus-ts-api-client';
import {
    getMyVariantInfoAnnotation,
    IMyVariantInfoIndex,
    RemoteData,
} from 'cbioportal-utils';
import {
    ClinvarInterpretation,
    clinvarSortValue,
    clinvarDownload,
    getClinvarData,
} from 'react-mutation-mapper';

export default class ClinvarColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >
    ) {
        return (
            <div data-test="clinvar-data">
                <ClinvarInterpretation
                    mutation={data[0]}
                    indexedVariantAnnotations={indexedVariantAnnotations}
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
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >
    ): string {
        return clinvarDownload(
            getClinvarData(data[0], indexedVariantAnnotations)
        );
    }

    public static getSortValue(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >
    ): string | null {
        return clinvarSortValue(
            getClinvarData(data[0], indexedVariantAnnotations)
        );
    }
}
