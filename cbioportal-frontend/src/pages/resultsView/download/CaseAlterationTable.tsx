import { observer } from 'mobx-react';
import * as React from 'react';
import _ from 'lodash';
import {
    default as LazyMobXTable,
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import {
    OQLLineFilterOutput,
    UnflattenedOQLLineFilterOutput,
    MergedTrackLineFilterOutput,
} from 'shared/lib/oql/oqlfilter';
import { StudyLink } from 'shared/components/StudyLink/StudyLink';
import { getPatientViewUrl, getSampleViewUrl } from 'shared/api/urls';
import styles from './styles.module.scss';
import proteinChangeStyles from 'shared/components/mutationTable/column/proteinChange.module.scss';
import { getMultipleGeneResultKey } from '../ResultsViewPageStoreUtils';
import { AlteredStatus } from 'pages/resultsView/mutualExclusivity/MutualExclusivityUtil';
import { Alteration } from 'shared/lib/oql/oql-parser';
import { parsedOQLAlterationToSourceOQL } from 'shared/lib/oql/oqlfilter';
import { insertBetween } from 'shared/lib/ArrayUtils';
import { AnnotatedExtendedAlteration } from 'shared/model/AnnotatedExtendedAlteration';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';

export interface ISubAlteration {
    type: string;
    value: number;
    putativeDriver?: boolean;
}

export interface IOqlData {
    geneSymbol: string;
    sequenced: boolean;
    mutation: {
        proteinChange: string;
        isGermline: boolean;
        putativeDriver: boolean;
    }[];
    structuralVariant: string[];
    cna: ISubAlteration[];
    mrnaExp: ISubAlteration[];
    proteinLevel: ISubAlteration[];
    isMutationNotProfiled: boolean;
    isStructuralVariantNotProfiled: boolean;
    isCnaNotProfiled: boolean;
    isMrnaExpNotProfiled: boolean;
    isProteinLevelNotProfiled: boolean;
    alterationTypes: string[];
}

export interface ICaseAlteration {
    studyId: string;
    sampleId: string;
    patientId: string;
    altered: boolean;
    oqlData: { [oqlLine: string]: IOqlData };
    oqlDataByGene: { [gene: string]: IOqlData };
}

export interface ICaseAlterationTableProps {
    caseAlterationData: ICaseAlteration[];
    oqls: OQLLineFilterOutput<AnnotatedExtendedAlteration>[];
    trackLabels: string[];
    trackAlterationTypesMap: { [label: string]: string[] };
    geneAlterationTypesMap: { [label: string]: Alteration[] };
}

export type PseudoOqlSummary = {
    summaryContent: any;
    summaryClass: any;
    summaryAlteredStatus: AlteredStatus;
};

type RenderGenerator<T> = {
    label: string;
    getAlterationData: (oqlData: IOqlData) => T;
    isNotProfiled: (oqlData: IOqlData) => boolean;
    getValues: (d: T) => any[];
};

function mutationMapper(forDownload?: boolean) {
    const renderMutation = (d: IOqlData['mutation'][0]) => {
        if (forDownload) {
            return `${d.proteinChange}${d.isGermline ? ' [germline]' : ''}${
                d.putativeDriver ? ' (driver)' : ''
            }`;
        } else {
            return (
                <span>
                    <span>{d.proteinChange}</span>
                    {d.isGermline && (
                        <span className={proteinChangeStyles.germline}>
                            Germline
                        </span>
                    )}
                    {d.putativeDriver && (
                        <span className={proteinChangeStyles.driver}>
                            (Driver)
                        </span>
                    )}
                </span>
            );
        }
    };

    return (alterationData: IOqlData['mutation']) =>
        alterationData.map(renderMutation);
}

function cnaMapper(forDownload?: boolean) {
    const renderCna = (d: IOqlData['cna'][0]) => {
        if (forDownload) {
            return `${d.type}${d.putativeDriver ? ' (driver)' : ''}`;
        } else {
            return (
                <span>
                    <span>{d.type}</span>
                    {d.putativeDriver && (
                        <span className={proteinChangeStyles.driver}>
                            (Driver)
                        </span>
                    )}
                </span>
            );
        }
    };
    return (alterationData: IOqlData['cna']) => alterationData.map(renderCna);
}

export function generateOqlValue(
    data: IOqlData,
    alterationType: string,
    forDownload?: boolean
): PseudoOqlSummary | undefined {
    // helper functions to map the display value for different alteration types
    const stringMapper = (alterationData: (string | ISubAlteration)[]) =>
        alterationData as string[];
    const subAlterationMapper = (alterationData: (string | ISubAlteration)[]) =>
        alterationData.map((alteration: ISubAlteration) => alteration.type);
    let generator: RenderGenerator<any> | undefined;
    let pseudoOqlSummary: PseudoOqlSummary | undefined = undefined;

    if (
        data.alterationTypes.length === 0 ||
        !data.alterationTypes.includes(alterationType)
    ) {
        pseudoOqlSummary = {
            summaryContent: 'no alteration',
            summaryClass: styles.noAlterationSpan,
            summaryAlteredStatus: AlteredStatus.UNALTERED,
        };
    }
    switch (alterationType) {
        case 'MUT':
            generator = {
                label: 'MUT',
                getAlterationData: (oqlData: IOqlData) => oqlData.mutation,
                isNotProfiled: (oqlData: IOqlData) =>
                    oqlData.isMutationNotProfiled,
                getValues: mutationMapper(forDownload),
            };
            break;
        case 'FUSION':
            generator = {
                label: 'FUSION',
                getAlterationData: (oqlData: IOqlData) =>
                    oqlData.structuralVariant,
                isNotProfiled: (oqlData: IOqlData) =>
                    oqlData.isStructuralVariantNotProfiled,
                getValues: stringMapper,
            };
            break;
        case 'CNA':
            generator = {
                label: 'CNA',
                getAlterationData: (oqlData: IOqlData) => oqlData.cna,
                isNotProfiled: (oqlData: IOqlData) => oqlData.isCnaNotProfiled,
                getValues: cnaMapper(forDownload),
            };
            break;
        case 'EXP':
            generator = {
                label: 'EXP',
                getAlterationData: (oqlData: IOqlData) => oqlData.mrnaExp,
                isNotProfiled: (oqlData: IOqlData) =>
                    oqlData.isMrnaExpNotProfiled,
                getValues: subAlterationMapper,
            };
            break;
        case 'PROT':
            generator = {
                label: 'PROT',
                getAlterationData: (oqlData: IOqlData) => oqlData.proteinLevel,
                isNotProfiled: (oqlData: IOqlData) =>
                    oqlData.isProteinLevelNotProfiled,
                getValues: subAlterationMapper,
            };
            break;
        default:
    }

    if (generator) {
        const alterationData = generator.getAlterationData(data);
        if (alterationData.length > 0) {
            const summaryContent = insertBetween<any>(
                ', ',
                generator.getValues(alterationData)
            );
            pseudoOqlSummary = {
                summaryContent: forDownload
                    ? summaryContent.join('')
                    : summaryContent,
                summaryClass: styles.alterationSpan,
                summaryAlteredStatus: AlteredStatus.ALTERED,
            };
        }
        if (generator.isNotProfiled(data)) {
            pseudoOqlSummary = {
                summaryContent: 'not profiled',
                summaryClass: styles.notProfiledSpan,
                summaryAlteredStatus: AlteredStatus.UNPROFILED,
            };
        }
    }

    // finally, generate a single line summary with all alteration data combined.
    return pseudoOqlSummary ? pseudoOqlSummary : undefined;
}

export function generatePseudoOqlSummary(
    oqlData: { [oqlLine: string]: IOqlData },
    oqlLine: string,
    alterationType: string,
    forDownload?: boolean
): PseudoOqlSummary | undefined {
    if (!_.isEmpty(oqlData)) {
        const datum = oqlData[oqlLine];

        if (datum) {
            return generateOqlValue(
                oqlData[oqlLine],
                alterationType,
                forDownload
            );
        }
    }

    return undefined;
}

export function computeAlterationTypes(
    alterationData: ICaseAlteration[]
): string[] {
    const types = _.chain(alterationData)
        .map(alteration => _.values(alteration.oqlData))
        .flatten()
        .map(oqlDataValue => oqlDataValue.alterationTypes)
        .flatten()
        .uniq()
        .value();
    return types;
}

export function getPseudoOqlSummaryByAlterationTypes(
    oqlData: { [oqlLine: string]: IOqlData },
    oqlLine: string,
    alterationTypes: string[],
    forDownload?: boolean
): PseudoOqlSummary {
    const pseudoOqlSummaries = _.map(alterationTypes, type =>
        generatePseudoOqlSummary(oqlData, oqlLine, type, forDownload)
    );
    // if not profiled in all profiles, then it is not profiled
    const notProfiledPseudoOqlSummaries = _.filter(
        pseudoOqlSummaries,
        summary =>
            summary
                ? summary.summaryAlteredStatus === AlteredStatus.UNPROFILED
                : false
    );
    if (
        notProfiledPseudoOqlSummaries &&
        notProfiledPseudoOqlSummaries.length === alterationTypes.length
    ) {
        return {
            summaryContent: 'not profiled',
            summaryClass: styles.notProfiledSpan,
            summaryAlteredStatus: AlteredStatus.UNPROFILED,
        };
    }
    // altered and no alteration
    const alteredPseudoOqlSummaries = _.filter(pseudoOqlSummaries, summary =>
        summary ? summary.summaryAlteredStatus === AlteredStatus.ALTERED : false
    );
    const alteredPseudoOqlSummaryContent = insertBetween<any>(
        ', ',
        _.map(
            alteredPseudoOqlSummaries,
            (summary: PseudoOqlSummary) => summary.summaryContent
        )
    );
    if (alteredPseudoOqlSummaries.length > 0) {
        return {
            summaryContent: forDownload
                ? alteredPseudoOqlSummaryContent.join('')
                : alteredPseudoOqlSummaryContent,
            summaryClass: styles.alterationSpan,
            summaryAlteredStatus: AlteredStatus.ALTERED,
        };
    } else {
        return {
            summaryContent: 'no alteration',
            summaryClass: styles.noAlterationSpan,
            summaryAlteredStatus: AlteredStatus.UNALTERED,
        };
    }
}

class CaseAlterationTableComponent extends LazyMobXTable<ICaseAlteration> {}

@observer
export default class CaseAlterationTable extends React.Component<
    ICaseAlterationTableProps,
    {}
> {
    public render() {
        const columns: Column<ICaseAlteration>[] = [
            {
                name: 'Study ID',
                render: (data: ICaseAlteration) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                        <StudyLink studyId={data.studyId}>
                            {data.studyId}
                        </StudyLink>
                    </span>
                ),
                download: (data: ICaseAlteration) => data.studyId,
                sortBy: (data: ICaseAlteration) => data.studyId,
                filter: (data: ICaseAlteration, filterString: string) => {
                    return new RegExp(filterString, 'i').test(data.studyId);
                },
            },
            {
                name: 'Sample ID',
                render: (data: ICaseAlteration) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                        <a
                            href={getSampleViewUrl(data.studyId, data.sampleId)}
                            target="_blank"
                        >
                            {data.sampleId}
                        </a>
                    </span>
                ),
                download: (data: ICaseAlteration) => `${data.sampleId}`,
                sortBy: (data: ICaseAlteration) => data.sampleId,
                filter: (data: ICaseAlteration, filterString: string) => {
                    return new RegExp(filterString, 'i').test(data.sampleId);
                },
            },
            {
                name: 'Patient ID',
                render: (data: ICaseAlteration) => (
                    <span style={{ whiteSpace: 'nowrap' }}>
                        <a
                            href={getPatientViewUrl(
                                data.studyId,
                                data.patientId
                            )}
                            target="_blank"
                        >
                            {data.patientId}
                        </a>
                    </span>
                ),
                download: (data: ICaseAlteration) => `${data.patientId}`,
                sortBy: (data: ICaseAlteration) => data.patientId,
                filter: (data: ICaseAlteration, filterString: string) => {
                    return new RegExp(filterString, 'i').test(data.patientId);
                },
            },
            {
                name: 'Altered',
                tooltip: (
                    <span>
                        1 = Sample harbors alteration in one of the input genes
                    </span>
                ),
                render: (data: ICaseAlteration) => (
                    <span>{data.altered ? '1' : '0'}</span>
                ),
                download: (data: ICaseAlteration) => (data.altered ? '1' : '0'),
                sortBy: (data: ICaseAlteration) => (data.altered ? 1 : 0),
            },
        ];

        // track columns
        _.forEach(this.props.trackLabels, trackLabel => {
            // add column for each track
            columns.push({
                name: `${trackLabel}`,
                headerDownload: (name: string) => `${trackLabel}`,
                render: (data: ICaseAlteration) => {
                    const pseudoOqlSummary = getPseudoOqlSummaryByAlterationTypes(
                        data.oqlData,
                        trackLabel,
                        this.props.trackAlterationTypesMap[trackLabel]
                    );
                    return (
                        <span className={pseudoOqlSummary.summaryClass}>
                            {pseudoOqlSummary.summaryContent}
                        </span>
                    );
                },
                download: (data: ICaseAlteration) =>
                    getPseudoOqlSummaryByAlterationTypes(
                        data.oqlData,
                        trackLabel,
                        this.props.trackAlterationTypesMap[trackLabel],
                        true
                    )!.summaryContent,
                sortBy: (data: ICaseAlteration) =>
                    getPseudoOqlSummaryByAlterationTypes(
                        data.oqlData,
                        trackLabel,
                        this.props.trackAlterationTypesMap[trackLabel]
                    )!.summaryContent,
                filter: (data: ICaseAlteration, filterString: string) => {
                    return new RegExp(filterString, 'i').test(
                        getPseudoOqlSummaryByAlterationTypes(
                            data.oqlData,
                            trackLabel,
                            this.props.trackAlterationTypesMap[trackLabel]
                        )!.summaryContent
                    );
                },
                visible: true,
            });
        });

        // additional alteration combinations
        const uniqGenes = _.uniq(_.map(this.props.oqls, oql => oql.gene));

        _.forEach(uniqGenes, gene => {
            //add column for each gene alteration combination
            this.props.geneAlterationTypesMap[gene].forEach(alteration => {
                const oql_line = parsedOQLAlterationToSourceOQL(alteration);
                const alterationType = alteration.alteration_type.toUpperCase();
                const alterationName = `${gene}: ${oql_line}`;
                if (
                    _.isEmpty(
                        columns.find(column => column.name === alterationName)
                    )
                ) {
                    columns.push({
                        name: `${gene}: ${oql_line}`,
                        headerDownload: (name: string) =>
                            `${gene}: ${oql_line}`,
                        render: (data: ICaseAlteration) => {
                            const pseudoOqlSummary = generatePseudoOqlSummary(
                                data.oqlDataByGene,
                                gene,
                                alterationType
                            );

                            return (
                                <span
                                    className={pseudoOqlSummary!.summaryClass}
                                >
                                    {pseudoOqlSummary!.summaryContent}
                                </span>
                            );
                        },
                        download: (data: ICaseAlteration) =>
                            generatePseudoOqlSummary(
                                data.oqlDataByGene,
                                gene,
                                alterationType,
                                true
                            )!.summaryContent,
                        sortBy: (data: ICaseAlteration) =>
                            generatePseudoOqlSummary(
                                data.oqlDataByGene,
                                gene,
                                alterationType
                            )!.summaryContent,
                        filter: (
                            data: ICaseAlteration,
                            filterString: string
                        ) => {
                            return new RegExp(filterString, 'i').test(
                                generatePseudoOqlSummary(
                                    data.oqlDataByGene,
                                    gene,
                                    alterationType
                                )!.summaryContent
                            );
                        },
                        visible: false,
                    });
                }
            });
        });

        return (
            <CaseAlterationTableComponent
                data={this.props.caseAlterationData}
                columns={columns}
                initialSortColumn="Altered"
                initialSortDirection={'desc'}
                initialItemsPerPage={20}
                showPagination={true}
                showColumnVisibility={true}
                showFilter={true}
                showCopyDownload={
                    getServerConfig().skin_hide_download_controls ===
                    DownloadControlOption.SHOW_ALL
                }
                enableHorizontalScroll={true}
                copyDownloadProps={{
                    downloadFilename: 'alterations_across_samples.tsv',
                }}
            />
        );
    }
}
