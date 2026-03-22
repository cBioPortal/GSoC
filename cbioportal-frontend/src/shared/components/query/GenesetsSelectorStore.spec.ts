import { assert, expect } from 'chai';
import { Geneset, GenesetHierarchyInfo } from 'cbioportal-ts-api-client';
import { ObservableMap } from 'mobx';
import {
    getGenesetsFromHierarchy,
    getVolcanoPlotMinYValue,
    getVolcanoPlotData,
} from 'shared/components/query/GenesetsSelectorStore';

describe('GenesetsSelectorStore', () => {
    describe('Volcano Plot Popup related functions', () => {
        const genesets: Geneset[] = [
            {
                description: 'AKT_UP.V1_DN',
                genesetId: 'AKT_UP.V1_DN',
                name: 'AKT_UP.V1_DN',
                refLink: 'http://www.example.com',
                representativePvalue: 0.0736,
                representativeScore: 0.1986,
            },
            {
                description: 'AKT_UP.V1_UP',
                genesetId: 'AKT_UP.V1_UP',
                name: 'AKT_UP.V1_UP',
                refLink: 'http://www.example.com',
                representativePvalue: 0.0862,
                representativeScore: 0.3945,
            },
        ];
        const hierarchyData: GenesetHierarchyInfo[] = [
            {
                nodeId: 2,
                nodeName: 'C6 Oncogenic Signatures',
                parentId: 1,
                parentNodeName: 'Molecular Signatures Database v6.0',
                genesets: genesets,
            },
        ];
        const hierarchyDataNoGenesets: GenesetHierarchyInfo[] = [
            {
                nodeId: 2,
                nodeName: 'C6 Oncogenic Signatures',
                parentId: 1,
                parentNodeName: 'Molecular Signatures Database v6.0',
                genesets: [],
            },
        ];
        it('builds the data for the volcano plot table with the correct values', () => {
            const volcanoPlotTableData = getGenesetsFromHierarchy(
                hierarchyData
            );
            assert.deepEqual(volcanoPlotTableData, [
                {
                    description: 'AKT_UP.V1_DN',
                    genesetId: 'AKT_UP.V1_DN',
                    name: 'AKT_UP.V1_DN',
                    refLink: 'http://www.example.com',
                    representativePvalue: 0.0736,
                    representativeScore: 0.1986,
                },
                {
                    description: 'AKT_UP.V1_UP',
                    genesetId: 'AKT_UP.V1_UP',
                    name: 'AKT_UP.V1_UP',
                    refLink: 'http://www.example.com',
                    representativePvalue: 0.0862,
                    representativeScore: 0.3945,
                },
            ]);
        });
        it('calculates the correct min Y value for the volcano plot', () => {
            const minYValue = getVolcanoPlotMinYValue(genesets);
            assert.equal(minYValue, 0.0736);
        });
        it('builds the data for the volcano plot graph with the correct values', () => {
            const map_genesets_selected_volcano = new ObservableMap<
                string,
                boolean
            >();
            map_genesets_selected_volcano.set('AKT_UP.V1_DN', true);
            const graphData = getVolcanoPlotData(
                genesets,
                map_genesets_selected_volcano
            );
            assert.deepEqual(graphData, [
                {
                    x: 0.1986,
                    y: -(
                        Math.log(genesets[0].representativePvalue) /
                        Math.log(10)
                    ),
                    fill: 'tomato',
                },
                {
                    x: 0.3945,
                    y: -(
                        Math.log(genesets[1].representativePvalue) /
                        Math.log(10)
                    ),
                    fill: '3786C2',
                },
            ]);
        });
        it('returns an empty array if the hierarchy has no genesets', () => {
            const volcanoPlotTableDataNoGenesets = getGenesetsFromHierarchy(
                hierarchyDataNoGenesets
            );
            assert.deepEqual(volcanoPlotTableDataNoGenesets, []);
        });
        it('returns undefined for min Y value if the array given is empty', () => {
            const minYValue = getVolcanoPlotMinYValue([]);
            assert.equal(minYValue, undefined);
        });
        it('returns undefined for volcano plot data graph if the table data is an empty array', () => {
            const map_genesets_selected_volcano = new ObservableMap<
                string,
                boolean
            >();
            map_genesets_selected_volcano.set('AKT_UP.V1_DN', true);
            const graphDataUndefined = getVolcanoPlotData(
                [],
                map_genesets_selected_volcano
            );
            assert.equal(graphDataUndefined, undefined);
        });
    });
});
