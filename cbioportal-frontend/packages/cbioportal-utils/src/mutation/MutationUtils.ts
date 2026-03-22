import _ from 'lodash';

import { GenomicLocation } from 'genome-nexus-ts-api-client';
import { Mutation } from '../model/Mutation';

export function countMutationsByProteinChange(
    mutations: Mutation[]
): { proteinChange: string; count: number }[] {
    const mutationsByProteinChange = _.groupBy(mutations, 'proteinChange');
    const mutationCountsByProteinChange = _.map(
        mutationsByProteinChange,
        mutations => ({
            proteinChange: mutations[0].proteinChange,
            count: mutations.length,
        })
    );

    // order by count descending, and then protein change ascending
    return _.orderBy(
        mutationCountsByProteinChange,
        ['count', 'proteinChange'],
        ['desc', 'asc']
    );
}

export function groupMutationsByProteinStartPos<T extends Mutation>(
    mutations: T[]
): { [pos: number]: T[] } {
    const map: { [pos: number]: T[] } = {};

    for (const mutation of mutations) {
        const codon = mutation.proteinPosStart;

        if (codon !== undefined && codon !== null) {
            map[codon] = map[codon] || [];
            map[codon].push(mutation);
        }
    }

    return map;
}

// TODO workaround for cbioportal API mutation type,
//  add a custom getChromosome(mutation: Mutation) function instead?
function findChromosome(
    mutation: Partial<Mutation & { chr?: string }>
): string | undefined {
    return mutation.chromosome || mutation.chr;
}

export function extractGenomicLocation(
    mutation: Partial<Mutation & { chr?: string }>
): GenomicLocation | undefined {
    const chromosome = findChromosome(mutation);

    if (
        chromosome &&
        mutation.startPosition &&
        mutation.endPosition &&
        mutation.referenceAllele &&
        mutation.variantAllele
    ) {
        return {
            chromosome: chromosome.replace('chr', ''),
            start: mutation.startPosition,
            end: mutation.endPosition,
            referenceAllele: mutation.referenceAllele,
            variantAllele: mutation.variantAllele,
        };
    } else {
        return undefined;
    }
}

export function generateHgvsgByMutation(
    mutation: Partial<Mutation & { chr?: string }>
): string | undefined {
    if (hasValidGenomicLocation(mutation)) {
        const chromosome = findChromosome(mutation);

        // ins
        if (mutation.referenceAllele === '-') {
            return `${chromosome}:g.${mutation.startPosition}_${mutation.endPosition}ins${mutation.variantAllele}`;
        }
        // del
        else if (mutation.variantAllele === '-') {
            if (mutation.startPosition === mutation.endPosition) {
                return `${chromosome}:g.${mutation.startPosition}del`;
            }
            return `${chromosome}:g.${mutation.startPosition}_${mutation.endPosition}del`;
        }
        // substitution
        else if (
            mutation.referenceAllele!.length === 1 &&
            mutation.variantAllele!.length === 1
        ) {
            return `${chromosome}:g.${mutation.startPosition}${mutation.referenceAllele}>${mutation.variantAllele}`;
        }
        // delins
        else if (
            mutation.referenceAllele!.length === 1 &&
            mutation.variantAllele!.length > 1
        ) {
            return `${chromosome}:g.${mutation.startPosition}delins${mutation.variantAllele}`;
        }
        // delins
        // for cases mutation.referenceAllele.length > 1 && mutation.variantAllele.length >= 1
        else {
            return `${chromosome}:g.${mutation.startPosition}_${mutation.endPosition}delins${mutation.variantAllele}`;
        }
    }

    return undefined;
}

export function hasValidGenomicLocation(
    mutation: Partial<Mutation & { chr?: string }>
): boolean {
    if (
        findChromosome(mutation) &&
        mutation.startPosition &&
        mutation.startPosition !== -1 &&
        mutation.endPosition &&
        mutation.endPosition !== -1 &&
        mutation.referenceAllele &&
        mutation.referenceAllele !== 'NA' &&
        mutation.variantAllele &&
        mutation.variantAllele !== 'NA'
    ) {
        if (
            mutation.referenceAllele === '-' &&
            mutation.variantAllele === '-'
        ) {
            return false;
        }
        return true;
    }

    return false;
}

export function genomicLocationString(genomicLocation: GenomicLocation) {
    return `${genomicLocation.chromosome},${genomicLocation.start},${genomicLocation.end},${genomicLocation.referenceAllele},${genomicLocation.variantAllele}`;
}

export function uniqueGenomicLocations(
    mutations: Partial<Mutation>[]
): GenomicLocation[] {
    const genomicLocationMap: { [key: string]: GenomicLocation } = {};

    mutations.map((mutation: Partial<Mutation>) => {
        const genomicLocation:
            | GenomicLocation
            | undefined = extractGenomicLocation(mutation);

        if (genomicLocation) {
            genomicLocationMap[
                genomicLocationString(genomicLocation)
            ] = genomicLocation;
        }
    });

    return _.values(genomicLocationMap);
}

export function normalizeChromosome(chromosome: string) {
    switch (chromosome) {
        case '23': {
            return 'X';
        }
        case '24': {
            return 'Y';
        }
        default: {
            return chromosome;
        }
    }
}
