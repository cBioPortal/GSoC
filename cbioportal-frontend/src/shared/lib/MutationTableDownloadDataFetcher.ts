import { MobxPromise } from 'cbioportal-frontend-commons';
import { ILazyMobXTableApplicationLazyDownloadDataFetcher } from 'shared/lib/ILazyMobXTableApplicationLazyDownloadDataFetcher';
import LazyMobXCache from 'shared/lib/LazyMobXCache';
import {
    default as MutationCountCache,
    fetch as fetchMutationCountData,
} from 'shared/cache/MutationCountCache';
import {
    default as ClinicalAttributeCache,
    fetch as fetchClinicalData,
} from 'shared/cache/ClinicalAttributeCache';
import {
    default as GenomeNexusCache,
    defaultGNFetch as fetchGenomeNexusData,
} from 'shared/cache/GenomeNexusCache';
import {
    default as DiscreteCNACache,
    fetch as fetchDiscreteCNAData,
} from 'shared/cache/DiscreteCNACache';
import {
    Mutation,
    ClinicalAttribute,
    MolecularProfile,
} from 'cbioportal-ts-api-client';
import _ from 'lodash';
import {
    default as GenomeNexusMutationAssessorCache,
    defaultGNFetch as fetchGenomeNexusMutationAssessorData,
} from 'shared/cache/GenomeNexusMutationAssessorCache';
import { shouldShowMutationAssessor } from 'shared/lib/genomeNexusAnnotationSourcesUtils';

export class MutationTableDownloadDataFetcher
    implements ILazyMobXTableApplicationLazyDownloadDataFetcher {
    private allData: any[] | undefined = undefined;

    constructor(
        private mutationData: MobxPromise<Mutation[]>,
        private clinicalAttributes?: MobxPromise<ClinicalAttribute[]>,
        private studyToMolecularProfileDiscrete?: {
            [studyId: string]: MolecularProfile;
        },
        private genomeNexusCache?: () => GenomeNexusCache,
        private genomeNexusMutationAssessorCache?: () => GenomeNexusMutationAssessorCache,
        private mutationCountCache?: () => MutationCountCache,
        private clinicalAttributeCache?: () => ClinicalAttributeCache,
        private discreteCNACache?: () => DiscreteCNACache
    ) {
        // TODO labelMobxPromises(this); ?
    }

    public fetchAndCacheAllLazyData(): Promise<any[]> {
        if (this.allData) {
            return Promise.resolve(this.allData);
        }

        return new Promise<any[]>((resolve, reject) => {
            const promiseCachePairs = this.availablePromiseCachePairs();

            Promise.all(promiseCachePairs.promises)
                .then((allData: any[]) => {
                    this.allData = allData;

                    // add data to cache for future use
                    for (let i = 0; i < allData.length; i++) {
                        promiseCachePairs.caches[i].addData(allData[i]);
                    }

                    resolve(allData);
                })
                .catch(reject);
        });
    }

    private availablePromiseCachePairs(): {
        promises: Promise<any>[];
        caches: LazyMobXCache<any, any>[];
    } {
        const promises: Promise<any>[] = [];
        const caches: LazyMobXCache<any, any>[] = [];

        if (this.genomeNexusCache) {
            if (this.mutationData.result) {
                promises.push(fetchGenomeNexusData(this.mutationData.result));
                caches.push(this.genomeNexusCache());
            }
        }

        if (
            shouldShowMutationAssessor() &&
            this.genomeNexusMutationAssessorCache
        ) {
            if (this.mutationData.result) {
                promises.push(
                    fetchGenomeNexusMutationAssessorData(
                        this.mutationData.result
                    )
                );
                caches.push(this.genomeNexusMutationAssessorCache());
            }
        }

        if (this.mutationCountCache) {
            promises.push(this.fetchAllMutationCountData());
            caches.push(this.mutationCountCache());
        }

        if (this.clinicalAttributeCache) {
            promises.push(this.fetchAllClinicalData());
            caches.push(this.clinicalAttributeCache());
        }

        if (this.discreteCNACache) {
            promises.push(this.fetchAllDiscreteCNAData());
            caches.push(this.discreteCNACache());
        }

        return { promises, caches };
    }

    private async fetchAllMutationCountData() {
        if (this.mutationData.result) {
            const queries = this.mutationData.result.map(mutation => ({
                sampleId: mutation.sampleId,
                studyId: mutation.studyId,
            }));

            return await fetchMutationCountData(queries);
        } else {
            return undefined;
        }
    }

    private async fetchAllClinicalData() {
        if (
            this.mutationData.result &&
            this.clinicalAttributes &&
            this.clinicalAttributes.result
        ) {
            const queries = _.flatten(
                this.mutationData.result.map(mutation =>
                    this.clinicalAttributes!.result!.map(attribute => ({
                        clinicalAttribute: attribute,
                        entityId: attribute.patientAttribute
                            ? mutation.patientId
                            : mutation.sampleId,
                        studyId: mutation.studyId,
                    }))
                )
            );

            return await fetchClinicalData(queries);
        } else {
            return undefined;
        }
    }

    private async fetchAllDiscreteCNAData() {
        if (this.mutationData.result) {
            const queries = this.mutationData.result.map(mutation => ({
                sampleId: mutation.sampleId,
                studyId: mutation.studyId,
                entrezGeneId: mutation.entrezGeneId,
            }));
            const cnaData = await fetchDiscreteCNAData(
                queries,
                this.studyToMolecularProfileDiscrete!
            );
            const modifiedCNAData = _.flatten(
                _.map(cnaData, rawData => {
                    const mappedArray = _.map(
                        _.flatten(rawData.data),
                        props => {
                            return { ...props, studyId: rawData.meta };
                        }
                    );
                    return mappedArray;
                })
            );
            return modifiedCNAData;
        } else {
            return undefined;
        }
    }
}
