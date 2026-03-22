import { IStringAxisData } from './PlotsTabUtils';
import { Sample } from 'cbioportal-ts-api-client';
function getUniqueSampleKeyToCategories(
    horzData: IStringAxisData['data'],
    vertData: IStringAxisData['data']
) {
    const ret: {
        [sampleKey: string]: {
            horz?: string | string[];
            vert?: string | string[];
        };
    } = {};
    for (const d of horzData) {
        ret[d.uniqueSampleKey] = ret[d.uniqueSampleKey] || {};
        ret[d.uniqueSampleKey].horz = d.value;
    }
    for (const d of vertData) {
        ret[d.uniqueSampleKey] = ret[d.uniqueSampleKey] || {};
        ret[d.uniqueSampleKey].vert = d.value;
    }
    return ret;
}

export function* iterateOverEntries(
    horzData: IStringAxisData['data'],
    vertData: IStringAxisData['data']
): IterableIterator<{ uniqueSampleKey: string; horz?: string; vert?: string }> {
    const caseToCategories = getUniqueSampleKeyToCategories(horzData, vertData);
    for (const caseKey of Object.keys(caseToCategories)) {
        const caseCategories = caseToCategories[caseKey];
        if (caseCategories.horz && caseCategories.vert) {
            // yield entry for each value combination
            const horz = Array.isArray(caseCategories.horz)
                ? caseCategories.horz
                : [caseCategories.horz];
            const vert = Array.isArray(caseCategories.vert)
                ? caseCategories.vert
                : [caseCategories.vert];
            for (const horzValue of horz) {
                for (const vertValue of vert) {
                    yield {
                        uniqueSampleKey: caseKey,
                        horz: horzValue,
                        vert: vertValue,
                    };
                }
            }
        }
    }
}

export function getTablePlotDownloadData(
    horzData: IStringAxisData['data'],
    vertData: IStringAxisData['data'],
    uniqueSampleKeyToSample: { [uniqueSampleKey: string]: Sample },
    horzLabel: string,
    vertLabel: string
) {
    const dataRows: string[] = [];
    for (const entry of iterateOverEntries(horzData, vertData)) {
        const row: string[] = [];
        row.push(uniqueSampleKeyToSample[entry.uniqueSampleKey].sampleId);
        row.push(entry.horz || 'n/a');
        row.push(entry.vert || 'n/a');
        dataRows.push(row.join('\t'));
    }
    const header = ['Sample Id', horzLabel, vertLabel];
    return header.join('\t') + '\n' + dataRows.join('\n');
}
