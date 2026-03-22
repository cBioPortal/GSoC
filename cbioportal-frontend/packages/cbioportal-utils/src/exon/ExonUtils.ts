import { Exon, UntranslatedRegion } from 'genome-nexus-ts-api-client';
import { ExonDatum } from '../model/Exon';

export type ExonLocation = {
    nucleotideLocation: number;
    aminoAcidLocation: number;
};

export type ExonLength = {
    nucleotideLength?: number;
    aminoAcidLength: number;
};

export function extractExonInformation(
    exons: Exon[],
    utrs: UntranslatedRegion[],
    proteinLength: number
): ExonDatum[] {
    let totalLength = 0;
    const exonLocList: {
        exonRank: number;
        length: number;
        startLocation: number;
        endLocation: number;
    }[] = [];
    exons.forEach(exon => {
        let utrStartSitesWithinExon = false;
        for (let j = 0; j < utrs.length; j++) {
            const currentUtr = utrs[j];
            // if utr start is within exon, add only translated length of exon to exonLocList
            if (
                exon.exonStart <= currentUtr.start &&
                exon.exonEnd >= currentUtr.start
            ) {
                utrStartSitesWithinExon = true;
                const aaLength =
                    (currentUtr.start -
                        exon.exonStart +
                        (exon.exonEnd - currentUtr.end)) /
                    3;
                if (aaLength !== 0) {
                    exonLocList.push({
                        exonRank: exon.rank,
                        length: aaLength,
                        startLocation: exon.exonStart,
                        endLocation: exon.exonEnd,
                    });
                    totalLength += aaLength;
                }
                break;
            }
        }
        // if there are no utr start sites within exon
        if (!utrStartSitesWithinExon) {
            const aaLength = (exon.exonEnd - exon.exonStart + 1) / 3;
            exonLocList.push({
                exonRank: exon.rank,
                length: aaLength,
                startLocation: exon.exonStart,
                endLocation: exon.exonEnd,
            });
            totalLength += aaLength;
        }
    });
    exonLocList.sort((n1, n2) => n1.exonRank - n2.exonRank);
    // if totalLength is greater than proteinLength, remove length (1 aa or 3 nucs) associated with stop codon
    // isoforms that are especially short already have this length taken out
    if (totalLength !== proteinLength) {
        exonLocList[exonLocList.length - 1].length =
            exonLocList[exonLocList.length - 1].length - 1;
        totalLength--;
    }
    let startOfExon = 0;
    const exonInfo: ExonDatum[] = exonLocList.map(exon => {
        const exonDatum = {
            rank: exon.exonRank,
            length: exon.length,
            start: startOfExon,
            genomicLocationStart: exon.startLocation,
            genomicLocationEnd: exon.endLocation,
        };
        startOfExon += exon.length;
        return exonDatum;
    });
    return exonInfo;
}

// Generate exon location description by exon location number.
// Description should follow this format: "Nucleotide xx of amino acid xx".
// Also need to make it clear which location is inclusive for start position and last end position
export function formatExonLocation(
    exonLocation: number,
    index?: number
): ExonLocation {
    const numNucleotidesOver = Math.round(exonLocation * 3) % 3;
    // first exon starts at 1st nucleotide of amino acid 1
    if (index === 0) {
        return { nucleotideLocation: 1, aminoAcidLocation: 1 };
    } else if (index !== 0 && index !== undefined) {
        // exon start location should be next nucleotide from previous end location
        // we should use floor() to get integer part 'x' from 'x.zzzzzzz'(e.g. 4.333333), use round() will get 'x+1' sometimes
        if (numNucleotidesOver === 0) {
            return {
                nucleotideLocation: 1,
                aminoAcidLocation: Math.floor(exonLocation) + 1,
            };
        } else if (numNucleotidesOver === 1) {
            return {
                nucleotideLocation: 2,
                aminoAcidLocation: Math.floor(exonLocation) + 1,
            };
        } else {
            return {
                nucleotideLocation: 3,
                aminoAcidLocation: Math.floor(exonLocation) + 1,
            };
        }
    } else {
        // exon end location
        if (numNucleotidesOver === 0) {
            return {
                nucleotideLocation: 3,
                aminoAcidLocation: Math.floor(exonLocation),
            };
        } else if (numNucleotidesOver === 1) {
            return {
                nucleotideLocation: 1,
                aminoAcidLocation: Math.floor(exonLocation) + 1,
            };
        } else {
            return {
                nucleotideLocation: 2,
                aminoAcidLocation: Math.floor(exonLocation) + 1,
            };
        }
    }
}

// Generate exon length description by exon length
// Description should follow this format: "xx amino acids and xx nucleotides".
export function formatExonLength(exonLength: number): ExonLength {
    const numNucleotidesOver = Math.round(exonLength * 3) % 3;
    if (numNucleotidesOver === 0) {
        return { aminoAcidLength: Math.floor(exonLength) };
    } else if (numNucleotidesOver === 1) {
        return { aminoAcidLength: Math.floor(exonLength), nucleotideLength: 1 };
    } else {
        return { aminoAcidLength: Math.floor(exonLength), nucleotideLength: 2 };
    }
}
