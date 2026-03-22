const _ = require('lodash');

const suppressors = [
    // function(report) {
    //     return (
    //         report.clDataSorted[0].counts.find(m => m.value == 'not_mutated')
    //             .count ===
    //         report.legacyDataSorted[0].counts.find(
    //             m => m.value == 'not_profiled'
    //         ).count
    //     );
    // },
    // function(report) {
    //     const diff = _.difference(
    //         report.chResult.body[0].counts.map(c => c.value),
    //         report.legacyResult.body[0].counts.map(c => c.value)
    //     );
    //     return (
    //         diff.includes('not_profiled') &&
    //         _.sumBy(report.legacyResult.body[0].counts, 'count') ===
    //             _.sumBy(report.chResult.body[0].counts, 'count')
    //     );
    // },
    // function(report) {
    //     return (
    //         report.test.data.studyViewFilter.clinicalDataFilters[0].values
    //             .length > 10
    //     );
    // },

    // function(report) {
    //     return report.test.data.clinicalDataFilters[0].values.length > 10;
    // },

    function(report) {
        return (
            report.test.data.customDataFilters ||
            report.test.data.studyViewFilter.customDataFilters
        );
    },

    function(report) {
        return (
            _.intersection(
                report.test.data.studyIds ||
                    report.test.data.studyViewFilter.studyIds,
                [
                    'genie_private',
                    'prad_organoids_msk_2022', // has data corruption (duplicate samples with casing)
                ]
            ).length > 0
        );
    },

    function(report) {
        // this is broke legacy endpoint that returns
        return report.legacyResult.status == 501;
    },

    function(report) {
        // some weird character that screws up sorting
        return JSON.stringify(report.legacyResult.body).includes('ï¼');
    },

    // function(report) {
    //     const txt = JSON.stringify(report.test);
    //     return badAttributes.some(attr => txt.includes(attr));
    // },

    function(report) {
        const txt = JSON.stringify(report.test);
        return /unknown/i.test(txt);
    },

    // function(report) {
    //     return /showNA":false/.test(JSON.stringify(report.test));
    // },

    function(report) {
        // this study has generic assay data which is not properly handled
        // by legacy. it cannot be validated
        return /nsclc_public_genie_bpc/.test(JSON.stringify(report.test));
    },

    // function(report) {
    //     return /MGMT_STATUS/.test(JSON.stringify(report.test)) &&
    //         /glioma_mskcc_2019/.test(JSON.stringify(report.test))
    // },

    function(report) {
        return (
            report.chResult.body.length === 1 &&
            report.chResult.body[0].counts[0].count === 0 &&
            report.chResult.body[0].counts[0].value === 'na' &&
            report.legacyResult.body.length === 0
        );
    },

    function(report) {
        // some weird character that screws up sorting
        return JSON.stringify(report.test.data).includes('Wilms');
    },
    // function(report) {
    //     const studs = 'acc_2019,ampca_bcm_2016,brain_cptac_2020,brca_igr_2015,breast_alpelisib_2020,brca_smc_2018,crc_eo_2020,ctcl_columbia_2015,dlbc_broad_2012,dlbcl_duke_2017,esca_broad,es_iocurie_2014,gct_msk_2016,gbm_mayo_pdx_sarkaria_2019,gbm_columbia_2019,hcc_inserm_fr_2015,histiocytosis_cobi_msk_2019,kirc_bgi,hnsc_mdanderson_2013,ihch_msk_2021,lihc_riken,luad_mskcc_2015,luad_broad,luad_cptac_2020,mbl_icgc,mds_tokyo_2011,mel_ucla_2016,lung_msk_pdx,mm_broad,nbl_amc_2012,mpn_cimr_2013,mnm_washu_2016,mixed_selpercatinib_2020,msk_ch_2020,msk_ch_ped_2021,nbl_target_2018_pub,paad_icgc,plmeso_nyu_2015,paad_qcmg_uq_2016,pediatric_dkfz_2017,pan_origimed_2020,error,prad_cpcg_2017,prad_mskcc_cheny1_organoids_2014,skcm_broad_dfarber,skcm_yale,stmyec_wcm_2022,um_qimr_2016,wt_target_2018_pub,laml_tcga,lgg_tcga,meso_tcga,mel_tsam_liang_2017,mbn_mdacc_2013,stad_tcga,rt_target_2018_pub,prostate_dkfz_2018,error,difg_glass,coadread_cass_2020,mbn_sfu_2023,cll_broad_2022,ucec_ccr_cfdna_msk_2022,msk_ch_2023,brca_tcga_gdc,esca_tcga_gdc,aml_tcga_gdc,difg_tcga_gdc,paad_tcga_gdc,prad_tcga_gdc,thpa_tcga_gdc,breast_cptac_gdc,luad_cptac_gdc,pancreas_cptac_gdc,pancan_pcawg_2020,hcc_clca_2024,brca_fuscc_2020'.split(
    //         ','
    //     );
    //     return (
    //         _.intersection(
    //             report.test.data.studyIds ||
    //                 report.test.data.studyViewFilter.studyIds,
    //             studs
    //         ).length > 0
    //     );
    // },

    // function(report) {
    //     console.log("moo", report.chResult.body.filter(d=>d.numberOfAlteredCases===1).length)
    //     return false;
    // },

    // function(report) {
    //     return _.some(report.legacyResult.body, (val, i) => {
    //         return (
    //             val.matchingGenePanelIds.length === 0 &&
    //             (report.chResult.body[i].matchingGenePanelIds.length === 0 ||
    //                 report.chResult.body[i].matchingGenePanelIds[0] === 'WES')
    //         );
    //     });
    // },

    // function(report) {
    //     return (
    //         report.legacyResult.body.length > 0 &&
    //         report.chResult.body.length === 0
    //     );
    // },
];

module.exports = suppressors;

const badAttributes = [
    'HBV',
    'STAGE',
    'KPS',
    'SUBGROUP',
    'THERAPY',
    'ECOG',
    'NGS_TEST',
    'N_STAGE',
    'WGD',
    'LDH',
    'SOURCE',
    'OTHER',
    'COHORT',
    'DEATH',
    'SURGERY',
    'WBC',
    'HER2',
    'TNM',
    'TNMSTAGE',
    'STUDY',
    'HCV',
    'GROUP',
    'STATUS',
    'CENTER',
    'TMB',
    'MSI',
    'NECROSIS',
    'T_STAGE',
    'ICD_10',
    'PLOIDY',
    'HBSAG',
    'LNI',
    'FAB',
    'GRADE',
    'PSA',
    'IHC_HER2',
    'LINEAGE',
    'SUBTYPE',
    'COMMENTS',
    'LVSI',
    'IDH1_MUTATION',
    'STEMNESS_SCORE',
    'VIAL_NUMBER',
    'SAMPLE_NAME',
    'CYTOGENETICS',
    'TUMOR_GRADE',
    'AGE_AT_DX',
    'INSTITUTE',
    'ER_STATUS_BY_IHC',
    'IDH_STATUS',
    'CIRRHOSIS',
    'PRIOR_THERAPY',
    'RECURRENCE',
    'MULTIPLE_TUMORS',
    'TREATMENT_STATUS',
    'SMOKING_HISTORY',
    'BRAF_STATUS',
    'CELLULARITY',
    'KARYOTYPE',
    'SEQUENCING_TYPE',
    'SAMPLE_TYPE_ID',
    'ADJUVANT_THERAPY',
    'RESIDUAL_TUMOR',
    '1P19Q_STATUS',
    'CHEMOTHERAPY',
    'TISSUE_SOURCE',
    'HISTOLOGY',
    'NTE_HER2_STATUS',
    'IMMUNE_STATUS',
    'PSTAGE_CATEGORY',
    'METASTASIS',
    'RADIATION',
    'GLEASON_SCORE',
    'MITOTIC_COUNT',
    'MUTATION_RATE',
    'HER2_FISH_STATUS',
    'AGE_AT_DIAGNOSIS',
    'DISEASE_TYPE',
    'MGMT_STATUS',
    'RNA_SEQ_ANALYSIS',
    'BRAF_MUTATION',
    'TUMOR_PURITY',
    'MUTATION_STATUS',
    'MORPHOLOGY',
    'HER2_IHC_SCORE',
    'LIVER_METS',
    'HEPATITIS',
    'RADIOTHERAPY',
    'NTE_ER_STATUS',
    'DISEASE_CODE',
    'TREATMENT',
    'HER2_FISH_METHOD',
    'PR_STATUS_BY_IHC',
    'TOTAL_MUTATIONS',
    'SAMPLE_SITE',
    'BRAIN_METS',
    'TUMOR_SIZE_CM',
    'IHC_SCORE',
    'LDH_ELEVATED',
    'PROJECT_CODE',
    'MUTATION_TYPE',
    'HEMOGLOBIN_LEVEL',
    'KRAS_MUTATION',
    'HER2_COPY_NUMBER',
    'TUMOR_SIZE',
    'TUMOR_LEVEL',
    'SURGERY_TYPE',
    'CSTAGE_CATEGORY',
    'BIOPSY_SITE',
    'TUMOR_STAGE',
    'HISTOPATHOLOGY',
    'PLATELET_COUNT',
    'BRESLOW_DEPTH',
    'METASTASECTOMY',
    'PROCEDURE_TYPE',
    'SMOKING_STATUS',
    'TUMOR_LOCATION',
    'PERCENTAGE_TUMOR_PURITY',
    'AMPLIFICATION_STATUS',
    'ABI_ENZA_EXPOSURE_STATUS',
    'NTE_CENT_17_HER2_RATIO',
    'ER_POSITIVITY_SCALE_USED',
    'PERINEURAL_INVASION',
    'TISSUE_SOURCE_SITE',
    'EXTRACAPSULAR_SPREAD',
    'PATIENT_DISPLAY_NAME',
    'PR_POSITIVITY_SCALE_USED',
    'EXTRATHYROIDAL_EXTENSION',
    'TUMOR_SAMPLE_HISTOLOGY',
    'AGE_AT_PROCUREMENT',
    'PERCENT_TUMOR_CELLS',
    'STAGING_SYSTEM_OTHER',
    'NTE_PR_STATUS_BY_IHC',
    'PB_BLAST_PERCENTAGE',
    'MARGIN_STATUS_REEXCISION',
    'BARRETTS_ESOPHAGUS',
    'PRIMARY_HISTOLOGY',
    'LYMPH_NODE_METASTASIS',
    'HER2_CENT17_RATIO',
    'METASTATIC_SITE_OTHER',
    'HYPERTENSION_DIAGNOSIS',
    'SURGICAL_PROCEDURE_FIRST',
    'TUMOR_TOTAL_DEPTH',
    'AFP_AT_PROCUREMENT',
    'MAPK_PATHWAY_ALTERATION',
    'IDH_CODEL_SUBTYPE',
    'TUMOR_CLASSIFICATION',
    'STAGE_AT_DIAGNOSIS',
    'ESTIMATE_TUMORPURITY',
    'TREATMENT_RESPONSE',
    'CENT17_COPY_NUMBER',
    'HISTOLOGICAL_SUBTYPE',
    'BM_BLAST_PERCENTAGE',
    'PATHOLOGY_REPORT_UUID',
    'ESTIMATE_STROMAL_SCORE',
    'LOCALIZED_VS_METS_AT_DX',
    'MOLECULAR_SUBTYPE',
    'NTE_HER2_FISH_STATUS',
    'ESTIMATE_IMMUNE_SCORE',
    'PERCENT_TUMOR_NUCLEI',
    'PRIMARY_SITE_OTHER',
    'PRIMARY_TUMOR_LOCATION',
    'VASCULAR_INVASION',
    'SYSTEMIC_TREATMENT',
    'HER2_AND_CENT17_SCALE_OTHER',
    'CUMULATIVE_TREATMENT_TYPE_COUNT',
    'ER_STATUS_IHC_PERCENT_POSITIVE',
    'ESOPHAGEAL_TUMOR_LOCATION_CENTERED',
    'OTHER_METHOD_OF_SAMPLE_PROCUREMENT',
    'NTE_PR_IHC_INTENSITY_SCORE',
    'FIRST_SURGICAL_PROCEDURE_OTHER',
    'SURGERY_FOR_POSITIVE_MARGINS_OTHER',
    'PR_POSITIVITY_IHC_INTENSITY_SCORE',
    'NTE_ER_IHC_INTENSITY_SCORE',
    'HER2_IHC_PERCENT_POSITIVE',
    'HER2_POSITIVITY_METHOD_TEXT',
    'PR_POSITIVITY_SCALE_OTHER',
    'SURGERY_FOR_POSITIVE_MARGINS',
    'SYNOVIAL_SS18SSX_FUSION_STATUS',
    'PERCENT_LYMPHOCYTE_INFILTRATION',
    'HER2_AND_CENT17_CELLS_COUNT',
    'AGE_AT_SEQ_REPORTED_YEARS',
    'METHOD_OF_SAMPLE_PROCUREMENT',
    'AJCC_PATHOLOGIC_TUMOR_STAGE',
    'NTE_HER2_POSITIVITY_IHC_SCORE',
    'PR_STATUS_IHC_PERCENT_POSITIVE',
    'HER2_POSITIVITY_SCALE_OTHER',
    'METASTATIC_TUMOR_INDICATOR',
    'PR_POSITIVITY_DEFINE_METHOD',
    'FOLLICULAR_COMPONENT_PERCENT',
    'CUMULATIVE_TREATMENT_TYPES',
    'MICROMET_DETECTION_BY_IHC',
    'CREATININE_LEVEL_PRERESECTION',
    'MOST_RECENT_TREATMENT_TYPE',
    'ER_POSITIVITY_SCALE_OTHER',
    'INCIDENTAL_PROSTATE_CANCER',
    'NEW_TUMOR_EVENT_AFTER_INITIAL_TREATMENT',
];
