import { assert } from 'chai';
import _ from 'lodash';
import { getBinnedData } from './StudyViewScatterPlotUtils';

describe('StudyViewScatterPlotUtils', () => {
    describe('getBinnedData', () => {
        let plotDomain: any;
        beforeAll(() => {
            plotDomain = { x: [0, 10], y: [0, 10] };
        });
        it('returns the correct result for empty data', () => {
            assert.deepEqual(getBinnedData([], plotDomain, 3), []);
        });
        it('returns the correct result for one data', () => {
            assert.deepEqual(
                getBinnedData([{ x: 0, y: 0, asdf: 'YO' }], plotDomain, 3),
                [{ x: 0, y: 0, data: [{ x: 0, y: 0, asdf: 'YO' }] }],
                'data at origin'
            );
            assert.deepEqual(
                getBinnedData([{ x: 3, y: 5, asdf: 'YO' }], plotDomain, 5),
                [{ x: 2, y: 4, data: [{ x: 3, y: 5, asdf: 'YO' }] }],
                'data in middle'
            );
        });
        it('returns the correct result for one data per bin for several bins', () => {
            assert.deepEqual(
                _.sortBy(
                    getBinnedData(
                        [
                            { x: 1, y: 2, asdf: 'YO1' },
                            { x: 7, y: 1, asdf: 'YO2' },
                            { x: 3, y: 4, asdf: 'YO3' },
                            { x: 0, y: 9, asdf: 'YO4' },
                            { x: 6, y: 2, asdf: 'YO5' },
                            { x: 8, y: 1, asdf: 'YO6' },
                            { x: 7, y: 5, asdf: 'YO7' },
                            { x: 4, y: 4, asdf: 'YO8' },
                        ],
                        plotDomain,
                        5
                    )
                ),
                [
                    { x: 0, y: 2, data: [{ x: 1, y: 2, asdf: 'YO1' }] },
                    { x: 6, y: 0, data: [{ x: 7, y: 1, asdf: 'YO2' }] },
                    { x: 2, y: 4, data: [{ x: 3, y: 4, asdf: 'YO3' }] },
                    { x: 0, y: 8, data: [{ x: 0, y: 9, asdf: 'YO4' }] },
                    { x: 6, y: 2, data: [{ x: 6, y: 2, asdf: 'YO5' }] },
                    { x: 8, y: 0, data: [{ x: 8, y: 1, asdf: 'YO6' }] },
                    { x: 6, y: 4, data: [{ x: 7, y: 5, asdf: 'YO7' }] },
                    { x: 4, y: 4, data: [{ x: 4, y: 4, asdf: 'YO8' }] },
                ]
            );
        });
        it('returns the correct result for a bunch of data fitting into some bins', () => {
            assert.deepEqual(
                _.sortBy(
                    getBinnedData(
                        [
                            { x: 1, y: 2, asdf: 'YO1' },
                            { x: 0, y: 2, asdf: 'YO2' },
                            { x: 3, y: 4, asdf: 'YO3' },
                            { x: 0, y: 9, asdf: 'YO4' },
                            { x: 1, y: 9, asdf: 'YO5' },
                            { x: 1, y: 8, asdf: 'YO6' },
                            { x: 7, y: 5, asdf: 'YO7' },
                            { x: 4, y: 4, asdf: 'YO8' },
                        ],
                        plotDomain,
                        5
                    )
                ),
                [
                    {
                        x: 0,
                        y: 2,
                        data: [
                            { x: 1, y: 2, asdf: 'YO1' },
                            { x: 0, y: 2, asdf: 'YO2' },
                        ],
                    },
                    { x: 2, y: 4, data: [{ x: 3, y: 4, asdf: 'YO3' }] },
                    {
                        x: 0,
                        y: 8,
                        data: [
                            { x: 0, y: 9, asdf: 'YO4' },
                            { x: 1, y: 9, asdf: 'YO5' },
                            { x: 1, y: 8, asdf: 'YO6' },
                        ],
                    },
                    { x: 6, y: 4, data: [{ x: 7, y: 5, asdf: 'YO7' }] },
                    { x: 4, y: 4, data: [{ x: 4, y: 4, asdf: 'YO8' }] },
                ]
            );
        });
    });
});
