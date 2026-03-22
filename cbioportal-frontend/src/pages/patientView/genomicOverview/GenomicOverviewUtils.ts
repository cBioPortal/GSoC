import _ from 'lodash';
import { GenePanelIdSpecialValue } from 'shared/lib/StoreUtils';
import { Mutation } from 'cbioportal-ts-api-client';
import { MutationFrequenciesBySample } from 'pages/patientView/vafPlot/VAFPlot';

export interface IIconData {
    genePanelId: string | undefined;
    color: string;
    label: string;
}

export interface IKeyedIconData {
    [id: string]: IIconData;
}

export const IGV_TRACK_SAMPLE_EXPAND_HEIGHT = 18;
export const COLOR_GENEPANEL_ICON = 'blue';
export const COLOR_WHOLEGENOME_ICON = '#007fff';
export const PREFIX_GENEPANEL_LABEL = 'P';
export const WHOLEGENOME_LABEL = 'W';
export const wholeGenomeIconData: IIconData = {
    label: WHOLEGENOME_LABEL,
    color: COLOR_WHOLEGENOME_ICON,
    genePanelId: undefined,
};

export function getGenePanelIds(
    sampleIdToMutationGenePanelId?: { [sampleId: string]: string },
    sampleIdToCopyNumberGenePanelId?: { [sampleId: string]: string }
) {
    return _.uniq(
        _.concat(
            _.values(sampleIdToMutationGenePanelId),
            _.values(sampleIdToCopyNumberGenePanelId)
        )
    );
}

export function genePanelIdToIconData(
    genePanelIds: (string | undefined)[]
): IKeyedIconData {
    // remove undef and get array of sorted unique elements
    const gpIds = _.uniq(
        _.filter(genePanelIds, genePanelId => genePanelId !== undefined)
    ).sort();

    const lookupTable: IKeyedIconData = {};

    // create entries for whole-genome analyses
    _(gpIds)
        .filter(genePanelId =>
            _.values(GenePanelIdSpecialValue).includes(genePanelId)
        )
        .each(genePanelId => {
            const i = Object.assign({}, wholeGenomeIconData);
            i.genePanelId = genePanelId;
            lookupTable[genePanelId!] = i;
        });

    // create entries for gene panel analyses
    _(gpIds)
        .reject(genePanelId =>
            _.values(GenePanelIdSpecialValue).includes(genePanelId)
        )
        .each((genePanelId, index) => {
            lookupTable[genePanelId!] = {
                genePanelId: genePanelId,
                label: PREFIX_GENEPANEL_LABEL + (index + 1),
                color: COLOR_GENEPANEL_ICON,
            };
        });

    return lookupTable;
}

export function sampleIdToIconData(
    sampleIdToGenePanelId:
        | { [sampleId: string]: string | undefined }
        | undefined,
    iconLookupTable: IKeyedIconData
): IKeyedIconData {
    // return undefined when all samples were analyzed with a whole genome approach
    const genePanelIds = _.values(sampleIdToGenePanelId);
    const wholeGenomeIndicators = _.values(GenePanelIdSpecialValue);

    if (
        !sampleIdToGenePanelId ||
        _.difference(genePanelIds, wholeGenomeIndicators).length === 0
    ) {
        return {};
    }

    // samples where genePanelId is undefined represent a whole-genome analysis
    // undefined genePanelIds are not represented in the lookup table
    const lookupTable: IKeyedIconData = _(sampleIdToGenePanelId)
        .omitBy(genePanelId => genePanelId! in iconLookupTable) // keep samples with undefined genePanelIds
        .mapValues(() => wholeGenomeIconData)
        .value();

    // add icon data for samples with defined genePanelIds
    _(sampleIdToGenePanelId)
        .pickBy(genePanelId => genePanelId! in iconLookupTable) // keep samples with defined genePanelIds
        .forIn(
            (genePanelId, sampleId) =>
                (lookupTable[sampleId] = iconLookupTable[genePanelId!])
        );

    return lookupTable;
}

export function computeMutationFrequencyBySample(
    mergedMutations: Mutation[][],
    sampleOrder: { [s: string]: number }
): MutationFrequenciesBySample {
    const ret: MutationFrequenciesBySample = {};
    let sampleId;
    let freq;
    for (const mutations of mergedMutations) {
        for (const mutation of mutations) {
            if (mutation.tumorAltCount >= 0 && mutation.tumorRefCount >= 0) {
                sampleId = mutation.sampleId;
                freq =
                    mutation.tumorAltCount /
                    (mutation.tumorRefCount + mutation.tumorAltCount);
                ret[sampleId] = ret[sampleId] || [];
                ret[sampleId].push(freq);
            }
        }
    }
    for (const sampleId of Object.keys(sampleOrder)) {
        ret[sampleId] = ret[sampleId] || [];
        const shouldAdd = mergedMutations.length - ret[sampleId].length;
        for (let i = 0; i < shouldAdd; i++) {
            ret[sampleId].push(NaN);
        }
    }
    return ret;
}

export function doesFrequencyExist(frequencies: MutationFrequenciesBySample) {
    for (const frequencyId of Object.keys(frequencies)) {
        if (frequencies.hasOwnProperty(frequencyId)) {
            for (const frequency of frequencies[frequencyId]) {
                return !isNaN(frequency);
            }
        }
    }

    return false;
}
