/* Rule:
 *
 * condition: function from datum to boolean
 * shapes - a list of Shapes
 * legend_label
 * exclude_from_legend
 *
 * Shape:
 * type
 * x
 * y
 * ... shape-specific attrs ...
 *
 * Attrs by shape:
 *
 * rectangle: x, y, width, height, stroke, stroke-width, fill
 * triangle: x1, y1, x2, y2, x3, y3, stroke, stroke-width, fill
 * ellipse: x, y, width, height, stroke, stroke-width, fill
 * line: x1, y1, x2, y2, stroke, stroke-width
 */

import {
    ComputedShapeParams,
    Ellipse,
    Line,
    Rectangle,
    Shape,
    ShapeParams,
    Triangle,
} from './oncoprintshape';
import heatmapColors from './heatmapcolors';
import binarysearch from './binarysearch';
import {
    Omit,
    cloneShallow,
    ifndef,
    objectValues,
    shallowExtend,
    z_comparator,
} from './utils';
import { ActiveRules, ColumnProp, Datum, RuleSetId } from './oncoprintmodel';
import _ from 'lodash';
import extractrgba, { hexToRGBA, rgbaToHex } from './extractrgba';

export type RuleSetParams =
    | ILinearInterpRuleSetParams
    | ICategoricalRuleSetParams
    | IGradientRuleSetParams
    | IBarRuleSetParams
    | IStackedBarRuleSetParams
    | IGradientAndCategoricalRuleSetParams
    | IGeneticAlterationRuleSetParams;

interface IGeneralRuleSetParams {
    type?: RuleSetType;
    legend_label?: string;
    legend_base_color?: RGBAColor;
    exclude_from_legend?: boolean;
    na_z?: number; // z index of na shapes (defaults to 1)
    na_legend_label?: string; // legend label associated to NA (defaults to 'No data')
    na_shapes?: ShapeParams[]; // defaults to single strikethrough line
}

interface ILinearInterpRuleSetParams extends IGeneralRuleSetParams {
    log_scale?: boolean;
    value_key: string;
    value_range: [number, number];
}

// all colors are hex, rgb, or rgba
export interface ICategoricalRuleSetParams extends IGeneralRuleSetParams {
    type: RuleSetType.CATEGORICAL;
    category_key: string; // key into data which gives category
    category_to_color?: { [category: string]: RGBAColor };
    universal_rule_categories?: { [category: string]: any };
}

export interface IGradientRuleSetParams extends ILinearInterpRuleSetParams {
    type: RuleSetType.GRADIENT;
    // either `colormap_name` or `colors` needs to be present
    colors?: RGBAColor[]; // [r,g,b,a][]
    colormap_name?: string; // name of a colormap found in src/js/heatmapcolors.js
    value_stop_points: number[];
    null_color?: RGBAColor;
    null_legend_label?: string;
}

// TODO: it would be more elegant to create multiple inheritance (if possible) since
// IGradientAndCategoricalRuleSetParams is a IGradientRuleSetParams and
// ICategoricalRuleSetParams with a different `type` field.
export interface IGradientAndCategoricalRuleSetParams
    extends IGeneralRuleSetParams {
    type: RuleSetType.GRADIENT_AND_CATEGORICAL;
    // either `colormap_name` or `colors` needs to be present
    colors?: RGBAColor[];
    colormap_name?: string; // name of a colormap found in src/js/heatmapcolors.js
    value_stop_points: number[];
    null_color?: RGBAColor;

    log_scale?: boolean;
    value_key: string;
    value_range: [number, number];

    category_key: string; // key into data which gives category
    category_to_color?: { [category: string]: RGBAColor };
}

export interface IBarRuleSetParams extends ILinearInterpRuleSetParams {
    type: RuleSetType.BAR;
    fill?: RGBAColor;
    negative_fill?: RGBAColor;
}

export interface IStackedBarRuleSetParams extends IGeneralRuleSetParams {
    type: RuleSetType.STACKED_BAR;
    value_key: string;
    categories: string[];
    fills?: RGBAColor[];
}

export interface IGeneticAlterationRuleSetParams extends IGeneralRuleSetParams {
    type: RuleSetType.GENE;
    rule_params: GeneticAlterationRuleParams;
}

type GeneticAlterationSingleRuleParams = {
    shapes: ShapeParams[];
    legend_label: string;
    exclude_from_legend?: boolean;
    legend_order?: number;
};

export type GeneticAlterationRuleParams = {
    always?: GeneticAlterationSingleRuleParams;
    conditional: {
        [datumKey: string]: {
            [commaSeparatedDatumValues: string]: GeneticAlterationSingleRuleParams;
        };
    };
};

export type RGBAColor = [number, number, number, number]; //[0,255] x [0,255] x [0,255] x [0,1]

type RuleParams = {
    shapes: ShapeParams[];
    legend_label?: string;
    exclude_from_legend?: boolean;
    legend_config?: RuleLegendConfig;
    legend_order?: number;
    legend_base_color?: RGBAColor;
};

type RuleLegendConfig =
    | { type: 'rule'; target: any }
    | {
          type: 'number';
          range: [number, number];
          range_type: LinearInterpRangeType;
          positive_color: RGBAColor;
          negative_color: RGBAColor;
          interpFn: (val: number) => number;
      } // range: [lower, upper]
    | {
          type: 'gradient';
          range: [number, number];
          colorFn: (val: number) => RGBAColor;
      };

export enum RuleSetType {
    CATEGORICAL = 'categorical',
    GRADIENT = 'gradient',
    GRADIENT_AND_CATEGORICAL = 'gradient+categorical',
    BAR = 'bar',
    STACKED_BAR = 'stacked_bar',
    GENE = 'gene',
}

export type RuleId = number;

export type RuleWithId = {
    id: RuleId;
    rule: Rule;
};

function makeIdCounter() {
    let id = 0;
    return function() {
        id += 1;
        return id;
    };
}

function intRange(length: number) {
    const ret = [];
    for (let i = 0; i < length; i++) {
        ret.push(i);
    }
    return ret;
}

function makeUniqueColorGetter(init_used_colors: string[]) {
    init_used_colors = init_used_colors || [];
    const colors = [
        '#3366cc',
        '#dc3912',
        '#ff9900',
        '#109618',
        '#990099',
        '#0099c6',
        '#dd4477',
        '#66aa00',
        '#b82e2e',
        '#316395',
        '#994499',
        '#22aa99',
        '#aaaa11',
        '#6633cc',
        '#e67300',
        '#8b0707',
        '#651067',
        '#329262',
        '#5574a6',
        '#3b3eac',
        '#b77322',
        '#16d620',
        '#b91383',
        '#f4359e',
        '#9c5935',
        '#a9c413',
        '#2a778d',
        '#668d1c',
        '#bea413',
        '#0c5922',
        '#743411',
    ]; // Source: D3
    let index = 0;
    const used_colors: { [color: string]: boolean } = {};
    for (let i = 0; i < init_used_colors.length; i++) {
        used_colors[init_used_colors[i]] = true;
    }
    return function(color?: string) {
        if (color) {
            // calling with an argument adds it to the used colors record
            used_colors[color] = true;
        } else {
            // calling without an argument returns a new unused color
            let next_color = colors[index % colors.length];
            while (used_colors[next_color]) {
                const darker_next_color = darkenHexColor(next_color);
                if (darker_next_color === next_color) {
                    break;
                }
                next_color = darker_next_color;
            }
            used_colors[next_color] = true;
            index += 1;

            return hexToRGBA(next_color);
        }

        return undefined;
    };
}

function makeNAShapes(z: number): ShapeParams[] {
    return [
        {
            type: 'rectangle',
            fill: [255, 255, 255, 1],
            z: z,
        },
        {
            type: 'line',
            stroke: [190, 190, 190, 1],
            'stroke-width': 1,
            x1: 0,
            x2: 100,
            y1: 50,
            y2: 50,
            z: z,
        },
    ];
}
const NA_STRING = 'na';
const NA_LABEL = 'No data';

function colorToHex(color: string) {
    let r;
    let g;
    let b;
    const rgba_match = color.match(
        /^[\s]*rgba\([\s]*([0-9]+)[\s]*,[\s]*([0-9]+)[\s]*,[\s]*([0-9]+)[\s]*,[\s]*([0-9.]+)[\s]*\)[\s]*$/
    );
    if (rgba_match && rgba_match.length === 5) {
        r = parseInt(rgba_match[1]).toString(16);
        g = parseInt(rgba_match[2]).toString(16);
        b = parseInt(rgba_match[3]).toString(16);
        if (r.length === 1) {
            r = '0' + r;
        }
        if (g.length === 1) {
            g = '0' + g;
        }
        if (b.length === 1) {
            b = '0' + b;
        }
        return '#' + r + g + b;
    }

    const rgb_match = color.match(
        /^[\s]*rgb\([\s]*([0-9]+)[\s]*,[\s]*([0-9]+)[\s]*,[\s]*([0-9]+)[\s]*\)[\s]*$/
    );
    if (rgb_match && rgb_match.length === 4) {
        r = parseInt(rgb_match[1]).toString(16);
        g = parseInt(rgb_match[2]).toString(16);
        b = parseInt(rgb_match[3]).toString(16);
        if (r.length === 1) {
            r = '0' + r;
        }
        if (g.length === 1) {
            g = '0' + g;
        }
        if (b.length === 1) {
            b = '0' + b;
        }
        return '#' + r + g + b;
    }

    return color;
}

function darkenHexChannel(c: string) {
    let numC = parseInt(c, 16);
    numC *= 0.95;
    numC = Math.round(numC);
    c = numC.toString(16);
    if (c.length === 1) {
        c = '0' + c;
    }
    return c;
}

function darkenHexColor(color: string) {
    let r = color[1] + color[2];
    let g = color[3] + color[4];
    let b = color[5] + color[6];
    r = darkenHexChannel(r);
    g = darkenHexChannel(g);
    b = darkenHexChannel(b);
    return '#' + r + g + b;
}

export class RuleSet {
    static getRuleSetId = makeIdCounter();
    static getRuleId = makeIdCounter();

    public rule_set_id: RuleSetId;
    public legend_label?: string;
    protected legend_base_color?: RGBAColor;
    public exclude_from_legend?: boolean;
    protected active_rule_ids: ActiveRules;
    protected rules_with_id: RuleWithId[];
    protected universal_rule?: RuleWithId;

    constructor(params: Omit<RuleSetParams, 'type'>) {
        /* params:
         * - legend_label
         * - exclude_from_legend
         */
        this.rule_set_id = RuleSet.getRuleSetId();
        this.legend_label = params.legend_label;
        this.legend_base_color = params.legend_base_color;
        this.exclude_from_legend = params.exclude_from_legend;
        this.active_rule_ids = {};
        this.rules_with_id = [];
    }

    public getLegendLabel() {
        return this.legend_label;
    }

    public getRuleSetId() {
        return this.rule_set_id;
    }

    public addRules(list_of_params: RuleParams[]) {
        const self = this;
        return list_of_params.map(function(params) {
            return self._addRule(params);
        });
    }

    public _addRule(params: RuleParams, rule_id?: RuleId) {
        if (typeof rule_id === 'undefined') {
            rule_id = RuleSet.getRuleId();
        }
        this.rules_with_id.push({ id: rule_id, rule: new Rule(params) });
        return rule_id;
    }

    public setUniversalRule(r: RuleWithId) {
        this.universal_rule = r;
    }

    public removeRule(rule_id: RuleId) {
        var index = -1;
        for (let i = 0; i < this.rules_with_id.length; i++) {
            if (this.rules_with_id[i].id === rule_id) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            this.rules_with_id.splice(index, 1);
        }
        delete this.active_rule_ids[rule_id];
    }

    public getRuleWithId(rule_id: RuleId) {
        let ret = null;
        for (let i = 0; i < this.rules_with_id.length; i++) {
            if (this.rules_with_id[i].id === rule_id) {
                ret = this.rules_with_id[i];
                break;
            }
        }
        return ret;
    }

    public isExcludedFromLegend() {
        return this.exclude_from_legend;
    }

    public getRule(rule_id: RuleId): Rule {
        return this.getRuleWithId(rule_id).rule;
    }

    public getRecentlyUsedRules() {
        const self = this;
        return Object.keys(this.active_rule_ids).map(function(rule_id) {
            return self.getRule(parseInt(rule_id, 10));
        });
    }

    public applyRulesToDatum(
        rules_with_id: RuleWithId[],
        datum: Datum,
        cell_width: number,
        cell_height: number
    ) {
        let shapes: ComputedShapeParams[] = [];
        const rules_len = rules_with_id.length;
        for (let j = 0; j < rules_len; j++) {
            shapes = shapes.concat(
                rules_with_id[j].rule.apply(datum, cell_width, cell_height)
            );
        }
        return shapes;
    }

    public getSpecificRulesForDatum(datum?: Datum): RuleWithId[] {
        throw 'Not implemented on base class';
    }

    public getUniversalRule() {
        return this.universal_rule;
    }

    public getUniversalShapes(cell_width: number, cell_height: number) {
        if (this.getUniversalRule()) {
            const shapes = this.getUniversalRule().rule.apply(
                {}, // a universal rule does not rely on anything specific to the data
                cell_width,
                cell_height
            );
            shapes.sort(z_comparator);
            return shapes;
        } else {
            return [];
        }
    }

    public getSpecificShapesForDatum(
        data: Datum[],
        cell_width: number,
        cell_height: number,
        out_active_rules?: ActiveRules | undefined,
        data_id_key?: string & keyof Datum,
        important_ids?: ColumnProp<boolean>
    ) {
        // Returns a list of lists of concrete shapes, in the same order as data
        // optional parameter important_ids determines which ids count towards active rules (optional parameter data_id_key
        //		is used for this too)
        const ret = [];
        for (var i = 0; i < data.length; i++) {
            const datum = data[i];
            const should_mark_active =
                !important_ids || !!important_ids[datum[data_id_key!]];
            const rules = this.getSpecificRulesForDatum(datum);
            if (typeof out_active_rules !== 'undefined' && should_mark_active) {
                for (let j = 0; j < rules.length; j++) {
                    out_active_rules[rules[j].id] = true;
                }
            }
            const shapes = this.applyRulesToDatum(
                rules,
                data[i],
                cell_width,
                cell_height
            );
            shapes.sort(z_comparator);
            ret.push(shapes);
        }
        // mark universal rule as active
        if (
            this.getUniversalRule() &&
            typeof out_active_rules !== 'undefined'
        ) {
            out_active_rules[this.getUniversalRule().id] = true;
        }
        return ret;
    }
}

class LookupRuleSet extends RuleSet {
    private lookup_map_by_key_and_value: {
        [key: string]: { [value: string]: RuleWithId };
    } = {};
    private lookup_map_by_key: { [key: string]: RuleWithId } = {};
    private rule_id_to_conditions: {
        [ruleId: number]: { key: string; value: string }[];
    } = {};

    public getSpecificRulesForDatum(datum?: Datum) {
        if (typeof datum === 'undefined') {
            return this.rules_with_id;
        }
        let ret: RuleWithId[] = [];
        for (var key in datum) {
            if (key in datum && typeof datum[key] !== 'undefined') {
                var key_rule = this.lookup_map_by_key[key];
                if (typeof key_rule !== 'undefined') {
                    ret.push(key_rule);
                }
                var key_and_value_rule =
                    (this.lookup_map_by_key_and_value[key] &&
                        this.lookup_map_by_key_and_value[key][datum[key]]) ||
                    undefined;
                if (typeof key_and_value_rule !== 'undefined') {
                    ret.push(key_and_value_rule);
                }
            }
        }
        return ret;
    }

    private indexRuleForLookup(
        condition_key: string,
        condition_value: string,
        rule_with_id: RuleWithId
    ) {
        if (condition_key === null) {
            this.setUniversalRule(rule_with_id);
        } else {
            if (condition_value === null) {
                this.lookup_map_by_key[condition_key] = rule_with_id;
            } else {
                this.lookup_map_by_key_and_value[condition_key] =
                    this.lookup_map_by_key_and_value[condition_key] || {};
                this.lookup_map_by_key_and_value[condition_key][
                    condition_value
                ] = rule_with_id;
            }
        }
        this.rule_id_to_conditions[rule_with_id.id] =
            this.rule_id_to_conditions[rule_with_id.id] || [];
        this.rule_id_to_conditions[rule_with_id.id].push({
            key: condition_key,
            value: condition_value,
        });
    }

    public addRule(
        condition_key: string,
        condition_value: any,
        params: RuleParams
    ) {
        const rule_id = this._addRule(params);

        this.indexRuleForLookup(
            condition_key,
            condition_value,
            this.getRuleWithId(rule_id)
        );

        return rule_id;
    }

    public linkExistingRule(
        condition_key: string,
        condition_value: string,
        existing_rule_id: RuleId
    ) {
        this.indexRuleForLookup(
            condition_key,
            condition_value,
            this.getRuleWithId(existing_rule_id)
        );
    }

    public removeRule(rule_id: RuleId) {
        super.removeRule(rule_id);

        while (this.rule_id_to_conditions[rule_id].length > 0) {
            var condition = this.rule_id_to_conditions[rule_id].pop();
            if (condition.key === null) {
                // universal rule
                this.universal_rule = undefined;
            } else {
                if (condition.value === null) {
                    delete this.lookup_map_by_key[condition.key];
                } else {
                    delete this.lookup_map_by_key_and_value[condition.key][
                        condition.value
                    ];
                }
            }
        }
        delete this.rule_id_to_conditions[rule_id];
    }
}

type ConditionRuleSetCondition = (d: Datum) => boolean;
class ConditionRuleSet extends RuleSet {
    private rule_id_to_condition: {
        [ruleId: number]: ConditionRuleSetCondition;
    } = {};

    constructor(params: RuleSetParams, omitNArule?: boolean) {
        super(params);

        if (!omitNArule) {
            this.addRule(
                function(d) {
                    return d[NA_STRING] === true;
                },
                {
                    shapes:
                        params.na_shapes || makeNAShapes(params.na_z || 1000),
                    legend_label: params.na_legend_label || NA_LABEL,
                    exclude_from_legend: false,
                    legend_config: { type: 'rule', target: { na: true } },
                    legend_order: Number.POSITIVE_INFINITY,
                }
            );
        }
    }

    public getSpecificRulesForDatum(datum?: Datum) {
        if (typeof datum === 'undefined') {
            return this.rules_with_id;
        }
        const ret = [];
        for (let i = 0; i < this.rules_with_id.length; i++) {
            if (this.rule_id_to_condition[this.rules_with_id[i].id](datum)) {
                ret.push(this.rules_with_id[i]);
            }
        }
        return ret;
    }

    public addRule(
        condition: ConditionRuleSetCondition,
        params: RuleParams,
        rule_id?: RuleId
    ) {
        rule_id = this._addRule(params, rule_id);
        this.rule_id_to_condition[rule_id] = condition;
        return rule_id;
    }

    public removeRule(rule_id: RuleId) {
        super.removeRule(rule_id);
        delete this.rule_id_to_condition[rule_id];
    }
}

class CategoricalRuleSet extends LookupRuleSet {
    public readonly category_key: string;
    private readonly category_to_color: { [category: string]: RGBAColor };
    private readonly getUnusedColor: (color?: string) => RGBAColor;
    private readonly universal_rule_categories?: { [category: string]: any };
    constructor(
        params: Omit<ICategoricalRuleSetParams, 'type'>,
        omitNArule?: boolean
    ) {
        super(params);
        if (!omitNArule) {
            this.addRule(NA_STRING, true, {
                shapes: params.na_shapes || makeNAShapes(params.na_z || 1000),
                legend_label: params.na_legend_label || NA_LABEL,
                exclude_from_legend: false,
                legend_config: { type: 'rule', target: { na: true } },
                legend_order: Number.POSITIVE_INFINITY,
            });
        }

        this.category_key = params.category_key;
        this.universal_rule_categories = params.universal_rule_categories;
        this.category_to_color = cloneShallow(
            ifndef(params.category_to_color, {})
        );
        this.getUnusedColor = makeUniqueColorGetter(
            objectValues(this.category_to_color).map(rgbaToHex)
        );
        for (const category of Object.keys(this.category_to_color)) {
            const color = this.category_to_color[category];
            this.addCategoryRule(category, color);
            this.getUnusedColor(rgbaToHex(color));
        }
    }

    private addCategoryRule(category: string, color: RGBAColor) {
        const legend_rule_target: any = {};
        legend_rule_target[this.category_key] = category;
        const rule_params: RuleParams = {
            shapes: [
                {
                    type: 'rectangle',
                    fill: color,
                },
            ],
            legend_label: category,
            exclude_from_legend: false,
            legend_config: { type: 'rule', target: legend_rule_target },
        };
        if (
            this.universal_rule_categories &&
            this.universal_rule_categories.hasOwnProperty(category)
        ) {
            // add universal rule
            this.addRule(null, category, rule_params);
        } else {
            this.addRule(this.category_key, category, rule_params);
        }
    }

    public getSpecificShapesForDatum(
        data: Datum,
        cell_width: number,
        cell_height: number,
        out_active_rules: ActiveRules | undefined,
        data_id_key: string & keyof Datum,
        important_ids?: ColumnProp<boolean>
    ) {
        // First ensure there is a color for all categories
        for (let i = 0, data_len = data.length; i < data_len; i++) {
            if (data[i][NA_STRING]) {
                continue;
            }
            const category = data[i][this.category_key];
            if (!(category in this.category_to_color)) {
                const color = this.getUnusedColor();

                this.category_to_color[category] = color;
                this.addCategoryRule(category, color);
            }
        }
        // Then propagate the call up
        return super.getSpecificShapesForDatum(
            data,
            cell_width,
            cell_height,
            out_active_rules,
            data_id_key,
            important_ids
        );
    }
}

export enum LinearInterpRangeType {
    ALL = 'ALL', // all values positive, negative and zero
    NON_NEGATIVE = 'NON_NEGATIVE', // value range all positive values inclusive zero (0)
    NON_POSITIVE = 'NON_POSITIVE', // value range all negative values inclusive zero (0)
}

class LinearInterpRuleSet extends ConditionRuleSet {
    protected value_key: string;
    protected value_range: [number, number];
    protected log_scale?: boolean;
    protected type: string;
    protected makeInterpFn: () => (valToConvert: number) => number;
    protected inferred_value_range: [number, number];

    constructor(params: ILinearInterpRuleSetParams) {
        super(params);
        this.value_key = params.value_key;
        this.value_range = params.value_range;
        this.log_scale = params.log_scale; // boolean
        this.type = params.type;

        this.makeInterpFn = function() {
            const range = this.getEffectiveValueRange();
            const rangeType = this.getValueRangeType();
            const plotType = this.type;
            if (this.log_scale) {
                var shift_to_make_pos = Math.abs(range[0]) + 1;
                var log_range =
                    Math.log(range[1] + shift_to_make_pos) -
                    Math.log(range[0] + shift_to_make_pos);
                var log_range_lower = Math.log(range[0] + shift_to_make_pos);
                return function(val: number) {
                    return (
                        (Math.log(val + shift_to_make_pos) - log_range_lower) /
                        log_range
                    );
                };
            } else {
                return function(val) {
                    var range_spread = range[1] - range[0],
                        range_lower = range[0],
                        range_higher = range[1];
                    if (plotType === 'bar') {
                        if (rangeType === LinearInterpRangeType.NON_POSITIVE) {
                            // when data only contains non positive values
                            return (val - range_higher) / range_spread;
                        } else if (
                            rangeType === LinearInterpRangeType.NON_NEGATIVE
                        ) {
                            // when data only contains non negative values
                            return (val - range_lower) / range_spread;
                        } else if (rangeType === LinearInterpRangeType.ALL) {
                            range_spread =
                                Math.abs(range[0]) > range[1]
                                    ? Math.abs(range[0])
                                    : range[1];
                            return val / range_spread;
                        }
                    } else {
                        return (val - range_lower) / range_spread;
                    }
                    return undefined;
                };
            }
        };
    }

    protected getEffectiveValueRange(): [number, number] {
        const ret = (this.value_range && this.value_range.slice()) || [
            undefined,
            undefined,
        ];
        if (typeof ret[0] === 'undefined') {
            ret[0] = this.inferred_value_range[0];
        }
        if (typeof ret[1] === 'undefined') {
            ret[1] = this.inferred_value_range[1];
        }
        if (ret[0] === ret[1]) {
            // Make sure non-empty interval
            ret[0] -= ret[0] / 2;
            ret[1] += ret[1] / 2;
        }
        return ret as [number, number];
    }
    protected getValueRangeType() {
        var range = this.getEffectiveValueRange();
        if (range[0] < 0 && range[1] <= 0) {
            return LinearInterpRangeType.NON_POSITIVE;
        } else if (range[0] >= 0 && range[1] > 0) {
            return LinearInterpRangeType.NON_NEGATIVE;
        } else {
            return LinearInterpRangeType.ALL;
        }
    }

    public getSpecificShapesForDatum(
        data: Datum,
        cell_width: number,
        cell_height: number,
        out_active_rules: ActiveRules | undefined,
        data_id_key: string & keyof Datum,
        important_ids?: ColumnProp<boolean>
    ) {
        // First find value range
        let value_min = Number.POSITIVE_INFINITY;
        let value_max = Number.NEGATIVE_INFINITY;
        for (var i = 0, datalen = data.length; i < datalen; i++) {
            const d = data[i];
            if (isNaN(d[this.value_key])) {
                continue;
            }
            value_min = Math.min(value_min, d[this.value_key]);
            value_max = Math.max(value_max, d[this.value_key]);
        }
        if (value_min === Number.POSITIVE_INFINITY) {
            value_min = 0;
        }
        if (value_max === Number.NEGATIVE_INFINITY) {
            value_max = 0;
        }
        this.inferred_value_range = [value_min, value_max];
        this.updateLinearRules();

        // Then propagate the call up
        return super.getSpecificShapesForDatum(
            data,
            cell_width,
            cell_height,
            out_active_rules,
            data_id_key,
            important_ids
        );
    }

    protected updateLinearRules() {
        throw 'Not implemented in abstract class';
    }
}

class GradientRuleSet extends LinearInterpRuleSet {
    private colors: RGBAColor[] = [];
    private value_stop_points: number[];
    private null_color?: RGBAColor;
    private gradient_rule: RuleId;

    constructor(params: Omit<IGradientRuleSetParams, 'type'>) {
        super(params);
        if (params.colors) {
            this.colors = params.colors || [];
        } else if (params.colormap_name) {
            this.colors = heatmapColors[params.colormap_name] || [];
        }
        if (this.colors.length === 0) {
            this.colors.push([0, 0, 0, 1], [255, 0, 0, 1]);
        }

        this.value_stop_points = params.value_stop_points;
        this.null_color = params.null_color || [211, 211, 211, 1];

        var self = this;
        var value_key = this.value_key;
        this.addRule(
            function(d) {
                return d[NA_STRING] !== true && d[value_key] === null;
            },
            {
                shapes: [
                    {
                        type: 'rectangle',
                        fill: self.null_color,
                    },
                ],
                legend_label: params.null_legend_label || 'Not a number',
                exclude_from_legend: false,
                legend_config: { type: 'rule', target: { [value_key]: null } },
            }
        );
    }

    static linInterpColors(
        t: number,
        begin_color: RGBAColor,
        end_color: RGBAColor
    ): RGBAColor {
        // 0 <= t <= 1
        return [
            Math.round(begin_color[0] * (1 - t) + end_color[0] * t),
            Math.round(begin_color[1] * (1 - t) + end_color[1] * t),
            Math.round(begin_color[2] * (1 - t) + end_color[2] * t),
            begin_color[3] * (1 - t) + end_color[3] * t,
        ];
    }

    private makeColorFn(
        colors: RGBAColor[],
        interpFn: (valToConvert: number) => number
    ) {
        const value_stop_points = this.value_stop_points;
        let stop_points: number[];
        if (value_stop_points) {
            stop_points = value_stop_points.map(interpFn);
        } else {
            stop_points = intRange(colors.length).map(function(x) {
                return x / (colors.length - 1);
            });
        }
        return function(t: number): RGBAColor {
            // 0 <= t <= 1
            var begin_interval_index = binarysearch(
                stop_points,
                t,
                function(x) {
                    return x;
                },
                true
            );
            if (begin_interval_index === -1) {
                return [0, 0, 0, 1];
            }
            var end_interval_index = Math.min(
                colors.length - 1,
                begin_interval_index + 1
            );
            var spread =
                stop_points[end_interval_index] -
                stop_points[begin_interval_index];
            if (spread === 0) {
                return colors[end_interval_index];
            } else {
                var interval_t =
                    (t - stop_points[begin_interval_index]) / spread;
                var begin_color = colors[begin_interval_index];
                var end_color = colors[end_interval_index];
                return GradientRuleSet.linInterpColors(
                    interval_t,
                    begin_color,
                    end_color
                );
            }
        };
    }

    protected updateLinearRules() {
        let rule_id;
        if (typeof this.gradient_rule !== 'undefined') {
            rule_id = this.gradient_rule;
            this.removeRule(this.gradient_rule);
        }
        const interpFn = this.makeInterpFn();
        const colorFn = this.makeColorFn(this.colors, interpFn);
        const value_key = this.value_key;
        const null_color = this.null_color;

        this.gradient_rule = this.addRule(
            function(d) {
                return d[NA_STRING] !== true && d[value_key] !== null;
            },
            {
                shapes: [
                    {
                        type: 'rectangle',
                        fill: function(d) {
                            var t = interpFn(d[value_key]);
                            return colorFn(t) as RGBAColor;
                        },
                    },
                ],
                exclude_from_legend: false,
                legend_config: {
                    type: 'gradient' as 'gradient',
                    range: this.getEffectiveValueRange(),
                    colorFn: colorFn,
                },
            },
            rule_id
        );
    }
}

class BarRuleSet extends LinearInterpRuleSet {
    private fill: RGBAColor;
    private negative_fill: RGBAColor;
    private bar_rule?: RuleId;

    constructor(params: IBarRuleSetParams) {
        super(params);
        this.fill = params.fill || [0, 128, 0, 1]; // green
        this.negative_fill = params.negative_fill || [255, 0, 0, 1]; //red
    }

    protected updateLinearRules() {
        let rule_id;
        if (typeof this.bar_rule !== 'undefined') {
            rule_id = this.bar_rule;
            this.removeRule(this.bar_rule);
        }
        const interpFn = this.makeInterpFn();
        const value_key = this.value_key;
        const positive_color = this.fill;
        const negative_color = this.negative_fill;
        const yPosFn = this.getYPosPercentagesFn();
        const cellHeightFn = this.getCellHeightPercentagesFn();
        this.bar_rule = this.addRule(
            function(d) {
                return d[NA_STRING] !== true;
            },
            {
                shapes: [
                    {
                        type: 'rectangle',
                        y: function(d) {
                            var t = interpFn(d[value_key]);
                            return yPosFn(t);
                        },
                        height: function(d) {
                            var t = interpFn(d[value_key]);
                            return cellHeightFn(t);
                        },
                        fill: function(d) {
                            return d[value_key] < 0
                                ? negative_color
                                : positive_color;
                        },
                    },
                ],
                exclude_from_legend: false,
                legend_config: {
                    type: 'number' as 'number',
                    range: this.getEffectiveValueRange(),
                    range_type: this.getValueRangeType(),
                    positive_color: positive_color,
                    negative_color: negative_color,
                    interpFn: interpFn,
                },
            },
            rule_id
        );
    }

    public getYPosPercentagesFn() {
        let ret;
        switch (this.getValueRangeType()) {
            case LinearInterpRangeType.NON_POSITIVE:
                ret = function(t: number) {
                    return 0;
                };
                break;
            case LinearInterpRangeType.NON_NEGATIVE:
                ret = function(t: number) {
                    return (1 - t) * 100;
                };
                break;
            case LinearInterpRangeType.ALL:
                ret = function(t: number) {
                    return Math.min(1 - t, 1) * 50;
                };
                break;
        }
        return ret;
    }

    public getCellHeightPercentagesFn() {
        let ret;
        switch (this.getValueRangeType()) {
            case LinearInterpRangeType.NON_POSITIVE:
                ret = function(t: number) {
                    return -t * 100;
                };
                break;
            case LinearInterpRangeType.NON_NEGATIVE:
                ret = function(t: number) {
                    return t * 100;
                };
                break;
            case LinearInterpRangeType.ALL:
                ret = function(t: number) {
                    return Math.abs(t) * 50;
                };
                break;
        }
        return ret;
    }
}

class StackedBarRuleSet extends ConditionRuleSet {
    constructor(params: IStackedBarRuleSetParams) {
        super(params);
        const value_key = params.value_key;
        const fills = params.fills || [];
        const categories = params.categories || [];
        const getUnusedColor = makeUniqueColorGetter(fills.map(rgbaToHex));

        // Initialize with default values
        while (fills.length < categories.length) {
            fills.push(getUnusedColor());
        }

        const self = this;
        for (let i = 0; i < categories.length; i++) {
            (function(I) {
                const legend_target: any = {};
                legend_target[value_key] = {};
                for (let j = 0; j < categories.length; j++) {
                    legend_target[value_key][categories[j]] = 0;
                }
                legend_target[value_key][categories[I]] = 1;
                self.addRule(
                    function(d) {
                        return d[NA_STRING] !== true;
                    },
                    {
                        shapes: [
                            {
                                type: 'rectangle',
                                fill: fills[I],
                                width: 100,
                                height: function(d) {
                                    var total = 0;
                                    for (
                                        var j = 0;
                                        j < categories.length;
                                        j++
                                    ) {
                                        total += parseFloat(
                                            d[value_key][categories[j]]
                                        );
                                    }
                                    return (
                                        (parseFloat(
                                            d[value_key][categories[I]]
                                        ) *
                                            100) /
                                        total
                                    );
                                },
                                y: function(d) {
                                    var total = 0;
                                    var prev_vals_sum = 0;
                                    for (
                                        var j = 0;
                                        j < categories.length;
                                        j++
                                    ) {
                                        var new_val = parseFloat(
                                            d[value_key][categories[j]]
                                        );
                                        if (j < I) {
                                            prev_vals_sum += new_val;
                                        }
                                        total += new_val;
                                    }
                                    return (prev_vals_sum * 100) / total;
                                },
                            },
                        ],
                        exclude_from_legend: false,
                        legend_config: { type: 'rule', target: legend_target },
                        legend_label: categories[I],
                    }
                );
            })(i);
        }
    }
}

export class GeneticAlterationRuleSet extends LookupRuleSet {
    constructor(params: IGeneticAlterationRuleSetParams) {
        super(params);
        this.addRulesFromParams(params);
        this.addRule(NA_STRING, true, {
            shapes: params.na_shapes || makeNAShapes(params.na_z || 1),
            legend_label: params.na_legend_label || NA_LABEL,
            exclude_from_legend: false,
            legend_config: { type: 'rule', target: { na: true } },
            legend_order: Number.POSITIVE_INFINITY,
        });
    }

    private addRulesFromParams(params: IGeneticAlterationRuleSetParams) {
        const rule_params = params.rule_params;
        _.forEach(
            rule_params.conditional,
            (
                datumValuesToRuleParams: GeneticAlterationRuleParams['conditional']['datumKey'],
                datumKey: string
            ) => {
                _.forEach(
                    datumValuesToRuleParams,
                    (
                        ruleParams: GeneticAlterationSingleRuleParams,
                        commaSeparatedDatumValues: string
                    ) => {
                        const equiv_values = commaSeparatedDatumValues.split(
                            ','
                        );
                        const legend_rule_target: any = {};
                        legend_rule_target[
                            equiv_values[0]
                        ] = commaSeparatedDatumValues;
                        const rule_id = this.addRule(
                            datumKey,
                            equiv_values[0] === '*' ? null : equiv_values[0],
                            shallowExtend(ruleParams, {
                                shapes: ruleParams.shapes,
                                legend_config: {
                                    type: 'rule' as 'rule',
                                    target: legend_rule_target,
                                },
                                legend_base_color: ifndef(
                                    this.legend_base_color,
                                    [255, 255, 255, 1]
                                ) as [number, number, number, number],
                            })
                        );
                        for (let i = 1; i < equiv_values.length; i++) {
                            this.linkExistingRule(
                                datumKey,
                                equiv_values[i] === '*'
                                    ? null
                                    : equiv_values[i],
                                rule_id
                            );
                        }
                    }
                );
            }
        );

        if (rule_params.always) {
            this.addRule(
                null,
                null,
                shallowExtend(rule_params.always, {
                    shapes: rule_params.always.shapes,
                    legend_config: { type: 'rule' as 'rule', target: {} },
                })
            );
        }
    }
}

export class Rule {
    private shapes: Shape[];
    public legend_label: string;
    public legend_base_color?: RGBAColor;
    public exclude_from_legend?: boolean;
    private legend_config?: RuleLegendConfig;
    public legend_order?: number;

    constructor(params: RuleParams) {
        this.shapes = params.shapes.map(function(shape) {
            if (shape.type === 'rectangle') {
                return new Rectangle(shape);
            } else if (shape.type === 'triangle') {
                return new Triangle(shape);
            } else if (shape.type === 'ellipse') {
                return new Ellipse(shape);
            } else if (shape.type === 'line') {
                return new Line(shape);
            }
            return undefined;
        });
        this.legend_label =
            typeof params.legend_label === 'undefined'
                ? ''
                : params.legend_label;
        this.legend_base_color = params.legend_base_color;
        this.exclude_from_legend = params.exclude_from_legend;
        this.legend_config = params.legend_config;
        this.legend_order = params.legend_order;
    }
    public getLegendConfig() {
        return this.legend_config;
    }

    public apply(d: Datum, cell_width: number, cell_height: number) {
        // Gets concrete shapes (i.e. computed
        // real values from percentages)
        const concrete_shapes = [];
        for (let i = 0, shapes_len = this.shapes.length; i < shapes_len; i++) {
            concrete_shapes.push(
                this.shapes[i].getComputedParams(d, cell_width, cell_height)
            );
        }
        return concrete_shapes;
    }

    public isExcludedFromLegend() {
        return this.exclude_from_legend;
    }
}

class GradientCategoricalRuleSet extends RuleSet {
    private gradientRuleSet: GradientRuleSet;
    private categoricalRuleSet: CategoricalRuleSet;
    constructor(params: IGradientAndCategoricalRuleSetParams) {
        super(params);
        // For the GradientCategoricalRuleSet a datum must always have a
        // value and may have a category attribute. A datum is 'NA'
        // when not meeting the requirements for the GradientRuleSet.
        // To achieve correct evaluation, the CategoricalRuleSet is
        // asked not to contribute an `NA` rule (via `true` flag).
        this.gradientRuleSet = new GradientRuleSet(params);
        this.categoricalRuleSet = new CategoricalRuleSet(params, true);
    }

    // RuleSet API
    public getSpecificShapesForDatum(
        data: Datum,
        cell_width: number,
        cell_height: number,
        out_active_rules: ActiveRules | undefined,
        data_id_key: string & keyof Datum,
        important_ids?: ColumnProp<boolean>
    ) {
        const shapes = [];
        // check the type of datum (categorical or continuous) and delegate
        // fetching of shapes to the appropriate RuleSet class
        for (let i = 0; i < data.length; i++) {
            const datum = data[i];
            if (this.isCategorical(datum)) {
                shapes.push(
                    this.categoricalRuleSet.getSpecificShapesForDatum(
                        [datum],
                        cell_width,
                        cell_height,
                        out_active_rules,
                        data_id_key,
                        important_ids
                    )[0]
                );
            } else {
                shapes.push(
                    this.gradientRuleSet.getSpecificShapesForDatum(
                        [datum],
                        cell_width,
                        cell_height,
                        out_active_rules,
                        data_id_key,
                        important_ids
                    )[0]
                );
            }
        }
        return shapes;
    }

    // RuleSet API
    public getSpecificRulesForDatum(datum?: Datum) {
        const categoricalRules = this.categoricalRuleSet.getSpecificRulesForDatum(
            datum
        );
        const gradientRules = this.gradientRuleSet.getSpecificRulesForDatum(
            datum
        );
        const rules = categoricalRules.concat(gradientRules);
        return rules;
    }

    // helper function
    public isCategorical(datum: Datum) {
        // A categorical value is recognized by presence of a category attribute.
        // Note: a categorical datum still requires a continuous value (used for clustering).
        return datum[this.categoricalRuleSet.category_key] !== undefined;
    }
}

export default function(params: RuleSetParams) {
    let ret: RuleSet;
    switch (params.type) {
        case RuleSetType.CATEGORICAL:
            ret = new CategoricalRuleSet(params as ICategoricalRuleSetParams);
            break;
        case RuleSetType.GRADIENT:
            ret = new GradientRuleSet(params as IGradientRuleSetParams);
            break;
        case RuleSetType.GRADIENT_AND_CATEGORICAL:
            ret = new GradientCategoricalRuleSet(
                params as IGradientAndCategoricalRuleSetParams
            );
            break;
        case RuleSetType.BAR:
            ret = new BarRuleSet(params as IBarRuleSetParams);
            break;
        case RuleSetType.STACKED_BAR:
            ret = new StackedBarRuleSet(params as IStackedBarRuleSetParams);
            break;
        case RuleSetType.GENE:
        default:
            ret = new GeneticAlterationRuleSet(
                params as IGeneticAlterationRuleSetParams
            );
            break;
    }
    return ret;
}
