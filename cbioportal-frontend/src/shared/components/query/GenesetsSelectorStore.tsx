import * as React from 'react';
import { Geneset, GenesetHierarchyInfo } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { ObservableMap } from 'mobx';

export function getGenesetsFromHierarchy(
    hierarchyData: GenesetHierarchyInfo[]
): Geneset[] {
    const array: Geneset[] = [];
    for (const node of hierarchyData) {
        if (_.has(node, 'genesets')) {
            node.genesets.forEach(geneset => array.push(geneset));
        }
    }
    return array;
}

export function getVolcanoPlotMinYValue(
    genesetsData: Geneset[]
): number | undefined {
    if (genesetsData.length > 0) {
        const genesetWithMinYValue = _.minBy(genesetsData, function(o) {
            return o.representativePvalue;
        });
        return genesetWithMinYValue!.representativePvalue;
    } else {
        return undefined;
    }
}

export function getVolcanoPlotData(
    genesetsData: Geneset[],
    map_genesets_selected_volcano: ObservableMap<string, boolean>
): { x: number; y: number; fill: string }[] | undefined {
    if (genesetsData.length > 0) {
        const volcanoPlotData = genesetsData.map(
            ({ representativeScore, representativePvalue, name }) => {
                const xValue = representativeScore;
                const yValue = -(Math.log(representativePvalue) / Math.log(10));
                const fillColor = map_genesets_selected_volcano.get(name)
                    ? 'tomato'
                    : '3786C2';
                return { x: xValue, y: yValue, fill: fillColor };
            }
        );
        return volcanoPlotData;
    } else {
        return undefined;
    }
}
