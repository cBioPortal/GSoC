import * as React from 'react';
import _ from 'lodash';
import { Mutation } from 'cbioportal-ts-api-client';
import {
    DefaultTooltip,
    TableCellStatusIndicator,
    TableCellStatus,
} from 'cbioportal-frontend-commons';

export default class CancerTypeColumnFormatter {
    public static getData(
        d: Mutation[],
        uniqueSampleKeyToTumorType?: { [uniqueSampleKey: string]: string }
    ): string | null {
        let data: string | null = null;

        if (uniqueSampleKeyToTumorType) {
            data = uniqueSampleKeyToTumorType[d[0].uniqueSampleKey] || null;
        }

        return data;
    }

    public static sortBy(
        d: Mutation[],
        uniqueSampleKeyToTumorType?: { [uniqueSampleKey: string]: string }
    ): string | null {
        const data = CancerTypeColumnFormatter.getData(
            d,
            uniqueSampleKeyToTumorType
        );

        if (data) {
            return data;
        } else {
            return null;
        }
    }

    public static filter(
        d: Mutation[],
        filterStringUpper: string,
        uniqueSampleKeyToTumorType?: { [uniqueSampleKey: string]: string }
    ): boolean {
        const data = CancerTypeColumnFormatter.getData(
            d,
            uniqueSampleKeyToTumorType
        );

        return (
            data !== null && data.toUpperCase().indexOf(filterStringUpper) > -1
        );
    }

    public static isVisible(
        mutations?: Mutation[][],
        uniqueSampleKeyToTumorType?: { [uniqueSampleKey: string]: string }
    ): boolean {
        if (!mutations || !uniqueSampleKeyToTumorType) {
            return false;
        }

        const tumorTypeToSampleId: { [tumorType: string]: string } = {};

        mutations.forEach((d: Mutation[]) => {
            const tumorType = CancerTypeColumnFormatter.getData(
                d,
                uniqueSampleKeyToTumorType
            );

            if (tumorType) {
                tumorTypeToSampleId[tumorType] = d[0].sampleId;
            }
        });

        // only visible if number of distinct tumor type values is greater than 1
        return _.keys(tumorTypeToSampleId).length > 1;
    }

    public static download(
        d: Mutation[],
        uniqueSampleKeyToTumorType?: { [uniqueSampleKey: string]: string }
    ) {
        return (
            CancerTypeColumnFormatter.getData(d, uniqueSampleKeyToTumorType) ||
            ''
        );
    }

    public static render(
        d: Mutation[],
        uniqueSampleKeyToTumorType?: { [uniqueSampleKey: string]: string }
    ) {
        const data = CancerTypeColumnFormatter.getData(
            d,
            uniqueSampleKeyToTumorType
        );

        if (data) {
            return (
                <DefaultTooltip
                    overlay={() => <div style={{ maxWidth: 300 }}>{data}</div>}
                    placement="topLeft"
                >
                    <span>{data || ''}</span>
                </DefaultTooltip>
            );
        } else {
            return (
                <TableCellStatusIndicator
                    status={TableCellStatus.NA}
                    naAlt="Cancer type not available for this sample."
                />
            );
        }
    }
}
