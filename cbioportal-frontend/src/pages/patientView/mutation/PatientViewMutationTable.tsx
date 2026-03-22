import * as React from 'react';
import { computed, makeObservable } from 'mobx';
import {
    default as MutationTable,
    IMutationTableProps,
    MutationTableColumn,
    MutationTableColumnType,
} from 'shared/components/mutationTable/MutationTable';
import SampleManager from '../SampleManager';
import { Mutation } from 'cbioportal-ts-api-client';
import AlleleCountColumnFormatter from 'shared/components/mutationTable/column/AlleleCountColumnFormatter';
import AlleleFreqColumnFormatter from './column/AlleleFreqColumnFormatter';
import TumorColumnFormatter from './column/TumorColumnFormatter';
import PanelColumnFormatter from 'shared/components/mutationTable/column/PanelColumnFormatter';
import { isUncalled } from 'shared/lib/MutationUtils';
import ExonColumnFormatter from 'shared/components/mutationTable/column/ExonColumnFormatter';
import HeaderIconMenu from './HeaderIconMenu';
import GeneFilterMenu, { GeneFilterOption } from './GeneFilterMenu';
import { getDefaultASCNCopyNumberColumnDefinition } from 'shared/components/mutationTable/column/ascnCopyNumber/ASCNCopyNumberColumnFormatter';
import { getDefaultCancerCellFractionColumnDefinition } from 'shared/components/mutationTable/column/cancerCellFraction/CancerCellFractionColumnFormatter';
import { getDefaultClonalColumnDefinition } from 'shared/components/mutationTable/column/clonal/ClonalColumnFormatter';
import { getDefaultExpectedAltCopiesColumnDefinition } from 'shared/components/mutationTable/column/expectedAltCopies/ExpectedAltCopiesColumnFormatter';
import { ASCNAttributes } from 'shared/enums/ASCNEnums';
import AnnotationHeader from 'shared/components/mutationTable/column/annotation/AnnotationHeader';
import _ from 'lodash';
import { createMutationNamespaceColumns } from 'shared/components/mutationTable/MutationTableUtils';
import { getServerConfig } from 'config/config';
import { adjustVisibility } from 'shared/components/alterationsTableUtils';

export interface IPatientViewMutationTableProps extends IMutationTableProps {
    sampleManager: SampleManager | null;
    sampleToGenePanelId: { [sampleId: string]: string | undefined };
    genePanelIdToEntrezGeneIds: { [genePanelId: string]: number[] };
    sampleIds?: string[];
    showGeneFilterMenu?: boolean;
    currentGeneFilter: GeneFilterOption;
    onFilterGenes?: (option: GeneFilterOption) => void;
    onSelectGenePanel?: (name: string) => void;
    disableTooltip?: boolean;
    existsSomeMutationWithAscnProperty: { [property: string]: boolean };
    alleleFreqHeaderRender?: (name: string) => JSX.Element;
}

export const defaultAlleleFrequencyHeaderTooltip = (
    <span>Variant allele frequency in the tumor sample</span>
);

export default class PatientViewMutationTable extends MutationTable<
    IPatientViewMutationTableProps
> {
    constructor(props: IPatientViewMutationTableProps) {
        super(props);
        makeObservable(this);
    }

    public static defaultProps = {
        ...MutationTable.defaultProps,
        initialItemsPerPage: 10,
        paginationProps: { itemsPerPageOptions: [10, 25, 50, 100] },
        showGeneFilterMenu: true,
        columns: [
            MutationTableColumnType.COHORT,
            MutationTableColumnType.MRNA_EXPR,
            MutationTableColumnType.COPY_NUM,
            MutationTableColumnType.ASCN_METHOD,
            MutationTableColumnType.ASCN_COPY_NUM,
            MutationTableColumnType.ANNOTATION,
            MutationTableColumnType.CUSTOM_DRIVER,
            MutationTableColumnType.CUSTOM_DRIVER_TIER,
            MutationTableColumnType.HGVSG,
            MutationTableColumnType.REF_READS_N,
            MutationTableColumnType.VAR_READS_N,
            MutationTableColumnType.REF_READS,
            MutationTableColumnType.VAR_READS,
            MutationTableColumnType.START_POS,
            MutationTableColumnType.END_POS,
            MutationTableColumnType.REF_ALLELE,
            MutationTableColumnType.VAR_ALLELE,
            MutationTableColumnType.MUTATION_STATUS,
            MutationTableColumnType.VALIDATION_STATUS,
            MutationTableColumnType.CENTER,
            MutationTableColumnType.GENE,
            MutationTableColumnType.CHROMOSOME,
            MutationTableColumnType.PROTEIN_CHANGE,
            MutationTableColumnType.MUTATION_TYPE,
            MutationTableColumnType.VARIANT_TYPE,
            MutationTableColumnType.CLONAL,
            MutationTableColumnType.CANCER_CELL_FRACTION,
            MutationTableColumnType.EXPECTED_ALT_COPIES,
            MutationTableColumnType.FUNCTIONAL_IMPACT,
            MutationTableColumnType.TUMOR_ALLELE_FREQ,
            MutationTableColumnType.SAMPLES,
            MutationTableColumnType.EXON,
            MutationTableColumnType.HGVSC,
            MutationTableColumnType.GNOMAD,
            MutationTableColumnType.CLINVAR,
            MutationTableColumnType.DBSNP,
            MutationTableColumnType.GENE_PANEL,
            MutationTableColumnType.SIGNAL,
        ],
    };

    protected getSamples(): string[] {
        if (this.props.sampleIds) {
            return this.props.sampleIds;
        } else {
            return [];
        }
    }

    protected generateColumns() {
        super.generateColumns();

        this._columns[MutationTableColumnType.TUMOR_ALLELE_FREQ] = {
            name: 'Allele Freq',
            headerRender: this.props.alleleFreqHeaderRender,
            render: (d: Mutation[]) =>
                AlleleFreqColumnFormatter.renderFunction(
                    d,
                    this.props.sampleManager
                ),
            sortBy: (d: Mutation[]) =>
                AlleleFreqColumnFormatter.getSortValue(
                    d,
                    this.props.sampleManager
                ),
            download: (d: Mutation[]) =>
                AlleleFreqColumnFormatter.getFrequency(d),
            tooltip: this.props.alleleFreqHeaderRender
                ? undefined
                : defaultAlleleFrequencyHeaderTooltip,
            visible: AlleleFreqColumnFormatter.isVisible(
                this.props.sampleManager,
                this.props.dataStore
                    ? this.props.dataStore.allData
                    : this.props.data
            ),
        };

        this._columns[MutationTableColumnType.SAMPLES] = {
            name: 'Samples',
            render: (d: Mutation[]) =>
                TumorColumnFormatter.renderFunction(
                    d,
                    this.props.sampleManager,
                    this.props.sampleToGenePanelId,
                    this.props.genePanelIdToEntrezGeneIds,
                    this.props.onSelectGenePanel,
                    this.props.disableTooltip
                ),
            sortBy: (d: Mutation[]) =>
                TumorColumnFormatter.getSortValue(d, this.props.sampleManager),
            download: (d: Mutation[]) => TumorColumnFormatter.getSample(d),
            resizable: true,
        };

        const GenePanelProps = (d: Mutation[]) => ({
            data: d,
            sampleToGenePanelId: this.props.sampleToGenePanelId,
            sampleManager: this.props.sampleManager,
            genePanelIdToGene: this.props.genePanelIdToEntrezGeneIds,
            onSelectGenePanel: this.props.onSelectGenePanel,
        });

        this._columns[MutationTableColumnType.GENE_PANEL] = {
            name: 'Gene panel',
            render: (d: Mutation[]) =>
                PanelColumnFormatter.renderFunction(GenePanelProps(d)),
            download: (d: Mutation[]) =>
                PanelColumnFormatter.download(GenePanelProps(d)),
            visible: false,
            sortBy: (d: Mutation[]) =>
                PanelColumnFormatter.getGenePanelIds(GenePanelProps(d)),
        };

        // customization for ASCN-related columns
        // Patient view differs from default/results view because multiple samples can appear in a row
        // due to same variant in multiple samples
        // This can lead to cases where there are multiple icons/tooltips in a single cell
        // therefore patient view needs sampleManager to indicate which values match which samples

        this._columns[
            MutationTableColumnType.CANCER_CELL_FRACTION
        ] = {
            ...getDefaultCancerCellFractionColumnDefinition(
                this.getSamples(),
                this.props.sampleManager
            ),
            // Show CCF column by default if data exists
            visible:
                this.props.existsSomeMutationWithAscnProperty?.[
                    ASCNAttributes.CCF_EXPECTED_COPIES_STRING
                ] ?? false,
        };

        this._columns[
            MutationTableColumnType.CLONAL
        ] = getDefaultClonalColumnDefinition(
            this.getSamples(),
            this.props.sampleManager
        );

        this._columns[
            MutationTableColumnType.EXPECTED_ALT_COPIES
        ] = {
            ...getDefaultExpectedAltCopiesColumnDefinition(
                this.getSamples(),
                this.props.sampleManager
            ),
            // Show Expected Alt Copies column by default if data exists
            visible:
                this.props.existsSomeMutationWithAscnProperty?.[
                    ASCNAttributes.EXPECTED_ALT_COPIES_STRING
                ] ?? false,
        };

        this._columns[
            MutationTableColumnType.ASCN_COPY_NUM
        ] = getDefaultASCNCopyNumberColumnDefinition(
            this.getSamples(),
            this.props.sampleIdToClinicalDataMap,
            this.props.sampleManager
        );

        // customization for allele count columns

        this._columns[MutationTableColumnType.REF_READS_N].render = (
            d: Mutation[]
        ) =>
            AlleleCountColumnFormatter.renderFunction(
                d,
                this.getSamples(),
                'normalRefCount'
            );
        this._columns[MutationTableColumnType.REF_READS_N].download = (
            d: Mutation[]
        ) => AlleleCountColumnFormatter.getReads(d, 'normalRefCount');

        this._columns[MutationTableColumnType.VAR_READS_N].render = (
            d: Mutation[]
        ) =>
            AlleleCountColumnFormatter.renderFunction(
                d,
                this.getSamples(),
                'normalAltCount'
            );
        this._columns[MutationTableColumnType.VAR_READS_N].download = (
            d: Mutation[]
        ) => AlleleCountColumnFormatter.getReads(d, 'normalAltCount');

        this._columns[MutationTableColumnType.REF_READS].render = (
            d: Mutation[]
        ) =>
            AlleleCountColumnFormatter.renderFunction(
                d,
                this.getSamples(),
                'tumorRefCount'
            );
        this._columns[MutationTableColumnType.REF_READS].download = (
            d: Mutation[]
        ) => AlleleCountColumnFormatter.getReads(d, 'tumorRefCount');

        this._columns[MutationTableColumnType.VAR_READS].render = (
            d: Mutation[]
        ) =>
            AlleleCountColumnFormatter.renderFunction(
                d,
                this.getSamples(),
                'tumorAltCount'
            );
        this._columns[MutationTableColumnType.VAR_READS].download = (
            d: Mutation[]
        ) => AlleleCountColumnFormatter.getReads(d, 'tumorAltCount');

        // customization for columns
        this._columns[MutationTableColumnType.EXON].sortBy = undefined;
        this._columns[MutationTableColumnType.EXON].render = (d: Mutation[]) =>
            ExonColumnFormatter.renderFunction(
                d,
                this.props.genomeNexusCache,
                true
            );
        this._columns[MutationTableColumnType.GENE].headerRender = (
            name: string
        ) => {
            return (
                <HeaderIconMenu
                    name={name}
                    showIcon={this.props.showGeneFilterMenu}
                >
                    <GeneFilterMenu
                        onOptionChanged={this.props.onFilterGenes}
                        currentSelection={this.props.currentGeneFilter}
                    />
                </HeaderIconMenu>
            );
        };
        this._columns[MutationTableColumnType.ANNOTATION].headerRender = (
            name: string
        ) => {
            return (
                <AnnotationHeader
                    name={name}
                    width={this.oncokbWidth}
                    mergeOncoKbIcons={this.props.mergeOncoKbIcons}
                    onOncoKbIconToggle={this.handleOncoKbIconModeToggle}
                    showRevueIcon={
                        this.props.enableRevue && this.shouldShowRevue
                    }
                />
            );
        };

        // order columns
        this._columns[MutationTableColumnType.SAMPLES].order = 5;
        this._columns[MutationTableColumnType.GENE].order = 20;
        this._columns[MutationTableColumnType.GENE_PANEL].order = 25;
        this._columns[MutationTableColumnType.PROTEIN_CHANGE].order = 30;
        this._columns[MutationTableColumnType.ANNOTATION].order = 35;
        this._columns[MutationTableColumnType.CUSTOM_DRIVER].order = 36;
        this._columns[MutationTableColumnType.CUSTOM_DRIVER_TIER].order = 37;
        this._columns[MutationTableColumnType.FUNCTIONAL_IMPACT].order = 38;
        this._columns[MutationTableColumnType.CHROMOSOME].order = 40;
        this._columns[MutationTableColumnType.START_POS].order = 50;
        this._columns[MutationTableColumnType.END_POS].order = 60;
        this._columns[MutationTableColumnType.REF_ALLELE].order = 70;
        this._columns[MutationTableColumnType.VAR_ALLELE].order = 80;
        this._columns[MutationTableColumnType.HGVSG].order = 81;
        this._columns[MutationTableColumnType.HGVSC].order = 82;
        this._columns[MutationTableColumnType.MUTATION_STATUS].order = 90;
        this._columns[MutationTableColumnType.VALIDATION_STATUS].order = 100;
        this._columns[MutationTableColumnType.MUTATION_TYPE].order = 110;
        this._columns[MutationTableColumnType.VARIANT_TYPE].order = 114;
        this._columns[MutationTableColumnType.ASCN_METHOD].order = 115;
        this._columns[MutationTableColumnType.CLONAL].order = 116;
        this._columns[MutationTableColumnType.CANCER_CELL_FRACTION].order = 117;
        this._columns[MutationTableColumnType.EXPECTED_ALT_COPIES].order = 118;
        this._columns[MutationTableColumnType.ASCN_COPY_NUM].order = 119;
        this._columns[MutationTableColumnType.CENTER].order = 120;
        this._columns[MutationTableColumnType.TUMOR_ALLELE_FREQ].order = 130;
        this._columns[MutationTableColumnType.VAR_READS].order = 140;
        this._columns[MutationTableColumnType.REF_READS].order = 150;
        this._columns[MutationTableColumnType.VAR_READS_N].order = 170;
        this._columns[MutationTableColumnType.REF_READS_N].order = 175;
        this._columns[MutationTableColumnType.COPY_NUM].order = 177;
        this._columns[MutationTableColumnType.MRNA_EXPR].order = 182;
        this._columns[MutationTableColumnType.COHORT].order = 183;
        this._columns[MutationTableColumnType.EXON].order = 185;
        this._columns[MutationTableColumnType.GNOMAD].order = 187;
        this._columns[MutationTableColumnType.CLINVAR].order = 188;
        this._columns[MutationTableColumnType.DBSNP].order = 189;
        this._columns[MutationTableColumnType.SIGNAL].order = 190;

        // exclusions
        this._columns[MutationTableColumnType.MRNA_EXPR].shouldExclude = () => {
            return (
                !this.props.mrnaExprRankMolecularProfileId ||
                this.getSamples().length > 1
            );
        };

        this._columns[MutationTableColumnType.CLONAL].shouldExclude = () => {
            return !this.props.existsSomeMutationWithAscnProperty[
                ASCNAttributes.CCF_EXPECTED_COPIES_STRING
            ];
        };

        this._columns[
            MutationTableColumnType.ASCN_METHOD
        ].shouldExclude = () => {
            return !this.props.existsSomeMutationWithAscnProperty[
                ASCNAttributes.ASCN_METHOD_STRING
            ];
        };

        this._columns[
            MutationTableColumnType.CANCER_CELL_FRACTION
        ].shouldExclude = () => {
            return !this.props.existsSomeMutationWithAscnProperty[
                ASCNAttributes.CCF_EXPECTED_COPIES_STRING
            ];
        };

        this._columns[
            MutationTableColumnType.EXPECTED_ALT_COPIES
        ].shouldExclude = () => {
            return !this.props.existsSomeMutationWithAscnProperty[
                ASCNAttributes.EXPECTED_ALT_COPIES_STRING
            ];
        };

        this._columns[
            MutationTableColumnType.ASCN_COPY_NUM
        ].shouldExclude = () => {
            return (
                !this.props.existsSomeMutationWithAscnProperty[
                    ASCNAttributes.ASCN_INTEGER_COPY_NUMBER_STRING
                ] ||
                !this.props.existsSomeMutationWithAscnProperty[
                    ASCNAttributes.TOTAL_COPY_NUMBER_STRING
                ] ||
                !this.props.existsSomeMutationWithAscnProperty[
                    ASCNAttributes.MINOR_COPY_NUMBER_STRING
                ]
            );
        };

        // only hide tumor column if there is one sample and no uncalled
        // mutations (there is no information added in that case by the sample
        // label)
        this._columns[MutationTableColumnType.SAMPLES].shouldExclude = () => {
            return this.getSamples().length < 2 && !this.hasUncalledMutations;
        };
        this._columns[MutationTableColumnType.COPY_NUM].shouldExclude = () => {
            return (
                !this.props.discreteCNAMolecularProfileId ||
                this.getSamples().length > 1
            );
        };

        // generate namespace columns
        const namespaceColumns = createMutationNamespaceColumns(
            this.props.namespaceColumns
        );
        _.forIn(
            namespaceColumns,
            (column: MutationTableColumn, columnName: string) => {
                this._columns[columnName] = column;
            }
        );

        //Adjust column visibility according to portal.properties
        adjustVisibility(
            this._columns,
            Object.keys(namespaceColumns),
            getServerConfig()
                .skin_patient_view_mutation_table_columns_show_on_init,
            getServerConfig()
                .skin_mutation_table_namespace_column_show_by_default
        );
    }

    @computed private get hasUncalledMutations(): boolean {
        let data: Mutation[][] = [];
        if (this.props.data) {
            data = this.props.data;
        } else if (this.props.dataStore) {
            data = this.props.dataStore.allData;
        }
        return data.some((row: Mutation[]) => {
            return row.some((m: Mutation) => {
                return isUncalled(m.molecularProfileId);
            });
        });
    }
}
