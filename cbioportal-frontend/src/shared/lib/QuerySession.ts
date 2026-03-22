import {
    GeneticTrackDatum,
    IGeneHeatmapTrackDatum,
} from '../components/oncoprint/Oncoprint';
import { SingleGeneQuery } from './oql/oql-parser';
export type OncoprintSampleGeneticTrackData = {
    altered_sample_uids: string[];
    altered_samples: string[];
    data: any[];
    gene: string;
    oncoprint_data: GeneticTrackDatum[];
    oql_line: string;
    parsed_oql_line: SingleGeneQuery;
    sequenced_samples: string[];
    unaltered_sample_uids: string[];
    unaltered_samples: string[];
};
export type OncoprintPatientGeneticTrackData = {
    altered_patient_uids: string[];
    altered_patients: string[];
    data: any[];
    gene: string;
    oncoprint_data: GeneticTrackDatum[];
    oql_line: string;
    parsed_oql_line: SingleGeneQuery;
    sequenced_patients: string[];
    unaltered_patient_uids: string[];
    unaltered_patients: string[];
};
type OncoprintClinicalDatum = {
    attr_id: string;
    attr_val: string | { [attr_val: string]: number };
    attr_val_counts: { [attr_val: string]: number };
    sample: string;
    study_id: string;
    uid: string;
};
export type OncoprintSampleClinicalDatum = OncoprintClinicalDatum & {
    sample: string;
};
export type OncoprintPatientClinicalDatum = OncoprintClinicalDatum & {
    patient: string;
};

export type OncoprintHeatmapTrackData = {
    datatype: string;
    gene: string;
    genetic_alteration_type: string;
    genetic_profile_id: string;
    oncoprint_data: IGeneHeatmapTrackDatum[];
};

export type KnownMutationSettings = {
    ignore_unknown: boolean;
    recognize_cbioportal_count: boolean;
    cbioportal_count_thresh: number;
    recognize_cosmic_count: boolean;
    cosmic_count_thresh: number;
    recognize_hotspot: boolean;
    recognize_oncokb_oncogenic: boolean;
    recognize_driver_filter: boolean;
    recognize_driver_tiers: { [driver_tier: string]: boolean };
};

export type QuerySession = {
    getCancerStudyIds: () => string[];
    getGeneticProfileIds: () => string[];
    getZScoreThreshold: () => number;
    getRppaScoreThreshold: () => number;
    getCaseSetId: () => string;
    getSampleIds: () => string[];
    getOQLQuery: () => string;
    getGenesetQuery: () => string;
    getOncoprintSampleGenomicEventData: (
        use_session_filters?: boolean
    ) => Promise<OncoprintSampleGeneticTrackData[]>;
    getOncoprintPatientGenomicEventData: (
        use_session_filters?: boolean
    ) => Promise<OncoprintPatientGeneticTrackData[]>;
    getSampleClinicalData: (
        attribute_ids: string[]
    ) => Promise<OncoprintSampleClinicalDatum[]>;
    getPatientClinicalData: (
        attribute_ids: string[]
    ) => Promise<OncoprintPatientClinicalDatum[]>;
    getSampleHeatmapData: (
        genetic_profile_id: string,
        genes: string[]
    ) => Promise<OncoprintHeatmapTrackData[]>;
    getPatientHeatmapData: (
        genetic_profile_id: string,
        genes: string[]
    ) => Promise<OncoprintHeatmapTrackData[]>;
    getAlteredSampleUIDs: () => Promise<string[]>;
    getAlteredPatientUIDs: () => Promise<string[]>;
    getUnalteredSampleUIDs: () => Promise<string[]>;
    getUnalteredPatientUIDs: () => Promise<string[]>;
    getKnownMutationSettings: () => KnownMutationSettings;
    setKnownMutationSettings: (settings: KnownMutationSettings) => void;
    getUIDToCaseMap: () => Promise<{ [uid: string]: string }>;
    getSampleUIDs: () => Promise<string[]>;
    getPatientUIDs: () => Promise<string[]>;
    getSampleSetName: () => string;
    getSequencedSamples: () => Promise<string[]>;
    getSequencedPatients: () => Promise<string[]>;
    getStudySampleMap: () => Object;
};
