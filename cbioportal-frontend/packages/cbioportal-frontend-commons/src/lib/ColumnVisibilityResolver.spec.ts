import { assert } from 'chai';
import _ from 'lodash';
import {
    ISimpleColumnVisibilityDef,
    resolveColumnVisibility,
    resolveColumnVisibilityByColumnDefinition,
    toggleColumnVisibility,
} from './ColumnVisibilityResolver';

function getVisibleColumnIds(columnVisibility: {
    [columnId: string]: boolean;
}): string[] {
    return _.keys(columnVisibility)
        .filter(id => columnVisibility[id] === true)
        .sort();
}

describe('ColumnVisibilityResolver', () => {
    let columns: ISimpleColumnVisibilityDef[];

    beforeEach(() => {
        columns = [
            {
                name: '1st',
                visible: true,
            },
            {
                name: '2nd',
                visible: true,
            },
            {
                name: '3rd',
                visible: false,
            },
            {
                name: '4th',
                visible: true,
            },
            {
                name: '5th',
                visible: false,
            },
        ];
    });

    describe('resolveColumnVisibilityByColumnDefinition', () => {
        it('properly resolves column visibility by column definition', () => {
            const colVis = resolveColumnVisibilityByColumnDefinition(columns);
            assert.deepEqual(
                getVisibleColumnIds(colVis),
                ['1st', '2nd', '4th'],
                'only 1st, 2nd, and 4th columns should be visible'
            );
        });
    });

    describe('resolveColumnVisibility', () => {
        it('properly overrides even custom column visibility when provided', () => {
            const customColumnVisibility = {
                '1st': false,
                '2nd': true,
                '3rd': false,
                '4th': false,
                '5th': true,
            };

            const columnVisibilityOverride = {
                '1st': true,
                '2nd': true,
                '3rd': true,
                '4th': true,
                '5th': true,
            };

            const colVisByColumnDefinition = resolveColumnVisibilityByColumnDefinition(
                columns
            );

            const colVis = resolveColumnVisibility(
                colVisByColumnDefinition,
                customColumnVisibility,
                columnVisibilityOverride
            );

            assert.deepEqual(
                getVisibleColumnIds(colVis),
                ['1st', '2nd', '3rd', '4th', '5th'],
                'all columns should be visible'
            );
        });

        it('properly overrides column visibility with the column visibility override content', () => {
            const columnVisibilityOverride = {
                '1st': false,
                '2nd': true,
                '3rd': true,
                '4th': false,
                '5th': true,
            };

            const colVisByColumnDefinition = resolveColumnVisibilityByColumnDefinition(
                columns
            );

            const colVis = resolveColumnVisibility(
                colVisByColumnDefinition,
                undefined,
                columnVisibilityOverride
            );

            assert.deepEqual(
                getVisibleColumnIds(colVis),
                ['2nd', '3rd', '5th'],
                'only 2nd, 3rd and 5th columns should be visible'
            );
        });

        it('resolves visibility for dynamically updated column definition', () => {
            const columnVisibilityOverride = {
                '1st': false,
                '2nd': true,
                '3rd': true,
                '4th': false,
                '5th': true,
            };

            // no override previously defined for the 6th col, so it should be resolved visible
            columns.push({
                name: '6th',
                visible: true,
            });

            const colVisByColumnDefinition = resolveColumnVisibilityByColumnDefinition(
                columns
            );

            const colVis = resolveColumnVisibility(
                colVisByColumnDefinition,
                undefined,
                columnVisibilityOverride
            );

            assert.deepEqual(
                getVisibleColumnIds(colVis),
                ['2nd', '3rd', '5th', '6th'],
                '2nd, 3rd, 5th, and 6th columns should be visible'
            );
        });
    });

    describe('toggleColumnVisibility', () => {
        it('properly initializes and toggles column visibility multiple times', () => {
            const columnVisibilityDef: ISimpleColumnVisibilityDef[] = [
                {
                    id: '1st',
                    name: "1st: doesn't have to be same as the id",
                    visible: false,
                },
                {
                    id: '2nd',
                    name: "2nd: doesn't have to be same as the id",
                    visible: false,
                },
                {
                    id: '3rd',
                    name: "3rd: doesn't have to be same as the id",
                    visible: true,
                },
                {
                    id: '4th',
                    name: "4th: doesn't have to be same as the id",
                    visible: true,
                },
                {
                    id: '5th',
                    name: "5th: doesn't have to be same as the id",
                    visible: false,
                },
            ];

            // init with column visibility def
            let colVis = toggleColumnVisibility(
                undefined,
                '5th',
                columnVisibilityDef
            );

            assert.deepEqual(
                getVisibleColumnIds(colVis),
                ['3rd', '4th', '5th'],
                '3rd and 4th initially visible, 5th toggled to be visible'
            );

            // toggle 4th column
            colVis = toggleColumnVisibility(colVis, '4th', columnVisibilityDef);

            assert.deepEqual(
                getVisibleColumnIds(colVis),
                ['3rd', '5th'],
                '3rd and 5th visible, columnVisibilityDef should be ignored this time'
            );

            // toggle 3rd column
            colVis = toggleColumnVisibility(colVis, '3rd');

            assert.deepEqual(
                getVisibleColumnIds(colVis),
                ['5th'],
                'only 5th visible'
            );

            // toggle 1st column
            colVis = toggleColumnVisibility(colVis, '1st');

            assert.deepEqual(
                getVisibleColumnIds(colVis),
                ['1st', '5th'],
                '1st and 5th visible'
            );

            // toggle 1st and 5th columns
            colVis = toggleColumnVisibility(colVis, '1st');
            colVis = toggleColumnVisibility(colVis, '5th');

            assert.equal(getVisibleColumnIds(colVis).length, 0, 'none visible');

            // toggle 2nd and 3rd columns
            colVis = toggleColumnVisibility(colVis, '2nd');
            colVis = toggleColumnVisibility(colVis, '3rd');

            assert.deepEqual(
                getVisibleColumnIds(colVis),
                ['2nd', '3rd'],
                '2nd and 3rd visible'
            );
        });
    });
});
