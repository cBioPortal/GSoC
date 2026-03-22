import { assert } from 'chai';
import { DataFilterType } from 'react-mutation-mapper';

import { Mutation } from 'cbioportal-ts-api-client';
import MutationMapperDataStore from './MutationMapperDataStore';

describe('MutationMapperDataStore', () => {
    let mutations: Mutation[];
    let mergedMutations: Mutation[][];
    let pos5Mutation: Mutation;
    let pos10Mutation: Mutation;
    let pos20Mutation: Mutation;
    beforeAll(() => {
        pos10Mutation = { proteinPosStart: 10 } as Mutation;
        pos5Mutation = { proteinPosStart: 5 } as Mutation;
        pos20Mutation = { proteinPosStart: 20 } as Mutation;
        mutations = [pos10Mutation, pos5Mutation, pos20Mutation];
        mergedMutations = mutations.map(m => [m]);
    });

    it('initializes correctly', () => {
        let store: MutationMapperDataStore = new MutationMapperDataStore(
            mergedMutations
        );
        assert.deepEqual(
            store.allData,
            mergedMutations,
            'initializes data right'
        );
        assert.deepEqual(
            store.allData,
            store.sortedFilteredData,
            'initially no sorting or filtering'
        );
        assert.deepEqual(
            store.sortedFilteredSelectedData,
            [],
            'initially no positions selected'
        );
    });

    it('toggles selections correctly, selects mutations by position, and gives them in sorted order', () => {
        let store: MutationMapperDataStore = new MutationMapperDataStore(
            mergedMutations
        );
        store.setSelectionFilters([
            { type: DataFilterType.POSITION, values: [5] },
        ]);
        assert.deepEqual(
            store.sortedFilteredData,
            [[pos10Mutation], [pos5Mutation], [pos20Mutation]],
            'no sorting or filtering'
        );
        assert.deepEqual(
            store.sortedFilteredSelectedData,
            [[pos5Mutation]],
            'position 5 selected'
        );
        store.setSelectionFilters([
            { type: DataFilterType.POSITION, values: [5, 10] },
        ]);
        assert.deepEqual(
            store.sortedFilteredData,
            [[pos10Mutation], [pos5Mutation], [pos20Mutation]],
            'still no sorting or filtering'
        );
        assert.deepEqual(
            store.sortedFilteredSelectedData,
            [[pos10Mutation], [pos5Mutation]],
            'positions 5 and 10 selected, in given order'
        );
        store.sortMetric = (d: Mutation[]) => d[0].proteinPosStart;
        assert.deepEqual(
            store.sortedFilteredData,
            [[pos5Mutation], [pos10Mutation], [pos20Mutation]],
            'sorting, no filtering'
        );
        assert.deepEqual(
            store.sortedFilteredSelectedData,
            [[pos5Mutation], [pos10Mutation]],
            'positions 5 and 10 selected, in sorted order'
        );
        store.setFilter((d: Mutation[]) => d[0].proteinPosStart > 5);
        assert.deepEqual(
            store.sortedFilteredData,
            [[pos10Mutation], [pos20Mutation]],
            'sorting and filtering'
        );
        assert.deepEqual(
            store.sortedFilteredSelectedData,
            [[pos10Mutation]],
            'positions 5 and 10 selected, but 5 filtered out'
        );
        store.setSelectionFilters([
            { type: DataFilterType.POSITION, values: [5, 10, 20] },
        ]);
        assert.deepEqual(
            store.sortedFilteredData,
            [[pos10Mutation], [pos20Mutation]],
            'still sorting and filtering'
        );
        assert.deepEqual(
            store.sortedFilteredSelectedData,
            [[pos10Mutation], [pos20Mutation]],
            'positions 5, 10, 20 selected, but 5 filtered out'
        );
        store.setSelectionFilters([
            { type: DataFilterType.POSITION, values: [5, 10] },
        ]);
        assert.deepEqual(
            store.sortedFilteredSelectedData,
            [[pos10Mutation]],
            'positions 5 and 10 selected, but 5 filtered out'
        );
        assert.deepEqual(
            store.tableData,
            [[pos10Mutation]],
            'table data is selected data'
        );
        store.clearSelectionFilters();
        assert.deepEqual(
            store.sortedFilteredData,
            [[pos10Mutation], [pos20Mutation]],
            'still, still sorting and filtering'
        );
        assert.deepEqual(
            store.sortedFilteredSelectedData,
            [],
            'no positions selected'
        );
        store.setSelectionFilters([
            { type: DataFilterType.POSITION, values: [20] },
        ]);
        assert.deepEqual(
            store.sortedFilteredSelectedData,
            [[pos20Mutation]],
            'position 20 selected'
        );
        store.resetFilters();
        assert.deepEqual(
            store.sortedFilteredData,
            [[pos5Mutation], [pos10Mutation], [pos20Mutation]],
            'sorting, no filtering'
        );
        assert.deepEqual(
            store.sortedFilteredSelectedData,
            [],
            'finally, no positions selected'
        );
    });

    it('implements isPositionSelected', () => {
        let store: MutationMapperDataStore = new MutationMapperDataStore(
            mergedMutations
        );
        assert.isFalse(store.isPositionSelected(1), 'A: 1 not selected');
        assert.isFalse(store.isPositionSelected(3), 'A: 3 not selected');
        assert.isFalse(store.isPositionSelected(5), 'A: 5 not selected');
        assert.isFalse(store.isPositionSelected(10), 'A: 10 not selected');
        assert.isFalse(store.isPositionSelected(20), 'A: 20 not selected');
        store.setSelectionFilters([
            { type: DataFilterType.POSITION, values: [1] },
        ]);
        assert.isTrue(store.isPositionSelected(1), 'B: 1 selected');
        assert.isFalse(store.isPositionSelected(3), 'B: 3 not selected');
        assert.isFalse(store.isPositionSelected(5), 'B: 5 not selected');
        assert.isFalse(store.isPositionSelected(10), 'B: 10 not selected');
        assert.isFalse(store.isPositionSelected(20), 'B: 20 not selected');
        store.setSelectionFilters([
            { type: DataFilterType.POSITION, values: [1, 3] },
        ]);
        assert.isTrue(store.isPositionSelected(1), 'C: 1 selected');
        assert.isTrue(store.isPositionSelected(3), 'C: 3 selected');
        assert.isFalse(store.isPositionSelected(5), 'C: 5 not selected');
        assert.isFalse(store.isPositionSelected(10), 'C: 10 not selected');
        assert.isFalse(store.isPositionSelected(20), 'C: 20 not selected');
        store.setSelectionFilters([
            { type: DataFilterType.POSITION, values: [1, 3, 5] },
        ]);
        assert.isTrue(store.isPositionSelected(1), 'D: 1 selected');
        assert.isTrue(store.isPositionSelected(3), 'D: 3 selected');
        assert.isTrue(store.isPositionSelected(5), 'D: 5 selected');
        assert.isFalse(store.isPositionSelected(10), 'D: 10 not selected');
        assert.isFalse(store.isPositionSelected(20), 'D: 20 not selected');
        store.setSelectionFilters([
            { type: DataFilterType.POSITION, values: [1, 3, 5, 20] },
        ]);
        assert.isTrue(store.isPositionSelected(1), 'E: 1 selected');
        assert.isTrue(store.isPositionSelected(3), 'E: 3 selected');
        assert.isTrue(store.isPositionSelected(5), 'E: 5 selected');
        assert.isFalse(store.isPositionSelected(10), 'E: 10 not selected');
        assert.isTrue(store.isPositionSelected(20), 'E: 20 selected');
        store.setSelectionFilters([
            { type: DataFilterType.POSITION, values: [1, 5, 20] },
        ]);
        assert.isTrue(store.isPositionSelected(1), 'F: 1 selected');
        assert.isFalse(store.isPositionSelected(3), 'F: 3 not selected');
        assert.isTrue(store.isPositionSelected(5), 'F: 5 selected');
        assert.isFalse(store.isPositionSelected(10), 'F: 10 not selected');
        assert.isTrue(store.isPositionSelected(20), 'F: 20 selected');
        store.clearSelectionFilters();
        assert.isFalse(store.isPositionSelected(1), 'G: 1 not selected');
        assert.isFalse(store.isPositionSelected(3), 'G: 3 not selected');
        assert.isFalse(store.isPositionSelected(5), 'G: 5 not selected');
        assert.isFalse(store.isPositionSelected(10), 'G: 10 not selected');
        assert.isFalse(store.isPositionSelected(20), 'G: 20 not selected');
    });
});
