import _ from 'lodash';
import {
    ClinicalTrackDatum,
    ClinicalTrackSpec,
    IBaseHeatmapTrackDatum,
    IBaseHeatmapTrackSpec,
    IHeatmapTrackSpec,
} from '../../../../shared/components/oncoprint/Oncoprint';
import { makeUniqueColorGetter } from '../../../../shared/components/plots/PlotUtils';
import { MUTATION_SPECTRUM_FILLS } from '../../../../shared/cache/ClinicalDataCache';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { AlterationTypeConstants } from 'shared/constants';
import { capitalize } from 'cbioportal-frontend-commons';
import { hexToRGBA } from 'shared/lib/Colors';
import { RGBAColor } from 'oncoprintjs';
import { getDefaultClinicalAttributeColoringForStringDatatype } from './OncoprinterToolUtils';

export const ONCOPRINTER_VAL_NA = 'N/A';

export type OncoprinterOrderedValuesInputLine = {
    sampleId: string;
    orderedValues: string[];
};

type OncoprinterClinicalTrackSpec = {
    trackName: string;
    datatype: ClinicalTrackDataType;
    countsCategories?: string[];
};

type OncoprinterHeatmapTrackSpec = {
    trackName: string;
    datatype: HeatmapTrackDataType;
};

type OncoprinterClinicalTrackDatum = Pick<
    ClinicalTrackDatum,
    'attr_id' | 'uid' | 'attr_val_counts' | 'na' | 'attr_val'
> & { sample: string };

type OncoprinterHeatmapTrackDatum = Pick<
    IBaseHeatmapTrackDatum,
    'profile_data' | 'uid' | 'na'
> & { sample: string };

// Output mimics mobxpromise form but thats just because its a nice way to package status and result.
// This isn't meant to be plugged into mobxpromise machinery i.e. with `await`
type ParseInputResult<TrackSpecType> =
    | {
          parseSuccess: true;
          result: {
              headers: TrackSpecType[];
              data: OncoprinterOrderedValuesInputLine[];
          };
          error: undefined;
      }
    | { parseSuccess: false; result: undefined; error: string };

const ATTRIBUTE_REGEX = /^((?:[^\(\)])+)(?:\(([^\(\)]+)\))?$/;
const COUNTS_MAP_ATTRIBUTE_TYPE_REGEX = /^(?:[^\/]+\/)+[^\/]+$/;

export enum ClinicalTrackDataType {
    NUMBER = 'number',
    LOG_NUMBER = 'lognumber',
    STRING = 'string',
    COUNTS = 'counts',
}

export enum HeatmapTrackDataType {
    HEATMAP_01 = 'heatmap01',
    HEATMAP_ZSCORE = 'heatmapZscores',
    HEATMAP = 'heatmap',
}

const CLINICAL_TRACK_TYPES: { [type in ClinicalTrackDataType]: boolean } = {
    [ClinicalTrackDataType.NUMBER]: true,
    [ClinicalTrackDataType.LOG_NUMBER]: true,
    [ClinicalTrackDataType.STRING]: true,
    [ClinicalTrackDataType.COUNTS]: true,
};

const HEATMAP_TRACK_TYPES: { [type in HeatmapTrackDataType]: boolean } = {
    [HeatmapTrackDataType.HEATMAP_01]: true,
    [HeatmapTrackDataType.HEATMAP_ZSCORE]: true,
    [HeatmapTrackDataType.HEATMAP]: true,
};

function isClinicalTrackType(
    type: ClinicalTrackDataType | HeatmapTrackDataType
): type is ClinicalTrackDataType {
    return type in CLINICAL_TRACK_TYPES;
}
function isHeatmapTrackType(
    type: ClinicalTrackDataType | HeatmapTrackDataType
): type is HeatmapTrackDataType {
    return type in HEATMAP_TRACK_TYPES;
}

function getHeatmapMolecularAlterationType(datatype: HeatmapTrackDataType) {
    switch (datatype) {
        case HeatmapTrackDataType.HEATMAP_01:
            return AlterationTypeConstants.METHYLATION;
        case HeatmapTrackDataType.HEATMAP_ZSCORE:
            return AlterationTypeConstants.MRNA_EXPRESSION;
        case HeatmapTrackDataType.HEATMAP:
            return AlterationTypeConstants.GENERIC_ASSAY;
    }
}

export function parseClinicalDataHeader(headerLine: string[]) {
    // we dont care about the first column, it's just "sample" or something
    headerLine.shift();

    const errorPrefix = 'Clinical data input error in line 1 (header): ';
    const ret: OncoprinterClinicalTrackSpec[] = [];
    const trackNamesMap: { [usedTrackName: string]: boolean } = {};
    for (const attribute of headerLine) {
        const match = attribute.match(ATTRIBUTE_REGEX);
        if (!match) {
            throw new Error(
                `${errorPrefix}misformatted clinical track name ${attribute}`
            );
        }
        let datatype = match[2] || ClinicalTrackDataType.STRING;
        let countsCategories: string[] | undefined = undefined;

        // validate and normalize track data type and options
        switch (datatype) {
            case ClinicalTrackDataType.NUMBER:
            case ClinicalTrackDataType.LOG_NUMBER:
            case ClinicalTrackDataType.STRING:
                break;
            default:
                if (COUNTS_MAP_ATTRIBUTE_TYPE_REGEX.test(datatype)) {
                    countsCategories = datatype.split('/');
                    datatype = ClinicalTrackDataType.COUNTS;
                } else {
                    throw new Error(
                        `${errorPrefix}invalid clinical track data type ${datatype}`
                    );
                }
                break;
        }
        const trackName = match[1];
        if (trackName in trackNamesMap) {
            throw new Error(
                `${errorPrefix}duplicate clinical track name ${trackName}`
            );
        }
        ret.push({
            trackName,
            datatype: datatype as ClinicalTrackDataType,
            countsCategories,
        });
        trackNamesMap[trackName] = true;
    }

    return ret;
}

export function parseHeatmapDataHeader(headerLine: string[]) {
    // we dont care about the first column, it's just "sample" or something
    headerLine.shift();

    const errorPrefix = 'Heatmap data input error in line 1 (header): ';
    const ret: OncoprinterHeatmapTrackSpec[] = [];
    const trackNamesMap: { [usedTrackName: string]: boolean } = {};
    for (const attribute of headerLine) {
        const match = attribute.match(ATTRIBUTE_REGEX);
        if (!match) {
            throw new Error(
                `${errorPrefix}misformatted heatmap track name ${attribute}`
            );
        }
        let datatype = match[2] || HeatmapTrackDataType.HEATMAP;

        // validate and normalize track data type and options
        switch (datatype) {
            case HeatmapTrackDataType.HEATMAP_01:
            case HeatmapTrackDataType.HEATMAP_ZSCORE:
            case HeatmapTrackDataType.HEATMAP:
                break;
            default:
                throw new Error(
                    `${errorPrefix}invalid heatmap track data type ${datatype}`
                );
                break;
        }
        const trackName = match[1];
        if (trackName in trackNamesMap) {
            throw new Error(
                `${errorPrefix}duplicate heatmap track name ${trackName}`
            );
        }
        ret.push({
            trackName,
            datatype: datatype as HeatmapTrackDataType,
        });
        trackNamesMap[trackName] = true;
    }

    return ret;
}

export function parseClinicalInput(
    input: string
):
    | {
          parseSuccess: true;
          result: {
              headers: OncoprinterClinicalTrackSpec[];
              data: OncoprinterOrderedValuesInputLine[];
          };
          error: undefined;
      }
    | { parseSuccess: false; result: undefined; error: string } {
    return parseInput(input, 'clinical');
}

export function parseHeatmapInput(
    input: string
):
    | {
          parseSuccess: true;
          result: {
              headers: OncoprinterHeatmapTrackSpec[];
              data: OncoprinterOrderedValuesInputLine[];
          };
          error: undefined;
      }
    | { parseSuccess: false; result: undefined; error: string } {
    return parseInput(input, 'heatmap');
}

function parseInput(
    input: string,
    clinicalOrHeatmap: 'clinical'
): ParseInputResult<OncoprinterClinicalTrackSpec>;

function parseInput(
    input: string,
    clinicalOrHeatmap: 'heatmap'
): ParseInputResult<OncoprinterHeatmapTrackSpec>;

function parseInput(
    input: string,
    clinicalOrHeatmap: 'clinical' | 'heatmap'
):
    | ParseInputResult<OncoprinterHeatmapTrackSpec>
    | ParseInputResult<OncoprinterClinicalTrackSpec> {
    const lines = input
        .trim()
        .split('\n')
        .map(line => line.trim().split(/\s+/));

    if (lines.length === 0) {
        return {
            parseSuccess: true,
            result: { headers: [], data: [] },
            error: undefined,
        };
    }

    try {
        // Get attribute names from first line
        const firstLine = lines.shift()!;
        const attributes =
            clinicalOrHeatmap === 'clinical'
                ? parseClinicalDataHeader(firstLine)
                : parseHeatmapDataHeader(firstLine);

        const result = lines.map((line, lineIndex) => {
            //                                                  add 2 to line index: 1 because we removed header, 1 because changing from 0- to 1-indexing
            const errorPrefix = `${capitalize(
                clinicalOrHeatmap
            )} data input error on line ${lineIndex + 2}: \n${line.join(
                '\t'
            )}\n\n`;
            if (line.length === attributes.length + 1) {
                const ret: OncoprinterOrderedValuesInputLine = {
                    sampleId: line[0],
                    orderedValues: line.slice(1),
                };
                return ret;
            } else {
                throw new Error(
                    `${errorPrefix}data lines must have ${attributes.length +
                        1} columns, the same number as in the header.`
                );
            }
        });
        return {
            parseSuccess: true,
            result: {
                headers: attributes,
                data: result.filter(
                    x => !!x
                ) as OncoprinterOrderedValuesInputLine[],
            },
            error: undefined,
        } as
            | ParseInputResult<OncoprinterClinicalTrackSpec>
            | ParseInputResult<OncoprinterHeatmapTrackSpec>;
    } catch (e) {
        return {
            parseSuccess: false,
            result: undefined,
            error: e.message,
        };
    }
}
export function getClinicalOncoprintData(
    attributes: OncoprinterClinicalTrackSpec[],
    parsedLines: OncoprinterOrderedValuesInputLine[]
) {
    const clinicalTracks: {
        [trackName: string]: OncoprinterClinicalTrackDatum[];
    } = _.mapValues(
        _.keyBy(attributes, a => a.trackName),
        () => []
    );

    parsedLines.forEach((line, lineIndex) => {
        for (let i = 0; i < attributes.length; i++) {
            const rawValue = line.orderedValues[i];
            clinicalTracks[attributes[i].trackName].push(
                makeClinicalTrackDatum(rawValue, line, attributes[i], lineIndex)
            );
        }
    });
    return clinicalTracks;
}
export function getHeatmapOncoprintData(
    attributes: OncoprinterHeatmapTrackSpec[],
    parsedLines: OncoprinterOrderedValuesInputLine[]
) {
    const heatmapTracks: {
        [trackName: string]: OncoprinterHeatmapTrackDatum[];
    } = _.mapValues(
        _.keyBy(attributes, a => a.trackName),
        () => []
    );

    parsedLines.forEach((line, lineIndex) => {
        for (let i = 0; i < attributes.length; i++) {
            const rawValue = line.orderedValues[i];
            heatmapTracks[attributes[i].trackName].push(
                makeHeatmapTrackDatum(rawValue, line, attributes[i], lineIndex)
            );
        }
    });
    return heatmapTracks;
}

function makeHeatmapTrackDatum(
    rawValue: string,
    line: OncoprinterOrderedValuesInputLine,
    attribute: OncoprinterHeatmapTrackSpec,
    lineIndex: number
) {
    // add 2 to line index: 1 because we removed header, 1 because changing from 0- to 1-indexing
    const errorPrefix = `Heatmap data input error on line ${lineIndex +
        2}: \n\n`;

    let profile_data: any = null;
    if (rawValue !== ONCOPRINTER_VAL_NA) {
        profile_data = parseFloat(rawValue);
    }
    if (profile_data !== null && isNaN(profile_data)) {
        throw new Error(
            `${errorPrefix} input ${rawValue} is not valid for heatmap track ${attribute.trackName}`
        );
    }
    return {
        sample: line.sampleId,
        profile_data,
        uid: line.sampleId,
        na: profile_data === null,
    };
}

function makeClinicalTrackDatum(
    rawValue: string,
    line: OncoprinterOrderedValuesInputLine,
    attribute: OncoprinterClinicalTrackSpec,
    lineIndex: number
): OncoprinterClinicalTrackDatum {
    // add 2 to line index: 1 because we removed header, 1 because changing from 0- to 1-indexing
    const errorPrefix = `Clinical data input error on line ${lineIndex +
        2}: \n\n`;

    if (rawValue === ONCOPRINTER_VAL_NA) {
        return {
            sample: line.sampleId,
            attr_id: attribute.trackName,
            attr_val_counts: {},
            attr_val: '',
            uid: line.sampleId,
            na: true,
        };
    } else {
        let attr_val_counts, attr_val;
        switch (attribute.datatype as ClinicalTrackDataType) {
            case ClinicalTrackDataType.STRING:
                attr_val_counts = { [rawValue]: 1 };
                attr_val = rawValue;
                break;
            case ClinicalTrackDataType.NUMBER:
            case ClinicalTrackDataType.LOG_NUMBER:
                const parsed = parseFloat(rawValue);
                if (isNaN(parsed)) {
                    throw new Error(
                        `${errorPrefix} input ${rawValue} is not valid for numerical track ${attribute.trackName}`
                    );
                }
                attr_val_counts = { [parsed]: 1 };
                attr_val = parsed;
                break;
            case ClinicalTrackDataType.COUNTS:
                const parsedCounts = rawValue.split('/').map(parseFloat);
                if (
                    parsedCounts.length !== attribute.countsCategories!.length
                ) {
                    throw new Error(
                        `${errorPrefix} input ${rawValue} is not valid - must have ${
                            attribute.countsCategories!.length
                        } values to match with header, but only has ${
                            parsedCounts.length
                        }`
                    );
                }
                attr_val_counts = attribute.countsCategories!.reduce(
                    (counts, category, index) => {
                        counts[category] = parsedCounts[index];
                        return counts;
                    },
                    {} as ClinicalTrackDatum['attr_val_counts']
                );
                attr_val = attr_val_counts;
                break;
        }
        return {
            sample: line.sampleId,
            attr_id: attribute.trackName,
            attr_val_counts,
            attr_val,
            uid: line.sampleId,
            na: rawValue === ONCOPRINTER_VAL_NA,
        };
    }
}

function getNumberRange(data: OncoprinterClinicalTrackDatum[]) {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const d of data) {
        if (!isNaN(d.attr_val as number)) {
            min = Math.min(min, d.attr_val as number);
            max = Math.max(max, d.attr_val as number);
        }
    }
    return [min, max];
}

export function getClinicalTrackKey(attributeName: string) {
    return `clinicalTrack_${attributeName}`;
}

export function getHeatmapTrackKey(attributeName: string) {
    return `heatmapTrack_${attributeName}`;
}

export function getClinicalTracks(
    attributes: OncoprinterClinicalTrackSpec[],
    parsedLines: OncoprinterOrderedValuesInputLine[],
    userSelectedClinicalTracksColors: {
        [label: string]: {
            [value: string]: RGBAColor;
        };
    },
    excludedSampleIds?: string[]
) {
    let attributeToOncoprintData = getClinicalOncoprintData(
        attributes,
        parsedLines
    );
    // remove excluded sample data
    const excludedSampleIdsMap = _.keyBy(excludedSampleIds || []);
    attributeToOncoprintData = _.mapValues(attributeToOncoprintData, data => {
        return data.filter(d => !(d.sample in excludedSampleIdsMap));
    });

    const ret: ClinicalTrackSpec[] = [];

    attributes.map(attr => {
        const data = attributeToOncoprintData[attr.trackName];
        let datatype, category_to_color, numberRange, countsCategoryFills;
        switch (attr.datatype) {
            case ClinicalTrackDataType.STRING:
                datatype = 'string';
                category_to_color = Object.assign(
                    {},
                    _.mapValues(
                        getDefaultClinicalAttributeColoringForStringDatatype(
                            data
                        ),
                        hexToRGBA
                    ),
                    userSelectedClinicalTracksColors[attr.trackName]
                );
                break;
            case ClinicalTrackDataType.NUMBER:
            case ClinicalTrackDataType.LOG_NUMBER:
                datatype = 'number';
                numberRange = getNumberRange(data);
                break;
            case ClinicalTrackDataType.COUNTS:
                datatype = 'counts';
                if (
                    attr.trackName.toLowerCase() === 'mutation_spectrum' &&
                    attr.countsCategories!.length ===
                        MUTATION_SPECTRUM_FILLS.length
                ) {
                    countsCategoryFills = attr.countsCategories!.map(
                        (label, i) => {
                            if (
                                userSelectedClinicalTracksColors[
                                    attr.trackName
                                ] &&
                                userSelectedClinicalTracksColors[
                                    attr.trackName
                                ][label]
                            ) {
                                return userSelectedClinicalTracksColors[
                                    attr.trackName
                                ][label];
                            } else {
                                return MUTATION_SPECTRUM_FILLS[i];
                            }
                        }
                    );
                }
                break;
        }
        ret.push({
            key: getClinicalTrackKey(attr.trackName),
            attributeId: attr.trackName,
            label: attr.trackName,
            category_to_color,
            data,
            datatype,
            description: '',
            numberRange,
            numberLogScale:
                attr.datatype === ClinicalTrackDataType.LOG_NUMBER
                    ? true
                    : undefined,
            countsCategoryLabels: attr.countsCategories,
            countsCategoryFills,
        } as ClinicalTrackSpec);
    });
    return ret;
}
export function getHeatmapTracks(
    attributes: OncoprinterHeatmapTrackSpec[],
    parsedLines: OncoprinterOrderedValuesInputLine[],
    excludedSampleIds?: string[]
) {
    let attributeToOncoprintData = getHeatmapOncoprintData(
        attributes,
        parsedLines
    );
    // remove excluded sample data
    const excludedSampleIdsMap = _.keyBy(excludedSampleIds || []);
    attributeToOncoprintData = _.mapValues(attributeToOncoprintData, data => {
        return data.filter(d => !(d.sample in excludedSampleIdsMap));
    });

    const ret: IHeatmapTrackSpec[] = [];

    attributes.map(attr => {
        const data = attributeToOncoprintData[attr.trackName];

        ret.push({
            key: getHeatmapTrackKey(attr.trackName),
            label: attr.trackName,
            legendLabel: getHeatmapLegendLabel(attr),
            tooltipValueLabel: 'Value',
            molecularProfileId: 'input',
            molecularAlterationType: getHeatmapMolecularAlterationType(
                attr.datatype
            ) as any,
            datatype: '',
            data: data.map(d =>
                Object.assign(d, { study_id: '', patient: '' })
            ),
            trackGroupIndex: 2,
            hasColumnSpacing: false,
        });
    });
    return ret;
}

function getHeatmapLegendLabel(attr: OncoprinterHeatmapTrackSpec) {
    switch (attr.datatype) {
        case HeatmapTrackDataType.HEATMAP_01:
            return 'Heatmap (0-1)';
        case HeatmapTrackDataType.HEATMAP_ZSCORE:
            return 'Heatmap (z-scores)';
        case HeatmapTrackDataType.HEATMAP:
        default:
            return 'Heatmap';
    }
}
