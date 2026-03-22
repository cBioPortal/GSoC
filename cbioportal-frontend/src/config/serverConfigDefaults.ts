import { IServerConfig } from './IAppConfig';

export const ServerConfigDefaults: Partial<IServerConfig> = {
    app_version: '1.0',
    api_cache_limit: 450,
    dat_method: 'none',
    disabled_tabs: '',
    genomenexus_url: 'https://v1.genomenexus.org',
    genomenexus_url_grch38: 'https://grch38.genomenexus.org',
    genomenexus_website_url: 'https://www.genomenexus.org',
    genomenexus_isoform_override_source: 'mskcc',
    g2s_url: 'https://g2s.genomenexus.org',

    digital_slide_archive_iframe_url: 'https://cancer.digitalslidearchive.org/',
    digital_slide_archive_meta_url:
        'https://api.digitalslidearchive.org/api/v1/tcga/image?caseName=',

    mdacc_heatmap_patient_url:
        'https://bioinformatics.mdanderson.org/participant2maps?participant=',
    mdacc_heatmap_study_meta_url:
        'https://bioinformatics.mdanderson.org/study2url?studyid=',
    mdacc_heatmap_study_url:
        'https:// bioinformatics.mdanderson.org/TCGA/NGCHMPortal/?',
    show_mdacc_heatmap: false,

    mygene_info_url:
        'https://mygene.info/v3/gene/<%= entrezGeneId %>?fields=uniprot',

    oncoprint_custom_driver_annotation_binary_menu_label: 'Custom Driver',
    oncoprint_custom_driver_annotation_binary_menu_description:
        'Custom driver annotation',
    oncoprint_custom_driver_annotation_tiers_menu_label: 'Custom Driver Tiers',
    oncoprint_custom_driver_annotation_tiers_menu_description:
        'Custom driver tiers',
    oncoprint_custom_driver_annotation_binary_default: true,
    oncoprint_custom_driver_annotation_tiers_default: true,
    oncoprint_oncokb_default: true,
    oncoprint_hotspots_default: true,
    oncoprint_hide_vus_default: false,
    oncokb_public_api_url: 'oncokb.org/api/v1',
    oncokb_merge_icons_by_default: true,
    oncoprint_defaultview: 'patient',
    pubmed_url: 'https://www.ncbi.nlm.nih.gov/pubmed/<%=pmid%>',

    show_hotspot: true,
    show_oncokb: true,
    show_civic: false,
    show_revue: true,
    show_pathway_mapper: true,
    show_mutation_mapper_tool_grch38: true,
    show_transcript_dropdown: false,
    show_signal: true,
    show_ndex: true,
    survival_show_p_q_values_in_survival_type_table: true,
    survival_min_group_threshold: 3,
    skin_description:
        'The cBioPortal for Cancer Genomics provides visualization, analysis and download of large-scale cancer genomics data sets',
    show_genomenexus: true,
    // TODO should support more sources such as clinvar,gnomad,sift
    show_genomenexus_annotation_sources: 'mutation_assessor',
    survival_initial_x_axis_limit: 0,
    skin_authorization_message:
        'Access to this portal is only available to authorized users.',
    skin_documentation_about: 'About-Us.md',
    skin_documentation_software: 'Software-Acknowledgments.md',
    skin_documentation_baseurl:
        'https://raw.githubusercontent.com/cBioPortal/cbioportal/master/docs/',
    skin_documentation_markdown: true,
    skin_email_contact: 'cbioportal at googlegroups dot com',
    skin_documentation_faq: 'user-guide/faq.md',
    skin_footer_show_dev: false,
    skin_login_saml_registration_html: 'Sign in with MSK',
    skin_documentation_news: 'https://docs.cbioportal.org/news/',
    skin_documentation_oql: 'user-guide/oql.md',
    skin_query_max_tree_depth: '3',
    skin_right_nav_show_data_sets: true,
    skin_right_nav_show_examples: true,
    skin_right_nav_show_testimonials: true,
    skin_right_nav_show_whats_new: true,
    skin_right_nav_show_web_tours: false,
    skin_right_nav_show_twitter: false,
    skin_citation_rule_text:
        'Please cite <a href="https://docs.cbioportal.org/user-guide/faq/#how-do-i-cite-the-cbioportal" target="_blank">cBioPortal <i class="fa fa-book"></i></a>',
    skin_show_about_tab: true,
    skin_show_roadmap_tab: false,
    skin_show_data_tab: true,
    skin_show_faqs_tab: true,
    skin_show_news_tab: true,
    skin_show_r_matlab_tab: true,
    skin_show_tools_tab: true,
    skin_show_web_api_tab: true,
    skin_show_tweet_button: false,
    skin_show_study_help_button: false,
    skin_show_tissue_image_tab: true,
    quick_search_enabled: false,
    default_cross_cancer_study_list:
        'laml_tcga_pan_can_atlas_2018,acc_tcga_pan_can_atlas_2018,blca_tcga_pan_can_atlas_2018,' +
        'lgg_tcga_pan_can_atlas_2018,brca_tcga_pan_can_atlas_2018,cesc_tcga_pan_can_atlas_2018,chol_tcga_pan_can_atlas_2018,' +
        'coadread_tcga_pan_can_atlas_2018,dlbc_tcga_pan_can_atlas_2018,esca_tcga_pan_can_atlas_2018,gbm_tcga_pan_can_atlas_2018,' +
        'hnsc_tcga_pan_can_atlas_2018,kich_tcga_pan_can_atlas_2018,kirc_tcga_pan_can_atlas_2018,kirp_tcga_pan_can_atlas_2018,' +
        'lihc_tcga_pan_can_atlas_2018,luad_tcga_pan_can_atlas_2018,lusc_tcga_pan_can_atlas_2018,meso_tcga_pan_can_atlas_2018,' +
        'ov_tcga_pan_can_atlas_2018,paad_tcga_pan_can_atlas_2018,pcpg_tcga_pan_can_atlas_2018,prad_tcga_pan_can_atlas_2018,' +
        'sarc_tcga_pan_can_atlas_2018,skcm_tcga_pan_can_atlas_2018,stad_tcga_pan_can_atlas_2018,' +
        'tgct_tcga_pan_can_atlas_2018,thym_tcga_pan_can_atlas_2018,thca_tcga_pan_can_atlas_2018,ucs_tcga_pan_can_atlas_2018,' +
        'ucec_tcga_pan_can_atlas_2018,uvm_tcga_pan_can_atlas_2018',
    default_cross_cancer_study_list_name: 'TCGA PanCancer Atlas studies',
    skin_title: 'cBioPortal for Cancer Genomics',

    skin_data_sets_header: `The portal currently contains data from the following
            cancer genomics studies.  The table below lists the number of available samples per data type and tumor.`,

    skin_example_study_queries: `tcga pancancer atlas\n
                                     tcga legacy\n
                                     tcga -legacy -pancancer\n
                                     tcga or icgc\n
                                     msk-impact\n
                                     -\"cell line\"\n
                                     breast\n
                                     esophageal OR stomach\n
                                     prostate msk\n
                                     serous`,

    skin_login_contact_html: `If you think you have received this message in
            error, please contact us at <a style="color:#FF0000" href="mailto:cbioportal-access@cbio.mskcc.org">
            cbioportal-access@cbio.mskcc.org</a>`,

    skin_patientview_filter_genes_profiled_all_samples: false,

    enable_darwin: false,

    session_url_length_threshold: '1500',

    enable_study_tags: true,

    study_view: {
        tableAttrs: ['CANCER_TYPE', 'CANCER_TYPE_DETAILED'],
        priority: {
            CANCER_TYPE: 3000,
            CANCER_TYPE_DETAILED: 2000,
            // TODO should have a more generic way to define survival plots priority
            GENOMIC_PROFILES_SAMPLE_COUNT: 1000,
            OS_SURVIVAL: 400,
            DFS_SURVIVAL: 300,
            DSS_SURVIVAL: 250,
            PFS_SURVIVAL: 250,
            MUTATION_COUNT_CNA_FRACTION: 200,
            MUTATED_GENES_TABLE: 90,
            STRUCTURAL_VARIANT_GENES_TABLE: 85,
            STRUCTURAL_VARIANTS_TABLE: 85,
            CNA_GENES_TABLE: 80,
            PATIENT_TREATMENTS_TABLE: 75,
            PATIENT_TREATMENT_GROUPS_TABLE: 75,
            PATIENT_TREATMENT_TARGET_TABLE: 75,
            SAMPLE_TREATMENTS_TABLE: 75,
            SAMPLE_TREATMENT_GROUPS_TABLE: 75,
            SAMPLE_TREATMENT_TARGET_TABLE: 75,
            CLINICAL_EVENT_TYPE_COUNTS_TABLE: 75,
            CANCER_STUDIES: 70,
            SEQUENCED: 60,
            HAS_CNA_DATA: 50,
            SAMPLE_COUNT: 40,
            MUTATION_COUNT: 30,
            FRACTION_GENOME_ALTERED: 20,
            GENDER: 9,
            SEX: 9,
            AGE: 9,
            RACE: 8,
            ETHNICITY: 8,
            SAMPLE_TYPE: 8,
            HISTOLOGY: 8,
            TUMOR_TYPE: 8,
            SUBTYPE: 8,
            TUMOR_SITE: 8,
        },
    },

    uniprot_id_url:
        'https://rest.uniprot.org/uniprotkb/search?query=accession:<%= swissProtAccession %>&format=tsv&fields=id',

    ensembl_transcript_url:
        'http://grch37.ensembl.org/homo_sapiens/Transcript/Summary?t=<%= transcriptId %>',

    ensembl_transcript_grch38_url:
        'http://ensembl.org/homo_sapiens/Transcript/Summary?t=<%= transcriptId %>',

    query_product_limit: 1000000,

    enable_cross_study_expression: undefined,

    clinical_attribute_product_limit: 6500000,

    skin_show_gsva: false,

    skin_geneset_hierarchy_default_gsva_score: 0.5,

    skin_geneset_hierarchy_default_p_value: 0.05,

    generic_assay_display_text:
        'TREATMENT_RESPONSE:Treatment Response,MUTATIONAL_SIGNATURE:Mutational Signature,ARMLEVEL_CNA:Arm-level CNA',

    saml_logout_local: false,

    enable_request_body_gzip_compression: false,
    enable_treatment_groups: false,

    referenceGenomeVersion: 'hg19',

    skin_home_page_show_unauthorized_studies: false,

    skin_home_page_unauthorized_studies_global_message:
        'The study is unauthorized. You need to request access.',
    comparison_categorical_na_values: 'NA',
    skin_hide_download_controls: 'show',

    oncoprint_clinical_tracks_config_json: '',

    skin_patient_view_mutation_table_columns_show_on_init: '',

    skin_results_view_mutation_table_columns_show_on_init: '',

    skin_comparison_view_mutation_table_columns_show_on_init: '',

    skin_patient_view_copy_number_table_columns_show_on_init: '',

    skin_patient_view_structural_variant_table_columns_show_on_init: '',

    skin_results_view_tables_default_sort_column: 'Annotation',

    skin_patient_view_tables_default_sort_column: 'Annotation',

    skin_patient_view_custom_sample_type_colors_json: '',

    studyview_max_samples_selected: 0,

    studyview_clinical_attribute_chart_count: 20,

    study_download_url: '',

    oncoprint_clustered_default: true,

    vaf_sequential_mode_default: false,

    vaf_log_scale_default: false,

    skin_study_view_show_sv_table: false,

    clickhouse_mode: false,

    download_custom_buttons_json: '',

    feature_study_export: false,

    uptime_robot_status_page_url: null,
    uptime_robot_api_key: null,

    skin_hide_clinical_data_tab_study_view: false,
};

export default ServerConfigDefaults;
