import * as React from 'react';
import { MobxPromise } from 'cbioportal-frontend-commons';
import {
    IMutationTableProps,
    MutationTableColumnType,
    default as MutationTable,
    MutationTableColumn,
} from 'shared/components/mutationTable/MutationTable';
import CancerTypeColumnFormatter from 'shared/components/mutationTable/column/CancerTypeColumnFormatter';
import TumorAlleleFreqColumnFormatter from 'shared/components/mutationTable/column/TumorAlleleFreqColumnFormatter';
import { Mutation, ClinicalAttribute } from 'cbioportal-ts-api-client';
import ExonColumnFormatter from 'shared/components/mutationTable/column/ExonColumnFormatter';
import ClinicalAttributeColumnFormatter from 'shared/components/mutationTable/column/ClinicalAttributeColumnFormatter';
import { ASCNAttributes } from 'shared/enums/ASCNEnums';
import { IColumnVisibilityControlsProps } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import AddColumns from './AddColumns';
import ClinicalAttributeCache from 'shared/cache/ClinicalAttributeCache';
import { createMutationNamespaceColumns } from 'shared/components/mutationTable/MutationTableUtils';
import _ from 'lodash';
import { adjustVisibility } from 'shared/components/alterationsTableUtils';
import { getServerConfig } from 'config/config';

export interface IResultsViewMutationTableProps extends IMutationTableProps {
    // add results view specific props here if needed
    totalNumberOfExons?: string;
    isCanonicalTranscript: boolean | undefined;
    existsSomeMutationWithAscnProperty: { [property: string]: boolean };
    mutationsTabClinicalAttributes: MobxPromise<ClinicalAttribute[]>;
    clinicalAttributeIdToAvailableFrequency: MobxPromise<{
        [clinicalAttributeId: string]: number;
    }>;
    clinicalAttributeCache?: ClinicalAttributeCache;
}
//
export default class ResultsViewMutationTable extends MutationTable<
    IResultsViewMutationTableProps
> {
    public static defaultProps = {
        ...MutationTable.defaultProps,
        columns: [
            MutationTableColumnType.GENE,
            MutationTableColumnType.STUDY,
            MutationTableColumnType.SAMPLE_ID,
            MutationTableColumnType.COPY_NUM,
            MutationTableColumnType.ASCN_METHOD,
            MutationTableColumnType.ASCN_COPY_NUM,
            MutationTableColumnType.ANNOTATION,
            MutationTableColumnType.CUSTOM_DRIVER,
            MutationTableColumnType.CUSTOM_DRIVER_TIER,
            MutationTableColumnType.HGVSG,
            MutationTableColumnType.FUNCTIONAL_IMPACT,
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
            MutationTableColumnType.CHROMOSOME,
            MutationTableColumnType.PROTEIN_CHANGE,
            MutationTableColumnType.MUTATION_TYPE,
            MutationTableColumnType.VARIANT_TYPE,
            MutationTableColumnType.CLONAL,
            MutationTableColumnType.CANCER_CELL_FRACTION,
            MutationTableColumnType.EXPECTED_ALT_COPIES,
            MutationTableColumnType.TUMOR_ALLELE_FREQ,
            MutationTableColumnType.NORMAL_ALLELE_FREQ,
            MutationTableColumnType.CANCER_TYPE_DETAILED,
            MutationTableColumnType.NUM_MUTATIONS,
            MutationTableColumnType.EXON,
            MutationTableColumnType.HGVSC,
            MutationTableColumnType.GNOMAD,
            MutationTableColumnType.CLINVAR,
            MutationTableColumnType.DBSNP,
            MutationTableColumnType.SIGNAL,
        ],
        columnVisibilityProps: {},
    };

    constructor(props: IResultsViewMutationTableProps) {
        super(props);
        this.props.columnVisibilityProps!.customDropdown = (
            columnVisibilityControlsProps: IColumnVisibilityControlsProps
        ) => {
            const resetColumnVisibility = () => {
                if (columnVisibilityControlsProps.resetColumnVisibility) {
                    columnVisibilityControlsProps.resetColumnVisibility();
                }

                // resetting the controls is not enough,
                // we need to also reset the column visibility stored in the user selection store
                if (this.props.storeColumnVisibility) {
                    this.props.storeColumnVisibility(undefined); // reset
                }
            };

            return (
                <AddColumns
                    className={columnVisibilityControlsProps.className}
                    columnVisibility={
                        columnVisibilityControlsProps.columnVisibility
                    }
                    onColumnToggled={
                        columnVisibilityControlsProps.onColumnToggled
                    }
                    resetColumnVisibility={resetColumnVisibility}
                    showResetColumnsButton={
                        columnVisibilityControlsProps.showResetColumnsButton
                    }
                    clinicalAttributes={
                        this.props.mutationsTabClinicalAttributes.result!
                    }
                    clinicalAttributeIdToAvailableFrequency={
                        this.props.clinicalAttributeIdToAvailableFrequency
                    }
                />
            );
        };
    }

    componentWillUpdate(nextProps: IResultsViewMutationTableProps) {
        this._columns[MutationTableColumnType.STUDY].visible = !!(
            nextProps.studyIdToStudy &&
            Object.keys(nextProps.studyIdToStudy).length > 1
        );
    }

    protected generateColumns() {
        super.generateColumns();

        // generate clinical attribute columns
        let clinicalAttributes = this.props.mutationsTabClinicalAttributes
            .result!;
        for (let i = 0; i < clinicalAttributes.length; i++) {
            const attributeId = clinicalAttributes[i].clinicalAttributeId;
            if (
                this.props.columns &&
                !this.props.columns.includes(attributeId)
            ) {
                this.props.columns.push(attributeId);
            }

            this._columns[attributeId] = {
                id: attributeId,
                name: clinicalAttributes[i].displayName,
                render: ClinicalAttributeColumnFormatter.makeRenderFunction(
                    clinicalAttributes[i],
                    this.props.clinicalAttributeCache
                ),
                download: (d: Mutation[]) =>
                    ClinicalAttributeColumnFormatter.getTextValue(
                        d,
                        clinicalAttributes[i],
                        this.props.clinicalAttributeCache
                    ),
                sortBy: (d: Mutation[]) =>
                    ClinicalAttributeColumnFormatter.sortBy(
                        d,
                        clinicalAttributes[i],
                        this.props.clinicalAttributeCache
                    ),
                filter: (
                    d: Mutation[],
                    filterString: string,
                    filterStringUpper: string
                ) =>
                    ClinicalAttributeColumnFormatter.filter(
                        d,
                        filterStringUpper,
                        clinicalAttributes[i],
                        this.props.clinicalAttributeCache
                    ),
                tooltip: <span>{clinicalAttributes[i].description}</span>,
                visible: false,
                order: 300,
            };
        }

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

        this._columns[MutationTableColumnType.GENE].visible = false;

        // override default visibility for some columns
        this._columns[
            MutationTableColumnType.CANCER_TYPE_DETAILED
        ].visible = CancerTypeColumnFormatter.isVisible(
            this.props.dataStore
                ? this.props.dataStore.allData
                : this.props.data,
            this.props.uniqueSampleKeyToTumorType
        );
        this._columns[
            MutationTableColumnType.TUMOR_ALLELE_FREQ
        ].visible = TumorAlleleFreqColumnFormatter.isVisible(
            this.props.dataStore
                ? this.props.dataStore.allData
                : this.props.data
        );

        // disable annotation column if non canonical transcript is selected
        this._columns[MutationTableColumnType.ANNOTATION].shouldExclude = () =>
            this.props.isCanonicalTranscript === false;

        // order columns
        this._columns[MutationTableColumnType.STUDY].order = 0;
        this._columns[MutationTableColumnType.SAMPLE_ID].order = 10;
        if ('CANCER_TYPE' in this._columns) {
            this._columns['CANCER_TYPE'].order = 14;
            this._columns['CANCER_TYPE'].resizable = true;
            this._columns['CANCER_TYPE'].truncateOnResize = true;
        }
        this._columns[MutationTableColumnType.CANCER_TYPE_DETAILED].order = 15;
        this._columns[MutationTableColumnType.PROTEIN_CHANGE].order = 20;
        this._columns[MutationTableColumnType.ANNOTATION].order = 30;
        this._columns[MutationTableColumnType.CUSTOM_DRIVER].order = 33;
        this._columns[MutationTableColumnType.CUSTOM_DRIVER_TIER].order = 34;
        this._columns[MutationTableColumnType.FUNCTIONAL_IMPACT].order = 38;
        this._columns[MutationTableColumnType.MUTATION_TYPE].order = 40;
        this._columns[MutationTableColumnType.VARIANT_TYPE].order = 45;
        this._columns[MutationTableColumnType.ASCN_METHOD].order = 46;
        this._columns[MutationTableColumnType.CLONAL].order = 47;
        this._columns[MutationTableColumnType.CANCER_CELL_FRACTION].order = 48;
        this._columns[MutationTableColumnType.EXPECTED_ALT_COPIES].order = 49;
        this._columns[MutationTableColumnType.ASCN_COPY_NUM].order = 50;
        this._columns[MutationTableColumnType.COPY_NUM].order = 51;
        this._columns[MutationTableColumnType.MUTATION_STATUS].order = 70;
        this._columns[MutationTableColumnType.VALIDATION_STATUS].order = 80;
        this._columns[MutationTableColumnType.CENTER].order = 100;
        this._columns[MutationTableColumnType.CHROMOSOME].order = 110;
        this._columns[MutationTableColumnType.START_POS].order = 120;
        this._columns[MutationTableColumnType.END_POS].order = 130;
        this._columns[MutationTableColumnType.REF_ALLELE].order = 140;
        this._columns[MutationTableColumnType.VAR_ALLELE].order = 150;
        this._columns[MutationTableColumnType.HGVSG].order = 151;
        this._columns[MutationTableColumnType.HGVSC].order = 152;
        this._columns[MutationTableColumnType.TUMOR_ALLELE_FREQ].order = 160;
        this._columns[MutationTableColumnType.NORMAL_ALLELE_FREQ].order = 170;
        this._columns[MutationTableColumnType.VAR_READS].order = 180;
        this._columns[MutationTableColumnType.REF_READS].order = 190;
        this._columns[MutationTableColumnType.VAR_READS_N].order = 200;
        this._columns[MutationTableColumnType.REF_READS_N].order = 210;
        this._columns[MutationTableColumnType.NUM_MUTATIONS].order = 220;
        this._columns[MutationTableColumnType.EXON].order = 230;
        this._columns[MutationTableColumnType.GNOMAD].order = 260;
        this._columns[MutationTableColumnType.CLINVAR].order = 270;
        this._columns[MutationTableColumnType.DBSNP].order = 280;
        this._columns[MutationTableColumnType.SIGNAL].order = 290;

        // exclude
        this._columns[
            MutationTableColumnType.CUSTOM_DRIVER
        ].shouldExclude = () => {
            return !this.props.enableCustomDriver;
        };

        this._columns[
            MutationTableColumnType.CUSTOM_DRIVER_TIER
        ].shouldExclude = () => {
            return !this.props.enableCustomDriver;
        };

        this._columns[
            MutationTableColumnType.CANCER_TYPE_DETAILED
        ].shouldExclude = () => {
            return !this.props.uniqueSampleKeyToTumorType;
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

        this._columns[
            MutationTableColumnType.NUM_MUTATIONS
        ].shouldExclude = () => {
            return !this.props.mutationCountCache;
        };

        // customization for columns
        this._columns[MutationTableColumnType.EXON].render = (d: Mutation[]) =>
            ExonColumnFormatter.renderFunction(
                d,
                this.props.genomeNexusCache,
                false
            );
        this._columns[MutationTableColumnType.EXON].headerRender = () => (
            <span style={{ display: 'inline-block' }}>
                Exon
                <br />({this.props.totalNumberOfExons} in total)
            </span>
        );

        //Adjust column visibility according to portal.properties
        adjustVisibility(
            this._columns,
            Object.keys(namespaceColumns),
            getServerConfig()
                .skin_results_view_mutation_table_columns_show_on_init,
            getServerConfig()
                .skin_mutation_table_namespace_column_show_by_default
        );
    }
}
