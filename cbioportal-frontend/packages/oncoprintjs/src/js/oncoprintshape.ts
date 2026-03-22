import { Datum } from './oncoprintmodel';
import { RGBAColor } from './oncoprintruleset';

type StringParameter = 'type';
type PercentNumberParameter =
    | 'width'
    | 'height'
    | 'x'
    | 'y'
    | 'x1'
    | 'x2'
    | 'x3'
    | 'y1'
    | 'y2'
    | 'y3';
type PlainNumberParameter = 'z' | 'stroke-width' | 'stroke-opacity';
type RGBAParameter = 'stroke' | 'fill';
type NumberParameter = PercentNumberParameter | PlainNumberParameter;
type Parameter = StringParameter | NumberParameter | RGBAParameter;

const default_parameter_values: { [x in StringParameter]?: string } &
    { [x in NumberParameter]?: number } &
    { [x in RGBAParameter]?: RGBAColor } = {
    width: 100,
    height: 100,
    x: 0,
    y: 0,
    z: 0,
    x1: 0,
    x2: 0,
    x3: 0,
    y1: 0,
    y2: 0,
    y3: 0,
    stroke: [0, 0, 0, 0],
    fill: [23, 23, 23, 1],
    'stroke-width': 0,
    'stroke-opacity': 0,
};

const percent_parameter_name_to_dimension_index: {
    [x in PercentNumberParameter]: number;
} = {
    width: 0,
    x: 0,
    x1: 0,
    x2: 0,
    x3: 0,
    height: 1,
    y: 1,
    y1: 1,
    y2: 1,
    y3: 1,
};

const hash_parameter_order: Parameter[] = [
    'width',
    'height',
    'x',
    'y',
    'z',
    'x1',
    'x2',
    'x3',
    'y1',
    'y2',
    'y3',
    'stroke',
    'fill',
    'stroke-width',
    'stroke-opacity',
    'type',
];

type StringParamFunction = (d: Datum) => string;
type NumberParamFunction = (d: Datum) => number;
type RGBAParamFunction = (d: Datum) => RGBAColor;
type ParamFunction =
    | StringParamFunction
    | NumberParamFunction
    | RGBAParamFunction;

export type ShapeParams = {
    [x in StringParameter]?: string | StringParamFunction;
} &
    { [x in NumberParameter]?: number | NumberParamFunction } &
    { [x in RGBAParameter]?: RGBAColor | RGBAParamFunction };

type ShapeParamsWithType = {
    [x in StringParameter]?:
        | { type: 'function'; value: StringParamFunction }
        | { type: 'value'; value: string };
} &
    {
        [x in NumberParameter]?:
            | { type: 'function'; value: NumberParamFunction }
            | { type: 'value'; value: number };
    } &
    {
        [x in RGBAParameter]?:
            | { type: 'function'; value: RGBAParamFunction }
            | { type: 'value'; value: RGBAColor };
    };

export type ComputedShapeParams = { [x in StringParameter]?: string } &
    { [x in NumberParameter]?: number } &
    { [x in RGBAParameter]?: RGBAColor };

function isPercentParam(
    param_name: string
): param_name is PercentNumberParameter {
    return param_name in percent_parameter_name_to_dimension_index;
}

export class Shape {
    private static cache: { [hash: string]: ComputedShapeParams } = {}; // shape cache to reuse objects and thus save memory
    private params_with_type: ShapeParamsWithType = {};
    private onlyDependsOnWidthAndHeight: boolean;

    private instanceCache = {
        lastComputedParams: null as ComputedShapeParams | null,
        lastWidth: -1,
        lastHeight: -1,
    };

    constructor(private params: ShapeParams) {
        this.completeWithDefaults();
        this.markParameterTypes();
    }

    public static hashComputedShape(
        computed_params: ComputedShapeParams,
        z_index?: number | string
    ) {
        return (
            hash_parameter_order.reduce(function(
                hash: string,
                param_name: Parameter
            ) {
                return hash + ',' + computed_params[param_name];
            },
            '') +
            ',' +
            z_index
        );
    }

    private static getCachedShape(computed_params: ComputedShapeParams) {
        const hash = Shape.hashComputedShape(computed_params);
        Shape.cache[hash] = Shape.cache[hash] || Object.freeze(computed_params);
        return Shape.cache[hash];
    }

    public getRequiredParameters(): Parameter[] {
        throw 'Not defined for base class';
    }

    public completeWithDefaults() {
        const required_parameters = this.getRequiredParameters();
        for (let i = 0; i < required_parameters.length; i++) {
            const param = required_parameters[i];
            this.params[param] = (typeof this.params[param] === 'undefined'
                ? default_parameter_values[param]
                : this.params[param]) as any;
        }
    }
    public markParameterTypes() {
        const parameters = Object.keys(this.params) as Parameter[];
        let onlyDependsOnWidthAndHeight = true;
        for (let i = 0; i < parameters.length; i++) {
            const param_name = parameters[i];
            const param_val = this.params[param_name];
            if (typeof param_val === 'function') {
                this.params_with_type[param_name] = {
                    type: 'function',
                    value: param_val as any,
                };
                onlyDependsOnWidthAndHeight = false;
            } else {
                this.params_with_type[param_name] = {
                    type: 'value',
                    value: param_val,
                } as any;
            }
        }
        this.onlyDependsOnWidthAndHeight = onlyDependsOnWidthAndHeight;
    }
    public getComputedParams(
        d: Datum,
        base_width: number,
        base_height: number
    ) {
        if (
            this.onlyDependsOnWidthAndHeight &&
            this.instanceCache.lastWidth === base_width &&
            this.instanceCache.lastHeight === base_height
        ) {
            return this.instanceCache.lastComputedParams!;
        }

        const computed_params: Partial<ComputedShapeParams> = {};
        const param_names = Object.keys(this.params_with_type) as Parameter[];
        const dimensions: [number, number] = [base_width, base_height];
        for (let i = 0; i < param_names.length; i++) {
            const param_name = param_names[i];
            const param_val_map = this.params_with_type[param_name];
            let param_val = param_val_map.value;
            if (param_name !== 'type') {
                if (param_val_map.type === 'function') {
                    param_val = (param_val as ParamFunction)(d);
                }
                // at this point, param_val is resolved to either a string or number

                if (isPercentParam(param_name)) {
                    // if its a percentage param, compute value as percentage of width or height
                    param_val =
                        ((param_val as number) / 100) *
                        dimensions[
                            percent_parameter_name_to_dimension_index[
                                param_name
                            ]
                        ];
                }
            }
            //@ts-ignore
            computed_params[param_name] = param_val;
        }

        if (this.onlyDependsOnWidthAndHeight) {
            // only cache if its cacheable, otherwise it would be a waste of memory to save
            this.instanceCache.lastHeight = base_height;
            this.instanceCache.lastWidth = base_width;
            this.instanceCache.lastComputedParams = Shape.getCachedShape(
                computed_params
            );
        }

        return Shape.getCachedShape(computed_params);
    }
}

type SpecificComputedShapeParams<ShapeParamType> = {
    [x in ShapeParamType & StringParameter]: string;
} &
    { [x in ShapeParamType & NumberParameter]: number } &
    { [x in ShapeParamType & RGBAParameter]: RGBAColor };

type RectangleParameter =
    | 'width'
    | 'height'
    | 'x'
    | 'y'
    | 'z'
    | 'stroke'
    | 'stroke-width'
    | 'fill';
export type ComputedRectangleParams = SpecificComputedShapeParams<
    RectangleParameter
>;
export class Rectangle extends Shape {
    public getRequiredParameters(): RectangleParameter[] {
        return [
            'width',
            'height',
            'x',
            'y',
            'z',
            'stroke',
            'fill',
            'stroke-width',
        ];
    }
}

type TriangleParameter =
    | 'x1'
    | 'x2'
    | 'x3'
    | 'y1'
    | 'y2'
    | 'y3'
    | 'z'
    | 'stroke'
    | 'stroke-width'
    | 'fill';
export type ComputedTriangleParams = SpecificComputedShapeParams<
    TriangleParameter
>;
export class Triangle extends Shape {
    public getRequiredParameters(): TriangleParameter[] {
        return [
            'x1',
            'x2',
            'x3',
            'y1',
            'y2',
            'y3',
            'z',
            'stroke',
            'fill',
            'stroke-width',
        ];
    }
}

export type EllipseParameter =
    | 'width'
    | 'height'
    | 'x'
    | 'y'
    | 'z'
    | 'stroke'
    | 'stroke-width'
    | 'fill';
export type ComputedEllipseParams = SpecificComputedShapeParams<
    EllipseParameter
>;
export class Ellipse extends Shape {
    public getRequiredParameters(): EllipseParameter[] {
        return [
            'width',
            'height',
            'x',
            'y',
            'z',
            'stroke',
            'fill',
            'stroke-width',
        ];
    }
}

export type LineParameter =
    | 'x1'
    | 'y1'
    | 'x2'
    | 'y2'
    | 'z'
    | 'stroke'
    | 'stroke-width';
export type ComputedLineParams = SpecificComputedShapeParams<LineParameter>;
export class Line extends Shape {
    public getRequiredParameters(): LineParameter[] {
        return ['x1', 'x2', 'y1', 'y2', 'z', 'stroke', 'stroke-width'];
    }
}
