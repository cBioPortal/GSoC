import _ from 'lodash';

import { PostTranslationalModification as DbPtm } from 'genome-nexus-ts-api-client';
import {
    PostTranslationalModification,
    PtmSource,
    PtmType,
} from '../model/PostTranslationalModification';
// TODO import { UniprotFeature } from 'genome-nexus-ts-api-client';
import { UniprotFeature } from '../model/Uniprot';

export const PTM_COLORS: { [type: string]: string } = {
    [PtmType.Phosphorylation]: '#2DCF00',
    [PtmType.Acetylation]: '#5B5BFF',
    [PtmType.Ubiquitination]: '#B9264F',
    [PtmType.Methylation]: '#EBD61D',
    multiType: '#444444',
    default: '#BA21E0',
};

export const PTM_PRIORITY: { [type: string]: number } = {
    [PtmType.Phosphorylation]: 1,
    [PtmType.Acetylation]: 2,
    [PtmType.Ubiquitination]: 3,
    [PtmType.Methylation]: 4,
    default: 999,
};

export const PTM_SOURCE_URL: { [source: string]: string } = {
    [PtmSource.dbPTM]: 'http://dbptm.mbc.nctu.edu.tw',
    [PtmSource.Uniprot]:
        'https://www.uniprot.org/help/post-translational_modification',
};

export const KEYWORD_TO_PTM_TYPE: { [type: string]: PtmType } = {
    // Phosphorylation
    "O-(pantetheine 4'-phosphoryl)serine": PtmType.Phosphorylation,
    '4-aspartylphosphate': PtmType.Phosphorylation,
    '5-glutamyl glycerylphosphorylethanolamine': PtmType.Phosphorylation,
    "Aspartic acid 1-[(3-aminopropyl)(5'-adenosyl)phosphono]amide":
        PtmType.Phosphorylation,
    'O-(2-aminoethylphosphoryl)serine': PtmType.Phosphorylation,
    'O-(2-cholinephosphoryl)serine': PtmType.Phosphorylation,
    'O-(phosphoribosyl dephospho-coenzyme A)serine': PtmType.Phosphorylation,
    'O-(sn-1-glycerophosphoryl)serine': PtmType.Phosphorylation,
    Phosphoarginine: PtmType.Phosphorylation,
    Phosphocysteine: PtmType.Phosphorylation,
    Phosphohistidine: PtmType.Phosphorylation,
    Phosphoserine: PtmType.Phosphorylation,
    Phosphothreonine: PtmType.Phosphorylation,
    Phosphotyrosine: PtmType.Phosphorylation,
    'Pros-phosphohistidine': PtmType.Phosphorylation,
    'Tele-phosphohistidine': PtmType.Phosphorylation,
    'FMN phosphoryl serine': PtmType.Phosphorylation,
    'FMN phosphoryl threonine': PtmType.Phosphorylation,
    "O-(5'-phospho-DNA)-serine": PtmType.Phosphorylation,
    "O-(5'-phospho-DNA)-tyrosine": PtmType.Phosphorylation,
    "O-(5'-phospho-RNA)-serine": PtmType.Phosphorylation,
    "O-(5'-phospho-RNA)-tyrosine": PtmType.Phosphorylation,
    // Acetylation
    'N2-acetylarginine': PtmType.Acetylation,
    'N6-acetyllysine': PtmType.Acetylation,
    'N-acetylalanine': PtmType.Acetylation,
    'N-acetylaspartate': PtmType.Acetylation,
    'N-acetylcysteine': PtmType.Acetylation,
    'N-acetylglutamate': PtmType.Acetylation,
    'N-acetylglycine': PtmType.Acetylation,
    'N-acetylisoleucine': PtmType.Acetylation,
    'N-acetylmethionine': PtmType.Acetylation,
    'N-acetylproline': PtmType.Acetylation,
    'N-acetylserine': PtmType.Acetylation,
    'N-acetylthreonine': PtmType.Acetylation,
    'N-acetyltyrosine': PtmType.Acetylation,
    'N-acetylvaline': PtmType.Acetylation,
    // Methylation
    '2-methylglutamine': PtmType.Methylation,
    "2'-methylsulfonyltryptophan": PtmType.Methylation,
    '3-methylthioaspartic acid': PtmType.Methylation,
    '5-methylarginine': PtmType.Methylation,
    'Asymmetric dimethylarginine': PtmType.Methylation,
    'Cysteine methyl disulfide': PtmType.Methylation,
    'Cysteine methyl ester': PtmType.Methylation,
    'Dimethylated arginine': PtmType.Methylation,
    'Glutamate methyl ester (Gln)': PtmType.Methylation,
    'Glutamate methyl ester (Glu)': PtmType.Methylation,
    'Leucine methyl ester': PtmType.Methylation,
    'Lysine methyl ester': PtmType.Methylation,
    Methylhistidine: PtmType.Methylation,
    'N,N,N-trimethylalanine': PtmType.Methylation,
    'N,N,N-trimethylglycine': PtmType.Methylation,
    'N,N,N-trimethylmethionine': PtmType.Methylation,
    'N,N,N-trimethylserine': PtmType.Methylation,
    'N,N-dimethylalanine': PtmType.Methylation,
    'N,N-dimethylglycine': PtmType.Methylation,
    'N,N-dimethylleucine': PtmType.Methylation,
    'N,N-dimethylproline': PtmType.Methylation,
    'N,N-dimethylserine': PtmType.Methylation,
    'N2,N2-dimethylarginine': PtmType.Methylation,
    'N4,N4-dimethylasparagine': PtmType.Methylation,
    'N4-methylasparagine': PtmType.Methylation,
    'N5-methylarginine': PtmType.Methylation,
    'N5-methylglutamine': PtmType.Methylation,
    'N6,N6,N6-trimethyllysine': PtmType.Methylation,
    'N6,N6-dimethyllysine': PtmType.Methylation,
    'N6-methylated lysine': PtmType.Methylation,
    'N6-methyllysine': PtmType.Methylation,
    'N6-poly(methylaminopropyl)lysine': PtmType.Methylation,
    'N-methylalanine': PtmType.Methylation,
    'N-methylglycine': PtmType.Methylation,
    'N-methylisoleucine': PtmType.Methylation,
    'N-methylleucine': PtmType.Methylation,
    'N-methylmethionine': PtmType.Methylation,
    'N-methylphenylalanine': PtmType.Methylation,
    'N-methylproline': PtmType.Methylation,
    'N-methylserine': PtmType.Methylation,
    'N-methyltyrosine': PtmType.Methylation,
    'Omega-N-methylarginine': PtmType.Methylation,
    'Omega-N-methylated arginine': PtmType.Methylation,
    'O-methylthreonine': PtmType.Methylation,
    'Pros-methylhistidine': PtmType.Methylation,
    'S-methylcysteine': PtmType.Methylation,
    'S-methylmethionine': PtmType.Methylation,
    'Symmetric dimethylarginine': PtmType.Methylation,
    'Tele-methylhistidine': PtmType.Methylation,
    'Threonine methyl ester': PtmType.Methylation,
    // ADP-ribosylation
    'ADP-ribosylarginine': PtmType.AdpRibosylation,
    'ADP-ribosylasparagine': PtmType.AdpRibosylation,
    'ADP-ribosyl aspartic acid': PtmType.AdpRibosylation,
    'ADP-ribosylcysteine': PtmType.AdpRibosylation,
    'ADP-ribosyldiphthamide': PtmType.AdpRibosylation,
    'ADP-ribosyl glutamic acid': PtmType.AdpRibosylation,
    'ADP-ribosylglycine': PtmType.AdpRibosylation,
    'ADP-ribosylserine': PtmType.AdpRibosylation,
    'ADP-ribosyltyrosine': PtmType.AdpRibosylation,
    'N6-(ADP-ribosyl)lysine': PtmType.AdpRibosylation,
    'PolyADP-ribosyl aspartic acid': PtmType.AdpRibosylation,
    'PolyADP-ribosyl glutamic acid': PtmType.AdpRibosylation,
    // Amidation
    'Alanine amide': PtmType.Amidation,
    'Arginine amide': PtmType.Amidation,
    'Asparagine amide': PtmType.Amidation,
    'Aspartic acid 1-amide': PtmType.Amidation,
    'Cysteine amide': PtmType.Amidation,
    'Glutamic acid 1-amide': PtmType.Amidation,
    'Glutamine amide': PtmType.Amidation,
    'Glycine amide': PtmType.Amidation,
    'Histidine amide': PtmType.Amidation,
    'Isoleucine amide': PtmType.Amidation,
    'Leucine amide': PtmType.Amidation,
    'Lysine amide': PtmType.Amidation,
    'Methionine amide': PtmType.Amidation,
    'Phenylalanine amide': PtmType.Amidation,
    'Proline amide': PtmType.Amidation,
    'Serine amide': PtmType.Amidation,
    'Threonine amide': PtmType.Amidation,
    'Tryptophan amide': PtmType.Amidation,
    'Tyrosine amide': PtmType.Amidation,
    'Valine amide': PtmType.Amidation,
    // Hydroxylation
    'D-4-hydroxyvaline': PtmType.Hydroxylation,
    '(3R)-3-hydroxyarginine': PtmType.Hydroxylation,
    '(3R)-3-hydroxyasparagine': PtmType.Hydroxylation,
    '(3R)-3-hydroxyaspartate': PtmType.Hydroxylation,
    '(3S)-3-hydroxyhistidine': PtmType.Hydroxylation,
    '(3R,4R)-3,4-dihydroxyproline': PtmType.Hydroxylation,
    '(3R,4R)-4,5-dihydroxyisoleucine': PtmType.Hydroxylation,
    '(3R,4S)-3,4-dihydroxyproline': PtmType.Hydroxylation,
    '(3R,4S)-4-hydroxyisoleucine': PtmType.Hydroxylation,
    '(3S)-3-hydroxyasparagine': PtmType.Hydroxylation,
    '(3S)-3-hydroxyaspartate': PtmType.Hydroxylation,
    '(3S)-3-hydroxylysine': PtmType.Hydroxylation,
    '(3S,4R)-3,4-dihydroxyisoleucine': PtmType.Hydroxylation,
    '(2S)-4-hydroxyleucine': PtmType.Hydroxylation,
    '(4R)-5-hydroxyleucine': PtmType.Hydroxylation,
    '(4R)-4,5-dihydroxyleucine': PtmType.Hydroxylation,
    '(4S)-4,5-dihydroxyleucine': PtmType.Hydroxylation,
    '3,4-dihydroxyarginine': PtmType.Hydroxylation,
    "3',4'-dihydroxyphenylalanine": PtmType.Hydroxylation,
    "3',4',5'-trihydroxyphenylalanine": PtmType.Hydroxylation,
    '2-hydroxyproline': PtmType.Hydroxylation,
    '3,4-dihydroxyproline': PtmType.Hydroxylation,
    '3-hydroxyasparagine': PtmType.Hydroxylation,
    '3-hydroxyaspartate': PtmType.Hydroxylation,
    '3-hydroxyphenylalanine': PtmType.Hydroxylation,
    '3-hydroxyproline': PtmType.Hydroxylation,
    '3-hydroxytryptophan': PtmType.Hydroxylation,
    '3-hydroxyvaline': PtmType.Hydroxylation,
    "4,5,5'-trihydroxyleucine": PtmType.Hydroxylation,
    '4,5-dihydroxylysine': PtmType.Hydroxylation,
    '4-hydroxyarginine': PtmType.Hydroxylation,
    '4-hydroxyglutamate': PtmType.Hydroxylation,
    '4-hydroxylysine': PtmType.Hydroxylation,
    '4-hydroxyproline': PtmType.Hydroxylation,
    '5-hydroxylysine': PtmType.Hydroxylation,
    '(5R)-5-hydroxylysine': PtmType.Hydroxylation,
    '(5S)-5-hydroxylysine': PtmType.Hydroxylation,
    "7'-hydroxytryptophan": PtmType.Hydroxylation,
    Hydroxyarginine: PtmType.Hydroxylation,
    Hydroxyproline: PtmType.Hydroxylation,
    'N6-(3,6-diaminohexanoyl)-5-hydroxylysin': PtmType.Hydroxylation,
    'N6-(2-hydroxyisobutyryl)lysine': PtmType.Hydroxylation,
    'N6-(beta-hydroxybutyryl)lysine': PtmType.Hydroxylation,
    'N6-poly(beta-hydroxybutyryl)lysine': PtmType.Hydroxylation,
    'O3-poly(beta-hydroxybutyryl)serine': PtmType.Hydroxylation,
    'S-poly(beta-hydroxybutyryl)cysteine': PtmType.Hydroxylation,
    // Iodination
    Iodotyrosine: PtmType.Iodination,
    Diiodotyrosine: PtmType.Iodination,
    Triiodothyronine: PtmType.Iodination,
    Thyroxine: PtmType.Iodination,
    // Bromination
    "6'-bromotryptophan": PtmType.Bromination,
    Bromohistidine: PtmType.Bromination,
    // Citrullination
    Citrulline: PtmType.Citrullination,
    // Lipoylation
    'N6-lipoyllysine': PtmType.Lipoylation,
    // Nitration
    "3'-nitrotyrosine": PtmType.Nitration,
    'Nitrated tyrosine': PtmType.Nitration,
    // Oxidation
    'Cysteine sulfenic acid (-SOH)': PtmType.Oxidation,
    'Cysteine sulfinic acid (-SO2H)': PtmType.Oxidation,
    'Cysteine sulfonic acid (-SO3H)': PtmType.Oxidation,
    'Methionine sulfone': PtmType.Oxidation,
    'Methionine (R)-sulfoxide': PtmType.Oxidation,
    'Methionine (S)-sulfoxide': PtmType.Oxidation,
    'Methionine sulfoxide': PtmType.Oxidation,
    '(4R)-5-oxoleucine': PtmType.Oxidation,
    // Pyruvate
    '2-(S-cysteinyl)pyruvic acid O-phosphothioketal': PtmType.Pyruvate,
    'N-pyruvate 2-iminyl-cysteine': PtmType.Pyruvate,
    'N-pyruvate 2-iminyl-valine': PtmType.Pyruvate,
    'Pyruvic acid (Cys)': PtmType.Pyruvate,
    'Pyruvic acid (Ser)': PtmType.Pyruvate,
    'Pyruvic acid (Tyr)': PtmType.Pyruvate,
    // S-nitrosylation
    'S-nitrosocysteine': PtmType.SNitrosylation,
    // Sulfation
    Sulfoserine: PtmType.Sulfation,
    Sulfothreonine: PtmType.Sulfation,
    Sulfotyrosine: PtmType.Sulfation,
};

export function groupPtmDataByPosition(
    ptmData: PostTranslationalModification[]
) {
    return _.groupBy(ptmData, p => p.residue.start);
}

export function groupPtmDataByTypeAndPosition(
    ptmData: PostTranslationalModification[]
) {
    const groupedByType = _.groupBy(ptmData, p => p.type);

    const groupedByTypeAndPosition: {
        [type: string]: { [position: number]: PostTranslationalModification[] };
    } = {};

    _.forEach(groupedByType, (value, type) => {
        groupedByTypeAndPosition[type] = _.groupBy(value, p => p.residue.start);
    });

    return groupedByTypeAndPosition;
}

export function ptmColor(ptms: PostTranslationalModification[]) {
    let color = PTM_COLORS.default;
    const uniqueTypes = _.uniq((ptms || []).map(ptm => ptm.type));
    if (uniqueTypes.length === 1) {
        if (uniqueTypes[0]) {
            return PTM_COLORS[uniqueTypes[0]] || PTM_COLORS.default;
        } else {
            return PTM_COLORS.default;
        }
    } else if (uniqueTypes.length > 1) {
        color = PTM_COLORS.multiType;
    }

    return color;
}

export function compareByPtmTypePriority(a: string, b: string) {
    const aValue = PTM_PRIORITY[a] || PTM_PRIORITY.default;
    const bValue = PTM_PRIORITY[b] || PTM_PRIORITY.default;

    if (aValue > bValue) {
        return 1;
    } else if (bValue > aValue) {
        return -1;
    } else if (a > b) {
        return 1;
    } else if (b > a) {
        return -1;
    }

    return 0;
}

function getResiduesFromUniprotFeature(ptm: UniprotFeature) {
    return {
        start: Number(ptm.begin),
        end: Number(ptm.end),
    };
}

export function getPubmedIdsFromUniprotFeature(ptm: UniprotFeature) {
    return ptm.evidences
        ? ptm.evidences
              .filter(
                  e =>
                      e.source &&
                      e.source.name &&
                      e.source.name.toLowerCase().includes('pubmed')
              )
              .map(e => e.source!.id)
        : [];
}

export function getPtmTypeFromUniprotFeature(ptm: UniprotFeature) {
    // actual `type` field provided by the feature itself (MOD_RES, CROSS_LINK, etc.) is not what we want to display
    // we need specific PTM types (Ubiquitination, Phosphorylation, etc.)
    const keyword = ptm.description?.split(';')[0].trim();
    let ptmType: PtmType | undefined = keyword
        ? KEYWORD_TO_PTM_TYPE[keyword]
        : undefined;

    if (!ptmType) {
        if (ptm.description?.toLowerCase().includes('ubiquitin')) {
            ptmType = PtmType.Ubiquitination;
        } else if (ptm.description?.toLowerCase().includes('sumo')) {
            ptmType = PtmType.Sumoylation;
        } else {
            ptmType = PtmType.Other;
        }
    }

    return ptmType;
}

export function getPtmDescriptionFromUniprotFeature(ptm: UniprotFeature) {
    let description = ptm.description;

    // if the description is empty
    if (_.isEmpty(description)) {
        description = ptm.type;

        if (!_.isEmpty(description)) {
            // assuming type is almost always all uppercase,
            // capitalize the first letter, and set the rest to lowercase
            description = _.capitalize(description);
        }
    }

    return description;
}

export function convertUniprotFeatureToPtm(
    ptm: UniprotFeature
): PostTranslationalModification {
    return {
        source: PtmSource.Uniprot,
        type: getPtmTypeFromUniprotFeature(ptm),
        residue: getResiduesFromUniprotFeature(ptm),
        pubmedIds: getPubmedIdsFromUniprotFeature(ptm),
        description: getPtmDescriptionFromUniprotFeature(ptm),
    };
}

export function convertDbPtmToPtm(ptm: DbPtm): PostTranslationalModification {
    return {
        source: PtmSource.dbPTM,
        type: ptm.type,
        residue: {
            start: ptm.position,
            end: ptm.position,
        },
        pubmedIds: ptm.pubmedIds,
    };
}
