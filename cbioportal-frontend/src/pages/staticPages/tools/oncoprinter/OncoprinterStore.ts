import { DriverAnnotationSettings } from '../../../../shared/alterationFiltering/AnnotationFilteringSettings';
import { action, computed, makeObservable, observable } from 'mobx';
import { getServerConfig } from 'config/config';
import {
    annotateGeneticTrackData,
    fetchOncoKbDataForCna,
    fetchOncoKbDataForMutations,
    getGeneSymbols,
    getGeneticTracks,
    getGeneticOncoprintData,
    getSampleGeneticTrackData,
    getSampleIds,
    initDriverAnnotationSettings,
    isAltered,
    isType2,
    parseGeneticInput,
} from './OncoprinterGeneticUtils';
import { remoteData } from 'cbioportal-frontend-commons';
import { IOncoKbData } from 'cbioportal-utils';
import { CancerGene } from 'oncokb-ts-api-client';

import {
    fetchOncoKbCancerGenes,
    ONCOKB_DEFAULT,
} from '../../../../shared/lib/StoreUtils';
import client from '../../../../shared/api/cbioportalClientInstance';
import _ from 'lodash';
import {
    countMutations,
    mutationCountByPositionKey,
} from '../../../resultsView/mutationCountHelpers';
import { Mutation, MutationCountByPosition } from 'cbioportal-ts-api-client';
import { SampleAlteredMap } from '../../../resultsView/ResultsViewPageStoreUtils';
import { AlteredStatus } from 'pages/resultsView/mutualExclusivity/MutualExclusivityUtil';
import {
    getClinicalTracks,
    getHeatmapTracks,
    parseClinicalInput,
    parseHeatmapInput,
} from './OncoprinterClinicalAndHeatmapUtils';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import { RGBAColor } from 'oncoprintjs';

export type OncoprinterDriverAnnotationSettings = Pick<
    DriverAnnotationSettings,
    'includeVUS' | 'customBinary' | 'hotspots' | 'oncoKb' | 'driversAnnotated'
>;

/* Leaving commented only for reference, this will be replaced by unified input strategy
function genomeNexusKey(l:OncoprinterInputLineType3_Incomplete){
    return `${l.chromosome}_${l.startPosition}_${l.endPosition}_${l.referenceAllele}_${l.variantAllele}`;
}

function genomeNexusKey2(l:{chromosome:string, start:number, end:number, referenceAllele:string, variantAllele:string}){
    return `${l.chromosome}_${l.start}_${l.end}_${l.referenceAllele}_${l.variantAllele}`;
}*/

const ONCOPRINTER_COLOR_CONFIG = 'oncoprinterClinicalTracksColorConfig';

export default class OncoprinterStore {
    // NOTE: we are not annotating hotspot because that needs nucleotide positions
    //      we are not annotating COSMIC because that needs keywords

    @observable submitCount = 0;

    @observable.ref _inputSampleIdOrder: string | undefined = undefined;
    @observable.ref _geneOrder: string | undefined = undefined;
    @observable driverAnnotationSettings: OncoprinterDriverAnnotationSettings;
    @observable.ref _geneticDataInput: string | undefined = undefined;
    @observable.ref _clinicalDataInput: string | undefined = undefined;
    @observable.ref _heatmapDataInput: string | undefined = undefined;
    @observable public showUnalteredColumns: boolean = true;
    @observable hideGermlineMutations = false;
    @observable customDriverWarningHidden: boolean;

    @observable _mutations: string | undefined = undefined;
    @observable _studyIds: string | undefined = undefined;

    @observable _userSelectedClinicalTracksColors: {
        [trackLabel: string]: {
            [attributeValue: string]: RGBAColor;
        };
    } = {};

    constructor() {
        makeObservable(this);
        this.initialize();

        const clinicalTracksColorConfig = localStorage.getItem(
            ONCOPRINTER_COLOR_CONFIG
        );
        if (clinicalTracksColorConfig !== null) {
            this._userSelectedClinicalTracksColors = JSON.parse(
                clinicalTracksColorConfig
            );
        }
    }

    private initialize() {
        this.driverAnnotationSettings = initDriverAnnotationSettings(this);
        this.customDriverWarningHidden = false;
    }

    @computed get didOncoKbFail() {
        return this.oncoKbData.status === 'complete' && this.oncoKbData.isError;
    }

    @computed get sampleIds() {
        if (this.inputSampleIdOrder) {
            return this.inputSampleIdOrder;
        } else {
            return this.allSampleIds;
        }
    }

    @computed get allSampleIds() {
        const parsedInputLines = (this.parsedGeneticInputLines.result || [])
            .concat(
                (this.parsedClinicalInputLines.result &&
                    this.parsedClinicalInputLines.result.data) ||
                    []
            )
            .concat(
                (this.parsedHeatmapInputLines.result &&
                    this.parsedHeatmapInputLines.result.data) ||
                    []
            );
        if (parsedInputLines.length > 0) {
            return getSampleIds(parsedInputLines);
        } else {
            return [];
        }
    }

    @action setSampleIdOrder(input: string) {
        this._inputSampleIdOrder = input.trim();
    }

    @computed get inputSampleIdOrder() {
        if (this._inputSampleIdOrder) {
            // intersection - only take into account specified sample ids
            return _.intersection(
                this._inputSampleIdOrder.split(/[,\s]+/),
                this.allSampleIds
            );
        } else {
            return undefined;
        }
    }

    @computed get sampleIdsNotInInputOrder() {
        if (this.inputSampleIdOrder) {
            return _.difference(this.allSampleIds, this.inputSampleIdOrder);
        } else {
            undefined;
        }
    }

    readonly hiddenSampleIds = remoteData({
        await: () => [this.unalteredSampleIds],
        invoke: async () =>
            this.showUnalteredColumns ? [] : this.unalteredSampleIds.result!,
        default: [],
    });

    @action setGeneOrder(input: string) {
        this._geneOrder = input.trim();
    }

    @computed get geneOrder() {
        if (this._geneOrder) {
            return _.uniq(this._geneOrder.split(/[,\s]+/));
        } else {
            return undefined;
        }
    }

    public hasData() {
        return (
            !!this._geneticDataInput ||
            !!this._clinicalDataInput ||
            !!this._heatmapDataInput
        );
    }

    @action setDataInput(
        geneticData: string,
        clinicalData: string,
        heatmapData: string
    ) {
        this._geneticDataInput = geneticData;
        this._clinicalDataInput = clinicalData;
        this._heatmapDataInput = heatmapData;
    }

    @action public setInput(
        geneticData: string,
        clinicalData: string,
        heatmapData: string,
        genes: string,
        samples: string
    ) {
        this.submitCount += 1;
        this.setDataInput(geneticData, clinicalData, heatmapData);
        this.setGeneOrder(genes);
        this.setSampleIdOrder(samples);

        this.initialize();
    }

    @action public setJupyterInput(mutations: string, studyIds: string) {
        this._mutations = mutations;
        this._studyIds = studyIds;
    }

    @computed get mutationsDataProps() {
        if (this._mutations) return JSON.parse(this._mutations);
    }

    @computed get studyIdProps() {
        if (this._studyIds) return JSON.parse(this._studyIds);
    }

    @computed get parsedGeneticInputLines() {
        if (!this._geneticDataInput) {
            return {
                error: null,
                result: [],
            };
        }

        const parsed = parseGeneticInput(this._geneticDataInput);
        if (!parsed.parseSuccess) {
            return {
                error: parsed.error,
                result: null,
            };
        } else {
            return {
                error: null,
                result: parsed.result,
            };
        }
    }

    @computed get parsedClinicalInputLines() {
        if (!this._clinicalDataInput) {
            return {
                error: null,
                result: { headers: [], data: [] },
            };
        }

        const parsed = parseClinicalInput(this._clinicalDataInput);
        if (!parsed.parseSuccess) {
            return {
                error: parsed.error,
                result: null,
            };
        } else {
            return {
                error: null,
                result: parsed.result,
            };
        }
    }

    @computed get parsedHeatmapInputLines() {
        if (!this._heatmapDataInput) {
            return {
                error: null,
                result: { headers: [], data: [] },
            };
        }

        const parsed = parseHeatmapInput(this._heatmapDataInput);
        if (!parsed.parseSuccess) {
            return {
                error: parsed.error,
                result: null,
            };
        } else {
            return {
                error: null,
                result: parsed.result,
            };
        }
    }

    @computed get parseErrors() {
        const errors = [];
        if (this.parsedGeneticInputLines.error) {
            errors.push(this.parsedGeneticInputLines.error);
        }
        if (this.parsedClinicalInputLines.error) {
            errors.push(this.parsedClinicalInputLines.error);
        }
        if (this.parsedHeatmapInputLines.error) {
            errors.push(this.parsedHeatmapInputLines.error);
        }

        return errors;
    }

    @computed get hugoGeneSymbols() {
        if (this.geneOrder) {
            return this.geneOrder;
        } else if (this.parsedGeneticInputLines.result) {
            return getGeneSymbols(this.parsedGeneticInputLines.result);
        } else {
            return [];
        }
    }

    @computed get existCustomDrivers() {
        return (
            this.parsedGeneticInputLines.result &&
            this.parsedGeneticInputLines.result.findIndex(
                x => !!(isType2(x) && x.isCustomDriver)
            ) > -1
        );
    }

    readonly hugoGeneSymbolToGene = remoteData({
        invoke: async () => {
            const geneIds = this.hugoGeneSymbols;
            if (geneIds.length > 0) {
                return _.keyBy(
                    await client.fetchGenesUsingPOST({
                        geneIdType: 'HUGO_GENE_SYMBOL',
                        geneIds,
                    }),
                    o => o.hugoGeneSymbol
                );
            } else {
                return {};
            }
        },
    });

    readonly oncoKbCancerGenes = remoteData(
        {
            invoke: () => {
                if (getServerConfig().show_oncokb) {
                    return fetchOncoKbCancerGenes();
                } else {
                    return Promise.resolve([]);
                }
            },
        },
        []
    );

    readonly oncoKbAnnotatedGenes = remoteData(
        {
            await: () => [this.oncoKbCancerGenes],
            invoke: () => {
                if (getServerConfig().show_oncokb) {
                    return Promise.resolve(
                        _.reduce(
                            this.oncoKbCancerGenes.result,
                            (
                                map: { [entrezGeneId: number]: boolean },
                                next: CancerGene
                            ) => {
                                if (next?.oncokbAnnotated) {
                                    map[next.entrezGeneId] = true;
                                }
                                return map;
                            },
                            {}
                        )
                    );
                } else {
                    return Promise.resolve({});
                }
            },
        },
        {}
    );

    readonly oncoKbData = remoteData<IOncoKbData | Error>(
        {
            await: () => [
                this.nonAnnotatedGeneticData,
                this.oncoKbAnnotatedGenes,
            ],
            invoke: async () => {
                if (getServerConfig().show_oncokb) {
                    return fetchOncoKbDataForMutations(
                        this.oncoKbAnnotatedGenes.result!,
                        this.nonAnnotatedGeneticData.result!
                    );
                } else {
                    return ONCOKB_DEFAULT;
                }
            },
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        ONCOKB_DEFAULT
    );

    readonly oncoKbCnaData = remoteData<IOncoKbData | Error>(
        {
            await: () => [
                this.nonAnnotatedGeneticData,
                this.oncoKbAnnotatedGenes,
            ],
            invoke: async () => {
                if (getServerConfig().show_oncokb) {
                    let result;
                    try {
                        result = await fetchOncoKbDataForCna(
                            this.oncoKbAnnotatedGenes.result!,
                            this.nonAnnotatedGeneticData.result!
                        );
                    } catch (e) {
                        result = new Error();
                    }
                    return result;
                } else {
                    return ONCOKB_DEFAULT;
                }
            },
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        ONCOKB_DEFAULT
    );

    readonly cbioportalCountData = remoteData<{
        [mutationPositionKey: string]: number;
    }>({
        await: () => [this.nonAnnotatedGeneticData],
        invoke: async () => {
            const mutations = this.nonAnnotatedGeneticData.result!.filter(
                x =>
                    x.proteinPosStart !== undefined &&
                    x.proteinPosEnd !== undefined
            ) as Pick<
                Mutation,
                'entrezGeneId' | 'proteinPosStart' | 'proteinPosEnd'
            >[];

            const mutationPositionIdentifiers = _.values(
                countMutations(mutations)
            );

            const data = await internalClient.fetchMutationCountsByPositionUsingPOST(
                {
                    mutationPositionIdentifiers,
                }
            );

            return _.chain(data)
                .groupBy(mutationCountByPositionKey)
                .mapValues((counts: MutationCountByPosition[]) =>
                    _.sumBy(counts, c => c.count)
                )
                .value();
        },
    });

    readonly alteredSampleIds = remoteData({
        await: () => [this.geneticTracks],
        invoke: async () => {
            const allAlteredIds = _.chain(this.geneticTracks.result!)
                .map(track => track.data.filter(isAltered))
                .flatten()
                .map(datum => datum.sample)
                .uniq()
                .value();
            const visibleAlteredIds = _.intersection(
                this.sampleIds,
                allAlteredIds
            );
            return visibleAlteredIds;
        },
        default: [],
    });

    readonly unalteredSampleIds = remoteData({
        await: () => [this.alteredSampleIds],
        invoke: async () => {
            return _.difference(this.sampleIds, this.alteredSampleIds.result!);
        },
        default: [],
    });

    readonly isSampleAlteredMap = remoteData<SampleAlteredMap>({
        await: () => [this.geneticTracks],
        invoke: async () => {
            // The boolean array value represents "is sample altered in this track" for each sample id.
            // The samples in the lists corresponding to each entry are assumed to be the same and in the same order.

            return _.reduce(
                this.geneticTracks.result!,
                (map: SampleAlteredMap, next) => {
                    const sampleToDatum = _.keyBy(next.data, d => d.sample);
                    map[next.label] = this.sampleIds.map(sampleId => {
                        const datum = sampleToDatum[sampleId];
                        if (!datum) {
                            return AlteredStatus.UNPROFILED;
                        } else if (datum.data.length > 0) {
                            return AlteredStatus.ALTERED;
                        } else {
                            return AlteredStatus.UNALTERED;
                        }
                    });
                    return map;
                },
                {}
            );
        },
    });

    @computed get annotationData(): any {
        const promisesMap: any = {};
        const params: any = {};
        // always
        params.useHotspots = this.driverAnnotationSettings.hotspots;
        params.useCustomBinary = this.driverAnnotationSettings.customBinary;
        promisesMap.oncoKbCna = this.oncoKbCnaData;

        if (this.driverAnnotationSettings.driversAnnotated) {
            if (this.driverAnnotationSettings.oncoKb) {
                promisesMap.oncoKb = this.oncoKbData;
            }
        }

        return {
            promises: _.values(promisesMap),
            params,
            promisesMap,
        };
    }

    readonly nonAnnotatedGeneticTrackData = remoteData({
        await: () => [this.hugoGeneSymbolToGene],
        invoke: async () => {
            if (this.parsedGeneticInputLines.result) {
                return getSampleGeneticTrackData(
                    this.parsedGeneticInputLines.result,
                    this.hugoGeneSymbolToGene.result!,
                    this.hideGermlineMutations
                );
            } else {
                return {};
            }
        },
    });

    readonly nonAnnotatedGeneticData = remoteData({
        await: () => [this.nonAnnotatedGeneticTrackData],
        invoke: async () => {
            return _.chain(this.nonAnnotatedGeneticTrackData.result!)
                .values()
                .flatten()
                .map(o => o.data)
                .flatten()
                .value();
        },
    });

    readonly annotatedGeneticTrackData = remoteData({
        await: () => [
            this.nonAnnotatedGeneticTrackData,
            ...this.annotationData.promises,
        ],
        invoke: async () =>
            annotateGeneticTrackData(
                this.nonAnnotatedGeneticTrackData.result!,
                this.annotationData.promisesMap,
                this.annotationData.params,
                !this.driverAnnotationSettings.includeVUS
            ),
    });

    readonly annotatedGeneticOncoprintData = remoteData({
        await: () => [this.annotatedGeneticTrackData],
        invoke: async () =>
            getGeneticOncoprintData(this.annotatedGeneticTrackData.result!),
    });

    readonly geneticTracks = remoteData({
        await: () => [this.annotatedGeneticOncoprintData],
        invoke: async () =>
            getGeneticTracks(
                this.annotatedGeneticOncoprintData.result!,
                this.geneOrder,
                this.sampleIdsNotInInputOrder
            ),
        default: [],
    });

    @computed get clinicalTracks() {
        const result = this.parsedClinicalInputLines.result;

        if (!result) {
            return [];
        }

        return getClinicalTracks(
            result.headers,
            result.data,
            this.userSelectedClinicalTracksColors,
            this.sampleIdsNotInInputOrder
        );
    }

    @computed get heatmapTracks() {
        const result = this.parsedHeatmapInputLines.result;

        if (!result) {
            return [];
        }

        return getHeatmapTracks(
            result.headers,
            result.data,
            this.sampleIdsNotInInputOrder
        );
    }

    @action.bound
    public setUserSelectedClinicalTrackColor(
        label: string,
        value: string,
        color: RGBAColor | undefined
    ) {
        // if color is undefined, delete color from userSelectedClinicalAttributeColors if exists
        // else, set the color in userSelectedClinicalAttributeColors
        if (
            !color &&
            this._userSelectedClinicalTracksColors[label] &&
            this._userSelectedClinicalTracksColors[label][value]
        ) {
            delete this._userSelectedClinicalTracksColors[label][value];
        } else if (color) {
            if (!this._userSelectedClinicalTracksColors[label]) {
                this._userSelectedClinicalTracksColors[label] = {};
            }
            this._userSelectedClinicalTracksColors[label][value] = color;
        }
        localStorage.setItem(
            ONCOPRINTER_COLOR_CONFIG,
            JSON.stringify(this._userSelectedClinicalTracksColors)
        );
    }

    @computed get userSelectedClinicalTracksColors() {
        return this._userSelectedClinicalTracksColors;
    }
}
