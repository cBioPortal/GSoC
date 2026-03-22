import ComparisonStore from 'shared/lib/comparison/ComparisonStore';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { stringListToMap } from 'cbioportal-frontend-commons';
import _ from 'lodash';

// For everything to work, the enum names must be identical to their value
export enum CopyNumberEnrichmentEventType {
    HOMDEL = 'HOMDEL',
    AMP = 'AMP',
}

// For everything to work, the enum names must be identical to their value
export enum MutationEnrichmentEventType {
    missense_mutation = 'missense_mutation',
    missense = 'missense',
    missense_variant = 'missense_variant',
    frame_shift_ins = 'frame_shift_ins',
    frame_shift_del = 'frame_shift_del',
    frameshift = 'frameshift',
    frameshift_deletion = 'frameshift_deletion',
    frameshift_insertion = 'frameshift_insertion',
    de_novo_start_outofframe = 'de_novo_start_outofframe',
    frameshift_variant = 'frameshift_variant',
    nonsense_mutation = 'nonsense_mutation',
    nonsense = 'nonsense',
    stopgain_snv = 'stopgain_snv',
    stop_gained = 'stop_gained',
    splice_site = 'splice_site',
    splice = 'splice',
    splicing = 'splicing',
    splice_site_snp = 'splice_site_snp',
    splice_site_del = 'splice_site_del',
    splice_site_indel = 'splice_site_indel',
    splice_region_variant = 'splice_region_variant',
    splice_region = 'splice_region',
    translation_start_site = 'translation_start_site',
    initiator_codon_variant = 'initiator_codon_variant',
    start_codon_snp = 'start_codon_snp',
    start_codon_del = 'start_codon_del',
    nonstop_mutation = 'nonstop_mutation',
    stop_lost = 'stop_lost',
    inframe_del = 'inframe_del',
    inframe_deletion = 'inframe_deletion',
    in_frame_del = 'in_frame_del',
    in_frame_deletion = 'in_frame_deletion',
    inframe_ins = 'inframe_ins',
    inframe_insertion = 'inframe_insertion',
    in_frame_ins = 'in_frame_ins',
    in_frame_insertion = 'in_frame_insertion',
    indel = 'indel',
    nonframeshift_deletion = 'nonframeshift_deletion',
    nonframeshift = 'nonframeshift',
    nonframeshift_insertion = 'nonframeshift_insertion',
    targeted_region = 'targeted_region',
    inframe = 'inframe',
    truncating = 'truncating',
    feature_truncation = 'feature_truncation',
    silent = 'silent',
    synonymous_variant = 'synonymous_variant',
    any = 'any',
    other = 'other',
}

export enum StructuralVariantEnrichmentEventType {
    structural_variant = 'structural_variant',
}

export type EnrichmentEventType =
    | MutationEnrichmentEventType
    | CopyNumberEnrichmentEventType
    | StructuralVariantEnrichmentEventType;

// Groups according to GitHub issue #8107 dd. December 2020
// https://github.com/cBioPortal/cbioportal/issues/8107)
export const missenseGroup = [
    MutationEnrichmentEventType.missense,
    MutationEnrichmentEventType.missense_mutation,
    MutationEnrichmentEventType.missense_variant,
];
export const inframeDeletionGroup = [
    MutationEnrichmentEventType.inframe_del,
    MutationEnrichmentEventType.inframe_deletion,
    MutationEnrichmentEventType.in_frame_del,
    MutationEnrichmentEventType.in_frame_deletion,
    MutationEnrichmentEventType.nonframeshift_deletion,
];
export const inframeInsertionGroup = [
    MutationEnrichmentEventType.inframe_ins,
    MutationEnrichmentEventType.inframe_insertion,
    MutationEnrichmentEventType.in_frame_ins,
    MutationEnrichmentEventType.in_frame_insertion,
    MutationEnrichmentEventType.nonframeshift_insertion,
];
export const inframeGroup = [
    MutationEnrichmentEventType.indel,
    MutationEnrichmentEventType.nonframeshift,
    MutationEnrichmentEventType.inframe,
    ...inframeDeletionGroup,
    ...inframeInsertionGroup,
];
export const nonsenseGroup = [
    MutationEnrichmentEventType.nonsense_mutation,
    MutationEnrichmentEventType.nonsense,
    MutationEnrichmentEventType.stopgain_snv,
    MutationEnrichmentEventType.stop_gained,
];
export const frameshiftInsertionGroup = [
    MutationEnrichmentEventType.frame_shift_ins,
    MutationEnrichmentEventType.frameshift_insertion,
];
export const frameshiftDeletionGroup = [
    MutationEnrichmentEventType.frame_shift_del,
    MutationEnrichmentEventType.frameshift_deletion,
];
export const frameshiftGroup = [
    MutationEnrichmentEventType.frameshift,
    MutationEnrichmentEventType.frameshift_variant,
    ...frameshiftDeletionGroup,
    ...frameshiftInsertionGroup,
];
export const nonstartGroup = [
    MutationEnrichmentEventType.translation_start_site,
    MutationEnrichmentEventType.initiator_codon_variant,
    MutationEnrichmentEventType.start_codon_snp,
    MutationEnrichmentEventType.start_codon_del,
    MutationEnrichmentEventType.de_novo_start_outofframe,
];
export const nonstopGroup = [
    MutationEnrichmentEventType.nonstop_mutation,
    MutationEnrichmentEventType.stop_lost,
];
export const spliceGroup = [
    MutationEnrichmentEventType.splice_site,
    MutationEnrichmentEventType.splice,
    MutationEnrichmentEventType.splicing,
    MutationEnrichmentEventType.splice_site_snp,
    MutationEnrichmentEventType.splice_site_del,
    MutationEnrichmentEventType.splice_site_indel,
    MutationEnrichmentEventType.splice_region_variant,
    MutationEnrichmentEventType.splice_region,
];
export const truncationGroup = [
    MutationEnrichmentEventType.truncating,
    MutationEnrichmentEventType.feature_truncation,
    ...nonsenseGroup,
    ...frameshiftGroup,
    ...nonstartGroup,
    ...nonstopGroup,
    ...spliceGroup,
];
export const otherGroup = [
    MutationEnrichmentEventType.silent,
    MutationEnrichmentEventType.synonymous_variant,
    MutationEnrichmentEventType.targeted_region,
    MutationEnrichmentEventType.other,
];
export const mutationGroup = [
    ...missenseGroup,
    ...inframeGroup,
    ...truncationGroup,
    ...otherGroup,
];
export const amplificationGroup = [CopyNumberEnrichmentEventType.AMP];
export const deletionGroup = [CopyNumberEnrichmentEventType.HOMDEL];
export const cnaGroup = [...amplificationGroup, ...deletionGroup];

export function cnaEventTypeSelectInit(
    profiles: MolecularProfile[]
): {
    [key in CopyNumberEnrichmentEventType]?: boolean;
} {
    if (profiles.length > 0) {
        return {
            [CopyNumberEnrichmentEventType.HOMDEL]: true,
            [CopyNumberEnrichmentEventType.AMP]: true,
        };
    } else {
        return {};
    }
}
export function mutationEventTypeSelectInit(
    mutationProfiles: MolecularProfile[]
) {
    if (mutationProfiles.length > 0) {
        return mutationGroup.reduce((acc, type) => {
            acc[type] = true;
            return acc;
        }, {} as { [key in MutationEnrichmentEventType]?: boolean });
    } else {
        return {};
    }
}
export function structuralVariantEventTypeSelectInit(
    structuralVariantProfiles: MolecularProfile[]
): {
    [key in StructuralVariantEnrichmentEventType]?: boolean;
} {
    if (structuralVariantProfiles.length > 0) {
        return {
            [StructuralVariantEnrichmentEventType.structural_variant]: true,
        };
    } else {
        return {};
    }
}

export function buildAlterationsTabName(store: ComparisonStore) {
    const nameElements = [];
    store.hasMutationEnrichmentData && nameElements.push('Mutations');
    store.hasStructuralVariantData && nameElements.push('Structural Variants');
    store.hasCnaEnrichmentData && nameElements.push('CNAs');
    return nameElements.join('/');
}

export function getMutationEventTypesAPIParameter(
    selectedEvents: { [t in MutationEnrichmentEventType]?: boolean }
) {
    return stringListToMap(
        mutationGroup,
        (e: MutationEnrichmentEventType) => selectedEvents[e] || false
    );
}

export function getCopyNumberEventTypesAPIParameter(
    selectedEvents: { [t in CopyNumberEnrichmentEventType]?: boolean }
) {
    return stringListToMap(
        cnaGroup,
        (e: CopyNumberEnrichmentEventType) => selectedEvents[e] || false
    );
}

export function doEnrichmentEventTypeMapsMatch<T>(
    mapA: { [type in keyof T]?: boolean },
    mapB: { [type in keyof T]?: boolean }
) {
    // Just make sure that the `true`s are the same
    return (
        _.every(mapA, (val, key: keyof T) => {
            if (val) {
                return mapB[key];
            } else {
                return true;
            }
        }) &&
        _.every(mapB, (val, key: keyof T) => {
            if (val) {
                return mapA[key];
            } else {
                return true;
            }
        })
    );
}
