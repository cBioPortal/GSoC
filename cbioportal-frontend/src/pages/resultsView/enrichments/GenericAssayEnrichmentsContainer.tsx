import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, computed, action, makeObservable } from 'mobx';
import styles from './styles.module.scss';
import { MolecularProfile, Sample } from 'cbioportal-ts-api-client';
import {
    getGenericAssayEnrichmentRowData,
    GenericAssayEnrichmentWithQ,
    getGenericAssayEnrichmentColumns,
    getGenericAssayScatterData,
    getFilteredData,
} from 'pages/resultsView/enrichments/EnrichmentsUtil';
import _ from 'lodash';
import autobind from 'autobind-decorator';
import { CheckedSelect, Option } from 'cbioportal-frontend-commons';
import GenericAssayEnrichmentsTable, {
    GenericAssayEnrichmentTableColumnType,
} from './GenericAssayEnrichmentsTable';
import { GenericAssayEnrichmentsTableDataStore } from './GenericAssayEnrichmentsTableDataStore';
import { GenericAssayEnrichmentRow } from 'shared/model/EnrichmentRow';
import ExpressionEnrichmentsBoxPlot from './ExpressionEnrichmentsBoxPlot';
import { EnrichmentAnalysisComparisonGroup } from 'pages/groupComparison/GroupComparisonUtils';
import GenericAssayMiniScatterChart from './GenericAssayMiniScatterChart';

export interface IGenericAssayEnrichmentsContainerProps {
    data: GenericAssayEnrichmentWithQ[];
    selectedProfile: MolecularProfile;
    groups: EnrichmentAnalysisComparisonGroup[];
    sampleKeyToSample: {
        [uniqueSampleKey: string]: Sample;
    };
    genericAssayType: string;
    alteredVsUnalteredMode?: boolean;
}

@observer
export default class GenericAssayEnrichmentsContainer extends React.Component<
    IGenericAssayEnrichmentsContainerProps,
    {}
> {
    constructor(props: IGenericAssayEnrichmentsContainerProps) {
        super(props);
        makeObservable(this);
    }

    static defaultProps: Partial<IGenericAssayEnrichmentsContainerProps> = {
        alteredVsUnalteredMode: true,
    };

    @observable significanceFilter: boolean = false;
    @observable.ref clickedEntityStableId: string;
    @observable.ref selectedStableIds: string[] | null;
    @observable.ref highlightedRow: GenericAssayEnrichmentRow | undefined;
    @observable.ref _enrichedGroups: string[] = this.props.groups.map(
        group => group.name
    );

    @computed get data(): GenericAssayEnrichmentRow[] {
        return getGenericAssayEnrichmentRowData(
            this.props.data,
            this.props.groups
        );
    }

    @computed get filteredData(): GenericAssayEnrichmentRow[] {
        return getFilteredData(
            this.data,
            this._enrichedGroups,
            this.significanceFilter,
            this.filterByStableId,
            true
        );
    }

    @autobind
    private filterByStableId(stableId: string) {
        if (this.selectedStableIds) {
            return this.selectedStableIds.includes(stableId);
        } else {
            // no need to filter the data since there is no selection
            return true;
        }
    }

    @autobind
    private toggleSignificanceFilter() {
        this.significanceFilter = !this.significanceFilter;
    }

    @autobind
    private onEntityClick(stableId: string) {
        this.clickedEntityStableId = stableId;
    }

    @autobind
    private onSelection(stableIds: string[]) {
        this.selectedStableIds = stableIds;
    }

    @autobind
    private onSelectionCleared() {
        this.selectedStableIds = null;
    }

    private dataStore = new GenericAssayEnrichmentsTableDataStore(
        () => {
            return this.filteredData;
        },
        () => {
            return this.highlightedRow;
        },
        (c: GenericAssayEnrichmentRow) => {
            this.highlightedRow = c;
        }
    );

    //used in 2 groups analysis
    @computed get group1() {
        return this.props.groups[0];
    }

    //used in 2 groups analysis
    @computed get group2() {
        return this.props.groups[1];
    }

    @computed get selectedEntitiesSet() {
        return _.keyBy(this.selectedStableIds || []);
    }

    @computed get isTwoGroupAnalysis(): boolean {
        return this.props.groups.length == 2;
    }

    @computed get customColumns() {
        return getGenericAssayEnrichmentColumns(
            this.props.groups,
            this.props.alteredVsUnalteredMode
        );
    }

    @computed get visibleOrderedColumnNames() {
        const columns = [];
        columns.push(GenericAssayEnrichmentTableColumnType.ENTITY_ID);

        this.props.groups.forEach(group => {
            columns.push(group.name + ' mean');
        });

        this.props.groups.forEach(group => {
            columns.push(group.name + ' standard deviation');
        });

        if (this.isTwoGroupAnalysis) {
            columns.push(GenericAssayEnrichmentTableColumnType.LOG_RATIO);
        }

        columns.push(
            GenericAssayEnrichmentTableColumnType.P_VALUE,
            GenericAssayEnrichmentTableColumnType.Q_VALUE
        );

        if (this.isTwoGroupAnalysis && this.props.alteredVsUnalteredMode) {
            columns.push(GenericAssayEnrichmentTableColumnType.TENDENCY);
        } else {
            columns.push(GenericAssayEnrichmentTableColumnType.EXPRESSED);
        }

        return columns;
    }

    @action.bound
    onChange(values: { value: string }[]) {
        this._enrichedGroups = _.map(values, datum => datum.value);
    }

    @computed get selectedValues() {
        return this._enrichedGroups.map(id => ({ value: id }));
    }

    @computed get options(): Option[] {
        return _.map(this.props.groups, group => {
            return {
                label: group.nameOfEnrichmentDirection
                    ? group.nameOfEnrichmentDirection
                    : group.name,
                value: group.name,
            };
        });
    }

    @computed get selectedRow() {
        if (this.clickedEntityStableId) {
            return this.props.data.filter(
                d => d.stableId === this.clickedEntityStableId
            )[0];
        }
        return undefined;
    }

    public render() {
        if (this.props.data.length === 0) {
            return (
                <div className={'alert alert-info'}>
                    No data/result available
                </div>
            );
        }

        const data: any[] = getGenericAssayScatterData(this.data);
        const maxData: any = _.maxBy(data, d => {
            return Math.ceil(Math.abs(d.x));
        });

        return (
            <div className={styles.Container}>
                <div className={styles.ChartsPanel}>
                    {this.isTwoGroupAnalysis && (
                        <GenericAssayMiniScatterChart
                            data={data}
                            selectedSet={this.selectedEntitiesSet}
                            xAxisLeftLabel={
                                this.group2.nameOfEnrichmentDirection ||
                                this.group2.name
                            }
                            xAxisRightLabel={
                                this.group1.nameOfEnrichmentDirection ||
                                this.group1.name
                            }
                            xAxisDomain={Math.ceil(Math.abs(maxData.x))}
                            xAxisTickValues={null}
                            onGenericAssayEntityClick={this.onEntityClick}
                            onSelection={this.onSelection}
                            onSelectionCleared={this.onSelectionCleared}
                            genericAssayType={this.props.genericAssayType}
                        />
                    )}
                    <ExpressionEnrichmentsBoxPlot
                        selectedProfile={this.props.selectedProfile}
                        groups={this.props.groups}
                        sampleKeyToSample={this.props.sampleKeyToSample}
                        selectedRow={this.selectedRow}
                        genericAssayType={this.props.genericAssayType}
                    />
                </div>

                <div className={styles.TableContainer}>
                    <hr
                        style={{
                            marginTop: 0,
                            marginBottom: 5,
                            borderWidth: 2,
                        }}
                    />
                    <div className={styles.Checkboxes}>
                        <div style={{ width: 250, marginRight: 7 }}>
                            <CheckedSelect
                                name={'groupsSelector'}
                                placeholder={'High in ...'}
                                onChange={this.onChange}
                                options={this.options}
                                value={this.selectedValues}
                            />
                        </div>
                        <div className={styles.FlexCheckbox}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={this.significanceFilter}
                                    onClick={this.toggleSignificanceFilter}
                                />
                                Significant only
                            </label>
                        </div>
                    </div>
                    <GenericAssayEnrichmentsTable
                        data={this.filteredData}
                        onEntityClick={this.onEntityClick}
                        dataStore={this.dataStore}
                        mutexTendency={this.props.alteredVsUnalteredMode}
                        visibleOrderedColumnNames={
                            this.visibleOrderedColumnNames
                        }
                        customColumns={_.keyBy(
                            this.customColumns,
                            column => column.uniqueName || column.name
                        )}
                        genericAssayType={this.props.genericAssayType}
                        groupSize={this.props.groups.length}
                    />
                </div>
            </div>
        );
    }
}
