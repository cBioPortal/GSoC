import _ from 'lodash';

export enum CanonicalMutationType {
    MISSENSE = 'missense',
    FRAME_SHIFT_INS = 'frame_shift_ins',
    FRAME_SHIFT_DEL = 'frame_shift_del',
    FRAMESHIFT = 'frameshift',
    NONSENSE = 'nonsense',
    SPLICE_SITE = 'splice_site',
    NONSTART = 'nonstart',
    NONSTOP = 'nonstop',
    IN_FRAME_DEL = 'in_frame_del',
    IN_FRAME_INS = 'in_frame_ins',
    INFRAME = 'inframe',
    TRUNCATING = 'truncating',
    FUSION = 'fusion',
    SILENT = 'silent',
    OTHER = 'other',
}

export enum VusMutationType {
    MISSENSE_UNKNOWN_SIGNIFICANCE = 'missense_unknown_significance',
    MISSENSE_PUTATIVE_DRIVER = 'missense_putative_driver',
    INFRAME_UNKNOWN_SIGNIFICANCE = 'inframe_unknown_significance',
    INFRAME_PUTATIVE_DRIVER = 'inframe_putative_driver',
    TRUNCATING_UNKNOWN_SIGNIFICANCE = 'truncating_unknown_significance',
    TRUNCATING_PUTATIVE_DRIVER = 'truncating_putative_driver',
    SPLICE_UNKNOWN_SIGNIFICANCE = 'splice_unknown_significance',
    SPLICE_PUTATIVE_DRIVER = 'splice_putative_driver',
    FUSION_UNKNOWN_SIGNIFICANCE = 'fusion_unknown_significance',
    FUSION_PUTATIVE_DRIVER = 'fusion_putative_driver',
    OTHER_UNKNOWN_SIGNIFICANCE = 'other_unknown_significance',
    OTHER_PUTATIVE_DRIVER = 'other_putative_driver',
}

export enum ProteinImpactWithoutVusMutationType {
    MISSENSE = CanonicalMutationType.MISSENSE,
    TRUNCATING = CanonicalMutationType.TRUNCATING,
    INFRAME = CanonicalMutationType.INFRAME,
    SPLICE = CanonicalMutationType.SPLICE_SITE,
    FUSION = CanonicalMutationType.FUSION,
    OTHER = CanonicalMutationType.OTHER,
}

export enum ProteinImpactType {
    MISSENSE = CanonicalMutationType.MISSENSE,
    TRUNCATING = CanonicalMutationType.TRUNCATING,
    INFRAME = CanonicalMutationType.INFRAME,
    SPLICE = CanonicalMutationType.SPLICE_SITE,
    FUSION = CanonicalMutationType.FUSION,
    OTHER = CanonicalMutationType.OTHER,
    MISSENSE_UNKNOWN_SIGNIFICANCE = VusMutationType.MISSENSE_UNKNOWN_SIGNIFICANCE,
    MISSENSE_PUTATIVE_DRIVER = VusMutationType.MISSENSE_PUTATIVE_DRIVER,
    INFRAME_UNKNOWN_SIGNIFICANCE = VusMutationType.INFRAME_UNKNOWN_SIGNIFICANCE,
    INFRAME_PUTATIVE_DRIVER = VusMutationType.INFRAME_PUTATIVE_DRIVER,
    TRUNCATING_UNKNOWN_SIGNIFICANCE = VusMutationType.TRUNCATING_UNKNOWN_SIGNIFICANCE,
    TRUNCATING_PUTATIVE_DRIVER = VusMutationType.TRUNCATING_PUTATIVE_DRIVER,
    SPLICE_UNKNOWN_SIGNIFICANCE = VusMutationType.SPLICE_UNKNOWN_SIGNIFICANCE,
    SPLICE_PUTATIVE_DRIVER = VusMutationType.SPLICE_PUTATIVE_DRIVER,
    FUSION_UNKNOWN_SIGNIFICANCE = VusMutationType.FUSION_UNKNOWN_SIGNIFICANCE,
    FUSION_PUTATIVE_DRIVER = VusMutationType.FUSION_PUTATIVE_DRIVER,
    OTHER_UNKNOWN_SIGNIFICANCE = VusMutationType.OTHER_UNKNOWN_SIGNIFICANCE,
    OTHER_PUTATIVE_DRIVER = VusMutationType.OTHER_PUTATIVE_DRIVER,
}
export enum DriverVsVusType {
    DRIVER = 'driver',
    VUS = 'VUS',
}
export const CANONICAL_MUTATION_TYPE_MAP: {
    [lowerCaseType: string]: CanonicalMutationType;
} = {
    missense_mutation: CanonicalMutationType.MISSENSE,
    missense: CanonicalMutationType.MISSENSE,
    missense_variant: CanonicalMutationType.MISSENSE,
    frame_shift_ins: CanonicalMutationType.FRAME_SHIFT_INS,
    frame_shift_del: CanonicalMutationType.FRAME_SHIFT_DEL,
    frameshift: CanonicalMutationType.FRAMESHIFT,
    frameshift_deletion: CanonicalMutationType.FRAME_SHIFT_DEL,
    frameshift_insertion: CanonicalMutationType.FRAME_SHIFT_INS,
    de_novo_start_outofframe: CanonicalMutationType.FRAMESHIFT,
    frameshift_variant: CanonicalMutationType.FRAMESHIFT,
    nonsense_mutation: CanonicalMutationType.NONSENSE,
    nonsense: CanonicalMutationType.NONSENSE,
    stopgain_snv: CanonicalMutationType.NONSENSE,
    stop_gained: CanonicalMutationType.NONSENSE,
    splice_site: CanonicalMutationType.SPLICE_SITE,
    splice: CanonicalMutationType.SPLICE_SITE,
    'splice site': CanonicalMutationType.SPLICE_SITE,
    splicing: CanonicalMutationType.SPLICE_SITE,
    splice_site_snp: CanonicalMutationType.SPLICE_SITE,
    splice_site_del: CanonicalMutationType.SPLICE_SITE,
    splice_site_indel: CanonicalMutationType.SPLICE_SITE,
    splice_region_variant: CanonicalMutationType.SPLICE_SITE,
    splice_region: CanonicalMutationType.SPLICE_SITE,
    translation_start_site: CanonicalMutationType.NONSTART,
    initiator_codon_variant: CanonicalMutationType.NONSTART,
    start_codon_snp: CanonicalMutationType.NONSTART,
    start_codon_del: CanonicalMutationType.NONSTART,
    nonstop_mutation: CanonicalMutationType.NONSTOP,
    stop_lost: CanonicalMutationType.NONSTOP,
    inframe_del: CanonicalMutationType.IN_FRAME_DEL,
    inframe_deletion: CanonicalMutationType.IN_FRAME_DEL,
    in_frame_del: CanonicalMutationType.IN_FRAME_DEL,
    in_frame_deletion: CanonicalMutationType.IN_FRAME_DEL,
    inframe_ins: CanonicalMutationType.IN_FRAME_INS,
    inframe_insertion: CanonicalMutationType.IN_FRAME_INS,
    in_frame_ins: CanonicalMutationType.IN_FRAME_INS,
    in_frame_insertion: CanonicalMutationType.IN_FRAME_INS,
    indel: CanonicalMutationType.IN_FRAME_DEL,
    nonframeshift_deletion: CanonicalMutationType.INFRAME,
    nonframeshift: CanonicalMutationType.INFRAME,
    'nonframeshift insertion': CanonicalMutationType.INFRAME,
    nonframeshift_insertion: CanonicalMutationType.INFRAME,
    targeted_region: CanonicalMutationType.OTHER,
    inframe: CanonicalMutationType.INFRAME,
    truncating: CanonicalMutationType.TRUNCATING,
    feature_truncation: CanonicalMutationType.TRUNCATING,
    fusion: CanonicalMutationType.FUSION,
    silent: CanonicalMutationType.SILENT,
    synonymous_variant: CanonicalMutationType.SILENT,
    any: CanonicalMutationType.OTHER,
    other: CanonicalMutationType.OTHER,
};

export function getProteinImpactType(mutationType: string): ProteinImpactType {
    return getProteinImpactTypeFromCanonical(
        getCanonicalMutationType(mutationType)
    );
}

export function getProteinImpactTypeFromCanonical(
    mutationType: CanonicalMutationType
): ProteinImpactType {
    switch (mutationType) {
        case CanonicalMutationType.MISSENSE:
            return ProteinImpactType.MISSENSE;
        case CanonicalMutationType.FRAME_SHIFT_INS:
        case CanonicalMutationType.FRAME_SHIFT_DEL:
        case CanonicalMutationType.FRAMESHIFT:
        case CanonicalMutationType.NONSENSE:
        case CanonicalMutationType.NONSTART:
        case CanonicalMutationType.NONSTOP:
        case CanonicalMutationType.TRUNCATING:
            return ProteinImpactType.TRUNCATING;
        case CanonicalMutationType.SPLICE_SITE:
            return ProteinImpactType.SPLICE;
        case CanonicalMutationType.IN_FRAME_INS:
        case CanonicalMutationType.IN_FRAME_DEL:
        case CanonicalMutationType.INFRAME:
            return ProteinImpactType.INFRAME;
        case CanonicalMutationType.FUSION:
            return ProteinImpactType.FUSION;
        case CanonicalMutationType.SILENT:
        case CanonicalMutationType.OTHER:
        default:
            return ProteinImpactType.OTHER;
    }
}
export function getCanonicalMutationType(
    mutationType: string
): CanonicalMutationType {
    return (
        CANONICAL_MUTATION_TYPE_MAP[mutationType.toLowerCase()] ||
        CanonicalMutationType.OTHER
    );
}

export const CanonicalMutationTypeList: CanonicalMutationType[] = _.chain(
    CANONICAL_MUTATION_TYPE_MAP
)
    .values()
    .uniq()
    .value();

export default getCanonicalMutationType;
