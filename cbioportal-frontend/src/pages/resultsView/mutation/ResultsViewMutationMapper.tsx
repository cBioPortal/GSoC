import * as React from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import {
    DataFilter,
    DataFilterType,
    onFilterOptionSelect,
    FilterResetPanel,
} from 'react-mutation-mapper';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';

import { getRemoteDataGroupStatus } from 'cbioportal-utils';
import { Mutation } from 'cbioportal-ts-api-client';
import { EnsemblTranscript } from 'genome-nexus-ts-api-client';
import {
    columnIdToFilterId,
    matchCategoricalFilterSearch,
} from 'shared/lib/MutationUtils';
import DiscreteCNACache from 'shared/cache/DiscreteCNACache';
import CancerTypeCache from 'shared/cache/CancerTypeCache';
import MutationCountCache from 'shared/cache/MutationCountCache';
import ClinicalAttributeCache from 'shared/cache/ClinicalAttributeCache';
import { Column } from 'shared/components/lazyMobXTable/LazyMobXTable';
import FilterIconModal from 'shared/components/filterIconModal/FilterIconModal';
import DoubleHandleSlider from 'shared/components/doubleHandleSlider/DoubleHandleSlider';
import CategoricalFilterMenu from 'shared/components/categoricalFilterMenu/CategoricalFilterMenu';

import styles from 'shared/components/mutationMapper/mutationMapper.module.scss';
import {
    IMutationMapperProps,
    default as MutationMapper,
} from 'shared/components/mutationMapper/MutationMapper';
import MutationMapperDataStore, {
    MUTATION_STATUS_FILTER_ID,
} from 'shared/components/mutationMapper/MutationMapperDataStore';

import MutationRateSummary from 'pages/resultsView/mutation/MutationRateSummary';
import ResultsViewMutationMapperStore from 'pages/resultsView/mutation/ResultsViewMutationMapperStore';
import ResultsViewMutationTable from 'pages/resultsView/mutation/ResultsViewMutationTable';
import { submitToStudyViewPage } from '../querySummary/QuerySummaryUtils';
import { ExtendedMutationTableColumnType } from 'shared/components/mutationTable/MutationTable';
import { extractColumnNames } from 'shared/components/mutationMapper/MutationMapperUtils';
import { PatientSampleSummary } from '../querySummary/PatientSampleSummary';
import { getServerConfig } from 'config/config';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { SelectedDataTooltip } from 'shared/components/plots/SelectedDataAlert';

export interface IResultsViewMutationMapperProps extends IMutationMapperProps {
    store: ResultsViewMutationMapperStore;
    discreteCNACache?: DiscreteCNACache;
    cancerTypeCache?: CancerTypeCache;
    mutationCountCache?: MutationCountCache;
    clinicalAttributeCache?: ClinicalAttributeCache;
    existsSomeMutationWithAscnProperty: { [property: string]: boolean };
    userDisplayName: string;
    onClickSettingMenu?: (visible: boolean) => void;
    enableCustomDriver: boolean;
}

@observer
export default class ResultsViewMutationMapper extends MutationMapper<
    IResultsViewMutationMapperProps
> {
    @observable private minMaxColumns: Set<Column<Mutation[]>>;
    @observable private allUniqDataColumns: Set<Column<Mutation[]>>;

    constructor(props: IResultsViewMutationMapperProps) {
        super(props);
        makeObservable(this);
        this.minMaxColumns = new Set();
        this.allUniqDataColumns = new Set();
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
        if (this.props.store.queriedStudies.isComplete) {
            const linkToFilteredStudyView = (
                <DefaultTooltip overlay={SelectedDataTooltip}>
                    <a
                        onClick={() => {
                            submitToStudyViewPage(
                                this.props.store.queriedStudies.result!,
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
                    {`Showing ${dataStore.tableData.length} mutations (`}
                    {linkToFilteredStudyView}
                    {')'}
                </span>
            );
        }

        return (
            <FilterResetPanel
                resetFilters={() => dataStore.resetFilters()}
                filterInfo={filterInfo}
                additionalInfo={shiftClickMessage}
                className={classnames(
                    'alert-success',
                    'small',
                    styles.filterResetPanel
                )}
                buttonClass={classnames(
                    'btn',
                    'btn-default',
                    'btn-xs',
                    styles.removeFilterButton
                )}
            />
        );
    }

    @computed get mutationStatusFilter() {
        return this.store.dataStore.dataFilters.find(
            f => f.id === MUTATION_STATUS_FILTER_ID
        );
    }

    protected getMutationRateSummary(): JSX.Element | null {
        // TODO we should not be even calculating mskImpactGermlineConsentedPatientIds for studies other than msk impact
        if (
            this.props.store.germlineConsentedSamples &&
            this.props.store.germlineConsentedSamples.result &&
            this.props.store.mutationData.isComplete &&
            this.props.store.mutationData.result.length > 0 &&
            this.props.store.samples.isComplete &&
            this.props.store.samples.result &&
            this.props.store.samples.result.length > 0
        ) {
            return (
                <MutationRateSummary
                    hugoGeneSymbol={this.props.store.gene.hugoGeneSymbol}
                    molecularProfileIdToMolecularProfile={
                        this.props.store.molecularProfileIdToMolecularProfile
                    }
                    mutations={this.props.store.mutationData.result}
                    samples={this.props.store.samples.result!}
                    germlineConsentedSamples={
                        this.props.store.germlineConsentedSamples
                    }
                    onMutationStatusSelect={this.onMutationStatusSelect}
                    mutationStatusFilter={this.mutationStatusFilter}
                />
            );
        } else {
            return null;
        }
    }

    protected get isMutationTableDataLoading() {
        return (
            getRemoteDataGroupStatus(
                this.props.store.clinicalDataForSamples,
                this.props.store.studiesForSamplesWithoutCancerTypeClinicalData,
                this.props.store.canonicalTranscript,
                this.props.store.mutationData,
                this.props.store.indexedVariantAnnotations,
                this.props.store.activeTranscript,
                this.props.store.clinicalDataGroupedBySampleMap,
                this.props.store.mutationsTabClinicalAttributes
            ) === 'pending'
        );
    }

    protected get totalExonNumber() {
        const canonicalTranscriptId =
            this.props.store.canonicalTranscript.result &&
            this.props.store.canonicalTranscript.result.transcriptId;
        const transcript = (this.props.store.activeTranscript.result &&
        this.props.store.activeTranscript.result === canonicalTranscriptId
            ? this.props.store.canonicalTranscript.result
            : this.props.store.transcriptsByTranscriptId[
                  this.props.store.activeTranscript.result!
              ]) as EnsemblTranscript;
        return transcript && transcript.exons && transcript.exons.length > 0
            ? transcript.exons.length.toString()
            : 'None';
    }

    protected get mutationTableComponent(): JSX.Element | null {
        return (
            <ResultsViewMutationTable
                uniqueSampleKeyToTumorType={
                    this.props.store.uniqueSampleKeyToTumorType
                }
                oncoKbCancerGenes={this.props.store.oncoKbCancerGenes}
                discreteCNACache={this.props.discreteCNACache}
                studyIdToStudy={this.props.store.studyIdToStudy.result}
                molecularProfileIdToMolecularProfile={
                    this.props.store.molecularProfileIdToMolecularProfile.result
                }
                pubMedCache={this.props.pubMedCache}
                mutationCountCache={this.props.mutationCountCache}
                clinicalAttributeCache={this.props.clinicalAttributeCache}
                genomeNexusCache={this.props.genomeNexusCache}
                genomeNexusMutationAssessorCache={
                    this.props.genomeNexusMutationAssessorCache
                }
                dataStore={
                    this.props.store.dataStore as MutationMapperDataStore
                }
                itemsLabelPlural={this.itemsLabelPlural}
                downloadDataFetcher={this.props.store.downloadDataFetcher}
                hotspotData={this.props.store.indexedHotspotData}
                indexedVariantAnnotations={
                    this.props.store.indexedVariantAnnotations
                }
                indexedMyVariantInfoAnnotations={
                    this.props.store.indexedMyVariantInfoAnnotations
                }
                oncoKbData={this.props.store.oncoKbData}
                usingPublicOncoKbInstance={
                    getServerConfig().show_oncokb &&
                    this.props.store.usingPublicOncoKbInstance
                }
                mergeOncoKbIcons={this.props.mergeOncoKbIcons}
                onOncoKbIconToggle={this.props.onOncoKbIconToggle}
                civicGenes={this.props.store.civicGenes}
                civicVariants={this.props.store.civicVariants}
                userDisplayName={this.props.userDisplayName}
                enableOncoKb={this.props.enableOncoKb}
                enableFunctionalImpact={this.props.enableGenomeNexus}
                enableHotspot={this.props.enableHotspot}
                enableCivic={this.props.enableCivic}
                enableRevue={this.props.enableRevue}
                enableCustomDriver={this.props.enableCustomDriver}
                totalNumberOfExons={this.totalExonNumber}
                generateGenomeNexusHgvsgUrl={
                    this.props.store.generateGenomeNexusHgvsgUrl
                }
                isCanonicalTranscript={this.props.store.isCanonicalTranscript}
                selectedTranscriptId={this.props.store.activeTranscript.result}
                columnVisibility={this.props.columnVisibility}
                storeColumnVisibility={this.props.storeColumnVisibility}
                sampleIdToClinicalDataMap={
                    this.props.store.clinicalDataGroupedBySampleMap
                }
                existsSomeMutationWithAscnProperty={
                    this.props.existsSomeMutationWithAscnProperty
                }
                mutationsTabClinicalAttributes={
                    this.props.store.mutationsTabClinicalAttributes
                }
                clinicalAttributeIdToAvailableFrequency={
                    this.props.store.clinicalAttributeIdToAvailableFrequency
                }
                columnToHeaderFilterIconModal={
                    this.columnToHeaderFilterIconModal
                }
                deactivateColumnFilter={this.deactivateColumnFilter}
                namespaceColumns={this.props.store.namespaceColumnConfig}
                columns={this.columns}
                initialSortColumn={
                    getServerConfig()
                        .skin_results_view_tables_default_sort_column
                }
                customDriverName={this.props.customDriverName}
                customDriverDescription={this.props.customDriverDescription}
                customDriverTiersName={this.props.customDriverTiersName}
                customDriverTiersDescription={
                    this.props.customDriverTiersDescription
                }
            />
        );
    }

    @computed get columns(): ExtendedMutationTableColumnType[] {
        const namespaceColumnNames = extractColumnNames(
            this.props.store.namespaceColumnConfig
        );
        return _.concat(
            ResultsViewMutationTable.defaultProps.columns,
            namespaceColumnNames
        );
    }

    protected get mutationTable(): JSX.Element | null {
        return (
            <span>
                {!this.isMutationTableDataLoading &&
                    this.mutationTableComponent}
            </span>
        );
    }

    @action.bound
    protected onMutationStatusSelect(
        selectedMutationStatusIds: string[],
        allValuesSelected: boolean
    ) {
        onFilterOptionSelect(
            selectedMutationStatusIds,
            allValuesSelected,
            this.store.dataStore,
            DataFilterType.MUTATION_STATUS,
            MUTATION_STATUS_FILTER_ID
        );
    }

    @computed get dataFilterColumns() {
        return [
            ...this.props.store.numericalFilterColumns,
            ...this.props.store.categoricalFilterColumns,
        ];
    }

    @computed get getFilters() {
        const filters: { [columnId: string]: DataFilter } = {};
        for (let columnId of this.dataFilterColumns) {
            const filter = this.store.dataStore.dataFilters.find(
                f => f.type === columnId
            );
            if (filter) {
                filters[columnId] = filter;
            }
        }
        return filters;
    }

    protected columnFilterIsActive(columnId: string) {
        return columnId in this.getFilters;
    }

    @computed get columnMinMax() {
        const minMax: {
            [columnId: string]: {
                min: string;
                max: string;
                hasEmptyValues: boolean;
            };
        } = {};
        for (let column of this.minMaxColumns) {
            const columnId = column.name;
            let minText = '0';
            let maxText = '100';
            let hasEmptyValues = false;

            if (column.sortBy) {
                let min = Infinity;
                let max = -Infinity;
                let dMin, dMax;

                for (const d of this.store.dataStore.allData) {
                    const val = column.sortBy(d);
                    if (val !== null) {
                        if (+val < min) {
                            min = +val;
                            dMin = d;
                        }
                        if (+val > max) {
                            max = +val;
                            dMax = d;
                        }
                    } else {
                        hasEmptyValues = true;
                    }
                }

                if (dMin && dMax) {
                    if (column.download) {
                        minText = _.flatten([column.download(dMin)])[0];
                        maxText = _.flatten([column.download(dMax)])[0];
                    }
                    if (
                        !column.download ||
                        isNaN(+minText) ||
                        isNaN(+maxText)
                    ) {
                        minText = '' + min;
                        maxText = '' + max;
                    }
                }
            }

            minMax[columnId] = {
                min: minText,
                max: maxText,
                hasEmptyValues: hasEmptyValues,
            };
        }
        return minMax;
    }

    private resolveMutationToColumnValue(
        d: Mutation[],
        column: Column<Mutation[]>
    ) {
        let value = '';
        if (column.name === 'Mutation Type' && column.sortBy) {
            value = '' + (_.flatten([column.sortBy(d)])[0] || '');
        } else {
            value = _.flatten([column.download!(d)])[0];
        }
        return value || '(Blanks)';
    }

    @computed get allUniqColumnData() {
        const allUniqColumnData: { [columnId: string]: Set<string> } = {};
        for (let column of this.allUniqDataColumns) {
            const columnId = column.name;
            if (column.download) {
                allUniqColumnData[columnId] = new Set();
                for (const d of this.store.dataStore.allData) {
                    const value = this.resolveMutationToColumnValue(d, column);
                    allUniqColumnData[columnId].add(value);
                }
            } else {
                allUniqColumnData[columnId] = new Set();
            }
        }
        return allUniqColumnData;
    }

    @computed get allUniqColumnDataFiltered() {
        const allUniqColumnDataFiltered: {
            [columnId: string]: Set<string>;
        } = {};
        for (let column of this.allUniqDataColumns) {
            const columnId = column.name;
            if (column.download) {
                allUniqColumnDataFiltered[columnId] = new Set();

                for (const d of this.store.dataStore.sortedFilteredData) {
                    const value = this.resolveMutationToColumnValue(d, column);
                    allUniqColumnDataFiltered[columnId].add(value);
                }

                if (this.columnFilterIsActive(columnId)) {
                    const filter = this.getFilters[columnId];
                    for (const d of this.store.dataStore.allData) {
                        const value = this.resolveMutationToColumnValue(
                            d,
                            column
                        );
                        const filteredOutByOwnSelectionFilter =
                            matchCategoricalFilterSearch(
                                value,
                                filter.values[0]
                            ) && !filter.values[0].selections.has(value);

                        if (filteredOutByOwnSelectionFilter) {
                            allUniqColumnDataFiltered[columnId].add(value);
                        }
                    }
                }
            } else {
                allUniqColumnDataFiltered[columnId] = new Set();
            }
        }
        return allUniqColumnDataFiltered;
    }

    protected isDefaultNumericalFilter(columnId: string) {
        const filter = this.getFilters[columnId];
        const columnMinMax = this.columnMinMax[columnId];
        return (
            +filter.values[0].lowerBound === +columnMinMax.min &&
            +filter.values[0].upperBound === +columnMinMax.max &&
            filter.values[0].hideEmptyValues === false
        );
    }

    protected isDefaultCategoricalFilter(columnId: string) {
        const filter = this.getFilters[columnId];
        return (
            filter.values[0].filterCondition === 'contains' &&
            filter.values[0].filterString === '' &&
            _.isEqual(
                filter.values[0].selections,
                this.allUniqColumnData[columnId]
            )
        );
    }

    protected activateNumericalFilter(
        columnId: string,
        lowerBound?: number,
        upperBound?: number,
        hideEmptyValues?: boolean
    ) {
        const min = +this.columnMinMax[columnId].min;
        const max = +this.columnMinMax[columnId].max;
        onFilterOptionSelect(
            [
                {
                    lowerBound: lowerBound === undefined ? min : lowerBound,
                    upperBound: upperBound === undefined ? max : upperBound,
                    hideEmptyValues:
                        hideEmptyValues === undefined ? false : hideEmptyValues,
                },
            ],
            false,
            this.store.dataStore,
            columnId,
            columnIdToFilterId(columnId)
        );
    }

    protected activateCategoricalFilter(
        columnId: string,
        filterCondition?: string,
        filterString?: string,
        selections?: Set<string>
    ) {
        onFilterOptionSelect(
            [
                {
                    filterCondition: filterCondition || 'contains',
                    filterString: filterString || '',
                    selections: selections || this.allUniqColumnData[columnId],
                },
            ],
            false,
            this.store.dataStore,
            columnId,
            columnIdToFilterId(columnId)
        );
    }

    protected deactivateColumnFilter = (columnId: string) => {
        onFilterOptionSelect(
            [],
            true,
            this.store.dataStore,
            columnId,
            columnIdToFilterId(columnId)
        );
    };

    protected setupColumnFilter = (column: Column<Mutation[]>) => {
        const columnId = column.name;
        if (this.props.store.numericalFilterColumns.has(columnId)) {
            this.minMaxColumns.add(column);
        } else if (this.props.store.categoricalFilterColumns.has(columnId)) {
            this.allUniqDataColumns.add(column);
        }
    };

    @computed get numericalFilterComponents() {
        const components: { [columnId: string]: JSX.Element } = {};
        for (let column of this.minMaxColumns) {
            const columnId = column.name;
            const filter = this.columnFilterIsActive(columnId)
                ? this.getFilters[columnId]
                : undefined;

            components[columnId] = (
                <div>
                    <DoubleHandleSlider
                        id={columnId}
                        min={this.columnMinMax[columnId].min}
                        max={this.columnMinMax[columnId].max}
                        lowerValue={filter?.values[0].lowerBound}
                        upperValue={filter?.values[0].upperBound}
                        callbackLowerValue={newLowerBound => {
                            if (filter) {
                                filter.values[0].lowerBound = newLowerBound;
                                if (this.isDefaultNumericalFilter(columnId)) {
                                    this.deactivateColumnFilter(columnId);
                                }
                            } else {
                                this.activateNumericalFilter(
                                    columnId,
                                    newLowerBound
                                );
                            }
                        }}
                        callbackUpperValue={newUpperBound => {
                            if (filter) {
                                filter.values[0].upperBound = newUpperBound;
                                if (this.isDefaultNumericalFilter(columnId)) {
                                    this.deactivateColumnFilter(columnId);
                                }
                            } else {
                                this.activateNumericalFilter(
                                    columnId,
                                    undefined,
                                    newUpperBound
                                );
                            }
                        }}
                    />

                    {this.columnMinMax[columnId].hasEmptyValues && (
                        <label style={{ fontWeight: 100 }}>
                            <input
                                type="checkbox"
                                style={{
                                    marginTop: '10px',
                                    marginLeft: '5px',
                                    marginRight: '4px',
                                }}
                                checked={
                                    filter
                                        ? filter.values[0].hideEmptyValues
                                        : false
                                }
                                onChange={(e: any) => {
                                    if (filter) {
                                        filter.values[0].hideEmptyValues = !filter
                                            .values[0].hideEmptyValues;
                                        if (
                                            this.isDefaultNumericalFilter(
                                                columnId
                                            )
                                        ) {
                                            this.deactivateColumnFilter(
                                                columnId
                                            );
                                        }
                                    } else {
                                        this.activateNumericalFilter(
                                            columnId,
                                            undefined,
                                            undefined,
                                            true
                                        );
                                    }
                                }}
                                data-test="numerical-filter-menu-remove-empty-rows"
                            />
                            {'Hide empty values'}
                        </label>
                    )}
                </div>
            );
        }
        return components;
    }

    @computed get categoricalFilterComponents() {
        const components: { [columnId: string]: JSX.Element } = {};
        for (let column of this.allUniqDataColumns) {
            const columnId = column.name;
            const filter = this.columnFilterIsActive(columnId)
                ? this.getFilters[columnId]
                : undefined;

            components[columnId] = (
                <CategoricalFilterMenu
                    id={columnId}
                    emptyFilterString={!filter}
                    currSelections={
                        filter
                            ? filter.values[0].selections
                            : this.allUniqColumnDataFiltered[columnId]
                    }
                    allSelections={this.allUniqColumnDataFiltered[columnId]}
                    updateFilterCondition={newFilterCondition => {
                        if (filter) {
                            filter.values[0].filterCondition = newFilterCondition;
                            if (this.isDefaultCategoricalFilter(columnId)) {
                                this.deactivateColumnFilter(columnId);
                            }
                        } else {
                            this.activateCategoricalFilter(
                                columnId,
                                newFilterCondition
                            );
                        }
                    }}
                    updateFilterString={newFilterString => {
                        if (filter) {
                            filter.values[0].filterString = newFilterString;
                            if (this.isDefaultCategoricalFilter(columnId)) {
                                this.deactivateColumnFilter(columnId);
                            }
                        } else {
                            this.activateCategoricalFilter(
                                columnId,
                                undefined,
                                newFilterString
                            );
                        }
                    }}
                    toggleSelections={toggledSelections => {
                        if (filter) {
                            const selections = filter.values[0].selections;
                            toggledSelections.forEach(selection => {
                                if (selections.has(selection)) {
                                    selections.delete(selection);
                                } else {
                                    selections.add(selection);
                                }
                            });
                            if (this.isDefaultCategoricalFilter(columnId)) {
                                this.deactivateColumnFilter(columnId);
                            }
                        } else {
                            const selections = this.allUniqColumnData[columnId];
                            toggledSelections.forEach(selection => {
                                selections.delete(selection);
                            });
                            this.activateCategoricalFilter(
                                columnId,
                                undefined,
                                undefined,
                                selections
                            );
                        }
                    }}
                />
            );
        }
        return components;
    }

    protected columnToHeaderFilterIconModal = (column: Column<Mutation[]>) => {
        const columnId = column.name;
        const isNumericalFilterColumn = this.props.store.numericalFilterColumns.has(
            columnId
        );
        const isCategoricalFilterColumn = this.props.store.categoricalFilterColumns.has(
            columnId
        );

        if (isNumericalFilterColumn || isCategoricalFilterColumn) {
            let menuComponent;
            if (isNumericalFilterColumn && this.minMaxColumns.has(column)) {
                menuComponent = this.numericalFilterComponents[columnId];
            } else if (
                isCategoricalFilterColumn &&
                this.allUniqDataColumns.has(column)
            ) {
                menuComponent = this.categoricalFilterComponents[columnId];
            }

            return (
                <FilterIconModal
                    id={columnId}
                    filterIsActive={this.columnFilterIsActive(columnId)}
                    deactivateFilter={() =>
                        this.deactivateColumnFilter(columnId)
                    }
                    setupFilter={() => this.setupColumnFilter(column)}
                    menuComponent={menuComponent}
                />
            );
        }
    };
}
