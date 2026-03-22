import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { convertToMutationMapperProps } from 'shared/components/mutationMapper/MutationMapperServerConfig';
import { getOncoKbApiUrl } from 'shared/api/urls';
import { getServerConfig } from 'config/config';
import GroupComparisonMutationMapper from './GroupComparisonMutationMapper';
import { Mutation } from 'cbioportal-ts-api-client';
import MutationMapperToolStore from 'pages/staticPages/tools/mutationMapper/MutationMapperToolStore';
import GroupComparisonStore from './GroupComparisonStore';
import _ from 'lodash';
import { MakeMobxView } from 'shared/components/MobxView';
import {
    countUniqueMutations,
    isPutativeDriver,
} from 'shared/lib/MutationUtils';
import ErrorMessage from 'shared/components/ErrorMessage';
import { AxisScale } from 'react-mutation-mapper';
import { LollipopTooltipCountInfo } from './LollipopTooltipCountInfo';
import MutationMapperUserSelectionStore from 'shared/components/mutationMapper/MutationMapperUserSelectionStore';
import styles from './styles.module.scss';
import { saveOncoKbIconStyleToLocalStorage } from 'shared/lib/AnnotationColumnUtils';
import {
    generateMutationIdByGeneAndProteinChange,
    getGenomeBuildFromStudies,
} from 'shared/lib/StoreUtils';

interface IGroupComparisonMutationMapperWrapperProps {
    store: GroupComparisonStore;
    onScaleToggle: (selectedScale: AxisScale) => void;
    mutations?: Mutation[];
    filters?: any;
}

@observer
export default class GroupComparisonMutationMapperWrapper extends React.Component<
    IGroupComparisonMutationMapperWrapperProps,
    {}
> {
    private userSelectionStore: MutationMapperUserSelectionStore;

    constructor(props: IGroupComparisonMutationMapperWrapperProps) {
        super(props);
        makeObservable(this);
        this.userSelectionStore = new MutationMapperUserSelectionStore();
    }

    @computed get mutationMapperToolStore() {
        const genomeBuild = getGenomeBuildFromStudies(
            this.props.store.studies.result
        );
        const store = new MutationMapperToolStore(
            this.props.store.filteredAndAnnotatedMutations.result,
            {
                ...this.props.filters,
                countUniqueMutations: this.countUniqueMutationsInGroup,
                mergeMutationsBy: generateMutationIdByGeneAndProteinChange,
                filterMutationsBySelectedTranscript: true,
                uniqueSampleKeyToTumorType: this.props.store
                    .uniqueSampleKeyToTumorType.result,
                uniqueSampleKeyToCancerType: this.props.store
                    .uniqueSampleKeyToCancerType.result,
                genomeBuild: genomeBuild,
            }
        );

        return store;
    }

    @autobind
    protected countUniqueMutationsInGroup(
        mutations: Mutation[],
        group: string
    ) {
        return this.props.store.axisMode === AxisScale.COUNT
            ? countUniqueMutations(mutations)
            : (countUniqueMutations(mutations) /
                  this.props.store.groupToProfiledPatients.result![group]
                      .length) *
                  100;
    }

    @autobind
    protected plotLollipopTooltipCountInfo(
        count: number,
        mutations: Mutation[],
        axisMode: AxisScale,
        group: string
    ): JSX.Element {
        return (
            <LollipopTooltipCountInfo
                count={count}
                mutations={mutations}
                axisMode={axisMode}
                patientCount={
                    this.props.store.groupToProfiledPatients.result![group]
                        .length
                }
            />
        );
    }

    @autobind
    protected plotYAxisLabelFormatter(symbol: string, groupName: string) {
        // lowercase = 1 and uppercase = 1.3 (based on 'w' and 'W'), if label >= 22 (13 + 9 leniency), stop and + "..."
        let length = 1;
        let label = `(${
            this.props.store.activeGroups.result!.find(
                g => g.name === groupName
            )!.ordinal
        }) `;
        for (let c of groupName) {
            let value = c === c.toLowerCase() ? 1 : 1.3;
            if (length + value >= 21) {
                label += '...';
                break;
            } else {
                label += c;
                length += value;
            }
        }
        if (symbol === '%') {
            return (
                `**${label}**\n${symbol}` +
                ' mutated of ' +
                this.props.store.groupToProfiledPatients.result![groupName]
                    .length +
                ' profiled pts'
            );
        } else {
            return `**${label}**\n${symbol} patients`;
        }
    }

    @action.bound
    protected handleOncoKbIconToggle(mergeIcons: boolean) {
        this.userSelectionStore.mergeOncoKbIcons = mergeIcons;
        saveOncoKbIconStyleToLocalStorage({ mergeIcons });
    }

    readonly plotUI = MakeMobxView({
        await: () => [
            this.props.store.mutations,
            this.props.store.mutationsByGroup,
            this.props.store.filteredAndAnnotatedMutations,
            this.mutationMapperToolStore.mutationMapperStores,
            this.props.store.coverageInformation,
            this.props.store.groupToProfiledPatients,
            this.props.store.profiledPatientCounts,
            this.props.store.genes,
            this.props.store.genesSortedByMutationFrequency,
        ],
        render: () => {
            let mutationMapperStore;
            if (
                this.props.store.activeMutationMapperGene &&
                (mutationMapperStore = this.mutationMapperToolStore.getMutationMapperStore(
                    this.props.store.activeMutationMapperGene.hugoGeneSymbol
                ))
            ) {
                return (
                    <div
                        data-test="ComparisonPageMutationsTabPlot"
                        style={{ marginTop: 20 }}
                    >
                        <h3>
                            {this.props.store.activeMutationMapperGene
                                .hugoGeneSymbol +
                                ' mutations: ' +
                                this.props.store.activeGroups
                                    .result!.map(g => g.nameWithOrdinal)
                                    .join(' vs ')}
                        </h3>
                        <GroupComparisonMutationMapper
                            {...convertToMutationMapperProps({
                                ...getServerConfig(),
                                // override ensemblLink
                                ensembl_transcript_url: this.props.store
                                    .ensemblLink,
                                // only disable oncokb and hotspots track if
                                // non-canonical transcript is selected
                                show_oncokb: mutationMapperStore.isCanonicalTranscript
                                    ? getServerConfig().show_oncokb
                                    : false,
                                show_hotspot: mutationMapperStore.isCanonicalTranscript
                                    ? getServerConfig().show_hotspot
                                    : false,
                            })}
                            oncoKbPublicApiUrl={getOncoKbApiUrl()}
                            mergeOncoKbIcons={
                                this.userSelectionStore.mergeOncoKbIcons
                            }
                            onOncoKbIconToggle={this.handleOncoKbIconToggle}
                            trackVisibility={
                                this.userSelectionStore.trackVisibility
                            }
                            columnVisibility={
                                this.userSelectionStore.columnVisibility
                            }
                            storeColumnVisibility={
                                this.userSelectionStore.storeColumnVisibility
                            }
                            pubMedCache={this.props.store.pubMedCache}
                            generateGenomeNexusHgvsgUrl={
                                this.props.store.generateGenomeNexusHgvsgUrl
                            }
                            showTranscriptDropDown={
                                getServerConfig().show_transcript_dropdown
                            }
                            compactStyle={true}
                            ptmSources={getServerConfig().ptmSources}
                            store={mutationMapperStore}
                            plotLollipopTooltipCountInfo={
                                this.plotLollipopTooltipCountInfo
                            }
                            axisMode={this.props.store.axisMode}
                            onScaleToggle={this.props.onScaleToggle}
                            plotYAxisLabelFormatter={
                                this.plotYAxisLabelFormatter
                            }
                            isPutativeDriver={
                                this.props.store.driverAnnotationSettings
                                    .driversAnnotated
                                    ? isPutativeDriver
                                    : undefined
                            }
                            showPlotPercentToggle={true}
                            groups={this.props.store.activeGroups.result!}
                            annotationFilterSettings={this.props.store}
                            groupToProfiledPatients={
                                this.props.store.groupToProfiledPatients.result!
                            }
                            sampleSet={this.props.store.sampleMap.result!}
                            profiledPatientCounts={
                                this.props.store.profiledPatientCounts.result!
                            }
                            queriedStudies={
                                this.props.store.displayedStudies.result!
                            }
                            uniqueSampleKeyToTumorType={
                                this.props.store.uniqueSampleKeyToTumorType
                                    .result!
                            }
                            uniqueSampleKeyToCancerType={
                                this.props.store.uniqueSampleKeyToCancerType
                                    .result!
                            }
                        />
                    </div>
                );
            } else {
                if (
                    Object.values(
                        this.props.store.coverageInformation.result!.samples
                    ).some(s => !_.isEmpty(s.allGenes) || !_.isEmpty(s.byGene))
                ) {
                    return (
                        <div className={styles.noMutationsMessage}>
                            Selected gene has no mutations for profiled samples.
                        </div>
                    );
                } else {
                    return (
                        <div className={styles.noMutationsMessage}>
                            Selected gene has no mutations due to no profiled
                            samples.
                        </div>
                    );
                }
            }
        },
        renderPending: () => (
            <LoadingIndicator isLoading={true} center={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    public render() {
        return this.plotUI.component;
    }
}
