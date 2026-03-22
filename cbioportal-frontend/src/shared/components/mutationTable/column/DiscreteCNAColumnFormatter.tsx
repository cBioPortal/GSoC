import * as React from 'react';
import {
    DefaultTooltip,
    TableCellStatusIndicator,
    TableCellStatus,
} from 'cbioportal-frontend-commons';
import 'rc-tooltip/assets/bootstrap_white.css';
import {
    DiscreteCNACacheDataType,
    default as DiscreteCNACache,
} from 'shared/cache/DiscreteCNACache';
import { MolecularProfile, Mutation } from 'cbioportal-ts-api-client';

export default class DiscreteCNAColumnFormatter {
    private static altToFilterString: { [a: number]: string } = {
        '2': 'Amp',
        '1': 'Gain',
        '0': 'Diploid',
        '-1': 'ShallowDel',
        '-2': 'DeepDel',
    };

    public static renderFunction(
        data: Mutation[],
        molecularProfileIdToMolecularProfile: {
            [molecularProfileId: string]: MolecularProfile;
        },
        cache: DiscreteCNACache
    ) {
        const cnaData = DiscreteCNAColumnFormatter.getData(
            data,
            molecularProfileIdToMolecularProfile,
            cache
        );
        return (
            <DefaultTooltip
                placement="left"
                overlay={DiscreteCNAColumnFormatter.getTooltipContents(cnaData)}
                arrowContent={<div className="rc-tooltip-arrow-inner" />}
            >
                {DiscreteCNAColumnFormatter.getTdContents(cnaData)}
            </DefaultTooltip>
        );
    }

    public static getTextValue(
        data: Mutation[],
        molecularProfileIdToMolecularProfile: {
            [molecularProfileId: string]: MolecularProfile;
        },
        cache: DiscreteCNACache
    ): string {
        const tdValue = DiscreteCNAColumnFormatter.getTdValue(
            DiscreteCNAColumnFormatter.getData(
                data,
                molecularProfileIdToMolecularProfile,
                cache
            )
        );
        if (tdValue !== null) {
            return DiscreteCNAColumnFormatter.altToFilterString[tdValue];
        }
        return '';
    }

    public static getSortValue(
        data: Mutation[],
        molecularProfileIdToMolecularProfile: {
            [molecularProfileId: string]: MolecularProfile;
        },
        cache: DiscreteCNACache
    ) {
        return DiscreteCNAColumnFormatter.getTdValue(
            DiscreteCNAColumnFormatter.getData(
                data,
                molecularProfileIdToMolecularProfile,
                cache
            )
        );
    }

    public static filter(
        data: Mutation[],
        molecularProfileIdToMolecularProfile: {
            [molecularProfileId: string]: MolecularProfile;
        },
        cache: DiscreteCNACache,
        filterString: string
    ): boolean {
        const cnaData = DiscreteCNAColumnFormatter.getData(
            data,
            molecularProfileIdToMolecularProfile,
            cache
        );
        if (cnaData && cnaData.data) {
            const value =
                DiscreteCNAColumnFormatter.altToFilterString[
                    cnaData.data.alteration
                ];
            return (
                !!value &&
                value.toLowerCase().indexOf(filterString.toLowerCase()) > -1
            );
        } else {
            return false;
        }
    }

    protected static getData(
        data: Mutation[] | undefined,
        molecularProfileIdToMolecularProfile: {
            [molecularProfileId: string]: MolecularProfile;
        },
        discreteCNACache: DiscreteCNACache
    ): DiscreteCNACacheDataType | null {
        if (!data || data.length === 0 || !discreteCNACache.isActive) {
            return null;
        }

        const sampleId = data[0].sampleId;
        const entrezGeneId = data[0].entrezGeneId;
        const molecularProfile =
            molecularProfileIdToMolecularProfile[data[0].molecularProfileId];
        if (molecularProfile) {
            return discreteCNACache.get({
                sampleId,
                entrezGeneId,
                studyId: molecularProfile.studyId,
            });
        } else {
            return null;
        }
    }

    protected static getTdValue(
        cacheDatum: DiscreteCNACacheDataType | null
    ): number | null {
        if (
            cacheDatum !== null &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data !== null
        ) {
            return cacheDatum.data.alteration;
        } else {
            return null;
        }
    }

    protected static getTdContents(
        cacheDatum: DiscreteCNACacheDataType | null
    ) {
        let status: TableCellStatus | null = null;
        if (
            cacheDatum !== null &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data !== null
        ) {
            const alteration = cacheDatum.data.alteration;
            if (alteration === 2) {
                return (
                    <span
                        style={{
                            color: 'red',
                            textAlign: 'center',
                            fontSize: '12px',
                        }}
                    >
                        <b>Amp</b>
                    </span>
                );
            } else if (alteration === 1) {
                return (
                    <span
                        style={{
                            color: 'red',
                            textAlign: 'center',
                            fontSize: 'smaller',
                        }}
                    >
                        <b>Gain</b>
                    </span>
                );
            } else if (alteration === 0) {
                return (
                    <span
                        style={{
                            color: 'black',
                            textAlign: 'center',
                            fontSize: 'xx-small',
                        }}
                    >
                        Diploid
                    </span>
                );
            } else if (alteration === -1) {
                return (
                    <span
                        style={{
                            color: 'blue',
                            textAlign: 'center',
                            fontSize: 'smaller',
                        }}
                    >
                        <b>ShallowDel</b>
                    </span>
                );
            } else {
                return (
                    <span
                        style={{
                            color: 'blue',
                            textAlign: 'center',
                            fontSize: '12px',
                        }}
                    >
                        <b>DeepDel</b>
                    </span>
                );
            }
        } else if (
            cacheDatum &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data === null
        ) {
            status = TableCellStatus.NA;
        } else if (cacheDatum && cacheDatum.status === 'error') {
            status = TableCellStatus.ERROR;
        } else {
            status = TableCellStatus.NA;
        }
        if (status !== null) {
            return (
                <TableCellStatusIndicator
                    status={status}
                    naAlt="CNA data is not available for this gene."
                />
            );
        }
    }

    protected static getTooltipContents(
        cacheDatum: DiscreteCNACacheDataType | null
    ) {
        const altToText: { [a: number]: string } = {
            '-2': 'Deep deletion',
            '-1': 'Shallow deletion',
            '0': 'Diploid / normal',
            '1': 'Low-level gain',
            '2': 'High-level amplification',
        };
        if (
            cacheDatum &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data !== null
        ) {
            return (
                <div>
                    <span>{altToText[cacheDatum.data.alteration]}</span>
                </div>
            );
        } else if (
            cacheDatum &&
            cacheDatum.status === 'complete' &&
            cacheDatum.data === null
        ) {
            return <span>CNA data is not available for this gene.</span>;
        } else if (cacheDatum && cacheDatum.status === 'error') {
            return <span>Error retrieving data.</span>;
        } else {
            return <span>Querying server for data.</span>;
        }
    }

    public static isVisible(cache: DiscreteCNACache): boolean {
        return cache && cache.isActive;
    }
}
