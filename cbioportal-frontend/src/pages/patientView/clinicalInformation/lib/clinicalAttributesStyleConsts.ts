/**
 * Enums and configuration object mapping.
 */
export interface configAttribute {
    primary?: boolean;
    formatter?: (arg0: any) => string;
    values?: { [key: string]: string };
    order?: number;
}

// Colors taken from clinicalAttributes.scss
export const colors = {
    sampleColorPrimary: 'black',
    sampleColorRecurrence: 'orange',
    sampleColorMetastasis: 'red',
    sampleColorCfdna: 'blue',
    sampleColorOrganoid: 'paleVioletRed',
};

/**
 * Object mapping of keys to objects indicating
 * whether an attribute is primary or secondary,
 * the formatter to display the inputted value t,
 * and font coloring based on the key and value.
 */
export const config: { [key: string]: configAttribute } = {
    AGE: {
        primary: true,
        formatter: (t: string) => {
            return `${t} years old`;
        },
        order: 2,
    },
    BREAST_CANCER_RECEPTOR_STATUS: {
        primary: true,
        order: 6,
    },
    CANCER_TYPE: {
        primary: true,
        order: 3,
    },
    CANCER_TYPE_DETAILED: {
        primary: false,
        order: 4,
    },
    DERIVED_NORMALIZED_CASE_TYPE: {
        primary: true,
        values: {
            Primary: colors.sampleColorPrimary,
            Progressed: colors.sampleColorRecurrence,
            Recurrence: colors.sampleColorRecurrence,
            Metastasis: colors.sampleColorMetastasis,
        },
        order: 1,
    },
    DERIVED_SAMPLE_LOCATION: {
        primary: false,
        order: 2,
    },
    DFS_STATUS: {
        primary: true,
        values: {
            _: '#f00',
            DiseaseFree: 'rgb(0, 128, 0)',
            Yes: 'rgb(0, 128, 0)',
        },
        order: 9,
    },
    DFS_MONTHS: {
        primary: false,
        formatter: (t: string) => {
            return `${t} months`;
        },
        order: 10,
    },
    DRIVER_MUTATIONS: {
        primary: true,
        order: 6,
    },
    ERG_FUSION_ACGH: {
        primary: true,
        formatter: (t: string) => {
            return `ERG-fusion aCGH: ${t}`;
        },
        order: 6,
    },
    ETS_RAF_SPINK1_STATUS: {
        primary: true,
        order: 6,
    },
    GLEASON: {
        primary: true,
        formatter: (t: string) => {
            return `Gleason: ${t}`;
        },
    },
    GLEASON_SCORE: {
        primary: true,
        order: 6,
    },
    GENDER: {
        primary: true,
        order: 1,
    },
    HISTOLOGY: {
        primary: true,
        order: 6,
    },
    KNOWN_MOLECULAR_CLASSIFIER: {
        primary: true,
        order: 5,
    },
    MOUSE_STRAIN: {
        primary: true,
        order: 6,
    },
    PATIENT_DISPLAY_NAME: {
        primary: false,
        order: 0,
    },
    OS_MONTHS: {
        primary: false,
        formatter: (t: string) => {
            return `${t} months`;
        },
        order: 8,
    },
    OS_STATUS: {
        primary: true,
        values: {
            DECEASED: '#f00',
            DEAD: '#f00',
            LIVING: 'rgb(0, 128, 0)',
            ALIVE: 'rgb(0, 128, 0)',
        },
        order: 7,
    },
    SAMPLE_DISPLAY_NAME: {
        primary: false,
        order: 0,
    },
    SERUM_PSA: {
        primary: true,
        formatter: (t: string) => {
            return `Serum PSA: ${t}`;
        },
        order: 6,
    },
    SEX: {
        primary: true,
        order: 1,
    },
    TMPRSS2_ERG_FUSION_STATUS: {
        primary: true,
        formatter: (t: string) => {
            return `TMPRSS2-ERG Fusion: ${t}`;
        },
        order: 6,
    },
    TUMOR_GRADE: {
        primary: true,
        order: 6,
    },
    TUMOR_STAGE_2009: {
        primary: true,
        order: 6,
    },
};

/**
 * Functions for ordering and styling clinical attributes.
 */
/**
 * Order patient clinical attributes by the object mapping config.
 * If the key does not exist in config, then it shall be ordered last.
 */
export function getOrder(
    key: string,
    config: { [key: string]: configAttribute }
): number {
    // Keys with lower numbers appear earlier
    return key in config && existsIn('order', config[key])
        ? (config[key].order as any)
        : Number.MAX_VALUE;
}

/**
 * Compare two keys a and b by their mapped ordering in ascending order.
 * For instance, GENDER is displayed before OS_MONTHS.
 */
export function compare(
    a: string,
    b: string,
    config: { [key: string]: configAttribute }
): number {
    return getOrder(a, config) - getOrder(b, config);
}

/**
 * Builds a string to insert in an HTML element.
 * Manually and conditionally display
 * - leading comma on attribute after sample id
 * - trailing comma on last displayed attribute
 * on Patient row and Samples row. *
 */
export function stringBuilder(
    value: string,
    key: string,
    config: { [key: string]: configAttribute },
    keys: string[]
): string[] {
    // Comma rendering
    const existsKey = config !== undefined && existsIn(key, config);
    const existsPrimary = existsKey && existsIn('primary', config[key]);
    const existsFormatter = existsKey && existsIn('formatter', config[key]);
    const formatter = existsFormatter
        ? (config[key].formatter as any)
        : (t: string) => {
              return `${t}`;
          };
    const isPrimary = existsPrimary ? config[key].primary : false;
    const index = keys.indexOf(key);
    const prefix = index === 0 ? ',\xa0' : '';
    const suffix = getSuffix(
        index,
        keys.map(key => {
            return followedByPrimary(key, keys, config);
        })
    );

    var builder = [];
    isPrimary ? builder.push('') : builder.push('(');
    builder.push(formatter(value));
    isPrimary ? builder.push('') : builder.push(')');
    const middle = builder.join('');

    return [prefix, middle, suffix];
}

/**
 *  Gets a color for the given key, value, and config. 
    If there a specified color for the key and value, return it.
    If there is no such value, then get the color only specified for the key. 
    Otherwise, return a default color. 
 */
export function calculateColor(
    value: string,
    key: string,
    config: { [key: string]: configAttribute }
): string {
    // Style based on attr-id only and not attr-value
    const color = '#333333';
    const NO_VALUE = '_';
    const existsValues =
        config !== undefined &&
        existsIn(key, config) &&
        existsIn('values', config[key]);
    const values = existsValues ? (config[key].values as any) : undefined;

    return existsValues && value in values
        ? values[value]
        : existsValues && NO_VALUE in values
        ? values[NO_VALUE]
        : color;
}

/**
 * Predicate that checks whether the key exists in the config.
 * Used to exclude hidden attributes from the DOM.
 */
export function inConfig(
    key: string,
    config: { [key: string]: configAttribute }
): boolean {
    return config !== undefined && key in config;
}

/**
 * Predicate that checks whether the key is followed by a primary key.
 */
export function followedByPrimary(
    key: string,
    keys: string[],
    config: { [key: string]: configAttribute }
): boolean {
    const i = keys.indexOf(key) + 1;
    const next = keys[i];
    return (
        next !== undefined &&
        config !== undefined &&
        existsIn('primary', config[next]) &&
        (config[next].primary as any)
    );
}

/**
 * Returns the proper suffix based on:
 * - index is last in corresponding predicateMap
 * - whether the entry in predicateMap is true.
 */
export function getSuffix(index: number, predicateMap: boolean[]): string {
    return index === predicateMap.length - 1
        ? ''
        : predicateMap[index] === true
        ? ',\xa0'
        : '\xa0';
}

/**
 * Check if a value exists in a given object.
 */
export function existsIn(value: string, obj: { [key: string]: any }): boolean {
    return value in obj && obj[value] !== undefined;
}
