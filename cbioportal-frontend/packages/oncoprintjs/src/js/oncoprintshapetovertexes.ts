import { ComputedShapeParams, Rectangle } from './oncoprintshape';
import { RGBAColor } from './oncoprintruleset';

const halfsqrt2 = Math.sqrt(2) / 2;

function normalizeRGBA(color: RGBAColor): [number, number, number, number] {
    return [color[0], color[1], color[2], color[3] * 255];
}

type AddVertexCallback = (
    vertex: [number, number, number],
    color: [number, number, number, number]
) => void;

function rectangleToVertexes(
    params: ComputedShapeParams,
    z_index: number,
    addVertex: AddVertexCallback
) {
    const x = params.x,
        y = params.y,
        height = params.height,
        width = params.width;

    // Fill
    const fill_rgba = normalizeRGBA(params.fill);
    addVertex([x, y, z_index], fill_rgba);
    addVertex([x + width, y, z_index], fill_rgba);
    addVertex([x + width, y + height, z_index], fill_rgba);

    addVertex([x, y, z_index], fill_rgba);
    addVertex([x + width, y + height, z_index], fill_rgba);
    addVertex([x, y + height, z_index], fill_rgba);

    // Stroke
    const stroke_width = params['stroke-width'];
    if (stroke_width > 0) {
        // left side
        const stroke_rgba = normalizeRGBA(params.stroke);
        addVertex([x, y, z_index], stroke_rgba);
        addVertex([x + stroke_width, y, z_index], stroke_rgba);
        addVertex([x + stroke_width, y + height, z_index], stroke_rgba);

        addVertex([x, y, z_index], stroke_rgba);
        addVertex([x + stroke_width, y + height, z_index], stroke_rgba);
        addVertex([x, y + height, z_index], stroke_rgba);

        // right side
        addVertex([x + width, y, z_index], stroke_rgba);
        addVertex([x + width - stroke_width, y, z_index], stroke_rgba);
        addVertex([x + width - stroke_width, y + height, z_index], stroke_rgba);

        addVertex([x + width, y, z_index], stroke_rgba);
        addVertex([x + width - stroke_width, y + height, z_index], stroke_rgba);
        addVertex([x + width, y + height, z_index], stroke_rgba);

        // top side
        addVertex([x, y, z_index], stroke_rgba);
        addVertex([x + width, y, z_index], stroke_rgba);
        addVertex([x + width, y + stroke_width, z_index], stroke_rgba);

        addVertex([x, y, z_index], stroke_rgba);
        addVertex([x + width, y + stroke_width, z_index], stroke_rgba);
        addVertex([x, y + stroke_width, z_index], stroke_rgba);

        // bottom side
        addVertex([x, y + height, z_index], stroke_rgba);
        addVertex([x + width, y + height, z_index], stroke_rgba);
        addVertex([x + width, y + height - stroke_width, z_index], stroke_rgba);

        addVertex([x, y + height, z_index], stroke_rgba);
        addVertex([x + width, y + height - stroke_width, z_index], stroke_rgba);
        addVertex([x, y + height - stroke_width, z_index], stroke_rgba);
    }
}

function triangleToVertexes(
    params: ComputedShapeParams,
    z_index: number,
    addVertex: AddVertexCallback
) {
    const fill_rgba = normalizeRGBA(params.fill);
    addVertex([params.x1, params.y1, z_index], fill_rgba);
    addVertex([params.x2, params.y2, z_index], fill_rgba);
    addVertex([params.x3, params.y3, z_index], fill_rgba);
}

function ellipseToVertexes(
    params: ComputedShapeParams,
    z_index: number,
    addVertex: AddVertexCallback
) {
    const center = {
        x: params.x + params.width / 2,
        y: params.y + params.height / 2,
    };
    const horzrad = params.width / 2;
    const vertrad = params.height / 2;

    const fill_rgba = normalizeRGBA(params.fill);
    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x + horzrad, center.y, z_index], fill_rgba);
    addVertex(
        [
            center.x + halfsqrt2 * horzrad,
            center.y + halfsqrt2 * vertrad,
            z_index,
        ],
        fill_rgba
    );

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex(
        [
            center.x + halfsqrt2 * horzrad,
            center.y + halfsqrt2 * vertrad,
            z_index,
        ],
        fill_rgba
    );
    addVertex([center.x, center.y + vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x, center.y + vertrad, z_index], fill_rgba);
    addVertex(
        [
            center.x - halfsqrt2 * horzrad,
            center.y + halfsqrt2 * vertrad,
            z_index,
        ],
        fill_rgba
    );

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex(
        [
            center.x - halfsqrt2 * horzrad,
            center.y + halfsqrt2 * vertrad,
            z_index,
        ],
        fill_rgba
    );
    addVertex([center.x - horzrad, center.y, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x - horzrad, center.y, z_index], fill_rgba);
    addVertex(
        [
            center.x - halfsqrt2 * horzrad,
            center.y - halfsqrt2 * vertrad,
            z_index,
        ],
        fill_rgba
    );

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex(
        [
            center.x - halfsqrt2 * horzrad,
            center.y - halfsqrt2 * vertrad,
            z_index,
        ],
        fill_rgba
    );
    addVertex([center.x, center.y - vertrad, z_index], fill_rgba);

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex([center.x, center.y - vertrad, z_index], fill_rgba);
    addVertex(
        [
            center.x + halfsqrt2 * horzrad,
            center.y - halfsqrt2 * vertrad,
            z_index,
        ],
        fill_rgba
    );

    addVertex([center.x, center.y, z_index], fill_rgba);
    addVertex(
        [
            center.x + halfsqrt2 * horzrad,
            center.y - halfsqrt2 * vertrad,
            z_index,
        ],
        fill_rgba
    );
    addVertex([center.x + horzrad, center.y, z_index], fill_rgba);
}

function lineToVertexes(
    params: ComputedShapeParams,
    z_index: number,
    addVertex: AddVertexCallback
) {
    // For simplicity of dealing with webGL we'll implement lines as thin triangle pairs
    let x1 = params.x1;
    let x2 = params.x2;
    let y1 = params.y1;
    let y2 = params.y2;

    if (x1 !== x2) {
        // WLOG make x1,y1 the one on the left
        if (Math.min(x1, x2) === x2) {
            const tmpx1 = x1;
            const tmpy1 = y1;
            x1 = x2;
            y1 = y2;
            x2 = tmpx1;
            y2 = tmpy1;
        }
    }

    const perpendicular_vector = [y2 - y1, x1 - x2];
    const perpendicular_vector_length = Math.sqrt(
        perpendicular_vector[0] * perpendicular_vector[0] +
            perpendicular_vector[1] * perpendicular_vector[1]
    );
    const unit_perp_vector = [
        perpendicular_vector[0] / perpendicular_vector_length,
        perpendicular_vector[1] / perpendicular_vector_length,
    ];

    const half_stroke_width = params['stroke-width'] / 2;
    const direction1 = [
        unit_perp_vector[0] * half_stroke_width,
        unit_perp_vector[1] * half_stroke_width,
    ];
    const direction2 = [direction1[0] * -1, direction1[1] * -1];
    const A = [x1 + direction1[0], y1 + direction1[1]];
    const B = [x1 + direction2[0], y1 + direction2[1]];
    const C = [x2 + direction1[0], y2 + direction1[1]];
    const D = [x2 + direction2[0], y2 + direction2[1]];

    const stroke_rgba = normalizeRGBA(params.stroke);
    addVertex([A[0], A[1], z_index], stroke_rgba);
    addVertex([B[0], B[1], z_index], stroke_rgba);
    addVertex([C[0], C[1], z_index], stroke_rgba);

    addVertex([C[0], C[1], z_index], stroke_rgba);
    addVertex([D[0], D[1], z_index], stroke_rgba);
    addVertex([B[0], B[1], z_index], stroke_rgba);
}

export default function(
    oncoprint_shape_computed_params: ComputedShapeParams,
    z_index: number,
    addVertex: AddVertexCallback
) {
    // target_position_array is an array with 3-d float vertexes
    // target_color_array is an array with rgba values in [0,1]
    // We pass them in to save on concatenation costs

    const type = oncoprint_shape_computed_params.type;
    if (type === 'rectangle') {
        return rectangleToVertexes(
            oncoprint_shape_computed_params,
            z_index,
            addVertex
        );
    } else if (type === 'triangle') {
        return triangleToVertexes(
            oncoprint_shape_computed_params,
            z_index,
            addVertex
        );
    } else if (type === 'ellipse') {
        return ellipseToVertexes(
            oncoprint_shape_computed_params,
            z_index,
            addVertex
        );
    } else if (type === 'line') {
        return lineToVertexes(
            oncoprint_shape_computed_params,
            z_index,
            addVertex
        );
    }
}

export function getNumWebGLVertexes(shape: ComputedShapeParams) {
    let ret: number;
    switch (shape.type) {
        case 'rectangle':
            if (shape['stroke-width'] > 0) {
                ret = 30;
            } else {
                ret = 6;
            }
            break;
        case 'triangle':
            ret = 3;
            break;
        case 'ellipse':
            ret = 24;
            break;
        case 'line':
            ret = 6;
            break;
    }
    return ret;
}
