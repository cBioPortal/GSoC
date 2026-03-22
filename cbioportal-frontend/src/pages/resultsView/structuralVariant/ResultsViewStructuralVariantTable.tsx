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

import * as React from 'react';
import StructuralVariantTable, {
    FusionTableColumnType,
    IFusionTableProps,
} from 'shared/components/structuralVariantTable/StructuralVariantTable';

export interface IResultsViewFusionTableProps extends IFusionTableProps {
    // add results view specific props here if needed
}

export default class ResultsViewStructuralVariantTable extends StructuralVariantTable<
    IResultsViewFusionTableProps
> {
    public static defaultProps = {
        ...StructuralVariantTable.defaultProps,
        // The columns order is defined here
        columns: [
            FusionTableColumnType.STUDY,
            FusionTableColumnType.SAMPLE_ID,
            FusionTableColumnType.CANCER_TYPE_DETAILED,
            FusionTableColumnType.SITE1_HUGO_SYMBOL,
            FusionTableColumnType.SITE1_ENTREZ_GENE_ID,
            FusionTableColumnType.SITE1_ENSEMBL_TRANSCRIPT_ID,
            FusionTableColumnType.SITE1_CHROMOSOME,
            FusionTableColumnType.SITE1_POSITION,
            FusionTableColumnType.SITE1_EXON,
            FusionTableColumnType.SITE1_DESCRIPTION,
            FusionTableColumnType.SITE2_HUGO_SYMBOL,
            FusionTableColumnType.SITE2_ENTREZ_GENE_ID,
            FusionTableColumnType.SITE2_ENSEMBL_TRANSCRIPT_ID,
            FusionTableColumnType.SITE2_CHROMOSOME,
            FusionTableColumnType.SITE2_POSITION,
            FusionTableColumnType.SITE2_EXON,
            FusionTableColumnType.SITE2_DESCRIPTION,
            FusionTableColumnType.SITE2_EFFECT_ON_FRAME,
            FusionTableColumnType.ANNOTATION,
            FusionTableColumnType.MUTATION_STATUS,
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
            FusionTableColumnType.SV_DESCRIPTION,
            FusionTableColumnType.BREAKPOINT_TYPE,
            FusionTableColumnType.CENTER,
            FusionTableColumnType.CONNECTION_TYPE,
            FusionTableColumnType.EVENT_INFO,
            FusionTableColumnType.VARIANT_CLASS,
            FusionTableColumnType.LENGTH,
            FusionTableColumnType.COMMENTS,
        ],
    };
}
