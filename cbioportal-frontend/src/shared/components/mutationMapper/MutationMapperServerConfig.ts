import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { IMutationMapperProps } from './MutationMapper';

// This is a subset of IServerConfig containing config values used only in Mutation Mapper
export interface IMutationMapperServerConfig {
    oncoprint_custom_driver_annotation_binary_menu_label: string | null;
    oncoprint_custom_driver_annotation_binary_menu_description: string | null;
    oncoprint_custom_driver_annotation_tiers_menu_label: string | null;
    oncoprint_custom_driver_annotation_tiers_menu_description: string | null;
    show_oncokb?: boolean;
    show_genomenexus?: boolean;
    show_hotspot?: boolean;
    show_civic?: boolean;
    show_revue?: boolean;
    ptmSources?: string[];
    mygene_info_url: string | null;
    uniprot_id_url: string | null;
    ensembl_transcript_url: string | null;
    genomenexus_isoform_override_source: string | undefined;
    genomenexus_url: string | null;
    skin_hide_download_controls?: string;
}

export function convertToMutationMapperProps(
    config: IMutationMapperServerConfig
): Partial<IMutationMapperProps> {
    return {
        genomeNexusUrl: config.genomenexus_url || undefined,
        isoformOverrideSource: config.genomenexus_isoform_override_source,
        myGeneInfoUrlTemplate: config.mygene_info_url || undefined,
        uniprotIdUrlTemplate: config.uniprot_id_url || undefined,
        transcriptSummaryUrlTemplate:
            config.ensembl_transcript_url || undefined,
        enableOncoKb: config.show_oncokb,
        enableGenomeNexus: config.show_genomenexus,
        enableHotspot: config.show_hotspot,
        enableCivic: config.show_civic,
        enableRevue: config.show_revue,
        showDownload:
            config.skin_hide_download_controls !==
            DownloadControlOption.HIDE_ALL,
        customDriverName:
            config.oncoprint_custom_driver_annotation_binary_menu_label ||
            undefined,
        customDriverDescription:
            config.oncoprint_custom_driver_annotation_binary_menu_description ||
            undefined,
        customDriverTiersName:
            config.oncoprint_custom_driver_annotation_tiers_menu_label ||
            undefined,
        customDriverTiersDescription:
            config.oncoprint_custom_driver_annotation_tiers_menu_description ||
            undefined,
    };
}
