import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';
import { Mutation } from 'cbioportal-ts-api-client';
import { RemoteData } from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import {
    getHgvscColumnData,
    Hgvsc,
    hgvscDownload,
    hgvscSortValue,
} from 'react-mutation-mapper';

export default class HgvscColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        selectedTranscriptId?: string
    ) {
        return (
            <span style={{ display: 'inline-block', float: 'right' }}>
                <Hgvsc
                    mutation={data[0]}
                    indexedVariantAnnotations={indexedVariantAnnotations}
                    selectedTranscriptId={selectedTranscriptId}
                />
            </span>
        );
    }

    public static download(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        selectedTranscriptId?: string
    ): string {
        return hgvscDownload(
            getHgvscColumnData(
                data[0],
                indexedVariantAnnotations,
                selectedTranscriptId
            )
        );
    }

    public static getSortValue(
        data: Mutation[],
        indexedVariantAnnotations?: RemoteData<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        selectedTranscriptId?: string
    ): number | null {
        return hgvscSortValue(
            getHgvscColumnData(
                data[0],
                indexedVariantAnnotations,
                selectedTranscriptId
            )
        );
    }
}
