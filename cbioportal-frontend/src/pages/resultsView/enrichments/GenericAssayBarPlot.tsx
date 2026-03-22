import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, action, computed, makeObservable } from 'mobx';
import {
    DownloadControls,
    DefaultTooltip,
    DownloadControlOption,
} from 'cbioportal-frontend-commons';
import autobind from 'autobind-decorator';
import MultipleCategoryBarPlot from 'shared/components/plots/MultipleCategoryBarPlot';
import ReactSelect from 'react-select';
import _ from 'lodash';
import {
    getEnrichmentBarPlotData,
    getGaBinarydataListOptions,
    GaBinaryOptionLabel,
} from './EnrichmentsUtil';
import styles from './frequencyPlotStyles.module.scss';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { FormControl } from 'react-bootstrap';
import { GenericAssayBinaryEnrichmentsTableDataStore } from './GenericAssayBinaryEnrichmentsTableDataStore';
import { GenericAssayBinaryEnrichmentRow } from 'shared/model/EnrichmentRow';
import { getServerConfig } from 'config/config';

export interface IGenericAssayBarPlotProps {
    data: GenericAssayBinaryEnrichmentRow[];
    groupOrder?: string[];
    isTwoGroupAnalysis?: boolean;
    yAxisLabel: string;
    categoryToColor?: {
        [id: string]: string;
    };
    dataStore: GenericAssayBinaryEnrichmentsTableDataStore;
}
export declare type SingleEntityQuery = {
    entity: string;
};
const DEFAULT_ENTITIES_COUNT = 10;

const MAXIMUM_ALLOWED_ENTITIES = 100;

const CHART_BAR_WIDTH = 10;

@observer
export default class GenericAssayBarPlot extends React.Component<
    IGenericAssayBarPlotProps,
    {}
> {
    @observable tooltipModel: any;
    @observable.ref _entityQuery: string | undefined = undefined;
    @observable selectedEntities: SingleEntityQuery[] | undefined;
    @observable numberOfEntities: Number | undefined = 0;
    @observable _label: GaBinaryOptionLabel | undefined;
    @observable isEntitySelectionPopupVisible: boolean | undefined = false;
    @observable private svgContainer: SVGElement | null;

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @computed get entityListOptions() {
        return getGaBinarydataListOptions(this.props.data);
    }

    @computed get defaultOption() {
        return this.entityListOptions.length > 1
            ? this.entityListOptions[1]
            : this.entityListOptions[0];
    }

    @computed get gaBinaryDataSet() {
        return _.keyBy(this.props.data, datum => {
            return datum.entityName;
        });
    }

    @computed get barPlotData() {
        return getEnrichmentBarPlotData(
            this.gaBinaryDataSet,
            this.barPlotOrderedEntities
        );
    }

    @computed get barPlotOrderedEntities() {
        let entities: string[] = [];
        if (this._label === GaBinaryOptionLabel.SYNC_WITH_TABLE) {
            return this.tableSelectedEntities;
        }
        if (!this.selectedEntities) {
            entities = this.defaultOption.entities.slice(
                0,
                DEFAULT_ENTITIES_COUNT
            );
        } else {
            entities = this.selectedEntities
                .slice(0, Number(this.numberOfEntities))
                .map(entityWithAlteration => entityWithAlteration.entity);
        }
        return entities;
    }

    @computed get horzCategoryOrder() {
        //include significant entities
        return _.flatMap(this.barPlotOrderedEntities, entity => [
            entity + '*',
            entity,
        ]);
    }

    @autobind
    private getTooltip(datum: any) {
        let entityName = datum.majorCategory as string;
        // get rid of a trailing *
        entityName = entityName.replace(/\*$/, '');
        let entityData = this.gaBinaryDataSet[entityName];
        //use groupOrder inorder of sorted groups
        let groupRows = _.map(this.props.groupOrder, groupName => {
            const group = entityData.groupsSet[groupName];
            let style: any = {};
            //bold row corresponding to highlighed bar
            if (datum.minorCategory === group.name) {
                style = { fontWeight: 'bold' };
            }
            return (
                <tr style={style}>
                    <td>{group.name}</td>
                    <td>
                        {group.alteredPercentage.toFixed(2)}% ({group.count}/
                        {group.totalCount})
                    </td>
                </tr>
            );
        });

        return (
            <div>
                <strong>
                    {entityName} {this.props.yAxisLabel}
                </strong>
                <br />
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th scope="col">Group</th>
                            <th scope="col">Percentage Altered</th>
                        </tr>
                    </thead>
                    <tbody>{groupRows}</tbody>
                </table>
                <strong>p-Value</strong>:{' '}
                {entityData.pValue
                    ? toConditionalPrecision(entityData.pValue, 3, 0.01)
                    : '-'}
                <br />
                <strong>q-Value</strong>:{' '}
                {entityData.qValue
                    ? toConditionalPrecision(entityData.qValue, 3, 0.01)
                    : '-'}
            </div>
        );
    }

    @computed private get selectedOption() {
        if (this._label && this._entityQuery !== undefined) {
            return {
                label: this._label,
                value: this._entityQuery,
            };
        }
        //default option
        return {
            label: this.defaultOption.label,
            value: this.defaultOption.entities
                .slice(0, DEFAULT_ENTITIES_COUNT)
                .join('\n'),
        };
    }

    @computed get toolbar() {
        return (
            <React.Fragment>
                <div
                    style={{
                        zIndex: 10,
                        position: 'absolute',
                        top: '10px',
                        left: '15px',
                    }}
                >
                    <strong>{this.selectedOption.label}</strong>
                </div>
                <div
                    style={{
                        zIndex: 10,
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                    }}
                >
                    <div className={styles.ChartControls}>
                        <DefaultTooltip
                            trigger={['click']}
                            destroyTooltipOnHide={false}
                            visible={this.isEntitySelectionPopupVisible}
                            onVisibleChange={visible => {
                                this.isEntitySelectionPopupVisible = visible;
                            }}
                            overlay={
                                <EntitySelection
                                    tableData={this.selectedEntities}
                                    options={this.entityListOptions}
                                    selectedOption={this.selectedOption}
                                    onSelectedEntitiesChange={(
                                        value,
                                        entities,
                                        number,
                                        label
                                    ) => {
                                        this._entityQuery = value;
                                        this.selectedEntities = entities;
                                        this._label = label;
                                        this.numberOfEntities = number;
                                        this.isEntitySelectionPopupVisible = false;
                                    }}
                                    defaultNumberOfEntities={
                                        DEFAULT_ENTITIES_COUNT
                                    }
                                />
                            }
                            placement="bottomLeft"
                        >
                            <div>
                                <button
                                    data-test="selectGenes"
                                    className="btn btn-default btn-xs"
                                >
                                    Select entities
                                </button>
                            </div>
                        </DefaultTooltip>
                        <DownloadControls
                            getSvg={() => this.svgContainer}
                            filename={'GroupComparisonGeneFrequencyPlot'}
                            dontFade={true}
                            type="button"
                            showDownload={
                                getServerConfig()
                                    .skin_hide_download_controls ===
                                DownloadControlOption.SHOW_ALL
                            }
                        />
                    </div>
                </div>
            </React.Fragment>
        );
    }

    @computed private get tableSelectedEntities() {
        if (this.props.dataStore.visibleData !== null) {
            return this.props.dataStore.visibleData
                .map(x => x.entityName)
                .slice(0, MAXIMUM_ALLOWED_ENTITIES);
        }
        return [];
    }

    public render() {
        return (
            <div
                data-test="GenericAssayBarPlotDiv"
                className="borderedChart"
                style={{ position: 'relative', display: 'inline-block' }}
            >
                {this.toolbar}
                <div style={{ overflow: 'auto hidden', position: 'relative' }}>
                    <MultipleCategoryBarPlot
                        barWidth={CHART_BAR_WIDTH}
                        domainPadding={CHART_BAR_WIDTH}
                        chartBase={300}
                        legendLocationWidthThreshold={800}
                        ticksCount={6}
                        horizontalBars={false}
                        percentage={false}
                        stacked={false}
                        plotData={this.barPlotData}
                        axisStyle={{ tickLabels: { fontSize: 10 } }}
                        horzCategoryOrder={this.horzCategoryOrder}
                        vertCategoryOrder={this.props.groupOrder}
                        countAxisLabel={`${this.props.yAxisLabel} (%)`}
                        tooltip={this.getTooltip}
                        categoryToColor={this.props.categoryToColor}
                        svgRef={ref => (this.svgContainer = ref)}
                    />
                </div>
            </div>
        );
    }
}

interface IEntitySelectionProps {
    tableData: SingleEntityQuery[];
    options: { label: GaBinaryOptionLabel; entities: string[] }[];
    selectedOption?: { label: GaBinaryOptionLabel; value: string };
    onSelectedEntitiesChange: (
        value: string,
        orderedEntities: SingleEntityQuery[],
        numberOfEntities: Number,
        label: GaBinaryOptionLabel
    ) => void;
    defaultNumberOfEntities: number;
    maxNumberOfEntities?: number;
}

@observer
export class EntitySelection extends React.Component<
    IEntitySelectionProps,
    {}
> {
    static defaultProps: Partial<IEntitySelectionProps> = {
        maxNumberOfEntities: MAXIMUM_ALLOWED_ENTITIES,
    };

    constructor(props: IEntitySelectionProps) {
        super(props);
        makeObservable(this);
        (window as any).entitySelection = this;
    }

    @observable.ref _entityQuery: string | undefined = undefined;
    @observable selectedEntitiesHasError = false;
    @observable private numberOfEntities = this.props.defaultNumberOfEntities;
    @observable private _selectedEntityListOption:
        | {
              label: GaBinaryOptionLabel;
              value: string;
              entities: string[];
          }
        | undefined;
    @observable.ref entitiesToPlot: SingleEntityQuery[] = [];

    @computed get entityListOptions() {
        return _.map(this.props.options, option => {
            return {
                label: option.label,
                value: option.entities.join('\n'),
            };
        });
    }

    @computed get entityOptionSet() {
        return _.keyBy(this.props.options, option => option.label);
    }

    @computed get selectedEntityListOption() {
        if (
            this._selectedEntityListOption === undefined &&
            this.props.selectedOption
        ) {
            const selectedOption = this.props.selectedOption;
            return this.entityListOptions.find(opt =>
                opt.value.startsWith(selectedOption.value)
            );
        }
        return this._selectedEntityListOption;
    }

    @computed get entityQuery() {
        return this._entityQuery === undefined && this.props.selectedOption
            ? this.props.selectedOption.value
            : this._entityQuery || '';
    }

    @computed get hasUnsupportedOQL() {
        return false;
    }

    @computed get addGenesButtonDisabled() {
        if (this.inSyncMode) {
            return (
                this.props.selectedOption !== undefined &&
                this.props.selectedOption.label ===
                    GaBinaryOptionLabel.SYNC_WITH_TABLE
            );
        } else {
            return (
                this.hasUnsupportedOQL ||
                (this.props.selectedOption &&
                    this.props.selectedOption.value === this._entityQuery) ||
                this.selectedEntitiesHasError ||
                _.isEmpty(this._entityQuery)
            );
        }
    }

    @action.bound
    public onEntityListOptionChange(option: any) {
        this._selectedEntityListOption = option;
        if (option.value !== '') {
            const entities = this.entityOptionSet[option.label].entities;
            this._entityQuery = entities
                .slice(0, this.numberOfEntities)
                .join('\n');
        } else {
            this._entityQuery = '';
        }
        this.updateEntityQuery();
    }

    @computed private get inSyncMode() {
        return (
            this._selectedEntityListOption &&
            this._selectedEntityListOption.label ===
                GaBinaryOptionLabel.SYNC_WITH_TABLE
        );
    }

    @action.bound
    private handleTotalInputChange(e: any) {
        const newCount: number = e.target.value.replace(/[^0-9]/g, '');
        if (newCount <= this.props.maxNumberOfEntities!) {
            this.numberOfEntities = newCount;
        }
    }

    @action.bound
    private handleTotalInputKeyPress(target: any) {
        if (target.charCode === 13) {
            if (isNaN(this.numberOfEntities)) {
                this.numberOfEntities = 0;
                return;
            }
            this.updateEntityQuery();
        }
    }

    @action.bound
    private onBlur() {
        if (isNaN(this.numberOfEntities)) {
            this.numberOfEntities = 0;
            return;
        }
        this.updateEntityQuery();
    }

    @action.bound
    private updateEntityQuery() {
        //removes leading 0s
        this.numberOfEntities = Number(this.numberOfEntities);
        if (this.selectedEntityListOption) {
            const label = this.selectedEntityListOption.label;
            const entities = this.entityOptionSet[label].entities;
            if (entities.length > 0) {
                this._entityQuery = entities
                    .slice(0, this.numberOfEntities)
                    .join('\n');
                const tmp: SingleEntityQuery[] = [];
                for (const s of entities.slice(0, this.numberOfEntities)) {
                    tmp.push({
                        entity: s,
                    });
                }
                this.entitiesToPlot = tmp;
            }
        }
    }

    public render() {
        return (
            <div style={{ width: 300 }}>
                {this.props.options.length > 0 && (
                    <div data-test="genesSelector">
                        <ReactSelect
                            value={this.selectedEntityListOption}
                            options={this.entityListOptions}
                            onChange={this.onEntityListOptionChange}
                            isClearable={false}
                            isSearchable={false}
                        />
                    </div>
                )}
                {!this.inSyncMode && (
                    <div>
                        <br />
                        <div style={{ display: 'table-row' }}>
                            <label
                                style={{
                                    display: 'table-cell',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Number of Entities (max.{' '}
                                {this.props.maxNumberOfEntities}): &nbsp;
                            </label>
                            <FormControl
                                data-test="numberOfEntities"
                                type="text"
                                value={this.numberOfEntities}
                                onChange={this.handleTotalInputChange}
                                onKeyPress={this.handleTotalInputKeyPress}
                                onBlur={this.onBlur}
                            />
                        </div>
                    </div>
                )}
                <div>
                    <br />
                    <button
                        key="addGenestoBarPlot"
                        data-test="addGenestoBarPlot"
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                            this.props.onSelectedEntitiesChange(
                                this._entityQuery!,
                                this.entitiesToPlot,
                                this.numberOfEntities,
                                this.selectedEntityListOption!.label
                            );
                        }}
                        disabled={this.addGenesButtonDisabled}
                    >
                        Submit
                    </button>
                </div>
            </div>
        );
    }
}
