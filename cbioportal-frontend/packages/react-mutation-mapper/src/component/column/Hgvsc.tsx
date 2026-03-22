import { observer } from 'mobx-react';
import * as React from 'react';

import { defaultSortMethod, Mutation, RemoteData } from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';

import { getHgvscColumnData } from './HgvsHelper';

type HgvscProps = {
    mutation: Mutation;
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
    selectedTranscriptId?: string;
};

export function download(hgvsc?: string | null): string {
    return hgvsc || '';
}

export function sortValue(hgvsc?: string | null): number | null {
    return hgvsc ? parseInt(hgvsc.split('c.')[1]) : null;
}

export function hgvscSortMethod(a: string | null, b: string | null) {
    return defaultSortMethod(sortValue(a), sortValue(b));
}

@observer
export default class Hgvsc extends React.Component<HgvscProps, {}> {
    get hgvsc() {
        return getHgvscColumnData(
            this.props.mutation,
            this.props.indexedVariantAnnotations,
            this.props.selectedTranscriptId
        );
    }

    public render() {
        return <div>{this.hgvsc}</div>;
    }
}
