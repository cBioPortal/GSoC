import { assert } from 'chai';
import { SimpleLazyMobXTableApplicationDataStore } from './ILazyMobXTableApplicationDataStore';

describe('SimpleLazyMobXTableApplicationDataStore', () => {
    let data: number[];
    let metric: { [x: number]: number };
    beforeAll(() => {
        data = [1, 2, 3, 4, 5, 6, 7, 8];
        metric = {
            5: 0,
            6: 1,
            3: 2,
            4: 3,
            2: 4,
            7: 5,
            1: 6,
            8: 7,
        };
    });
    it('initializes with given data, and returns proper defaults', () => {
        let store = new SimpleLazyMobXTableApplicationDataStore<number>(data);
        assert.deepEqual(
            store.allData,
            data,
            'all data set to constructor param'
        );
        assert.deepEqual(
            store.sortedData,
            data,
            'data is unchanged by sort with no given metric'
        );
        assert.deepEqual(
            store.sortedFilteredData,
            data,
            'data is unchanged by filter with no given filter'
        );
        assert.deepEqual(
            store.sortedFilteredSelectedData,
            [],
            'initially no data is selected'
        );
        assert.deepEqual(
            store.tableData,
            store.sortedFilteredData,
            'with no selected data, sortedFilteredData is the tableData'
        );

        assert.equal(store.filterString, '', 'initial filter string is empty');
        assert.isUndefined(
            store.sortAscending,
            'initially sort ascending if undefined'
        );
        assert.equal(
            store.allData.filter((d: number) => store.isHighlighted(d)).length,
            0,
            'initially nothing is highlighted'
        );
    });

    it('sorts according to given metric and direction', () => {
        let store = new SimpleLazyMobXTableApplicationDataStore<number>(data);
        store.sortMetric = (d: number) => metric[d];
        assert.deepEqual(
            store.sortedData,
            [5, 6, 3, 4, 2, 7, 1, 8],
            'sort correctly ascending'
        );
        store.sortAscending = false;
        assert.deepEqual(
            store.sortedData,
            [8, 1, 7, 2, 4, 3, 6, 5],
            'sort correctly descending'
        );
    });
    it('filters according to given filter, case: filter that takes filter string into account', () => {
        let store = new SimpleLazyMobXTableApplicationDataStore<number>(data);
        store.sortMetric = (d: number) => metric[d];
        assert.deepEqual(
            store.sortedFilteredData,
            [5, 6, 3, 4, 2, 7, 1, 8],
            'no filter means just data in sorted order'
        );
        store.setFilter((d: number, str: string) => str.indexOf(d + '') > -1);
        assert.deepEqual(
            store.sortedFilteredData,
            [],
            'empty filter string means no matches'
        );
        store.filterString = '516';
        assert.deepEqual(
            store.sortedFilteredData,
            [5, 6, 1],
            'matches, in sorted order'
        );
    });
    it('filters according to given filter, case: filter that does not take filter string into account', () => {
        let store = new SimpleLazyMobXTableApplicationDataStore<number>(data);
        store.sortMetric = (d: number) => metric[d];
        assert.deepEqual(
            store.sortedFilteredData,
            [5, 6, 3, 4, 2, 7, 1, 8],
            'no filter means just data in sorted order'
        );
        store.setFilter((d: number) => d >= 4);
        assert.deepEqual(
            store.sortedFilteredData,
            [5, 6, 4, 7, 8],
            'matches in sorted order'
        );
    });
    it('gives correct tableData, and resetFilter works properly', () => {
        let store = new SimpleLazyMobXTableApplicationDataStore<number>(data);
        store.sortMetric = (d: number) => metric[d];
        store.setFilter((d: number) => d >= 4);
        assert.deepEqual(
            store.sortedFilteredData,
            [5, 6, 4, 7, 8],
            'matches in sorted order'
        );
        assert.deepEqual(
            store.tableData,
            store.sortedFilteredData,
            'no selection means tableData is sortedFilteredData'
        );
        store.filterString = '515';
        store.resetFilter();
        assert.deepEqual(
            store.sortedFilteredData,
            [5, 6, 3, 4, 2, 7, 1, 8],
            'all data, in same sorted order'
        );
        assert.equal(store.filterString.length, 0, 'filter string reset');
    });
});
