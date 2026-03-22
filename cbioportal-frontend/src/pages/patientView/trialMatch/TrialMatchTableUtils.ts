import {
    IArmMatch,
    IClinicalGroupMatch,
    IDetailedTrialMatch,
    IGenomicGroupMatch,
    IGenomicMatch,
    ITrial,
    ITrialMatch,
    IArm,
    IDrug,
    IGenomicMatchType,
} from '../../../shared/model/MatchMiner';
import _ from 'lodash';

export function groupTrialMatchesById(
    trials: ITrial[],
    trialMatches: ITrialMatch[]
): IDetailedTrialMatch[] {
    trialMatches = excludeControlArms(trialMatches);
    const matchesGroupedById = _.groupBy(
        trialMatches,
        (trial: ITrialMatch) => trial.id
    );
    const matchedTrials: IDetailedTrialMatch[] = _.map(
        matchesGroupedById,
        (trialGroup, trialId) => {
            const originalMatchedTrial: ITrial = _.find(
                trials,
                trial => trial.id === trialId
            )!;
            const matchedTrial: IDetailedTrialMatch = {
                id: originalMatchedTrial.id,
                nctId: originalMatchedTrial.nctId,
                principalInvestigator:
                    originalMatchedTrial.principalInvestigator,
                protocolNo: originalMatchedTrial.protocolNo,
                phase: originalMatchedTrial.phase,
                shortTitle: originalMatchedTrial.shortTitle,
                status: originalMatchedTrial.status,
                matches: [],
                priority: 0, // highest priority
            };
            matchedTrial.matches = groupTrialMatchesByArmDescription(
                trialGroup,
                originalMatchedTrial
            );
            matchedTrial.priority = calculateTrialPriority(
                matchedTrial.matches
            );
            return matchedTrial;
        }
    );
    return _.sortBy(
        matchedTrials,
        (trial: IDetailedTrialMatch) => trial.priority
    );
}

export function groupTrialMatchesByArmDescription(
    trialGroup: ITrialMatch[],
    originalMatchedTrial: ITrial
): IArmMatch[] {
    const matchesGroupedByArm = _.groupBy(
        trialGroup,
        (trial: ITrialMatch) => trial.armDescription
    );
    const matches = _.map(matchesGroupedByArm, (armGroup, armDescription) => {
        const armMatch: IArmMatch = {
            armDescription: armDescription,
            drugs: [],
            matches: [],
            sampleIds: _.uniq(
                armGroup.map((trialMatch: ITrialMatch) => trialMatch.sampleId)
            ).sort(),
        };
        if (!_.isUndefined(originalMatchedTrial.treatmentList.step[0].arm)) {
            armMatch.drugs = getDrugsFromArm(
                armDescription,
                originalMatchedTrial.treatmentList.step[0].arm
            );
        }
        armMatch.matches = groupTrialMatchesByAgeNumerical(armGroup);
        return armMatch;
    });
    return matches;
}

export function groupTrialMatchesByAgeNumerical(
    armGroup: ITrialMatch[]
): IClinicalGroupMatch[] {
    const matchesGroupedByAge = _.groupBy(
        armGroup,
        (trial: ITrialMatch) => trial.trialAgeNumerical
    );
    const matches = _.map(matchesGroupedByAge, (ageGroup, age) => {
        const cancerTypes = _.uniq(
            _.map(
                ageGroup,
                (trial: ITrialMatch) => trial.trialOncotreePrimaryDiagnosis
            )
        );
        const positiveCancerTypes: string[] = [];
        const negativeCancerTypes: string[] = [];
        _.map(cancerTypes, item => {
            // If a cancer type contains a "!", it means this trial cannot be used for the cancer type, which is a "NOT" match.
            if (!_.isUndefined(item)) {
                if (item.includes('!')) {
                    negativeCancerTypes.push(item.replace('!', ''));
                } else {
                    positiveCancerTypes.push(item);
                }
            }
        });
        const clinicalGroupMatch: IClinicalGroupMatch = {
            trialAgeNumerical: [age],
            trialOncotreePrimaryDiagnosis: {
                positive: positiveCancerTypes,
                negative: negativeCancerTypes,
            },
        };
        const positiveTrialMatches = _.filter(
            matchesGroupedByAge[age],
            (trialMatch: ITrialMatch) => {
                if (
                    !_.isUndefined(trialMatch.genomicAlteration) &&
                    trialMatch.genomicAlteration !== ''
                )
                    return !trialMatch.genomicAlteration.includes('!');
            }
        );
        const negativeTrialMatches = _.filter(
            matchesGroupedByAge[age],
            (trialMatch: ITrialMatch) => {
                if (
                    !_.isUndefined(trialMatch.genomicAlteration) &&
                    trialMatch.genomicAlteration !== ''
                )
                    return trialMatch.genomicAlteration.includes('!');
            }
        );
        if (positiveTrialMatches.length > 0) {
            clinicalGroupMatch.matches = groupPositiveTrialMatchesByMatchType(
                positiveTrialMatches
            );
        }
        if (negativeTrialMatches.length > 0) {
            clinicalGroupMatch.notMatches = groupNegativeTrialMatchesByMatchType(
                negativeTrialMatches
            );
        }
        return clinicalGroupMatch;
    });
    if (matches.length > 1) {
        return mergeClinicalGroupMatchByAge(matches);
    }
    return matches;
}

// Merge clinical matches by age when they have the same trialOncotreePrimaryDiagnosis but different trialAgeNumericals.
export function mergeClinicalGroupMatchByAge(
    clinicalGroupMatch: IClinicalGroupMatch[]
): IClinicalGroupMatch[] {
    const mergedClinicalGroupMatch: IClinicalGroupMatch[] = [];
    const matchesGroupedByTrialOncotreePrimaryDiagnosis = _.groupBy(
        clinicalGroupMatch,
        (match: IClinicalGroupMatch) => match.trialOncotreePrimaryDiagnosis
    );
    _.forEach(
        matchesGroupedByTrialOncotreePrimaryDiagnosis,
        (clinicalGroup: IClinicalGroupMatch[]) => {
            _.forEach(
                clinicalGroup,
                (clinicalMatch: IClinicalGroupMatch, index: number) => {
                    if (index !== 0) {
                        clinicalGroup[0].trialAgeNumerical = clinicalGroup[0].trialAgeNumerical.concat(
                            clinicalMatch.trialAgeNumerical
                        );
                    }
                }
            );
            mergedClinicalGroupMatch.push(clinicalGroup[0]);
        }
    );
    return mergedClinicalGroupMatch;
}

export function groupPositiveTrialMatchesByMatchType(
    trialMatches: ITrialMatch[]
) {
    const matchesGroupedByMatchType = _.groupBy(
        trialMatches,
        (trial: ITrialMatch) => trial.matchType
    );
    const matches: IGenomicMatchType = {
        MUTATION: [],
        CNA: [],
        MSI: [],
        WILDTYPE: [],
    };
    _.forEach(
        matchesGroupedByMatchType,
        (matchTypeGroup: ITrialMatch[], matchType: string) => {
            if (matchType === 'MUTATION') {
                const matchesGroupedByHugoSymbol = _.groupBy(
                    matchTypeGroup,
                    (trial: ITrialMatch) => trial.trueHugoSymbol!
                );
                _.forEach(
                    matchesGroupedByHugoSymbol,
                    (patientGenomicGroup: ITrialMatch[]) => {
                        const mutationGroupMatch: IGenomicGroupMatch = {
                            genomicAlteration: _.uniq(
                                patientGenomicGroup.map(
                                    (trialMatch: ITrialMatch) =>
                                        trialMatch.genomicAlteration!
                                )
                            ),
                            patientGenomic: {
                                trueHugoSymbol: patientGenomicGroup[0]
                                    .trueHugoSymbol!,
                                trueProteinChange: _.uniq(
                                    patientGenomicGroup.map(
                                        (match: ITrialMatch) =>
                                            match.trueProteinChange!
                                    )
                                ).sort(),
                            },
                        };
                        matches.MUTATION.push(mutationGroupMatch);
                    }
                );
            } else {
                const genomicGroupMatch: IGenomicGroupMatch = {
                    genomicAlteration: _.uniq(
                        matchTypeGroup.map(
                            (trialMatch: ITrialMatch) =>
                                trialMatch.genomicAlteration!
                        )
                    ),
                };
                matches[matchType].push(genomicGroupMatch);
            }
        }
    );
    return matches;
}

export function groupNegativeTrialMatchesByMatchType(
    trialMatches: ITrialMatch[]
) {
    const matchesGroupedByMatchType = _.groupBy(
        trialMatches,
        (trial: ITrialMatch) => trial.matchType
    );
    const matches: IGenomicMatchType = {
        MUTATION: [],
        CNA: [],
        MSI: [],
        WILDTYPE: [],
    };
    _.forEach(
        matchesGroupedByMatchType,
        (matchTypeGroup: ITrialMatch[], matchType: string) => {
            const genomicGroupMatch: IGenomicGroupMatch = {
                genomicAlteration: _.uniq(
                    matchTypeGroup.map(
                        (trialMatch: ITrialMatch) =>
                            trialMatch.genomicAlteration!
                    )
                ),
            };
            matches[matchType].push(genomicGroupMatch);
        }
    );
    return matches;
}

export function calculateTrialPriority(armMatches: IArmMatch[]): number {
    let priority = 0;
    _.forEach(armMatches, armMatch => {
        _.forEach(
            armMatch.matches,
            (clinicalGroupMatch: IClinicalGroupMatch) => {
                priority += getMatchPriority(clinicalGroupMatch);
            }
        );
    });
    return priority;
}

export function getMatchPriority(
    clinicalGroupMatch: IClinicalGroupMatch
): number {
    // In trial match tab, positive matches should always display before negative matches(notMatches).
    // The highest and default priority is 0. The priority the higher, the display order the lower.
    let matchesLength = 0;
    let notMatchesLength = 0;
    if (!_.isUndefined(clinicalGroupMatch.matches)) {
        matchesLength = getMatchesLength(clinicalGroupMatch.matches);
    }
    if (!_.isUndefined(clinicalGroupMatch.notMatches)) {
        notMatchesLength = getMatchesLength(clinicalGroupMatch.notMatches);
    }
    if (notMatchesLength > 0) {
        if (matchesLength === 0) {
            return 2; // A trial only has negative matches.
        }
        return 1; // A trial has both positive matches and negative matches.
    }
    return 0; // A trial only has positive matches.
}

export function getMatchesLength(genomicMatchType: IGenomicMatchType): number {
    return _.sum([
        genomicMatchType.MUTATION.length,
        genomicMatchType.CNA.length,
        genomicMatchType.MSI.length,
        genomicMatchType.WILDTYPE.length,
    ]);
}

export function excludeControlArms(trialMatches: ITrialMatch[]): ITrialMatch[] {
    const hiddenArmTypes = ['Control Arm', 'Placebo Arm'];
    const filteredTrialMatches: ITrialMatch[] = [];
    _.forEach(trialMatches, trialMatch => {
        if (
            !trialMatch.armType ||
            !hiddenArmTypes.includes(trialMatch.armType)
        ) {
            filteredTrialMatches.push(trialMatch);
        }
    });
    return filteredTrialMatches;
}

export function getDrugsFromArm(
    armDescription: string,
    arms: IArm[]
): string[][] {
    let drugs: string[][] = [];
    if (armDescription !== '') {
        // match for specific arm
        const matchedArm: IArm = _.find(
            arms,
            arm => arm.arm_description === armDescription
        )!;
        if (!_.isUndefined(matchedArm.drugs)) {
            drugs = matchedArm.drugs.map((drugCombination: IDrug[]) =>
                drugCombination.map((drug: IDrug) => drug.name)
            );
        }
    }
    return drugs;
}

export function getAgeRangeDisplay(trialAgeNumerical: string[]) {
    if (trialAgeNumerical.length > 1) {
        const ageNumbers = trialAgeNumerical.map((age: string) =>
            age.match(/\d+(\.?\d+)?/g)!.map((v: string) => Number(v))
        );
        if (trialAgeNumerical.length === 2) {
            let leftAgeText = '';
            let rightAgeText = '';
            if (
                trialAgeNumerical[0].includes('>') &&
                trialAgeNumerical[1].includes('<')
            ) {
                if (trialAgeNumerical[0].includes('=')) {
                    leftAgeText = `${ageNumbers[0]} ≤`;
                } else {
                    leftAgeText = `${ageNumbers[0]} <`;
                }
                if (trialAgeNumerical[1].includes('=')) {
                    rightAgeText = `≤ ${ageNumbers[1]}`;
                } else {
                    rightAgeText = `< ${ageNumbers[1]}`;
                }
                return `${leftAgeText} Age ${rightAgeText}`;
            } else if (
                trialAgeNumerical[0].includes('<') &&
                trialAgeNumerical[1].includes('>')
            ) {
                if (trialAgeNumerical[1].includes('=')) {
                    leftAgeText = `${ageNumbers[1]} ≤`;
                } else {
                    leftAgeText = `${ageNumbers[1]} <`;
                }
                if (trialAgeNumerical[0].includes('=')) {
                    rightAgeText = `≤ ${ageNumbers[0]}`;
                } else {
                    rightAgeText = `< ${ageNumbers[0]}`;
                }
                return `${leftAgeText} Age ${rightAgeText}`;
            } else {
                return `Age: ${trialAgeNumerical.join(', ')}`;
            }
        } else {
            return `Age: ${trialAgeNumerical.join(', ')}`;
        }
    } else {
        return `${trialAgeNumerical[0]} yrs old`;
    }
}
