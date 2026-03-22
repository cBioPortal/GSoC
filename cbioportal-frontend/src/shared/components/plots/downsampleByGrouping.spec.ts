import { assert } from 'chai';
import { downsampleByGrouping } from './downsampleByGrouping';
import _ from 'lodash';

const data: { x: number; y: number; blah: string }[] = [
    { x: 0, y: 0, blah: 'A' },
    { x: 1, y: 0, blah: 'B' },
    { x: 2, y: 0, blah: 'C' },
    { x: 0, y: 3, blah: 'D' },
    { x: 0, y: 4, blah: 'E' },
    { x: 1, y: 5, blah: 'F' },
];

const sortBy = [(d: any) => d.x, (d: any) => d.y];
describe('downsampleByGrouping', () => {
    it('returns correct result for empty input', () => {
        assert.deepEqual(downsampleByGrouping([], 1), []);
    });
    it('returns original array with zero distance threshold', () => {
        assert.deepEqual(
            _.sortBy<any>(downsampleByGrouping(data, 0), sortBy),
            _.sortBy<any>(data, sortBy).map(d => ({
                x: d.x,
                y: d.y,
                data: [d],
            }))
        );
    });
    it('downsamples by grouping correctly with threshold 1', () => {
        assert.deepEqual(_.sortBy<any>(downsampleByGrouping(data, 1), sortBy), [
            {
                x: 0,
                y: 0,
                data: [
                    { x: 0, y: 0, blah: 'A' },
                    { x: 1, y: 0, blah: 'B' },
                ],
            },
            {
                x: 0,
                y: 3,
                data: [
                    { x: 0, y: 3, blah: 'D' },
                    { x: 0, y: 4, blah: 'E' },
                ],
            },
            { x: 1, y: 5, data: [{ x: 1, y: 5, blah: 'F' }] },
            { x: 2, y: 0, data: [{ x: 2, y: 0, blah: 'C' }] },
        ]);
    });
    it('downsamples by grouping correctly with threshold 2', () => {
        assert.deepEqual(_.sortBy<any>(downsampleByGrouping(data, 2), sortBy), [
            {
                x: 0,
                y: 0,
                data: [
                    { x: 0, y: 0, blah: 'A' },
                    { x: 1, y: 0, blah: 'B' },
                    { x: 2, y: 0, blah: 'C' },
                ],
            },
            {
                x: 0,
                y: 3,
                data: [
                    { x: 0, y: 3, blah: 'D' },
                    { x: 0, y: 4, blah: 'E' },
                ],
            },
            { x: 1, y: 5, data: [{ x: 1, y: 5, blah: 'F' }] },
        ]);
    });
    it('downsamples by grouping correctly with threshold 3', () => {
        assert.deepEqual(_.sortBy<any>(downsampleByGrouping(data, 3), sortBy), [
            {
                x: 0,
                y: 0,
                data: [
                    { x: 0, y: 0, blah: 'A' },
                    { x: 1, y: 0, blah: 'B' },
                    { x: 2, y: 0, blah: 'C' },
                    { x: 0, y: 3, blah: 'D' },
                ],
            },
            {
                x: 0,
                y: 4,
                data: [
                    { x: 0, y: 4, blah: 'E' },
                    { x: 1, y: 5, blah: 'F' },
                ],
            },
        ]);
    });
    it('downsamples by grouping correctly with threshold 4', () => {
        assert.deepEqual(_.sortBy<any>(downsampleByGrouping(data, 4), sortBy), [
            {
                x: 0,
                y: 0,
                data: [
                    { x: 0, y: 0, blah: 'A' },
                    { x: 1, y: 0, blah: 'B' },
                    { x: 2, y: 0, blah: 'C' },
                    { x: 0, y: 3, blah: 'D' },
                    { x: 0, y: 4, blah: 'E' },
                ],
            },
            { x: 1, y: 5, data: [{ x: 1, y: 5, blah: 'F' }] },
        ]);
    });
    it('downsamples by grouping correctly with threshold 5', () => {
        assert.deepEqual(_.sortBy<any>(downsampleByGrouping(data, 5), sortBy), [
            {
                x: 0,
                y: 0,
                data: [
                    { x: 0, y: 0, blah: 'A' },
                    { x: 1, y: 0, blah: 'B' },
                    { x: 2, y: 0, blah: 'C' },
                    { x: 0, y: 3, blah: 'D' },
                    { x: 0, y: 4, blah: 'E' },
                ],
            },
            { x: 1, y: 5, data: [{ x: 1, y: 5, blah: 'F' }] },
        ]);
    });
    it('downsamples by grouping correctly with threshold 6', () => {
        assert.deepEqual(_.sortBy<any>(downsampleByGrouping(data, 6), sortBy), [
            {
                x: 0,
                y: 0,
                data: [
                    { x: 0, y: 0, blah: 'A' },
                    { x: 1, y: 0, blah: 'B' },
                    { x: 2, y: 0, blah: 'C' },
                    { x: 0, y: 3, blah: 'D' },
                    { x: 0, y: 4, blah: 'E' },
                    { x: 1, y: 5, blah: 'F' },
                ],
            },
        ]);
    });
});
