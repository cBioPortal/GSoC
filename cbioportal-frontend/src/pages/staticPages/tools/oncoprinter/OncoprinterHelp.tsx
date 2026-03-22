import styles from './styles.module.scss';
import {
    ClinicalTrackDataType,
    HeatmapTrackDataType,
    ONCOPRINTER_VAL_NA,
} from './OncoprinterClinicalAndHeatmapUtils';
import * as React from 'react';

export const GenomicFormatHelp = (
    <div className={styles.dataFormatHelp}>
        <h4>Genomic data format</h4>
        Each row of the data can take one of two formats, with tab- or
        space-delimited columns:
        <br />
        <strong>(1)</strong> <code>Sample</code> only (e.g. so that percent
        altered in your data can be properly calculated by including unaltered
        samples).
        <br />
        <strong>(2)</strong> <code>Sample</code>&#9;<code>Gene</code>&#9;
        <code>Alteration</code>&#9;
        <code>Type</code>&#9;
        <code>Track Name (optional)</code>
        <br />
        {/*<strong>(3) (MAF format, mutation only)</strong> <code>Sample</code>, <code>Cancer Type</code>, <code>Protein Change</code>, <code>Mutation Type</code>,	<code>Chromosome</code>,
        <code>Start position</code>, <code>End position</code>, <code>Reference allele</code>,	<code>Variant allele</code><br/>
        <br/>*/}
        For rows of type 2, the definition is below:
        <ol>
            <li>
                <code>Sample</code>: Sample ID
            </li>
            <li>
                <code>Gene</code>: Gene symbol (or other gene identifier)
            </li>
            <li>
                <code>Alteration</code>: Definition of the alteration event
                <ul>
                    <li>
                        Mutation event: amino acid change or any other
                        information about the mutation
                    </li>
                    <li>Fusion event: fusion information</li>
                    <li>
                        Copy number alteration (CNA) - please use one of the
                        four events below:
                        <ul>
                            <li>
                                <code>AMP</code>: high level amplification
                            </li>
                            <li>
                                <code>GAIN</code>: low level gain
                            </li>
                            <li>
                                <code>HETLOSS</code>: shallow deletion
                            </li>
                            <li>
                                <code>HOMDEL</code>: deep deletion
                            </li>
                        </ul>
                    </li>
                    <li>
                        mRNA expression - please use one of the two events
                        below:
                        <ul>
                            <li>
                                <code>HIGH</code>: expression high
                            </li>
                            <li>
                                <code>LOW</code>: expression low
                            </li>
                        </ul>
                    </li>
                    <li>
                        Protein expression - please use one of the two events
                        below:
                        <ul>
                            <li>
                                <code>HIGH</code>: Protein high
                            </li>
                            <li>
                                <code>LOW</code>: Protein low
                            </li>
                        </ul>
                    </li>
                </ul>
            </li>
            <li>
                <code>Type</code>: Definition of the alteration type. It has to
                be one of the following.
                <ul>
                    <li>
                        For a mutation event, please use one of the five
                        mutation types below:
                        <ul>
                            <li>
                                <code>MISSENSE</code>: a missense mutation
                            </li>
                            <li>
                                <code>INFRAME</code>: a inframe mutation
                            </li>
                            <li>
                                <code>TRUNC</code>: a truncation mutation
                            </li>
                            <li>
                                <code>PROMOTER</code>: a promoter mutation
                            </li>
                            <li>
                                <code>SPLICE</code>: a splice mutation
                            </li>
                            <li>
                                <code>OTHER</code>: any other kind of mutation
                            </li>
                        </ul>
                        <br />
                        In addition, mutation types can be augmented with the
                        modifiers{' '}
                        <span style={{ whiteSpace: 'nowrap' }}>
                            <code>_GERMLINE</code> and <code>_DRIVER</code>
                        </span>
                        to indicate that they are, respectively, germline and
                        driver mutations.
                        <br />
                        For example: <code>INFRAME_GERMLINE</code> or{' '}
                        <code>MISSENSE_GERMLINE_DRIVER</code> or{' '}
                        <code>TRUNC_DRIVER</code>.
                        <br />
                    </li>
                    <li>
                        <code>FUSION</code>: a fusion event
                    </li>
                    <li>
                        <code>CNA</code>: a copy number alteration event
                    </li>
                    <li>
                        <code>EXP</code>: a expression event
                    </li>
                    <li>
                        <code>PROT</code>: a protein expression event
                    </li>
                </ul>
            </li>
            <li>
                <code>Track Name</code>: Optional way to create a track with a
                different label than the gene. A common use case is to have more
                than one track with the same gene, e.g. where one track shows
                different data for each sample. Another use case could be to
                have one track that has data from more than one gene.
            </li>
        </ol>
    </div>
);

export const ClinicalFormatHelp = (
    <div className={styles.dataFormatHelp}>
        <h4>Clinical data format</h4>
        All rows are tab- or space-delimited.
        <br />
        The first (header) row gives the names of the tracks, as well as their
        data type. The possible clinical data types are{' '}
        {ClinicalTrackDataType.NUMBER}, {ClinicalTrackDataType.LOG_NUMBER}, or{' '}
        {ClinicalTrackDataType.STRING}. The default track type is{' '}
        {ClinicalTrackDataType.STRING}). Finally, you can also enter a{' '}
        /-delimited list of labels to create a stacked-bar-chart track (see
        example data below). An example first row is:
        <br />
        <code>Sample</code>&#9;
        <code>Age({ClinicalTrackDataType.NUMBER})</code>&#9;
        <code>Cancer_Type({ClinicalTrackDataType.STRING})</code>&#9;
        <code>Mutation_Count({ClinicalTrackDataType.LOG_NUMBER})</code>&#9;
        <code>
            Mutation_Spectrum(C{'>'}A/C{'>'}G/C{'>'}T/T{'>'}A/T{'>'}C/T{'>'}G)
        </code>
        <br />
        Each following row gives the sample id, then the value for each clinical
        attribute, or the special value {ONCOPRINTER_VAL_NA} which indicates
        that there's no data.
        <br />
        Some example data rows would then be:
        <br />
        <code>sample1</code>&#9;<code>30</code>&#9;
        <code>{ONCOPRINTER_VAL_NA}</code>&#9;<code>1</code>
        &#9;<code>1/8/3/0/9/2</code>
        <br />
        <code>sample2</code>&#9;<code>27</code>&#9;<code>Colorectal</code>
        &#9;<code>100</code>&#9;<code>5/1/4/2/0/3</code>
        <br />
        <code>sample3</code>&#9;<code>{ONCOPRINTER_VAL_NA}</code>
        &#9;<code>Breast</code>&#9;
        <code>{ONCOPRINTER_VAL_NA}</code>&#9;
        <code>{ONCOPRINTER_VAL_NA}</code>
        <br />
    </div>
);

export const HeatmapFormatHelp = (
    <div className={styles.dataFormatHelp}>
        <h4>Heatmap data format</h4>
        All rows are tab- or space-delimited.
        <br />
        The first (header) row gives the names of the tracks, as well as their
        data type. The possible heatmap types are{' '}
        {HeatmapTrackDataType.HEATMAP_ZSCORE} for z-score data,{' '}
        {HeatmapTrackDataType.HEATMAP_01} for data between 0 and 1 (such as
        methylation), and {HeatmapTrackDataType.HEATMAP} which is for all other
        heatmaps. The default track type is {HeatmapTrackDataType.HEATMAP}. An
        example first row is:
        <br />
        <code>Sample</code>&#9;
        <code>methylation({HeatmapTrackDataType.HEATMAP_01})</code>&#9;
        <code>expression({HeatmapTrackDataType.HEATMAP})</code>&#9;
        <code>zscores({HeatmapTrackDataType.HEATMAP_ZSCORE})</code>
        <br />
        Each following row gives the sample id, then the value for each heatmap
        track, or the special value {ONCOPRINTER_VAL_NA} which indicates that
        there's no data.
        <br />
        Some example data rows would then be:
        <br />
        <code>sample1</code>&#9;<code>0.5</code>&#9;
        <code>{ONCOPRINTER_VAL_NA}</code>&#9;<code>-1.3</code>
        <br />
        <code>sample2</code>&#9;<code>0.2</code>&#9;<code>5</code>
        &#9;<code>2.3</code>
        <br />
        <code>sample3</code>&#9;<code>{ONCOPRINTER_VAL_NA}</code>
        &#9;<code>-3</code>&#9;
        <code>{ONCOPRINTER_VAL_NA}</code>
        <br />
    </div>
);
