import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import {
    DiscreteCopyNumberData,
    ReferenceGenomeGene,
} from 'cbioportal-ts-api-client';
import { Column } from 'shared/components/lazyMobXTable/LazyMobXTable';
import MrnaExprColumnFormatter from 'shared/components/mutationTable/column/MrnaExprColumnFormatter';
import { IColumnVisibilityControlsProps } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import CohortColumnFormatter from './column/CohortColumnFormatter';
import CnaColumnFormatter from './column/CnaColumnFormatter';
import AnnotationColumnFormatter from './column/AnnotationColumnFormatter';
import TumorColumnFormatter from '../mutation/column/TumorColumnFormatter';
import SampleManager from '../SampleManager';
import HeaderIconMenu from '../mutation/HeaderIconMenu';
import GeneFilterMenu, { GeneFilterOption } from '../mutation/GeneFilterMenu';
import PanelColumnFormatter from 'shared/components/mutationTable/column/PanelColumnFormatter';
import {
    calculateOncoKbContentPadding,
    calculateOncoKbContentWidthWithInterval,
    DEFAULT_ONCOKB_CONTENT_WIDTH,
} from 'shared/lib/AnnotationColumnUtils';
import { ILazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import FeatureInstruction from 'shared/FeatureInstruction/FeatureInstruction';
import { getSamplesProfiledStatus } from 'pages/patientView/PatientViewPageUtils';
import { PatientViewPageStore } from 'pages/patientView/clinicalInformation/PatientViewPageStore';
import { MakeMobxView } from 'shared/components/MobxView';
import { getServerConfig } from 'config/config';
import autobind from 'autobind-decorator';
import SampleNotProfiledAlert from 'shared/components/SampleNotProfiledAlert';
import { NamespaceColumnConfig } from 'shared/components/namespaceColumns/NamespaceColumnConfig';
import { createNamespaceColumns } from 'shared/components/namespaceColumns/namespaceColumnsUtils';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import CustomDriverColumnFormatter from './column/CustomDriverColumnFormatter';
import CustomDriverTierColumnFormatter from './column/CustomDriverTierColumnFormatter';

export const TABLE_FEATURE_INSTRUCTION =
    'Click on a CNA row to zoom in on the gene in the IGV browser above';

class CNATableComponent extends LazyMobXTable<DiscreteCopyNumberData[]> {}

type CNATableColumn = Column<DiscreteCopyNumberData[]> & { order: number };

export type ICopyNumberTableWrapperProps = {
    pageStore: PatientViewPageStore;
    sampleIds: string[];
    sampleManager: SampleManager | null;
    enableOncoKb: boolean;
    enableCivic: boolean;
    dataStore: ILazyMobXTableApplicationDataStore<DiscreteCopyNumberData[]>;
    columnVisibility: { [columnId: string]: boolean } | undefined;
    columnVisibilityProps: IColumnVisibilityControlsProps;
    showGeneFilterMenu?: boolean;
    onFilterGenes: (option: GeneFilterOption) => void;
    onSelectGenePanel: (name: string) => void;
    onRowClick: (d: DiscreteCopyNumberData[]) => void;
    onRowMouseEnter?: (d: DiscreteCopyNumberData[]) => void;
    onRowMouseLeave?: (d: DiscreteCopyNumberData[]) => void;
    onOncoKbIconToggle: (mergeIcons: boolean) => void;
    disableTooltip: boolean;
    mergeOncoKbIcons?: boolean;
    namespaceColumns?: NamespaceColumnConfig;
    customDriverName?: string;
    customDriverDescription?: string;
    customDriverTiersName?: string;
    customDriverTiersDescription?: string;
};

const ANNOTATION_ELEMENT_ID = 'copy-number-annotation';

@observer
export default class CopyNumberTableWrapper extends React.Component<
    ICopyNumberTableWrapperProps,
    {}
> {
    @observable oncokbWidth = DEFAULT_ONCOKB_CONTENT_WIDTH;
    private oncokbInterval: any;

    constructor(props: ICopyNumberTableWrapperProps) {
        super(props);
        makeObservable(this);

        // here we wait for the oncokb icons to fully finish rendering
        // then update the oncokb width in order to align annotation column header icons with the cell content
        this.oncokbInterval = calculateOncoKbContentWidthWithInterval(
            ANNOTATION_ELEMENT_ID,
            oncoKbContentWidth => {
                // only set if it's different to avoid unnecessary render cycles
                if (this.oncokbWidth !== oncoKbContentWidth)
                    this.oncokbWidth = oncoKbContentWidth;
            }
        );
    }

    public destroy() {
        clearInterval(this.oncokbInterval);
    }

    public static defaultProps = {
        enableOncoKb: true,
        enableCivic: false,
        showGeneFilterMenu: true,
    };

    @autobind
    handleOncoKBToggle(mergeIcons: boolean) {
        this.props.onOncoKbIconToggle(mergeIcons);
        // calculateOncoKbContentWidthOnNextFrame(
        //     ANNOTATION_ELEMENT_ID,
        //     width => (this.oncokbWidth = width || DEFAULT_ONCOKB_CONTENT_WIDTH)
        // );
    }

    @computed get hugoGeneSymbolToCytoband() {
        // build reference gene map
        const result: {
            [hugosymbol: string]: string;
        } = this.pageStore.referenceGenes.result!.reduce(
            (
                map: { [hugosymbol: string]: string },
                next: ReferenceGenomeGene
            ) => {
                map[next.hugoGeneSymbol] = next.cytoband || '';
                return map;
            },
            {}
        );
        return result;
    }

    getCytobandForGene(hugoGeneSymbol: string) {
        return this.hugoGeneSymbolToCytoband[hugoGeneSymbol];
    }

    public render() {
        return this.tableUI.component;
    }

    @computed get columns() {
        const columns: CNATableColumn[] = [];
        const numSamples = this.props.sampleIds.length;

        if (numSamples >= 2) {
            columns.push({
                name: 'Samples',
                render: (d: DiscreteCopyNumberData[]) =>
                    TumorColumnFormatter.renderFunction(
                        d,
                        this.props.sampleManager,
                        this.pageStore.sampleToDiscreteGenePanelId.result,
                        this.pageStore.genePanelIdToEntrezGeneIds.result,
                        this.props.onSelectGenePanel,
                        this.props.disableTooltip
                    ),
                sortBy: (d: DiscreteCopyNumberData[]) =>
                    TumorColumnFormatter.getSortValue(
                        d,
                        this.props.sampleManager
                    ),
                download: (d: DiscreteCopyNumberData[]) =>
                    TumorColumnFormatter.getSample(d),
                order: 20,
                resizable: true,
            });
        }

        columns.push({
            name: 'Gene',
            render: (d: DiscreteCopyNumberData[]) => (
                <span data-test="cna-table-gene-column">
                    {d[0].gene.hugoGeneSymbol}
                </span>
            ),
            filter: (
                d: DiscreteCopyNumberData[],
                filterString: string,
                filterStringUpper: string
            ) => {
                return d[0].gene.hugoGeneSymbol.indexOf(filterStringUpper) > -1;
            },
            download: (d: DiscreteCopyNumberData[]) => d[0].gene.hugoGeneSymbol,
            sortBy: (d: DiscreteCopyNumberData[]) => d[0].gene.hugoGeneSymbol,
            headerRender: (name: string) => {
                return (
                    <HeaderIconMenu
                        name={name}
                        showIcon={
                            this.pageStore.cnaTableShowGeneFilterMenu.result
                        }
                    >
                        <GeneFilterMenu
                            onOptionChanged={this.props.onFilterGenes}
                            currentSelection={
                                this.pageStore.copyNumberTableGeneFilterOption
                            }
                        />
                    </HeaderIconMenu>
                );
            },
            visible: true,
            order: 30,
        });

        columns.push(...createCnaNamespaceColumns(this.props.namespaceColumns));

        const GenePanelProps = (d: DiscreteCopyNumberData[]) => ({
            data: d,
            sampleToGenePanelId: this.pageStore.sampleToDiscreteGenePanelId
                .result,
            sampleManager: this.props.sampleManager,
            genePanelIdToGene: this.pageStore.genePanelIdToEntrezGeneIds.result,
            onSelectGenePanel: this.props.onSelectGenePanel,
        });

        columns.push({
            name: 'Gene panel',
            render: (d: DiscreteCopyNumberData[]) =>
                PanelColumnFormatter.renderFunction(GenePanelProps(d)),
            download: (d: DiscreteCopyNumberData[]) =>
                PanelColumnFormatter.download(GenePanelProps(d)),
            sortBy: (d: DiscreteCopyNumberData[]) =>
                PanelColumnFormatter.getGenePanelIds(GenePanelProps(d)),
            visible: false,
            order: 35,
        });

        columns.push({
            name: 'CNA',
            render: CnaColumnFormatter.renderFunction,
            filter: (
                d: DiscreteCopyNumberData[],
                filterString: string,
                filterStringUpper: string
            ) => {
                return (
                    CnaColumnFormatter.displayText(d)
                        .toUpperCase()
                        .indexOf(filterStringUpper) > -1
                );
            },
            download: CnaColumnFormatter.download,
            sortBy: CnaColumnFormatter.sortValue,
            visible: true,
            order: 40,
        });

        columns.push({
            name: 'Annotation',
            headerRender: (name: string) =>
                AnnotationColumnFormatter.headerRender(
                    name,
                    this.oncokbWidth,
                    this.props.mergeOncoKbIcons,
                    this.handleOncoKBToggle
                ),
            render: (d: DiscreteCopyNumberData[]) => (
                <span id="copy-number-annotation">
                    {AnnotationColumnFormatter.renderFunction(d, {
                        uniqueSampleKeyToTumorType: this.pageStore
                            .uniqueSampleKeyToTumorType,
                        oncoKbData: this.pageStore.cnaOncoKbData,
                        oncoKbCancerGenes: this.pageStore.oncoKbCancerGenes,
                        usingPublicOncoKbInstance: this.pageStore
                            .usingPublicOncoKbInstance,
                        mergeOncoKbIcons: this.props.mergeOncoKbIcons,
                        oncoKbContentPadding: calculateOncoKbContentPadding(
                            this.oncokbWidth
                        ),
                        enableOncoKb: this.props.enableOncoKb as boolean,
                        pubMedCache: this.pageStore.pubMedCache,
                        civicGenes: this.pageStore.cnaCivicGenes,
                        civicVariants: this.pageStore.cnaCivicVariants,
                        enableCivic: getServerConfig().show_civic as boolean,
                        enableHotspot: false,
                        enableRevue: false,
                        userDisplayName: getServerConfig().user_display_name,
                        studyIdToStudy: this.pageStore.studyIdToStudy.result,
                    })}
                </span>
            ),
            sortBy: (d: DiscreteCopyNumberData[]) => {
                return AnnotationColumnFormatter.sortValue(
                    d,
                    this.pageStore.oncoKbCancerGenes,
                    this.pageStore.usingPublicOncoKbInstance,
                    this.pageStore.cnaOncoKbData,
                    this.pageStore.uniqueSampleKeyToTumorType,
                    this.pageStore.cnaCivicGenes,
                    this.pageStore.cnaCivicVariants
                );
            },
            order: 50,
        });

        columns.push({
            name: this.props.customDriverName!,
            render: d => CustomDriverColumnFormatter.renderFunction(d),
            download: CustomDriverColumnFormatter.getTextValue,
            sortBy: (d: DiscreteCopyNumberData[]) =>
                CustomDriverColumnFormatter.sortValue(d),
            filter: (
                d: DiscreteCopyNumberData[],
                filterString: string,
                filterStringUpper: string
            ) =>
                CustomDriverColumnFormatter.getTextValue(d)
                    .toUpperCase()
                    .includes(filterStringUpper),
            visible:
                this.pageStore.mergedDiscreteCNADataFilteredByGene.length > 0 &&
                this.pageStore.mergedDiscreteCNADataFilteredByGene.some(
                    d =>
                        d[0].driverFilter !== undefined ||
                        d[0].driverFilterAnnotation !== undefined
                ),
            tooltip: <span>{this.props.customDriverDescription!}</span>,
            order: 55,
        });

        columns.push({
            name: this.props.customDriverTiersName!,
            render: d => CustomDriverTierColumnFormatter.renderFunction(d),
            download: CustomDriverTierColumnFormatter.getTextValue,
            sortBy: (d: DiscreteCopyNumberData[]) =>
                CustomDriverTierColumnFormatter.getTextValue(d),
            filter: (
                d: DiscreteCopyNumberData[],
                filterString: string,
                filterStringUpper: string
            ) =>
                CustomDriverTierColumnFormatter.getTextValue(d)
                    .toUpperCase()
                    .includes(filterStringUpper),
            visible:
                this.pageStore.mergedDiscreteCNADataFilteredByGene.length > 0 &&
                this.pageStore.mergedDiscreteCNADataFilteredByGene.every(
                    d =>
                        d[0].driverFilter !== undefined ||
                        d[0].driverFilterAnnotation !== undefined
                ),
            tooltip: <span>{this.props.customDriverTiersDescription}</span>,
            order: 56,
        });

        columns.push({
            name: 'Cytoband',
            render: (d: DiscreteCopyNumberData[]) => (
                <span>{this.getCytobandForGene(d[0].gene.hugoGeneSymbol)}</span>
            ),
            sortBy: (d: DiscreteCopyNumberData[]) =>
                this.getCytobandForGene(d[0].gene.hugoGeneSymbol),
            download: (d: DiscreteCopyNumberData[]) =>
                this.getCytobandForGene(d[0].gene.hugoGeneSymbol),
            visible: true,
            order: 60,
        });

        columns.push({
            name: 'Cohort',
            render: (d: DiscreteCopyNumberData[]) =>
                this.pageStore.copyNumberCountCache ? (
                    CohortColumnFormatter.renderFunction(
                        d,
                        this.pageStore.copyNumberCountCache,
                        this.pageStore.gisticData.result
                    )
                ) : (
                    <span />
                ),
            sortBy: (d: DiscreteCopyNumberData[]) => {
                if (this.pageStore.copyNumberCountCache) {
                    return CohortColumnFormatter.getSortValue(
                        d,
                        this.pageStore.copyNumberCountCache
                    );
                } else {
                    return 0;
                }
            },
            download: (d: DiscreteCopyNumberData[]) => {
                if (this.pageStore.copyNumberCountCache) {
                    return CohortColumnFormatter.getDownloadValue(
                        d,
                        this.pageStore.copyNumberCountCache
                    );
                } else {
                    return 'N/A';
                }
            },
            tooltip: <span>Alteration frequency in cohort</span>,
            defaultSortDirection: 'desc',
            order: 80,
        });

        if (
            numSamples === 1 &&
            this.pageStore.mrnaRankMolecularProfileId.result
        ) {
            columns.push({
                name: 'mRNA Expr.',
                render: (d: DiscreteCopyNumberData[]) =>
                    this.pageStore.mrnaExprRankCache ? (
                        MrnaExprColumnFormatter.cnaRenderFunction(
                            d,
                            this.pageStore.mrnaExprRankCache
                        )
                    ) : (
                        <span />
                    ),
                download: (d: DiscreteCopyNumberData[]) => {
                    if (this.pageStore.mrnaExprRankCache) {
                        return MrnaExprColumnFormatter.getDownloadData(
                            d,
                            this.pageStore.mrnaExprRankCache
                        );
                    } else {
                        return 'N/A';
                    }
                },
                order: 70,
            });
        }

        //Adjust visibility based on instance configuration
        const visibleColumnsProperty = getServerConfig()
            .skin_patient_view_copy_number_table_columns_show_on_init;
        if (visibleColumnsProperty) {
            const visibleColumns = visibleColumnsProperty.split(',');
            columns.forEach(column => {
                column.visible = visibleColumns.includes(column.name);
            });
        }

        const orderedColumns = _.sortBy(
            columns,
            (c: CNATableColumn) => c.order
        );
        return orderedColumns;
    }

    get pageStore() {
        return this.props.pageStore;
    }

    tableUI = MakeMobxView({
        await: () => [
            this.pageStore.studyIdToStudy,
            this.pageStore.genePanelDataByMolecularProfileIdAndSampleId,
            this.pageStore.discreteMolecularProfile,
            this.pageStore.genePanelIdToEntrezGeneIds,
            this.pageStore.gisticData,
            this.pageStore.mrnaRankMolecularProfileId,
            this.pageStore.cnaTableShowGeneFilterMenu,
            this.pageStore.referenceGenes,
        ],
        render: () => {
            const { someProfiled } = getSamplesProfiledStatus(
                this.props.sampleIds,
                this.pageStore.genePanelDataByMolecularProfileIdAndSampleId
                    .result,
                this.pageStore.discreteMolecularProfile.result
                    ?.molecularProfileId
            );

            return (
                <>
                    <SampleNotProfiledAlert
                        sampleManager={this.props.sampleManager!}
                        genePanelDataByMolecularProfileIdAndSampleId={
                            this.pageStore
                                .genePanelDataByMolecularProfileIdAndSampleId
                                .result
                        }
                        molecularProfiles={[
                            this.pageStore.discreteMolecularProfile.result!,
                        ]}
                    />

                    {someProfiled && (
                        <FeatureInstruction content={TABLE_FEATURE_INSTRUCTION}>
                            <CNATableComponent
                                columns={this.columns}
                                data={
                                    this.pageStore
                                        .mergedDiscreteCNADataFilteredByGene
                                }
                                dataStore={this.props.dataStore}
                                initialSortColumn={
                                    getServerConfig()
                                        .skin_patient_view_tables_default_sort_column
                                }
                                initialSortDirection="desc"
                                initialItemsPerPage={10}
                                itemsLabel="Copy Number Alteration"
                                itemsLabelPlural="Copy Number Alterations"
                                showCountHeader={true}
                                columnVisibility={this.props.columnVisibility}
                                columnVisibilityProps={
                                    this.props.columnVisibilityProps
                                }
                                onRowClick={this.props.onRowClick}
                                onRowMouseEnter={this.props.onRowMouseEnter}
                                onRowMouseLeave={this.props.onRowMouseLeave}
                                showCopyDownload={
                                    getServerConfig()
                                        .skin_hide_download_controls ===
                                    DownloadControlOption.SHOW_ALL
                                }
                            />
                        </FeatureInstruction>
                    )}
                </>
            );
        },
    });
}

function createCnaNamespaceColumns(
    config?: NamespaceColumnConfig
): CNATableColumn[] {
    const namespaceColumnRecords = createNamespaceColumns(config);
    const namespaceColumns = Object.values(
        namespaceColumnRecords
    ) as CNATableColumn[];
    _.forEach(namespaceColumns, c => {
        c.visible = false;
    });
    return namespaceColumns;
}
