import { CountByTumorType, SignalMutation } from 'genome-nexus-ts-api-client';

export interface ISignalTumorTypeDecomposition extends CountByTumorType {
    frequency: number | null;
    biallelicRatio: number | null;
    biallelicVariantCount: number;
    fractionLoh: number | null;
    lst: number | null;
    ntelomericAi: number | null;
    mutationStatus: string;
    ageAtDx: number | null;
    fCancerTypeCount: number | null;
    msiScore: number | null;
    nCancerTypeCount: number | null;
    tmb: number | null;
    biallelicTumorCount: number | null;
    qcPassTumorCount: number | null;
    numberOfGermlineHomozygous: number | null;
}

export interface IExtendedSignalMutation extends SignalMutation {
    tumorTypeDecomposition: ISignalTumorTypeDecomposition[];
    somaticFrequency: number | null;
    germlineFrequency: number | null;
    pathogenicGermlineFrequency: number | null;
    biallelicGermlineFrequency: number | null;
    biallelicPathogenicGermlineFrequency: number | null;
    ratioBiallelicPathogenic: number | null;
}
