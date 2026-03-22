import HotspotSet from './HotspotSet';
import { assert } from 'chai';

describe('HotspotSet', () => {
    it('works with empty input', () => {
        const hss = new HotspotSet([]);
        assert.deepEqual(hss._getHotspotRegions(), []);
        assert(!hss.check(0));
        assert(!hss.check(3951));
        assert(!hss.check(-1395813));
        assert(!hss.check(0.351));
        assert(!hss.check(0, 10));
    });

    it('works with one input region', () => {
        const hss = new HotspotSet([[0, 5]]);
        assert.deepEqual(hss._getHotspotRegions(), [[0, 5]]);
        assert(hss.check(3));
        assert(hss.check(0, 5));
        assert(hss.check(-1, 0));
        assert(!hss.check(-1));
        assert(hss.check(0));
        assert(hss.check(5));
        assert(hss.check(5, 6));
        assert(hss.check(5, 10));
        assert(hss.check(4, 6));
        assert(hss.check(2, 4));
        assert(!hss.check(6, 6));
        assert(!hss.check(6, 10));
        assert(!hss.check(-5, -1));
    });

    it('works with one singleton region (i.e. single residue)', () => {
        const hss = new HotspotSet([[-3, -3]]);
        assert.deepEqual(hss._getHotspotRegions(), [[-3, -3]]);
        assert(!hss.check(6, 6));
        assert(!hss.check(6, 10));
        assert(hss.check(-5, -1));
        assert(hss.check(-3));
        assert(hss.check(-3, -1));
        assert(hss.check(-6, -1));
        assert(!hss.check(-4, -3.5));
        assert(!hss.check(-4, -4));
    });

    it('works with one singleton region and one interval region', () => {
        const hss = new HotspotSet([
            [-3, -3],
            [0, 5],
        ]);
        assert.deepEqual(hss._getHotspotRegions(), [
            [-3, -3],
            [0, 5],
        ]);
        assert(hss.check(3));
        assert(hss.check(0, 5));
        assert(hss.check(-1, 0));
        assert(!hss.check(-1));
        assert(hss.check(0));
        assert(hss.check(5));
        assert(hss.check(5, 6));
        assert(hss.check(5, 10));
        assert(hss.check(4, 6));
        assert(hss.check(2, 4));
        assert(!hss.check(6, 6));
        assert(!hss.check(6, 10));
        assert(hss.check(-5, -1));
        assert(hss.check(-3));
        assert(hss.check(-3, -1));
        assert(hss.check(-6, -1));
        assert(!hss.check(-4, -3.5));
        assert(!hss.check(-4, -4));
    });

    it('works with one region, consolidated from a few input regions', () => {
        const hss = new HotspotSet([
            [4, 20],
            [0, 5],
            [2, 6],
            [-5, 0],
            [3, 3],
        ]);
        assert.deepEqual(hss._getHotspotRegions(), [[-5, 20]]);
        assert(hss.check(3));
        assert(hss.check(0, 5));
        assert(hss.check(-1, 0));
        assert(hss.check(-1));
        assert(hss.check(0));
        assert(hss.check(5));
        assert(hss.check(5, 6));
        assert(hss.check(5, 10));
        assert(hss.check(4, 6));
        assert(hss.check(2, 4));
        assert(!hss.check(21, 21));
        assert(!hss.check(25, 30));
        assert(!hss.check(-6, -6));
    });

    it('works with two regions, consolidated from several input regions', () => {
        // two regions, consolidated from several
        const hss = new HotspotSet([
            [4, 20],
            [0, 5],
            [30, 60],
            [24, 70],
            [2, 6],
            [-5, 0],
        ]);
        assert.deepEqual(hss._getHotspotRegions(), [
            [-5, 20],
            [24, 70],
        ]);
        assert(hss.check(3));
        assert(hss.check(0, 5));
        assert(hss.check(-1, 0));
        assert(hss.check(-1));
        assert(hss.check(0));
        assert(hss.check(5));
        assert(hss.check(5, 6));
        assert(hss.check(5, 10));
        assert(hss.check(4, 6));
        assert(hss.check(2, 4));
        assert(!hss.check(21, 21));
        assert(hss.check(25, 30));
        assert(!hss.check(-6, -6));
        assert(hss.check(25, 71));
        assert(hss.check(24));
        assert(hss.check(70));
        assert(!hss.check(79));
        assert(hss.check(69, 72));
    });

    it('works with three regions, consolidated from several input regions', () => {
        // three regions, consolidated from several
        const hss = new HotspotSet([
            [-50, -30],
            [-4, 3],
            [-4, 9],
            [-4, 1],
            [-30, -10],
            [100, 200],
        ]);
        assert.deepEqual(hss._getHotspotRegions(), [
            [-50, -10],
            [-4, 9],
            [100, 200],
        ]);
        assert(hss.check(3));
        assert(hss.check(0, 5));
        assert(hss.check(-1, 0));
        assert(hss.check(-1));
        assert(hss.check(0));
        assert(hss.check(5));
        assert(hss.check(5, 6));
        assert(hss.check(5, 10));
        assert(hss.check(4, 6));
        assert(hss.check(2, 4));
        assert(!hss.check(21, 21));
        assert(!hss.check(25, 30));
        assert(!hss.check(-6, -6));
        assert(!hss.check(25, 71));
        assert(!hss.check(24));
        assert(!hss.check(70));
        assert(!hss.check(79));
        assert(!hss.check(69, 72));
        assert(hss.check(100, 200));
        assert(hss.check(200));
        assert(hss.check(100));
        assert(hss.check(80, 200));
        assert(hss.check(80, 220));
        assert(hss.check(80, 140));
        assert(hss.check(120, 180));
        assert(hss.check(180, 299));
        assert(!hss.check(99));
        assert(!hss.check(95, 99));
    });

    it('works with three regions, consolidated from several input regions, using `add` instead of constructor', () => {
        const hss = new HotspotSet();
        assert.isFalse(hss.check(3));
        hss.add(-4, 3);
        assert(hss.check(3));
        assert(hss.check(0, 5));
        assert(hss.check(-1, 0));
        assert(hss.check(-1));
        assert(hss.check(0));
        assert.isFalse(hss.check(5));
        hss.add(-4, 1);
        hss.add(-4, 9);
        hss.add(-50, -30);
        hss.add(-30, -10);
        hss.add(100, 200);
        assert(hss.check(5));
        assert(hss.check(5, 6));
        assert(hss.check(5, 10));
        assert(hss.check(4, 6));
        assert(hss.check(2, 4));
        assert(!hss.check(21, 21));
        assert(!hss.check(25, 30));
        assert(!hss.check(-6, -6));
        assert(!hss.check(25, 71));
        assert(!hss.check(24));
        assert(!hss.check(70));
        assert(!hss.check(79));
        assert(!hss.check(69, 72));
        assert(hss.check(100, 200));
        assert(hss.check(200));
        assert(hss.check(100));
        assert(hss.check(80, 200));
        assert(hss.check(80, 220));
        assert(hss.check(80, 140));
        assert(hss.check(120, 180));
        assert(hss.check(180, 299));
        assert(!hss.check(99));
        assert(!hss.check(95, 99));
    });

    // TODO:
    /*it("survives a barrage of random tests",()=>{
    });*/
});
