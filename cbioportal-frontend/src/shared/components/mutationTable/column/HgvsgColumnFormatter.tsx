import * as React from 'react';
import { Mutation } from 'cbioportal-ts-api-client';
import { getHgvsgColumnData, Hgvsg } from 'react-mutation-mapper';

export default class HgvsgColumnFormatter {
    public static renderFunction(
        data: Mutation[],
        generateGenomeNexusHgvsgUrl: (hgvsg: string) => string
    ) {
        return (
            <Hgvsg
                mutation={data[0]}
                constructHref={generateGenomeNexusHgvsgUrl}
            />
        );
    }

    public static getData(mutation: Mutation): string | null {
        return getHgvsgColumnData(mutation) || null;
    }

    public static download(data: Mutation[]): string {
        return HgvsgColumnFormatter.getData(data[0]) || '';
    }

    public static getSortValue(data: Mutation[]): string | null {
        return HgvsgColumnFormatter.getData(data[0]);
    }
}
