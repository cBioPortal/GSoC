import React from 'react';
import { adjustVisibility } from 'shared/components/alterationsTableUtils';
import { assert, expect } from 'chai';
import { Column } from 'shared/components/lazyMobXTable/LazyMobXTable';

describe('alterationsTableUtils', () => {
    const namespaceColumns = ['Chromosome'];
    const selectedCols = 'Start Position,End Position';
    let tableColumns: Record<string, Column<any>>;

    beforeEach(() => {
        tableColumns = {
            Chromosome: {
                name: 'Chromosome',
                render: (d: any) => <span />,
                visible: false,
            },
            'Start Position': {
                name: 'Start Position',
                render: (d: any) => <span />,
                visible: true,
            },
            'End Position': {
                name: 'End Position',
                render: (d: any) => <span />,
                visible: false,
            },
        };
    });

    it('changes the visibility of the columns without namespace columns', () => {
        const visibility = adjustVisibility(
            tableColumns,
            namespaceColumns,
            selectedCols,
            false
        );
        const colVisibility = [
            tableColumns['Chromosome'].visible,
            tableColumns['Start Position'].visible,
            tableColumns['End Position'].visible,
        ];
        assert.deepEqual(
            colVisibility,
            [false, true, true],
            'Only "Start Position" and "End Position" should be visible'
        );
    });
    it('changes the visibility of the columns with namespace columns', () => {
        const visibility = adjustVisibility(
            tableColumns,
            namespaceColumns,
            selectedCols,
            true
        );
        const colVisibility = [
            tableColumns['Chromosome'].visible,
            tableColumns['Start Position'].visible,
            tableColumns['End Position'].visible,
        ];
        assert.deepEqual(
            colVisibility,
            [true, true, true],
            'Only "Start Position" and "End Position" should be visible'
        );
    });
    it('does not change the visibility of the columns without namespace columns', () => {
        const visibility = adjustVisibility(
            tableColumns,
            namespaceColumns,
            '',
            false
        );
        const colVisibility = [
            tableColumns['Chromosome'].visible,
            tableColumns['Start Position'].visible,
            tableColumns['End Position'].visible,
        ];
        assert.deepEqual(
            colVisibility,
            [false, true, false],
            'Only "Start Position" and "End Position" should be visible'
        );
    });
    it('does not change the visibility of the columns with namespace columns', () => {
        const visibility = adjustVisibility(
            tableColumns,
            namespaceColumns,
            '',
            true
        );
        const colVisibility = [
            tableColumns['Chromosome'].visible,
            tableColumns['Start Position'].visible,
            tableColumns['End Position'].visible,
        ];
        assert.deepEqual(
            colVisibility,
            [false, true, false],
            'Only "Start Position" and "End Position" should be visible'
        );
    });
});
