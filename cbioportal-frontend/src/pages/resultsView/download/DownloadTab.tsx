import * as React from 'react';
import _ from 'lodash';
import { action, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import fileDownload from 'react-file-download';
import {
    ResultsViewPageStore,
    ModifyQueryParams,
} from '../ResultsViewPageStore';
import { AlterationTypeConstants } from 'shared/constants';
import {
    getSingleGeneResultKey,
    getMultipleGeneResultKey,
} from '../ResultsViewPageStoreUtils';
import {
    OQLLineFilterOutput,
    MergedTrackLineFilterOutput,
} from 'shared/lib/oql/oqlfilter';
import FeatureTitle from 'shared/components/featureTitle/FeatureTitle';
import { SimpleCopyDownloadControls } from 'shared/components/copyDownloadControls/SimpleCopyDownloadControls';
import {
    default as GeneAlterationTable,
    IGeneAlteration,
} from './GeneAlterationTable';
import {
    default as CaseAlterationTable,
    ICaseAlteration,
} from './CaseAlterationTable';
import {
    generateCaseAlterationData,
    generateCnaData,
    generateDownloadData,
    generateGeneAlterationData,
    generateMrnaData,
    generateMutationData,
    generateMutationDownloadData,
    generateProteinData,
    hasValidData,
    hasValidStructuralVariantData,
    hasValidMutationData,
    stringify2DArray,
    generateGenericAssayProfileData,
    generateGenericAssayProfileDownloadData,
    generateStructuralVariantData,
    generateStructuralDownloadData,
    makeIsSampleProfiledFunction,
    downloadOtherMolecularProfileData,
    downloadDataText,
    unzipDownloadData,
    downloadDataTextGroupByKey,
    unzipDownloadDataGroupByKey,
} from './DownloadUtils';

import styles from './styles.module.scss';
import classNames from 'classnames';
import OqlStatusBanner from '../../../shared/components/banners/OqlStatusBanner';
import { WindowWidthBox } from '../../../shared/components/WindowWidthBox/WindowWidthBox';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    DownloadControlOption,
    onMobxPromise,
} from 'cbioportal-frontend-commons';
import {
    MolecularProfile,
    Sample,
    GenericAssayData,
} from 'cbioportal-ts-api-client';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import AlterationFilterWarning from '../../../shared/components/banners/AlterationFilterWarning';
import { CUSTOM_CASE_LIST_ID } from 'shared/components/query/QueryStore';
import { IVirtualStudyProps } from 'pages/studyView/virtualStudy/VirtualStudy';
import { Alteration } from 'shared/lib/oql/oql-parser';
import autobind from 'autobind-decorator';
import FontAwesome from 'react-fontawesome';
import CaseFilterWarning from '../../../shared/components/banners/CaseFilterWarning';
import { If, Then, Else } from 'react-if';
import { ResultsViewTab } from '../ResultsViewPageHelpers';
import { CaseAggregatedData } from 'shared/model/CaseAggregatedData';
import { AnnotatedExtendedAlteration } from 'shared/model/AnnotatedExtendedAlteration';
import { ExtendedAlteration } from 'shared/model/ExtendedAlteration';
import { computed } from 'mobx';
import { getServerConfig } from 'config/config';

export interface IDownloadTabProps {
    store: ResultsViewPageStore;
}

@observer
export default class DownloadTab extends React.Component<
    IDownloadTabProps,
    {}
> {
    constructor(props: IDownloadTabProps) {
        super(props);

        makeObservable(this);

        this.handleMutationDownload = this.handleMutationDownload.bind(this);
        this.handleTransposedMutationDownload = this.handleTransposedMutationDownload.bind(
            this
        );
        this.handleCnaDownload = this.handleCnaDownload.bind(this);
        this.handleTransposedCnaDownload = this.handleTransposedCnaDownload.bind(
            this
        );
        this.handleMrnaDownload = this.handleMrnaDownload.bind(this);
        this.handleTransposedMrnaDownload = this.handleTransposedMrnaDownload.bind(
            this
        );
        this.handleProteinDownload = this.handleProteinDownload.bind(this);
        this.handleTransposedProteinDownload = this.handleTransposedProteinDownload.bind(
            this
        );
    }

    readonly geneAlterationData = remoteData<IGeneAlteration[]>({
        await: () => [
            this.props.store.oqlFilteredCaseAggregatedDataByOQLLine,
            this.props.store.filteredSequencedSampleKeysByGene,
        ],
        invoke: () =>
            Promise.resolve(
                generateGeneAlterationData(
                    this.props.store.oqlFilteredCaseAggregatedDataByOQLLine
                        .result!,
                    this.props.store.filteredSequencedSampleKeysByGene.result!
                )
            ),
    });

    readonly geneAlterationDataByGene = remoteData<{
        [gene: string]: IGeneAlteration;
    }>({
        await: () => [this.geneAlterationData],
        invoke: () =>
            Promise.resolve(_.keyBy(this.geneAlterationData.result!, 'gene')),
    });

    readonly caseAlterationData = remoteData<ICaseAlteration[]>({
        await: () => [
            this.props.store.selectedMolecularProfiles,
            this.props.store.oqlFilteredCaseAggregatedDataByOQLLine,
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
            this.props.store.coverageInformation,
            this.props.store.filteredSamples,
            this.geneAlterationDataByGene,
            this.props.store.molecularProfileIdToMolecularProfile,
            this.props.store.defaultOQLQueryAlterations,
        ],
        invoke: () =>
            Promise.resolve(
                generateCaseAlterationData(
                    this.props.store.oqlText,
                    this.props.store.defaultOQLQueryAlterations.result!,
                    this.props.store.selectedMolecularProfiles.result!,
                    this.props.store.oqlFilteredCaseAggregatedDataByOQLLine
                        .result!,
                    this.props.store
                        .oqlFilteredCaseAggregatedDataByUnflattenedOQLLine
                        .result!,
                    this.props.store.coverageInformation.result!,
                    this.props.store.filteredSamples.result!,
                    this.geneAlterationDataByGene.result!,
                    this.props.store.molecularProfileIdToMolecularProfile
                        .result!
                )
            ),
    });

    readonly mutationData = remoteData<{ [key: string]: ExtendedAlteration[] }>(
        {
            await: () => [this.props.store.nonOqlFilteredCaseAggregatedData],
            invoke: () => {
                return Promise.resolve(
                    generateMutationData(
                        this.props.store.nonOqlFilteredCaseAggregatedData
                            .result!
                    )
                );
            },
        }
    );

    readonly mutationDownloadData = remoteData<string[][]>({
        await: () => [
            this.mutationData,
            this.props.store.samples,
            this.props.store.genes,
            this.props.store.coverageInformation,
            this.props.store.studyToSelectedMolecularProfilesMap,
        ],
        invoke: () =>
            Promise.resolve(
                generateMutationDownloadData(
                    this.mutationData.result!,
                    this.props.store.samples.result!,
                    this.props.store.genes.result!,
                    makeIsSampleProfiledFunction(
                        AlterationTypeConstants.MUTATION_EXTENDED,
                        this.props.store.studyToSelectedMolecularProfilesMap
                            .result!,
                        this.props.store.coverageInformation.result!
                    )
                )
            ),
    });

    readonly genericAssayProfileDownloadDataGroupByProfileIdSuffix = remoteData<{
        [key: string]: string[][];
    }>({
        await: () => [
            this.props.store.samples,
            this.props.store.genericAssayEntityStableIdsGroupByProfileIdSuffix,
            this.props.store.genericAssayDataGroupByProfileIdSuffix,
            this.props.store.genericAssayProfilesGroupByProfileIdSuffix,
            this.props.store.genericAssayStableIdToMeta,
        ],
        invoke: () => {
            const genericAssayProfileDataGroupByProfileIdSuffix = _.mapValues(
                this.props.store.genericAssayDataGroupByProfileIdSuffix.result,
                (genericAssayProfileData, profileIdSuffix) => {
                    const data = {
                        samples: _.groupBy(
                            genericAssayProfileData,
                            data => data.uniqueSampleKey
                        ),
                    } as CaseAggregatedData<GenericAssayData>;
                    return generateGenericAssayProfileData(
                        this.props.store.genericAssayProfilesGroupByProfileIdSuffix.result![
                            profileIdSuffix
                        ].map(profile => profile.molecularProfileId),
                        data
                    );
                }
            );

            return Promise.resolve(
                _.mapValues(
                    genericAssayProfileDataGroupByProfileIdSuffix,
                    (genericAssayProfileData, profileIdSuffix) => {
                        return generateGenericAssayProfileDownloadData(
                            genericAssayProfileData,
                            this.props.store.samples.result!,
                            this.props.store
                                .genericAssayEntityStableIdsGroupByProfileIdSuffix
                                .result![profileIdSuffix],
                            this.props.store.genericAssayStableIdToMeta.result!,
                            this.props.store
                                .genericAssayProfilesGroupByProfileIdSuffix
                                .result![profileIdSuffix]
                        );
                    }
                )
            );
        },
    });

    readonly mrnaData = remoteData<{ [key: string]: ExtendedAlteration[] }>({
        await: () => [this.props.store.nonOqlFilteredCaseAggregatedData],
        invoke: () =>
            Promise.resolve(
                generateMrnaData(
                    this.props.store.nonOqlFilteredCaseAggregatedData.result!
                )
            ),
    });

    readonly mrnaDownloadData = remoteData<string[][]>({
        await: () => [
            this.mrnaData,
            this.props.store.samples,
            this.props.store.genes,
            this.props.store.coverageInformation,
            this.props.store.studyToSelectedMolecularProfilesMap,
        ],
        invoke: () =>
            Promise.resolve(
                generateDownloadData(
                    this.mrnaData.result!,
                    this.props.store.samples.result!,
                    this.props.store.genes.result!,
                    makeIsSampleProfiledFunction(
                        AlterationTypeConstants.MRNA_EXPRESSION,
                        this.props.store.studyToSelectedMolecularProfilesMap
                            .result!,
                        this.props.store.coverageInformation.result!
                    )
                )
            ),
    });

    readonly proteinData = remoteData<{ [key: string]: ExtendedAlteration[] }>({
        await: () => [this.props.store.nonOqlFilteredCaseAggregatedData],
        invoke: () =>
            Promise.resolve(
                generateProteinData(
                    this.props.store.nonOqlFilteredCaseAggregatedData.result!
                )
            ),
    });

    readonly proteinDownloadData = remoteData<string[][]>({
        await: () => [
            this.proteinData,
            this.props.store.samples,
            this.props.store.genes,
            this.props.store.coverageInformation,
            this.props.store.studyToSelectedMolecularProfilesMap,
        ],
        invoke: () =>
            Promise.resolve(
                generateDownloadData(
                    this.proteinData.result!,
                    this.props.store.samples.result!,
                    this.props.store.genes.result!,
                    makeIsSampleProfiledFunction(
                        AlterationTypeConstants.PROTEIN_LEVEL,
                        this.props.store.studyToSelectedMolecularProfilesMap
                            .result!,
                        this.props.store.coverageInformation.result!
                    )
                )
            ),
    });

    readonly cnaData = remoteData<{ [key: string]: ExtendedAlteration[] }>({
        await: () => [this.props.store.nonOqlFilteredCaseAggregatedData],
        invoke: () =>
            Promise.resolve(
                generateCnaData(
                    this.props.store.nonOqlFilteredCaseAggregatedData.result!
                )
            ),
    });

    readonly cnaDownloadData = remoteData<string[][]>({
        await: () => [
            this.cnaData,
            this.props.store.samples,
            this.props.store.genes,
            this.props.store.coverageInformation,
            this.props.store.studyToSelectedMolecularProfilesMap,
        ],
        invoke: () =>
            Promise.resolve(
                generateDownloadData(
                    this.cnaData.result!,
                    this.props.store.samples.result!,
                    this.props.store.genes.result!,
                    makeIsSampleProfiledFunction(
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                        this.props.store.studyToSelectedMolecularProfilesMap
                            .result!,
                        this.props.store.coverageInformation.result!
                    )
                )
            ),
    });

    readonly structuralVariantData = remoteData<{
        [key: string]: ExtendedAlteration[];
    }>({
        await: () => [this.props.store.nonOqlFilteredCaseAggregatedData],
        invoke: () =>
            Promise.resolve(
                generateStructuralVariantData(
                    this.props.store.nonOqlFilteredCaseAggregatedData.result!
                )
            ),
    });

    readonly structuralVariantDownloadData = remoteData<string[][]>({
        await: () => [
            this.structuralVariantData,
            this.props.store.samples,
            this.props.store.genes,
            this.props.store.coverageInformation,
            this.props.store.studyToSelectedMolecularProfilesMap,
        ],
        invoke: () =>
            Promise.resolve(
                generateStructuralDownloadData(
                    this.structuralVariantData.result!,
                    this.props.store.samples.result!,
                    this.props.store.genes.result!,
                    makeIsSampleProfiledFunction(
                        AlterationTypeConstants.STRUCTURAL_VARIANT,
                        this.props.store.studyToSelectedMolecularProfilesMap
                            .result!,
                        this.props.store.coverageInformation.result!
                    )
                )
            ),
    });

    readonly alteredCaseAlterationData = remoteData<ICaseAlteration[]>({
        await: () => [this.caseAlterationData],
        invoke: () =>
            Promise.resolve(
                this.caseAlterationData.result!.filter(
                    caseAlteration => caseAlteration.altered
                )
            ),
    });

    readonly unalteredCaseAlterationData = remoteData<ICaseAlteration[]>({
        await: () => [this.caseAlterationData],
        invoke: () =>
            Promise.resolve(
                this.caseAlterationData.result!.filter(
                    caseAlteration => !caseAlteration.altered
                )
            ),
    });

    readonly sampleMatrix = remoteData<string[][]>({
        await: () => [this.caseAlterationData],
        invoke: () => {
            let result: string[][] = [];
            _.map(this.caseAlterationData.result!, caseAlteration => {
                // if writing the first line, add titles
                if (_.isEmpty(result)) {
                    const titleMap = _.keys(caseAlteration.oqlDataByGene);
                    result.push(['studyID:sampleId', 'Altered', ...titleMap]);
                }
                // get altered infomation by gene
                const genesAlteredData = _.map(
                    caseAlteration.oqlDataByGene,
                    oqlData => {
                        return _.isEmpty(oqlData.alterationTypes) ? '0' : '1';
                    }
                );
                result.push([
                    `${caseAlteration.studyId}:${caseAlteration.sampleId}`,
                    caseAlteration.altered ? '1' : '0',
                    ...genesAlteredData,
                ]);
            });
            return Promise.resolve(result);
        },
    });

    readonly sampleMatrixText = remoteData<string>({
        await: () => [this.sampleMatrix],
        invoke: () =>
            Promise.resolve(stringify2DArray(this.sampleMatrix.result!)),
    });

    readonly oqls = remoteData<
        OQLLineFilterOutput<AnnotatedExtendedAlteration>[]
    >({
        await: () => [this.props.store.oqlFilteredCaseAggregatedDataByOQLLine],
        invoke: () =>
            Promise.resolve(
                this.props.store.oqlFilteredCaseAggregatedDataByOQLLine.result!.map(
                    data => data.oql
                )
            ),
    });

    readonly trackLabels = remoteData({
        await: () => [
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
            this.props.store.defaultOQLQueryAlterations,
        ],
        invoke: () => {
            const labels: string[] = [];
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach(
                (data, index) => {
                    // mergedTrackOqlList is undefined means the data is for single track / oql
                    if (data.mergedTrackOqlList === undefined) {
                        labels.push(
                            getSingleGeneResultKey(
                                index,
                                this.props.store.oqlText,
                                data.oql as OQLLineFilterOutput<
                                    AnnotatedExtendedAlteration
                                >,
                                this.props.store.defaultOQLQueryAlterations
                                    .result!
                            )
                        );
                    }
                    // or data is for merged track (group: list of oqls)
                    else {
                        labels.push(
                            getMultipleGeneResultKey(
                                data.oql as MergedTrackLineFilterOutput<
                                    AnnotatedExtendedAlteration
                                >
                            )
                        );
                    }
                }
            );
            return Promise.resolve(labels);
        },
    });

    readonly trackAlterationTypesMap = remoteData({
        await: () => [
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
            this.props.store.defaultOQLQueryAlterations,
        ],
        invoke: () => {
            const trackAlterationTypesMap: { [label: string]: string[] } = {};
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach(
                (data, index) => {
                    // mergedTrackOqlList is undefined means the data is for single track / oql
                    if (data.mergedTrackOqlList === undefined) {
                        const singleTrackOql = data.oql as OQLLineFilterOutput<
                            AnnotatedExtendedAlteration
                        >;
                        const label = getSingleGeneResultKey(
                            index,
                            this.props.store.oqlText,
                            data.oql as OQLLineFilterOutput<
                                AnnotatedExtendedAlteration
                            >,
                            this.props.store.defaultOQLQueryAlterations.result!
                        );
                        // put types for single track into the map, key is track label
                        if (singleTrackOql.parsed_oql_line.alterations) {
                            trackAlterationTypesMap[label] = _.uniq(
                                _.map(
                                    singleTrackOql.parsed_oql_line.alterations,
                                    alteration =>
                                        alteration.alteration_type.toUpperCase()
                                )
                            );
                        }
                    }
                    // or data is for merged track (group: list of oqls)
                    else {
                        const mergedTrackOql = data.oql as MergedTrackLineFilterOutput<
                            AnnotatedExtendedAlteration
                        >;
                        const label = getMultipleGeneResultKey(
                            data.oql as MergedTrackLineFilterOutput<
                                AnnotatedExtendedAlteration
                            >
                        );
                        // put types for merged track into the map, key is track label
                        let alterations: string[] = [];
                        _.forEach(
                            mergedTrackOql.list,
                            (
                                oql: OQLLineFilterOutput<
                                    AnnotatedExtendedAlteration
                                >
                            ) => {
                                if (oql.parsed_oql_line.alterations) {
                                    const types: string[] = _.map(
                                        oql.parsed_oql_line.alterations,
                                        alteration =>
                                            alteration.alteration_type.toUpperCase()
                                    );
                                    alterations.push(...types);
                                }
                            }
                        );
                        trackAlterationTypesMap[label] = _.uniq(alterations);
                    }
                }
            );
            return Promise.resolve(trackAlterationTypesMap);
        },
    });

    readonly geneAlterationMap = remoteData({
        await: () => [
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
        ],
        invoke: () => {
            const geneAlterationMap: { [label: string]: Alteration[] } = {};
            this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach(
                (data, index) => {
                    // mergedTrackOqlList is undefined means the data is for single track / oql
                    if (data.mergedTrackOqlList === undefined) {
                        const singleTrackOql = data.oql as OQLLineFilterOutput<
                            AnnotatedExtendedAlteration
                        >;
                        // put types for single track into the map, key is gene name
                        if (singleTrackOql.parsed_oql_line.alterations) {
                            geneAlterationMap[singleTrackOql.gene] = _.chain(
                                singleTrackOql.parsed_oql_line.alterations
                            )
                                .union(geneAlterationMap[singleTrackOql.gene])
                                .uniq()
                                .value();
                        }
                    }
                    // or data is for merged track (group: list of oqls)
                    else {
                        const mergedTrackOql = data.oql as MergedTrackLineFilterOutput<
                            AnnotatedExtendedAlteration
                        >;
                        // put types for merged track into the map, key is gene name
                        let alterations: string[] = [];
                        _.forEach(
                            mergedTrackOql.list,
                            (
                                oql: OQLLineFilterOutput<
                                    AnnotatedExtendedAlteration
                                >
                            ) => {
                                if (oql.parsed_oql_line.alterations) {
                                    const types: string[] = _.map(
                                        oql.parsed_oql_line.alterations,
                                        alteration => alteration.alteration_type
                                    );
                                    geneAlterationMap[oql.gene] = _.chain(
                                        oql.parsed_oql_line.alterations
                                    )
                                        .union(geneAlterationMap[oql.gene])
                                        .uniq()
                                        .value();
                                }
                            }
                        );
                    }
                }
            );
            return Promise.resolve(geneAlterationMap);
        },
    });

    @computed get showDownload() {
        return (
            getServerConfig().skin_hide_download_controls ===
            DownloadControlOption.SHOW_ALL
        );
    }

    public render() {
        const status = getRemoteDataGroupStatus(
            this.geneAlterationData,
            this.caseAlterationData,
            this.oqls,
            this.trackLabels,
            this.trackAlterationTypesMap,
            this.geneAlterationMap,
            this.cnaData,
            this.mutationData,
            this.structuralVariantData,
            this.mrnaData,
            this.proteinData,
            this.unalteredCaseAlterationData,
            this.alteredCaseAlterationData,
            this.props.store.virtualStudyParams,
            this.sampleMatrixText,
            this.props.store
                .nonSelectedDownloadableMolecularProfilesGroupByName,
            this.props.store.studies,
            this.props.store.selectedMolecularProfiles,
            this.props.store.genericAssayDataGroupByProfileIdSuffix
        );

        switch (status) {
            case 'pending':
                return (
                    <LoadingIndicator
                        isLoading={true}
                        center={true}
                        size={'big'}
                    />
                );
            case 'error':
                return <ErrorMessage />;
            case 'complete':
                return (
                    <WindowWidthBox data-test="downloadTabDiv" offset={60}>
                        <div className={'tabMessageContainer'}>
                            <OqlStatusBanner
                                className="download-oql-status-banner"
                                queryContainsOql={
                                    this.props.store.queryContainsOql
                                }
                                tabReflectsOql={true}
                            />
                            <AlterationFilterWarning
                                driverAnnotationSettings={
                                    this.props.store.driverAnnotationSettings
                                }
                                includeGermlineMutations={
                                    this.props.store.includeGermlineMutations
                                }
                                mutationsReportByGene={
                                    this.props.store.mutationsReportByGene
                                }
                                oqlFilteredMutationsReport={
                                    this.props.store.oqlFilteredMutationsReport
                                }
                                oqlFilteredMolecularDataReport={
                                    this.props.store
                                        .oqlFilteredMolecularDataReport
                                }
                                oqlFilteredStructuralVariantsReport={
                                    this.props.store
                                        .oqlFilteredStructuralVariantsReport
                                }
                            />
                            <CaseFilterWarning
                                samples={this.props.store.samples}
                                filteredSamples={
                                    this.props.store.filteredSamples
                                }
                                patients={this.props.store.patients}
                                filteredPatients={
                                    this.props.store.filteredPatients
                                }
                                hideUnprofiledSamples={
                                    this.props.store.hideUnprofiledSamples
                                }
                            />
                        </div>
                        <div>
                            <FeatureTitle
                                title="Downloadable Data Files"
                                className="forceHeaderStyle h4"
                                isLoading={false}
                                style={{ marginBottom: 15 }}
                            />
                            <table
                                className={classNames(
                                    'table',
                                    'table-striped',
                                    styles.downloadCopyTable
                                )}
                            >
                                <tbody>
                                    {hasValidData(this.cnaData.result!) &&
                                        this.showDownload &&
                                        this.cnaDownloadControls()}
                                    {hasValidMutationData(
                                        this.mutationData.result!
                                    ) &&
                                        this.showDownload &&
                                        this.mutationDownloadControls()}
                                    {hasValidStructuralVariantData(
                                        this.structuralVariantData.result!
                                    ) &&
                                        this.showDownload &&
                                        this.structuralVariantDownloadControls()}
                                    {hasValidData(this.mrnaData.result!) &&
                                        this.showDownload &&
                                        this.mrnaExprDownloadControls(
                                            this.props.store.selectedMolecularProfiles.result!.find(
                                                profile =>
                                                    profile.molecularAlterationType ===
                                                    AlterationTypeConstants.MRNA_EXPRESSION
                                            )!.name
                                        )}
                                    {hasValidData(this.proteinData.result!) &&
                                        this.showDownload &&
                                        this.proteinExprDownloadControls(
                                            this.props.store.selectedMolecularProfiles.result!.find(
                                                profile =>
                                                    profile.molecularAlterationType ===
                                                    AlterationTypeConstants.PROTEIN_LEVEL
                                            )!.name
                                        )}
                                    {this.alteredSamplesDownloadControls(
                                        this.alteredCaseAlterationData.result!,
                                        this.props.store.virtualStudyParams
                                            .result!
                                    )}
                                    {this.unalteredSamplesDownloadControls(
                                        this.unalteredCaseAlterationData
                                            .result!,
                                        this.props.store.virtualStudyParams
                                            .result!
                                    )}
                                    {this.sampleMatrixDownloadControls(
                                        this.sampleMatrixText.result!
                                    )}
                                    {this.props.store
                                        .doNonSelectedDownloadableMolecularProfilesExist &&
                                        this.showDownload &&
                                        this.nonSelectedProfileDownloadRow(
                                            this.props.store
                                                .nonSelectedDownloadableMolecularProfilesGroupByName
                                                .result!
                                        )}
                                    {/* Generic Assay Download only available for single study */}
                                    {this.props.store.studies.result!.length ===
                                        1 &&
                                        !_.isEmpty(
                                            this.props.store
                                                .genericAssayProfilesGroupByProfileIdSuffix
                                                .result
                                        ) &&
                                        this.showDownload &&
                                        this.genericAssayProfileDownloadRows(
                                            this.props.store
                                                .genericAssayProfilesGroupByProfileIdSuffix
                                                .result!,
                                            _.keys(
                                                this.props.store
                                                    .genericAssayDataGroupByProfileIdSuffix
                                                    .result
                                            )
                                        )}
                                </tbody>
                            </table>
                        </div>
                        <hr />
                        <div
                            className={styles['tables-container']}
                            data-test="dataDownloadGeneAlterationTable"
                        >
                            <FeatureTitle
                                title="Gene Alteration Frequency"
                                isLoading={false}
                                className="pull-left forceHeaderStyle h4"
                            />
                            <GeneAlterationTable
                                geneAlterationData={
                                    this.geneAlterationData.result!
                                }
                            />
                        </div>
                        <hr />
                        <div className={styles['tables-container']}>
                            <FeatureTitle
                                title="Type of Genetic Alterations Across All Samples"
                                isLoading={false}
                                className="pull-left forceHeaderStyle h4"
                            />
                            <CaseAlterationTable
                                caseAlterationData={
                                    this.caseAlterationData.result!
                                }
                                oqls={this.oqls.result!}
                                trackLabels={this.trackLabels.result!}
                                trackAlterationTypesMap={
                                    this.trackAlterationTypesMap.result!
                                }
                                geneAlterationTypesMap={
                                    this.geneAlterationMap.result!
                                }
                            />
                        </div>
                    </WindowWidthBox>
                );
            default:
                return <ErrorMessage />;
        }
    }

    private cnaDownloadControls(): JSX.Element {
        return this.downloadControlsRow(
            'Copy-number Alterations (OQL is not in effect)',
            this.handleCnaDownload,
            this.handleTransposedCnaDownload
        );
    }

    private mutationDownloadControls(): JSX.Element {
        return this.downloadControlsRow(
            'Mutations (OQL is not in effect)',
            this.handleMutationDownload,
            this.handleTransposedMutationDownload
        );
    }

    private structuralVariantDownloadControls(): JSX.Element {
        return this.downloadControlsRow(
            'Structural Variants (OQL is not in effect)',
            this.handleStructuralVariantDownload,
            this.handleTransposedStructuralVariantDownload
        );
    }

    private mrnaExprDownloadControls(profileName: string): JSX.Element {
        return this.downloadControlsRow(
            profileName,
            this.handleMrnaDownload,
            this.handleTransposedMrnaDownload
        );
    }

    private proteinExprDownloadControls(profileName: string): JSX.Element {
        return this.downloadControlsRow(
            profileName,
            this.handleProteinDownload,
            this.handleTransposedProteinDownload
        );
    }

    private downloadControlsRow(
        profileName: string,
        handleTabDelimitedDownload: (name: string) => void,
        handleTransposedMatrixDownload: (name: string) => void
    ) {
        return (
            <tr>
                <td style={{ width: 500 }}>{profileName}</td>
                <td>
                    <a
                        onClick={event =>
                            handleTabDelimitedDownload(profileName)
                        }
                    >
                        <i
                            className="fa fa-cloud-download"
                            style={{ marginRight: 5 }}
                        />
                        Tab Delimited Format
                    </a>
                    <span style={{ margin: '0px 10px' }}>|</span>
                    <a
                        onClick={event =>
                            handleTransposedMatrixDownload(profileName)
                        }
                    >
                        <i
                            className="fa fa-cloud-download"
                            style={{ marginRight: 5 }}
                        />
                        Transposed Matrix
                    </a>
                </td>
            </tr>
        );
    }

    private nonSelectedProfileDownloadRow(
        nonSelectedDownloadableMolecularProfilesGroupByName: _.Dictionary<
            MolecularProfile[]
        >
    ) {
        const allProfileOptions = _.map(
            nonSelectedDownloadableMolecularProfilesGroupByName,
            (profiles: MolecularProfile[], profileName: string) => {
                if (this.props.store.studies.result!.length === 1) {
                    const singleStudyProfile = profiles[0];
                    return {
                        name: profileName,
                        description: singleStudyProfile.description,
                    };
                }
                return { name: profileName };
            }
        );

        return _.map(allProfileOptions, option => (
            <tr>
                <td style={{ width: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {option.name}
                        {option.description && (
                            <DefaultTooltip
                                mouseEnterDelay={0}
                                placement="right"
                                overlay={
                                    <div className={styles.tooltip}>
                                        {option.description}
                                    </div>
                                }
                            >
                                <FontAwesome
                                    className={styles.infoIcon}
                                    name="info-circle"
                                />
                            </DefaultTooltip>
                        )}
                    </div>
                </td>
                <td>
                    <div>
                        <a
                            onClick={() =>
                                this.handleNonSelectedMolecularProfileDownload(
                                    option.name
                                )
                            }
                        >
                            <i
                                className="fa fa-cloud-download"
                                style={{ marginRight: 5 }}
                            />
                            Tab Delimited Format
                        </a>
                        <span style={{ margin: '0px 10px' }}>|</span>
                        <a
                            onClick={() =>
                                this.handleTransposedNonSelectedMolecularProfileDownload(
                                    option.name
                                )
                            }
                        >
                            <i
                                className="fa fa-cloud-download"
                                style={{ marginRight: 5 }}
                            />
                            Transposed Matrix
                        </a>
                    </div>
                </td>
            </tr>
        ));
    }

    private genericAssayProfileDownloadRows(
        genericAssayProfilesGroupByProfileIdSuffix: _.Dictionary<
            MolecularProfile[]
        >,
        selectedSuffix: string[]
    ) {
        const allProfileOptions = _.map(
            genericAssayProfilesGroupByProfileIdSuffix,
            (profiles: MolecularProfile[], profileIdSuffix: string) => {
                // we are using genericAssayProfilesGroupByProfileIdSuffix
                // each group has at least one profile
                const profile = profiles[0];
                return {
                    name: profile.name,
                    description: profile.description,
                    profileIdSuffix: profileIdSuffix,
                };
            }
        );

        return _.map(allProfileOptions, option => (
            <tr>
                <td style={{ width: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {option.name}
                        {option.description && (
                            <DefaultTooltip
                                mouseEnterDelay={0}
                                placement="right"
                                overlay={
                                    <div className={styles.tooltip}>
                                        {option.description}
                                    </div>
                                }
                            >
                                <FontAwesome
                                    className={styles.infoIcon}
                                    name="info-circle"
                                />
                            </DefaultTooltip>
                        )}
                    </div>
                </td>
                <td>
                    <div>
                        <If
                            condition={selectedSuffix.includes(
                                option.profileIdSuffix
                            )}
                        >
                            <Then>
                                <a
                                    onClick={() =>
                                        this.handleGenericAssayProfileDownload(
                                            option.name,
                                            option.profileIdSuffix
                                        )
                                    }
                                >
                                    <i
                                        className="fa fa-cloud-download"
                                        style={{ marginRight: 5 }}
                                    />
                                    Tab Delimited Format
                                </a>
                                <span style={{ margin: '0px 10px' }}>|</span>
                                <a
                                    onClick={() =>
                                        this.handleTransposedGenericAssayProfileDownload(
                                            option.name,
                                            option.profileIdSuffix
                                        )
                                    }
                                >
                                    <i
                                        className="fa fa-cloud-download"
                                        style={{ marginRight: 5 }}
                                    />
                                    Transposed Matrix
                                </a>
                            </Then>
                            <Else>
                                Tracks added in the&nbsp;
                                <a
                                    onClick={() =>
                                        this.props.store.handleTabChange(
                                            ResultsViewTab.ONCOPRINT
                                        )
                                    }
                                >
                                    OncoPrint tab
                                </a>
                                &nbsp;can be downloaded here.
                            </Else>
                        </If>
                    </div>
                </td>
            </tr>
        ));
    }

    private copyDownloadControlsRow(
        title: string,
        handleDownload: () => string,
        filename: string
    ) {
        return (
            <tr>
                <td>{title}</td>
                <td>
                    <SimpleCopyDownloadControls
                        controlsStyle="LINK"
                        downloadData={handleDownload}
                        downloadFilename={filename}
                    />
                </td>
            </tr>
        );
    }

    private copyDownloadQueryControlsRow(
        title: string,
        handleDownload: () => string,
        filename: string,
        handleQuery: () => void,
        virtualStudyParams: any
    ) {
        return (
            <tr>
                <td>{title}</td>
                <td>
                    <SimpleCopyDownloadControls
                        controlsStyle="QUERY"
                        downloadData={handleDownload}
                        downloadFilename={filename}
                        handleQuery={handleQuery}
                        virtualStudyParams={virtualStudyParams}
                    />
                </td>
            </tr>
        );
    }

    private alteredSamplesDownloadControls(
        alteredCaseAlterationData: ICaseAlteration[],
        virtualStudyParams: IVirtualStudyProps
    ) {
        const alteredSampleCaseIds = _.map(
            alteredCaseAlterationData,
            caseAlteration =>
                `${caseAlteration.studyId}:${caseAlteration.sampleId}`
        );
        const alteredSampleCaseIdsSet = new Set(alteredSampleCaseIds);
        const handleDownload = () => alteredSampleCaseIds.join('\n');
        const handleQuery = () =>
            this.handleQueryButtonClick(alteredSampleCaseIds);

        let description = `${alteredSampleCaseIds.length} altered samples from:\n\n`;
        virtualStudyParams.studyWithSamples.forEach(s => {
            description += s.name + '\n';
        });

        const alteredSamplesVirtualStudyParams = {
            user: virtualStudyParams.user,
            name: virtualStudyParams.name,
            description: description,
            studyWithSamples: virtualStudyParams.studyWithSamples,
            selectedSamples: _.filter(
                virtualStudyParams.selectedSamples,
                (sample: Sample) =>
                    alteredSampleCaseIdsSet.has(
                        `${sample.studyId}:${sample.sampleId}`
                    )
            ),
            filter: virtualStudyParams.filter,
            attributesMetaSet: virtualStudyParams.attributesMetaSet,
        } as IVirtualStudyProps;

        return this.copyDownloadQueryControlsRow(
            'Altered samples',
            handleDownload,
            'altered_samples.txt',
            handleQuery,
            alteredSamplesVirtualStudyParams
        );
    }

    private unalteredSamplesDownloadControls(
        unalteredCaseAlterationData: ICaseAlteration[],
        virtualStudyParams: IVirtualStudyProps
    ) {
        const unalteredSampleCaseIds = _.map(
            unalteredCaseAlterationData,
            caseAlteration =>
                `${caseAlteration.studyId}:${caseAlteration.sampleId}`
        );
        const unalteredSampleCaseIdsSet = new Set(unalteredSampleCaseIds);

        let description = `${unalteredSampleCaseIds.length} unaltered samples from:\n\n`;
        virtualStudyParams.studyWithSamples.forEach(s => {
            description += s.name + '\n';
        });

        const handleDownload = () => unalteredSampleCaseIds.join('\n');
        const handleQuery = () =>
            this.handleQueryButtonClick(unalteredSampleCaseIds);
        const unalteredSamplesVirtualStudyParams = {
            user: virtualStudyParams.user,
            name: virtualStudyParams.name,
            description: description,
            studyWithSamples: virtualStudyParams.studyWithSamples,
            selectedSamples: _.filter(
                virtualStudyParams.selectedSamples,
                (sample: Sample) =>
                    unalteredSampleCaseIdsSet.has(
                        `${sample.studyId}:${sample.sampleId}`
                    )
            ),
            filter: virtualStudyParams.filter,
            attributesMetaSet: virtualStudyParams.attributesMetaSet,
        } as IVirtualStudyProps;

        return this.copyDownloadQueryControlsRow(
            'Unaltered samples',
            handleDownload,
            'unaltered_samples.txt',
            handleQuery,
            unalteredSamplesVirtualStudyParams
        );
    }

    private sampleMatrixDownloadControls(sampleMatrixText: string) {
        const handleDownload = () => sampleMatrixText;

        return this.copyDownloadControlsRow(
            'Sample matrix: List of all samples where 1=altered and 0=unaltered',
            handleDownload,
            'sample_matrix.txt'
        );
    }

    private handleMutationDownload() {
        onMobxPromise(this.mutationDownloadData, data => {
            const text = downloadDataText(data);
            fileDownload(text, 'mutations.txt');
        });
    }

    private handleTransposedMutationDownload() {
        onMobxPromise(this.mutationDownloadData, data => {
            const text = downloadDataText(unzipDownloadData(data));
            fileDownload(text, 'mutations_transposed.txt');
        });
    }

    @autobind
    private handleStructuralVariantDownload() {
        onMobxPromise(this.structuralVariantDownloadData, data => {
            const text = downloadDataText(data);
            fileDownload(text, 'structural_variants.txt');
        });
    }

    @autobind
    private handleTransposedStructuralVariantDownload() {
        onMobxPromise(this.structuralVariantDownloadData, data => {
            const text = downloadDataText(unzipDownloadData(data));
            fileDownload(text, 'structural_variants_transposed.txt');
        });
    }

    private handleMrnaDownload(profileName: string) {
        onMobxPromise(this.mrnaDownloadData, data => {
            const text = downloadDataText(data);
            fileDownload(text, `${profileName}.txt`);
        });
    }

    private handleTransposedMrnaDownload(profileName: string) {
        onMobxPromise(this.mrnaDownloadData, data => {
            const text = downloadDataText(unzipDownloadData(data));
            fileDownload(text, `${profileName}.txt`);
        });
    }

    private handleProteinDownload(profileName: string) {
        onMobxPromise(this.proteinDownloadData, data => {
            const text = downloadDataText(data);
            fileDownload(text, `${profileName}.txt`);
        });
    }

    private handleTransposedProteinDownload(profileName: string) {
        onMobxPromise(this.proteinDownloadData, data => {
            const text = downloadDataText(unzipDownloadData(data));
            fileDownload(text, `${profileName}.txt`);
        });
    }

    private handleCnaDownload() {
        onMobxPromise(this.cnaDownloadData, data => {
            const text = downloadDataText(data);
            fileDownload(text, 'cna.txt');
        });
    }

    private handleTransposedCnaDownload() {
        onMobxPromise(this.cnaDownloadData, data => {
            const text = downloadDataText(unzipDownloadData(data));
            fileDownload(text, 'cna_transposed.txt');
        });
    }

    @autobind
    private handleNonSelectedMolecularProfileDownload(profileName: string) {
        onMobxPromise<any>(
            [
                this.props.store.nonSelectedDownloadableMolecularProfiles,
                this.props.store.samples,
                this.props.store.genes,
            ],
            (nonSelectedDownloadableMolecularProfiles, samples, genes) => {
                const profiles: MolecularProfile[] = nonSelectedDownloadableMolecularProfiles.filter(
                    (profile: MolecularProfile) => profile.name === profileName
                );
                downloadOtherMolecularProfileData(
                    profileName,
                    profiles,
                    samples,
                    genes
                );
            }
        );
    }

    @autobind
    private handleTransposedNonSelectedMolecularProfileDownload(
        profileName: string
    ) {
        onMobxPromise<any>(
            [
                this.props.store.nonSelectedDownloadableMolecularProfiles,
                this.props.store.samples,
                this.props.store.genes,
            ],
            (nonSelectedDownloadableMolecularProfiles, samples, genes) => {
                const profiles: MolecularProfile[] = nonSelectedDownloadableMolecularProfiles.filter(
                    (profile: MolecularProfile) => profile.name === profileName
                );
                downloadOtherMolecularProfileData(
                    profileName,
                    profiles,
                    samples,
                    genes,
                    true
                );
            }
        );
    }

    @autobind
    private handleGenericAssayProfileDownload(
        profileName: string,
        profileIdSuffix: string
    ) {
        onMobxPromise(
            this.genericAssayProfileDownloadDataGroupByProfileIdSuffix,
            downloadDataGroupByProfileIdSuffix => {
                const textMap = downloadDataTextGroupByKey(
                    downloadDataGroupByProfileIdSuffix
                );
                fileDownload(textMap[profileIdSuffix], `${profileName}.txt`);
            }
        );
    }

    @autobind
    private handleTransposedGenericAssayProfileDownload(
        profileName: string,
        profileIdSuffix: string
    ) {
        onMobxPromise(
            this.genericAssayProfileDownloadDataGroupByProfileIdSuffix,
            downloadDataGroupByProfileIdSuffix => {
                const transposedTextMap = downloadDataTextGroupByKey(
                    unzipDownloadDataGroupByKey(
                        downloadDataGroupByProfileIdSuffix
                    )
                );
                fileDownload(
                    transposedTextMap[profileIdSuffix],
                    `${profileName}.txt`
                );
            }
        );
    }

    @action
    private handleQueryButtonClick(querySampleIds: string[]) {
        const modifyQueryParams: ModifyQueryParams = {
            selectedSampleListId: CUSTOM_CASE_LIST_ID,
            selectedSampleIds: querySampleIds,
            caseIdsMode: 'sample',
        };
        this.props.store.modifyQueryParams = modifyQueryParams;
        this.props.store.queryFormVisible = true;
    }
}
