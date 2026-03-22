import svgfactory from './svgfactory';
import $ from 'jquery';
import OncoprintModel from './oncoprintmodel';
import { Rule, RuleWithId } from './oncoprintruleset';

function nodeIsVisible(node: HTMLElement) {
    let ret = true;
    while (node && node.tagName.toLowerCase() !== 'html') {
        if ($(node).css('display') === 'none') {
            ret = false;
            break;
        }
        node = node.parentNode as HTMLElement;
    }
    return ret;
}

export default class OncoprintLegendView {
    private $svg: JQuery<SVGElement>;
    private rendering_suppressed = false;
    private width: number;

    private rule_set_label_config = {
        weight: 'bold',
        size: 12,
        font: 'Arial',
    };
    private rule_label_config = {
        weight: 'normal',
        size: 12,
        font: 'Arial',
    };

    private padding_after_rule_set_label = 10;
    private padding_between_rules = 20;
    private padding_between_rule_set_rows = 10;

    constructor(
        private $div: JQuery,
        private base_width: number,
        private base_height: number
    ) {
        this.$svg = $(svgfactory.svg(200, 200)).appendTo(this.$div);
        this.width = $div.width();
    }

    private renderLegend(
        model: OncoprintModel,
        target_svg?: SVGElement,
        show_all?: boolean
    ) {
        if (this.rendering_suppressed) {
            return;
        }
        if (typeof target_svg === 'undefined') {
            target_svg = this.$svg[0];
        }
        if (!nodeIsVisible((target_svg as any) as HTMLElement)) {
            return;
        }
        $(target_svg).empty();
        const defs = svgfactory.defs();
        target_svg.appendChild(defs);

        const everything_group = svgfactory.group(0, 0);
        target_svg.appendChild(everything_group);

        const rule_sets = model.getRuleSets();
        let y = 0;
        const rule_start_x = 200;
        for (let i = 0; i < rule_sets.length; i++) {
            if (rule_sets[i].exclude_from_legend && !show_all) {
                continue;
            }
            const rules = model.getActiveRules(rule_sets[i].rule_set_id);
            if (rules.length === 0) {
                // dont render this ruleset into legend if no active rules
                continue;
            }
            const rule_set_group = svgfactory.group(0, y);
            everything_group.appendChild(rule_set_group);
            (function addLabel() {
                if (
                    typeof rule_sets[i].legend_label !== 'undefined' &&
                    rule_sets[i].legend_label.length > 0
                ) {
                    const label = svgfactory.text(
                        rule_sets[i].legend_label,
                        0,
                        0,
                        12,
                        'Arial',
                        'bold'
                    );
                    rule_set_group.appendChild(label);
                    svgfactory.wrapText(label, rule_start_x);
                }
            })();

            let x = rule_start_x + this.padding_after_rule_set_label;
            let in_group_y_offset = 0;

            const labelSort = function(ruleA: RuleWithId, ruleB: RuleWithId) {
                const labelA = ruleA.rule.legend_label;
                const labelB = ruleB.rule.legend_label;
                if (labelA && labelB) {
                    return labelA.localeCompare(labelB);
                } else if (!labelA && !labelB) {
                    return 0;
                } else if (!labelA) {
                    return -1;
                } else if (!labelB) {
                    return 1;
                }
                return 0;
            };

            rules.sort(function(ruleA, ruleB) {
                // sort, by legend_order, then alphabetically
                const orderA = ruleA.rule.legend_order;
                const orderB = ruleB.rule.legend_order;

                if (
                    typeof orderA === 'undefined' &&
                    typeof orderB === 'undefined'
                ) {
                    // if neither have defined order, then sort alphabetically
                    return labelSort(ruleA, ruleB);
                } else if (
                    typeof orderA !== 'undefined' &&
                    typeof orderB !== 'undefined'
                ) {
                    // if both have defined order, sort by order
                    if (orderA < orderB) {
                        return -1;
                    } else if (orderA > orderB) {
                        return 1;
                    } else {
                        // if order is same, sort alphabetically
                        return labelSort(ruleA, ruleB);
                    }
                } else if (typeof orderA === 'undefined') {
                    if (orderB === Number.POSITIVE_INFINITY) {
                        return -1; // A comes before B regardless, if B is forced to end
                    } else {
                        //otherwise, A comes after B if B has defined order and A doesnt
                        return 1;
                    }
                } else if (typeof orderB === 'undefined') {
                    if (orderA === Number.POSITIVE_INFINITY) {
                        return 1; // A comes after B regardless, if A is forced to end
                    } else {
                        // otherwise, A comes before B if A has defined order and B doesnt
                        return -1;
                    }
                }
                return 0;
            });
            for (let j = 0; j < rules.length; j++) {
                const rule = rules[j].rule;
                if (rule.exclude_from_legend) {
                    continue;
                }
                const group = this.ruleToSVGGroup(
                    rule,
                    model,
                    target_svg,
                    defs
                );
                group.setAttribute(
                    'transform',
                    'translate(' + x + ',' + in_group_y_offset + ')'
                );
                rule_set_group.appendChild(group);
                if (x + group.getBBox().width > this.width) {
                    x = rule_start_x + this.padding_after_rule_set_label;
                    in_group_y_offset =
                        rule_set_group.getBBox().height +
                        this.padding_between_rule_set_rows;
                    group.setAttribute(
                        'transform',
                        'translate(' + x + ',' + in_group_y_offset + ')'
                    );
                }
                x += group.getBBox().width;
                x += this.padding_between_rules;
            }
            y += rule_set_group.getBBox().height;
            y += 3 * this.padding_between_rule_set_rows;
        }
        const everything_box = everything_group.getBBox();
        this.$svg[0].setAttribute('width', everything_box.width.toString());
        // add 10px to height to give room for rectangle stroke, which doesn't factor in accurately into the bounding box
        //  so that bounding boxes are too small to show the entire stroke (see https://github.com/cBioPortal/cbioportal/issues/3994)
        this.$svg[0].setAttribute(
            'height',
            (everything_box.height + 10).toString()
        );
    }

    private ruleToSVGGroup(
        rule: Rule,
        model: OncoprintModel,
        target_svg: SVGElement,
        target_defs: SVGDefsElement
    ) {
        const root = svgfactory.group(0, 0);
        const config = rule.getLegendConfig();
        if (config.type === 'rule') {
            const concrete_shapes = rule.apply(
                config.target,
                model.getCellWidth(true),
                this.base_height
            );
            if (rule.legend_base_color) {
                // generate backgrounds
                const baseRect = svgfactory.rect(
                    0,
                    0,
                    model.getCellWidth(true),
                    this.base_height,
                    {
                        type: 'rgba',
                        value: rule.legend_base_color,
                    }
                );
                root.appendChild(baseRect);
            }
            // generate shapes
            for (let i = 0; i < concrete_shapes.length; i++) {
                root.appendChild(
                    svgfactory.fromShape(concrete_shapes[i], 0, 0)
                );
            }
            if (typeof rule.legend_label !== 'undefined') {
                const font_size = 12;
                const text_node = svgfactory.text(
                    rule.legend_label,
                    model.getCellWidth(true) + 5,
                    this.base_height / 2,
                    font_size,
                    'Arial',
                    'normal'
                );
                target_svg.appendChild(text_node);
                const height = text_node.getBBox().height;
                text_node.setAttribute(
                    'y',
                    (
                        parseFloat(text_node.getAttribute('y')) -
                        height / 2
                    ).toString()
                );
                target_svg.removeChild(text_node);
                root.appendChild(text_node);
            }
        } else if (config.type === 'number') {
            const num_decimal_digits = 2;
            const display_range = config.range.map(function(x) {
                const num_digit_multiplier = Math.pow(10, num_decimal_digits);
                return (
                    Math.round(x * num_digit_multiplier) / num_digit_multiplier
                );
            });
            root.appendChild(
                svgfactory.text(
                    display_range[0].toString(),
                    0,
                    0,
                    12,
                    'Arial',
                    'normal'
                )
            );
            root.appendChild(
                svgfactory.text(
                    display_range[1].toString(),
                    50,
                    0,
                    12,
                    'Arial',
                    'normal'
                )
            );
            const mesh = 100;
            const points: [number, number][] = [];
            let fill = null;
            let linear_gradient = null;
            if (config.range_type === 'NON_POSITIVE') {
                fill = config.negative_color;
            } else if (config.range_type === 'NON_NEGATIVE') {
                fill = config.positive_color;
            } else if (config.range_type === 'ALL') {
                linear_gradient = svgfactory.linearGradient();
                const offset =
                    (Math.abs(display_range[0]) /
                        (Math.abs(display_range[0]) + display_range[1])) *
                    100;
                linear_gradient.appendChild(
                    svgfactory.stop(offset, config.negative_color)
                );
                linear_gradient.appendChild(
                    svgfactory.stop(offset, config.positive_color)
                );
                target_defs.appendChild(linear_gradient);
            }
            points.push([5, 20]);
            for (let i = 0; i < mesh; i++) {
                const t = i / mesh;
                const h = config.interpFn(
                    (1 - t) * config.range[0] + t * config.range[1]
                );
                const height = 20 * h;
                points.push([5 + (40 * i) / mesh, 20 - height]);
            }
            points.push([45, 20]);
            root.appendChild(
                svgfactory.path(points, fill, fill, linear_gradient)
            );
        } else if (config.type === 'gradient') {
            const num_decimal_digits = 2;
            const display_range = config.range.map(function(x) {
                const num_digit_multiplier = Math.pow(10, num_decimal_digits);
                return (
                    Math.round(x * num_digit_multiplier) / num_digit_multiplier
                );
            });
            const gradient = svgfactory.gradient(config.colorFn);
            const gradient_id = gradient.getAttribute('id');
            target_defs.appendChild(gradient);
            root.appendChild(
                svgfactory.text(
                    display_range[0].toString(),
                    0,
                    0,
                    12,
                    'Arial',
                    'normal'
                )
            );
            root.appendChild(
                svgfactory.text(
                    display_range[1].toString(),
                    120,
                    0,
                    12,
                    'Arial',
                    'normal'
                )
            );
            root.appendChild(
                svgfactory.rect(30, 0, 60, 20, {
                    type: 'gradientId',
                    value: gradient_id,
                })
            );
        }
        return root;
    }

    public setWidth(w: number, model: OncoprintModel) {
        this.width = w;
        this.renderLegend(model);
    }
    public removeTrack(model: OncoprintModel) {
        this.renderLegend(model);
    }

    public addTracks(model: OncoprintModel) {
        this.renderLegend(model);
    }

    public setTrackData(model: OncoprintModel) {
        this.renderLegend(model);
    }

    public setTrackImportantIds(model: OncoprintModel) {
        this.renderLegend(model);
    }

    public shareRuleSet(model: OncoprintModel) {
        this.renderLegend(model);
    }

    public setRuleSet(model: OncoprintModel) {
        this.renderLegend(model);
    }

    public setTrackGroupLegendOrder(model: OncoprintModel) {
        this.renderLegend(model);
    }

    public hideTrackLegends(model: OncoprintModel) {
        this.renderLegend(model);
    }

    public showTrackLegends(model: OncoprintModel) {
        this.renderLegend(model);
    }

    public suppressRendering() {
        this.rendering_suppressed = true;
    }

    public releaseRendering(model: OncoprintModel) {
        this.rendering_suppressed = false;
        this.renderLegend(model);
    }

    public toSVGGroup(
        model: OncoprintModel,
        offset_x: number,
        offset_y: number
    ) {
        const root = svgfactory.group(offset_x || 0, offset_y || 0);
        this.$svg.append(root);
        this.renderLegend(model, root, true);
        root.parentNode.removeChild(root);
        return root;
    }
}
