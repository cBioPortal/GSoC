import {
    AxisMenuSelection,
    ColoringMenuOmnibarOption,
    ColoringMenuSelection,
    ColoringType,
    MutationCountBy,
    NONE_SELECTED_OPTION_NUMERICAL_VALUE,
    NONE_SELECTED_OPTION_STRING_VALUE,
    PlotType,
    StructuralVariantCountBy,
    PlotsTabOption,
    SelectedColoringTypes,
} from './PlotsTab';
import {
    CancerStudy,
    ClinicalAttribute,
    ClinicalData,
    Gene,
    GenesetMolecularData,
    MolecularProfile,
    Mutation,
    NumericGeneMolecularData,
    Sample,
} from 'cbioportal-ts-api-client';

import { StructuralVariant } from 'cbioportal-ts-api-client';

import {
    remoteData,
    MobxPromise,
    stringListToIndexSet,
} from 'cbioportal-frontend-commons';
import MobxPromiseCache from '../../../shared/lib/MobxPromiseCache';
import { getSampleViewUrl, getStudySummaryUrl } from '../../../shared/api/urls';
import _ from 'lodash';
import * as React from 'react';
import {
    getOncoprintMutationType,
    OncoprintMutationType,
    selectDisplayValue,
} from '../../../shared/components/oncoprint/DataUtils';
import { BLACK, DEFAULT_GREY, LIGHT_GREY } from 'shared/lib/Colors';
import { CoverageInformation } from '../../../shared/lib/GenePanelUtils';
import { IBoxScatterPlotData } from '../../../shared/components/plots/BoxScatterPlot';
import { AlterationTypeConstants, DataTypeConstants } from 'shared/constants';

import numeral from 'numeral';
import GenesetMolecularDataCache from '../../../shared/cache/GenesetMolecularDataCache';
import ClinicalDataCache, {
    ClinicalDataCacheEntry,
} from '../../../shared/cache/ClinicalDataCache';
import GenericAssayMolecularDataCache, {
    GenericAssayDataEnhanced,
} from '../../../shared/cache/GenericAssayMolecularDataCache';
import {
    dataPointIsLimited,
    getJitterForCase,
    LegendDataWithId,
} from '../../../shared/components/plots/PlotUtils';
import { isSampleProfiledInMultiple } from '../../../shared/lib/isSampleProfiled';
import { ObservableMap } from 'mobx';
import { toFixedWithoutTrailingZeros } from '../../../shared/lib/FormatUtils';
import joinJsx from 'shared/lib/joinJsx';
import jStat from 'jStat';
import {
    CNA_COLOR_AMP,
    CNA_COLOR_HOMDEL,
    STRUCTURAL_VARIANT_COLOR,
    MUT_COLOR_INFRAME,
    MUT_COLOR_INFRAME_PASSENGER,
    MUT_COLOR_MISSENSE,
    MUT_COLOR_MISSENSE_PASSENGER,
    MUT_COLOR_OTHER,
    MUT_COLOR_OTHER_PASSENGER,
    MUT_COLOR_PROMOTER,
    MUT_COLOR_PROMOTER_PASSENGER,
    MUT_COLOR_SPLICE,
    MUT_COLOR_SPLICE_PASSENGER,
    MUT_COLOR_TRUNC,
    MUT_COLOR_TRUNC_PASSENGER,
} from 'cbioportal-frontend-commons';
import { getCategoryOrderByGenericAssayType } from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';
import { AnnotatedNumericGeneMolecularData } from 'shared/model/AnnotatedNumericGeneMolecularData';
import { CustomDriverNumericGeneMolecularData } from 'shared/model/CustomDriverNumericGeneMolecularData';
import { getVariantAlleleFrequency, VAFReport } from 'shared/lib/MutationUtils';

export const CLIN_ATTR_DATA_TYPE = 'clinical_attribute';
export const CUSTOM_ATTR_DATA_TYPE = 'custom_attribute';
export const GENESET_DATA_TYPE = 'GENESET_SCORE';
export const dataTypeToDisplayType: { [s: string]: string } = {
    [AlterationTypeConstants.MUTATION_EXTENDED]: 'Mutation',
    [AlterationTypeConstants.STRUCTURAL_VARIANT]: 'Structural Variant',
    [AlterationTypeConstants.COPY_NUMBER_ALTERATION]: 'Copy Number',
    [AlterationTypeConstants.MRNA_EXPRESSION]: 'mRNA',
    [AlterationTypeConstants.PROTEIN_LEVEL]: 'Protein Level',
    [AlterationTypeConstants.METHYLATION]: 'DNA Methylation',
    [CLIN_ATTR_DATA_TYPE]: 'Clinical Attribute',
    [GENESET_DATA_TYPE]: 'Gene Sets',
    [CUSTOM_ATTR_DATA_TYPE]: 'Custom Data',
};

export const NO_GENE_OPTION = {
    value: NONE_SELECTED_OPTION_NUMERICAL_VALUE,
    label: 'None',
};

export const mutationTypeToDisplayName: {
    [type in OncoprintMutationType]: string;
} = {
    missense: 'Missense',
    inframe: 'Inframe',
    splice: 'Splice',
    promoter: 'Promoter',
    trunc: 'Truncating',
    other: 'Other',
};

export const dataTypeDisplayOrder = [
    CLIN_ATTR_DATA_TYPE,
    CUSTOM_ATTR_DATA_TYPE,
    AlterationTypeConstants.MUTATION_EXTENDED,
    AlterationTypeConstants.STRUCTURAL_VARIANT,
    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
    AlterationTypeConstants.MRNA_EXPRESSION,
    GENESET_DATA_TYPE,
    AlterationTypeConstants.PROTEIN_LEVEL,
    AlterationTypeConstants.METHYLATION,
];

export function sortMolecularProfilesForDisplay(profiles: MolecularProfile[]) {
    if (!profiles.length) {
        return [];
    }

    const type = profiles[0].molecularAlterationType;
    let sortBy: (p: MolecularProfile) => any;
    switch (type) {
        case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
            sortBy = p => (p.datatype === 'DISCRETE' ? 0 : 1);
            break;
        default:
            sortBy = p => p.name;
            break;
    }
    return _.sortBy<MolecularProfile>(profiles, sortBy);
}

export const CNA_STROKE_WIDTH = 1.8;
export const PLOT_SIDELENGTH = 650;
export const WATERFALLPLOT_SIDELENGTH = 500;
export const WATERFALLPLOT_BASE_SIDELENGTH = 480;
export const WATERFALLPLOT_SIDELENGTH_SAMPLE_MULTIPLICATION_FACTOR = 1.6;

export interface IAxisData {
    data: {
        uniqueSampleKey: string;
        value: string | number | string[] | number[]; // if theres a list, then we'll make one data point per value
    }[];
    hugoGeneSymbol?: string;
    datatype: string; //"string" or "number"
}

export interface IStringAxisData {
    data: {
        uniqueSampleKey: string;
        value: string | string[];
        thresholdType?: '>' | '<' | undefined;
    }[];
    categoryOrder?: string[];
    hugoGeneSymbol?: string;
    datatype: string;
}
export interface INumberAxisData {
    data: {
        uniqueSampleKey: string;
        value: number | number[];
        thresholdType?: '>' | '<' | undefined;
    }[];
    hugoGeneSymbol?: string;
    datatype: string;
}

const NOT_PROFILED_MUTATION_LEGEND_LABEL = ['Not profiled', 'for mutations'];
const NOT_PROFILED_CNA_SV_LEGEND_LABEL = (
    coloringTypes: SelectedColoringTypes
) => {
    const cna = ColoringType.CopyNumber in coloringTypes;
    const sv = ColoringType.StructuralVariant in coloringTypes;
    let secondLine;
    if (cna && sv) {
        secondLine = 'for CNA and Structural Variants';
    } else if (cna) {
        secondLine = 'for CNA';
    } else {
        //sv
        secondLine = 'for Structural Variants';
    }
    return ['Not profiled', secondLine];
};
const NO_DATA_CLINICAL_LEGEND_LABEL = 'No data';
const MUTATION_TYPE_NOT_PROFILED = 'not_profiled_mutation';
const MUTATION_TYPE_NOT_MUTATED = 'not_mutated';
const CNA_TYPE_NOT_PROFILED = 'not_profiled_cna';
const CNA_TYPE_NO_DATA = 'not_profiled_cna';
const ONCOKB_ONCOGENIC_ICON = require('oncokb-styles/images/oncogenic.svg');

// this interface contains all attributes needed to provide correct styling of
// graph elements (points, bars, ...)
export interface IPlotSampleData {
    uniqueSampleKey: string;
    sampleId: string;
    studyId: string;
    dispCna?: AnnotatedNumericGeneMolecularData;
    dispMutationType?: OncoprintMutationType;
    dispClinicalValue?: string | number;
    dispStructuralVariant?: string;
    isProfiledCna?: boolean;
    isProfiledMutations?: boolean;
    isProfiledStructuralVariants?: boolean;
    mutations: AnnotatedMutation[];
    copyNumberAlterations: AnnotatedNumericGeneMolecularData[];
    structuralVariants: StructuralVariant[];
}

export interface IThreshold1D {
    thresholdType?: '>' | '<' | undefined;
}
export interface IThreshold2D {
    xThresholdType?: '>' | '<' | undefined;
    yThresholdType?: '>' | '<' | undefined;
}

export interface IValue1D {
    value: number;
}

export interface IValue2D {
    x: number;
    y: number;
}
export interface IBoxScatterPlotPoint
    extends IValue1D,
        IThreshold1D,
        IPlotSampleData,
        IThreshold1D {
    category: string;
    jitter: number;
}

export interface IScatterPlotData
    extends IPlotSampleData,
        IValue2D,
        IThreshold2D {}
export interface IWaterfallPlotData
    extends IPlotSampleData,
        IValue1D,
        IThreshold1D {}

export interface IAxisLogScaleParams {
    label: string;

    // Function for transforming `number` into its log-scale representation
    // `offset` is a constant added to the value before transformation (used
    // for transformation of data sets with negative numbers)
    fLogScale: (x: number, offset?: number) => number;

    // Function for back-transforming `number` transformed with fLogScale
    // function into its linear-scale representation
    fInvLogScale: (x: number, offset?: number) => number;
}

export function isStringData(d: IAxisData): d is IStringAxisData {
    return d.datatype === 'string';
}
export function isNumberData(d: IAxisData): d is INumberAxisData {
    return d.datatype === 'number';
}
export function isNone(d: IAxisData): d is IAxisData {
    return d.datatype === 'none';
}

export function getColoringMenuOptionValue(
    option: Omit<ColoringMenuOmnibarOption, 'value'>
) {
    return `${option.info.entrezGeneId}_${JSON.stringify(
        option.info.clinicalAttribute,
        ['clinicalAttributeId', 'patientAttribute', 'studyId']
    )}`;
}

function doesPointHaveClinicalData(d: IPlotSampleData) {
    return d.dispClinicalValue !== undefined;
}
function doesPointHaveMutationData(d: IPlotSampleData) {
    return !!d.dispMutationType;
}
function doesPointHaveCnaData(d: IPlotSampleData) {
    return !!d.dispCna;
}
function doesPointHaveSvData(d: IPlotSampleData) {
    return !!d.dispStructuralVariant;
}
function isPointProfiledForMutations(d: IPlotSampleData) {
    return !!d.isProfiledMutations;
}
function isPointProfiledForCna(d: IPlotSampleData) {
    return !!d.isProfiledCna;
}
function isPointProfiledForSv(d: IPlotSampleData) {
    return !!d.isProfiledStructuralVariants;
}
function isPointNotProfiledForCnaAndSv(
    d: IPlotSampleData,
    coloringTypes: SelectedColoringTypes
) {
    const isUnprofiledCna = !isPointProfiledForCna(d);
    const isUnprofiledSv = !isPointProfiledForSv(d);
    return (
        (ColoringType.CopyNumber in coloringTypes &&
            ColoringType.StructuralVariant in coloringTypes &&
            isUnprofiledCna &&
            isUnprofiledSv) ||
        (ColoringType.CopyNumber in coloringTypes &&
            !(ColoringType.StructuralVariant in coloringTypes) &&
            isUnprofiledCna) ||
        (ColoringType.StructuralVariant in coloringTypes &&
            !(ColoringType.CopyNumber in coloringTypes) &&
            isUnprofiledSv)
    );
}

export function scatterPlotZIndexSortBy<
    D extends Pick<
        IPlotSampleData,
        | 'dispMutationType'
        | 'isProfiledMutations'
        | 'dispCna'
        | 'dispClinicalValue'
        | 'isProfiledCna'
        | 'isProfiledStructuralVariants'
        | 'dispStructuralVariant'
    >
>(viewType: SelectedColoringTypes, highlight?: (d: D) => boolean) {
    // sort by render priority
    const sortByHighlight = highlight
        ? (d: D) => (highlight(d) ? 1 : 0)
        : (d: D) => 0;

    const sortByMutation = (d: D) => {
        if (!d.isProfiledMutations) {
            return -mutationRenderPriority[MUTATION_TYPE_NOT_PROFILED];
        } else if (!d.dispMutationType) {
            return -mutationRenderPriority[MUTATION_TYPE_NOT_MUTATED];
        } else if (d.dispMutationType in mutationRenderPriority) {
            return -mutationRenderPriority[d.dispMutationType!];
        } else {
            return Number.NEGATIVE_INFINITY;
        }
    };

    const sortByCna = (d: D) => {
        if (!d.isProfiledCna) {
            return -cnaRenderPriority[CNA_TYPE_NOT_PROFILED];
        } else if (!d.dispCna) {
            return -cnaRenderPriority[CNA_TYPE_NO_DATA];
        } else if (d.dispCna.value in cnaRenderPriority) {
            return -cnaRenderPriority[d.dispCna.value];
        } else {
            return Number.NEGATIVE_INFINITY;
        }
    };

    const sortByStructuralVariant = (d: D) => {
        if (!d.isProfiledStructuralVariants) {
            return 0;
        } else if (!d.dispStructuralVariant) {
            return 1;
        } else {
            return 2;
        }
    };

    let sortBy = [sortByHighlight];
    if (ColoringType.ClinicalData in viewType) {
        sortBy.push((d: D) => {
            if (d.dispClinicalValue === undefined) {
                return Number.NEGATIVE_INFINITY;
            } else {
                return 1;
            }
        });
    } else {
        if (ColoringType.MutationType in viewType) {
            sortBy.push(sortByMutation);
        }
        if (ColoringType.StructuralVariant in viewType) {
            sortBy.push(sortByStructuralVariant);
        }
        if (ColoringType.CopyNumber in viewType) {
            sortBy.push(sortByCna);
        }
    }
    return sortBy;
}

export function scatterPlotLegendData(
    data: IPlotSampleData[],
    viewType: SelectedColoringTypes,
    plotType: PlotType,
    driversAnnotated: boolean,
    limitValueTypes: string[],
    highlightedLegendItems?: ObservableMap<string, LegendDataWithId>,
    highlight?: (d: IPlotSampleData) => boolean,
    coloringClinicalDataCacheEntry?: ClinicalDataCacheEntry,
    coloringClinicalDataLogScale?: boolean,
    onClickLegendItem?: (ld: LegendDataWithId) => void
): LegendDataWithId[] {
    let legend: any[] = [];
    const uniqueVisibleValues = new Set<string>();
    if (ColoringType.ClinicalData in viewType && data && data.length > 0) {
        data.forEach(point => {
            if (point.dispClinicalValue) {
                uniqueVisibleValues.add(String(point.dispClinicalValue));
            }
        });
    }

    if (ColoringType.ClinicalData in viewType) {
        if (
            coloringClinicalDataCacheEntry &&
            coloringClinicalDataCacheEntry.categoryToColor
        ) {
            const allLegendEntries = scatterPlotStringClinicalLegendData(
                coloringClinicalDataCacheEntry,
                plotType,
                onClickLegendItem
            );
            const hasNoDataPoints = data.some(d => !d.dispClinicalValue);
            // Filter legend entries to only show:
            // 1. Categories that exist in the current visible data (uniqueVisibleValues)
            // 2. The "No Data" entry ONLY if there are points with missing clinical values (hasNoDataPoints)
            legend = allLegendEntries.filter(item => {
                const itemName = String(item.name);
                return (
                    uniqueVisibleValues.has(itemName) ||
                    (itemName === NO_DATA_CLINICAL_LEGEND_LABEL &&
                        hasNoDataPoints)
                );
            });
        } else if (
            coloringClinicalDataCacheEntry &&
            coloringClinicalDataCacheEntry.numericalValueToColor
        ) {
            legend = scatterPlotNumericalClinicalLegendData(
                coloringClinicalDataCacheEntry,
                plotType,
                coloringClinicalDataLogScale
            );
        }
    } else {
        if (ColoringType.MutationType in viewType) {
            legend.push(
                ...scatterPlotMutationLegendData(
                    data,
                    driversAnnotated,
                    false,
                    plotType,
                    onClickLegendItem
                )
            );
        }

        if (
            ColoringType.CopyNumber in viewType ||
            ColoringType.StructuralVariant in viewType
        ) {
            legend.push(
                ...scatterPlotCnaAndSvLegendData(
                    data,
                    plotType,
                    viewType,
                    onClickLegendItem
                )
            );
        }
        if (ColoringType.LimitVal in viewType) {
            legend.push(
                ...scatterPlotLimitValLegendData(
                    plotType,
                    limitValueTypes,
                    onClickLegendItem
                )
            );
        }
    }
    const searchIndicatorLegendData = scatterPlotSearchIndicatorLegendData(
        data,
        plotType,
        highlight
    );
    if (searchIndicatorLegendData) {
        legend = legend.concat(searchIndicatorLegendData);
    }

    // add highlighting styles
    if (highlightedLegendItems) {
        legend.forEach(datum => {
            const labels: any = {};
            if (datum.highlighting) {
                labels.cursor = 'pointer';
                datum.symbol.cursor = 'pointer';
                if (highlightedLegendItems.has(datum.highlighting.uid)) {
                    labels.fontWeight = 'bold';
                }
            }
            datum.labels = labels;
        });
    }
    return legend;
}

function scatterPlotMutationLegendData(
    data: IPlotSampleData[],
    driversAnnotated: boolean,
    showStroke: boolean,
    plotType: PlotType,
    onClick?: (ld: LegendDataWithId) => void
): LegendDataWithId[] {
    const oncoprintMutationTypeToAppearance = driversAnnotated
        ? oncoprintMutationTypeToAppearanceDrivers
        : oncoprintMutationTypeToAppearanceDefault;
    let showNoMutationElement = false;
    let showNotProfiledElement = false;
    const uniqueMutations = _.chain(data)
        .map(d => {
            const ret = d.dispMutationType ? d.dispMutationType : null;
            if (!isPointProfiledForMutations(d)) {
                showNotProfiledElement = true;
            }
            return ret;
        })
        .uniq()
        .filter(x => {
            const ret = !!x;
            if (!ret) {
                showNoMutationElement = true;
            }
            return ret;
        })
        .keyBy(x => x)
        .value();

    const legendData: LegendDataWithId[] = _.chain(mutationLegendOrder)
        .filter(type => !!uniqueMutations[type])
        .map(type => {
            const appearance = oncoprintMutationTypeToAppearance[type];
            const legendSymbol =
                plotType === PlotType.WaterfallPlot
                    ? 'square'
                    : appearance.symbol;
            const stroke =
                plotType === PlotType.WaterfallPlot
                    ? appearance.fill
                    : appearance.stroke;
            return {
                name: appearance.legendLabel,
                symbol: {
                    stroke: stroke,
                    strokeOpacity: showStroke ? appearance.strokeOpacity : 0,
                    fill: appearance.fill,
                    type: legendSymbol,
                },
                highlighting: onClick && {
                    uid: appearance.legendLabel,
                    isDatumHighlighted: (d: IPlotSampleData) => {
                        return d.dispMutationType === type;
                    },
                    onClick,
                },
            };
        })
        .value();
    if (showNoMutationElement) {
        const legendSymbol =
            plotType === PlotType.WaterfallPlot
                ? 'square'
                : noMutationAppearance.symbol;
        const stroke =
            plotType === PlotType.WaterfallPlot
                ? noMutationAppearance.fill
                : noMutationAppearance.stroke;
        legendData.push({
            name: noMutationAppearance.legendLabel,
            symbol: {
                stroke: stroke,
                strokeOpacity: showStroke
                    ? noMutationAppearance.strokeOpacity
                    : 0,
                fill: noMutationAppearance.fill,
                type: legendSymbol,
            },
            highlighting: onClick && {
                uid: noMutationAppearance.legendLabel,
                isDatumHighlighted: (d: IPlotSampleData) => {
                    return (
                        isPointProfiledForMutations(d) &&
                        !doesPointHaveMutationData(d)
                    );
                },
                onClick,
            },
        });
    }
    if (showNotProfiledElement) {
        const legendSymbol =
            plotType === PlotType.WaterfallPlot ? 'square' : 'circle';
        const stroke = notProfiledMutationsAppearance.stroke;
        legendData.push({
            name: NOT_PROFILED_MUTATION_LEGEND_LABEL,
            symbol: {
                stroke: stroke,
                strokeOpacity: notProfiledMutationsAppearance.strokeOpacity, // always show because its white
                fill: notProfiledMutationsAppearance.fill,
                type: legendSymbol,
            },
            highlighting: onClick && {
                uid: JSON.stringify(NOT_PROFILED_MUTATION_LEGEND_LABEL),
                isDatumHighlighted: (d: IPlotSampleData) => {
                    return !isPointProfiledForMutations(d);
                },
                onClick,
            },
        });
    }
    return legendData;
}

function scatterPlotLimitValLegendData(
    plotType: PlotType,
    limitValueTypes: string[],
    onClick?: (ld: LegendDataWithId) => void
): LegendDataWithId[] {
    const legendData: LegendDataWithId[] = [];

    if (limitValueTypes && limitValueTypes.length > 0) {
        const fillOpacity = plotType === PlotType.WaterfallPlot ? 0 : 1;
        const stroke = plotType === PlotType.WaterfallPlot ? '#000000' : '#999';
        const name = `value ${limitValueTypes.join(' or ')}`;

        legendData.push({
            name,
            symbol: {
                fill: '#999',
                fillOpacity: fillOpacity,
                stroke: stroke,
                strokeOpacity: 1,
                type: limitValueAppearance.symbol,
            },
            highlighting: onClick && {
                uid: name,
                isDatumHighlighted: (d: IPlotSampleData) => {
                    return dataPointIsLimited(d);
                },
                onClick,
            },
        });
    }

    return legendData;
}

function scatterPlotSearchIndicatorLegendData(
    data: IPlotSampleData[],
    plotType: PlotType,
    highlight?: (d: IPlotSampleData) => boolean
): LegendDataWithId | undefined {
    if (
        plotType === PlotType.WaterfallPlot &&
        highlight &&
        _.some(data, d => highlight(d))
    ) {
        return {
            name: waterfallSearchIndicatorAppearance.legendLabel,
            symbol: {
                fill: waterfallSearchIndicatorAppearance.fill,
                fillOpacity: waterfallSearchIndicatorAppearance.fillOpacity,
                stroke: waterfallSearchIndicatorAppearance.stroke,
                strokeOpacity: waterfallSearchIndicatorAppearance.strokeOpacity,
                type: waterfallSearchIndicatorAppearance.symbol,
            },
        };
    }
    return undefined;
}

function scatterPlotStringClinicalLegendData(
    clinicalDataCacheEntry: ClinicalDataCacheEntry,
    plotType: PlotType,
    onClick?: (ld: LegendDataWithId) => void
): LegendDataWithId[] {
    const showNoDataElement = true;

    // set plot type-dependent legend properties
    const legendSymbol =
        plotType === PlotType.WaterfallPlot ? 'square' : 'circle';

    const clinicalValues = _.sortBy(
        _.uniq(
            (clinicalDataCacheEntry.data as ClinicalData[]).map(d => d.value)
        )
    );

    const legendData = clinicalValues.map(category => {
        return {
            name: category,
            symbol: {
                stroke: '#000000',
                strokeOpacity: NON_CNA_STROKE_OPACITY,
                fill: clinicalDataCacheEntry.categoryToColor![category],
                type: legendSymbol,
            },
            highlighting: onClick && {
                uid: category,
                isDatumHighlighted: (d: IPlotSampleData) => {
                    return d.dispClinicalValue === category;
                },
                onClick,
            },
        };
    });
    if (showNoDataElement) {
        legendData.push({
            name: NO_DATA_CLINICAL_LEGEND_LABEL,
            symbol: {
                stroke: '#000000',
                strokeOpacity: NON_CNA_STROKE_OPACITY,
                fill: noDataClinicalAppearance.fill,
                type: legendSymbol,
            },
            highlighting: onClick && {
                uid: NO_DATA_CLINICAL_LEGEND_LABEL,
                isDatumHighlighted: (d: IPlotSampleData) => {
                    return !doesPointHaveClinicalData(d);
                },
                onClick,
            },
        });
    }
    return legendData;
}

function scatterPlotNumericalClinicalLegendData(
    clinicalDataCacheEntry: ClinicalDataCacheEntry,
    plotType: PlotType,
    logScale?: boolean
): LegendDataWithId[] {
    const valueRange = clinicalDataCacheEntry.numericalValueRange;
    if (!valueRange) {
        return [];
    }

    const showNoDataElement = true;

    // set plot type-dependent legend properties
    const legendSymbol =
        plotType === PlotType.WaterfallPlot ? 'square' : 'circle';

    /*const legendData: LegendDataWithId[] = valueRange.map(x => {
        return {
            name: x.toFixed(2),
            symbol: {
                stroke: '#000000',
                strokeOpacity: NON_CNA_STROKE_OPACITY,
                fill: clinicalDataCacheEntry.numericalValueToColor!(x),
                type: legendSymbol,
            },
        };
    });

    if (logScale) {
        legendData.push({
            name: '(log scale)',
            symbol: {
                strokeOpacity: 0,
                fillOpacity: 0,
            },
        });
    }*/
    const legendData: LegendDataWithId[] = [];
    legendData.push({
        name: '',
        symbol: {
            type: 'gradient',
            range: valueRange,
            colorFn: logScale
                ? clinicalDataCacheEntry.logScaleNumericalValueToColor!
                : clinicalDataCacheEntry.numericalValueToColor!,
            gradientUid: 'gradient',
        },
    });

    if (showNoDataElement) {
        legendData.push({
            name: NO_DATA_CLINICAL_LEGEND_LABEL,
            symbol: {
                stroke: '#000000',
                strokeOpacity: NON_CNA_STROKE_OPACITY,
                fill: noDataClinicalAppearance.fill,
                type: legendSymbol,
            },
            margin: 125,
        });
    }

    return legendData;
}

function scatterPlotCnaAndSvLegendData(
    data: IPlotSampleData[],
    plotType: PlotType,
    coloringTypes: SelectedColoringTypes,
    onClick?: (ld: LegendDataWithId) => void
): LegendDataWithId[] {
    let showNotProfiledElement = false;

    // set plot type-dependent legend properties
    const legendSymbol =
        plotType === PlotType.WaterfallPlot ? 'square' : 'circle';
    const fillOpacity = plotType === PlotType.WaterfallPlot ? 1 : 0;

    let showSvElement = false;

    const uniqueDispCna = _.chain(data)
        .map(d => {
            if (
                ColoringType.StructuralVariant in coloringTypes &&
                doesPointHaveSvData(d)
            ) {
                showSvElement = true;
                // skip the rest, because we prioritize showing structural variant
                return null;
            }

            const ret = d.dispCna ? d.dispCna.value : null;

            if (isPointNotProfiledForCnaAndSv(d, coloringTypes)) {
                showNotProfiledElement = true;
            }
            return ret;
        })
        .uniq()
        .filter(x => {
            return x !== null;
        })
        .sortBy((v: number) => -v) // sorted descending
        .value();

    const legendData: LegendDataWithId[] = [];
    if (ColoringType.CopyNumber in coloringTypes) {
        legendData.push(
            ...uniqueDispCna.map(v => {
                const appearance = cnaToAppearance[v as -2 | -1 | 0 | 1 | 2];
                return {
                    name: appearance.legendLabel,
                    symbol: {
                        stroke: appearance.stroke,
                        fillOpacity: fillOpacity,
                        fill: appearance.stroke, // for waterfall plot
                        type: legendSymbol,
                        strokeWidth: CNA_STROKE_WIDTH,
                    },
                    highlighting: onClick && {
                        uid: appearance.legendLabel,
                        isDatumHighlighted: (d: IPlotSampleData) => {
                            return !!(d.dispCna && d.dispCna.value === v);
                        },
                        onClick,
                    },
                };
            })
        );
    }

    if (showSvElement) {
        legendData.push({
            name: svAppearance.legendLabel,
            symbol: {
                stroke: svAppearance.stroke,
                fillOpacity,
                fill: svAppearance.stroke, // for waterfall plot
                type: legendSymbol,
                strokeWidth: CNA_STROKE_WIDTH,
            },
            highlighting: onClick && {
                uid: svAppearance.legendLabel,
                isDatumHighlighted: (d: IPlotSampleData) => {
                    return !!d.dispStructuralVariant;
                },
                onClick,
            },
        });
    }

    if (showNotProfiledElement) {
        legendData.push({
            name: NOT_PROFILED_CNA_SV_LEGEND_LABEL(coloringTypes),
            symbol: {
                stroke: notProfiledCnaAndSvAppearance.stroke,
                fillOpacity: fillOpacity,
                fill: notProfiledCnaAndSvAppearance.stroke, // for waterfall plot
                type: legendSymbol,
                strokeWidth: CNA_STROKE_WIDTH,
                strokeOpacity: notProfiledCnaAndSvAppearance.strokeOpacity,
            },
            highlighting: onClick && {
                uid: NOT_PROFILED_CNA_SV_LEGEND_LABEL(coloringTypes).join('\n'),
                isDatumHighlighted: (d: IPlotSampleData) => {
                    return isPointNotProfiledForCnaAndSv(d, coloringTypes);
                },
                onClick,
            },
        });
    }
    return legendData;
}

function makeAxisDataPromise_Clinical(
    attribute: ClinicalAttribute,
    clinicalDataCache: ClinicalDataCache,
    patientKeyToSamples: MobxPromise<{ [uniquePatientKey: string]: Sample[] }>
): MobxPromise<IAxisData> {
    const promise = clinicalDataCache.get(attribute);
    let ret: MobxPromise<IAxisData> = remoteData({
        await: () => [promise, patientKeyToSamples],
        invoke: () => {
            const _patientKeyToSamples = patientKeyToSamples.result!;
            const data: ClinicalData[] = promise.result!.data as ClinicalData[]; // we know it won't be MutationSpectrum
            const axisData: IAxisData = {
                data: [],
                datatype: attribute.datatype.toLowerCase(),
            };
            const shouldParseFloat =
                attribute.datatype.toLowerCase() === 'number';
            const axisData_Data = axisData.data;
            if (attribute.patientAttribute) {
                // produce sample data from patient clinical data
                for (const d of data) {
                    const samples =
                        _patientKeyToSamples[d.uniquePatientKey] || [];
                    for (const sample of samples) {
                        axisData_Data.push({
                            uniqueSampleKey: sample.uniqueSampleKey,
                            value: d.value,
                        });
                    }
                }
            } else {
                // produce sample data from sample clinical data
                for (const d of data) {
                    axisData_Data.push({
                        uniqueSampleKey: d.uniqueSampleKey,
                        value: d.value,
                    });
                }
            }
            if (shouldParseFloat) {
                for (const d of axisData_Data) {
                    d.value = parseFloat(d.value as string); // we know its a string bc all clinical data comes back as string
                }
            }
            return Promise.resolve(axisData);
        },
    });

    return ret;
}

function makeAxisDataPromise_Molecular(
    entrezGeneId: number,
    molecularProfileIdSuffix: string,
    dataType: string,
    annotatedMutationCache: MobxPromiseCache<
        { entrezGeneId: number },
        AnnotatedMutation[]
    >,
    structuralVariantCache: MobxPromiseCache<
        { entrezGeneId: number },
        StructuralVariant[]
    >,
    numericGeneMolecularDataCache: MobxPromiseCache<
        { entrezGeneId: number; molecularProfileId: string },
        NumericGeneMolecularData[]
    >,
    entrezGeneIdToGene: MobxPromise<{ [entrezGeneId: number]: Gene }>,
    mutationCountBy: MutationCountBy,
    structuralVariantCountBy: StructuralVariantCountBy,
    coverageInformation: MobxPromise<CoverageInformation>,
    samples: MobxPromise<Sample[]>,
    molecularProfileIdSuffixToMolecularProfiles: MobxPromise<{
        [molecularProfileIdSuffix: string]: MolecularProfile[];
    }>
): MobxPromise<IAxisData> {
    return remoteData({
        await: () => {
            const ret: MobxPromise<any>[] = [];
            let promises: MobxPromise<any>[] = [];
            if (molecularProfileIdSuffixToMolecularProfiles.isComplete) {
                const profileIds = molecularProfileIdSuffixToMolecularProfiles.result![
                    molecularProfileIdSuffix
                ].map(profile => profile.molecularProfileId);

                // only push promise to promises when promises are empty
                // await function could run multiple times
                if (_.isEmpty(promises)) {
                    if (
                        dataType === AlterationTypeConstants.MUTATION_EXTENDED
                    ) {
                        // mutation profile
                        promises.push(
                            annotatedMutationCache.get({ entrezGeneId })
                        );
                        ret.push(coverageInformation);
                        ret.push(samples);
                    } else if (
                        dataType === AlterationTypeConstants.STRUCTURAL_VARIANT
                    ) {
                        // structural variant profile
                        promises.push(
                            structuralVariantCache.get({ entrezGeneId })
                        );
                        ret.push(coverageInformation);
                        ret.push(samples);
                    } else {
                        // non-mutation profile
                        profileIds.forEach(profileId => {
                            promises.push(
                                numericGeneMolecularDataCache.get({
                                    entrezGeneId,
                                    molecularProfileId: profileId,
                                })
                            );
                        });
                    }
                }
                ret.push(...promises);
            } else {
                ret.push(molecularProfileIdSuffixToMolecularProfiles);
            }
            ret.push(entrezGeneIdToGene);

            return ret;
        },
        invoke: () => {
            const profiles = molecularProfileIdSuffixToMolecularProfiles.result![
                molecularProfileIdSuffix
            ];
            const profileIds = profiles.map(
                profile => profile.molecularProfileId
            );

            const hugoGeneSymbol = entrezGeneIdToGene.result![entrezGeneId]
                .hugoGeneSymbol;

            if (dataType === AlterationTypeConstants.MUTATION_EXTENDED) {
                // mutation profile
                let mutations: AnnotatedMutation[] = [];
                mutations.push(
                    ...annotatedMutationCache.get({ entrezGeneId }).result!
                );

                return Promise.resolve(
                    makeAxisDataPromise_Molecular_MakeMutationData(
                        profileIds,
                        hugoGeneSymbol,
                        mutations,
                        coverageInformation.result!,
                        mutationCountBy,
                        samples.result!
                    )
                );
            } else if (
                dataType === AlterationTypeConstants.STRUCTURAL_VARIANT
            ) {
                // structural variant profile
                let structuralVariants: StructuralVariant[] = [];
                structuralVariants.push(
                    ...structuralVariantCache.get({ entrezGeneId }).result!
                );

                return Promise.resolve(
                    makeAxisDataPromise_Molecular_MakeStructuralVariantData(
                        profileIds,
                        hugoGeneSymbol,
                        structuralVariants,
                        coverageInformation.result!,
                        structuralVariantCountBy,
                        samples.result!
                    )
                );
            } else {
                // non-mutation profile
                const isDiscreteCna = _.every(
                    profiles,
                    profile =>
                        profile.molecularAlterationType ===
                            AlterationTypeConstants.COPY_NUMBER_ALTERATION &&
                        profile.datatype === 'DISCRETE'
                );

                const data: NumericGeneMolecularData[] = _.flatMap(
                    profileIds,
                    profileId =>
                        numericGeneMolecularDataCache.get({
                            entrezGeneId,
                            molecularProfileId: profileId,
                        }).result!
                );

                return Promise.resolve({
                    data: data.map(d => {
                        let value = d.value;
                        if (isDiscreteCna) {
                            const appearance = (cnaToAppearance as any)[
                                d.value
                            ];
                            if (appearance) {
                                value = appearance.legendLabel;
                            }
                        }
                        return {
                            uniqueSampleKey: d.uniqueSampleKey,
                            value,
                        };
                    }),
                    hugoGeneSymbol,
                    datatype: isDiscreteCna ? 'string' : 'number',
                    categoryOrder: isDiscreteCna ? cnaCategoryOrder : undefined,
                } as IAxisData);
            }
        },
    });
}

export function makeAxisDataPromise_Molecular_MakeMutationData(
    molecularProfileIds: string[],
    hugoGeneSymbol: string,
    mutations: Pick<
        AnnotatedMutation,
        | 'uniqueSampleKey'
        | 'proteinChange'
        | 'mutationType'
        | 'putativeDriver'
        | 'tumorAltCount'
        | 'tumorRefCount'
    >[],
    coverageInformation: CoverageInformation,
    mutationCountBy: MutationCountBy,
    samples: Pick<Sample, 'uniqueSampleKey'>[]
): IStringAxisData | INumberAxisData {
    const sampleToMutations = _.groupBy(mutations, m => m.uniqueSampleKey);
    const data: {
        uniqueSampleKey: string;
        value: string | number | string[] | number[];
    }[] = samples
        .map(s => {
            const sampleMutations = sampleToMutations[s.uniqueSampleKey];
            let value: string | string[] | number | number[];

            const isProfiled = _.some(
                isSampleProfiledInMultiple(
                    s.uniqueSampleKey,
                    molecularProfileIds,
                    coverageInformation,
                    hugoGeneSymbol
                ),
                isSampleProfiled => isSampleProfiled === true
            );

            switch (mutationCountBy) {
                case MutationCountBy.MutationType:
                    if (!sampleMutations) {
                        value = isProfiled
                            ? MUT_PROFILE_COUNT_NOT_MUTATED
                            : MUT_PROFILE_COUNT_NOT_PROFILED;
                    } else {
                        const types = _.uniq(
                            sampleMutations.map(
                                m =>
                                    mutationTypeToDisplayName[
                                        getOncoprintMutationType(m)
                                    ]
                            )
                        );
                        value =
                            types.length > 1
                                ? MUT_PROFILE_COUNT_MULTIPLE
                                : types;
                    }
                    break;

                case MutationCountBy.DriverVsVUS:
                    if (!sampleMutations) {
                        value = isProfiled
                            ? MUT_PROFILE_COUNT_NOT_MUTATED
                            : MUT_PROFILE_COUNT_NOT_PROFILED;
                    } else {
                        value = _.some(sampleMutations, m => m.putativeDriver)
                            ? MUT_PROFILE_COUNT_DRIVER
                            : MUT_PROFILE_COUNT_VUS;
                    }
                    break;

                case MutationCountBy.VariantAlleleFrequency:
                    // Filter out samples without mutations
                    if (!sampleMutations) {
                        // Return null to filter out later
                        // These are samples either:
                        // 1. Profiled but no mutation found, or
                        // 2. Not profiled for this gene
                        return null;
                    } else {
                        const vafs: number[] = _(sampleMutations)
                            .map(m => getVariantAlleleFrequency(m)?.vaf)
                            .compact()
                            .value();

                        // Also filter out samples where mutations exist but VAF couldn't be calculated
                        if (vafs.length === 0) {
                            return null;
                        }

                        value = vafs;
                    }
                    break;

                case MutationCountBy.MutatedVsWildType:
                default:
                    if (!sampleMutations) {
                        value = isProfiled
                            ? MUT_PROFILE_COUNT_NOT_MUTATED
                            : MUT_PROFILE_COUNT_NOT_PROFILED;
                    } else {
                        value = MUT_PROFILE_COUNT_MUTATED;
                    }
                    break;
            }

            return {
                uniqueSampleKey: s.uniqueSampleKey,
                value,
            };
        })
        .filter(d => d !== null) as {
        uniqueSampleKey: string;
        value: string | number | string[] | number[];
    }[];

    if (mutationCountBy === MutationCountBy.VariantAlleleFrequency) {
        const hasVafData = mutations.some(
            m => _.isFinite(m.tumorAltCount) && _.isFinite(m.tumorRefCount)
        );

        return {
            data: hasVafData ? data : [],
            hugoGeneSymbol,
            datatype: 'number',
        } as INumberAxisData;
    } else {
        let categoryOrder: string[] = [];
        switch (mutationCountBy) {
            case MutationCountBy.MutationType:
                categoryOrder = mutTypeCategoryOrder;
                break;
            case MutationCountBy.DriverVsVUS:
                categoryOrder = mutDriverVsVUSCategoryOrder;
                break;
            case MutationCountBy.MutatedVsWildType:
            default:
                categoryOrder = mutVsWildCategoryOrder;
                break;
        }

        return {
            data,
            hugoGeneSymbol,
            datatype: 'string',
            categoryOrder,
        } as IStringAxisData;
    }
}
export function makeAxisDataPromise_Molecular_MakeStructuralVariantData(
    molecularProfileIds: string[],
    hugoGeneSymbol: string,
    structuralVariants: StructuralVariant[],
    coverageInformation: CoverageInformation,
    structuralVariantCountBy: StructuralVariantCountBy,
    samples: Pick<Sample, 'uniqueSampleKey'>[]
) {
    // collect mutations by sample by type
    const sampleToVariantClass = _.mapValues(
        _.groupBy(structuralVariants, m => m.uniqueSampleKey),
        sampleMuts => _.uniq(sampleMuts.map(m => m.variantClass))
    );

    const data = samples.map(s => {
        const variantClasses = sampleToVariantClass[s.uniqueSampleKey];
        let value: string | string[];
        if (!variantClasses) {
            // variantClasses would never be an empty array because its generated by _.groupBy,
            //  so we need only check if it exists
            if (
                !_.some(
                    isSampleProfiledInMultiple(
                        s.uniqueSampleKey,
                        molecularProfileIds,
                        coverageInformation,
                        hugoGeneSymbol
                    ),
                    isSampleProfiled => isSampleProfiled === true
                )
            ) {
                // its not profiled
                value = STRUCTURAL_VARIANT_PROFILE_COUNT_NOT_PROFILED;
            } else {
                // otherwise, its profiled and no structural variants
                value = STRUCTURAL_VARIANT_PROFILE_COUNT_NOT_MUTATED;
            }
        } else {
            // we have mutations
            switch (structuralVariantCountBy) {
                case StructuralVariantCountBy.VariantType:
                    // if more than one type, its "Multiple"
                    if (variantClasses.length > 1) {
                        value = STRUCTURAL_VARIANT_PROFILE_COUNT_MULTIPLE;
                    } else {
                        value = variantClasses;
                    }
                    break;
                case StructuralVariantCountBy.MutatedVsWildType:
                default:
                    value = STRUCTURAL_VARIANT_PROFILE_COUNT_MUTATED;
                    break;
            }
        }
        return {
            uniqueSampleKey: s.uniqueSampleKey,
            value,
        };
    });
    return {
        data,
        hugoGeneSymbol,
        datatype: 'string',
    } as IStringAxisData;
}

function makeAxisDataPromise_Geneset(
    genesetId: string,
    molecularProfileIdSuffix: string,
    genesetMolecularDataCachePromise: MobxPromise<GenesetMolecularDataCache>,
    molecularProfileIdSuffixToMolecularProfiles: MobxPromise<{
        [molecularProfileIdSuffix: string]: MolecularProfile[];
    }>
): MobxPromise<IAxisData> {
    return remoteData({
        await: () => [
            genesetMolecularDataCachePromise,
            molecularProfileIdSuffixToMolecularProfiles,
        ],
        invoke: async () => {
            const profiles = molecularProfileIdSuffixToMolecularProfiles.result![
                molecularProfileIdSuffix
            ];
            const makeRequest = true;
            await Promise.all(
                profiles.map(profile =>
                    genesetMolecularDataCachePromise.result!.getPromise(
                        {
                            genesetId,
                            molecularProfileId: profile.molecularProfileId,
                        },
                        makeRequest
                    )
                )
            );

            const data: GenesetMolecularData[] = _.flatMap(
                profiles,
                profile =>
                    genesetMolecularDataCachePromise.result!.get({
                        molecularProfileId: profile.molecularProfileId,
                        genesetId,
                    })!.data!
            );

            return Promise.resolve({
                data: data.map(d => {
                    const value = d.value;
                    return {
                        uniqueSampleKey: d.uniqueSampleKey,
                        value: Number(value),
                    };
                }),
                genesetId: genesetId,
                datatype: 'number',
            });
        },
    });
}

function makeAxisDataPromise_GenericAssay(
    entityId: string,
    molecularProfileIdSuffix: string,
    genericAssayDataType: string,
    genericAssayMolecularDataCachePromise: MobxPromise<
        GenericAssayMolecularDataCache
    >,
    molecularProfileIdSuffixToMolecularProfiles: MobxPromise<{
        [molecularProfileIdSuffix: string]: MolecularProfile[];
    }>
): MobxPromise<IAxisData> {
    return remoteData({
        await: () => [
            genericAssayMolecularDataCachePromise,
            molecularProfileIdSuffixToMolecularProfiles,
        ],
        invoke: async () => {
            const profiles = molecularProfileIdSuffixToMolecularProfiles.result![
                molecularProfileIdSuffix
            ];
            // Only LIMITVALUE is numeric data
            const isNumeric =
                genericAssayDataType === DataTypeConstants.LIMITVALUE;
            const makeRequest = true;
            await Promise.all(
                profiles.map(profile =>
                    genericAssayMolecularDataCachePromise.result!.getPromise(
                        {
                            stableId: entityId,
                            molecularProfileId: profile.molecularProfileId,
                        },
                        makeRequest
                    )
                )
            );

            const data: GenericAssayDataEnhanced[] = _.flatMap(
                profiles,
                profile =>
                    genericAssayMolecularDataCachePromise.result!.get({
                        molecularProfileId: profile.molecularProfileId,
                        stableId: entityId,
                    })!.data!
            );

            if (isNumeric) {
                return Promise.resolve({
                    data: data.map(d => {
                        return {
                            uniqueSampleKey: d.uniqueSampleKey,
                            value: parseFloat(d.value),
                            thresholdType: d.thresholdType,
                        };
                    }),
                    datatype: 'number',
                    genericAssayEntityId: entityId,
                });
            } else {
                // each profile in profiles should share the same generic assay type
                const categoryOrder =
                    profiles.length > 0
                        ? getCategoryOrderByGenericAssayType(
                              profiles[0].genericAssayType
                          )
                        : undefined;
                return Promise.resolve({
                    data: data.map(d => {
                        return {
                            uniqueSampleKey: d.uniqueSampleKey,
                            value: d.value,
                        };
                    }),
                    datatype: 'string',
                    categoryOrder,
                    genericAssayEntityId: entityId,
                } as IStringAxisData);
            }
        },
    });
}

export function makeAxisDataPromise(
    selection: AxisMenuSelection,
    clinicalAttributeIdToClinicalAttribute: MobxPromise<{
        [clinicalAttributeId: string]: ClinicalAttribute;
    }>,
    customAttributeIdToClinicalAttribute: MobxPromise<{
        [clinicalAttributeId: string]: ClinicalAttribute;
    }>,
    molecularProfileIdSuffixToMolecularProfiles: MobxPromise<{
        [molecularProfileIdSuffix: string]: MolecularProfile[];
    }>,
    patientKeyToSamples: MobxPromise<{ [uniquePatientKey: string]: Sample[] }>,
    entrezGeneIdToGene: MobxPromise<{ [entrezGeneId: number]: Gene }>,
    clinicalDataCache: ClinicalDataCache,
    annotatedMutationCache: MobxPromiseCache<
        { entrezGeneId: number },
        AnnotatedMutation[]
    >,
    structuralVariantCache: MobxPromiseCache<
        { entrezGeneId: number },
        StructuralVariant[]
    >,
    numericGeneMolecularDataCache: MobxPromiseCache<
        { entrezGeneId: number; molecularProfileId: string },
        NumericGeneMolecularData[]
    >,
    coverageInformation: MobxPromise<CoverageInformation>,
    samples: MobxPromise<Sample[]>,
    genesetMolecularDataCachePromise: MobxPromise<GenesetMolecularDataCache>,
    genericAssayMolecularDataCachePromise: MobxPromise<
        GenericAssayMolecularDataCache
    >
): MobxPromise<IAxisData> {
    let ret: MobxPromise<IAxisData> = remoteData(
        () => new Promise<IAxisData>(() => 0)
    );

    if (selection.dataType && isGenericAssaySelected(selection)) {
        if (
            selection.genericAssayEntityId !== undefined &&
            selection.dataSourceId !== undefined
        ) {
            ret = makeAxisDataPromise_GenericAssay(
                selection.genericAssayEntityId,
                selection.dataSourceId,
                selection.genericAssayDataType!,
                genericAssayMolecularDataCachePromise,
                molecularProfileIdSuffixToMolecularProfiles
            );
            return ret;
        }
    }

    switch (selection.dataType) {
        case undefined:
            break;
        // when no datatype is selected (`None`), return a resolved Promise that is of the `none` datatype
        case NONE_SELECTED_OPTION_STRING_VALUE:
            ret = remoteData(() =>
                Promise.resolve({
                    data: [],
                    datatype: 'none',
                } as IAxisData)
            );
            break;
        case CLIN_ATTR_DATA_TYPE:
            if (
                selection.dataSourceId !== undefined &&
                clinicalAttributeIdToClinicalAttribute.isComplete
            ) {
                const attribute = clinicalAttributeIdToClinicalAttribute.result![
                    selection.dataSourceId
                ];
                ret = makeAxisDataPromise_Clinical(
                    attribute,
                    clinicalDataCache,
                    patientKeyToSamples
                );
            }
            break;
        case CUSTOM_ATTR_DATA_TYPE:
            if (
                selection.dataSourceId !== undefined &&
                customAttributeIdToClinicalAttribute.isComplete
            ) {
                const attribute = customAttributeIdToClinicalAttribute.result![
                    selection.dataSourceId
                ];
                ret = makeAxisDataPromise_Clinical(
                    attribute,
                    clinicalDataCache,
                    patientKeyToSamples
                );
            }
            break;
        case GENESET_DATA_TYPE:
            if (
                selection.genesetId !== undefined &&
                selection.dataSourceId !== undefined
            ) {
                ret = makeAxisDataPromise_Geneset(
                    selection.genesetId,
                    selection.dataSourceId,
                    genesetMolecularDataCachePromise,
                    molecularProfileIdSuffixToMolecularProfiles
                );
            }
            break;
        default:
            // molecular profile
            if (
                selection.entrezGeneId !== undefined &&
                // && selection.entrezGeneId !== NONE_SELECTED_OPTION_NUMERICAL_VALUE
                selection.dataSourceId !== undefined &&
                selection.dataType != undefined
            ) {
                ret = makeAxisDataPromise_Molecular(
                    selection.entrezGeneId,
                    selection.dataSourceId,
                    selection.dataType,
                    annotatedMutationCache,
                    structuralVariantCache,
                    numericGeneMolecularDataCache,
                    entrezGeneIdToGene,
                    selection.mutationCountBy,
                    selection.structuralVariantCountBy,
                    coverageInformation,
                    samples,
                    molecularProfileIdSuffixToMolecularProfiles
                );
            }
            break;
    }
    return ret;
}

export function tableCellTextColor(val: number, min: number, max: number) {
    if (val > (max + min) / 2) {
        return 'rgb(255,255,255)';
    } else {
        return 'rgb(0,0,0)';
    }
}

export function getAxisLabel(
    selection: AxisMenuSelection,
    molecularProfileIdSuffixToMolecularProfiles: {
        [profileIdSuffix: string]: MolecularProfile[];
    },
    entrezGeneIdToGene: { [entrezGeneId: number]: Gene },
    clinicalAttributeIdToClinicalAttribute: {
        [clinicalAttributeId: string]: ClinicalAttribute;
    },
    customAttributeIdToClinicalAttribute: {
        [clinicalAttributeId: string]: ClinicalAttribute;
    },
    logScaleFunc: IAxisLogScaleParams | undefined
) {
    let label = '';
    const profile = molecularProfileIdSuffixToMolecularProfiles[
        selection.dataSourceId!
    ]
        ? molecularProfileIdSuffixToMolecularProfiles[
              selection.dataSourceId!
          ][0]
        : undefined;
    let transformationSection = '';
    if (logScaleFunc) {
        transformationSection = logScaleFunc.label;
    }
    switch (selection.dataType) {
        case NONE_SELECTED_OPTION_STRING_VALUE:
            break;
        case CUSTOM_ATTR_DATA_TYPE:
            const customAttr =
                customAttributeIdToClinicalAttribute[selection.dataSourceId!];
            if (customAttr) {
                label = customAttr.displayName;
            }
            break;
        case CLIN_ATTR_DATA_TYPE:
            const attribute =
                clinicalAttributeIdToClinicalAttribute[selection.dataSourceId!];
            if (attribute) {
                label = attribute.displayName;
            }
            break;
        case GENESET_DATA_TYPE:
            if (profile && selection.genesetId !== undefined) {
                label = `${selection.genesetId}: ${profile.name}`;
            }
            break;
        default:
            // molecular profile
            if (
                profile &&
                selection.entrezGeneId !== undefined &&
                selection.entrezGeneId !== NONE_SELECTED_OPTION_NUMERICAL_VALUE
            ) {
                const geneSymbol =
                    entrezGeneIdToGene[selection.entrezGeneId].hugoGeneSymbol;
                if (
                    profile.molecularAlterationType ===
                        AlterationTypeConstants.MUTATION_EXTENDED &&
                    selection.mutationCountBy
                ) {
                    switch (selection.mutationCountBy) {
                        case MutationCountBy.MutationType:
                            label = `${geneSymbol}: ${profile.name}`;
                            break;
                        case MutationCountBy.DriverVsVUS:
                            label = `${geneSymbol}: Driver vs VUS Mutations`;
                            break;
                        case MutationCountBy.VariantAlleleFrequency:
                            label = `${geneSymbol}: Variant Allele Frequency`;
                            break;
                        case MutationCountBy.MutatedVsWildType:
                            label = `${geneSymbol}: Mutated vs Wild Type`;
                            break;
                        default:
                            label = `${geneSymbol}: ${profile.name}`;
                            break;
                    }
                } else if (
                    profile.molecularAlterationType ===
                        AlterationTypeConstants.STRUCTURAL_VARIANT &&
                    selection.structuralVariantCountBy
                ) {
                    switch (selection.structuralVariantCountBy) {
                        case StructuralVariantCountBy.VariantType:
                            label = `${geneSymbol}: Variant Type`;
                            break;
                        case StructuralVariantCountBy.MutatedVsWildType:
                            label = `${geneSymbol}: Variant vs No Variant`;
                            break;
                        default:
                            label = `${geneSymbol}: ${profile.name}`;
                            break;
                    }
                } else {
                    label = `${geneSymbol}: ${profile.name}`;
                }
            }
            break;
    }
    // override axis label for Generic Assay profiles
    if (selection.dataType && isGenericAssaySelected(selection)) {
        if (
            !!(
                profile &&
                selection.selectedGenericAssayOption &&
                selection.selectedGenericAssayOption.plotAxisLabel
            )
        ) {
            const genericAssayEntityName =
                selection.selectedGenericAssayOption.plotAxisLabel;
            label = `${genericAssayEntityName}: ${profile.name}`;
        }
    }

    if (transformationSection) {
        label += ` (${transformationSection})`;
    }
    return label;
}

export function getAxisDescription(
    selection: AxisMenuSelection,
    molecularProfileIdToMolecularProfile: {
        [molecularProfileId: string]: MolecularProfile;
    },
    clinicalAttributeIdToClinicalAttribute: {
        [clinicalAttributeId: string]: ClinicalAttribute;
    },
    customAttributeIdToClinicalAttribute: {
        [clinicalAttributeId: string]: ClinicalAttribute;
    }
) {
    let ret = '';
    switch (selection.dataType) {
        case CUSTOM_ATTR_DATA_TYPE:
            const customAttr =
                customAttributeIdToClinicalAttribute[selection.dataSourceId!];
            if (customAttr) {
                ret = customAttr.description;
            }
            break;
        case CLIN_ATTR_DATA_TYPE:
            const attribute =
                clinicalAttributeIdToClinicalAttribute[selection.dataSourceId!];
            if (attribute) {
                ret = attribute.description;
            }
            break;
        default:
            // molecular profile
            const profile =
                molecularProfileIdToMolecularProfile[selection.dataSourceId!];
            if (profile) {
                ret = profile.description;
            }
            break;
    }
    return ret;
}

export const basicAppearance = {
    fill: '#00AAF8',
    stroke: '#0089C6',
    strokeOpacity: 1,
};

const NON_CNA_STROKE_OPACITY = 0.5;

export const oncoprintMutationTypeToAppearanceDrivers: {
    [mutType: string]: {
        symbol: string;
        fill: string;
        stroke: string;
        strokeOpacity: number;
        legendLabel: string;
    };
} = {
    inframe: {
        symbol: 'circle',
        fill: MUT_COLOR_INFRAME_PASSENGER,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Inframe (VUS)',
    },
    'inframe.driver': {
        symbol: 'circle',
        fill: MUT_COLOR_INFRAME,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Inframe (Driver)',
    },
    missense: {
        symbol: 'circle',
        fill: MUT_COLOR_MISSENSE_PASSENGER,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Missense (VUS)',
    },
    'missense.driver': {
        symbol: 'circle',
        fill: MUT_COLOR_MISSENSE,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Missense (Driver)',
    },
    fusion: {
        symbol: 'circle',
        fill: STRUCTURAL_VARIANT_COLOR,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Fusion',
    },
    trunc: {
        symbol: 'circle',
        fill: MUT_COLOR_TRUNC_PASSENGER,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Truncating (VUS)',
    },
    'trunc.driver': {
        symbol: 'circle',
        fill: MUT_COLOR_TRUNC,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Truncating (Driver)',
    },
    splice: {
        symbol: 'circle',
        fill: MUT_COLOR_SPLICE_PASSENGER,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Splice (VUS)',
    },
    'splice.driver': {
        symbol: 'circle',
        fill: MUT_COLOR_SPLICE,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Splice (Driver)',
    },
    promoter: {
        symbol: 'circle',
        fill: MUT_COLOR_PROMOTER_PASSENGER,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Promoter (VUS)',
    },
    'promoter.driver': {
        symbol: 'circle',
        fill: MUT_COLOR_PROMOTER,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Promoter (Driver)',
    },
    other: {
        symbol: 'circle',
        fill: MUT_COLOR_OTHER_PASSENGER,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Other (VUS)',
    },
    'other.driver': {
        symbol: 'circle',
        fill: MUT_COLOR_OTHER,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Other (Driver)',
    },
};

export const oncoprintMutationTypeToAppearanceDefault: {
    [mutType: string]: {
        symbol: string;
        fill: string;
        stroke: string;
        strokeOpacity: number;
        legendLabel: string;
    };
} = {
    inframe: {
        symbol: 'circle',
        fill: MUT_COLOR_INFRAME,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Inframe',
    },
    missense: {
        symbol: 'circle',
        fill: MUT_COLOR_MISSENSE,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Missense',
    },
    fusion: {
        symbol: 'circle',
        fill: STRUCTURAL_VARIANT_COLOR,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Fusion',
    },
    trunc: {
        symbol: 'circle',
        fill: MUT_COLOR_TRUNC,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Truncating',
    },
    promoter: {
        symbol: 'circle',
        fill: MUT_COLOR_PROMOTER,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Promoter',
    },
    other: {
        symbol: 'circle',
        fill: MUT_COLOR_OTHER,
        stroke: '#000000',
        strokeOpacity: NON_CNA_STROKE_OPACITY,
        legendLabel: 'Other',
    },
};

export const notProfiledCnaAndSvAppearance = {
    symbol: 'circle',
    stroke: BLACK,
    strokeOpacity: 1,
};
export const notProfiledMutationsAppearance = {
    symbol: 'circle',
    stroke: LIGHT_GREY,
    strokeOpacity: 1,
    fill: '#ffffff',
};
export const noDataClinicalAppearance = Object.assign(
    {},
    notProfiledMutationsAppearance,
    { fill: LIGHT_GREY }
);

export const mutationLegendOrder = [
    'fusion',
    'promoter.driver',
    'promoter',
    'splice.driver',
    'splice',
    'trunc.driver',
    'trunc',
    'inframe.driver',
    'inframe',
    'missense.driver',
    'missense',
    'other.driver',
    'other',
];
export const mutationRenderPriority = stringListToIndexSet([
    'fusion',
    'promoter.driver',
    'splice.driver',
    'trunc.driver',
    'inframe.driver',
    'missense.driver',
    'other.driver',
    'promoter',
    'splice',
    'trunc',
    'inframe',
    'missense',
    'other',
    MUTATION_TYPE_NOT_MUTATED,
    MUTATION_TYPE_NOT_PROFILED,
]);

export const noMutationAppearance = {
    symbol: 'circle',
    fill: '#c4e5f5',
    stroke: '#000000',
    strokeOpacity: 0.3,
    legendLabel: 'Not mutated',
};

const cnaToAppearance = {
    '-2': {
        legendLabel: 'Deep Deletion',
        stroke: CNA_COLOR_HOMDEL,
        strokeOpacity: 1,
    },
    '-1': {
        legendLabel: 'Shallow Deletion',
        stroke: '#2aced4',
        strokeOpacity: 1,
    },
    '0': {
        legendLabel: 'Diploid',
        stroke: DEFAULT_GREY,
        strokeOpacity: 1,
    },
    '1': {
        legendLabel: 'Gain',
        stroke: '#ff8c9f',
        strokeOpacity: 1,
    },
    '2': {
        legendLabel: 'Amplification',
        stroke: CNA_COLOR_AMP,
        strokeOpacity: 1,
    },
};

const svAppearance = {
    legendLabel: `Structural Variant \u00B9`,
    stroke: STRUCTURAL_VARIANT_COLOR,
    strokeOpacity: 1,
};

export const limitValueAppearance = {
    legendLabel: `Limit value`,
    symbol: 'diamond',
};

export const waterfallSearchIndicatorAppearance = {
    legendLabel: 'Sample match',
    symbol: 'plus',
    fill: 'white',
    fillOpacity: 1,
    stroke: 'red',
    strokeWidth: 1,
    strokeOpacity: 1,
    size: 3,
};

const cnaCategoryOrder = ['-2', '-1', '0', '1', '2'].map(
    x => (cnaToAppearance as any)[x].legendLabel
);
export const MUT_PROFILE_COUNT_DRIVER = 'Driver';
export const MUT_PROFILE_COUNT_VUS = 'VUS';
export const MUT_PROFILE_COUNT_MUTATED = 'Mutated';
export const MUT_PROFILE_COUNT_MULTIPLE = 'Multiple';
export const MUT_PROFILE_COUNT_NOT_MUTATED = 'No mutation';
export const MUT_PROFILE_COUNT_NOT_PROFILED = 'Not profiled';
export const STRUCTURAL_VARIANT_PROFILE_COUNT_MUTATED =
    'With Structural Variants';
export const STRUCTURAL_VARIANT_PROFILE_COUNT_MULTIPLE =
    'Multiple structural variants';
export const STRUCTURAL_VARIANT_PROFILE_COUNT_NOT_MUTATED =
    'No Structural Variants';
export const STRUCTURAL_VARIANT_PROFILE_COUNT_NOT_PROFILED =
    'Not profiled for structural variants';
export const mutTypeCategoryOrder = [
    mutationTypeToDisplayName.missense,
    mutationTypeToDisplayName.inframe,
    mutationTypeToDisplayName.trunc,
    mutationTypeToDisplayName.splice,
    mutationTypeToDisplayName.promoter,
    mutationTypeToDisplayName.other,
    MUT_PROFILE_COUNT_MULTIPLE,
    MUT_PROFILE_COUNT_NOT_MUTATED,
    MUT_PROFILE_COUNT_NOT_PROFILED,
];
export const mutVsWildCategoryOrder = [
    MUT_PROFILE_COUNT_MUTATED,
    MUT_PROFILE_COUNT_NOT_MUTATED,
    MUT_PROFILE_COUNT_NOT_PROFILED,
];
export const mutDriverVsVUSCategoryOrder = [
    MUT_PROFILE_COUNT_DRIVER,
    MUT_PROFILE_COUNT_VUS,
    MUT_PROFILE_COUNT_NOT_MUTATED,
    MUT_PROFILE_COUNT_NOT_PROFILED,
];

export const cnaRenderPriority = stringListToIndexSet([
    '-2',
    '2',
    '-1',
    '1',
    '0',
    CNA_TYPE_NOT_PROFILED,
]);

function getMutationTypeAppearance(
    d: IPlotSampleData,
    oncoprintMutationTypeToAppearance: {
        [mutType: string]: {
            symbol: string;
            fill: string;
            stroke: string;
            strokeOpacity: number;
            legendLabel: string;
        };
    }
) {
    if (!isPointProfiledForMutations(d)) {
        return notProfiledMutationsAppearance;
    } else if (!doesPointHaveMutationData(d)) {
        return noMutationAppearance;
    } else {
        return oncoprintMutationTypeToAppearance[d.dispMutationType!];
    }
}
function getCnaAndSvAppearance(
    d: IPlotSampleData,
    coloringTypes: SelectedColoringTypes
) {
    const hasSvData =
        ColoringType.StructuralVariant in coloringTypes &&
        doesPointHaveSvData(d);
    const hasCnaData =
        ColoringType.CopyNumber in coloringTypes && doesPointHaveCnaData(d);

    const isUnprofiledCna =
        ColoringType.CopyNumber in coloringTypes
            ? !isPointProfiledForCna(d)
            : true;
    const isUnprofiledSv =
        ColoringType.StructuralVariant in coloringTypes
            ? !isPointProfiledForSv(d)
            : true;

    if (isUnprofiledCna && isUnprofiledSv) {
        return notProfiledCnaAndSvAppearance;
    } else if (hasSvData) {
        // prioritize sv over cna
        return svAppearance;
    } else if (hasCnaData) {
        const cnaValue = (d.dispCna ? d.dispCna.value : 0) as
            | -2
            | -1
            | 0
            | 1
            | 2;
        return cnaToAppearance[cnaValue];
    } else {
        return cnaToAppearance['0'];
    }
}

function getLimitValueAppearance(d: IPlotSampleData) {
    if (dataPointIsLimited(d)) {
        return limitValueAppearance;
    } else {
        return {};
    }
}

export function makeScatterPlotPointAppearance(
    coloringType: SelectedColoringTypes,
    mutationDataExists: boolean,
    cnaDataExists: boolean,
    svDataExists: boolean,
    driversAnnotated: boolean,
    coloringMenuSelectedOption?: ColoringMenuOmnibarOption | undefined,
    clinicalDataCache?: ClinicalDataCache,
    coloringLogScale?: boolean
): (
    d: IPlotSampleData
) => {
    stroke: string;
    strokeOpacity: number;
    fill?: string;
    fillOpacity?: number;
    symbol?: string;
} {
    const oncoprintMutationTypeToAppearance = driversAnnotated
        ? oncoprintMutationTypeToAppearanceDrivers
        : oncoprintMutationTypeToAppearanceDefault;

    let ret = null;

    if (ColoringType.ClinicalData in coloringType) {
        // clinical data precludes all others
        ret = makeScatterPlotPointAppearance_Clinical(
            coloringMenuSelectedOption,
            clinicalDataCache,
            coloringLogScale
        );
    } else {
        let getMutApp: any = () => ({});
        let getCnaApp: any = () => ({});
        let getLimitValueApp: any = () => ({});
        if (ColoringType.MutationType in coloringType && mutationDataExists) {
            getMutApp = (d: IPlotSampleData) =>
                getMutationTypeAppearance(d, oncoprintMutationTypeToAppearance);
        }
        if (
            (cnaDataExists && ColoringType.CopyNumber in coloringType) ||
            (svDataExists && ColoringType.StructuralVariant in coloringType)
        ) {
            getCnaApp = getCnaAndSvAppearance;
        }
        if (ColoringType.LimitVal in coloringType) {
            getLimitValueApp = getLimitValueAppearance;
        }
        return (d: IPlotSampleData) => {
            return Object.assign(
                {},
                basicAppearance,
                getMutApp(d),
                getCnaApp(d, coloringType),
                getLimitValueApp(d)
            );
        };
    }
    // By default, return basic appearance
    return ret || (() => basicAppearance);
}

function makeScatterPlotPointAppearance_Clinical(
    coloringMenuSelectedOption: ColoringMenuOmnibarOption | undefined,
    clinicalDataCache: ClinicalDataCache | undefined,
    coloringLogScale?: boolean
) {
    let ret = null;
    if (coloringMenuSelectedOption && clinicalDataCache) {
        const data = clinicalDataCache.get(
            coloringMenuSelectedOption.info.clinicalAttribute!
        );
        if (data.isComplete) {
            if (
                coloringMenuSelectedOption.info.clinicalAttribute!.datatype ===
                'STRING'
            ) {
                const categoryToColor = data.result!.categoryToColor!;
                ret = (d: IPlotSampleData) => {
                    if (doesPointHaveClinicalData(d)) {
                        return {
                            stroke: '#000000',
                            strokeOpacity: NON_CNA_STROKE_OPACITY,
                            fill:
                                categoryToColor[d.dispClinicalValue! as string],
                            fillOpacity: 1,
                            symbol: 'circle',
                        };
                    } else {
                        return noDataClinicalAppearance;
                    }
                };
            } else if (
                coloringMenuSelectedOption.info.clinicalAttribute!.datatype ===
                'NUMBER'
            ) {
                let numericalValueToColor: (x: number) => string;
                if (
                    coloringLogScale &&
                    data.result!.logScaleNumericalValueToColor
                ) {
                    // if log scale coloring is selected and its available, use it
                    numericalValueToColor = data.result!
                        .logScaleNumericalValueToColor;
                } else {
                    // otherwise use linear scale
                    numericalValueToColor = data.result!.numericalValueToColor!;
                }

                ret = (d: IPlotSampleData) => {
                    if (doesPointHaveClinicalData(d)) {
                        return {
                            stroke: '#000000',
                            strokeOpacity: NON_CNA_STROKE_OPACITY,
                            fill: numericalValueToColor(
                                d.dispClinicalValue! as number
                            ),
                            fillOpacity: 1,
                            symbol: 'circle',
                        };
                    } else {
                        return noDataClinicalAppearance;
                    }
                };
            }
        }
    }
    return ret;
}

function mutationsProteinChanges(
    mutations: Mutation[],
    entrezGeneIdToGene: { [entrezGeneId: number]: Gene }
) {
    const mutationsByGene = _.groupBy(
        mutations,
        m => entrezGeneIdToGene[m.entrezGeneId].hugoGeneSymbol
    );
    const sorted = _.chain(mutationsByGene)
        .entries()
        .sortBy(x => x[0])
        .value();
    return sorted.map(
        entry =>
            `${entry[0]}: ${entry[1]
                .filter(m => !!m.proteinChange)
                .map(m => m.proteinChange)
                .join(', ')}`
    );
}

export function tooltipMutationsSection<D extends IPlotSampleData>(datum: D) {
    if (!isPointProfiledForMutations(datum)) {
        return <span>Not profiled for mutations.</span>;
    } else if (datum.mutations.length === 0) {
        return null;
    }
    const mutations = datum.mutations;
    const oncoKbIcon = (mutation: AnnotatedMutation) => (
        <img
            src={ONCOKB_ONCOGENIC_ICON}
            title={mutation.oncoKbOncogenic}
            style={{ height: 11, width: 11, marginLeft: 2, marginBottom: 2 }}
        />
    );
    const hotspotIcon = (
        <img
            src={require('../../../rootImages/cancer-hotspots.svg')}
            title="Hotspot"
            style={{ height: 11, width: 11, marginLeft: 2, marginBottom: 3 }}
        />
    );
    const mutationsByGene = _.groupBy(
        mutations.filter(m => !!m.proteinChange),
        m => m.hugoGeneSymbol
    );
    const sorted = _.chain(mutationsByGene)
        .entries()
        .sortBy(x => x[0])
        .value();
    return (
        <span>
            {sorted.map(entry => {
                const proteinChangeComponents = [];
                for (const mutation of entry[1]) {
                    proteinChangeComponents.push(
                        <span key={mutation.proteinChange}>
                            {mutation.proteinChange}
                            <span style={{ marginLeft: 1 }}>
                                {mutation.isHotspot ? hotspotIcon : null}
                                {mutation.oncoKbOncogenic
                                    ? oncoKbIcon(mutation)
                                    : null}
                            </span>
                        </span>
                    );
                    proteinChangeComponents.push(<span>, </span>);
                }
                proteinChangeComponents.pop(); // remove last comma
                return (
                    <span>
                        {entry[0]}: {proteinChangeComponents}
                    </span>
                );
            })}
        </span>
    );
}

export function tooltipCnaSection<D extends IPlotSampleData>(datum: D) {
    if (!isPointProfiledForCna(datum)) {
        return <span>Not profiled for copy number alterations.</span>;
    } else if (datum.copyNumberAlterations.length === 0) {
        return null;
    }
    const data = datum.copyNumberAlterations;
    const oncoKbIcon = (alt: AnnotatedNumericGeneMolecularData) => (
        <img
            src={ONCOKB_ONCOGENIC_ICON}
            title={alt.oncoKbOncogenic}
            style={{ height: 11, width: 11, marginLeft: 2, marginBottom: 2 }}
        />
    );
    const altsByGene = _.groupBy(data, alt => alt.hugoGeneSymbol);
    const sorted = _.chain(altsByGene)
        .entries()
        .sortBy(x => x[0])
        .value();
    return (
        <span>
            {sorted.map(entry => {
                const alterationComponents = [];
                for (const alt of entry[1]) {
                    if (alt.value in cnaToAppearance) {
                        alterationComponents.push(
                            <span key={alt.value}>
                                {
                                    (cnaToAppearance as any)[alt.value]
                                        .legendLabel
                                }
                                <span style={{ marginLeft: 1 }}>
                                    {alt.oncoKbOncogenic
                                        ? oncoKbIcon(alt)
                                        : null}
                                </span>
                            </span>
                        );
                        alterationComponents.push(<span>, </span>);
                    }
                }
                alterationComponents.pop(); // remove last comma
                return (
                    <span>
                        {entry[0]}: {alterationComponents}
                    </span>
                );
            })}
        </span>
    );
}

function tooltipSvSection<D extends IPlotSampleData>(datum: D) {
    if (!isPointProfiledForSv(datum)) {
        return <span>Not profiled for structural variants.</span>;
    } else if (datum.structuralVariants.length === 0) {
        return null;
    }
    return (
        <span>
            {`Structural Variant: `}
            {joinJsx(
                datum.structuralVariants.map(v => (
                    <span style={{ fontWeight: 'bold' }}>{v.variantClass}</span>
                )),
                <span>{`, `}</span>
            )}
        </span>
    );
}

function tooltipClinicalDataSection(
    clinicalValue: string | number | undefined,
    clinicalAttribute?: ClinicalAttribute
) {
    if (clinicalAttribute) {
        return (
            <span>
                {clinicalAttribute.displayName}:{' '}
                <b>
                    {clinicalValue === undefined
                        ? NO_DATA_CLINICAL_LEGEND_LABEL
                        : typeof clinicalValue === 'string'
                        ? clinicalValue
                        : clinicalValue.toFixed(2)}
                </b>
            </span>
        );
    } else {
        return null;
    }
}

function sampleIdForTooltip<D extends IPlotSampleData>(
    d: D,
    studyIdToStudy: { [studyId: string]: CancerStudy }
) {
    return (
        <>
            <a
                href={getSampleViewUrl(d.studyId, d.sampleId)}
                target="_blank"
                style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}
            >
                {d.sampleId}
            </a>
            {_.values(studyIdToStudy).length > 1 && [
                // show study id if more than one study in query
                <br />,
                <a
                    href={getStudySummaryUrl(d.studyId)}
                    target="_blank"
                    style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}
                >
                    {studyIdToStudy[d.studyId].name}
                </a>,
            ]}
        </>
    );
}

function generalScatterPlotTooltip<D extends IPlotSampleData>(
    d: D,
    studyIdToStudy: { [studyId: string]: CancerStudy },
    getHorzCoord: (d: D) => any,
    getVertCoord: (d: D) => any,
    horzKeyThresholdType: keyof D,
    vertKeyThresholdType: keyof D,
    coloringClinicalAttribute?: ClinicalAttribute
) {
    const mutationsSection = tooltipMutationsSection(d);
    const cnaSection = tooltipCnaSection(d);
    const svSection = tooltipSvSection(d);

    let clinicalDataSection: any = null;
    if (coloringClinicalAttribute) {
        clinicalDataSection = tooltipClinicalDataSection(
            d.dispClinicalValue,
            coloringClinicalAttribute
        );
    }

    let horzCoord = getHorzCoord(d);
    let vertCoord = getVertCoord(d);

    if (typeof horzCoord === 'number') {
        horzCoord = toFixedWithoutTrailingZeros(horzCoord, 2);
    }
    if (typeof vertCoord === 'number') {
        vertCoord = toFixedWithoutTrailingZeros(vertCoord, 2);
    }

    let horzLabel = horzKeyThresholdType
        ? `${d[horzKeyThresholdType]}${horzCoord}`
        : horzCoord;
    let vertLabel = vertKeyThresholdType
        ? `${d[vertKeyThresholdType]}${vertCoord}`
        : vertCoord;
    return (
        <div>
            {sampleIdForTooltip(d, studyIdToStudy)}
            <div>
                Horizontal:{' '}
                <span style={{ fontWeight: 'bold' }}> {horzLabel}</span>
            </div>
            <div>
                Vertical:{' '}
                <span style={{ fontWeight: 'bold' }}> {vertLabel}</span>
            </div>
            {mutationsSection}
            {!!mutationsSection && <br />}
            {cnaSection}
            {!!cnaSection && <br />}
            {svSection}
            {!!svSection && <br />}
            {clinicalDataSection}
        </div>
    );
}

export function waterfallPlotTooltip(
    d: IWaterfallPlotData,
    studyIdToStudy: { [studyId: string]: CancerStudy },
    coloringClinicalAttribute?: ClinicalAttribute
) {
    return generalWaterfallPlotTooltip<IWaterfallPlotData>(
        d,
        studyIdToStudy,
        'value',
        'thresholdType',
        coloringClinicalAttribute
    );
}

function generalWaterfallPlotTooltip<D extends IWaterfallPlotData>(
    d: D,
    studyIdToStudy: { [studyId: string]: CancerStudy },
    valueKey: keyof D,
    thresholdTypeKey?: keyof D,
    coloringClinicalAttribute?: ClinicalAttribute
) {
    const mutationsSection = tooltipMutationsSection(d);
    const cnaSection = tooltipCnaSection(d);
    const svSection = tooltipSvSection(d);
    let clinicalDataSection: any = null;
    if (coloringClinicalAttribute) {
        clinicalDataSection = tooltipClinicalDataSection(
            d.dispClinicalValue,
            coloringClinicalAttribute
        );
    }

    let value: any = d[valueKey];
    value = value.toFixed(4);
    const thresholdType =
        thresholdTypeKey && d[thresholdTypeKey] ? d[thresholdTypeKey] : '';

    return (
        <div>
            {sampleIdForTooltip(d, studyIdToStudy)}
            <div>
                Value:{' '}
                <span style={{ fontWeight: 'bold' }}>
                    {' '}
                    {thresholdType}
                    {value}{' '}
                </span>
            </div>
            {mutationsSection}
            {!!mutationsSection && <br />}
            {cnaSection}
            {!!cnaSection && <br />}
            {svSection}
            {!!svSection && <br />}
            {clinicalDataSection}
        </div>
    );
}

export function scatterPlotTooltip(
    d: IScatterPlotData,
    studyIdToStudy: { [studyId: string]: CancerStudy },
    logX?: IAxisLogScaleParams | undefined,
    logY?: IAxisLogScaleParams | undefined,
    coloringClinicalAttribute?: ClinicalAttribute
) {
    return generalScatterPlotTooltip(
        d,
        studyIdToStudy,
        logX ? d => logX.fLogScale(d.x) : d => d.x,
        logY ? d => logY.fLogScale(d.y) : d => d.y,
        'xThresholdType',
        'yThresholdType',
        coloringClinicalAttribute
    );
}

export function boxPlotTooltip(
    d: IBoxScatterPlotPoint,
    studyIdToStudy: { [studyId: string]: CancerStudy },
    horizontal: boolean,
    log?: IAxisLogScaleParams | undefined,
    coloringClinicalAttribute?: ClinicalAttribute
) {
    let horzAxisKey: keyof IBoxScatterPlotPoint = horizontal
        ? 'value'
        : 'category';
    let vertAxisKey: keyof IBoxScatterPlotPoint = horizontal
        ? 'category'
        : 'value';
    let horzThresholdTypeKey = horizontal
        ? 'thresholdType'
        : (undefined as any);
    let vertThresholdTypeKey = horizontal
        ? undefined
        : ('thresholdType' as any);
    return generalScatterPlotTooltip(
        d,
        studyIdToStudy,
        log && horizontal ? d => log.fLogScale(d.value) : d => d[horzAxisKey],
        log && !horizontal ? d => log.fLogScale(d.value) : d => d[vertAxisKey],
        horzThresholdTypeKey,
        vertThresholdTypeKey,
        coloringClinicalAttribute
    );
}

export function logScalePossibleForProfile(profileId: string) {
    return !/zscore/i.test(profileId) && /rna_seq/i.test(profileId);
}

export function logScalePossible(
    axisSelection: AxisMenuSelection,
    axisData?: IAxisData
) {
    if (
        axisData &&
        isNumberData(axisData) &&
        !axisHasNegativeNumbers(axisData)
    ) {
        return true;
    } else if (
        axisData &&
        isGenericAssaySelected(axisSelection) &&
        axisSelection.genericAssayDataType === DataTypeConstants.LIMITVALUE
    ) {
        // Check negative values in log scale
        return axisHasNegativeNumbers(axisData) ? false : true;
    } else {
        // molecular profile
        return !!(
            axisSelection.dataSourceId &&
            logScalePossibleForProfile(axisSelection.dataSourceId)
        );
    }
}

export function makeBoxScatterPlotData(
    horzData: IStringAxisData,
    vertData: INumberAxisData,
    uniqueSampleKeyToSample: { [uniqueSampleKey: string]: Sample },
    coverageInformation: CoverageInformation['samples'],
    mutations?: {
        molecularProfileIds: string[];
        data: AnnotatedMutation[];
    },
    copyNumberAlterations?: {
        molecularProfileIds: string[];
        data: CustomDriverNumericGeneMolecularData[];
    },
    structuralVariants?: {
        molecularProfileIds: string[];
        data: StructuralVariant[];
    },
    selectedGeneForStyling?: Gene,
    clinicalData?: {
        clinicalAttribute: ClinicalAttribute;
        data: ClinicalData[];
    }
): IBoxScatterPlotData<IBoxScatterPlotPoint>[] {
    const boxScatterPlotPoints = makeScatterPlotData(
        horzData,
        vertData,
        uniqueSampleKeyToSample,
        coverageInformation,
        mutations,
        copyNumberAlterations,
        structuralVariants,
        selectedGeneForStyling,
        clinicalData
    );
    const categoryToData = _.groupBy(boxScatterPlotPoints, p => p.category);
    let ret = _.entries(categoryToData).map(entry => ({
        label: entry[0],
        data: entry[1],
        median: jStat.median(
            entry[1].map((d: IBoxScatterPlotPoint) => d.value)
        ),
    }));
    const categoryOrder = horzData.categoryOrder;
    if (categoryOrder) {
        ret = _.sortBy(ret, datum => categoryOrder.indexOf(datum.label));
    } else {
        // default sort alphabetically
        ret = _.sortBy(ret, datum => datum.label);
    }
    return ret;
}

export function makeScatterPlotData(
    horzData: IStringAxisData,
    vertData: INumberAxisData,
    uniqueSampleKeyToSample: { [uniqueSampleKey: string]: Sample },
    coverageInformation: CoverageInformation['samples'],
    mutations?: {
        molecularProfileIds: string[];
        data: AnnotatedMutation[];
    },
    copyNumberAlterations?: {
        molecularProfileIds: string[];
        data: CustomDriverNumericGeneMolecularData[];
    },
    structuralVariants?: {
        molecularProfileIds: string[];
        data: StructuralVariant[];
    },
    selectedGeneForStyling?: Gene,
    clinicalData?: {
        clinicalAttribute: ClinicalAttribute;
        data: ClinicalData[];
    }
): IBoxScatterPlotPoint[];

export function makeScatterPlotData(
    horzData: INumberAxisData,
    vertData: INumberAxisData,
    uniqueSampleKeyToSample: { [uniqueSampleKey: string]: Sample },
    coverageInformation: CoverageInformation['samples'],
    mutations?: {
        molecularProfileIds: string[];
        data: AnnotatedMutation[];
    },
    copyNumberAlterations?: {
        molecularProfileIds: string[];
        data: CustomDriverNumericGeneMolecularData[];
    },
    structuralVariants?: {
        molecularProfileIds: string[];
        data: StructuralVariant[];
    },
    selectedGeneForStyling?: Gene,
    clinicalData?: {
        clinicalAttribute: ClinicalAttribute;
        data: ClinicalData[];
    }
): IScatterPlotData[];

export function makeScatterPlotData(
    horzData: INumberAxisData | IStringAxisData,
    vertData: INumberAxisData,
    uniqueSampleKeyToSample: { [uniqueSampleKey: string]: Sample },
    coverageInformation: CoverageInformation['samples'],
    mutations?: {
        molecularProfileIds: string[];
        data: AnnotatedMutation[];
    },
    copyNumberAlterations?: {
        molecularProfileIds: string[];
        data: AnnotatedNumericGeneMolecularData[];
    },
    structuralVariants?: {
        molecularProfileIds: string[];
        data: StructuralVariant[];
    },
    selectedGeneForStyling?: Gene,
    clinicalData?: {
        clinicalAttribute: ClinicalAttribute;
        data: ClinicalData[];
    }
): IScatterPlotData[] | IBoxScatterPlotPoint[] {
    const mutationsMap: {
        [uniqueSampleKey: string]: AnnotatedMutation[];
    } = mutations ? _.groupBy(mutations.data, m => m.uniqueSampleKey) : {};

    const cnaMap: {
        [uniqueSampleKey: string]: AnnotatedNumericGeneMolecularData[];
    } = copyNumberAlterations
        ? _.groupBy(copyNumberAlterations.data, d => d.uniqueSampleKey)
        : {};

    const structuralVariantMap: {
        [uniqueSampleKey: string]: StructuralVariant[];
    } = structuralVariants
        ? _.groupBy(structuralVariants.data, d => d.uniqueSampleKey)
        : {};

    let clinicalDataMap: {
        [uniqueKey: string]: ClinicalData;
    } = {};
    if (clinicalData) {
        if (clinicalData.clinicalAttribute.patientAttribute) {
            clinicalDataMap = _.keyBy(
                clinicalData.data,
                d => d.uniquePatientKey
            );
        } else {
            clinicalDataMap = _.keyBy(
                clinicalData.data,
                d => d.uniqueSampleKey
            );
        }
    }
    const dataMap: {
        [uniqueSampleKey: string]: Partial<
            IPlotSampleData & {
                horzValues: string[] | number[];
                horzThresholdTypes: string[];
                vertValues: number[];
                vertThresholdTypes: string[];
                jitter: number;
            }
        >;
    } = {};
    for (const d of horzData.data) {
        const sample = uniqueSampleKeyToSample[d.uniqueSampleKey];
        const sampleCopyNumberAlterations:
            | AnnotatedNumericGeneMolecularData[]
            | undefined = cnaMap[d.uniqueSampleKey];
        let dispCna: AnnotatedNumericGeneMolecularData | undefined = undefined;
        if (sampleCopyNumberAlterations && sampleCopyNumberAlterations.length) {
            dispCna = sampleCopyNumberAlterations[0];
            for (const alt of sampleCopyNumberAlterations) {
                if (Math.abs(alt.value) > Math.abs(dispCna.value)) {
                    dispCna = alt;
                }
            }
        }
        let dispMutationType: OncoprintMutationType | undefined = undefined;
        const sampleMutations: AnnotatedMutation[] | undefined =
            mutationsMap[d.uniqueSampleKey];
        if (sampleMutations && sampleMutations.length) {
            const counts = _.chain(sampleMutations)
                .groupBy(mutation => {
                    const mutationType = getOncoprintMutationType(mutation);
                    const driverSuffix =
                        mutationType !== 'promoter' &&
                        mutationType !== 'other' &&
                        mutation.putativeDriver
                            ? '.driver'
                            : '';
                    return `${mutationType}${driverSuffix}`;
                })
                .mapValues(muts => muts.length)
                .value();
            dispMutationType = selectDisplayValue(
                counts,
                mutationRenderPriority
            ) as OncoprintMutationType;
        }
        let dispStructuralVariant: string | undefined = undefined;
        const sampleSv: StructuralVariant[] | undefined =
            structuralVariantMap[d.uniqueSampleKey];
        if (sampleSv && sampleSv.length) {
            dispStructuralVariant = sampleSv
                .map(sv => sv.variantClass)
                .join(', ');
        }

        const sampleCoverageInfo = coverageInformation[d.uniqueSampleKey];
        let isProfiledMutations = undefined;
        let isProfiledCna = undefined;
        let isProfiledStructuralVariants = undefined;
        if (mutations || copyNumberAlterations || structuralVariants) {
            const profiledReport = makeScatterPlotData_profiledReport(
                selectedGeneForStyling
                    ? selectedGeneForStyling.hugoGeneSymbol
                    : horzData.hugoGeneSymbol,
                selectedGeneForStyling
                    ? selectedGeneForStyling.hugoGeneSymbol
                    : vertData.hugoGeneSymbol,
                sampleCoverageInfo
            );
            if (mutations) {
                isProfiledMutations = _.some(
                    mutations.molecularProfileIds,
                    id => !!profiledReport[id]
                );
            }
            if (copyNumberAlterations) {
                isProfiledCna = _.some(
                    copyNumberAlterations.molecularProfileIds,
                    id => !!profiledReport[id]
                );
            }
            if (structuralVariants) {
                isProfiledStructuralVariants = _.some(
                    structuralVariants.molecularProfileIds,
                    id => !!profiledReport[id]
                );
            }
        }
        let dispClinicalValue: string | number | undefined = undefined;
        let sampleClinicalData;
        if (clinicalData && clinicalData.clinicalAttribute.patientAttribute) {
            sampleClinicalData =
                clinicalDataMap[
                    uniqueSampleKeyToSample[d.uniqueSampleKey].uniquePatientKey
                ];
        } else {
            sampleClinicalData = clinicalDataMap[d.uniqueSampleKey];
        }
        if (sampleClinicalData) {
            dispClinicalValue = sampleClinicalData.value;
        }
        dataMap[d.uniqueSampleKey] = {
            uniqueSampleKey: d.uniqueSampleKey,
            sampleId: sample.sampleId,
            studyId: sample.studyId,
            horzValues: ([] as string[]).concat(d.value as string),
            horzThresholdTypes: ([] as string[]).concat(d.thresholdType || ''),
            mutations: sampleMutations || [],
            copyNumberAlterations: sampleCopyNumberAlterations || [],
            structuralVariants: sampleSv || [],
            dispCna,
            dispMutationType,
            dispStructuralVariant,
            dispClinicalValue,
            isProfiledCna,
            isProfiledMutations,
            isProfiledStructuralVariants,
        };
    }
    const data: any[] = [];
    for (const d of vertData.data) {
        const datum = dataMap[d.uniqueSampleKey];
        if (datum) {
            // we only care about cases with both x and y data
            datum.vertValues = ([] as number[]).concat(d.value);
            datum.vertThresholdTypes = ([] as string[]).concat(
                d.thresholdType || ''
            );
            datum.jitter = getJitterForCase(d.uniqueSampleKey);
            data.push(datum);
        }
    }
    // expand horz and vert values in case theres multiple
    const expandedData: any[] = [];
    for (const d of data) {
        for (let h_cnt = 0; h_cnt < d.horzValues.length; h_cnt++) {
            let horzValue = d.horzValues[h_cnt];
            for (let v_cnt = 0; v_cnt < d.vertValues.length; v_cnt++) {
                let vertValue = d.vertValues[v_cnt];
                // filter out NaN number values
                if (
                    !Number.isNaN(horzValue as any) &&
                    !Number.isNaN(vertValue as any)
                ) {
                    let h_trType = d.horzThresholdTypes[h_cnt];
                    let v_trType = d.vertThresholdTypes[v_cnt];
                    expandedData.push(
                        Object.assign({}, d, {
                            x: horzValue as number,
                            xThresholdType: h_trType as string,
                            category: horzValue as string,
                            y: vertValue as number,
                            yThresholdType: v_trType,
                            value: vertValue as number,
                            thresholdType: v_trType,
                        })
                    );
                }
            }
        }
    }
    return expandedData;
}

export function makeWaterfallPlotData(
    axisData: INumberAxisData,
    uniqueSampleKeyToSample: { [uniqueSampleKey: string]: Sample },
    coverageInformation: CoverageInformation['samples'],
    selectedGene?: Gene | null,
    mutations?: {
        molecularProfileIds: string[];
        data: AnnotatedMutation[];
    },
    copyNumberAlterations?: {
        molecularProfileIds: string[];
        data: CustomDriverNumericGeneMolecularData[];
    },
    structuralVariants?: {
        molecularProfileIds: string[];
        data: StructuralVariant[];
    },
    clinicalData?: {
        clinicalAttribute: ClinicalAttribute;
        data: ClinicalData[];
    }
): IWaterfallPlotData[] {
    const mutationsMap: {
        [uniqueSampleKey: string]: AnnotatedMutation[];
    } = mutations ? _.groupBy(mutations.data, m => m.uniqueSampleKey) : {};

    const cnaMap: {
        [uniqueSampleKey: string]: CustomDriverNumericGeneMolecularData[];
    } = copyNumberAlterations
        ? _.groupBy(copyNumberAlterations.data, d => d.uniqueSampleKey)
        : {};

    const structuralVariantMap: {
        [uniqueSampleKey: string]: StructuralVariant[];
    } = structuralVariants
        ? _.groupBy(structuralVariants.data, d => d.uniqueSampleKey)
        : {};

    let clinicalDataMap: {
        [uniqueKey: string]: ClinicalData;
    } = {};
    if (clinicalData) {
        if (clinicalData.clinicalAttribute.patientAttribute) {
            clinicalDataMap = _.keyBy(
                clinicalData.data,
                d => d.uniquePatientKey
            );
        } else {
            clinicalDataMap = _.keyBy(
                clinicalData.data,
                d => d.uniqueSampleKey
            );
        }
    }

    const contractedData: any[] = [];

    for (const d of axisData.data) {
        const sample = uniqueSampleKeyToSample[d.uniqueSampleKey];
        const sampleCopyNumberAlterations:
            | CustomDriverNumericGeneMolecularData[]
            | undefined = cnaMap[d.uniqueSampleKey];
        let dispCna:
            | CustomDriverNumericGeneMolecularData
            | undefined = undefined;
        let dispMutationType: OncoprintMutationType | undefined = undefined;
        const sampleMutations: AnnotatedMutation[] | undefined =
            mutationsMap[d.uniqueSampleKey];

        // For waterfall plot the datum styling looks at the currently selected gene
        // in the utilities menu. Below evalute which CNA to show for a sample.
        if (
            sampleCopyNumberAlterations &&
            sampleCopyNumberAlterations.length &&
            selectedGene
        ) {
            // filter CNA's for the selected gene and return (a random) one with the highest value
            dispCna = _(sampleCopyNumberAlterations)
                .filter(
                    (d: CustomDriverNumericGeneMolecularData) =>
                        d.entrezGeneId === selectedGene.entrezGeneId
                )
                .maxBy('value');
        }

        // For waterfall plot the datum styling looks at the currently selected gene
        // in the utilities menu. Below evalute which mutation to show for a sample.
        if (sampleMutations && sampleMutations.length && selectedGene) {
            const counts = _(sampleMutations)
                .filter(
                    (d: AnnotatedMutation) =>
                        d.entrezGeneId === selectedGene.entrezGeneId
                ) // filter mutations by gene
                .groupBy((mutation: AnnotatedMutation) => {
                    const mutationType = getOncoprintMutationType(mutation);
                    const driverSuffix =
                        mutationType !== 'promoter' &&
                        mutationType !== 'other' &&
                        mutation.putativeDriver
                            ? '.driver'
                            : '';
                    return `${mutationType}${driverSuffix}`;
                })
                .mapValues((muts: AnnotatedMutation[]) => muts.length)
                .value();
            dispMutationType = selectDisplayValue(
                counts,
                mutationRenderPriority
            ) as OncoprintMutationType;
        }

        let dispStructuralVariant: string | undefined = undefined;
        const sampleSv: StructuralVariant[] | undefined =
            structuralVariantMap[d.uniqueSampleKey];
        if (sampleSv && sampleSv.length && selectedGene) {
            dispStructuralVariant = sampleSv
                .map(sv => sv.variantClass)
                .join(', ');
        }

        const sampleCoverageInfo = coverageInformation[d.uniqueSampleKey];

        let isProfiledMutations: boolean | undefined = undefined;
        let isProfiledCna: boolean | undefined = undefined;
        let isProfiledStructuralVariants: boolean | undefined = undefined;

        if (
            (mutations || copyNumberAlterations || structuralVariants) &&
            selectedGene
        ) {
            const profiledReport = makeWaterfallPlotData_profiledReport(
                selectedGene.hugoGeneSymbol,
                sampleCoverageInfo
            );
            if (mutations) {
                isProfiledMutations = false;
                for (const molecularProfileId of mutations.molecularProfileIds) {
                    isProfiledMutations =
                        isProfiledMutations ||
                        !!profiledReport[molecularProfileId];
                }
            }
            if (copyNumberAlterations) {
                isProfiledCna = false;
                for (const molecularProfileId of copyNumberAlterations.molecularProfileIds) {
                    isProfiledCna =
                        isProfiledCna || !!profiledReport[molecularProfileId];
                }
            }
            if (structuralVariants) {
                isProfiledStructuralVariants = _.some(
                    structuralVariants.molecularProfileIds,
                    id => !!profiledReport[id]
                );
            }
        }

        let dispClinicalValue: string | number | undefined = undefined;
        let sampleClinicalData;
        if (clinicalData && clinicalData.clinicalAttribute.patientAttribute) {
            sampleClinicalData =
                clinicalDataMap[
                    uniqueSampleKeyToSample[d.uniqueSampleKey].uniquePatientKey
                ];
        } else {
            sampleClinicalData = clinicalDataMap[d.uniqueSampleKey];
        }
        if (sampleClinicalData) {
            dispClinicalValue = sampleClinicalData.value;
        }

        contractedData.push({
            uniqueSampleKey: d.uniqueSampleKey,
            sampleId: sample.sampleId,
            studyId: sample.studyId,
            values: ([] as number[]).concat(d.value),
            thresholdTypes: ([] as any[]).concat(d.thresholdType || undefined),
            mutations: sampleMutations || [],
            copyNumberAlterations: sampleCopyNumberAlterations || [],
            structuralVariants: sampleSv || [],
            jitter: getJitterForCase(d.uniqueSampleKey),
            dispCna,
            dispMutationType,
            dispClinicalValue,
            dispStructuralVariant,
            isProfiledCna,
            isProfiledMutations,
            isProfiledStructuralVariants,
        });
    }

    // expand values in case theres multiple value attached to a datum
    const expandedData: any[] = [];
    for (const d of contractedData) {
        for (let cnt = 0; cnt < d.values.length; cnt++) {
            let value = d.values[cnt];

            // filter out NaN number values
            if (!Number.isNaN(value as any)) {
                let trType = d.thresholdTypes[cnt];

                expandedData.push(
                    Object.assign({}, d, {
                        value: value as number,
                        thresholdType: trType as string,
                        category: value as string,
                    })
                );
            }
        }
    }

    return expandedData;
}

function makeScatterPlotData_profiledReport(
    horzHugoSymbol: string | undefined,
    vertHugoSymbol: string | undefined,
    sampleCoverageInfo: CoverageInformation['samples']['']
): { [molecularProfileId: string]: boolean } {
    // returns a map from molecular profile id to boolean, which is undefined iff both genes not profiled
    const ret: { [molecularProfileId: string]: boolean } = {};
    if (horzHugoSymbol) {
        for (const gpData of sampleCoverageInfo.byGene[horzHugoSymbol] || []) {
            ret[gpData.molecularProfileId] = true;
        }
    }
    if (vertHugoSymbol) {
        for (const gpData of sampleCoverageInfo.byGene[vertHugoSymbol] || []) {
            ret[gpData.molecularProfileId] = true;
        }
    }
    for (const gpData of sampleCoverageInfo.allGenes) {
        ret[gpData.molecularProfileId] = true;
    }
    return ret;
}

function makeWaterfallPlotData_profiledReport(
    hugoSymbol: string | undefined,
    sampleCoverageInfo: CoverageInformation['samples']['']
): { [molecularProfileId: string]: boolean } {
    // returns a map from molecular profile id to boolean, which is undefined iff both genes not profiled
    const ret: { [molecularProfileId: string]: boolean } = {};
    if (hugoSymbol) {
        for (const gpData of sampleCoverageInfo.byGene[hugoSymbol] || []) {
            ret[gpData.molecularProfileId] = true;
        }
    }
    for (const gpData of sampleCoverageInfo.allGenes) {
        ret[gpData.molecularProfileId] = true;
    }
    return ret;
}

export function getCacheQueries(utilitiesSelection: ColoringMenuSelection) {
    const queries: { entrezGeneId: number }[] = [];
    if (
        utilitiesSelection.selectedOption !== undefined &&
        utilitiesSelection.selectedOption.info.entrezGeneId !==
            NONE_SELECTED_OPTION_NUMERICAL_VALUE &&
        utilitiesSelection.selectedOption.info.entrezGeneId !== undefined
    ) {
        queries.push({
            entrezGeneId: utilitiesSelection.selectedOption.info.entrezGeneId,
        });
    }
    return _.uniqBy(queries, 'entrezGeneId');
}

export function showWaterfallPlot(
    horzSelection: AxisMenuSelection,
    vertSelection: AxisMenuSelection
): boolean {
    return (
        (vertSelection.dataType !== undefined &&
            isGenericAssaySelected(vertSelection) &&
            vertSelection.genericAssayDataType ===
                DataTypeConstants.LIMITVALUE &&
            horzSelection.dataType === NONE_SELECTED_OPTION_STRING_VALUE) ||
        (horzSelection.dataType !== undefined &&
            isGenericAssaySelected(horzSelection) &&
            horzSelection.genericAssayDataType ===
                DataTypeConstants.LIMITVALUE &&
            vertSelection.dataType === NONE_SELECTED_OPTION_STRING_VALUE)
    );
}

export function bothAxesNoMolecularProfile(
    horzSelection: AxisMenuSelection,
    vertSelection: AxisMenuSelection
): boolean {
    const noMolecularProfileDataTypes = [
        CUSTOM_ATTR_DATA_TYPE,
        CLIN_ATTR_DATA_TYPE,
        NONE_SELECTED_OPTION_STRING_VALUE,
    ];
    const horzDataType = horzSelection.dataType || '';
    const vertDataType = vertSelection.dataType || '';
    // generic assay profile is not a molecular profile
    return (
        (noMolecularProfileDataTypes.includes(horzDataType) ||
            isGenericAssaySelected(horzSelection)) &&
        (noMolecularProfileDataTypes.includes(vertDataType) ||
            isGenericAssaySelected(vertSelection))
    );
}

export function getScatterPlotDownloadData(
    data: IScatterPlotData[],
    xAxisLabel: string,
    yAxisLabel: string,
    entrezGeneIdToGene: { [entrezGeneId: number]: Gene },
    colorByMutationType?: boolean,
    colorByCopyNumber?: boolean,
    colorByClinicalAttribute?: ClinicalAttribute
) {
    const dataRows: string[] = [];
    for (const datum of data) {
        const row: string[] = [];
        row.push(datum.sampleId);
        row.push(numeral(datum.x).format('0[.][000000]'));
        row.push(numeral(datum.y).format('0[.][000000]'));
        if (colorByMutationType) {
            if (datum.mutations.length) {
                row.push(
                    mutationsProteinChanges(
                        datum.mutations,
                        entrezGeneIdToGene
                    ).join('; ')
                );
            } else if (datum.isProfiledMutations === false) {
                row.push('Not Profiled');
            } else {
                row.push('-');
            }
        }
        if (colorByCopyNumber) {
            if (datum.dispCna) {
                const cna = (cnaToAppearance as any)[datum.dispCna.value];
                row.push(`${datum.dispCna.hugoGeneSymbol}: ${cna.legendLabel}`);
            } else if (datum.isProfiledCna === false) {
                row.push(`Not Profiled`);
            } else {
                row.push('-');
            }
        }
        if (colorByClinicalAttribute) {
            row.push((datum.dispClinicalValue as any) || '-');
        }
        dataRows.push(row.join('\t'));
    }
    const header = ['Sample Id', xAxisLabel, yAxisLabel];
    if (colorByMutationType) {
        header.push('Mutations');
    }
    if (colorByCopyNumber) {
        header.push('Copy Number Alterations');
    }
    if (colorByClinicalAttribute) {
        header.push(colorByClinicalAttribute.displayName);
    }
    return header.join('\t') + '\n' + dataRows.join('\n');
}

export function getWaterfallPlotDownloadData(
    data: IWaterfallPlotData[],
    sortOrder: string,
    pivotThreshold: number,
    axisLabel: string,
    entrezGeneIdToGene: { [enstrezGeneId: number]: Gene },
    colorByMutationType?: boolean,
    colorByCopyNumber?: boolean,
    colorByClinicalAttribute?: ClinicalAttribute
) {
    let dataPoints = _.cloneDeep(data);
    dataPoints = _.sortBy(dataPoints, (d: IWaterfallPlotData) => d.value);
    if (sortOrder === 'DESC') {
        dataPoints = _.reverse(dataPoints);
    }

    const dataRows: string[] = [];
    for (const datum of dataPoints) {
        const row: string[] = [];

        row.push(datum.sampleId);
        row.push(numeral(datum.value).format('0[.][000000]'));
        row.push(numeral(pivotThreshold).format('0[.][000000]'));
        row.push(sortOrder || '');
        if (colorByMutationType) {
            if (datum.mutations.length) {
                row.push(
                    mutationsProteinChanges(
                        datum.mutations,
                        entrezGeneIdToGene
                    ).join('; ')
                ); // 4 concatenated mutations
            } else if (datum.isProfiledMutations === false) {
                row.push('Not Profiled');
            } else {
                row.push('-');
            }
        }
        if (colorByCopyNumber) {
            if (datum.dispCna) {
                const cna = (cnaToAppearance as any)[datum.dispCna.value];
                row.push(`${datum.dispCna.hugoGeneSymbol}: ${cna.legendLabel}`);
            } else if (datum.isProfiledCna === false) {
                row.push(`Not Profiled`);
            } else {
                row.push('-');
            }
        }
        if (colorByClinicalAttribute) {
            row.push((datum.dispClinicalValue as any) || '-');
        }
        dataRows.push(row.join('\t'));
    }
    const header = [
        'Sample Id',
        `${axisLabel}`,
        'pivot threshold',
        'sort order',
    ];
    if (colorByMutationType) {
        header.push('Mutations');
    }
    if (colorByCopyNumber) {
        header.push('Copy Number Alterations');
    }
    if (colorByClinicalAttribute) {
        header.push(colorByClinicalAttribute.displayName);
    }
    return header.join('\t') + '\n' + dataRows.join('\n');
}

export function getBoxPlotDownloadData(
    data: IBoxScatterPlotData<IBoxScatterPlotPoint>[],
    categoryLabel: string,
    valueLabel: string,
    entrezGeneIdToGene: { [entrezGeneId: number]: Gene },
    colorByMutationType?: boolean,
    colorByCopyNumber?: boolean,
    colorByClinicalAttribute?: ClinicalAttribute
) {
    const dataRows: string[] = [];
    for (const categoryDatum of data) {
        const category = categoryDatum.label;
        for (const datum of categoryDatum.data) {
            const row: string[] = [];
            row.push(datum.sampleId);
            row.push(category);
            row.push(numeral(datum.value).format('0[.][000000]'));
            if (colorByMutationType) {
                if (datum.mutations.length) {
                    row.push(
                        mutationsProteinChanges(
                            datum.mutations,
                            entrezGeneIdToGene
                        ).join('; ')
                    );
                } else if (datum.isProfiledMutations === false) {
                    row.push('Not Profiled');
                } else {
                    row.push('-');
                }
            }
            if (colorByCopyNumber) {
                if (datum.dispCna) {
                    const cna = (cnaToAppearance as any)[datum.dispCna.value];
                    row.push(
                        `${datum.dispCna.hugoGeneSymbol}: ${cna.legendLabel}`
                    );
                } else if (datum.isProfiledCna === false) {
                    row.push(`Not Profiled`);
                } else {
                    row.push('-');
                }
            }
            if (colorByClinicalAttribute) {
                row.push((datum.dispClinicalValue as any) || '-');
            }
            dataRows.push(row.join('\t'));
        }
    }
    const header = ['Sample Id', categoryLabel, valueLabel];
    if (colorByMutationType) {
        header.push('Mutations');
    }
    if (colorByCopyNumber) {
        header.push('Copy Number Alterations');
    }
    if (colorByClinicalAttribute) {
        header.push(colorByClinicalAttribute.displayName);
    }
    return header.join('\t') + '\n' + dataRows.join('\n');
}

export function getMutationProfileDuplicateSamplesReport(
    horzAxisData: Pick<IAxisData, 'data'>,
    vertAxisData: Pick<IAxisData, 'data'>,
    horzSelection: Pick<AxisMenuSelection, 'dataType'>,
    vertSelection: Pick<AxisMenuSelection, 'dataType'>
) {
    // sampleToNumPoints maps a sample key to the number of points in the plot
    //  which are due to this sample. only samples with more than one point are
    //  entered.
    const sampleToNumPoints: { [uniqueSampleKey: string]: number } = {};

    if (horzSelection.dataType === AlterationTypeConstants.MUTATION_EXTENDED) {
        for (const d of horzAxisData.data) {
            if (Array.isArray(d.value) && d.value.length > 1) {
                // only samples with more than one point are entered

                // for the contribution from horz data, the sample is associated with this many points
                sampleToNumPoints[d.uniqueSampleKey] = d.value.length;
            }
        }
    }

    if (vertSelection.dataType === AlterationTypeConstants.MUTATION_EXTENDED) {
        for (const d of vertAxisData.data) {
            if (Array.isArray(d.value) && d.value.length > 1) {
                // only samples with more than one point are entered

                // we combine the contribution from horz and vert data - we multiply them, bc a point is `create`d
                //  for each horz value for each vert value
                sampleToNumPoints[d.uniqueSampleKey] =
                    (sampleToNumPoints[d.uniqueSampleKey] || 1) *
                    d.value.length;
            }
        }
    }

    const numSamples = Object.keys(sampleToNumPoints).length;
    const numPointsForTheseSamples = _.reduce(
        sampleToNumPoints,
        (sum, nextNumPoints) => sum + nextNumPoints,
        0
    );
    const numSurplusPoints = numPointsForTheseSamples - numSamples;

    return {
        showMessage: numSamples > 0,
        numSamples,
        numSurplusPoints,
    };
}

export function makeClinicalAttributeOptions(
    attributes: Pick<
        ClinicalAttribute,
        'datatype' | 'clinicalAttributeId' | 'displayName' | 'priority'
    >[]
) {
    {
        // filter out anything but NUMBER or STRING
        const validDataTypes = ['number', 'string'];
        const validClinicalAttributes = attributes.filter(
            attribute =>
                validDataTypes.indexOf(attribute.datatype.toLowerCase()) > -1
        );

        // for multiple study cases, we need unique attributes
        const uniqueValidClinicalAttributes = _.uniqBy(
            validClinicalAttributes,
            validClinicalAttribute => validClinicalAttribute.clinicalAttributeId
        );

        // sort
        let options = _.sortBy<{
            value: string;
            label: string;
            priority: number;
        }>(
            uniqueValidClinicalAttributes.map(attribute => ({
                value: attribute.clinicalAttributeId,
                label: attribute.displayName,
                priority: parseFloat(attribute.priority || '-1'),
            })),
            [(o: any) => -o.priority, (o: any) => o.label]
        );

        // to load more quickly, only filter and annotate with data availability once its ready
        // TODO: temporarily disabled because cant figure out a way right now to make this work nicely
        /*if (this.props.store.clinicalAttributeIdToAvailableSampleCount.isComplete) {
            const sampleCounts = this.props.store.clinicalAttributeIdToAvailableSampleCount.result!;
            _clinicalAttributes = _clinicalAttributes.filter(option=>{
                const count = sampleCounts[option.value];
                if (!count) {
                    return false;
                } else {
                    option.label = `${option.label} (${count} samples)`;
                    return true;
                }
            });
        }*/

        return options;
    }
}

export function makeAxisLogScaleFunction(
    axisSelection: AxisMenuSelection
): IAxisLogScaleParams | undefined {
    if (!axisSelection.logScale) {
        return undefined;
    }

    let label; // suffix that will appear in the axis label
    let fLogScale; // function for (log-)transforming a value
    let fInvLogScale; // function for back-transforming a value transformed with fLogScale

    if (
        axisSelection.dataType === undefined ||
        !isGenericAssaySelected(axisSelection)
    ) {
        // log-transformation parameters for non-genericAssay reponse
        // profile data. Note: log2-transformation is used by default
        label = 'log2(value + 1)';
        fLogScale = (x: number) => Math.log2(Math.max(x, 0) + 1);
        fInvLogScale = (x: number) => Math.pow(2, x) - 1;
    } else {
        // log-transformation parameters for generic assay profile
        // data. Note: log10-transformation is used for generic assays
        label = 'log10';
        fLogScale = (x: number, offset?: number) => {
            // for log transformation one should be able to handle negative values;
            // this is done by pre-application of a externally provided offset.
            if (!offset) {
                offset = 0;
            }
            if (x + offset === 0) {
                // 0 cannot be log-transformed, return 0 when input is 0
                return 0;
            }
            return Math.log10(x + offset);
        };
        fInvLogScale = (x: number, offset?: number) => {
            if (!offset) {
                offset = 0;
            }
            return Math.pow(10, x - offset);
        };
    }

    return { label, fLogScale, fInvLogScale };
}

export function axisHasNegativeNumbers(axisData: IAxisData): boolean {
    if (isNumberData(axisData)) {
        return (
            _(axisData.data)
                .filter((d: any) => d.value < 0)
                .size() > 0
        );
    }
    return false;
}

export function getAxisDataOverlapSampleCount(
    firstAxisData: IAxisData,
    secondAxisData: IAxisData
): number {
    // normally data from axis cannot be 0
    // but for odered sample selection, data from axis are 0
    // return the count from the other axis
    if (firstAxisData.data.length == 0) {
        return secondAxisData.data.length;
    } else if (secondAxisData.data.length == 0) {
        return firstAxisData.data.length;
    }
    return _.intersectionBy(
        firstAxisData.data,
        secondAxisData.data,
        (d: any) => d.uniqueSampleKey
    ).length;
}

export function getLimitValues(data: any[]): string[] {
    return _(data)
        .filter(d => {
            return (
                d.thresholdType !== undefined &&
                d.thresholdType !== '' &&
                !Array.isArray(d.value)
            );
        })
        .map(d => {
            return `${d.thresholdType}${d.value.toFixed(2)}`;
        })
        .uniq()
        .value();
}

export function isAlterationTypePresent(
    dataTypeOptions: PlotsTabOption[],
    vertical: boolean,
    alterationTypeConstants: string
) {
    return (
        vertical &&
        !!dataTypeOptions.find(o => o.value === alterationTypeConstants)
    );
}

function stringsToOptions(vals: string[]) {
    return vals.map(v => ({ value: v, label: v }));
}
export function getCategoryOptions(data: IAxisData) {
    if (isStringData(data)) {
        const categories = data.data.reduce((catMap, d) => {
            if (_.isArray(d.value)) {
                for (const v of d.value) {
                    catMap[v] = true;
                }
            } else {
                catMap[d.value] = true;
            }
            return catMap;
        }, {} as { [category: string]: true });
        return stringsToOptions(_.sortBy(Object.keys(categories)));
    } else {
        return [];
    }
}

export function maybeSetLogScale(axisSelection: AxisMenuSelection) {
    if (axisSelection.dataType === AlterationTypeConstants.MRNA_EXPRESSION) {
        if (
            !axisSelection.dataSourceId ||
            axisSelection.dataSourceId.includes('rna_seq')
        ) {
            axisSelection.logScale = true;
        }
    }
}

export function isGenericAssaySelected(selection: AxisMenuSelection) {
    return selection.genericAssayDataType !== undefined;
}

export function getOption(
    option: {
        value: number;
        label: string;
    },
    profiled: boolean
) {
    return {
        value: option.value,
        label: profiled ? option.label : option.label + ' (Not profiled)',
    };
}
