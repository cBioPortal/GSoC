import _ from 'lodash';
import {
    AnnotateCopyNumberAlterationQuery,
    AnnotateMutationByProteinChangeQuery,
    AnnotateStructuralVariantQuery,
    IndicatorQueryResp,
    LevelOfEvidence,
    TumorType,
} from 'oncokb-ts-api-client';
import { Mutation } from 'cbioportal-utils';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { EvidenceType, IOncoKbData, OncoKbCardDataType } from '../model/OncoKB';

export const LEVELS = {
    sensitivity: ['4', '3B', '3A', '2', '1', '0'],
    resistance: ['R3', 'R2', 'R1'],
    all: ['4', 'R3', '3B', '3A', 'R2', '2', '1', 'R1', '0'],
};

export enum AlterationTypes {
    Mutation = 0,
}

export function generatePartialEvidenceQuery(evidenceTypes?: string) {
    return {
        evidenceTypes: evidenceTypes
            ? evidenceTypes
            : 'GENE_SUMMARY,GENE_BACKGROUND,ONCOGENIC,MUTATION_EFFECT,VUS,MUTATION_SUMMARY,TUMOR_TYPE_SUMMARY,STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY,STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE,INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY,INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_RESISTANCE',
        highestLevelOnly: false,
        levels: [
            LevelOfEvidence.LEVEL_1,
            LevelOfEvidence.LEVEL_2,
            LevelOfEvidence.LEVEL_3A,
            LevelOfEvidence.LEVEL_3B,
            LevelOfEvidence.LEVEL_4,
            LevelOfEvidence.LEVEL_R1,
            LevelOfEvidence.LEVEL_R2,
        ],
        source: 'cbioportal',
    };
}

export function generateQueryVariant(
    entrezGeneId: number,
    tumorType: string | null,
    alteration?: string,
    mutationType?: string,
    proteinPosStart?: number,
    proteinPosEnd?: number,
    alterationType?: string
) {
    let query = {
        id: generateQueryVariantId(
            entrezGeneId,
            tumorType,
            alteration,
            mutationType
        ),
        hugoSymbol: '',
        tumorType: tumorType as string, // generated api typings are wrong, it can accept null
        alterationType:
            alterationType || AlterationTypes[AlterationTypes.Mutation],
        entrezGeneId: entrezGeneId,
        alteration: alteration || '',
        consequence: mutationType || 'any',
        proteinStart: proteinPosStart === undefined ? -1 : proteinPosStart,
        proteinEnd: proteinPosEnd === undefined ? -1 : proteinPosEnd,
        type: 'web',
        hgvs: '',
        svType: 'DELETION', // TODO: hack because svType is not optional
    };

    // Use proper parameters for Intragenic variant
    if (query.alteration.toLowerCase().indexOf('intragenic') !== -1) {
        query.alterationType = 'structural_variant';
        query.svType = 'DELETION';
        query.consequence = '';
    }
    return query;
}

export function generateQueryStructuralVariantId(
    site1EntrezGeneId: number,
    site2EntrezGeneId: number | undefined,
    tumorType: string | null,
    structuralVariantType: string
): string {
    let id = `${site1EntrezGeneId}_${site2EntrezGeneId}_${structuralVariantType}`;
    if (tumorType) {
        id = `${id}_${tumorType}`;
    }

    return id.trim().replace(/\s/g, '_');
}

export function generateQueryVariantId(
    entrezGeneId: number,
    tumorType: string | null,
    alteration?: string,
    mutationType?: string
): string {
    let id = tumorType ? `${entrezGeneId}_${tumorType}` : `${entrezGeneId}`;

    if (alteration) {
        id = `${id}_${alteration}`;
    }

    if (mutationType) {
        id = `${id}_${mutationType}`;
    }

    return id.trim().replace(/\s/g, '_');
}

export function defaultOncoKbIndicatorFilter(indicator: IndicatorQueryResp) {
    const oncogenic = indicator.oncogenic.toLowerCase().trim();

    return oncogenic.includes('oncogenic') || oncogenic.includes('resistance');
}

export function generateIdToIndicatorMap(
    data: IndicatorQueryResp[]
): { [queryId: string]: IndicatorQueryResp } {
    const map: { [queryId: string]: IndicatorQueryResp } = {};

    _.each(data, function(indicator) {
        map[indicator.query.id] = indicator;
    });

    return map;
}

export function generateProteinChangeQuery(
    entrezGeneId: number,
    tumorType: string | null,
    alteration?: string,
    mutationType?: string,
    proteinPosStart?: number,
    proteinPosEnd?: number,
    evidenceTypes?: EvidenceType[]
): AnnotateMutationByProteinChangeQuery {
    return {
        id: generateQueryVariantId(
            entrezGeneId,
            tumorType,
            alteration,
            mutationType
        ),
        alteration,
        consequence: mutationType,
        gene: {
            entrezGeneId,
        },
        proteinEnd: proteinPosEnd,
        proteinStart: proteinPosStart,
        tumorType,
        evidenceTypes: evidenceTypes,
    } as AnnotateMutationByProteinChangeQuery;
}

export function generateCopyNumberAlterationQuery(
    entrezGeneId: number,
    tumorType: string | null,
    alteration: string,
    evidenceTypes?: EvidenceType[]
): AnnotateCopyNumberAlterationQuery {
    return {
        id: generateQueryVariantId(entrezGeneId, tumorType, alteration),
        copyNameAlterationType: alteration!.toUpperCase(),
        gene: {
            entrezGeneId: entrezGeneId,
        },
        tumorType: tumorType,
        evidenceTypes: evidenceTypes,
    } as AnnotateCopyNumberAlterationQuery;
}

export function deriveStructuralVariantType(
    structuralVariant: StructuralVariant
): string {
    const validTypes = [
        'DELETION',
        'TRANSLOCATION',
        'DUPLICATION',
        'INSERTION',
        'INVERSION',
        'FUSION',
    ];

    // SVs will sometimes have only 1 gene (intragenic).
    // could be site1 or site 2
    const genes = [];
    structuralVariant.site1HugoSymbol &&
        genes.push(structuralVariant.site1HugoSymbol);
    structuralVariant.site2HugoSymbol &&
        genes.push(structuralVariant.site2HugoSymbol);

    // this is default
    let structuralVariantType = 'FUSION';

    // if we only have one gene, we want to use the variantClass field of
    // structural variant IF it contains a valid type (above)
    // and if not, just pass unknown
    if (genes.length < 2) {
        structuralVariantType = validTypes.includes(
            structuralVariant.variantClass
        )
            ? structuralVariant.variantClass
            : 'UNKNOWN';
    }

    return structuralVariantType;
}

export function generateAnnotateStructuralVariantQuery(
    structuralVariant: StructuralVariant,
    tumorType: string | null,
    evidenceTypes?: EvidenceType[]
): AnnotateStructuralVariantQuery {
    let structuralVariantType = deriveStructuralVariantType(structuralVariant);

    const id = generateQueryStructuralVariantId(
        structuralVariant.site1EntrezGeneId,
        structuralVariant.site2EntrezGeneId,
        tumorType,
        structuralVariantType
    );

    // SVs will sometimes have only 1 gene (intragenic).
    // could be site1 or site 2
    const genes = [];
    structuralVariant.site1EntrezGeneId &&
        genes.push(structuralVariant.site1EntrezGeneId);
    structuralVariant.site2EntrezGeneId &&
        genes.push(structuralVariant.site2EntrezGeneId);

    // this is default

    return ({
        id: id,
        geneA: {
            entrezGeneId: genes[0],
        },
        geneB: {
            entrezGeneId: genes[1] || genes[0],
        },
        structuralVariantType: structuralVariantType,
        functionalFusion: genes.length > 1, // if its only one gene, it's intagenic and thus not a functional fusion
        tumorType: tumorType,
        evidenceTypes: evidenceTypes,
    } as unknown) as AnnotateStructuralVariantQuery;
}

export enum StructuralVariantType {
    DELETION = 'DELETION',
    TRANSLOCATION = 'TRANSLOCATION',
    DUPLICATION = 'DUPLICATION',
    INSERTION = 'INSERTION',
    INVERSION = 'INVERSION',
    FUSION = 'FUSION',
    UNKNOWN = 'UNKNOWN',
}

export function calculateOncoKbAvailableDataType(
    annotations: IndicatorQueryResp[]
) {
    // Always show oncogenicity icon as long as the annotation exists
    const availableDataTypes = new Set<OncoKbCardDataType>();
    if (annotations.length > 0) {
        availableDataTypes.add(OncoKbCardDataType.BIOLOGICAL);
    }
    annotations.forEach(annotation => {
        if (!!annotation.highestSensitiveLevel) {
            availableDataTypes.add(OncoKbCardDataType.TXS);
        }
        if (!!annotation.highestResistanceLevel) {
            availableDataTypes.add(OncoKbCardDataType.TXR);
        }
        if (!!annotation.highestPrognosticImplicationLevel) {
            availableDataTypes.add(OncoKbCardDataType.PX);
        }
        if (!!annotation.highestDiagnosticImplicationLevel) {
            availableDataTypes.add(OncoKbCardDataType.DX);
        }
    });
    return Array.from(availableDataTypes);
}

// oncogenic value => oncogenic class name
const ONCOGENIC_CLASS_NAMES: { [oncogenic: string]: string } = {
    'Likely Neutral': 'neutral',
    Unknown: 'unknown',
    Inconclusive: 'inconclusive',
    Resistance: 'oncogenic',
    'Likely Oncogenic': 'oncogenic',
    Oncogenic: 'oncogenic',
};

// oncogenic value => score
// (used for sorting purposes)
const ONCOGENIC_SCORE: { [oncogenic: string]: number } = {
    Unknown: 0,
    Inconclusive: 0,
    'Likely Neutral': 0,
    Resistance: 5,
    'Likely Oncogenic': 5,
    Oncogenic: 5,
};

// sensitivity level => score
// (used for sorting purposes)
const SENSITIVITY_LEVEL_SCORE: { [level: string]: number } = {
    '4': 1,
    '3B': 2,
    '3A': 3,
    '2': 5,
    '1': 6,
};

// resistance level <-> score
// (used for sorting purposes)
const RESISTANCE_LEVEL_SCORE: { [level: string]: number } = {
    R3: 1,
    R2: 2,
    R1: 3,
};

// diagnostic level <-> score
// (used for sorting purposes)
const DIAGNOSTIC_LEVEL_SCORE: { [level: string]: number } = {
    Dx3: 1,
    Dx2: 2,
    Dx1: 3,
};

// prognostic level <-> score
// (used for sorting purposes)
const PROGNOSTIC_LEVEL_SCORE: { [level: string]: number } = {
    Px3: 1,
    Px2: 2,
    Px1: 3,
};

export function normalizeLevel(level: string | null): string | null {
    if (level) {
        const matchArray = level.match(/LEVEL_(.*)/);

        if (matchArray && matchArray.length >= 2) {
            return matchArray[1];
        } else {
            return level;
        }
    } else {
        return null;
    }
}

export function normalizeOncogenicity(oncogenicity?: string) {
    return (oncogenicity || 'unknown')
        .trim()
        .toLowerCase()
        .replace(/\s/, '-');
}

export function oncogenicXPosition(highestSensitiveLevel: string | null) {
    const map: { [id: string]: number } = {
        '1': 1,
        '2': 2,
        '3A': 4,
        '3B': 5,
        '4': 6,
    };

    let levelIndex =
        highestSensitiveLevel === null ? 0 : map[highestSensitiveLevel] || 0;
    return -(8 + levelIndex * 30);
}

export function oncogenicYPosition(
    oncogenicity: string,
    isVUS: boolean,
    resistanceLevel: string | null
) {
    const oncogenicityMap: { [id: string]: number } = {
        Oncogenic: 0,
        'Likely Oncogenic': 0,
        Resistance: 0,
        Neutral: 1,
        'Likely Neutral': 1,
        Unknown: 2,
        Inconclusive: 2,
    };
    const resistanceLevelMap: { [id: string]: number } = {
        R1: 1,
        R2: 2,
        R3: 3,
    };

    let oncogenicityIndex = oncogenicityMap[oncogenicity];
    if (oncogenicityIndex === undefined) {
        oncogenicityIndex = 4;
    }
    if (oncogenicityIndex > 1 && isVUS) {
        oncogenicityIndex = 3;
    }

    const defaultIndexForUnrecognizedResistanceLevel = 0;
    let resistanceLevelIndex =
        resistanceLevel === null
            ? defaultIndexForUnrecognizedResistanceLevel
            : resistanceLevelMap[resistanceLevel] ||
              defaultIndexForUnrecognizedResistanceLevel;
    return -(7 + oncogenicityIndex * 120 + resistanceLevelIndex * 30);
}

export function levelIconClassNames(level: string) {
    if (level) {
        return `oncokb icon level-${level}`;
    }
    return '';
}

export function oncogenicityIconClassNames(oncogenicity: string) {
    return `oncokb icon ${normalizeOncogenicity(oncogenicity)}`;
}

export function annotationIconClassNames(
    type: OncoKbCardDataType,
    highestLevel: string,
    indicator?: IndicatorQueryResp
) {
    return type === OncoKbCardDataType.BIOLOGICAL
        ? oncogenicityIconClassNames(indicator?.oncogenic || '')
        : levelIconClassNames(normalizeLevel(highestLevel) || '');
}

export function calcHighestIndicatorLevel(
    type: OncoKbCardDataType,
    indicator?: IndicatorQueryResp
) {
    let highestLevel = '';

    if (indicator) {
        switch (type) {
            case OncoKbCardDataType.TXS:
                highestLevel = indicator.highestSensitiveLevel;
                break;
            case OncoKbCardDataType.TXR:
                highestLevel = indicator.highestResistanceLevel;
                break;
            case OncoKbCardDataType.DX:
                highestLevel = indicator.highestDiagnosticImplicationLevel;
                break;
            case OncoKbCardDataType.PX:
                highestLevel = indicator.highestPrognosticImplicationLevel;
                break;
        }
    }

    return highestLevel;
}

export function calcOncogenicScore(oncogenic: string) {
    return ONCOGENIC_SCORE[oncogenic] || 0;
}

export function calcSensitivityLevelScore(level: string) {
    return SENSITIVITY_LEVEL_SCORE[normalizeLevel(level) || ''] || 0;
}

export function calcResistanceLevelScore(level: string) {
    return RESISTANCE_LEVEL_SCORE[normalizeLevel(level) || ''] || 0;
}

export function calcDiagnosticLevelScore(level: string) {
    return DIAGNOSTIC_LEVEL_SCORE[normalizeLevel(level) || ''] || 0;
}

export function calcPrognosticLevelScore(level: string) {
    return PROGNOSTIC_LEVEL_SCORE[normalizeLevel(level) || ''] || 0;
}

export function generateOncogenicCitations(oncogenicRefs: any): number[] {
    return _.isArray(oncogenicRefs)
        ? _.map(oncogenicRefs, (article: any) => {
              return Number(article.pmid);
          }).sort()
        : [];
}

export function levelComparator(a: string, b: string) {
    return LEVELS.all.indexOf(a) > LEVELS.all.indexOf(b) ? -1 : 1;
}

function getLevel(level: string) {
    if (level) {
        var _level = level.match(/LEVEL_(R?\d[AB]?)/);
        if (_level instanceof Array && _level.length >= 2) {
            return _level[1];
        } else {
            return level;
        }
    } else {
        return '';
    }
}

function treatmentsToStr(data: any[]) {
    if (_.isArray(data)) {
        var treatments: any[] = [];

        data.forEach(function(treatment: any) {
            treatments.push(drugToStr(treatment.drugs));
        });

        return treatments.sort().join(', ');
    } else {
        return '';
    }
}

function drugToStr(data: any) {
    var drugs: any[] = [];

    data.forEach(function(drug: any) {
        drugs.push(drug.drugName);
    });

    return drugs.sort().join(' + ');
}

/**
 * Return combined alterations name, separated by comma.
 * Same location variant will be truncated into AALocationAllele e.g. V600E/K
 *
 * @param {Array} alterations - List of alterations
 * @return {string} - Truncated alteration name
 */
export function mergeAlterations(alterations: string | string[]) {
    var positions: any = {};
    var regular: any[] = [];
    var regExp = new RegExp('^([A-Z])([0-9]+)([A-Z]$)');

    if (_.isString(alterations)) {
        return alterations;
    }

    _.each(alterations, function(alteration) {
        var result = regExp.exec(alteration);
        if (_.isArray(result) && result.length === 4) {
            if (!positions.hasOwnProperty(result[2])) {
                positions[result[2]] = {};
            }
            if (!positions[result[2]].hasOwnProperty(result[1])) {
                // Avoid duplication, use object instead of array
                positions[result[2]][result[1]] = {};
            }
            positions[result[2]][result[1]][result[3]] = 1;
        } else {
            regular.push(alteration);
        }
    });

    _.each(
        _.keys(positions)
            .map(function(e) {
                return Number(e);
            })
            .sort(),
        function(position) {
            _.each(_.keys(positions[position]).sort(), function(aa) {
                regular.push(
                    aa +
                        position +
                        _.keys(positions[position][aa])
                            .sort()
                            .join('/')
                );
            });
        }
    );
    return regular.join(', ');
}

/**
 * Return the positional variant of the missense mutation
 * @param alteration The missense mutation
 */
export function getPositionalVariant(alteration: string) {
    const regExp = new RegExp('^([A-Z]+)([0-9]+)([A-Z]*)$');
    const result = regExp.exec(alteration);

    // Only if the alteration is missense mutation or positional variant
    // result[0]: matched alteration
    // result[1]: reference alleles (there could be multiple reference alleles, we only return the first allele)
    // result[2]: position(protein start/end)
    // result[3]: variant alleles (empty if the alteration is positional variant already)
    if (
        _.isArray(result) &&
        result.length === 4 &&
        (!result[3] || result[1].length === result[3].length)
    ) {
        return `${result[1][0]}${result[2]}`;
    }
    return undefined;
}

export function getTumorTypeName(tumorType?: TumorType) {
    if (!tumorType) {
        return '';
    } else if (tumorType.name) {
        return tumorType.name;
    } else if (tumorType.mainType) {
        return tumorType.mainType.name;
    } else {
        return '';
    }
}

export function getTumorTypeNameWithExclusionInfo(
    tumorType?: TumorType,
    excludedTumorTypes?: TumorType[]
) {
    let name = getTumorTypeName(tumorType);
    if (!_.isEmpty(excludedTumorTypes)) {
        name = `${name} (excluding ${excludedTumorTypes!
            .map(ett => getTumorTypeName(ett))
            .join(', ')})`;
    }
    return name;
}

export function groupOncoKbIndicatorDataByMutations(
    mutationsByPosition: { [pos: number]: Mutation[] },
    oncoKbData: IOncoKbData,
    getTumorType: (mutation: Mutation) => string,
    getEntrezGeneId: (mutation: Mutation) => number,
    filter?: (indicator: IndicatorQueryResp) => boolean
): { [pos: number]: IndicatorQueryResp[] } {
    const indicatorMap: { [pos: number]: IndicatorQueryResp[] } = {};

    _.keys(mutationsByPosition).forEach(key => {
        const position = Number(key);
        const indicators: IndicatorQueryResp[] = mutationsByPosition[position]
            .map(mutation =>
                getIndicatorData(
                    mutation,
                    oncoKbData,
                    getTumorType,
                    getEntrezGeneId
                )
            )
            .filter(
                indicator =>
                    indicator !== undefined && (!filter || filter(indicator))
            ) as IndicatorQueryResp[];

        if (position > 0 && indicators.length > 0) {
            indicatorMap[position] = indicators;
        }
    });

    return indicatorMap;
}

export function getIndicatorData(
    mutation: Mutation,
    oncoKbData: IOncoKbData,
    getTumorType: (mutation: Mutation) => string,
    getEntrezGeneId: (mutation: Mutation) => number
): IndicatorQueryResp | undefined {
    if (oncoKbData.indicatorMap === null) {
        return undefined;
    }

    let id = '';

    // @ts-ignore
    const sv: StructuralVariant = mutation.structuralVariant;

    if (sv) {
        let structuralVariantType = deriveStructuralVariantType(sv);
        id = generateQueryStructuralVariantId(
            sv.site1EntrezGeneId,
            sv.site2EntrezGeneId,
            getTumorType(mutation),
            structuralVariantType
        );
    } else {
        id = generateQueryVariantId(
            getEntrezGeneId(mutation),
            getTumorType(mutation),
            mutation.proteinChange,
            mutation.mutationType
        );
    }

    return oncoKbData.indicatorMap[id];
}

export function defaultOncoKbFilter(
    mutation: Mutation,
    oncoKbData?: IOncoKbData,
    getTumorType?: (mutation: Mutation) => string,
    getEntrezGeneId?: (mutation: Mutation) => number
): boolean {
    let filter = true;

    if (oncoKbData && getTumorType && getEntrezGeneId) {
        const indicatorData = getIndicatorData(
            mutation,
            oncoKbData,
            getTumorType,
            getEntrezGeneId
        );
        filter = indicatorData
            ? defaultOncoKbIndicatorFilter(indicatorData)
            : false;
    }

    return filter;
}

export function defaultSortMethod(a: any, b: any): number {
    // force null and undefined to the bottom
    a = a === null || a === undefined ? -Infinity : a;
    b = b === null || b === undefined ? -Infinity : b;

    // force any string values to lowercase
    a = typeof a === 'string' ? a.toLowerCase() : a;
    b = typeof b === 'string' ? b.toLowerCase() : b;

    // Return either 1 or -1 to indicate a sort priority
    if (a > b) {
        return 1;
    }
    if (a < b) {
        return -1;
    }

    // returning 0 or undefined will use any subsequent column sorting methods or the row index as a tiebreaker
    return 0;
}

export function defaultStringArraySortMethod(a: string[], b: string[]): number {
    return defaultSortMethod(a.join(), b.join());
}

export function defaultArraySortMethod<U extends number | string>(
    a: (U | null)[],
    b: (U | null)[]
): number {
    let result = 0;

    const loopLength = Math.min(a.length, b.length);

    for (let i = 0; i < loopLength; i++) {
        result = defaultSortMethod(a[i], b[i]);

        if (result !== 0) {
            break;
        }
    }

    if (result === 0) {
        if (a.length < b.length) {
            // result = (asc ? -1 : 1);
            result = -1;
        } else if (a.length > b.length) {
            // result = (asc ? 1 : -1);
            result = 1;
        }
    }

    return result;
}

/**
 * Parses OncoKB abstract reference (ie. found in biological effect summaries) into an
 * object containing the abstract's title and link.
 * Example input: "(Abstract: Hunger et al. ASH 2017. http://www.bloodjournal.org/content/130/Suppl_1/98)"
 * Example output: {abstractTitle: "Hunger et al. ASH 2017.", abstractLink: "http://www.bloodjournal.org/content/130/Suppl_1/98"}
 */
export function parseOncoKBAbstractReference(abstractRef: string) {
    try {
        const parts = abstractRef.split(/abstract/i);

        if (parts.length < 2) {
            return undefined;
        }

        // Slicing from index 1 to end to rejoin the abstract title and link
        // when there's the case that they also contain the string 'Abstract'
        // Example :
        //     (Abstract: Fakih et al. Abstract# 3003, ASCO 2019. https://meetinglibrary.asco.org/record/12411/Abstract)
        const abstractParts = parts
            .slice(1)
            .join('Abstract')
            .split(/(?=http)/i);

        if (abstractParts.length < 2) {
            return undefined;
        }

        return {
            abstractTitle: abstractParts[0].replace(/^[:\s]*/g, '').trim(),
            abstractLink: abstractParts[1].replace(/[\\)]*$/g, '').trim(),
        };
    } catch (ex) {
        // Encountered a parsing error
        return undefined;
    }
}
