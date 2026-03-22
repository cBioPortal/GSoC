import {
    getMyVariantInfoAnnotation,
    getVariantAnnotation,
    Mutation,
    RemoteData,
} from 'cbioportal-utils';
import { MyVariantInfo, VariantAnnotation } from 'genome-nexus-ts-api-client';
import * as React from 'react';

import { errorIcon, loaderIcon } from '../StatusHelpers';

export type MyVariantInfoProps = {
    mutation?: Mutation;
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
    indexedMyVariantInfoAnnotations?: RemoteData<
        { [genomicLocation: string]: MyVariantInfo } | undefined
    >;
    className?: string;
};

export function renderMyVariantInfoContent(
    props: MyVariantInfoProps,
    getContent: (
        myVariantInfo?: MyVariantInfo,
        variantAnnotation?: VariantAnnotation
    ) => JSX.Element
) {
    let content;
    const status = props.indexedMyVariantInfoAnnotations?.status || 'complete';
    const variantAnnotation = props.indexedVariantAnnotations
        ? getVariantAnnotation(
              props.mutation,
              props.indexedVariantAnnotations.result
          )
        : undefined;
    const myVariantInfo = getMyVariantInfoAnnotation(
        props.mutation,
        props.indexedMyVariantInfoAnnotations?.result
    );

    if (status === 'pending') {
        content = loaderIcon();
    } else if (status === 'error') {
        content = errorIcon('Error fetching Genome Nexus annotation');
    } else {
        content = getContent(myVariantInfo, variantAnnotation);
    }

    return <div className={props.className}>{content}</div>;
}

export function getMyVariantInfoData(
    mutation?: Mutation,
    indexedMyVariantInfoAnnotations?: RemoteData<
        { [genomicLocation: string]: MyVariantInfo } | undefined
    >
) {
    return getMyVariantInfoAnnotation(
        mutation,
        indexedMyVariantInfoAnnotations
            ? indexedMyVariantInfoAnnotations.result
            : undefined
    );
}
