import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, computed, action, makeObservable } from 'mobx';
import styles from './styles.module.scss';
import {
    MolecularProfile,
    Sample,
    GenericAssayBinaryEnrichment,
} from 'cbioportal-ts-api-client';
import {
    getGenericAssayBinaryEnrichmentRowData,
    getGenericAssayBinaryEnrichmentColumns,
    getGenericAssayBinaryScatterData,
    getFilteredData,
    getGaBinaryFrequencyScatterData,
} from 'pages/resultsView/enrichments/EnrichmentsUtil';
import _ from 'lodash';
import autobind from 'autobind-decorator';
import { MiniOncoprint } from 'shared/components/miniOncoprint/MiniOncoprint';
import {
    CheckedSelect,
    Option,
    DefaultTooltip,
} from 'cbioportal-frontend-commons';
import GenericAssayBinaryEnrichmentsTable, {
    GenericAssayBinaryEnrichmentTableColumnType,
} from './GenericAssayBinaryEnrichmentsTable';
import { GenericAssayBinaryEnrichmentsTableDataStore } from './GenericAssayBinaryEnrichmentsTableDataStore';
import { GenericAssayBinaryEnrichmentRow } from 'shared/model/EnrichmentRow';
import { EnrichmentAnalysisComparisonGroup } from 'pages/groupComparison/GroupComparisonUtils';
import GenericAssayMiniScatterChart from './GenericAssayMiniScatterChart';
import MiniFrequencyScatterChart from './MiniFrequencyScatterChart';
import WindowStore from 'shared/components/window/WindowStore';
import GenericAssayBarPlot from './GenericAssayBarPlot';

export interface IGenericAssayBinaryEnrichmentsContainerProps {
    data: GenericAssayBinaryEnrichment[];
    selectedProfile: MolecularProfile;
    groups: EnrichmentAnalysisComparisonGroup[];
    sampleKeyToSample: {
        [uniqueSampleKey: string]: Sample;
    };
    genericAssayType: string;
    alteredVsUnalteredMode?: boolean;
    patientLevelEnrichments: boolean;
    onSetPatientLevelEnrichments: (patientLevel: boolean) => void;
}

@observer
export default class GenericAssayBinaryEnrichmentsContainer extends React.Component<
    IGenericAssayBinaryEnrichmentsContainerProps,
    {}
> {
    constructor(props: IGenericAssayBinaryEnrichmentsContainerProps) {
        super(props);
        makeObservable(this);
    }

    static defaultProps: Partial<
        IGenericAssayBinaryEnrichmentsContainerProps
    > = {
        alteredVsUnalteredMode: true,
    };

    @observable significanceFilter: boolean = false;
    @observable.ref clickedEntityStableId: string;
    @observable.ref selectedStableIds: string[] | null;
    @observable.ref highlightedRow: GenericAssayBinaryEnrichmentRow | undefined;
    @observable.ref _enrichedGroups: string[] = this.props.groups.map(
        group => group.name
    );

    @computed get data(): GenericAssayBinaryEnrichmentRow[] {
        return getGenericAssayBinaryEnrichmentRowData(
            this.props.data,
            this.props.groups
        );
    }

    @computed get filteredData(): GenericAssayBinaryEnrichmentRow[] {
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

    private dataStore = new GenericAssayBinaryEnrichmentsTableDataStore(
        () => {
            return this.filteredData;
        },
        () => {
            return this.highlightedRow;
        },
        (c: GenericAssayBinaryEnrichmentRow) => {
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

    @computed get group1QueriedCasesCount() {
        let caseIds: Set<string> = new Set(
            this.group1.samples.map(sample =>
                this.props.patientLevelEnrichments
                    ? sample.uniquePatientKey
                    : sample.uniqueSampleKey
            )
        );
        return caseIds.size;
    }

    @computed get group2QueriedCasesCount() {
        let caseIds: Set<string> = new Set(
            this.group2.samples.map(sample =>
                this.props.patientLevelEnrichments
                    ? sample.uniquePatientKey
                    : sample.uniqueSampleKey
            )
        );
        return caseIds.size;
    }

    @computed get selectedEntitiesSet() {
        return _.keyBy(this.selectedStableIds || []);
    }

    @computed get isTwoGroupAnalysis(): boolean {
        return this.props.groups.length == 2;
    }

    @computed get customColumns() {
        const cols = getGenericAssayBinaryEnrichmentColumns(
            this.props.groups,
            this.props.alteredVsUnalteredMode
        );
        if (this.isTwoGroupAnalysis) {
            cols.push({
                name: 'Alteration Overlap',
                headerRender: () => <span>Co-occurrence Pattern</span>,
                render: data => {
                    if (data.pValue === undefined) {
                        return <span>-</span>;
                    }
                    const groups = _.map(data.groupsSet);
                    // we want to order groups according to order in prop.groups
                    const group1 = groups.find(
                        group => group.name === this.props.groups[0].name
                    )!;
                    const group2 = groups.find(
                        group => group.name === this.props.groups[1].name
                    )!;

                    if (!group1 || !group2) {
                        throw 'No matching groups in Alteration Overlap Cell';
                    }

                    const totalQueriedCases =
                        this.group1QueriedCasesCount +
                        this.group2QueriedCasesCount;
                    const group1Width =
                        (this.group1QueriedCasesCount / totalQueriedCases) *
                        100;
                    const group2Width = 100 - group1Width;
                    const group1Unprofiled =
                        ((this.group1QueriedCasesCount - group1.totalCount) /
                            totalQueriedCases) *
                        100;
                    const group1Unaltered =
                        ((group1.totalCount - group1.count) /
                            totalQueriedCases) *
                        100;
                    const group2Unprofiled =
                        ((this.group2QueriedCasesCount - group2.totalCount) /
                            totalQueriedCases) *
                        100;
                    const group1Altered =
                        (group1.count / totalQueriedCases) * 100;
                    const group2Altered =
                        (group2.count / totalQueriedCases) * 100;

                    const alterationLanguage = 'alterations';

                    const overlay = () => {
                        return (
                            <div>
                                <h3>
                                    {data.entityName} {alterationLanguage} in:
                                </h3>
                                <table className={'table table-striped'}>
                                    <tbody>
                                        <tr>
                                            <td>
                                                <strong>{group1.name}: </strong>
                                            </td>
                                            <td>
                                                {group1.count} of{' '}
                                                {group1.totalCount} of profiled{' '}
                                                {this.props
                                                    .patientLevelEnrichments
                                                    ? 'patients'
                                                    : 'samples'}{' '}
                                                (
                                                {numeral(
                                                    group1.alteredPercentage
                                                ).format('0.0')}
                                                %)
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <strong>{group2.name}: </strong>
                                            </td>
                                            <td>
                                                {group2.count} of{' '}
                                                {group2.totalCount} of profiled{' '}
                                                {this.props
                                                    .patientLevelEnrichments
                                                    ? 'patients'
                                                    : 'samples'}{' '}
                                                (
                                                {numeral(
                                                    group2.alteredPercentage
                                                ).format('0.0')}
                                                %)
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        );
                    };

                    return (
                        <DefaultTooltip
                            destroyTooltipOnHide={true}
                            trigger={['hover']}
                            overlay={overlay}
                        >
                            <div
                                className={'inlineBlock'}
                                style={{ padding: '3px 0' }}
                            >
                                <MiniOncoprint
                                    group1Width={group1Width}
                                    group2Width={group2Width}
                                    group1Unaltered={group1Unaltered}
                                    group1Altered={group1Altered}
                                    group2Altered={group2Altered}
                                    group1Unprofiled={group1Unprofiled}
                                    group2Unprofiled={group2Unprofiled}
                                    group1Color={this.props.groups[0].color}
                                    group2Color={this.props.groups[1].color}
                                    width={150}
                                />
                            </div>
                        </DefaultTooltip>
                    );
                },
                tooltip: (
                    <table>
                        <tr>
                            <td>Upper row</td>
                            <td>
                                :{' '}
                                {this.props.patientLevelEnrichments
                                    ? 'Patients'
                                    : 'Samples'}{' '}
                                colored according to group.
                            </td>
                        </tr>
                        <tr>
                            <td>Lower row</td>
                            <td>
                                :{' '}
                                {this.props.patientLevelEnrichments
                                    ? 'Patients'
                                    : 'Samples'}{' '}
                                with an alteration in the listed gene are
                                highlighted.
                            </td>
                        </tr>
                    </table>
                ),
            });
        }

        return cols;
    }

    @computed private get entityPlotMaxWidth() {
        //820 include width of two scatter plots
        return WindowStore.size.width - (this.isTwoGroupAnalysis ? 820 : 40);
    }

    @computed private get gaBarplotYAxislabel() {
        return this.props.selectedProfile.name + ' altered ratio';
    }

    @computed private get categoryToColor() {
        return _.reduce(
            this.props.groups,
            (acc, next) => {
                if (next.color) {
                    acc[next.name] = next.color;
                }
                return acc;
            },
            {} as { [id: string]: string }
        );
    }
    @computed get visibleOrderedColumnNames() {
        const columns = [];
        columns.push(GenericAssayBinaryEnrichmentTableColumnType.ENTITY_ID);

        this.props.groups.forEach(group => {
            columns.push(group.name);
        });

        if (this.isTwoGroupAnalysis) {
            columns.push('Alteration Overlap');
            columns.push(GenericAssayBinaryEnrichmentTableColumnType.LOG_RATIO);
        }

        columns.push(
            GenericAssayBinaryEnrichmentTableColumnType.P_VALUE,
            GenericAssayBinaryEnrichmentTableColumnType.Q_VALUE
        );

        if (this.isTwoGroupAnalysis) {
            columns.push(
                this.props.alteredVsUnalteredMode
                    ? GenericAssayBinaryEnrichmentTableColumnType.TENDENCY
                    : GenericAssayBinaryEnrichmentTableColumnType.ENRICHED
            );
        } else {
            columns.push(
                GenericAssayBinaryEnrichmentTableColumnType.MOST_ENRICHED
            );
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

        const data: any[] = getGenericAssayBinaryScatterData(this.data);
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
                    {this.isTwoGroupAnalysis && (
                        <MiniFrequencyScatterChart
                            data={getGaBinaryFrequencyScatterData(
                                this.data,
                                this.group1.name,
                                this.group2.name
                            )}
                            xGroupName={this.group1.name}
                            yGroupName={this.group2.name}
                            onGeneNameClick={this.onEntityClick}
                            selectedGenesSet={this.selectedEntitiesSet}
                            onSelection={this.onSelection}
                            onSelectionCleared={this.onSelectionCleared}
                            yAxisLablePrefix="Frequency"
                        />
                    )}
                    <div style={{ maxWidth: this.entityPlotMaxWidth }}>
                        <GenericAssayBarPlot
                            data={this.data}
                            isTwoGroupAnalysis={this.isTwoGroupAnalysis}
                            groupOrder={this.props.groups.map(
                                group => group.name
                            )}
                            yAxisLabel={this.gaBarplotYAxislabel}
                            categoryToColor={this.categoryToColor}
                            dataStore={this.dataStore}
                        />
                    </div>
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
                    <GenericAssayBinaryEnrichmentsTable
                        data={this.filteredData}
                        onEntityClick={this.onEntityClick}
                        dataStore={this.dataStore}
                        mutexTendency={this.props.alteredVsUnalteredMode}
                        visibleOrderedColumnNames={
                            this.visibleOrderedColumnNames
                        }
                        customColumns={_.keyBy(
                            this.customColumns,
                            column => column.name
                        )}
                        genericAssayType={this.props.genericAssayType}
                        groupSize={this.props.groups.length}
                    />
                </div>
            </div>
        );
    }
}
