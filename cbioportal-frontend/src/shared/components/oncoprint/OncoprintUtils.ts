import {
    ICategoricalRuleSetParams,
    IGeneticAlterationRuleSetParams,
    IGradientRuleSetParams,
    RuleSetParams,
    RuleSetType,
} from 'oncoprintjs';
import {
    ClinicalTrackSpec,
    GeneticTrackDatum,
    GeneticTrackSpec,
    IGeneHeatmapTrackDatum,
    IGenesetHeatmapTrackDatum,
    IGenesetHeatmapTrackSpec,
    IHeatmapTrackSpec,
    IGenericAssayHeatmapTrackDatum,
    ICategoricalTrackSpec,
} from './Oncoprint';
import {
    genetic_rule_set_different_colors_no_recurrence,
    genetic_rule_set_different_colors_recurrence,
    genetic_rule_set_same_color_for_all_no_recurrence,
    genetic_rule_set_same_color_for_all_recurrence,
    germline_rule_params,
} from './geneticrules';
import { AlterationTypeConstants } from 'shared/constants';
import { CoverageInformation } from '../../lib/GenePanelUtils';
import {
    MobxPromise,
    remoteData,
    toPromise,
} from 'cbioportal-frontend-commons';
import {
    makeCategoricalTrackData,
    makeClinicalTrackData,
    makeGeneticTrackData,
    makeHeatmapTrackData,
} from './DataUtils';
import _, { isNumber } from 'lodash';
import ResultsViewOncoprint, {
    AdditionalTrackGroupRecord,
} from './ResultsViewOncoprint';
import { action, IObservableArray, ObservableMap, runInAction } from 'mobx';
import GenesetCorrelatedGeneCache from 'shared/cache/GenesetCorrelatedGeneCache';
import {
    isMergedTrackFilter,
    UnflattenedOQLLineFilterOutput,
} from '../../lib/oql/oqlfilter';
import {
    ClinicalAttribute,
    MolecularProfile,
    Patient,
    Sample,
    Gene,
    NumericGeneMolecularData,
    Mutation,
} from 'cbioportal-ts-api-client';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';
import {
    clinicalAttributeIsPROFILEDIN,
    MUTATION_SPECTRUM_CATEGORIES,
    MUTATION_SPECTRUM_FILLS,
    SpecialAttribute,
} from '../../cache/ClinicalDataCache';
import {
    ASCN_WHITE,
    hexToRGBA,
    RESERVED_CLINICAL_VALUE_COLORS,
} from 'shared/lib/Colors';
import { ISelectOption } from './controls/OncoprintControls';
import ifNotDefined from '../../lib/ifNotDefined';
import {
    getGenericAssayTrackCacheQueries,
    isGenericAssayCategoricalProfile,
    isGenericAssayHeatmapProfile,
} from 'shared/components/oncoprint/ResultsViewOncoprintUtils';
import { ExtendedClinicalAttribute } from 'pages/resultsView/ResultsViewPageStoreUtils';
import { CaseAggregatedData } from 'shared/model/CaseAggregatedData';
import { AnnotatedExtendedAlteration } from 'shared/model/AnnotatedExtendedAlteration';
import { IQueriedCaseData } from 'shared/model/IQueriedCaseData';
import { IQueriedMergedTrackCaseData } from 'shared/model/IQueriedMergedTrackCaseData';
import { OncoprintModel } from 'oncoprintjs';
import { getVariantAlleleFrequency } from 'shared/lib/MutationUtils';
import { DataType } from 'pages/studyView/StudyViewUtils';
import GeneCache from 'shared/cache/GeneCache';
import { isSampleProfiled } from 'shared/lib/isSampleProfiled';

interface IGenesetExpansionMap {
    [genesetTrackKey: string]: IHeatmapTrackSpec[];
}

export function formatPercent(str: string | number) {
    const number = parseFloat(str.toString());
    if (isNumber(number)) {
        return number < 1 && number > 0 ? '<1%' : Math.round(number) + '%';
    } else {
        return 'n/a';
    }
}

function makeGenesetHeatmapExpandHandler(
    oncoprint: ResultsViewOncoprint,
    track_key: string,
    query: { molecularProfileId: string; genesetId: string },
    cache: GenesetCorrelatedGeneCache
) {
    cache.initIteration(track_key, query);
    return async () => {
        const new_genes = (await cache.next(track_key, 5)).map(
            ({
                entrezGeneId,
                hugoGeneSymbol,
                correlationValue,
                zScoreGeneticProfileId,
            }) => ({
                entrezGeneId,
                hugoGeneSymbol,
                correlationValue,
                molecularProfileId: zScoreGeneticProfileId,
            })
        );
        runInAction(() => {
            const list =
                oncoprint.expansionsByGenesetHeatmapTrackKey.get(track_key) ||
                [];
            oncoprint.expansionsByGenesetHeatmapTrackKey.set(
                track_key,
                list.concat(new_genes)
            );
        });
    };
}

function makeGenesetHeatmapUnexpandHandler(
    oncoprint: ResultsViewOncoprint,
    parentKey: string,
    expansionEntrezGeneId: number,
    myTrackGroup: number,
    onRemoveLast: () => void
) {
    return action('genesetHeatmapUnexpansion', () => {
        const list = oncoprint.expansionsByGenesetHeatmapTrackKey.get(
            parentKey
        );
        if (list) {
            // only remove if the expansion if it isn't needed in another track
            // group than the one this track is being removed from; keep the
            // expansion if the track is being re-rendered into a different
            // track group
            if (myTrackGroup === oncoprint.genesetHeatmapTrackGroupIndex) {
                // this is a MobX Observable Array, so it should have findIndex
                // implemented even in IE
                const indexToRemove = list.findIndex(
                    ({ entrezGeneId }) => entrezGeneId === expansionEntrezGeneId
                );
                if (indexToRemove !== -1) {
                    list.splice(indexToRemove, 1);
                    if (!list.length) {
                        onRemoveLast();
                    }
                }
            }
        } else {
            throw new Error(
                `Track '${parentKey}' has no expansions to remove.`
            );
        }
    });
}

function formatGeneticTrackSublabel(
    oqlFilter: UnflattenedOQLLineFilterOutput<object>
): string {
    if (isMergedTrackFilter(oqlFilter)) {
        return ''; // no oql sublabel for merged tracks - too cluttered
    } else {
        return oqlFilter.oql_line
            .substring(oqlFilter.gene.length)
            .replace(';', ''); // get rid of gene in beginning of OQL line, and semicolon at end
    }
}

export function formatGeneticTrackLabel(
    oqlFilter: UnflattenedOQLLineFilterOutput<object>
): string {
    return isMergedTrackFilter(oqlFilter)
        ? oqlFilter.label ||
              oqlFilter.list.map(geneLine => geneLine.gene).join(' / ')
        : oqlFilter.gene;
}

function formatGeneticTrackOql(
    oqlFilter: UnflattenedOQLLineFilterOutput<object>
): string {
    return isMergedTrackFilter(oqlFilter)
        ? `[${oqlFilter.list.map(geneLine => geneLine.oql_line).join(' ')}]`
        : oqlFilter.oql_line;
}

export function getHeatmapTrackRuleSetParams(
    trackSpec: IHeatmapTrackSpec,
    isWhiteBackgroundForGlyphsEnabled?: boolean
): RuleSetParams {
    let value_range: [number, number];
    let legend_label: string;
    let colors: [number, number, number, number][];
    let value_stop_points: number[];
    let null_legend_label = '';
    let na_legend_label = '';
    switch (trackSpec.molecularAlterationType) {
        case AlterationTypeConstants.GENERIC_ASSAY:
            return getGenericAssayTrackRuleSetParams(trackSpec);
        case AlterationTypeConstants.METHYLATION:
            value_range = [0, 1];
            legend_label = trackSpec.legendLabel || 'Methylation Heatmap';
            value_stop_points = [0, 0.35, 1];
            colors = [
                [0, 0, 255, 1],
                [255, 255, 255, 1],
                [255, 0, 0, 1],
            ];
            break;
        case AlterationTypeConstants.MUTATION_EXTENDED:
            value_range = [0, 1];
            legend_label = trackSpec.legendLabel || 'VAF Heatmap';
            null_legend_label = 'Not mutated/no VAF data';
            na_legend_label = 'Not profiled';
            value_stop_points = [0, 1];
            colors = [
                [241, 242, 181, 1],
                [19, 80, 88, 1],
            ];
            break;
        default:
            value_range = [-3, 3];
            legend_label = trackSpec.legendLabel || 'Expression Heatmap';
            value_stop_points = [-3, 0, 3];
            colors = [
                [0, 0, 255, 1],
                [0, 0, 0, 1],
                [255, 0, 0, 1],
            ];
            break;
    }

    return {
        type: RuleSetType.GRADIENT,
        legend_label,
        value_key: 'profile_data',
        value_range,
        colors,
        value_stop_points,
        null_color: isWhiteBackgroundForGlyphsEnabled
            ? [255, 255, 255, 1]
            : [224, 224, 224, 1],
        null_legend_label,
        na_legend_label,
        na_shapes: trackSpec.customNaShapes,
        legend_base_color: isWhiteBackgroundForGlyphsEnabled
            ? hexToRGBA(ASCN_WHITE)
            : undefined,
    };
}

export const legendColorDarkBlue = [0, 114, 178, 1] as [
    number,
    number,
    number,
    number
];
export const legendColorLightBlue = [204, 236, 255, 1] as [
    number,
    number,
    number,
    number
];
export const legendColorDarkRed = [213, 94, 0, 1] as [
    number,
    number,
    number,
    number
];
export const legendColorLightRed = [255, 226, 204, 1] as [
    number,
    number,
    number,
    number
];

export function getGenericAssayTrackRuleSetParams(
    trackSpec: IHeatmapTrackSpec
): RuleSetParams {
    let value_range: [number, number];
    let legend_label: string;
    let colors: [number, number, number, number][];
    let value_stop_points: number[];
    let category_to_color:
        | { [d: string]: [number, number, number, number] }
        | undefined;

    // - Legends for generic assay entities can be configured in two ways:
    //      1. Smaller values are `important` and darker blue (a.k.a. ASC sort order)
    //      2. Larger values are `important` and darker blue (a.k.a. DESC sort order)
    // - The pivot threshold denotes an arbitrary boundary between important (in red)
    //   and unimportant (in blue) values. When a pivot threshold is defined blue
    //   and red gradient to white at the pivotThreshold value.
    // - The most extreme value in the legend is should be the largest value in the
    //   current track group. It is passed in alongside other track specs (if possible).
    // - When the most extreme value does not reach the pivotThreshold (if defined),
    //   the pivotThreshold is included in the legend as the most extreme value.

    legend_label = trackSpec.legendLabel || `${trackSpec.molecularProfileName}`;
    const dataPoints = trackSpec.data;
    const pivotThreshold = trackSpec.pivotThreshold;
    const sortOrder = trackSpec.sortOrder;
    const categoryColorOptions: [number, number, number, number][] = [
        [240, 228, 66, 1],
        [0, 158, 115, 1],
        [204, 121, 167, 1],
        [0, 0, 0, 1],
    ];

    let maxValue = trackSpec.maxProfileValue!;
    let minValue = trackSpec.minProfileValue!;

    if (maxValue === undefined || minValue === undefined) {
        let dataMax = Number.NEGATIVE_INFINITY;
        let dataMin = Number.POSITIVE_INFINITY;
        for (const d of trackSpec.data) {
            if (d.profile_data !== null) {
                dataMax = Math.max(d.profile_data, dataMax);
                dataMin = Math.min(d.profile_data, dataMin);
            }
        }
        maxValue = ifNotDefined(maxValue, dataMax);
        minValue = ifNotDefined(minValue, dataMin);
    }

    if (pivotThreshold !== undefined) {
        maxValue = Math.max(maxValue, pivotThreshold);
        minValue = Math.min(minValue, pivotThreshold);
    }

    // When all observed values are negative or positive
    // assume that 0 should be used in the legend.
    const rightBoundaryValue = Math.max(0, maxValue);
    const leftBoundaryValue = Math.min(0, minValue);
    value_range = [leftBoundaryValue, rightBoundaryValue]; // smaller concentrations are more `important` (ASC)
    value_stop_points = [leftBoundaryValue, rightBoundaryValue];

    if (pivotThreshold === undefined || maxValue === pivotThreshold) {
        // all values are smaller than pivot threshold
        colors = [legendColorDarkBlue, legendColorLightBlue];
    } else if (minValue === pivotThreshold) {
        // all values are larger than pivot threshold
        colors = [legendColorLightRed, legendColorDarkRed];
    } else {
        // pivot threshold lies in the middle of al values
        colors = [
            legendColorDarkBlue,
            legendColorLightBlue,
            legendColorLightRed,
            legendColorDarkRed,
        ];
        if (pivotThreshold <= leftBoundaryValue) {
            // when data points do not bracket the pivotThreshold, add an artificial left boundary in the legend
            value_stop_points = [
                pivotThreshold - (rightBoundaryValue - pivotThreshold),
                pivotThreshold,
                pivotThreshold,
                rightBoundaryValue,
            ];
        } else if (pivotThreshold >= rightBoundaryValue) {
            // when data points do not bracket the pivotThreshold, add an artificial right boundary in the legend
            value_stop_points = [
                leftBoundaryValue,
                pivotThreshold,
                pivotThreshold,
                pivotThreshold + (pivotThreshold - leftBoundaryValue),
            ];
        } else {
            value_stop_points = [
                leftBoundaryValue,
                pivotThreshold,
                pivotThreshold,
                rightBoundaryValue,
            ];
        }
    }

    if (sortOrder === 'DESC') {
        // larger concentrations are more `important` (DESC)
        colors = _.reverse(colors);
    }

    let counter = 0;
    const categories = _(dataPoints as IGenericAssayHeatmapTrackDatum[])
        .filter((d: IGenericAssayHeatmapTrackDatum) => !!d.category)
        .map(d => d.category)
        .uniq()
        .value();
    categories.forEach((d: string) => {
        if (category_to_color === undefined) {
            category_to_color = {};
        }
        category_to_color![d] = categoryColorOptions[counter++];
        if (counter === categoryColorOptions.length) {
            counter = 0;
        }
    });

    return {
        type: RuleSetType.GRADIENT_AND_CATEGORICAL,
        legend_label,
        value_key: 'profile_data',
        value_range,
        colors,
        value_stop_points,
        null_color: [224, 224, 224, 1],
        category_key: 'category',
        category_to_color: category_to_color,
    };
}

export function getGenesetHeatmapTrackRuleSetParams() {
    return {
        type: RuleSetType.GRADIENT,
        legend_label: 'Gene Set Heatmap',
        value_key: 'profile_data',
        value_range: [-1, 1] as [number, number],
        /*
         * The PiYG colormap is based on color specifications and designs
         * developed by Cynthia Brewer (http://colorbrewer.org).
         * The palette has been included under the terms
         * of an Apache-style license.
         */
        colors: [
            [39, 100, 25, 1],
            [77, 146, 33, 1],
            [127, 188, 65, 1],
            [184, 225, 134, 1],
            [230, 245, 208, 1],
            [247, 247, 247, 1],
            [253, 224, 239, 1],
            [241, 182, 218, 1],
            [222, 119, 174, 1],
            [197, 27, 125, 1],
            [142, 1, 82, 1],
        ] as [number, number, number, number][],
        value_stop_points: [
            -1,
            -0.8,
            -0.6,
            -0.4,
            -0.2,
            0,
            0.2,
            0.4,
            0.6,
            0.8,
            1,
        ],
        null_color: [224, 224, 224, 1],
    } as IGradientRuleSetParams;
}

export function getGeneticTrackRuleSetParams(
    distinguishMutationType?: boolean,
    distinguishDrivers?: boolean,
    distinguishGermlineMutations?: boolean,
    isWhiteBackgroundForGlyphsEnabled?: boolean
): IGeneticAlterationRuleSetParams {
    let rule_set;
    if (!distinguishMutationType && !distinguishDrivers) {
        rule_set = genetic_rule_set_same_color_for_all_no_recurrence;
    } else if (!distinguishMutationType && distinguishDrivers) {
        rule_set = genetic_rule_set_same_color_for_all_recurrence;
    } else if (distinguishMutationType && !distinguishDrivers) {
        rule_set = genetic_rule_set_different_colors_no_recurrence;
    } else {
        rule_set = genetic_rule_set_different_colors_recurrence;
    }
    rule_set = _.cloneDeep(rule_set);
    if (distinguishGermlineMutations) {
        Object.assign(rule_set.rule_params.conditional, germline_rule_params);
    }
    if (isWhiteBackgroundForGlyphsEnabled) {
        rule_set.legend_base_color = hexToRGBA(ASCN_WHITE);
        if (rule_set.rule_params.always) {
            rule_set.rule_params.always.shapes = [
                {
                    type: 'rectangle',
                    fill: hexToRGBA(ASCN_WHITE),
                    z: 1,
                },
            ];
        }
    }
    return rule_set;
}

export function getClinicalTrackRuleSetParams(track: ClinicalTrackSpec) {
    let params: RuleSetParams;
    switch (track.datatype) {
        case 'number':
            params = {
                type: RuleSetType.BAR,
                value_key: 'attr_val',
                value_range: track.numberRange,
                log_scale: track.numberLogScale,
            };
            break;
        case 'counts':
            params = {
                type: RuleSetType.STACKED_BAR,
                value_key: 'attr_val',
                categories: track.countsCategoryLabels,
                fills: track.countsCategoryFills,
            };
            break;
        case 'string':
        default:
            params = {
                type: RuleSetType.CATEGORICAL,
                category_key: 'attr_val',
                category_to_color: Object.assign(
                    {},
                    _.mapValues(RESERVED_CLINICAL_VALUE_COLORS, hexToRGBA),
                    track.category_to_color
                ),
                universal_rule_categories: track.universal_rule_categories,
            };
            break;
    }
    return params;
}

export function getCategoricalTrackRuleSetParams(
    track: ICategoricalTrackSpec
): ICategoricalRuleSetParams {
    return {
        type: RuleSetType.CATEGORICAL,
        legend_label: track.molecularProfileName,
        category_key: 'attr_val',
        category_to_color: _.mapValues(
            RESERVED_CLINICAL_VALUE_COLORS,
            hexToRGBA
        ),
    };
}

/**
 * Processes molecular data for heatmap tracks based on profile type.
 * For MUTATION_EXTENDED profiles, calculates variant allele frequency (VAF) from mutations.
 * For other profiles, retrieves molecular data values directly from cache.
 */
function createHeatmapTracksData(
    query: any,
    profileType: string,
    oncoprint: ResultsViewOncoprint,
    useOqlFiltering: boolean = false
): Array<{
    uniqueSampleKey: string;
    uniquePatientKey: string;
    value: number | null;
    thresholdType?: '>' | '<';
}> {
    if (profileType === AlterationTypeConstants.MUTATION_EXTENDED) {
        const PROFILED_BUT_NOT_MUTATED = null;
        const samples = oncoprint.props.store.filteredSamples.result!;
        const coverageInfo = oncoprint.props.store.coverageInformation.result!;
        const queriedGenes = oncoprint.props.store.genes.result || [];
        const isGeneInQuery = queriedGenes.some(
            g =>
                g.hugoGeneSymbol.toUpperCase() ===
                query.hugoGeneSymbol.toUpperCase()
        );

        let mutations: Mutation[] | AnnotatedMutation[] | undefined;

        // OQL filtering if the gene is in the query
        if (
            useOqlFiltering &&
            isGeneInQuery &&
            oncoprint.props.store.oqlFilteredAlterations.isComplete
        ) {
            const oqlFiltered =
                oncoprint.props.store.oqlFilteredAlterations.result;
            if (oqlFiltered) {
                const geneSymbol = query.hugoGeneSymbol.toUpperCase();
                mutations = oqlFiltered.filter(
                    (alt: any) =>
                        alt.hugoGeneSymbol &&
                        alt.hugoGeneSymbol.toUpperCase() === geneSymbol &&
                        alt.molecularProfileAlterationType ===
                            'MUTATION_EXTENDED'
                );
            }
        } else if (isGeneInQuery) {
            // Gene is in query - use annotatedMutationCache (has driver annotations)
            const mutationPromise = oncoprint.props.store.annotatedMutationCache.get(
                {
                    entrezGeneId: query.entrezGeneId,
                }
            );
            mutations = mutationPromise.result;
            if (mutations) {
                mutations = mutations.filter(
                    m => m.molecularProfileId === query.molecularProfileId
                );
            }
        } else {
            // Gene is NOT in query - use mutationCache directly (raw mutations)
            const mutationPromise = oncoprint.props.store.mutationCache.get({
                entrezGeneId: query.entrezGeneId,
            });
            mutations = mutationPromise.result;
            if (mutations) {
                mutations = mutations.filter(
                    m => m.molecularProfileId === query.molecularProfileId
                );
            }
        }

        if (mutations && mutations.length > 0) {
            const sampleMutationMap = new Map<string, number | null>();

            mutations.forEach(m => {
                const vafReport = getVariantAlleleFrequency(m);
                if (vafReport && _.isFinite(vafReport.vaf)) {
                    const existingVaf = sampleMutationMap.get(
                        m.uniqueSampleKey
                    );
                    if (
                        existingVaf === undefined ||
                        vafReport.vaf > existingVaf!
                    ) {
                        sampleMutationMap.set(m.uniqueSampleKey, vafReport.vaf);
                    }
                } else {
                    if (!sampleMutationMap.has(m.uniqueSampleKey)) {
                        sampleMutationMap.set(
                            m.uniqueSampleKey,
                            PROFILED_BUT_NOT_MUTATED
                        );
                    }
                }
            });

            // Filter to only include profiled samples
            return samples
                .filter(sample => {
                    if (!isGeneInQuery) {
                        return true;
                    }
                    return isSampleProfiled(
                        sample.uniqueSampleKey,
                        query.molecularProfileId,
                        query.hugoGeneSymbol,
                        coverageInfo
                    );
                })
                .map(sample => {
                    const vafValue = sampleMutationMap.get(
                        sample.uniqueSampleKey
                    );
                    return {
                        uniqueSampleKey: sample.uniqueSampleKey,
                        uniquePatientKey: sample.uniquePatientKey,
                        value:
                            vafValue !== undefined
                                ? vafValue
                                : PROFILED_BUT_NOT_MUTATED,
                    };
                });
        } else {
            // No mutations data available - return null values for profiled samples only
            return samples
                .filter(sample => {
                    if (!isGeneInQuery) {
                        return true;
                    }
                    return isSampleProfiled(
                        sample.uniqueSampleKey,
                        query.molecularProfileId,
                        query.hugoGeneSymbol,
                        coverageInfo
                    );
                })
                .map(sample => ({
                    uniqueSampleKey: sample.uniqueSampleKey,
                    uniquePatientKey: sample.uniquePatientKey,
                    value: PROFILED_BUT_NOT_MUTATED,
                }));
        }
    } else {
        const molecularDataResult = oncoprint.props.store.geneMolecularDataCache.result!.get(
            query
        );
        if (molecularDataResult && molecularDataResult.data) {
            return molecularDataResult.data.map(
                (d: NumericGeneMolecularData) => ({
                    value: d.value,
                    uniqueSampleKey: d.uniqueSampleKey,
                    uniquePatientKey: d.uniquePatientKey,
                })
            );
        }
    }
    return [];
}

/**
 * Generates queries for gene-molecular profile combinations from additional tracks.
 * Maps gene symbols to entrez IDs and creates query objects for data retrieval.
 * Excludes GENERIC_ASSAY molecular alteration types.
 */
function getGeneProfileQueries(
    molecularProfileIdToAdditionalTracks: {
        [molecularProfileId: string]: AdditionalTrackGroupRecord;
    },
    geneCache: GeneCache
) {
    const geneProfiles = _(molecularProfileIdToAdditionalTracks)
        .values()
        .filter(
            d =>
                d.molecularAlterationType !==
                AlterationTypeConstants.GENERIC_ASSAY
        )
        .value();

    return _(geneProfiles)
        .map(entry =>
            _.keys(entry.entities).map(g => ({
                molecularProfileId: entry.molecularProfileId,
                entrezGeneId: geneCache.get({ hugoGeneSymbol: g })?.data
                    ?.entrezGeneId,
                hugoGeneSymbol: g.toUpperCase(),
            }))
        )
        .flatten()
        .filter(query => query.entrezGeneId)
        .value();
}

// Filters gene profile queries to return only those with MUTATION_EXTENDED alteration type.
function getMutationHeatMapQueries(
    molecularProfileIdToAdditionalTracks: {
        [molecularProfileId: string]: AdditionalTrackGroupRecord;
    },
    molecularProfileIdToMolecularProfile: {
        [molecularProfileId: string]: MolecularProfile;
    },
    geneCache: GeneCache
) {
    const cacheQueries = getGeneProfileQueries(
        molecularProfileIdToAdditionalTracks,
        geneCache
    );

    return cacheQueries.filter(query => {
        const profileType =
            molecularProfileIdToMolecularProfile[query.molecularProfileId]
                ?.molecularAlterationType;
        return profileType === AlterationTypeConstants.MUTATION_EXTENDED;
    });
}

export function percentAltered(altered: number, sequenced: number) {
    if (sequenced === 0) {
        return 'N/P';
    }

    const p = altered / sequenced;
    const percent = 100 * p;
    let fixed: string;
    if (p < 0.03) {
        // if less than 3%, use one decimal digit
        fixed = percent.toFixed(1);
        // if last digit is a 0, use no decimal digits
        if (fixed[fixed.length - 1] === '0') {
            fixed = percent.toFixed();
        }
    } else {
        fixed = percent.toFixed();
    }
    return fixed + '%';
}

function getAlterationInfo(
    sampleMode: boolean,
    oql: { gene: string } | string[],
    sequencedSampleKeysByGene: { [hugoGeneSymbol: string]: string[] },
    sequencedPatientKeysByGene: { [hugoGeneSymbol: string]: string[] },
    alteredKeys: Set<string>
) {
    const geneSymbolArray = oql instanceof Array ? oql : [oql.gene];

    const report = {
        sequenced: 0,
        alteredAndSequenced: 0,
        altered: alteredKeys.size,
        percent: '',
    };

    if (sampleMode) {
        const sequenced = _.uniq(
            _.flatMap(
                geneSymbolArray,
                symbol => sequencedSampleKeysByGene[symbol]
            )
        );
        report.sequenced = sequenced.length;
        report.alteredAndSequenced = _.intersection(
            sequenced,
            Array.from(alteredKeys)
        ).length;
    } else {
        const sequenced = _.uniq(
            _.flatMap(
                geneSymbolArray,
                symbol => sequencedPatientKeysByGene[symbol]
            )
        );
        report.sequenced = sequenced.length;
        report.alteredAndSequenced = _.intersection(
            sequenced,
            Array.from(alteredKeys)
        ).length;
    }

    report.percent = percentAltered(
        report.alteredAndSequenced,
        report.sequenced
    );

    return report;
}

export function alterationInfoForOncoprintTrackData(
    sampleMode: boolean,
    data: {
        trackData: GeneticTrackDatum[];
        oql: { gene: string } | string[];
    },
    sequencedSampleKeysByGene: { [hugoGeneSymbol: string]: string[] },
    sequencedPatientKeysByGene: { [hugoGeneSymbol: string]: string[] }
) {
    const alteredKeys = data.trackData!.reduce((acc, next) => {
        if (isAltered(next)) {
            acc.add(next.uid);
        }
        return acc;
    }, new Set<string>());

    const info = getAlterationInfo(
        sampleMode,
        data.oql,
        sequencedSampleKeysByGene,
        sequencedPatientKeysByGene,
        alteredKeys
    );

    return {
        sequenced: info.sequenced,
        alteredAndSequenced: info.alteredAndSequenced,
        altered: info.altered,
        percent: info.percent,
    };
}

export function alterationInfoForCaseAggregatedDataByOQLLine(
    sampleMode: boolean,
    data: {
        cases: CaseAggregatedData<AnnotatedExtendedAlteration>; // one of `cases` or `trackData` must be present
        oql: { gene: string } | string[];
    },
    sequencedSampleKeysByGene: { [hugoGeneSymbol: string]: string[] },
    sequencedPatientKeysByGene: { [hugoGeneSymbol: string]: string[] }
) {
    // obtain a list of entity ids (samples or patients)
    const alteredEntities = sampleMode
        ? _(data.cases.samples)
              .entries()
              .filter(e => !!e[1].length)
              .map(e => e[0])
              .value()
        : _(data.cases.patients)
              .entries()
              .filter(e => !!e[1].length)
              .map(e => e[0])
              .value();

    const info = getAlterationInfo(
        sampleMode,
        data.oql,
        sequencedSampleKeysByGene,
        sequencedPatientKeysByGene,
        new Set(alteredEntities)
    );

    return {
        sequenced: info.sequenced,
        alteredAndSequenced: info.alteredAndSequenced,
        altered: info.altered,
        percent: info.percent,
    };
}

interface IGeneticTrackAppState {
    sampleMode: boolean;
    oncoprint: ResultsViewOncoprint;
    samples: Pick<Sample, 'sampleId' | 'studyId' | 'uniqueSampleKey'>[];
    patients: Pick<Patient, 'patientId' | 'studyId' | 'uniquePatientKey'>[];
    coverageInformation: CoverageInformation;
    sequencedSampleKeysByGene: any;
    sequencedPatientKeysByGene: any;
    selectedMolecularProfiles: MolecularProfile[];
    expansionIndexMap: ObservableMap<string, number[]>;
}

function isAltered(d: GeneticTrackDatum) {
    return d.data.length > 0;
}

export function getAlteredUids(tracks: GeneticTrackSpec[]) {
    const isAlteredMap: { [uid: string]: boolean } = {};
    for (const track of tracks) {
        for (const d of track.data) {
            if (isAltered(d)) {
                isAlteredMap[d.uid] = true;
            }
        }
    }
    return Object.keys(isAlteredMap);
}

export function getAlterationData(
    samples: Pick<Sample, 'sampleId' | 'studyId' | 'uniqueSampleKey'>[],
    patients: Pick<Patient, 'patientId' | 'studyId' | 'uniquePatientKey'>[],
    coverageInformation: CoverageInformation,
    sequencedSampleKeysByGene: any,
    sequencedPatientKeysByGene: any,
    selectedMolecularProfiles: MolecularProfile[],
    caseData:
        | IQueriedMergedTrackCaseData
        | (IQueriedCaseData<any> & { mergedTrackOqlList?: never }),
    isQueriedGeneSampling: boolean,
    queryGenes: Gene[]
) {
    const sampleMode = false;
    const oql = caseData.oql;
    const geneSymbolArray = isMergedTrackFilter(oql)
        ? oql.list.map(({ gene }) => gene)
        : [oql.gene];
    const dataByCase = caseData.cases;
    const data = makeGeneticTrackData(
        dataByCase.patients,
        geneSymbolArray,
        patients as Patient[],
        coverageInformation,
        selectedMolecularProfiles
    );

    const alterationInfo = alterationInfoForOncoprintTrackData(
        sampleMode,
        { trackData: data, oql: geneSymbolArray },
        sequencedSampleKeysByGene,
        sequencedPatientKeysByGene
    );

    if (
        isQueriedGeneSampling ||
        !queryGenes.map(gene => gene.hugoGeneSymbol).includes((oql as any).gene)
    ) {
        return {
            gene: (oql as any).gene,
            altered: alterationInfo.altered,
            sequenced: alterationInfo.sequenced,
            percentAltered: alterationInfo.percent,
        };
    } else {
        return undefined;
    }
}

export function getUnalteredUids(tracks: GeneticTrackSpec[]) {
    const allUids: string[] = _.chain(tracks)
        .map(spec => spec.data.map(d => d.uid))
        .flatten()
        .uniq()
        .value();
    return _.difference(allUids, getAlteredUids(tracks));
}

export function makeGeneticTrackWith({
    sampleMode,
    oncoprint,
    samples,
    patients,
    coverageInformation,
    sequencedSampleKeysByGene,
    sequencedPatientKeysByGene,
    selectedMolecularProfiles,
    expansionIndexMap,
}: IGeneticTrackAppState) {
    return function makeTrack(
        caseData:
            | IQueriedMergedTrackCaseData
            | (IQueriedCaseData<any> & { mergedTrackOqlList?: never }), // the & is to get around annoying TS error -- its never passed in, as the `never` type indicates
        index: number,
        parentKey?: string
    ): GeneticTrackSpec {
        const oql = caseData.oql;
        const geneSymbolArray = isMergedTrackFilter(oql)
            ? oql.list.map(({ gene }) => gene)
            : [oql.gene];
        const dataByCase = caseData.cases;

        const data = sampleMode
            ? makeGeneticTrackData(
                  dataByCase.samples,
                  geneSymbolArray,
                  samples as Sample[],
                  coverageInformation,
                  selectedMolecularProfiles
              )
            : makeGeneticTrackData(
                  dataByCase.patients,
                  geneSymbolArray,
                  patients as Patient[],
                  coverageInformation,
                  selectedMolecularProfiles
              );

        const alterationInfo = alterationInfoForOncoprintTrackData(
            sampleMode,
            { trackData: data, oql: geneSymbolArray },
            sequencedSampleKeysByGene,
            sequencedPatientKeysByGene
        );

        const trackKey =
            parentKey === undefined
                ? `GENETICTRACK_${index}`
                : `${parentKey}_EXPANSION_${index}`;
        const expansionCallback = isMergedTrackFilter(oql)
            ? () => {
                  expansionIndexMap.set(trackKey, _.range(oql.list.length));
              }
            : undefined;
        const removeCallback =
            parentKey !== undefined
                ? () => {
                      (expansionIndexMap.get(parentKey) as IObservableArray<
                          number
                      >).remove(index);
                  }
                : undefined;
        let expansions: GeneticTrackSpec[] = [];

        if (caseData.mergedTrackOqlList) {
            const subTrackData = caseData.mergedTrackOqlList;
            expansions = (
                expansionIndexMap.get(trackKey) || []
            ).map(expansionIndex =>
                makeTrack(
                    subTrackData[expansionIndex],
                    expansionIndex,
                    trackKey
                )
            );
        }

        let info = alterationInfo.percent;
        let infoTooltip = undefined;
        if (alterationInfo.sequenced !== 0) {
            // show tooltip explaining percent calculation, as long as its not N/P
            infoTooltip = `<strong>${alterationInfo.percent} altered</strong><br />(altered / profiled = ${alterationInfo.altered} / ${alterationInfo.sequenced})`;
        }
        if (
            alterationInfo.sequenced > 0 &&
            alterationInfo.sequenced < (sampleMode ? samples : patients).length
        ) {
            // add asterisk to percentage if not all samples/patients are profiled for this track
            // dont add asterisk if none are profiled
            info = `${info}*`;
            infoTooltip = `<strong>${info}</strong><br/>* = not all samples are profiled`;
        }

        return {
            key: trackKey,
            label:
                (parentKey !== undefined ? '  ' : '') +
                formatGeneticTrackLabel(oql),
            sublabel: formatGeneticTrackSublabel(oql),
            labelColor: parentKey !== undefined ? 'grey' : undefined,
            oql: formatGeneticTrackOql(oql),
            info,
            infoTooltip,
            data,
            expansionCallback,
            removeCallback,
            expansionTrackList: expansions.length ? expansions : undefined,
            customOptions: [
                { separator: true },
                {
                    label: 'Sort by genes',
                    onClick: oncoprint.clearSortDirectionsAndSortByData,
                },
                {
                    gapLabelsFn: (model: OncoprintModel) => {
                        model.data_groups.update(model);
                        const groupsByTrackMap = model.data_groups.get();

                        const label = formatGeneticTrackLabel(oql);

                        const sampleMode = oncoprint.columnMode === 'sample';

                        // why are there more than one gene? what happens then?
                        const gene = label; //geneSymbolArray[0];

                        //problem here is that in case of merged tracks, the name of the track is not always a gene
                        const info = groupsByTrackMap[gene][0].map(
                            (groupData: any) => {
                                let sequencedPatientKeysForGroup: Record<
                                    string,
                                    any[]
                                > = {};
                                let sequencedSampleKeysForGroup: Record<
                                    string,
                                    any[]
                                > = {};
                                if (sampleMode) {
                                    sequencedSampleKeysForGroup = _(
                                        geneSymbolArray
                                    )
                                        .keyBy(gene => gene)
                                        .mapValues(gene => {
                                            // you want to return only the patient ids which are listed as
                                            // sequenced for the gene(s) in this track (plural in case of merged tracks)
                                            return _.intersection(
                                                _.flatMap(
                                                    geneSymbolArray,
                                                    gene =>
                                                        sequencedSampleKeysByGene[
                                                            gene
                                                        ]
                                                ),
                                                groupData.map((d: any) => d.uid)
                                            );
                                        })
                                        .value();
                                } else {
                                    sequencedPatientKeysForGroup = _(
                                        geneSymbolArray
                                    )
                                        .keyBy(gene => gene)
                                        .mapValues(gene => {
                                            // you want to return only the patient ids which are listed as
                                            // sequenced for the gene(s) in this track (plural in case of merged tracks)
                                            return _.intersection(
                                                _.flatMap(
                                                    geneSymbolArray,
                                                    gene =>
                                                        sequencedPatientKeysByGene[
                                                            gene
                                                        ]
                                                ),
                                                groupData.map((d: any) => d.uid)
                                            );
                                        })
                                        .value();
                                }

                                const info = alterationInfoForOncoprintTrackData(
                                    sampleMode,
                                    {
                                        trackData: groupData,
                                        oql: geneSymbolArray,
                                    },
                                    sequencedSampleKeysForGroup,
                                    sequencedPatientKeysForGroup
                                );

                                return {
                                    labelFormatter: function() {
                                        return formatPercent(info.percent);
                                    },
                                    tooltipFormatter: function() {
                                        return `${info.percent} (altered / profiled = ${info.altered} / ${info.sequenced})`;
                                    },
                                };
                            }
                        );

                        return info;
                    },
                },
            ],
        };
    };
}

export function makeGeneticTracksMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean
) {
    return remoteData<GeneticTrackSpec[]>({
        await: () => [
            oncoprint.props.store.filteredSamples,
            oncoprint.props.store.filteredPatients,
            oncoprint.props.store
                .oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
            oncoprint.props.store.coverageInformation,
            oncoprint.props.store.filteredSequencedSampleKeysByGene,
            oncoprint.props.store.filteredSequencedPatientKeysByGene,
            oncoprint.props.store.selectedMolecularProfiles,
        ],
        invoke: async () => {
            const trackFunction = makeGeneticTrackWith({
                sampleMode,
                oncoprint,
                samples: oncoprint.props.store.filteredSamples.result!,
                patients: oncoprint.props.store.filteredPatients.result!,
                coverageInformation: oncoprint.props.store.coverageInformation
                    .result!,
                sequencedSampleKeysByGene: oncoprint.props.store
                    .filteredSequencedSampleKeysByGene.result!,
                sequencedPatientKeysByGene: oncoprint.props.store
                    .filteredSequencedPatientKeysByGene.result!,
                selectedMolecularProfiles: oncoprint.props.store
                    .selectedMolecularProfiles.result!,
                expansionIndexMap: oncoprint.expansionsByGeneticTrackKey,
            });
            return oncoprint.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.map(
                (alterationData, trackIndex) =>
                    trackFunction(alterationData, trackIndex, undefined)
            );
        },
        default: [],
    });
}

export function makeClinicalTracksMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean
) {
    return remoteData<ClinicalTrackSpec[]>({
        await: () => {
            let ret: MobxPromise<any>[] = [
                oncoprint.props.store.filteredSamples,
                oncoprint.props.store.filteredPatients,
                oncoprint.props.store.clinicalAttributeIdToClinicalAttribute,
                oncoprint.alteredKeys,
            ];
            if (
                oncoprint.props.store.clinicalAttributeIdToClinicalAttribute
                    .isComplete
            ) {
                const attributes = Array.from(
                    _.keys(oncoprint.selectedClinicalTrackConfig)
                )
                    .map(attrId => {
                        return oncoprint.props.store
                            .clinicalAttributeIdToClinicalAttribute.result![
                            attrId
                        ];
                    })
                    .filter(x => !!x);
                ret = ret.concat(
                    oncoprint.props.store.clinicalDataCache.getAll(attributes)
                );
            }
            return ret;
        },
        invoke: async () => {
            if (!_.keys(oncoprint.selectedClinicalTrackConfig).length) {
                return [];
            }
            const attributes: ExtendedClinicalAttribute[] = Array.from(
                _.keys(oncoprint.selectedClinicalTrackConfig)
            )
                .map(
                    attrId =>
                        oncoprint.props.store
                            .clinicalAttributeIdToClinicalAttribute.result![
                            attrId
                        ]
                )
                // filter out nonexistent attributes:
                .filter(x => !!x);
            return attributes.map((attribute: ClinicalAttribute) => {
                const dataAndColors = oncoprint.props.store.clinicalDataCache.get(
                    attribute
                ).result!;
                let altered_uids = undefined;
                if (oncoprint.onlyShowClinicalLegendForAlteredCases) {
                    altered_uids = oncoprint.alteredKeys.result!;
                }
                const ret: Partial<ClinicalTrackSpec> = {
                    key: oncoprint.clinicalAttributeIdToTrackKey(
                        attribute.clinicalAttributeId
                    ),
                    attributeId: attribute.clinicalAttributeId,
                    label: attribute.displayName,
                    description: attribute.description,
                    data: makeClinicalTrackData(
                        attribute,
                        sampleMode
                            ? oncoprint.props.store.filteredSamples.result!
                            : oncoprint.props.store.filteredPatients.result!,
                        dataAndColors.data
                    ),
                    altered_uids,
                };
                if (clinicalAttributeIsPROFILEDIN(attribute)) {
                    // For "Profiled-In" clinical attribute: show "No" on N/A items
                    ret.na_tooltip_value = 'No';
                    ret.na_legend_label = 'No';

                    // For "Profiled-In", it's just 'Yes' or 'N/A' so as an optimization
                    //  make 'Yes' universal
                    (ret as any).universal_rule_categories = {
                        Yes: true,
                    };
                }
                const userSelectedClinicalTracksColors =
                    oncoprint.props.store
                        .userSelectedStudiesToClinicalTracksColors['global'][
                        attribute.displayName
                    ];
                if (attribute.datatype === 'NUMBER') {
                    ret.datatype = 'number';
                    if (
                        attribute.clinicalAttributeId ===
                        'FRACTION_GENOME_ALTERED'
                    ) {
                        (ret as any).numberRange = [0, 1];
                    } else if (
                        attribute.clinicalAttributeId === 'MUTATION_COUNT'
                    ) {
                        (ret as any).numberLogScale = true;
                    } else if (
                        attribute.clinicalAttributeId ===
                        SpecialAttribute.NumSamplesPerPatient
                    ) {
                        (ret as any).numberRange = [0, undefined];
                        ret.custom_options = sampleMode
                            ? [
                                  {
                                      label: 'Show one column per patient.',
                                      onClick: () =>
                                          oncoprint.controlsHandlers
                                              .onSelectColumnType!('patient'),
                                  },
                              ]
                            : [
                                  {
                                      label: 'Show one column per sample.',
                                      onClick: () =>
                                          oncoprint.controlsHandlers
                                              .onSelectColumnType!('sample'),
                                  },
                              ];
                    }
                } else if (attribute.datatype === 'STRING') {
                    ret.datatype = 'string';
                    (ret as any).category_to_color = Object.assign(
                        {},
                        _.mapValues(dataAndColors.categoryToColor, hexToRGBA),
                        userSelectedClinicalTracksColors
                    );
                } else if (
                    attribute.clinicalAttributeId ===
                    SpecialAttribute.MutationSpectrum
                ) {
                    ret.datatype = 'counts';
                    (ret as any).countsCategoryLabels = MUTATION_SPECTRUM_CATEGORIES;
                    (ret as any).countsCategoryFills = MUTATION_SPECTRUM_FILLS.slice();
                    _.forEach((ret as any).countsCategoryLabels, (label, i) => {
                        if (
                            userSelectedClinicalTracksColors &&
                            userSelectedClinicalTracksColors[label]
                        ) {
                            (ret as any).countsCategoryFills[i] =
                                userSelectedClinicalTracksColors[label];
                        }
                    });
                }

                const trackConfig =
                    oncoprint.selectedClinicalTrackConfig[
                        attribute.clinicalAttributeId
                    ];
                ret.sortOrder = trackConfig.sortOrder || undefined;
                ret.gapOn = trackConfig.gapOn || undefined;

                return ret as ClinicalTrackSpec;
            });
        },
        default: [],
    });
}

export function makeHeatmapTracksMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean
) {
    return remoteData<IHeatmapTrackSpec[]>({
        await: () => {
            const molecularProfileIdToMolecularProfile = oncoprint.props.store
                .molecularProfileIdToMolecularProfile.result!;
            const molecularProfileIdToAdditionalTracks =
                oncoprint.molecularProfileIdToAdditionalTracks;

            const mutationQueries = getMutationHeatMapQueries(
                molecularProfileIdToAdditionalTracks,
                molecularProfileIdToMolecularProfile,
                oncoprint.props.store.geneCache
            );

            return [
                oncoprint.props.store.filteredSamples,
                oncoprint.props.store.filteredPatients,
                oncoprint.props.store.molecularProfileIdToMolecularProfile,
                oncoprint.props.store.geneMolecularDataCache,
                oncoprint.props.store.coverageInformation,
                oncoprint.props.store.oqlFilteredAlterations,
                ...mutationQueries.map(query =>
                    oncoprint.props.store.annotatedMutationCache.get({
                        entrezGeneId: query.entrezGeneId!,
                    })
                ),
            ];
        },
        invoke: async () => {
            const molecularProfileIdToMolecularProfile = oncoprint.props.store
                .molecularProfileIdToMolecularProfile.result!;
            const molecularProfileIdToAdditionalTracks =
                oncoprint.molecularProfileIdToAdditionalTracks;

            const neededGenes = _.flatten(
                _.values(molecularProfileIdToAdditionalTracks)
                    .filter(
                        d =>
                            d.molecularAlterationType !==
                            AlterationTypeConstants.GENERIC_ASSAY
                    )
                    .map(v => _.keys(v.entities))
            );

            await oncoprint.props.store.geneCache.getPromise(
                neededGenes.map(g => ({ hugoGeneSymbol: g })),
                true
            );

            const cacheQueries = getGeneProfileQueries(
                molecularProfileIdToAdditionalTracks,
                oncoprint.props.store.geneCache
            ).map(query => ({
                ...query,
                entrezGeneId: oncoprint.props.store.geneCache.get({
                    hugoGeneSymbol: query.hugoGeneSymbol.toLowerCase(),
                })!.data!.entrezGeneId,
            }));

            const nonMutationQueries = cacheQueries.filter(query => {
                const profileType =
                    molecularProfileIdToMolecularProfile[
                        query.molecularProfileId
                    ].molecularAlterationType;
                return (
                    profileType !== AlterationTypeConstants.MUTATION_EXTENDED
                );
            });

            if (nonMutationQueries.length > 0) {
                await oncoprint.props.store.geneMolecularDataCache.result!.getPromise(
                    nonMutationQueries,
                    true
                );
            }

            const mutationQueries = cacheQueries.filter(query => {
                const profileType =
                    molecularProfileIdToMolecularProfile[
                        query.molecularProfileId
                    ].molecularAlterationType;
                return (
                    profileType === AlterationTypeConstants.MUTATION_EXTENDED
                );
            });

            const queriedGeneSymbols = new Set(
                (oncoprint.props.store.genes.result || []).map(g =>
                    g.hugoGeneSymbol.toUpperCase()
                )
            );

            // Await mutationCache for genes NOT in the query
            for (const query of mutationQueries) {
                if (
                    !queriedGeneSymbols.has(query.hugoGeneSymbol.toUpperCase())
                ) {
                    await toPromise(
                        oncoprint.props.store.mutationCache.get({
                            entrezGeneId: query.entrezGeneId,
                        })
                    );
                }
            }

            const samples = oncoprint.props.store.filteredSamples.result!;
            const patients = oncoprint.props.store.filteredPatients.result!;

            return cacheQueries.map(query => {
                const { molecularProfileId, hugoGeneSymbol: gene } = query;
                const profileType =
                    molecularProfileIdToMolecularProfile[molecularProfileId]
                        .molecularAlterationType;
                const datatype =
                    molecularProfileIdToMolecularProfile[molecularProfileId]
                        .datatype;
                const molecularProfileName =
                    molecularProfileIdToMolecularProfile[molecularProfileId]
                        .name;
                const trackGroupIndex =
                    molecularProfileIdToAdditionalTracks[molecularProfileId]
                        .trackGroupIndex;

                const onClickRemoveInTrackMenu = action(() => {
                    const trackGroup =
                        oncoprint.molecularProfileIdToAdditionalTracks[
                            molecularProfileId
                        ];
                    if (trackGroup) {
                        const newEntities = _.keys(trackGroup.entities).filter(
                            entity => entity !== gene
                        );
                        if (newEntities.length === 0) {
                            oncoprint.removeHeatmapTracksByMolecularProfileId(
                                molecularProfileId
                            );
                        } else {
                            oncoprint.setHeatmapTracks(
                                molecularProfileId,
                                newEntities
                            );
                        }
                    }

                    if (
                        trackGroup === undefined &&
                        oncoprint.sortMode.type === 'heatmap' &&
                        oncoprint.sortMode.clusteredHeatmapProfile ===
                            molecularProfileId
                    ) {
                        oncoprint.sortByData();
                    }
                });

                const dataForTrack = createHeatmapTracksData(
                    query,
                    profileType,
                    oncoprint,
                    false
                );

                return {
                    key: `HEATMAPTRACK_${molecularProfileId},${gene}`,
                    label: gene,
                    molecularProfileId,
                    molecularProfileName,
                    molecularAlterationType: profileType,
                    datatype,
                    data: makeHeatmapTrackData<
                        IGeneHeatmapTrackDatum,
                        'hugo_gene_symbol'
                    >(
                        'hugo_gene_symbol',
                        gene,
                        sampleMode ? samples : patients,
                        dataForTrack
                    ),
                    trackGroupIndex,
                    onClickRemoveInTrackMenu,
                };
            });
        },
        default: [],
    });
}

export function makeGenericAssayProfileCategoricalTracksMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean
) {
    return remoteData<ICategoricalTrackSpec[]>({
        await: () => [
            oncoprint.props.store.filteredSamples,
            oncoprint.props.store.filteredPatients,
            oncoprint.props.store.molecularProfileIdToMolecularProfile,
            oncoprint.props.store.genericAssayMolecularDataCache,
            oncoprint.genericAssayPromises
                .genericAssayEntitiesGroupedByGenericAssayTypeLinkMap,
            oncoprint.genericAssayPromises
                .genericAssayEntitiesGroupedByGenericAssayType,
        ],
        invoke: async () => {
            const molecularProfileIdToMolecularProfile = oncoprint.props.store
                .molecularProfileIdToMolecularProfile.result!;
            const molecularProfileIdToAdditionalTracks =
                oncoprint.molecularProfileIdToAdditionalTracks;

            const genericAssayProfiles = _.filter(
                molecularProfileIdToAdditionalTracks,
                groupInfo =>
                    isGenericAssayCategoricalProfile(groupInfo.molecularProfile)
            );

            const cacheQueries = getGenericAssayTrackCacheQueries(
                genericAssayProfiles,
                molecularProfileIdToMolecularProfile,
                oncoprint
            );

            await oncoprint.props.store.genericAssayMolecularDataCache.result!.getPromise(
                cacheQueries.map(query => {
                    return {
                        molecularProfileId: query.molecularProfileId,
                        stableId: query.stableId,
                    };
                }),
                true
            );

            const samples = oncoprint.props.store.filteredSamples.result!;
            const patients = oncoprint.props.store.filteredPatients.result!;

            const tracks = cacheQueries.map(query => {
                const molecularProfileId = query.molecularProfileId;
                const profile =
                    molecularProfileIdToMolecularProfile[molecularProfileId];
                const dataCache = oncoprint.props.store
                    .genericAssayMolecularDataCache.result!;

                const entityId = query.stableId;
                const genericAssayType = profile.genericAssayType;
                const entityLinkMap = oncoprint.genericAssayPromises
                    .genericAssayEntitiesGroupedByGenericAssayTypeLinkMap
                    .result![profile.genericAssayType];

                return {
                    key: `GENERICASSAYCATEGORICALTRACK_${molecularProfileId},${entityId}`,
                    label: query.entityName,
                    description: query.description,
                    molecularProfileId: query.molecularProfileId,
                    molecularProfileName:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .name,
                    molecularAlterationType:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .molecularAlterationType,
                    datatype:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .datatype,
                    data: makeCategoricalTrackData(
                        profile,
                        entityId,
                        sampleMode ? samples : patients,
                        dataCache.get(query)!.data!
                    ),
                    genericAssayType: genericAssayType,
                    trackLinkUrl: entityLinkMap[entityId],
                    trackGroupIndex: molecularProfileIdToAdditionalTracks[
                        molecularProfileId
                    ]!.trackGroupIndex,
                    onClickRemoveInTrackMenu: action(() => {
                        const trackGroup = oncoprint
                            .molecularProfileIdToAdditionalTracks[
                            molecularProfileId
                        ]!;
                        if (trackGroup) {
                            const newEntities = _.keys(
                                trackGroup.entities
                            ).filter(entity => entity !== entityId);
                            oncoprint.setGenericAssayTracks(
                                molecularProfileId,
                                newEntities
                            );
                        }
                    }),
                };
            });
            return tracks;
        },
        default: [],
    });
}

export function makeGenericAssayProfileHeatmapTracksMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean
) {
    return remoteData<IHeatmapTrackSpec[]>({
        await: () => [
            oncoprint.props.store.filteredSamples,
            oncoprint.props.store.filteredPatients,
            oncoprint.props.store.molecularProfileIdToMolecularProfile,
            oncoprint.props.store.genericAssayMolecularDataCache,
            oncoprint.genericAssayPromises
                .genericAssayEntitiesGroupedByGenericAssayTypeLinkMap,
            oncoprint.genericAssayPromises
                .genericAssayEntitiesGroupedByGenericAssayType,
        ],
        invoke: async () => {
            const molecularProfileIdToMolecularProfile = oncoprint.props.store
                .molecularProfileIdToMolecularProfile.result!;
            const molecularProfileIdToAdditionalTracks =
                oncoprint.molecularProfileIdToAdditionalTracks;

            const genericAssayProfiles = _.filter(
                molecularProfileIdToAdditionalTracks,
                groupInfo =>
                    isGenericAssayHeatmapProfile(groupInfo.molecularProfile)
            );

            const cacheQueries = getGenericAssayTrackCacheQueries(
                genericAssayProfiles,
                molecularProfileIdToMolecularProfile,
                oncoprint
            );

            await oncoprint.props.store.genericAssayMolecularDataCache.result!.getPromise(
                cacheQueries.map(query => {
                    return {
                        molecularProfileId: query.molecularProfileId,
                        stableId: query.stableId,
                    };
                }),
                true
            );

            const samples = oncoprint.props.store.filteredSamples.result!;
            const patients = oncoprint.props.store.filteredPatients.result!;

            const tracks = cacheQueries.map(query => {
                const molecularProfileId = query.molecularProfileId;
                const profile =
                    molecularProfileIdToMolecularProfile[molecularProfileId];
                const dataCache = oncoprint.props.store
                    .genericAssayMolecularDataCache.result!;

                const entityId = query.stableId;
                const genericAssayType = profile.genericAssayType;
                const pivotThreshold = profile.pivotThreshold;
                const sortOrder = profile.sortOrder;
                const entityLinkMap = oncoprint.genericAssayPromises
                    .genericAssayEntitiesGroupedByGenericAssayTypeLinkMap
                    .result![profile.genericAssayType];

                return {
                    key: `GENERICASSAYHEATMAPTRACK_${molecularProfileId},${entityId}`,
                    label: query.entityName,
                    description: query.description,
                    molecularProfileId: query.molecularProfileId,
                    molecularProfileName:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .name,
                    molecularAlterationType:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .molecularAlterationType,
                    datatype:
                        molecularProfileIdToMolecularProfile[molecularProfileId]
                            .datatype,
                    data: makeHeatmapTrackData<
                        IGenericAssayHeatmapTrackDatum,
                        'entityId'
                    >(
                        'entityId',
                        entityId,
                        sampleMode ? samples : patients,
                        dataCache
                            .get({ molecularProfileId, stableId: entityId })!
                            .data!.map(d => ({
                                ...d!,
                                value: parseFloat(d.value!),
                            }))
                    ),
                    genericAssayType: genericAssayType,
                    pivotThreshold: pivotThreshold,
                    sortOrder: sortOrder,
                    trackLinkUrl: entityLinkMap[entityId],
                    trackGroupIndex: molecularProfileIdToAdditionalTracks[
                        molecularProfileId
                    ]!.trackGroupIndex,
                    onClickRemoveInTrackMenu: action(() => {
                        const trackGroup = oncoprint
                            .molecularProfileIdToAdditionalTracks[
                            molecularProfileId
                        ]!;
                        if (trackGroup) {
                            const newEntities = _.keys(
                                trackGroup.entities
                            ).filter(entity => entity !== entityId);
                            oncoprint.setGenericAssayTracks(
                                molecularProfileId,
                                newEntities
                            );
                        }
                        if (
                            trackGroup === undefined &&
                            oncoprint.sortMode.type === 'heatmap' &&
                            oncoprint.sortMode.clusteredHeatmapProfile ===
                                molecularProfileId
                        ) {
                            oncoprint.sortByData();
                        }
                    }),
                };
            });
            return tracks;
        },
        default: [],
    });
}

export function makeGenesetHeatmapExpansionsMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean
) {
    return remoteData<IGenesetExpansionMap>({
        await: () => [
            oncoprint.props.store.filteredSamples,
            oncoprint.props.store.filteredPatients,
            oncoprint.props.store.molecularProfileIdToMolecularProfile,
            oncoprint.props.store.geneMolecularDataCache,
            oncoprint.props.store.genesetCorrelatedGeneCache,
        ],
        invoke: async () => {
            const samples = oncoprint.props.store.filteredSamples.result!;
            const patients = oncoprint.props.store.filteredPatients.result!;
            const molecularProfileIdToMolecularProfile = oncoprint.props.store
                .molecularProfileIdToMolecularProfile.result!;
            const dataCache = oncoprint.props.store.geneMolecularDataCache
                .result!;
            const genesetGeneCache = oncoprint.props.store
                .genesetCorrelatedGeneCache.result!;

            const trackGroupIndex = oncoprint.genesetHeatmapTrackGroupIndex;
            const expansionsByGenesetTrack =
                oncoprint.expansionsByGenesetHeatmapTrackKey;

            // list all the genes in an array of plain, non-observable objects,
            // as observable arrays cannot be safely passed to external libs
            const cacheQueries: {
                entrezGeneId: number;
                molecularProfileId: string;
            }[] = _.flatten(
                Array.from(expansionsByGenesetTrack.values()).map(mobxArray =>
                    mobxArray.slice()
                )
            ).map(({ entrezGeneId, molecularProfileId }) => ({
                entrezGeneId,
                molecularProfileId,
            }));
            await dataCache.getPromise(cacheQueries, true);

            const tracksByGenesetTrack: {
                [genesetTrackKey: string]: IHeatmapTrackSpec[];
            } = {};
            expansionsByGenesetTrack.toJSON().forEach(([gsTrack, genes]) => {
                tracksByGenesetTrack[gsTrack] = genes.map(
                    ({
                        entrezGeneId,
                        hugoGeneSymbol,
                        molecularProfileId,
                        correlationValue,
                    }) => {
                        const data = dataCache.get({
                            entrezGeneId,
                            molecularProfileId,
                        })!.data!;
                        const profile =
                            molecularProfileIdToMolecularProfile[
                                molecularProfileId
                            ];
                        return {
                            key: `EXPANSIONTRACK_${gsTrack},${hugoGeneSymbol},GROUP${trackGroupIndex!}`,
                            label: '  ' + hugoGeneSymbol,
                            labelColor: 'grey',
                            info: correlationValue.toFixed(2),
                            molecularProfileId: molecularProfileId,
                            molecularAlterationType:
                                profile.molecularAlterationType,
                            datatype: profile.datatype,
                            data: makeHeatmapTrackData<
                                IGeneHeatmapTrackDatum,
                                'hugo_gene_symbol'
                            >(
                                'hugo_gene_symbol',
                                hugoGeneSymbol,
                                sampleMode ? samples : patients,
                                data
                            ),
                            trackGroupIndex: trackGroupIndex!,
                            onRemove: makeGenesetHeatmapUnexpandHandler(
                                oncoprint,
                                gsTrack,
                                entrezGeneId,
                                trackGroupIndex!,
                                genesetGeneCache.reset.bind(
                                    genesetGeneCache,
                                    gsTrack
                                )
                            ),
                        };
                    }
                );
            });
            return tracksByGenesetTrack;
        },
        default: {},
    });
}

export function makeGenesetHeatmapTracksMobxPromise(
    oncoprint: ResultsViewOncoprint,
    sampleMode: boolean,
    expansionMapPromise: MobxPromise<IGenesetExpansionMap>
) {
    return remoteData<IGenesetHeatmapTrackSpec[]>({
        await: () => [
            oncoprint.props.store.filteredSamples,
            oncoprint.props.store.filteredPatients,
            oncoprint.props.store.genesetMolecularProfile,
            oncoprint.props.store.genesetMolecularDataCache,
            oncoprint.props.store.genesetLinkMap,
            oncoprint.props.store.genesetCorrelatedGeneCache,
            expansionMapPromise,
        ],
        invoke: async () => {
            const samples = oncoprint.props.store.filteredSamples.result!;
            const patients = oncoprint.props.store.filteredPatients.result!;
            const molecularProfile = oncoprint.props.store
                .genesetMolecularProfile.result!;
            const dataCache = oncoprint.props.store.genesetMolecularDataCache
                .result!;
            const genesetLinkMap = oncoprint.props.store.genesetLinkMap.result!;
            const correlatedGeneCache = oncoprint.props.store
                .genesetCorrelatedGeneCache.result!;
            const expansions = expansionMapPromise.result!;

            // observe computed property based on other tracks
            const trackGroupIndex = oncoprint.genesetHeatmapTrackGroupIndex;

            if (!molecularProfile.isApplicable) {
                return [];
            }
            const molecularProfileId =
                molecularProfile.value.molecularProfileId;
            const genesetIds = oncoprint.props.store.genesetIds;

            const cacheQueries = genesetIds.map(genesetId => ({
                molecularProfileId,
                genesetId,
            }));
            await dataCache.getPromise(cacheQueries, true);

            return genesetIds.map(genesetId => {
                const expansionMapKey = `GENESETHEATMAPTRACK_${molecularProfileId},${genesetId}`;
                return {
                    key: `GENESETHEATMAPTRACK_${molecularProfileId},${genesetId},GROUP${trackGroupIndex!}`,
                    label: genesetId,
                    molecularProfileId,
                    molecularAlterationType:
                        molecularProfile.value.molecularAlterationType,
                    datatype: molecularProfile.value.datatype,
                    trackLinkUrl: genesetLinkMap[genesetId],
                    data: makeHeatmapTrackData<
                        IGenesetHeatmapTrackDatum,
                        'geneset_id'
                    >(
                        'geneset_id',
                        genesetId,
                        sampleMode ? samples : patients,
                        // TODO: GenesetMolecularData still has type value of
                        // string, other NumericGeneMolecularData have number
                        dataCache
                            .get({ molecularProfileId, genesetId })!
                            .data!.map(d => ({
                                ...d!,
                                value: parseFloat(d.value!),
                            }))
                    ),
                    trackGroupIndex: trackGroupIndex!,
                    expansionCallback: makeGenesetHeatmapExpandHandler(
                        oncoprint,
                        expansionMapKey,
                        { molecularProfileId, genesetId },
                        correlatedGeneCache
                    ),
                    expansionTrackList: expansions[expansionMapKey],
                };
            });
        },
        default: [],
    });
}

export function extractGenericAssaySelections(
    text: string,
    selectedGenericAssayEntityIds: string[],
    genericAssayEntitiesOptionsByValueMap: { [entityId: string]: ISelectOption }
): string {
    // get values from input string
    const elements = splitHeatmapTextField(text);

    // check values for valid entity ids
    const detectedGenericAssayEntityIds: string[] = [];
    _.each(elements, (d: string) => {
        if (d in genericAssayEntitiesOptionsByValueMap) {
            detectedGenericAssayEntityIds.push(d);
            if (!selectedGenericAssayEntityIds.includes(d)) {
                selectedGenericAssayEntityIds.push(d);
            }
        }
    });

    // remove valid entity ids from the input string
    if (detectedGenericAssayEntityIds.length > 0) {
        _.each(detectedGenericAssayEntityIds, (d: string) => {
            text = text.replace(d, '');
        });
    }

    // return the input string
    return text
        .trim()
        .replace('\t+', '\t')
        .replace(' +', ' ');
}

export function splitHeatmapTextField(text: string): string[] {
    text = text.replace(/[,\s\n]+/g, ' ').trim();
    return _.uniq(text.split(/[,\s\n]+/));
}
