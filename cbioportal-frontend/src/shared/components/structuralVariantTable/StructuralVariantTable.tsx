/**
 * Copyright (c) 2018 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License (AGPL),
 * version 3, or (at your option) any later version.
 *
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

import * as _ from 'lodash';
import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable, observable } from 'mobx';
import {
    Column,
    default as LazyMobXTable,
    SortDirection,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import { getSampleViewUrl, getStudySummaryUrl } from '../../api/urls';
import { StructuralVariantExt } from '../../model/Fusion';
import { ILazyMobXTableApplicationDataStore } from '../../lib/ILazyMobXTableApplicationDataStore';
import { ILazyMobXTableApplicationLazyDownloadDataFetcher } from '../../lib/ILazyMobXTableApplicationLazyDownloadDataFetcher';
import { IPaginationControlsProps } from '../paginationControls/PaginationControls';
import { DefaultTooltip, TruncatedText } from 'cbioportal-frontend-commons';
import {
    CancerStudy,
    MolecularProfile,
    StructuralVariant,
} from 'cbioportal-ts-api-client';
import styles from 'shared/components/mutationTable/column/mutationStatus.module.scss';
import { Annotation } from 'react-mutation-mapper';
import { getServerConfig, ServerConfigHelpers } from 'config/config';
import AnnotationColumnFormatter from 'pages/patientView/structuralVariant/column/AnnotationColumnFormatter';
import {
    calculateOncoKbContentPadding,
    calculateOncoKbContentWidthWithInterval,
    DEFAULT_ONCOKB_CONTENT_WIDTH,
} from 'shared/lib/AnnotationColumnUtils';
import { IOncoKbData, RemoteData } from 'cbioportal-utils';
import { CancerGene } from 'oncokb-ts-api-client';
import { Exon } from 'genome-nexus-ts-api-client';

/**
 * Fusion table column types
 */
export enum FusionTableColumnType {
    STUDY = 'Study',
    SAMPLE_ID = 'Sample ID',
    CANCER_TYPE_DETAILED = 'Cancer Type Detailed',
    SITE1_HUGO_SYMBOL = 'Gene 1',
    SITE1_ENTREZ_GENE_ID = 'Site1 Entrez Gene Id',
    SITE1_ENSEMBL_TRANSCRIPT_ID = 'Site1 Ensembl Transcript Id',
    SITE1_CHROMOSOME = 'Site1 Chromosome',
    SITE1_POSITION = 'Site1 Position',
    SITE1_EXON = 'Site1 Exon/Intron',
    SITE1_DESCRIPTION = 'Site1 Description',
    SITE2_HUGO_SYMBOL = 'Gene 2',
    SITE2_ENTREZ_GENE_ID = 'Site2 Entrez Gene Id',
    SITE2_ENSEMBL_TRANSCRIPT_ID = 'Site2 Ensembl Transcript Id',
    SITE2_CHROMOSOME = 'Site2 Chromosome',
    SITE2_POSITION = 'Site2 Position',
    SITE2_EXON = 'Site2 Exon/Intron',
    SITE2_DESCRIPTION = 'Site2 Description',
    SITE2_EFFECT_ON_FRAME = 'Effect on Frame',
    ANNOTATION = 'Annotation',
    MUTATION_STATUS = 'MS',
    NCBI_BUILD = 'NCBI Build',
    DNA_SUPPORT = 'DNA Support',
    RNA_SUPPORT = 'RNA Support',
    NORMAL_READ_COUNT = 'Normal Read Count',
    TUMOR_READ_COUNT = 'Tumor Read Count',
    NORMAL_VARIANT_COUNT = 'Normal Variant Count',
    TUMOR_VARIANT_COUNT = 'Tumor Variant Count',
    NORMAL_PAIRED_END_READ_COUNT = 'Normal Paired End Read Count',
    TUMOR_PAIRED_END_READ_COUNT = 'Tumor Paired End Read Count',
    NORMAL_SPLIT_READ_COUNT = 'Normal Split Read Count',
    TUMOR_SPLIT_READ_COUNT = 'Tumor Split Read Count',
    BREAKPOINT_TYPE = 'Breakpoint Type',
    SV_DESCRIPTION = 'SV Description',
    CENTER = 'Center',
    CONNECTION_TYPE = 'Connection Type',
    EVENT_INFO = 'Event Info',
    VARIANT_CLASS = 'Variant Class',
    LENGTH = 'Length',
    COMMENTS = 'Comments',
}

const fusionTableColumnAttributes: {
    [key in FusionTableColumnType]: string;
} = {
    [FusionTableColumnType.STUDY]: 'studyId',
    [FusionTableColumnType.SAMPLE_ID]: 'sampleId',
    [FusionTableColumnType.CANCER_TYPE_DETAILED]: 'cancerTypeDetailed',
    [FusionTableColumnType.SITE1_HUGO_SYMBOL]: 'site1HugoSymbol',
    [FusionTableColumnType.SITE1_ENTREZ_GENE_ID]: 'site1EntrezGeneId',
    [FusionTableColumnType.SITE1_ENSEMBL_TRANSCRIPT_ID]:
        'site1EnsemblTranscriptId',
    [FusionTableColumnType.SITE1_CHROMOSOME]: 'site1Chromosome',
    [FusionTableColumnType.SITE1_POSITION]: 'site1Position',
    [FusionTableColumnType.SITE1_EXON]: '',
    [FusionTableColumnType.SITE1_DESCRIPTION]: 'site1Description',
    [FusionTableColumnType.SITE2_HUGO_SYMBOL]: 'site2HugoSymbol',
    [FusionTableColumnType.SITE2_ENTREZ_GENE_ID]: 'site2EntrezGeneId',
    [FusionTableColumnType.SITE2_ENSEMBL_TRANSCRIPT_ID]:
        'site2EnsemblTranscriptId',
    [FusionTableColumnType.SITE2_CHROMOSOME]: 'site2Chromosome',
    [FusionTableColumnType.SITE2_POSITION]: 'site2Position',
    [FusionTableColumnType.SITE2_EXON]: '',
    [FusionTableColumnType.SITE2_DESCRIPTION]: 'site2Description',
    [FusionTableColumnType.SITE2_EFFECT_ON_FRAME]: 'site2EffectOnFrame',
    [FusionTableColumnType.ANNOTATION]: '',
    [FusionTableColumnType.MUTATION_STATUS]: 'svStatus',
    [FusionTableColumnType.NCBI_BUILD]: 'ncbiBuild',
    [FusionTableColumnType.DNA_SUPPORT]: 'dnaSupport',
    [FusionTableColumnType.RNA_SUPPORT]: 'rnaSupport',
    [FusionTableColumnType.NORMAL_READ_COUNT]: 'normalReadCount',
    [FusionTableColumnType.TUMOR_READ_COUNT]: 'tumorReadCount',
    [FusionTableColumnType.NORMAL_VARIANT_COUNT]: 'normalVariantCount',
    [FusionTableColumnType.TUMOR_VARIANT_COUNT]: 'tumorVariantCount',
    [FusionTableColumnType.NORMAL_PAIRED_END_READ_COUNT]:
        'normalPairedEndReadCount',
    [FusionTableColumnType.TUMOR_PAIRED_END_READ_COUNT]:
        'tumorPairedEndReadCount',
    [FusionTableColumnType.NORMAL_SPLIT_READ_COUNT]: 'normalSplitReadCount',
    [FusionTableColumnType.TUMOR_SPLIT_READ_COUNT]: 'tumorSplitReadCount',
    [FusionTableColumnType.BREAKPOINT_TYPE]: 'breakpointType',
    [FusionTableColumnType.SV_DESCRIPTION]: 'annotation',
    [FusionTableColumnType.CENTER]: 'center',
    [FusionTableColumnType.CONNECTION_TYPE]: 'connectionType',
    [FusionTableColumnType.EVENT_INFO]: 'eventInfo',
    [FusionTableColumnType.VARIANT_CLASS]: 'variantClass',
    [FusionTableColumnType.LENGTH]: 'length',
    [FusionTableColumnType.COMMENTS]: 'comments',
};

export type FusionTableColumn = Column<StructuralVariant[]> & {
    order?: number;
    shouldExclude?: () => boolean;
};

export interface IFusionTableProps {
    studyIdToStudy?: { [studyId: string]: CancerStudy };
    molecularProfileIdToMolecularProfile?: {
        [molecularProfileId: string]: MolecularProfile;
    };
    uniqueSampleKeyToTumorType?: { [uniqueSampleKey: string]: string };
    transcriptToExons?: Map<string, Exon[]>;
    columns?: FusionTableColumnType[];
    dataStore?: ILazyMobXTableApplicationDataStore<StructuralVariant[]>;
    downloadDataFetcher?: ILazyMobXTableApplicationLazyDownloadDataFetcher;
    initialItemsPerPage?: number;
    itemsLabel?: string;
    itemsLabelPlural?: string;
    initialSortColumn?: string;
    initialSortDirection?: SortDirection;
    paginationProps?: IPaginationControlsProps;
    showCountHeader?: boolean;
    structuralVariantOncoKbData?: RemoteData<IOncoKbData | Error | undefined>;
    oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>;
    usingPublicOncoKbInstance: boolean;
    mergeOncoKbIcons?: boolean;
    onOncoKbIconToggle: (mergeIcons: boolean) => void;
}

export class FusionTableComponent extends LazyMobXTable<StructuralVariant[]> {}

const ANNOTATION_ELEMENT_ID = 'sv-annotation';

@observer
export default class StructuralVariantTable<
    P extends IFusionTableProps
> extends React.Component<P, {}> {
    @observable protected _columns: { [columnType: string]: FusionTableColumn };
    @observable mergeOncoKbIcons;
    @observable oncokbWidth = DEFAULT_ONCOKB_CONTENT_WIDTH;
    private oncokbInterval: any;

    public static defaultProps = {
        initialItemsPerPage: 25,
        showCountHeader: true,
        paginationProps: { itemsPerPageOptions: [25, 50, 100] },
        initialSortColumn: 'Annotation',
        initialSortDirection: 'desc',
        itemsLabel: 'Structural Variant',
        itemsLabelPlural: 'Structural Variants',
    };

    constructor(props: P) {
        super(props);
        makeObservable(this);
        this._columns = {};
        this.generateColumns();

        this.oncokbInterval = calculateOncoKbContentWidthWithInterval(
            ANNOTATION_ELEMENT_ID,
            oncoKbContentWidth => {
                if (this.oncokbWidth !== oncoKbContentWidth)
                    this.oncokbWidth = oncoKbContentWidth;
            }
        );

        this.mergeOncoKbIcons = !!props.mergeOncoKbIcons;
    }

    @computed
    protected get columns(): Column<StructuralVariant[]>[] {
        return this.orderedColumns.reduce(
            (
                columns: Column<StructuralVariant[]>[],
                next: FusionTableColumnType
            ) => {
                let column = this._columns[next];

                if (
                    column && // actual column definition may be missing for a specific enum
                    (!column.shouldExclude || !column.shouldExclude())
                ) {
                    columns.push(column);
                }

                return columns;
            },
            []
        );
    }

    @computed
    protected get orderedColumns(): FusionTableColumnType[] {
        const columns = (this.props.columns || []) as FusionTableColumnType[];
        return _.sortBy(columns, (c: FusionTableColumnType) => {
            let order: number = -1;

            if (this._columns[c] && this._columns[c].order) {
                order = this._columns[c].order as number;
            }

            return order;
        });
    }

    public render() {
        return (
            <FusionTableComponent
                columns={this.columns}
                dataStore={this.props.dataStore}
                downloadDataFetcher={this.props.downloadDataFetcher}
                initialItemsPerPage={this.props.initialItemsPerPage}
                initialSortColumn={this.props.initialSortColumn}
                initialSortDirection={this.props.initialSortDirection}
                itemsLabel={this.props.itemsLabel}
                itemsLabelPlural={this.props.itemsLabelPlural}
                paginationProps={this.props.paginationProps}
                showCountHeader={this.props.showCountHeader}
            />
        );
    }

    protected generateColumns() {
        this._columns = {};

        const defaultColumns = [
            FusionTableColumnType.SITE1_HUGO_SYMBOL,
            FusionTableColumnType.SITE1_ENTREZ_GENE_ID,
            FusionTableColumnType.SITE1_ENSEMBL_TRANSCRIPT_ID,
            FusionTableColumnType.SITE1_CHROMOSOME,
            FusionTableColumnType.SITE1_POSITION,
            FusionTableColumnType.SITE1_DESCRIPTION,
            FusionTableColumnType.SITE2_HUGO_SYMBOL,
            FusionTableColumnType.SITE2_ENTREZ_GENE_ID,
            FusionTableColumnType.SITE2_ENSEMBL_TRANSCRIPT_ID,
            FusionTableColumnType.SITE2_CHROMOSOME,
            FusionTableColumnType.SITE2_POSITION,
            FusionTableColumnType.SITE2_DESCRIPTION,
            FusionTableColumnType.SITE2_EFFECT_ON_FRAME,
            FusionTableColumnType.NCBI_BUILD,
            FusionTableColumnType.DNA_SUPPORT,
            FusionTableColumnType.RNA_SUPPORT,
            FusionTableColumnType.NORMAL_READ_COUNT,
            FusionTableColumnType.TUMOR_READ_COUNT,
            FusionTableColumnType.NORMAL_VARIANT_COUNT,
            FusionTableColumnType.TUMOR_VARIANT_COUNT,
            FusionTableColumnType.NORMAL_PAIRED_END_READ_COUNT,
            FusionTableColumnType.TUMOR_PAIRED_END_READ_COUNT,
            FusionTableColumnType.NORMAL_SPLIT_READ_COUNT,
            FusionTableColumnType.TUMOR_SPLIT_READ_COUNT,
            FusionTableColumnType.BREAKPOINT_TYPE,
            FusionTableColumnType.SV_DESCRIPTION,
            FusionTableColumnType.CENTER,
            FusionTableColumnType.CONNECTION_TYPE,
            FusionTableColumnType.EVENT_INFO,
            FusionTableColumnType.VARIANT_CLASS,
            FusionTableColumnType.LENGTH,
            FusionTableColumnType.COMMENTS,
        ];

        defaultColumns.forEach(columnType => {
            const attribute = fusionTableColumnAttributes[columnType];
            this._columns[columnType] = {
                name: columnType,
                render: this.defaultRender(attribute),
                sortBy: this.defaultSortBy(attribute),
                filter: this.defaultFilter(attribute),
                download: this.defaultDownload(attribute),
                visible: this.isColumnVisible(columnType),
            };
        });

        const studyAttribute =
            fusionTableColumnAttributes[FusionTableColumnType.STUDY];
        this._columns[FusionTableColumnType.STUDY] = {
            name: FusionTableColumnType.STUDY,
            render: (d: StructuralVariant[]) => {
                const molecularProfileId =
                    d[0].studyId + '_structural_variants';
                const geneticProfile = this.props
                    .molecularProfileIdToMolecularProfile?.[molecularProfileId];
                const study =
                    geneticProfile &&
                    this.props.studyIdToStudy?.[geneticProfile.studyId];
                if (!study) return <span />;
                return (
                    <a href={getStudySummaryUrl(study.studyId)} target="_blank">
                        <TruncatedText
                            text={study.name}
                            tooltip={
                                <div
                                    style={{ maxWidth: 300 }}
                                    dangerouslySetInnerHTML={{
                                        __html: `${study.name}: ${study.description}`,
                                    }}
                                />
                            }
                            maxLength={16}
                        />
                    </a>
                );
            },
            sortBy: this.defaultSortBy(studyAttribute),
            filter: this.defaultFilter(studyAttribute),
            download: this.defaultDownload(studyAttribute),
            visible: this.isColumnVisible(FusionTableColumnType.STUDY),
        };

        const sampleIdAttribute =
            fusionTableColumnAttributes[FusionTableColumnType.SAMPLE_ID];
        this._columns[FusionTableColumnType.SAMPLE_ID] = {
            name: FusionTableColumnType.SAMPLE_ID,
            render: (d: StructuralVariantExt[]) => {
                const { studyId, sampleId } = d[0];
                const molecularProfileId = studyId + '_structural_variants';
                const geneticProfile = this.props
                    .molecularProfileIdToMolecularProfile?.[molecularProfileId];
                return geneticProfile ? (
                    <a
                        href={getSampleViewUrl(studyId, sampleId)}
                        target="_blank"
                    >
                        {sampleId}
                    </a>
                ) : (
                    <span>{sampleId}</span>
                );
            },
            sortBy: this.defaultSortBy(sampleIdAttribute),
            filter: this.defaultFilter(sampleIdAttribute),
            download: this.defaultDownload(sampleIdAttribute),
            visible: this.isColumnVisible(FusionTableColumnType.SAMPLE_ID),
        };

        const cancerTypeDetailedAttribute =
            fusionTableColumnAttributes[
                FusionTableColumnType.CANCER_TYPE_DETAILED
            ];
        this._columns[FusionTableColumnType.CANCER_TYPE_DETAILED] = {
            name: FusionTableColumnType.CANCER_TYPE_DETAILED,
            render: (d: StructuralVariant[]) => {
                const data =
                    this.props.uniqueSampleKeyToTumorType?.[
                        d[0].uniqueSampleKey
                    ] ?? null;
                return <span>{data ?? ''}</span>;
            },
            sortBy: (d: StructuralVariant[]) => {
                return (
                    this.props.uniqueSampleKeyToTumorType?.[
                        d[0].uniqueSampleKey
                    ] ?? null
                );
            },
            filter: (
                d: StructuralVariantExt[],
                filterString: string,
                filterStringUpper: string
            ) => {
                let data: string | null = null;
                if (this.props.uniqueSampleKeyToTumorType) {
                    data =
                        this.props.uniqueSampleKeyToTumorType[
                            d[0].uniqueSampleKey
                        ] || null;
                }
                return (
                    data !== null &&
                    data.toUpperCase().includes(filterStringUpper)
                );
            },
            download: this.defaultDownload(cancerTypeDetailedAttribute),
            visible: this.isColumnVisible(
                FusionTableColumnType.CANCER_TYPE_DETAILED
            ),
        };

        const site1ExonAttribute =
            fusionTableColumnAttributes[FusionTableColumnType.SITE1_EXON];
        this._columns[FusionTableColumnType.SITE1_EXON] = {
            name: FusionTableColumnType.SITE1_EXON,
            render: (d: StructuralVariant[]) => {
                const transcriptKey =
                    d[0].site1EnsemblTranscriptId !== 'NA'
                        ? d[0].site1EnsemblTranscriptId
                        : d[0].site1HugoSymbol;
                const position = d[0].site1Position;
                return this.renderExonOrIntron(d, transcriptKey, position);
            },
            sortBy: this.defaultSortBy(site1ExonAttribute),
            filter: this.defaultFilter(site1ExonAttribute),
            download: this.defaultDownload(site1ExonAttribute),
            visible: this.isColumnVisible(FusionTableColumnType.SITE1_EXON),
        };

        const site2ExonAttribute =
            fusionTableColumnAttributes[FusionTableColumnType.SITE2_EXON];
        this._columns[FusionTableColumnType.SITE2_EXON] = {
            name: FusionTableColumnType.SITE2_EXON,
            render: (d: StructuralVariant[]) => {
                const transcriptKey =
                    d[0].site2EnsemblTranscriptId !== 'NA'
                        ? d[0].site2EnsemblTranscriptId
                        : d[0].site2HugoSymbol;
                const position = d[0].site2Position;
                return this.renderExonOrIntron(d, transcriptKey, position);
            },
            sortBy: this.defaultSortBy(site2ExonAttribute),
            filter: this.defaultFilter(site2ExonAttribute),
            download: this.defaultDownload(site2ExonAttribute),
            visible: this.isColumnVisible(FusionTableColumnType.SITE2_EXON),
        };

        this._columns[FusionTableColumnType.ANNOTATION] = {
            name: FusionTableColumnType.ANNOTATION,
            headerRender: (name: string) =>
                AnnotationColumnFormatter.headerRender(
                    name,
                    this.oncokbWidth,
                    this.props.mergeOncoKbIcons,
                    this.props.onOncoKbIconToggle
                ),
            render: (d: StructuralVariant[]) => (
                <span id="sv-annotation">
                    {AnnotationColumnFormatter.renderFunction(d, {
                        uniqueSampleKeyToTumorType: this.props
                            .uniqueSampleKeyToTumorType,
                        oncoKbData: this.props.structuralVariantOncoKbData,
                        oncoKbCancerGenes: this.props.oncoKbCancerGenes,
                        usingPublicOncoKbInstance: this.props
                            .usingPublicOncoKbInstance,
                        mergeOncoKbIcons: this.props.mergeOncoKbIcons,
                        oncoKbContentPadding: calculateOncoKbContentPadding(
                            this.oncokbWidth
                        ),
                        enableOncoKb: getServerConfig().show_oncokb as boolean,
                        enableCivic: false,
                        enableHotspot: false,
                        enableRevue: false,
                        userDisplayName: ServerConfigHelpers.getUserDisplayName(),
                        studyIdToStudy: this.props.studyIdToStudy,
                    })}
                </span>
            ),
            sortBy: (d: StructuralVariant[]) => {
                return AnnotationColumnFormatter.sortValue(
                    d,
                    this.props.oncoKbCancerGenes,
                    this.props.usingPublicOncoKbInstance,
                    this.props.structuralVariantOncoKbData,
                    this.props.uniqueSampleKeyToTumorType
                );
            },
        };

        const mutationStatusAttribute =
            fusionTableColumnAttributes[FusionTableColumnType.MUTATION_STATUS];
        this._columns[FusionTableColumnType.MUTATION_STATUS] = {
            name: FusionTableColumnType.MUTATION_STATUS,
            render: (d: StructuralVariant[]) => {
                const data = d[0].svStatus;
                let content: JSX.Element;
                let needTooltip = false;
                if (/somatic/i.test(data)) {
                    content = <span className={styles.somatic}>S</span>;
                    needTooltip = true;
                } else if (/germline/i.test(data)) {
                    content = <span className={styles.germline}>G</span>;
                    needTooltip = true;
                } else {
                    content = <span className={styles.unknown}>{data}</span>;
                }
                if (needTooltip) {
                    content = (
                        <DefaultTooltip
                            overlay={<span>{data}</span>}
                            placement="right"
                        >
                            {content}
                        </DefaultTooltip>
                    );
                }
                return content;
            },
            sortBy: this.defaultSortBy(mutationStatusAttribute),
            filter: this.defaultFilter(mutationStatusAttribute),
            download: this.defaultDownload(mutationStatusAttribute),
            visible: this.isColumnVisible(
                FusionTableColumnType.MUTATION_STATUS
            ),
        };
    }

    private defaultRender = (attribute: string) => (
        d: StructuralVariantExt[]
    ) => <span>{d[0][attribute]}</span>;

    private defaultSortBy = (attribute: string) => (
        d: StructuralVariantExt[]
    ) => d.map(m => m[attribute]);

    private defaultFilter = (attribute: string) => (
        d: StructuralVariantExt[],
        filterString: string,
        filterStringUpper: string
    ) =>
        d.some(next =>
            String((next as any)[attribute])
                .toUpperCase()
                .includes(filterStringUpper)
        );

    private defaultDownload = (attribute: string) => (
        d: StructuralVariantExt[]
    ) => d[0][attribute];

    private isColumnVisible(columnType: FusionTableColumnType) {
        const visibleColumns = [
            FusionTableColumnType.SAMPLE_ID,
            FusionTableColumnType.CANCER_TYPE_DETAILED,
            FusionTableColumnType.SITE1_HUGO_SYMBOL,
            FusionTableColumnType.SITE2_HUGO_SYMBOL,
            FusionTableColumnType.ANNOTATION,
            FusionTableColumnType.VARIANT_CLASS,
            FusionTableColumnType.EVENT_INFO,
            FusionTableColumnType.CONNECTION_TYPE,
        ];
        return visibleColumns.includes(columnType);
    }

    private renderExonOrIntron = (
        d: StructuralVariant[],
        transcriptKey: string,
        position: number
    ) => {
        const exons = this.props.transcriptToExons!.get(transcriptKey);
        const exonOrIntronRank = exons
            ? this.binarySearchExonOrIntronRank(exons, position)
            : 0;
        if (exonOrIntronRank > 0) {
            if (Number.isInteger(exonOrIntronRank)) {
                return <span>{`Exon ${exonOrIntronRank}`}</span>;
            } else {
                // A half greater means within intron, then get floored since it's intron rank
                return <span>{`Intron ${Math.floor(exonOrIntronRank)}`}</span>;
            }
        } else {
            return <span>{''}</span>;
        }
    };

    private binarySearchExonOrIntronRank = (
        exons: Exon[],
        position: number
    ): number => {
        let left = 0;
        let right = exons.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (
                exons[mid].exonStart <= position &&
                position <= exons[mid].exonEnd
            ) {
                return exons[mid].rank;
            } else if (exons[mid].exonEnd < position) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        // -1 for position outside exon regions, otherwise it's integer if within exon, or a half greater if within intron
        return left >= exons.length || right < 0
            ? -1
            : (exons[left].rank + exons[right].rank) / 2;
    };
}
