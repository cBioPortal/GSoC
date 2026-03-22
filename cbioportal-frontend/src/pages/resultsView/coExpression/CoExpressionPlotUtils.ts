import _ from 'lodash';
import { IAxisLogScaleParams } from 'shared/components/plots/PlotsTabUtils';
import { CoExpressionPlotData } from 'pages/resultsView/coExpression/CoExpressionPlot';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { GeneticEntity } from 'shared/model/GeneticEntity';

export function getUniquePrecision(
    value: number,
    allValues: number[],
    maxPrecision: number = 3
) {
    if (!allValues.length) return 0;

    let precision = 0;
    while (
        _.countBy(allValues, val => val.toFixed(precision))[
            value.toFixed(precision)
        ] > 1
    ) {
        precision++;

        if (precision >= maxPrecision) {
            break;
        }
    }
    return precision;
}

export function axisLabel(
    geneticEntity: { geneticEntityName: string; cytoband?: string },
    logScale: IAxisLogScaleParams | undefined,
    profileName: string
) {
    return `${profileName}: ${geneticEntity.geneticEntityName} ${
        geneticEntity.cytoband ? `(${geneticEntity.cytoband}) ` : ''
    }${logScale ? `(${logScale.label}) ` : ''}`;
}

export function isNotProfiled(d: { profiledX: boolean; profiledY: boolean }) {
    return !d.profiledX && !d.profiledY;
}

export function getDownloadData(
    data: CoExpressionPlotData[],
    entityX: GeneticEntity,
    entityY: GeneticEntity,
    molecularProfileX: MolecularProfile,
    molecularProfileY: MolecularProfile,
    showMutations: boolean
) {
    const firstRow = [
        'Sample ID',
        `${entityX.geneticEntityName} (${molecularProfileX.name})`,
        `${entityY.geneticEntityName} (${molecularProfileY.name})`,
    ];
    if (showMutations) {
        firstRow.push(
            `${entityX.geneticEntityName} Mutations`,
            `${entityY.geneticEntityName} Mutations`
        );
    }
    const rows = [
        firstRow,
        ...data.map(d => {
            const row = [d.sampleId, d.x, d.y];
            if (showMutations) {
                row.push(
                    d.profiledX ? d.mutationsX || 'WT' : 'NS',
                    d.profiledY ? d.mutationsY || 'WT' : 'NS'
                );
            }
            return row;
        }),
    ];
    return rows.map(row => row.join('\t')).join('\n');
}
