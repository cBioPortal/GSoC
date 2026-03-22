import { IHotspotIndex } from 'cbioportal-utils';
import {
    Mutation,
    Gene,
    ClinicalAttribute,
    ClinicalData,
    CancerStudy,
    MolecularProfile,
    SampleIdentifier,
} from 'cbioportal-ts-api-client';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { CancerGene } from 'oncokb-ts-api-client';
import {
    VariantAnnotation,
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
} from 'genome-nexus-ts-api-client';
import MutationCountCache from 'shared/cache/MutationCountCache';
import ClinicalAttributeCache from 'shared/cache/ClinicalAttributeCache';
import DiscreteCNACache from 'shared/cache/DiscreteCNACache';
import GenomeNexusCache from 'shared/cache/GenomeNexusCache';
import GenomeNexusMutationAssessorCache from 'shared/cache/GenomeNexusMutationAssessorCache';
import { MutationTableDownloadDataFetcher } from 'shared/lib/MutationTableDownloadDataFetcher';
import MutationMapperStore, {
    IMutationMapperStoreConfig,
} from 'shared/components/mutationMapper/MutationMapperStore';
import { IServerConfig } from '../../../config/IAppConfig';
import { computed, makeObservable } from 'mobx';
import {
    createNumericalFilter,
    createCategoricalFilter,
} from 'shared/lib/MutationUtils';
import { MutationTableColumnType } from 'shared/components/mutationTable/MutationTable';
import GnomadColumnFormatter from 'shared/components/mutationTable/column/GnomadColumnFormatter';
import DbsnpColumnFormatter from 'shared/components/mutationTable/column/DbsnpColumnFormatter';
import MutationCountColumnFormatter from 'shared/components/mutationTable/column/MutationCountColumnFormatter';
import ExonColumnFormatter from 'shared/components/mutationTable/column/ExonColumnFormatter';
import StudyColumnFormatter from 'shared/components/mutationTable/column/StudyColumnFormatter';
import DiscreteCNAColumnFormatter from 'shared/components/mutationTable/column/DiscreteCNAColumnFormatter';
import CancerTypeColumnFormatter from 'shared/components/mutationTable/column/CancerTypeColumnFormatter';
import HgvscColumnFormatter from 'shared/components/mutationTable/column/HgvscColumnFormatter';
import ClinicalAttributeColumnFormatter from 'shared/components/mutationTable/column/ClinicalAttributeColumnFormatter';
import _ from 'lodash';
import NumericNamespaceColumnFormatter from 'shared/components/namespaceColumns/NumericNamespaceColumnFormatter';
import CategoricalNamespaceColumnFormatter from 'shared/components/namespaceColumns/CategoricalNamespaceColumnFormatter';
import { createNamespaceColumnName } from 'shared/components/namespaceColumns/namespaceColumnsUtils';

export default class ResultsViewMutationMapperStore extends MutationMapperStore {
    constructor(
        protected mutationMapperServerConfig: IServerConfig,
        protected mutationMapperStoreConfig: IMutationMapperStoreConfig,
        public gene: Gene,
        public samples: MobxPromise<SampleIdentifier[]>,
        public oncoKbCancerGenes: MobxPromise<CancerGene[] | Error>,
        // getMutationDataCache needs to be a getter for the following reason:
        // when the input parameters to the mutationDataCache change, the cache
        // is recomputed. Mobx needs to respond to this. But if we pass the mutationDataCache
        // in as a value, then when using it we don't access the observable property mutationDataCache,
        // so that when it changes we won't react. Thus we need to access it as store.mutationDataCache
        // (which will be done in the getter thats passed in here) so that the cache itself is observable
        // and we will react when it changes to a new object.
        getMutations: () => Mutation[],
        private getMutationCountCache: () => MutationCountCache,
        private getClinicalAttributeCache: () => ClinicalAttributeCache,
        private getGenomeNexusCache: () => GenomeNexusCache,
        private getGenomeNexusMutationAssessorCache: () => GenomeNexusMutationAssessorCache,
        private getDiscreteCNACache: () => DiscreteCNACache,
        public studyToMolecularProfileDiscrete: {
            [studyId: string]: MolecularProfile;
        },
        public studyIdToStudy: MobxPromise<{ [studyId: string]: CancerStudy }>,
        public queriedStudies: MobxPromise<CancerStudy[]>,
        public molecularProfileIdToMolecularProfile: MobxPromise<{
            [molecularProfileId: string]: MolecularProfile;
        }>,
        public clinicalDataForSamples: MobxPromise<ClinicalData[]>,
        public studiesForSamplesWithoutCancerTypeClinicalData: MobxPromise<
            CancerStudy[]
        >,
        public germlineConsentedSamples: MobxPromise<SampleIdentifier[]>,
        public indexedHotspotData: MobxPromise<IHotspotIndex | undefined>,
        public indexedVariantAnnotations: MobxPromise<
            { [genomicLocation: string]: VariantAnnotation } | undefined
        >,
        public uniqueSampleKeyToTumorType: {
            [uniqueSampleKey: string]: string;
        },
        public generateGenomeNexusHgvsgUrl: (hgvsg: string) => string,
        public clinicalDataGroupedBySampleMap: MobxPromise<{
            [sampleId: string]: ClinicalData[];
        }>,
        public mutationsTabClinicalAttributes: MobxPromise<ClinicalAttribute[]>,
        public clinicalAttributeIdToAvailableFrequency: MobxPromise<{
            [clinicalAttributeId: string]: number;
        }>,
        protected genomenexusClient?: GenomeNexusAPI,
        protected genomenexusInternalClient?: GenomeNexusAPIInternal,
        public getTranscriptId?: () => string
    ) {
        super(
            mutationMapperServerConfig,
            (() => {
                mutationMapperStoreConfig['filterAppliersOverride']![
                    MutationTableColumnType.GNOMAD
                ] = createNumericalFilter((d: Mutation) =>
                    GnomadColumnFormatter.getSortValue(
                        [d],
                        this.indexedMyVariantInfoAnnotations
                    )
                );
                mutationMapperStoreConfig['filterAppliersOverride']![
                    MutationTableColumnType.DBSNP
                ] = createCategoricalFilter((d: Mutation) =>
                    DbsnpColumnFormatter.download(
                        [d],
                        this.indexedMyVariantInfoAnnotations
                    )
                );
                return mutationMapperStoreConfig;
            })(),
            gene,
            getMutations,
            indexedHotspotData,
            indexedVariantAnnotations,
            oncoKbCancerGenes,
            uniqueSampleKeyToTumorType,
            genomenexusClient,
            genomenexusInternalClient
        );

        makeObservable(this);

        //labelMobxPromises(this);
    }

    protected getDownloadDataFetcher(): MutationTableDownloadDataFetcher {
        return new MutationTableDownloadDataFetcher(
            this.mutationData,
            this.mutationsTabClinicalAttributes,
            this.studyToMolecularProfileDiscrete,
            this.getGenomeNexusCache,
            this.getGenomeNexusMutationAssessorCache,
            this.getMutationCountCache,
            this.getClinicalAttributeCache,
            this.getDiscreteCNACache
        );
    }

    @computed get numericalFilterColumns() {
        const columnIds = new Set<string>([
            MutationTableColumnType.CLONAL,
            MutationTableColumnType.CANCER_CELL_FRACTION,
            MutationTableColumnType.EXPECTED_ALT_COPIES,
            MutationTableColumnType.TUMOR_ALLELE_FREQ,
            MutationTableColumnType.NORMAL_ALLELE_FREQ,
            MutationTableColumnType.REF_READS_N,
            MutationTableColumnType.VAR_READS_N,
            MutationTableColumnType.REF_READS,
            MutationTableColumnType.VAR_READS,
            MutationTableColumnType.START_POS,
            MutationTableColumnType.END_POS,
            MutationTableColumnType.NUM_MUTATIONS,
            MutationTableColumnType.EXON,
            MutationTableColumnType.GNOMAD,
        ]);

        this.mutationMapperStoreConfig['filterAppliersOverride']![
            MutationTableColumnType.NUM_MUTATIONS
        ] = createNumericalFilter((d: Mutation) =>
            MutationCountColumnFormatter.sortBy(
                [d],
                this.getMutationCountCache()
            )
        );
        this.mutationMapperStoreConfig['filterAppliersOverride']![
            MutationTableColumnType.EXON
        ] = createNumericalFilter((d: Mutation) =>
            ExonColumnFormatter.getSortValue([d], this.getGenomeNexusCache())
        );

        this.mutationsTabClinicalAttributes.result?.forEach(attribute => {
            if (
                attribute.datatype === 'NUMBER' ||
                attribute.clinicalAttributeId === 'SAMPLE_COUNT'
            ) {
                const columnId = attribute.displayName;
                columnIds.add(columnId);

                this.mutationMapperStoreConfig['filterAppliersOverride']![
                    columnId
                ] = createNumericalFilter((d: Mutation) => {
                    const val = ClinicalAttributeColumnFormatter.getTextValue(
                        [d],
                        attribute,
                        this.getClinicalAttributeCache()
                    );
                    return val ? +val : null;
                });
            }
        });

        // Add numerical namespace column definitions.
        _.forIn(
            this.namespaceColumnConfig,
            (namespaceColumnNames, namespaceName) => {
                _.forIn(namespaceColumnNames, (type, namespaceColumnName) => {
                    if (type === 'number') {
                        const columnName = createNamespaceColumnName(
                            namespaceName,
                            namespaceColumnName
                        );
                        columnIds.add(columnName);
                        this.mutationMapperStoreConfig[
                            'filterAppliersOverride'
                        ]![columnName] = createNumericalFilter((d: Mutation) =>
                            NumericNamespaceColumnFormatter.getData(
                                [d],
                                namespaceName,
                                namespaceColumnName
                            )
                        );
                    }
                });
            }
        );

        return columnIds;
    }

    @computed get categoricalFilterColumns() {
        const columnIds = new Set<string>([
            MutationTableColumnType.STUDY,
            MutationTableColumnType.SAMPLE_ID,
            MutationTableColumnType.GENE,
            MutationTableColumnType.PROTEIN_CHANGE,
            MutationTableColumnType.CHROMOSOME,
            MutationTableColumnType.REF_ALLELE,
            MutationTableColumnType.VAR_ALLELE,
            MutationTableColumnType.MUTATION_TYPE,
            MutationTableColumnType.VARIANT_TYPE,
            MutationTableColumnType.CENTER,
            MutationTableColumnType.HGVSG,
            MutationTableColumnType.COPY_NUM,
            MutationTableColumnType.ASCN_METHOD,
            MutationTableColumnType.CANCER_TYPE_DETAILED,
            MutationTableColumnType.CLINVAR,
            MutationTableColumnType.SIGNAL,
            MutationTableColumnType.HGVSC,
            MutationTableColumnType.DBSNP,
        ]);

        this.mutationMapperStoreConfig['filterAppliersOverride']![
            MutationTableColumnType.STUDY
        ] = createCategoricalFilter((d: Mutation) =>
            StudyColumnFormatter.getTextValue(
                [d],
                this.molecularProfileIdToMolecularProfile.result,
                this.studyIdToStudy.result
            )
        );
        this.mutationMapperStoreConfig['filterAppliersOverride']![
            MutationTableColumnType.COPY_NUM
        ] = createCategoricalFilter((d: Mutation) => {
            if (this.molecularProfileIdToMolecularProfile.result) {
                return DiscreteCNAColumnFormatter.getTextValue(
                    [d],
                    this.molecularProfileIdToMolecularProfile.result,
                    this.getDiscreteCNACache()
                );
            } else {
                return '';
            }
        });
        this.mutationMapperStoreConfig['filterAppliersOverride']![
            MutationTableColumnType.CANCER_TYPE_DETAILED
        ] = createCategoricalFilter((d: Mutation) =>
            CancerTypeColumnFormatter.download(
                [d],
                this.uniqueSampleKeyToTumorType
            )
        );
        this.mutationMapperStoreConfig['filterAppliersOverride']![
            MutationTableColumnType.HGVSC
        ] = createCategoricalFilter((d: Mutation) =>
            HgvscColumnFormatter.download(
                [d],
                this.indexedVariantAnnotations,
                this.activeTranscript.result
            )
        );

        this.mutationsTabClinicalAttributes.result?.forEach(attribute => {
            if (
                attribute.datatype === 'STRING' &&
                attribute.clinicalAttributeId !== 'SAMPLE_COUNT'
            ) {
                const columnId = attribute.displayName;
                columnIds.add(columnId);

                this.mutationMapperStoreConfig['filterAppliersOverride']![
                    columnId
                ] = createCategoricalFilter((d: Mutation) =>
                    ClinicalAttributeColumnFormatter.getTextValue(
                        [d],
                        attribute,
                        this.getClinicalAttributeCache()
                    )
                );
            }
        });

        // Add categorical namespace column definitions.
        _.forIn(
            this.namespaceColumnConfig,
            (namespaceColumnNames, namespaceName) => {
                _.forIn(namespaceColumnNames, (type, namespaceColumnName) => {
                    if (type !== 'number') {
                        const columnName = createNamespaceColumnName(
                            namespaceName,
                            namespaceColumnName
                        );
                        columnIds.add(columnName);
                        this.mutationMapperStoreConfig[
                            'filterAppliersOverride'
                        ]![
                            columnName
                        ] = createCategoricalFilter((d: Mutation) =>
                            CategoricalNamespaceColumnFormatter.download(
                                [d],
                                namespaceName,
                                namespaceColumnName
                            )
                        );
                    }
                });
            }
        );

        return columnIds;
    }
}
