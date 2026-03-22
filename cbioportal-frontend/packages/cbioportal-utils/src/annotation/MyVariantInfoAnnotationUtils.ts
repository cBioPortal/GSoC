import { MyVariantInfo, VariantAnnotation } from 'genome-nexus-ts-api-client';

import { Mutation } from '../model/Mutation';
import { IMyVariantInfoIndex } from '../model/MyVariantInfo';
import {
    extractGenomicLocation,
    genomicLocationString,
} from '../mutation/MutationUtils';

export function getMyVariantInfoAnnotationsFromIndexedVariantAnnotations(indexedVariantAnnotations?: {
    [genomicLocation: string]: VariantAnnotation;
}): IMyVariantInfoIndex {
    const indexedMyVariantAnnotations: IMyVariantInfoIndex = {};

    if (indexedVariantAnnotations) {
        Object.keys(indexedVariantAnnotations).forEach(genomicLocation => {
            const myVariantInfo = getMyVariantInfoFromVariantAnnotation(
                indexedVariantAnnotations[genomicLocation]
            );
            if (myVariantInfo) {
                indexedMyVariantAnnotations[genomicLocation] = myVariantInfo;
            }
        });
    }

    return indexedMyVariantAnnotations;
}

export function getMyVariantInfoFromVariantAnnotation(
    annotation?: VariantAnnotation
): MyVariantInfo | undefined {
    return annotation && annotation.my_variant_info
        ? annotation.my_variant_info.annotation
        : undefined;
}

export function getMyVariantInfoAnnotation(
    mutation?: Mutation,
    indexedMyVariantInfoAnnotations?: {
        [genomicLocation: string]: MyVariantInfo;
    }
): MyVariantInfo | undefined {
    let myVariantInfo: MyVariantInfo | undefined;

    if (mutation && indexedMyVariantInfoAnnotations) {
        const genomicLocation = extractGenomicLocation(mutation);
        const key = genomicLocation
            ? genomicLocationString(genomicLocation)
            : undefined;

        if (key) {
            myVariantInfo = indexedMyVariantInfoAnnotations[key];
        }
    }

    return myVariantInfo;
}

export function getDbsnpRsId(myVariantInfo?: MyVariantInfo): string | null {
    if (myVariantInfo && myVariantInfo.dbsnp && myVariantInfo.dbsnp.rsid) {
        return myVariantInfo.dbsnp.rsid;
    } else {
        return null;
    }
}
