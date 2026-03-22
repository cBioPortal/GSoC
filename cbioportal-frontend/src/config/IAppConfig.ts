export interface IAppConfig {
    apiRoot?: string;
    baseUrl?: string;
    basePath?: string;
    configurationServiceUrl?: string;
    frontendUrl?: string;
    serverConfig: IServerConfig;
    hide_login?: boolean;
}

export interface ILoadConfig {
    apiRoot?: string;
    baseUrl?: string;
    basePath?: string;
    configurationServiceUrl?: string;
    frontendUrl?: string;
    hide_login?: boolean;
}

export type CategorizedConfigItems = {
    [category: string]: string[];
};

export type VirtualCohort = {
    id: string;
    name: string;
    description: string;
    samples: { sampleId: string; studyId: string }[];
    constituentStudyIds: string[];
};

export type StudyView = {
    tableAttrs: string[];
    priority: { [id: string]: number };
};

export interface IServerConfig {
    app_name: string | null;
    app_version: string | null; // default: "1.0"
    authenticationMethod: string | undefined;
    bitly_access_token: string | null;
    oncoprint_custom_driver_annotation_binary_menu_label: string | null;
    oncoprint_custom_driver_annotation_binary_menu_description: string | null;
    oncoprint_custom_driver_annotation_tiers_menu_label: string | null;
    oncoprint_custom_driver_annotation_tiers_menu_description: string | null;
    disabled_tabs: string | null;
    custom_tabs: any[];
    custom_js_urls: string; // comma delimited string
    oncoprint_custom_driver_annotation_binary_default: boolean;
    oncoprint_custom_driver_annotation_tiers_default: boolean;
    oncoprint_oncokb_default: boolean;
    oncoprint_hotspots_default: boolean;
    genomenexus_url: string | null;
    genomenexus_url_grch38: string | null;
    genomenexus_website_url: string | null;
    genomenexus_isoform_override_source: string;
    mygene_info_url: string | null;
    g2s_url: string | null;
    google_analytics_profile_id: string | null;
    datadog_rum_application_id: string | null;
    datadog_rum_client_token: string | null;
    datadog_rum_site: string | null;
    datadog_rum_env: string | null;
    datadog_rum_session_sample_rate: number | null;
    datadog_rum_session_replay_sample_rate: number | null;
    ptmSources: string[] | undefined;
    oncoprint_hide_vus_default: boolean;
    oncokb_public_api_url: string | null;
    digital_slide_archive_iframe_url: string | null;
    digital_slide_archive_meta_url: string | null;
    mdacc_heatmap_meta_url: string | null;
    mdacc_heatmap_patient_url: string | null;
    pubmed_url: string | null;
    priority_studies: string | null;
    api_cache_limit: number;
    show_hotspot: boolean | undefined;
    show_oncokb: boolean;
    show_civic: boolean;
    show_revue: boolean;
    show_genomenexus: boolean;
    show_genomenexus_annotation_sources: string;
    show_pathway_mapper: boolean;
    show_mutation_mapper_tool_grch38: boolean;
    show_transcript_dropdown: boolean;
    show_signal: boolean;
    show_ndex: boolean;
    survival_initial_x_axis_limit: number;
    survival_show_p_q_values_in_survival_type_table: boolean;
    survival_min_group_threshold: number;
    skin_documentation_about: string | null;
    skin_documentation_software: string | null;
    skin_documentation_baseurl: string | null;
    skin_blurb: string | null;
    skin_custom_header_tabs: string | null;
    skin_data_sets_header: string | null;
    skin_documentation_markdown: boolean;
    skin_description: string;
    skin_email_contact: string;
    skin_example_study_queries: string | null;
    skin_examples_right_column_html: string | null;
    skin_documentation_faq: string | null;
    skin_footer: string | null;
    skin_footer_show_dev: boolean;
    skin_login_contact_html: string | null;
    skin_login_saml_registration_html: string | null;
    skin_citation_rule_text: string | null;
    skin_documentation_news: string | null;
    skin_documentation_oql: string | null;
    skin_query_max_tree_depth: string;
    skin_left_logo: string | null;
    skin_right_logo: string | null;
    skin_right_nav_show_data_sets: boolean;
    skin_right_nav_show_examples: boolean;
    skin_right_nav_show_testimonials: boolean;
    skin_right_nav_show_whats_new: boolean;
    skin_right_nav_show_twitter: boolean;
    skin_right_nav_show_web_tours: boolean;
    skin_right_nav_whats_new_blurb: string | null;
    skin_show_about_tab: boolean;
    skin_show_roadmap_tab: boolean;
    skin_show_data_tab: boolean;
    skin_show_faqs_tab: boolean;
    skin_show_news_tab: boolean;
    skin_show_r_matlab_tab: boolean;
    skin_show_tools_tab: boolean;
    skin_show_tutorials_tab: boolean;
    skin_show_web_api_tab: boolean;
    skin_show_tweet_button: boolean;
    skin_show_donate_button: boolean;
    skin_show_tissue_image_tab: boolean;
    skin_hide_logout_button: boolean;
    skin_show_settings_menu: boolean;
    skin_show_study_help_button: boolean;
    skin_title: string;
    skin_authorization_message: string | null;
    skin_patientview_filter_genes_profiled_all_samples: boolean;
    skin_hide_download_controls: string;
    show_mdacc_heatmap: boolean;
    quick_search_enabled: boolean;
    default_cross_cancer_study_list: string; // this has a default
    default_cross_cancer_study_list_name: string; // this has a default
    default_cross_cancer_study_session_id: string | null;
    study_view: StudyView;
    uniprot_id_url: string | null;
    ensembl_transcript_url: string | null;
    ensembl_transcript_grch38_url: string | null;
    studiesWithGermlineConsentedSamples: string[] | undefined;
    mdacc_heatmap_study_meta_url: string | null;
    mdacc_heatmap_study_url: string | null;
    enable_darwin: boolean;
    query_sets_of_genes: string | null;
    skin_quick_select_buttons: string | null;
    base_url: string | null;
    user_display_name: string;
    sessionServiceEnabled: boolean;
    session_url_length_threshold: string;
    mskWholeSlideViewerToken: string;
    query_product_limit: number;
    clinical_attribute_product_limit: number;
    dat_method: string;
    skin_show_gsva: boolean;
    skin_geneset_hierarchy_default_gsva_score: number;
    skin_geneset_hierarchy_default_p_value: number;
    skin_geneset_hierarchy_collapse_by_default: boolean;
    oncoKbTokenDefined: boolean;
    oncokb_merge_icons_by_default: boolean;
    generic_assay_display_text: string; // this has a default
    saml_logout_local: boolean;
    installation_map_url: string;
    enable_request_body_gzip_compression: boolean;
    enable_treatment_groups: boolean;
    referenceGenomeVersion: string;
    skin_home_page_show_unauthorized_studies: boolean;
    skin_home_page_show_reference_genome: string;
    skin_home_page_unauthorized_studies_global_message: string;
    skin_mutation_table_namespace_column_show_by_default: boolean;
    skin_patient_view_mutation_table_columns_show_on_init: string;
    skin_results_view_mutation_table_columns_show_on_init: string;
    skin_comparison_view_mutation_table_columns_show_on_init: string;
    skin_patient_view_copy_number_table_columns_show_on_init: string;
    skin_patient_view_structural_variant_table_columns_show_on_init: string;
    skin_results_view_tables_default_sort_column: string;
    skin_patient_view_tables_default_sort_column: string;
    skin_patient_view_custom_sample_type_colors_json: string;
    comparison_categorical_na_values: string;
    oncoprint_clinical_tracks_config_json: string;
    oncoprint_clustered_default: boolean; // this has a default
    enable_cross_study_expression: string;
    oncoprint_defaultview: string; // this has a default
    studyview_max_samples_selected: number;
    study_download_url: string;
    studyview_clinical_attribute_chart_count: number;
    vaf_sequential_mode_default: boolean; // this has a default
    vaf_log_scale_default: boolean; // this has a default
    skin_study_view_show_sv_table: boolean; // this has a default
    enable_study_tags: boolean;
    clickhouse_mode: boolean;
    download_custom_buttons_json: string;
    feature_study_export: boolean;
    uptime_robot_status_page_url: string | null;
    uptime_robot_api_key: string | null;
    skin_hide_clinical_data_tab_study_view: boolean;
}
