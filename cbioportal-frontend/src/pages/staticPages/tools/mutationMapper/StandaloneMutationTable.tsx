import * as React from 'react';
import {
    IMutationTableProps,
    MutationTableColumnType,
    default as MutationTable,
    MutationTableColumn,
} from 'shared/components/mutationTable/MutationTable';
import TumorAlleleFreqColumnFormatter from 'shared/components/mutationTable/column/TumorAlleleFreqColumnFormatter';
import CancerTypeColumnFormatter from 'shared/components/mutationTable/column/CancerTypeColumnFormatter';
import _ from 'lodash';
import { createMutationNamespaceColumns } from 'shared/components/mutationTable/MutationTableUtils';

export interface IStandaloneMutationTableProps extends IMutationTableProps {
    // add standalone specific props here if needed
}

export default class StandaloneMutationTable extends MutationTable<
    IStandaloneMutationTableProps
> {
    constructor(props: IStandaloneMutationTableProps) {
        super(props);
    }

    public static defaultProps = {
        ...MutationTable.defaultProps,
        columns: [
            MutationTableColumnType.SAMPLE_ID,
            MutationTableColumnType.CANCER_TYPE_DETAILED,
            MutationTableColumnType.ANNOTATION,
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
            MutationTableColumnType.TUMOR_ALLELE_FREQ,
            MutationTableColumnType.NORMAL_ALLELE_FREQ,
            MutationTableColumnType.EXON,
            MutationTableColumnType.HGVSC,
            MutationTableColumnType.GNOMAD,
            MutationTableColumnType.CLINVAR,
            MutationTableColumnType.DBSNP,
            MutationTableColumnType.SIGNAL,
        ],
    };

    protected generateColumns() {
        super.generateColumns();

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

        // override default visibility for some columns
        this._columns[
            MutationTableColumnType.TUMOR_ALLELE_FREQ
        ].visible = TumorAlleleFreqColumnFormatter.isVisible(
            this.props.dataStore
                ? this.props.dataStore.allData
                : this.props.data
        );
        this._columns[
            MutationTableColumnType.CANCER_TYPE_DETAILED
        ].visible = CancerTypeColumnFormatter.isVisible(
            this.props.dataStore
                ? this.props.dataStore.allData
                : this.props.data,
            this.props.uniqueSampleKeyToTumorType
        );
        this._columns[MutationTableColumnType.FUNCTIONAL_IMPACT].visible = true;

        // order columns
        //this._columns[MutationTableColumnType.STUDY].order = 0;
        this._columns[MutationTableColumnType.SAMPLE_ID].order = 10;
        this._columns[MutationTableColumnType.CANCER_TYPE_DETAILED].order = 15;
        this._columns[MutationTableColumnType.PROTEIN_CHANGE].order = 20;
        this._columns[MutationTableColumnType.ANNOTATION].order = 30;
        this._columns[MutationTableColumnType.FUNCTIONAL_IMPACT].order = 38;
        this._columns[MutationTableColumnType.MUTATION_TYPE].order = 40;
        this._columns[MutationTableColumnType.VARIANT_TYPE].order = 45;
        //this._columns[MutationTableColumnType.COPY_NUM].order = 50;
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
        //this._columns[MutationTableColumnType.NUM_MUTATIONS].order = 220;
        this._columns[MutationTableColumnType.EXON].order = 220;
        this._columns[MutationTableColumnType.GNOMAD].order = 240;
        this._columns[MutationTableColumnType.CLINVAR].order = 250;
        this._columns[MutationTableColumnType.DBSNP].order = 260;
        this._columns[MutationTableColumnType.SIGNAL].order = 270;
    }
}
