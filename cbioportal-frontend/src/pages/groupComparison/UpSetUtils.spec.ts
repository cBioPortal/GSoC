import { assert } from 'chai';
import _ from 'lodash';
import { getPlotDomain } from './UpSetUtils';

describe('UpSetUtils', () => {
    describe('getPlotDomain', () => {
        let categoryCoord = (categoryIndex: number) => 25 * categoryIndex;

        it('returns correct result for empty input', () => {
            assert.deepEqual(getPlotDomain(0, 0, categoryCoord), {
                x: [0, 0],
                y: [0, 0],
            });
        });

        it('returns correct result for nonempty x and empty y count', () => {
            assert.deepEqual(getPlotDomain(3, 0, categoryCoord), {
                x: [0, 50],
                y: [0, 0],
            });
        });

        it('returns correct result for empty x and nonempty y count', () => {
            assert.deepEqual(getPlotDomain(0, 3, categoryCoord), {
                x: [0, 0],
                y: [0, 50],
            });
        });

        it('returns correct result for nonempty x and y count', () => {
            assert.deepEqual(getPlotDomain(3, 3, categoryCoord), {
                x: [0, 50],
                y: [0, 50],
            });
        });

        it('returns correct result for nonempty x and empty y count and without calculating coordinates for x', () => {
            assert.deepEqual(getPlotDomain(3, 0, categoryCoord, false, true), {
                x: [0, 3],
                y: [0, 0],
            });
        });

        it('returns correct result for empty x and nonempty y count and without calculating coordinates for y', () => {
            assert.deepEqual(getPlotDomain(0, 3, categoryCoord, true, false), {
                x: [0, 0],
                y: [0, 3],
            });
        });

        it('returns correct result for nonempty x and y count and  without calculating coordinates for x and y', () => {
            assert.deepEqual(getPlotDomain(3, 3, categoryCoord, false, false), {
                x: [0, 3],
                y: [0, 3],
            });
        });
    });
});
