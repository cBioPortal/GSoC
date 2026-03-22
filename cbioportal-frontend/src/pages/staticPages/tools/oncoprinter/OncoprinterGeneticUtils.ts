import { observable } from 'mobx';
import { getServerConfig } from 'config/config';
import { default as OncoprinterStore } from './OncoprinterStore';
import _ from 'lodash';
import {
    GeneticTrackDatum,
    GeneticTrackDatum_Data,
} from '../../../../shared/components/oncoprint/Oncoprint';
import {
    formatPercent,
    percentAltered,
} from '../../../../shared/components/oncoprint/OncoprintUtils';
import { AlterationTypeConstants } from 'shared/constants';
import { cna_profile_data_to_string } from '../../../../shared/lib/oql/AccessorsForOqlFilter';
import {
    fillGeneticTrackDatum,
    OncoprintMutationType,
    OncoprintMutationTypeEnum,
} from '../../../../shared/components/oncoprint/DataUtils';
import {
    Gene,
    Mutation,
    NumericGeneMolecularData,
} from 'cbioportal-ts-api-client';
import {
    getProteinPositionFromProteinChange,
    EvidenceType,
    IOncoKbData,
} from 'cbioportal-utils';
import {
    generateQueryVariantId,
    generateCopyNumberAlterationQuery,
} from 'oncokb-frontend-commons';
import {
    AnnotateCopyNumberAlterationQuery,
    OncoKbAPI,
} from 'oncokb-ts-api-client';
import {
    getOncoKbOncogenic,
    ONCOKB_DEFAULT,
    PUTATIVE_DRIVER,
    queryOncoKbCopyNumberAlterationData,
    queryOncoKbData,
} from '../../../../shared/lib/StoreUtils';
import { default as oncokbClient } from '../../../../shared/api/oncokbClientInstance';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { mutationCountByPositionKey } from '../../../resultsView/mutationCountHelpers';
import { getAlterationString } from '../../../../shared/lib/CopyNumberUtils';
import { GERMLINE_REGEXP } from '../../../../shared/lib/MutationUtils';
import { parseOQLQuery } from '../../../../shared/lib/oql/oqlfilter';
import { Alteration, MUTCommand } from '../../../../shared/lib/oql/oql-parser';
import { MUTATION_STATUS_GERMLINE } from '../../../../shared/constants';
import { OncoprintModel } from 'oncoprintjs';

export type OncoprinterGeneticTrackDatum = Pick<
    GeneticTrackDatum,
    | 'trackLabel'
    | 'study_id'
    | 'uid'
    | 'disp_mut'
    | 'disp_cna'
    | 'disp_mrna'
    | 'disp_prot'
    | 'disp_structuralVariant'
    | 'disp_germ'
> & {
    sample: string;
    patient: string;
    data: OncoprinterGeneticTrackDatum_Data[];
};

export type OncoprinterGeneticTrackDatum_Data = GeneticTrackDatum_Data &
    Pick<
        Partial<Mutation>,
        'proteinPosStart' | 'proteinPosEnd' | 'startPosition' | 'endPosition'
    >;

type OncoprinterGeneticTrackSpec = {
    key: string; // for efficient diffing, just like in React. must be unique
    label: string;
    info: string;
    data: OncoprinterGeneticTrackDatum[];
};

export type OncoprinterGeneticInputLineType1 = {
    sampleId: string;
};
export type OncoprinterGeneticInputLineType2 = OncoprinterGeneticInputLineType1 & {
    hugoGeneSymbol: string;
    alteration:
        | OncoprintMutationType
        | 'amp'
        | 'homdel'
        | 'gain'
        | 'hetloss'
        | 'mrnaHigh'
        | 'mrnaLow'
        | 'protHigh'
        | 'protLow'
        | 'structuralVariant';
    trackName?: string;
    isGermline?: boolean;
    isCustomDriver?: boolean;
    proteinChange?: string;
    eventInfo?: string;
};
/* Leaving commented only for reference, this will be replaced by unified input strategy
export type OncoprinterInputLineType3_Incomplete = OncoprinterInputLineType1 & {
    cancerType:string;
    proteinChange: string;
    mutationType: string;
    chromosome:string;
    startPosition:number;
    endPosition:number;
    referenceAllele:string;
    variantAllele:string;
};

export type OncoprinterInputLineType3 = OncoprinterInputLineType3_Incomplete & {
    hugoGeneSymbol: string,
    isHotspot:boolean
}; // we get both of these from GenomeNexus using the data from the Incomplete line

export type OncoprinterInputLineIncomplete = OncoprinterInputLineType1 | OncoprinterInputLineType2 | OncoprinterInputLineType3_Incomplete;
*/

export type OncoprinterGeneticInputLine =
    | OncoprinterGeneticInputLineType1
    | OncoprinterGeneticInputLineType2;

export function isType2(
    inputLine: OncoprinterGeneticInputLine
): inputLine is OncoprinterGeneticInputLineType2 {
    return inputLine.hasOwnProperty('alteration');
}
/* Leaving commented only for reference, this will be replaced by unified input strategy
export function isType3NoGene(inputLine:OncoprinterInputLine):inputLine is OncoprinterInputLineType3_Incomplete {
    return inputLine.hasOwnProperty("chromosome");
}*/

export function initDriverAnnotationSettings(store: OncoprinterStore) {
    let _oncoKb: boolean, _customBinary: boolean;
    if (store.existCustomDrivers) {
        // if custom drivers, start with only custom drivers annotated
        _oncoKb = false;
        _customBinary = true;
    } else {
        _oncoKb = true;
        _customBinary = false;
    }

    return observable({
        _oncoKb,
        _customBinary,
        _includeVUS: true,
        hotspots: false, // for now

        get customBinary() {
            return this._customBinary;
        },
        set customBinary(val: boolean) {
            this._customBinary = val;
            store.customDriverWarningHidden = true;
        },
        set oncoKb(val: boolean) {
            this._oncoKb = val;
            store.customDriverWarningHidden = true;
        },
        get oncoKb() {
            return !!(
                getServerConfig().show_oncokb &&
                this._oncoKb &&
                !store.didOncoKbFail
            );
        },
        set includeVUS(val: boolean) {
            this._includeVUS = val;
        },
        get includeVUS() {
            return this._includeVUS || !this.driversAnnotated;
        },
        get driversAnnotated() {
            const anySelected =
                this.oncoKb ||
                this.hotspots ||
                (store.existCustomDrivers && this.customBinary);

            return anySelected;
        },
    });
}

export function getSampleIds(
    oncoprinterInput: Pick<OncoprinterGeneticInputLine, 'sampleId'>[]
): string[] {
    return _.chain(oncoprinterInput)
        .map(o => o.sampleId)
        .uniq()
        .value();
}

export function getGeneSymbols(
    oncoprinterInput: OncoprinterGeneticInputLine[]
): string[] {
    return (_.chain(oncoprinterInput).filter(o => isType2(o)) as any)
        .map((o: OncoprinterGeneticInputLineType2) => o.hugoGeneSymbol)
        .uniq()
        .value();
}

export async function fetchOncoKbDataForMutations(
    annotatedGenes: { [entrezGeneId: number]: boolean } | Error,
    data: OncoprinterGeneticTrackDatum_Data[],
    client: OncoKbAPI = oncokbClient
) {
    if (annotatedGenes instanceof Error) {
        return new Error();
    }

    // TODO: structural variant data does not satisy this condition
    // and thus doesn't get annotated in oncoprinter
    // we need to decide whether to adapt or perhaps just scrap oncoprinter?
    const mutationsToQuery = _.chain(data)
        .filter(m => !!annotatedGenes[m.entrezGeneId])
        .filter(
            d =>
                d.proteinPosStart !== undefined && d.proteinPosEnd !== undefined
        )
        .value();

    if (mutationsToQuery.length === 0) {
        return ONCOKB_DEFAULT;
    }
    return queryOncoKbData(
        mutationsToQuery.map(mutation => {
            return {
                entrezGeneId: mutation.entrezGeneId,
                alteration: mutation.proteinChange,
                proteinPosStart: mutation.proteinPosStart,
                proteinPosEnd: mutation.proteinPosEnd,
                tumorType: null,
            };
        }),
        client,
        [EvidenceType.ONCOGENIC]
    );
}

export async function fetchOncoKbDataForCna(
    annotatedGenes: { [entrezGeneId: number]: boolean } | Error,
    data: OncoprinterGeneticTrackDatum_Data[],
    client: OncoKbAPI = oncokbClient
) {
    if (annotatedGenes instanceof Error) {
        return new Error();
    }

    const alterationsToQuery = _.chain(data)
        .filter(m => !!annotatedGenes[m.entrezGeneId])
        .filter(
            d =>
                d.molecularProfileAlterationType ===
                AlterationTypeConstants.COPY_NUMBER_ALTERATION
        )
        .value();

    if (alterationsToQuery.length === 0) {
        return ONCOKB_DEFAULT;
    }
    const queryVariants = (_.chain(alterationsToQuery)
        .map((datum: NumericGeneMolecularData) => {
            return generateCopyNumberAlterationQuery(
                datum.entrezGeneId,
                null,
                getAlterationString(datum.value),
                [EvidenceType.ONCOGENIC]
            );
        })
        .uniqBy('id')
        .value() as any) as AnnotateCopyNumberAlterationQuery[]; // lodash typings not perfect
    return queryOncoKbCopyNumberAlterationData(queryVariants, client);
}
/* Leaving commented only for reference, this will be replaced by unified input strategy
function makeGeneticTrackDatum_Data_Type3(oncoprinterInputLine:OncoprinterInputLineType3, hugoGeneSymbolToGene:{[hugoGeneSymbol:string]:Gene}) {
    let ret:Partial<OncoprinterGeneticTrackDatum_Data> = {
        // we'll never set these values - theyre not needed for oncoprinter
        driverFilter:"",
        driverFilterAnnotation:"",
        driverTiersFilter:"",
        driverTiersFilterAnnotation:"",
        mutationStatus: "", // used only for germline

        // we'll update these values later, not in this function
        oncoKbOncogenic: "",
        putativeDriver: false,

        // we set these values now
        hugoGeneSymbol:oncoprinterInputLine.hugoGeneSymbol,
        proteinChange:oncoprinterInputLine.proteinChange,
        molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED as any, // type3 line is always mutation
        isHotspot:oncoprinterInputLine.isHotspot,
        mutationType: oncoprinterInputLine.mutationType,
        alterationSubType: getSimplifiedMutationType(oncoprinterInputLine.mutationType),
        value:undefined, // type3 line is always mutation, so this field not needed

        // updated later in function
        entrezGeneId:0,
        proteinPosStart:undefined,
        proteinPosEnd:undefined
    };

    const gene = hugoGeneSymbolToGene[oncoprinterInputLine.hugoGeneSymbol];
    if (gene) {
        // add gene information if it exists
        ret.entrezGeneId = gene.entrezGeneId;
    }
    if (ret.proteinChange) {
        // add protein change information if it exists
        const parsedInfo = getProteinPositionFromProteinChange(ret.proteinChange);
        if (parsedInfo) {
            ret.proteinPosStart = parsedInfo.start;
            ret.proteinPosEnd = parsedInfo.end;
        }
    }

    return ret as OncoprinterGeneticTrackDatum_Data;
}*/

export function makeGeneticTrackDatum_Data(
    oncoprinterInputLine: OncoprinterGeneticInputLineType2,
    hugoGeneSymbolToGene: { [hugoGeneSymbol: string]: Gene }
) {
    let ret: Partial<OncoprinterGeneticTrackDatum_Data> = {
        // we'll never set these values - theyre not needed for oncoprinter
        driverTiersFilter: '',
        driverTiersFilterAnnotation: '',

        // we'll update these values later, not in this function
        oncoKbOncogenic: '',
        isHotspot: false,
        putativeDriver: false,

        // these are the same always or almost always
        hugoGeneSymbol: oncoprinterInputLine.hugoGeneSymbol,
        proteinChange: oncoprinterInputLine.proteinChange,
        eventInfo: oncoprinterInputLine.eventInfo,
        mutationStatus: oncoprinterInputLine.isGermline
            ? MUTATION_STATUS_GERMLINE
            : '',
        driverFilter: oncoprinterInputLine.isCustomDriver
            ? PUTATIVE_DRIVER
            : '',
        driverFilterAnnotation: oncoprinterInputLine.isCustomDriver
            ? 'You indicated that this mutation is a driver.'
            : '',

        // we'll update these later in this function
        molecularProfileAlterationType: undefined, // the profile type in AlterationTypeConstants
        alterationSubType: '', // high or low or cna_profile_data_to_string[value] or SimplifiedMutationType,
        value: undefined, // numeric cna
        mutationType: '',
        entrezGeneId: 0,
        proteinPosStart: undefined,
        proteinPosEnd: undefined,
    };

    const gene = hugoGeneSymbolToGene[oncoprinterInputLine.hugoGeneSymbol];
    if (gene) {
        // add gene information if it exists
        ret.entrezGeneId = gene.entrezGeneId;
    }
    if (ret.proteinChange) {
        // add protein change information if it exists
        const parsedInfo = getProteinPositionFromProteinChange(
            ret.proteinChange
        );
        if (parsedInfo) {
            ret.proteinPosStart = parsedInfo.start;
            ret.proteinPosEnd = parsedInfo.end;
        }
    }
    switch (oncoprinterInputLine.alteration) {
        case OncoprintMutationTypeEnum.MISSENSE:
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.MUTATION_EXTENDED,
                alterationSubType: 'missense',
                mutationType: 'missense_mutation',
            });
            break;
        case OncoprintMutationTypeEnum.INFRAME:
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.MUTATION_EXTENDED,
                alterationSubType: 'inframe',
                mutationType: 'indel',
            });
            break;
        case OncoprintMutationTypeEnum.STRUCTURAL_VARIANT:
            // Parse fusion partner genes from combined gene symbol (e.g., "BAP1-TCEA3")
            const geneParts = oncoprinterInputLine.hugoGeneSymbol.split('-');
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.STRUCTURAL_VARIANT,
                mutationType: 'structuralVariant',
                variantClass: 'FUSION',
                site1HugoSymbol: geneParts[0] ?? '',
                site2HugoSymbol: geneParts[1] ?? '',
            });
            break;
        case OncoprintMutationTypeEnum.PROMOTER:
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.MUTATION_EXTENDED,
                proteinChange: 'promoter',
            });
            break;
        case OncoprintMutationTypeEnum.SPLICE:
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.MUTATION_EXTENDED,
                alterationSubType: 'splice',
                mutationType: 'splice',
            });
            break;
        case OncoprintMutationTypeEnum.TRUNC:
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.MUTATION_EXTENDED,
                alterationSubType: 'nonsense',
                mutationType: 'nonsense',
            });
            break;
        case OncoprintMutationTypeEnum.OTHER:
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.MUTATION_EXTENDED,
                alterationSubType: 'other',
            });
            break;
        case 'amp':
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                alterationSubType: cna_profile_data_to_string['2'],
                value: 2,
            });
            break;
        case 'homdel':
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                alterationSubType: cna_profile_data_to_string['-2'],
                value: -2,
            });
            break;
        case 'gain':
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                alterationSubType: cna_profile_data_to_string['1'],
                value: 1,
            });
            break;
        case 'hetloss':
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                alterationSubType: cna_profile_data_to_string['-1'],
                value: -1,
            });
            break;
        case 'mrnaHigh':
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.MRNA_EXPRESSION,
                alterationSubType: 'high',
            });
            break;
        case 'mrnaLow':
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.MRNA_EXPRESSION,
                alterationSubType: 'low',
            });
            break;
        case 'protHigh':
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.PROTEIN_LEVEL,
                alterationSubType: 'high',
            });
            break;
        case 'protLow':
            ret = Object.assign(ret, {
                molecularProfileAlterationType:
                    AlterationTypeConstants.PROTEIN_LEVEL,
                alterationSubType: 'low',
            });
            break;
    }
    return ret as OncoprinterGeneticTrackDatum_Data;
}

export function isAltered(d: OncoprinterGeneticTrackDatum) {
    return (
        d.disp_mut ||
        d.disp_cna ||
        d.disp_mrna ||
        d.disp_prot ||
        d.disp_structuralVariant
    );
}
function getPercentAltered(data: OncoprinterGeneticTrackDatum[]) {
    const numAltered = _.chain(data)
        .filter(isAltered)
        .size()
        .value();

    return {
        totalCount: data.length,
        altered: numAltered,
        percent: percentAltered(numAltered, data.length),
    };
}

export function getSampleGeneticTrackData(
    oncoprinterInput: OncoprinterGeneticInputLine[],
    hugoGeneSymbolToGene: { [hugoGeneSymbol: string]: Gene },
    excludeGermlineMutations: boolean
): {
    [trackName: string]: {
        sampleId: string;
        data: OncoprinterGeneticTrackDatum_Data[];
    }[];
} {
    const trackToSampleIdToData: {
        [trackName: string]: {
            [sampleId: string]: OncoprinterGeneticTrackDatum['data'];
        };
    } = {};

    const type2Lines = oncoprinterInput.filter(d =>
        isType2(d)
    ) as OncoprinterGeneticInputLineType2[];
    // collect data by gene x sample
    for (const inputLine of type2Lines) {
        const trackName = inputLine.trackName || inputLine.hugoGeneSymbol;
        if (!(trackName in trackToSampleIdToData)) {
            // add track if it doesnt yet exist
            trackToSampleIdToData[trackName] = {};
        }
        const sampleIdToData = trackToSampleIdToData[trackName];
        if (!(inputLine.sampleId in sampleIdToData)) {
            sampleIdToData[inputLine.sampleId] = [];
        }
        const newDatum = makeGeneticTrackDatum_Data(
            inputLine,
            hugoGeneSymbolToGene
        );
        if (
            !excludeGermlineMutations ||
            !GERMLINE_REGEXP.test(newDatum.mutationStatus)
        ) {
            sampleIdToData[inputLine.sampleId].push(newDatum);
        }
    }
    // add missing samples
    for (const inputLine of oncoprinterInput) {
        _.forEach(trackToSampleIdToData, (sampleToData, trackName) => {
            if (!(inputLine.sampleId in sampleToData)) {
                sampleToData[inputLine.sampleId] = [];
            }
        });
    }

    return _.mapValues(trackToSampleIdToData, sampleIdToData =>
        _.chain(sampleIdToData)
            .map((data, sampleId) => ({ sampleId, data }))
            .value()
    );
}

export function getGeneticOncoprintData(geneToSampleData: {
    [hugoGeneSymbol: string]: {
        sampleId: string;
        data: OncoprinterGeneticTrackDatum_Data[];
    }[];
}): { [hugoGeneSymbol: string]: OncoprinterGeneticTrackDatum[] } {
    return _.mapValues(geneToSampleData, (sampleData, gene) =>
        sampleData.map(
            o =>
                fillGeneticTrackDatum(
                    {
                        sample: o.sampleId,
                        patient: o.sampleId,
                        study_id: '',
                        uid: o.sampleId,
                    },
                    gene,
                    o.data
                ) as OncoprinterGeneticTrackDatum
        )
    );
}

export function getGeneticTrackKey(hugoGeneSymbol: string) {
    return `geneticTrack_${hugoGeneSymbol}`;
}

export function getGeneticTracks(
    geneToOncoprintData: {
        [hugoGeneSymbol: string]: OncoprinterGeneticTrackDatum[];
    },
    geneOrder?: string[],
    excludedSampleIds?: string[]
): OncoprinterGeneticTrackSpec[] {
    // remove excluded sample data
    const excludedSampleIdsMap = _.keyBy(excludedSampleIds || []);
    geneToOncoprintData = _.mapValues(geneToOncoprintData, data =>
        data.filter(d => !(d.sample in excludedSampleIdsMap))
    );

    // note to AARON.  we need to fill out gapLels function for each track
    // but note that the sequencing maps aren't important because
    // in oncoprinter, we ignore when something has been sequenced.  it's data
    // which is not pertinent in this context.

    const geneToPercentAltered: {
        [hugoGeneSymbol: string]: any;
    } = _.mapValues(geneToOncoprintData, getPercentAltered);
    const genes = geneOrder
        ? geneOrder.filter(gene => gene in geneToOncoprintData)
        : Object.keys(geneToOncoprintData);
    return genes.map(gene => ({
        key: getGeneticTrackKey(gene),
        label: gene,
        info: geneToPercentAltered[gene].percent,
        data: geneToOncoprintData[gene],
        customOptions: [
            {
                gapLabelsFn: (model: OncoprintModel) => {
                    // this is required to actually invoke the data groups function
                    // if we just use get it will not compute anything
                    model.data_groups.update(model);

                    const groupsByTrackMap = model.data_groups.get();

                    const percentagesForGroups = groupsByTrackMap[gene][0].map(
                        getPercentAltered
                    );

                    return percentagesForGroups.map(info => {
                        return {
                            labelFormatter: function() {
                                return formatPercent(info.percent);
                            },
                            tooltipFormatter: function() {
                                return `${info.altered} altered of ${info.totalCount}`;
                            },
                        };
                    });
                },
            },
        ],
    }));
}

export function annotateGeneticTrackData(
    geneToSampleData: {
        [hugoGeneSymbol: string]: {
            sampleId: string;
            data: OncoprinterGeneticTrackDatum_Data[];
        }[];
    },
    promisesMap: {
        oncoKbCna: MobxPromise<IOncoKbData | Error>;
        oncoKb?: MobxPromise<IOncoKbData | Error>;
        cbioportalCount?: MobxPromise<{
            [mutationPositionKey: string]: number;
        }>;
    },
    params: {
        cbioportalCountThreshold?: number;
        useHotspots: boolean;
        useCustomBinary: boolean;
    },
    excludeVUS: boolean
) {
    // build annotater functions
    let getOncoKbCnaAnnotation = (d: OncoprinterGeneticTrackDatum_Data) => '';
    if (
        promisesMap.oncoKbCna.isComplete &&
        !(promisesMap.oncoKbCna.result instanceof Error)
    ) {
        const indicatorMap = (promisesMap.oncoKbCna!.result! as IOncoKbData)
            .indicatorMap!;
        getOncoKbCnaAnnotation = (d: OncoprinterGeneticTrackDatum_Data) => {
            const id = generateQueryVariantId(
                d.entrezGeneId,
                null,
                getAlterationString(d.value)
            );
            const indicator = indicatorMap[id];
            if (indicator) {
                return getOncoKbOncogenic(indicator);
            } else {
                return '';
            }
        };
    }

    let getOncoKbAnnotation = (d: OncoprinterGeneticTrackDatum_Data) => '';
    if (
        promisesMap.oncoKb &&
        promisesMap.oncoKb.isComplete &&
        !(promisesMap.oncoKb.result instanceof Error)
    ) {
        const indicatorMap = (promisesMap.oncoKb!.result! as IOncoKbData)
            .indicatorMap!;
        getOncoKbAnnotation = (d: OncoprinterGeneticTrackDatum_Data) => {
            const id = generateQueryVariantId(
                d.entrezGeneId,
                null,
                d.proteinChange
            );
            const oncoKbIndicator = indicatorMap[id];
            if (oncoKbIndicator) {
                return getOncoKbOncogenic(oncoKbIndicator);
            } else {
                return '';
            }
        };
    }

    let getCBioAnnotation = (d: OncoprinterGeneticTrackDatum_Data) => false;
    if (promisesMap.cbioportalCount && promisesMap.cbioportalCount.isComplete) {
        const countMap = promisesMap.cbioportalCount!.result!;
        const threshold = params.cbioportalCountThreshold!;
        getCBioAnnotation = (d: OncoprinterGeneticTrackDatum_Data) => {
            if (
                d.molecularProfileAlterationType ===
                AlterationTypeConstants.MUTATION_EXTENDED
            ) {
                const key = mutationCountByPositionKey(d as any);
                const count = countMap[key];
                return threshold <= count;
            } else {
                return false;
            }
        };
    }

    return _.mapValues(geneToSampleData, (sampleData, gene) => {
        return sampleData.map(object => {
            const newObj = _.clone(object);
            newObj.data = newObj.data.filter(d => {
                // clear previous annotations
                delete (d as Partial<OncoprinterGeneticTrackDatum_Data>)
                    .oncoKbOncogenic;
                delete (d as Partial<OncoprinterGeneticTrackDatum_Data>)
                    .putativeDriver;
                // annotate and filter out if necessary
                switch (d.molecularProfileAlterationType) {
                    case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                        d.oncoKbOncogenic = getOncoKbCnaAnnotation(d);
                        break;
                    case AlterationTypeConstants.MUTATION_EXTENDED:
                        d.oncoKbOncogenic = getOncoKbAnnotation(d);
                        break;
                    case AlterationTypeConstants.STRUCTURAL_VARIANT:
                        d.oncoKbOncogenic = getOncoKbAnnotation(d);
                        break;
                }
                if (
                    d.molecularProfileAlterationType ===
                    AlterationTypeConstants.MUTATION_EXTENDED
                ) {
                    // tag mutations as putative driver, and filter them
                    d.putativeDriver = !!(
                        d.oncoKbOncogenic ||
                        (params.useHotspots && d.isHotspot) ||
                        getCBioAnnotation(d) ||
                        (params.useCustomBinary &&
                            d.driverFilter === PUTATIVE_DRIVER)
                    );
                    return !excludeVUS || d.putativeDriver;
                }
                if (
                    d.molecularProfileAlterationType ===
                    AlterationTypeConstants.STRUCTURAL_VARIANT
                ) {
                    // tag structural variants as putative driver based on custom annotation or OncoKB
                    d.putativeDriver = !!(
                        d.oncoKbOncogenic ||
                        (params.useCustomBinary &&
                            d.driverFilter === PUTATIVE_DRIVER)
                    );
                    return !excludeVUS || d.putativeDriver;
                } else {
                    return true;
                }
            });
            return newObj;
        }, []);
    });
}

export function parseGeneticInput(
    input: string
):
    | {
          parseSuccess: true;
          result: OncoprinterGeneticInputLine[];
          error: undefined;
      }
    | { parseSuccess: false; result: undefined; error: string } {
    const lines = input
        .trim()
        .split('\n')
        .map(line => line.trim().split(/\s+/));
    try {
        const result = lines.map((line, lineIndex) => {
            if (
                lineIndex === 0 &&
                _.isEqual(lines[0].map(s => s.toLowerCase()).slice(0, 4), [
                    'sample',
                    'gene',
                    'alteration',
                    'type',
                ])
            ) {
                return null; // skip header line
            }
            const errorPrefix = `Genetic data input error on line ${lineIndex +
                1}: \n${line.join('\t')}\n\n`;
            if (line.length === 1) {
                // Type 1 line
                return { sampleId: line[0] };
            } else if (line.length === 4 || line.length === 5) {
                // Type 2 line
                const sampleId = line[0];
                const hugoGeneSymbol = line[1];
                const alteration = line[2];
                const lcAlteration = alteration.toLowerCase();
                const type = line[3];
                const lcType = type.toLowerCase();
                const trackName = line.length === 5 ? line[4] : undefined;
                let ret: Partial<OncoprinterGeneticInputLineType2> = {
                    sampleId,
                    hugoGeneSymbol,
                    trackName,
                };

                switch (lcType) {
                    case 'cna':
                        if (
                            ['amp', 'gain', 'hetloss', 'homdel'].indexOf(
                                lcAlteration
                            ) === -1
                        ) {
                            throw new Error(
                                `${errorPrefix}Alteration "${alteration}" is not valid - it must be "AMP", "GAIN" ,"HETLOSS", or "HOMDEL" since Type is "CNA"`
                            );
                        }
                        ret.alteration = lcAlteration as
                            | 'amp'
                            | 'gain'
                            | 'hetloss'
                            | 'homdel';
                        break;
                    case 'exp':
                        if (lcAlteration === 'high') {
                            ret.alteration = 'mrnaHigh';
                        } else if (lcAlteration === 'low') {
                            ret.alteration = 'mrnaLow';
                        } else {
                            throw new Error(
                                `${errorPrefix}Alteration "${alteration}" is not valid - it must be "HIGH" or "LOW" if Type is "EXP"`
                            );
                        }
                        break;
                    case 'prot':
                        if (lcAlteration === 'high') {
                            ret.alteration = 'protHigh';
                        } else if (lcAlteration === 'low') {
                            ret.alteration = 'protLow';
                        } else {
                            throw new Error(
                                `${errorPrefix}Alteration "${alteration}" is not valid - it must be "HIGH" or "LOW" if Type is "PROT"`
                            );
                        }
                        break;
                    case 'fusion':
                    case 'fusion_driver':
                    case 'fusion_germline':
                    case 'fusion_germline_driver':
                    case 'fusion_driver_germline':
                        ret.alteration = 'structuralVariant';
                        ret.eventInfo = alteration;
                        // Parse modifiers for fusion type
                        if (lcType.includes('_driver')) {
                            ret.isCustomDriver = true;
                        }
                        if (lcType.includes('_germline')) {
                            ret.isGermline = true;
                        }
                        break;
                    default:
                        // everything else is a mutation
                        // use OQL parsing for handling mutation modifiers
                        let parsedMutation: MUTCommand<any>;
                        try {
                            parsedMutation = (parseOQLQuery(
                                `GENE: ${lcType}`
                            )[0].alterations as Alteration[])[0] as MUTCommand<
                                any
                            >;
                        } catch (e) {
                            throw new Error(
                                `${errorPrefix}Mutation type ${type} is not valid.`
                            );
                        }

                        for (const modifier of parsedMutation.modifiers) {
                            switch (modifier.type) {
                                case 'GERMLINE':
                                    ret.isGermline = true;
                                    break;
                                case 'DRIVER':
                                    ret.isCustomDriver = true;
                                    break;
                                default:
                                    throw new Error(
                                        `${errorPrefix}Only allowed mutation modifiers are GERMLINE and DRIVER`
                                    );
                            }
                        }

                        const lcMutationType = parsedMutation.constr_val!.toLowerCase();

                        if (
                            [
                                'missense',
                                'inframe',
                                'promoter',
                                'trunc',
                                'splice',
                                'other',
                            ].indexOf(lcMutationType) === -1
                        ) {
                            throw new Error(
                                `${errorPrefix}Type "${type}" is not valid - it must be "MISSENSE", "INFRAME", "TRUNC", "SPLICE", "PROMOTER", or "OTHER" for a mutation alteration.`
                            );
                        }
                        ret.alteration = lcMutationType as OncoprintMutationType;
                        ret.proteinChange = alteration;

                        break;
                }
                return ret as OncoprinterGeneticInputLineType2;
            } else {
                throw new Error(
                    `${errorPrefix}input lines must have either 1 or 4 columns.`
                );
            }
        });
        return {
            parseSuccess: true,
            result: result.filter(x => !!x) as OncoprinterGeneticInputLine[],
            error: undefined,
        };
    } catch (e) {
        return {
            parseSuccess: false,
            result: undefined,
            error: e.message,
        };
    }
}
