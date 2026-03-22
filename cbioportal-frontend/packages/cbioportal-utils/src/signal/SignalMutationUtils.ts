import {
    CountByTumorType,
    SignalMutation,
    StatsByTumorType,
} from 'genome-nexus-ts-api-client';
import _ from 'lodash';
import {
    IExtendedSignalMutation,
    ISignalTumorTypeDecomposition,
} from '../model/SignalMutation';
import { SignalMutationStatus } from '../model/SignalMutationStatus';

export enum Pathogenicity {
    GERMLINE = 'germline',
    SOMATIC = 'somatic',
    BIALLELIC = 'biallelic',
}

export function isGermlineMutation(mutation: SignalMutation) {
    return mutation.mutationStatus.toLowerCase() === 'germline';
}

export function isSomaticMutation(mutation: SignalMutation) {
    return mutation.mutationStatus.toLowerCase() === 'somatic';
}

export function isPathogenicMutation(mutation: SignalMutation) {
    return mutation.pathogenic === '1';
}

export function extendMutations(
    mutations: SignalMutation[]
): IExtendedSignalMutation[] {
    // filter out biallelic mutations, since their count is already included in germline mutations
    // we only use biallelic mutations to add frequency values and additional count fields
    return mutations.map(mutation => {
        const isSomatic = isSomaticMutation(mutation);
        const isGermline = isGermlineMutation(mutation);
        const isPathogenic = isPathogenicMutation(mutation);

        const pathogenicGermlineFrequency =
            isGermline && isPathogenic
                ? calculateOverallFrequency(mutation.countsByTumorType)
                : null;
        const biallelicGermlineFrequency =
            isGermline && mutation.biallelicCountsByTumorType
                ? calculateOverallFrequency(mutation.biallelicCountsByTumorType)
                : null;

        const tumorTypeDecomposition: ISignalTumorTypeDecomposition[] = generateTumorTypeDecomposition(
            mutation,
            mutation.countsByTumorType,
            mutation.biallelicCountsByTumorType,
            mutation.qcPassCountsByTumorType,
            mutation.statsByTumorType
        );

        return {
            ...mutation,
            tumorTypeDecomposition,
            somaticFrequency: isSomatic
                ? calculateOverallFrequency(mutation.countsByTumorType)
                : null,
            germlineFrequency: isGermline
                ? calculateOverallFrequency(mutation.countsByTumorType)
                : null,
            pathogenicGermlineFrequency,
            biallelicGermlineFrequency,
            biallelicPathogenicGermlineFrequency: isPathogenic
                ? biallelicGermlineFrequency
                : null,
            ratioBiallelicPathogenic:
                isPathogenic &&
                mutation.biallelicCountsByTumorType &&
                mutation.qcPassCountsByTumorType
                    ? calculateTotalVariantRatio(
                          mutation.biallelicCountsByTumorType,
                          mutation.qcPassCountsByTumorType
                      )
                    : null,
        };
    });
}

export function generateTumorTypeDecomposition(
    mutation: SignalMutation,
    countsByTumorType: CountByTumorType[],
    biallelicCountsByTumorType?: CountByTumorType[],
    qcPassCountsByTumorType?: CountByTumorType[],
    statsByTumorType?: StatsByTumorType[]
) {
    let biallelicTumorMap: { [tumorType: string]: CountByTumorType };
    let qcPassTumorMap: { [tumorType: string]: CountByTumorType };
    let statsTumorMap: { [tumorType: string]: StatsByTumorType };

    if (biallelicCountsByTumorType && qcPassCountsByTumorType) {
        biallelicTumorMap = _.keyBy(
            biallelicCountsByTumorType,
            item => item.tumorType
        );
        qcPassTumorMap = _.keyBy(
            qcPassCountsByTumorType,
            item => item.tumorType
        );
    }

    if (statsByTumorType) {
        statsTumorMap = _.keyBy(statsByTumorType, item => item.tumorType);
    }

    return countsByTumorType.map(counts => ({
        ...counts,
        frequency: counts.variantCount / counts.tumorTypeCount,
        biallelicRatio:
            biallelicTumorMap && qcPassTumorMap
                ? calcBiallelicRatio(
                      biallelicTumorMap[counts.tumorType],
                      qcPassTumorMap[counts.tumorType]
                  )
                : null,
        biallelicVariantCount:
            biallelicTumorMap && biallelicTumorMap[counts.tumorType]
                ? biallelicTumorMap[counts.tumorType].variantCount
                : 0,
        ageAtDx:
            statsTumorMap && statsTumorMap[counts.tumorType]
                ? statsTumorMap[counts.tumorType].ageAtDx
                : null,
        fCancerTypeCount:
            statsTumorMap && statsTumorMap[counts.tumorType]
                ? statsTumorMap[counts.tumorType].fCancerTypeCount
                : null,
        fractionLoh:
            statsTumorMap &&
            statsTumorMap[counts.tumorType] &&
            statsTumorMap[counts.tumorType].hrdScore
                ? statsTumorMap[counts.tumorType].hrdScore.fractionLoh
                : null,
        lst:
            statsTumorMap &&
            statsTumorMap[counts.tumorType] &&
            statsTumorMap[counts.tumorType].hrdScore
                ? statsTumorMap[counts.tumorType].hrdScore.lst
                : null,
        ntelomericAi:
            statsTumorMap &&
            statsTumorMap[counts.tumorType] &&
            statsTumorMap[counts.tumorType].hrdScore
                ? statsTumorMap[counts.tumorType].hrdScore.ntelomericAi
                : null,
        msiScore:
            statsTumorMap && statsTumorMap[counts.tumorType]
                ? statsTumorMap[counts.tumorType].msiScore
                : null,
        nCancerTypeCount:
            statsTumorMap && statsTumorMap[counts.tumorType]
                ? statsTumorMap[counts.tumorType].nCancerTypeCount
                : null,
        tmb:
            statsTumorMap && statsTumorMap[counts.tumorType]
                ? statsTumorMap[counts.tumorType].tmb
                : null,
        mutationStatus: getSignalMutationStatus(mutation),
        biallelicTumorCount:
            biallelicTumorMap && biallelicTumorMap[counts.tumorType]
                ? biallelicTumorMap[counts.tumorType].variantCount
                : null,
        qcPassTumorCount:
            qcPassTumorMap && qcPassTumorMap[counts.tumorType]
                ? qcPassTumorMap[counts.tumorType].variantCount
                : null,
        numberOfGermlineHomozygous:
            statsTumorMap && statsTumorMap[counts.tumorType]
                ? statsTumorMap[counts.tumorType].numberOfGermlineHomozygous
                : null,
    }));
}

export function calcBiallelicRatio(
    biallelicCountByTumorType?: CountByTumorType,
    qcPassCountByTumorType?: CountByTumorType
) {
    const ratio =
        (biallelicCountByTumorType
            ? biallelicCountByTumorType.variantCount
            : 0) /
        (qcPassCountByTumorType ? qcPassCountByTumorType.variantCount : 0);

    return _.isNaN(ratio) ? null : ratio;
}

export function totalVariants(counts: CountByTumorType[]) {
    return (
        counts.map(c => c.variantCount).reduce((acc, curr) => acc + curr, 0) ||
        0
    );
}

export function totalSamples(counts: CountByTumorType[]) {
    return (
        counts
            .map(c => c.tumorTypeCount)
            .reduce((acc, curr) => acc + curr, 0) || 0
    );
}

export function calculateOverallFrequency(counts: CountByTumorType[]) {
    return totalVariants(counts) / totalSamples(counts);
}

export function calculateTotalVariantRatio(
    counts1: CountByTumorType[],
    counts2: CountByTumorType[]
) {
    return totalVariants(counts1) / totalVariants(counts2);
}

export function getSignalMutationStatus(mutation: SignalMutation) {
    if (isGermlineMutation(mutation)) {
        if (isPathogenicMutation(mutation)) {
            return SignalMutationStatus.PATHOGENIC_GERMLINE;
        } else {
            return SignalMutationStatus.BENIGN_GERMLINE;
        }
    } else if (isSomaticMutation(mutation)) {
        return SignalMutationStatus.SOMATIC;
    }
    return SignalMutationStatus.UNKNOWN;
}
