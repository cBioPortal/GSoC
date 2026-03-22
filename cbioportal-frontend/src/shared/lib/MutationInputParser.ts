import _ from 'lodash';
import { ClinicalData, Gene, Mutation } from 'cbioportal-ts-api-client';

const LITERAL_TO_HEADER: { [attrName: string]: string } = {
    aminoAcidChange: 'amino_acid_change',
    center: 'center',
    driverFilter: 'driver_filter',
    driverFilterAnnotation: 'driver_filter_annotation',
    driverTiersFilter: 'driver_tiers_filter',
    driverTiersFilterAnnotation: 'driver_tiers_filter_annotation',
    entrezGeneId: 'entrez_gene_id',
    chr: 'chromosome',
    hugoGeneSymbol: 'hugo_symbol',
    molecularProfileId: 'molecular_profile_id',
    mutationStatus: 'mutation_status',
    mutationType: 'mutation_type',
    ncbiBuild: 'ncbi_build',
    patientId: 'patient_id',
    proteinChange: 'protein_change',
    referenceAllele: 'reference_allele',
    refseqMrnaId: 'refseq_mrna_id',
    sampleId: 'sample_id',
    studyId: 'study_id',
    uniquePatientKey: 'unique_patient_key',
    uniqueSampleKey: 'unique_sample_key',
    validationStatus: 'validation_status',
    variantAllele: 'variant_allele',
    variantType: 'variant_type',
    cancerType: 'cancer_type',
};

const NUMERICAL_TO_HEADER: { [attrName: string]: string } = {
    startPosition: 'start_position',
    endPosition: 'end_position',
    proteinPosEnd: 'protein_position_end',
    proteinPosStart: 'protein_position_start',
    tumorAltCount: 'tumor_alt_count',
    tumorRefCount: 'tumor_ref_count',
    normalAltCount: 'normal_alt_count',
    normalRefCount: 'normal_ref_count',
};

// TODO add column name aliases?
// map of <mutation input model field name, input header name> pairs
export const MODEL_TO_HEADER: { [attrName: string]: string } = {
    ...LITERAL_TO_HEADER,
    ...NUMERICAL_TO_HEADER,
};

// map of <mutation input model field name, clinical attr id> pairs
export const CLINICAL_ATTR_ID_MAP: { [attrName: string]: string } = {
    cancerType: 'CANCER_TYPE',
};

type ClinicalInput = {
    cancerType: string;
};

export type MutationInput = Mutation & ClinicalInput;

/**
 * Builds a map of <header name, index> pairs, to use header names
 * instead of index constants.
 *
 * @param header    header line (first line) of the input
 * @returns {object} map of <header name, index> pairs
 */
export function buildIndexMap(
    header: string,
    separator: string
): { [columnName: string]: number } {
    const columns = header.split(separator);
    const map: { [columnName: string]: number } = {};

    columns.forEach((columnName: string, index: number) => {
        map[columnName.trim().toLowerCase()] = index;
    });

    return map;
}

/**
 * Parses a single line of the input and returns a new partial Mutation instance.
 *
 * @param line          single line of the input data
 * @param indexMap      map of <header name, index> pairs
 * @param headerMap     map of <mutation input model field name, input header name> pairs
 *
 * @returns             a partial Mutation instance
 */
export function parseLine(
    line: string,
    indexMap: { [columnName: string]: number },
    separator: string,
    headerMap: { [attrName: string]: string } = MODEL_TO_HEADER
): Partial<MutationInput> {
    const mutation: Partial<MutationInput> = {};

    const values = line.split(separator);

    // find the corresponding column for each field, and set the value
    Object.keys(headerMap).forEach((key: keyof MutationInput | keyof Gene) => {
        const value = parseValue(key, values, indexMap);

        if (value) {
            if (key === 'hugoGeneSymbol') {
                mutation.gene = (mutation.gene || {}) as Gene;
                mutation.gene[key] = value;
            } else {
                mutation[key as keyof MutationInput] = value as any;
            }
        }
    });

    return mutation;
}

/**
 * Parses the value of a single input cell.
 *
 * @param field     name of the mutation model field
 * @param values    array of values for a single input line
 * @param indexMap  map of <header name, index> pairs
 * @param headerMap map of <mutation input model field name, input header name> pairs
 *
 * @returns         data value for the given field name.
 */
export function parseValue(
    field: string,
    values: string[],
    indexMap: { [columnName: string]: number },
    headerMap: { [attrName: string]: string } = MODEL_TO_HEADER
): string | undefined {
    // get the column name for the given field name
    const column = headerMap[field];
    const index = indexMap[column];
    let value: string | undefined;

    if (index >= 0 && values[index]) {
        value = values[index].trim();
    }

    return value;
}

/**
 * Parses the entire input data and creates an array of partial Mutation instances.
 *
 * @param input     tab delimited input string with a header line.
 * @returns         an array of partial Mutation instances.
 */
export function parseInput(input: string): Partial<MutationInput>[] {
    const mutationData: Partial<MutationInput>[] = [];

    // use tab as column separator unless there are no tabs, then use space
    const separator = input.indexOf('\t') > 0 ? '\t' : ' ';

    const lines = input.split('\n');

    if (lines.length > 0) {
        // assuming first line is a header
        // TODO allow comments?
        const indexMap = buildIndexMap(lines[0], separator);

        // rest should be data
        lines.slice(1).forEach(line => {
            // skip empty lines
            if (line.length > 0) {
                mutationData.push(parseLine(line, indexMap, separator));
            }
        });
    }

    return generateMissingIds(mutationData);
}

export function generateMissingIds(mutations: Partial<MutationInput>[]) {
    // generate unique sample keys
    // this is needed to construct tumor type map (which is used by OncoKB)
    generateUniqueSampleKeys(mutations);

    // generate patient ids
    // this is needed when we count unique mutations
    generatePatientIds(mutations);

    return mutations;
}

export function generatePatientIds(mutations: Partial<Mutation>[]) {
    let idCounter = 0;

    mutations.forEach(mutation => {
        // if provided use patient id, else auto-generate
        mutation.patientId =
            mutation.patientId || mutation.sampleId || `patient_${idCounter++}`;
    });
}

export function generateUniqueSampleKeys(mutations: Partial<Mutation>[]) {
    let idCounter = 0;

    mutations.forEach(mutation => {
        // if provided use unique sample key, else auto-generate
        mutation.uniqueSampleKey =
            mutation.uniqueSampleKey || `uniqueSampleKey_${idCounter++}`;
    });
}

export function getGeneList(data?: Partial<Mutation>[]): string[] {
    if (data === undefined) {
        return [];
    }

    const geneList = data.map(mutation => {
        if (mutation.gene && mutation.gene.hugoGeneSymbol) {
            return mutation.gene.hugoGeneSymbol;
        } else {
            return undefined;
        }
    });

    // remove duplicate & undefined values
    return _.uniq(_.compact(geneList));
}

export function getClinicalData(
    mutationInputData?: Partial<MutationInput>[],
    clinicalAttrIdMap: { [attrName: string]: string } = CLINICAL_ATTR_ID_MAP
): ClinicalData[] {
    const clinicalData: Partial<ClinicalData>[] = [];

    if (mutationInputData) {
        mutationInputData.forEach(mutationInput => {
            Object.keys(clinicalAttrIdMap).forEach(
                (key: keyof ClinicalInput) => {
                    const value = mutationInput[key];

                    if (value) {
                        clinicalData.push({
                            uniqueSampleKey: mutationInput.uniqueSampleKey,
                            uniquePatientKey: mutationInput.uniquePatientKey,
                            sampleId: mutationInput.sampleId,
                            patientId: mutationInput.patientId,
                            clinicalAttributeId: clinicalAttrIdMap[key],
                            value,
                        });
                    }
                }
            );
        });
    }

    return clinicalData as ClinicalData[];
}

export function mutationInputToMutation(
    mutationInputData?: Partial<MutationInput>[],
    clinicalAttrIdMap: { [attrName: string]: string } = CLINICAL_ATTR_ID_MAP
): Partial<Mutation>[] | undefined {
    if (!mutationInputData) {
        return undefined;
    }

    const mutations: Partial<Mutation>[] = [];

    mutationInputData.forEach(ele => {
        const mutation: Partial<Mutation> = {};
        // cloning to prevent overriding original input data
        const mutationInput = _.cloneDeep(ele);

        Object.keys(mutationInput).forEach((key: keyof MutationInput) => {
            // do NOT include ClinicalInput fields
            if (!clinicalAttrIdMap[key]) {
                mutation[key as keyof Mutation] = parseField(
                    mutationInput,
                    key
                ) as any;
            }
        });

        mutations.push(mutation);
    });

    return mutations;
}

function parseField(
    mutationInput: Partial<MutationInput>,
    key: keyof MutationInput
) {
    let value = mutationInput[key];

    if (value && NUMERICAL_TO_HEADER[key]) {
        value = parseInt(value.toString(), 10);
    }

    return value || undefined;
}
