import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import {
    IMutationMapperProps,
    default as MutationMapper,
} from 'shared/components/mutationMapper/MutationMapper';
import {
    AxisScale,
    DataFilterType,
    FilterResetPanel,
    groupDataByGroupFilters,
    onFilterOptionSelect,
    ProteinImpactTypeBadgeSelector,
} from 'react-mutation-mapper';
import _ from 'lodash';
import {
    ComparisonGroup,
    getCountsByAttribute,
    getProteinChangeToMutationRowData,
    SIGNIFICANT_QVALUE_THRESHOLD,
} from './GroupComparisonUtils';
import DriverAnnotationProteinImpactTypeBadgeSelector from 'shared/components/mutationMapper/DriverAnnotationProteinImpactTypeBadgeSelector';
import { IAnnotationFilterSettings } from 'shared/alterationFiltering/AnnotationFilteringSettings';
import SettingsMenuButton from 'shared/components/driverAnnotations/SettingsMenuButton';
import styles from './styles.module.scss';
import { LegendColorCodes } from 'shared/components/mutationMapper/LegendColorCodes';
import {
    DefaultTooltip,
    ProteinImpactWithoutVusMutationType,
} from 'cbioportal-frontend-commons';
import { ExtendedMutationTableColumnType } from 'shared/components/mutationTable/MutationTable';
import GroupComparisonMutationTable from './GroupComparisonMutationTable';
import MutationMapperDataStore, {
    PROTEIN_CHANGE_FILTER_ID,
} from 'shared/components/mutationMapper/MutationMapperDataStore';
import { extractColumnNames } from 'shared/components/mutationMapper/MutationMapperUtils';
import autobind from 'autobind-decorator';
import { CancerStudy, Sample } from 'cbioportal-ts-api-client';
import { FisherExactTwoSidedTestLabel } from './FisherExactTwoSidedTestLabel';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { CheckedSelect, Option } from 'cbioportal-frontend-commons';
import { PatientSampleSummary } from 'pages/resultsView/querySummary/PatientSampleSummary';
import classnames from 'classnames';
import mutationMapperStyles from 'shared/components/mutationMapper/mutationMapper.module.scss';
import { submitToStudyViewPage } from 'pages/resultsView/querySummary/QuerySummaryUtils';
import checkboxStyles from 'pages/resultsView/enrichments/styles.module.scss';
import { getServerConfig } from 'config/config';
import { SelectedDataTooltip } from 'shared/components/plots/SelectedDataAlert';

interface IGroupComparisonMutationMapperProps extends IMutationMapperProps {
    onInit?: (mutationMapper: GroupComparisonMutationMapper) => void;
    axisMode?: AxisScale;
    onScaleToggle?: (selectedScale: AxisScale) => void;
    groups: ComparisonGroup[];
    annotationFilterSettings: IAnnotationFilterSettings;
    groupToProfiledPatients: {
        [groupUid: string]: string[];
    };
    sampleSet: ComplexKeyMap<Sample>;
    profiledPatientCounts: number[];
    queriedStudies: CancerStudy[];
    uniqueSampleKeyToTumorType: {
        [uniqueSampleKey: string]: string;
    };
    uniqueSampleKeyToCancerType: {
        [uniqueSampleKey: string]: string;
    };
}

@observer
export default class GroupComparisonMutationMapper extends MutationMapper<
    IGroupComparisonMutationMapperProps
> {
    @observable.ref _selectedGroupsForEnrichedInFilter: string[];
    @observable significanceFilterEnabled: boolean = false;

    constructor(props: IGroupComparisonMutationMapperProps) {
        super(props);
        makeObservable(this);

        this._selectedGroupsForEnrichedInFilter = this.props.groups.map(
            group => group.nameWithOrdinal
        );
    }

    protected legendColorCodes = (
        <LegendColorCodes
            isPutativeDriver={this.props.isPutativeDriver}
            hideFusions={true}
        />
    );

    protected get view3dButton(): JSX.Element | null {
        return null;
    }

    protected get mutationTableComponent() {
        const dataStore = this.props.store.dataStore as MutationMapperDataStore;
        return (
            <GroupComparisonMutationTable
                uniqueSampleKeyToTumorType={
                    this.props.uniqueSampleKeyToTumorType
                }
                uniqueSampleKeyToCancerType={
                    this.props.uniqueSampleKeyToCancerType
                }
                oncoKbCancerGenes={this.props.store.oncoKbCancerGenes}
                pubMedCache={this.props.pubMedCache}
                genomeNexusCache={this.props.genomeNexusCache}
                genomeNexusMutationAssessorCache={
                    this.props.genomeNexusMutationAssessorCache
                }
                dataStore={dataStore}
                downloadDataFetcher={this.props.store.downloadDataFetcher}
                hotspotData={this.props.store.indexedHotspotData}
                indexedVariantAnnotations={
                    this.props.store.indexedVariantAnnotations
                }
                indexedMyVariantInfoAnnotations={
                    this.props.store.indexedMyVariantInfoAnnotations
                }
                oncoKbData={this.props.store.oncoKbData}
                oncoKbDataForCancerType={
                    this.props.store.oncoKbDataForCancerType
                }
                oncoKbDataForUnknownPrimary={
                    this.props.store.oncoKbDataForUnknownPrimary
                }
                usingPublicOncoKbInstance={
                    getServerConfig().show_oncokb &&
                    this.props.store.usingPublicOncoKbInstance
                }
                mergeOncoKbIcons={this.props.mergeOncoKbIcons}
                onOncoKbIconToggle={this.props.onOncoKbIconToggle}
                civicGenes={this.props.store.civicGenes}
                civicVariants={this.props.store.civicVariants}
                enableOncoKb={this.props.enableOncoKb}
                enableFunctionalImpact={this.props.enableGenomeNexus}
                enableHotspot={this.props.enableHotspot}
                enableCivic={this.props.enableCivic}
                generateGenomeNexusHgvsgUrl={
                    this.props.generateGenomeNexusHgvsgUrl
                }
                isCanonicalTranscript={this.props.store.isCanonicalTranscript}
                selectedTranscriptId={this.props.store.activeTranscript.result}
                columnVisibility={this.props.columnVisibility}
                storeColumnVisibility={this.props.storeColumnVisibility}
                namespaceColumns={this.props.store.namespaceColumnConfig}
                columns={this.columns}
                profiledPatientCounts={this.props.profiledPatientCounts}
                groups={this.props.groups}
                sampleSet={this.props.sampleSet}
                customControls={this.tableCustomControls}
                rowDataByProteinChange={this.rowDataByProteinChange}
                initialSortColumn={'p-Value'}
                initialSortDirection={'asc'}
                customDriverName={this.props.customDriverName}
                customDriverDescription={this.props.customDriverDescription}
                customDriverTiersName={this.props.customDriverTiersName}
                customDriverTiersDescription={
                    this.props.customDriverTiersDescription
                }
            />
        );
    }

    @computed get rowDataByProteinChange() {
        return getProteinChangeToMutationRowData(
            this.props.store.dataStore.allData,
            this.getMutationsGroupedByProteinChangeForGroup,
            this.props.profiledPatientCounts,
            this.props.groups
        );
    }

    @computed get selectedProteinChanges() {
        return _(this.rowDataByProteinChange)
            .filter(d => {
                return this.significanceFilterEnabled
                    ? this._selectedGroupsForEnrichedInFilter.includes(
                          d.enrichedGroup
                      ) && d.qValue < SIGNIFICANT_QVALUE_THRESHOLD
                    : this._selectedGroupsForEnrichedInFilter.includes(
                          d.enrichedGroup
                      );
            })
            .map(d => d.proteinChange)
            .value();
    }

    @computed get columns(): ExtendedMutationTableColumnType[] {
        const namespaceColumnNames = extractColumnNames(
            this.props.store.namespaceColumnConfig
        );
        return _.concat(
            GroupComparisonMutationTable.defaultProps.columns,
            namespaceColumnNames
        );
    }

    protected get plotTopYAxisSymbol() {
        return this.props.axisMode;
    }

    protected get plotBottomYAxisSymbol() {
        return this.props.axisMode;
    }

    protected get plotTopYAxisDefaultMax() {
        return this.props.axisMode === AxisScale.PERCENT ? 0 : 5;
    }

    protected get plotBottomYAxisDefaultMax() {
        return this.props.axisMode === AxisScale.PERCENT ? 0 : 5;
    }

    protected get plotYMaxLabelPostfix() {
        return this.props.axisMode === AxisScale.PERCENT ? '%' : '';
    }

    protected proteinImpactTypeBadgeSelectorForGroup(
        groupIndex: number,
        driversAnnotated: boolean
    ): JSX.Element {
        return (
            <>
                {driversAnnotated ? (
                    <DriverAnnotationProteinImpactTypeBadgeSelector
                        filter={this.proteinImpactTypeFilter}
                        counts={getCountsByAttribute(
                            this.getMutationsGroupedByProteinImpactTypeForGroup(
                                groupIndex
                            ),
                            true
                        )}
                        onSelect={this.onProteinImpactTypeSelect}
                        annotatedProteinImpactTypeFilter={
                            this.annotatedProteinImpactTypeFilter
                        }
                        disableAnnotationSettings={true}
                        excludedProteinTypes={[
                            ProteinImpactWithoutVusMutationType.FUSION,
                        ]}
                        groupIndex={groupIndex}
                        groupNameWithOrdinal={
                            this.props.groups[groupIndex].nameWithOrdinal
                        }
                        height={148}
                    />
                ) : (
                    <ProteinImpactTypeBadgeSelector
                        filter={this.proteinImpactTypeFilter}
                        counts={getCountsByAttribute(
                            this.getMutationsGroupedByProteinImpactTypeForGroup(
                                groupIndex
                            ),
                            true
                        )}
                        onSelect={this.onProteinImpactTypeSelect}
                        excludedProteinTypes={[
                            ProteinImpactWithoutVusMutationType.FUSION,
                        ]}
                        groupIndex={groupIndex}
                        groupNameWithOrdinal={
                            this.props.groups[groupIndex].nameWithOrdinal
                        }
                        height={108}
                    />
                )}
            </>
        );
    }

    protected get filterResetPanel(): JSX.Element | null {
        const dataStore = this.props.store.dataStore as MutationMapperDataStore;
        let filterInfo:
            | JSX.Element
            | string = `Showing ${dataStore.tableData.length} of ${dataStore.allData.length} mutations.`;
        const shiftClickMessage: string =
            dataStore.sortedFilteredSelectedData.length > 0
                ? ' (Shift click to select multiple residues)'
                : '';
        if (this.props.queriedStudies) {
            const linkToFilteredStudyView = (
                <DefaultTooltip overlay={SelectedDataTooltip}>
                    <a
                        onClick={() => {
                            submitToStudyViewPage(
                                this.props.queriedStudies,
                                dataStore.tableDataSamples,
                                true
                            );
                        }}
                    >
                        <PatientSampleSummary
                            samples={dataStore.tableDataSamples}
                            patients={dataStore.tableDataPatients}
                        />
                    </a>
                </DefaultTooltip>
            );
            filterInfo = (
                <span>
                    {`Showing ${
                        _.flatten(dataStore.tableData).length
                    } mutations (`}
                    {linkToFilteredStudyView}
                    {')'}
                </span>
            );
        }

        return (
            <FilterResetPanel
                resetFilters={this.resetFilters}
                filterInfo={filterInfo}
                additionalInfo={shiftClickMessage}
                className={classnames(
                    'alert-success',
                    'small',
                    mutationMapperStyles.filterResetPanel
                )}
                buttonClass={classnames(
                    'btn',
                    'btn-default',
                    'btn-xs',
                    mutationMapperStyles.removeFilterButton
                )}
            />
        );
    }

    /**
     * Overriding the parent method to have a customized filter panel.
     */
    protected get mutationFilterPanel(): JSX.Element | null {
        return (
            <>
                <div
                    className={styles.settingsMenuButton}
                    style={
                        this.props.isPutativeDriver
                            ? { position: 'absolute' }
                            : {}
                    }
                >
                    <SettingsMenuButton
                        store={this.props.annotationFilterSettings}
                        disableInfoIcon={true}
                        showOnckbAnnotationControls={true}
                        showFilterControls={false}
                        showExcludeUnprofiledSamplesControl={false}
                        inFilterPanel={true}
                    />
                </div>
                <div
                    style={
                        this.props.isPutativeDriver
                            ? { paddingTop: 5, paddingBottom: 5 }
                            : { paddingTop: 15, paddingBottom: 15 }
                    }
                >
                    <div>
                        {this.proteinImpactTypeBadgeSelectorForGroup(
                            0,
                            !!this.props.isPutativeDriver
                        )}
                        <hr
                            style={
                                this.props.isPutativeDriver
                                    ? {
                                          marginTop: 10,
                                          marginBottom: 10,
                                          height: 1,
                                          backgroundColor: 'black',
                                          border: 'none',
                                          color: 'black',
                                      }
                                    : {
                                          marginTop: 15,
                                          marginBottom: 15,
                                          height: 1,
                                          backgroundColor: 'black',
                                          border: 'none',
                                          color: 'black',
                                      }
                            }
                        ></hr>
                        {this.proteinImpactTypeBadgeSelectorForGroup(
                            1,
                            !!this.props.isPutativeDriver
                        )}
                    </div>
                </div>
            </>
        );
    }

    @autobind
    protected getMutationsGroupedByProteinImpactTypeForGroup(
        groupIndex: number
    ) {
        // group the filtered data by comparison group
        const sortedFilteredGroupedData = groupDataByGroupFilters(
            this.store.dataStore.groupFilters,
            _.flatten(
                this.sortedFilteredDataWithoutProteinImpactTypeFilter
            ).map(d => [d]),
            this.store.dataStore.applyFilter
        );

        return this.groupDataByProteinImpactType(
            sortedFilteredGroupedData[groupIndex].data
        );
    }

    @autobind
    protected getMutationsGroupedByProteinChangeForGroup(groupIndex: number) {
        // group all data by comparison group
        const allGroupedData = groupDataByGroupFilters(
            this.store.dataStore.groupFilters,
            _.flatten(this.store.dataStore.allData).map(d => [d]),
            this.store.dataStore.applyFilter
        );

        const filters = _(allGroupedData[groupIndex].data)
            .map((d: { proteinChange: any }[]) => d[0].proteinChange)
            .uniq() // get the unique protein changes in the data
            .map(value => ({
                // map to filters
                group: value,
                filter: {
                    type: DataFilterType.PROTEIN_CHANGE,
                    values: [value],
                },
            }))
            .value();

        const groupedData = groupDataByGroupFilters(
            filters,
            allGroupedData[groupIndex].data,
            this.store.dataStore.applyFilter
        );

        return _.keyBy(groupedData, d => d.group);
    }

    @computed
    protected get plotFooter(): JSX.Element {
        return (
            <FisherExactTwoSidedTestLabel
                dataStore={
                    this.props.store.dataStore as MutationMapperDataStore
                }
                hugoGeneSymbol={this.props.store.gene.hugoGeneSymbol}
                groups={this.props.groups}
                profiledPatientCounts={this.props.profiledPatientCounts}
            />
        );
    }

    @computed get tableCustomControls(): JSX.Element {
        return (
            <div className={checkboxStyles.Checkboxes}>
                <div
                    style={{ width: 250, marginRight: 7 }}
                    data-test="enrichedInDropdown"
                >
                    <CheckedSelect
                        name={'groupsSelector'}
                        placeholder={'Enriched in ...'}
                        onChange={this.onChange}
                        options={this.options}
                        value={this.selectedValues}
                    />
                </div>
                <label className="checkbox-inline" style={{ marginRight: 7 }}>
                    <input
                        type="checkbox"
                        checked={this.significanceFilterEnabled}
                        onClick={this.toggleSignificanceFilter}
                        data-test="significantOnlyCheckbox"
                    />
                    Significant only
                </label>
            </div>
        );
    }

    @computed get options(): Option[] {
        return _.map(this.props.groups, group => {
            return {
                label: group.nameWithOrdinal,
                value: group.nameWithOrdinal,
            };
        });
    }

    @computed get selectedValues() {
        return this._selectedGroupsForEnrichedInFilter.map(id => ({
            value: id,
        }));
    }

    @action.bound
    onChange(values: { value: string }[]) {
        this._selectedGroupsForEnrichedInFilter = _.map(
            values,
            datum => datum.value
        );
        onFilterOptionSelect(
            this.selectedProteinChanges,
            this.selectedProteinChanges.length ===
                _.keys(this.rowDataByProteinChange).length,
            this.store.dataStore,
            DataFilterType.PROTEIN_CHANGE,
            PROTEIN_CHANGE_FILTER_ID
        );
    }

    @action.bound
    toggleSignificanceFilter() {
        this.significanceFilterEnabled = !this.significanceFilterEnabled;
        onFilterOptionSelect(
            this.selectedProteinChanges,
            this.selectedProteinChanges.length ===
                _.keys(this.rowDataByProteinChange).length,
            this.store.dataStore,
            DataFilterType.PROTEIN_CHANGE,
            PROTEIN_CHANGE_FILTER_ID
        );
    }

    @action.bound
    protected resetFilters() {
        super.resetFilters();
        this._selectedGroupsForEnrichedInFilter = this.props.groups.map(
            group => group.nameWithOrdinal
        );
        this.significanceFilterEnabled = false;
    }

    @action.bound
    protected handleTranscriptChange(transcriptId: string) {
        this.resetFilters();
        super.handleTranscriptChange(transcriptId);
    }
}
