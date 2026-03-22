import _ from 'lodash';

import {
    AlleleCount,
    AlleleFrequency,
    AlleleNumber,
    Gnomad,
    Homozygotes,
    MyVariantInfo,
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';
import { GnomadSummary } from '../model/GnomadSummary';

const GNOMAD_POPULATION_NAME: { [key: string]: string } = {
    African: 'afr',
    Latino: 'amr',
    Other: 'oth',
    'European (Non-Finnish)': 'nfe',
    'European (Finnish)': 'fin',
    'Ashkenazi Jewish': 'asj',
    'East Asian': 'eas',
    'South Asian': 'sas',
    Total: '',
};

export enum GnomadTableColumnName {
    population = 'population',
    alleleCount = 'ac',
    alleleNumber = 'an',
    homozygotes = 'hom',
    alleleFrequency = 'af',
}

export function calculateGnomadAlleleFrequency(
    count: number | null,
    totalNumber: number | null,
    frequency: number | null
): number {
    if (frequency !== null) {
        return frequency;
    } else {
        return count && totalNumber && totalNumber !== 0
            ? count / totalNumber
            : 0;
    }
}

export function calculateGnomadTableNumber(
    gnomadExome?: number | null,
    gnomadGenome?: number | null
) {
    let result = 0;
    if (gnomadGenome && gnomadExome) {
        result = gnomadGenome + gnomadExome;
    } else if (gnomadGenome) {
        result = gnomadGenome;
    } else if (gnomadExome) {
        result = gnomadExome;
    }
    return result;
}

export function getGnomadUrl(
    annotation?: VariantAnnotation,
    myVariantInfo?: MyVariantInfo
) {
    let gnomadUrl = '';

    if (
        myVariantInfo &&
        (myVariantInfo.gnomadExome || myVariantInfo.gnomadGenome)
    ) {
        // get gnomad link from chrom, location, ref and alt
        gnomadUrl =
            myVariantInfo && myVariantInfo.vcf
                ? generateGnomadUrl(
                      annotation?.seq_region_name || null,
                      myVariantInfo.vcf.position,
                      myVariantInfo.vcf.ref,
                      myVariantInfo.vcf.alt
                  )
                : '';
    }

    return gnomadUrl;
}

export function getGnomadDataSortedByFrequency(myVariantInfo?: MyVariantInfo) {
    const gnomadData = getGnomadData(myVariantInfo);
    return gnomadData ? sortGnomadDataByFrequency(gnomadData) : gnomadData;
}

export function sortGnomadDataByFrequency(gnomadData: {
    [key: string]: GnomadSummary;
}) {
    // sort by frequency
    const sorted = _.sortBy(Object.values(gnomadData).slice(0, 8), [
        'alleleFrequency',
    ]).reverse();

    // add the total row at the bottom
    sorted.push(gnomadData['Total']);

    return sorted;
}

export function setGnomadTableData(
    key: string,
    data: Gnomad,
    result: { [key: string]: GnomadSummary }
) {
    // Access data by population name and column name in the format of: GnomadTableColumnName_POPULATION_NAME, e.g. "ac_afr"
    // If access "total" data, the name would be e.g. "ac" for alleleCount, "an" for alleleNumber
    const alleleCountName: keyof AlleleCount = (GNOMAD_POPULATION_NAME[key]
        ? GnomadTableColumnName.alleleCount + '_' + GNOMAD_POPULATION_NAME[key]
        : GnomadTableColumnName.alleleCount
    ).toString() as keyof AlleleCount;
    const alleleNumberName: keyof AlleleNumber = (GNOMAD_POPULATION_NAME[key]
        ? GnomadTableColumnName.alleleNumber + '_' + GNOMAD_POPULATION_NAME[key]
        : GnomadTableColumnName.alleleNumber
    ).toString() as keyof AlleleNumber;
    const homozygotesName: keyof Homozygotes = (GNOMAD_POPULATION_NAME[key]
        ? GnomadTableColumnName.homozygotes + '_' + GNOMAD_POPULATION_NAME[key]
        : GnomadTableColumnName.homozygotes
    ).toString() as keyof Homozygotes;
    const alleleFrequencyName: keyof AlleleFrequency = (GNOMAD_POPULATION_NAME[
        key
    ]
        ? GnomadTableColumnName.alleleFrequency +
          '_' +
          GNOMAD_POPULATION_NAME[key]
        : GnomadTableColumnName.alleleFrequency
    ).toString() as keyof AlleleFrequency;

    result[key] = {
        population: key,
        alleleCount: data.alleleCount[alleleCountName]
            ? data.alleleCount[alleleCountName]
            : 0,
        alleleNumber: data.alleleNumber[alleleNumberName]
            ? data.alleleNumber[alleleNumberName]
            : 0,
        homozygotes: data.homozygotes[homozygotesName]
            ? data.homozygotes[homozygotesName]
            : 0,
        alleleFrequency: calculateGnomadAlleleFrequency(
            data.alleleCount[alleleCountName],
            data.alleleNumber[alleleNumberName],
            data.alleleFrequency[alleleFrequencyName]
        ),
    } as GnomadSummary;
}

export function getGnomadData(myVariantInfo?: MyVariantInfo) {
    let gnomadData: { [key: string]: GnomadSummary } | undefined;

    // check if gnomad data is valid
    if (
        myVariantInfo &&
        (myVariantInfo.gnomadExome || myVariantInfo.gnomadGenome)
    ) {
        const gnomadExome: { [key: string]: GnomadSummary } = {};
        const gnomadGenome: { [key: string]: GnomadSummary } = {};
        const combinedGnomad: { [key: string]: GnomadSummary } = {};
        // If gnomadExome data exists, set gnomadExome
        if (myVariantInfo.gnomadExome) {
            Object.keys(GNOMAD_POPULATION_NAME).forEach(key =>
                setGnomadTableData(key, myVariantInfo.gnomadExome, gnomadExome)
            );
            gnomadData = gnomadExome;
        }

        // If gnomadGenome data exists, set gnomadGenome
        if (myVariantInfo.gnomadGenome) {
            Object.keys(GNOMAD_POPULATION_NAME).forEach(key =>
                setGnomadTableData(
                    key,
                    myVariantInfo.gnomadGenome,
                    gnomadGenome
                )
            );
            gnomadData = gnomadGenome;
        }

        // If both gnomadExome and gnomadGenome exist, combine gnomadExome and gnomadGenome together, set to combinedGnomad
        if (myVariantInfo.gnomadExome && myVariantInfo.gnomadGenome) {
            Object.keys(GNOMAD_POPULATION_NAME).forEach(key => {
                combinedGnomad[key] = {
                    population: key,
                    alleleCount: calculateGnomadTableNumber(
                        gnomadExome[key]?.alleleCount,
                        gnomadGenome[key]?.alleleCount
                    ),
                    alleleNumber: calculateGnomadTableNumber(
                        gnomadExome[key]?.alleleNumber,
                        gnomadGenome[key]?.alleleNumber
                    ),
                    homozygotes: calculateGnomadTableNumber(
                        gnomadExome[key]?.homozygotes,
                        gnomadGenome[key]?.homozygotes
                    ),
                    alleleFrequency: calculateGnomadAlleleFrequency(
                        calculateGnomadTableNumber(
                            gnomadExome[key]?.alleleCount,
                            gnomadGenome[key]?.alleleCount
                        ),
                        calculateGnomadTableNumber(
                            gnomadExome[key]?.alleleNumber,
                            gnomadGenome[key]?.alleleNumber
                        ),
                        null
                    ),
                } as GnomadSummary;
            });
            gnomadData = combinedGnomad;
        }
    }
    // If only one type of gnomad(Exome or Genome) exists, show result from this type. If both types exist, show combined result.
    return gnomadData;
}

export function generateGnomadUrl(
    chromosome: string | null,
    position: string | null,
    reference: string | null,
    variant: string | null
) {
    if (chromosome && position && reference && variant) {
        return `https://gnomad.broadinstitute.org/variant/${chromosome}-${position}-${reference}-${variant}`;
    } else {
        return 'https://gnomad.broadinstitute.org/';
    }
}
