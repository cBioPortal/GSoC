import * as React from 'react';
import _ from 'lodash';
import LazyMobXTable, {
    Column,
} from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import { formatSignificanceValueWithStyle } from 'shared/lib/FormatUtils';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import styles from './styles.module.scss';
import autobind from 'autobind-decorator';
import { GenericAssayCategoricalEnrichmentsTableDataStore } from './GenericAssayCategoricalEnrichmentsTableDataStore';
import { GenericAssayCategoricalEnrichmentRow } from 'shared/model/EnrichmentRow';
import { GENERIC_ASSAY_CONFIG } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import {
    deriveDisplayTextFromGenericAssayType,
    formatGenericAssayCompactLabelByNameAndId,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { ContinousDataPvalueTooltip } from './EnrichmentsUtil';

export interface IGenericAssayCategoricalEnrichmentTableProps {
    genericAssayType: string;
    visibleOrderedColumnNames?: string[];
    customColumns?: {
        [id: string]: GenericAssayCategoricalEnrichmentTableColumn;
    };
    data: GenericAssayCategoricalEnrichmentRow[];
    initialSortColumn?: string;
    dataStore: GenericAssayCategoricalEnrichmentsTableDataStore;
    onEntityClick?: (stableId: string) => void;
    mutexTendency?: boolean;
    groupSize?: number;
}

export enum GenericAssayCategoricalEnrichmentTableColumnType {
    ENTITY_ID = 'Entity ID',
    P_VALUE = 'P_VALUE',
    Q_VALUE = 'Q_VALUE',
    ATTRIBUTE_TYPE = 'Attribute Type',
    STATISTICAL_TEST_NAME = 'Statistical Test',
}

export type GenericAssayCategoricalEnrichmentTableColumn = Column<
    GenericAssayCategoricalEnrichmentRow
> & { order?: number };

@observer
export default class GenericAssayCategoricalEnrichmentsTable extends React.Component<
    IGenericAssayCategoricalEnrichmentTableProps,
    {}
> {
    constructor(props: IGenericAssayCategoricalEnrichmentTableProps) {
        super(props);
        makeObservable(this);
    }

    public static defaultProps = {
        columns: [
            GenericAssayCategoricalEnrichmentTableColumnType.ENTITY_ID,
            GenericAssayCategoricalEnrichmentTableColumnType.ATTRIBUTE_TYPE,
            GenericAssayCategoricalEnrichmentTableColumnType.STATISTICAL_TEST_NAME,
            GenericAssayCategoricalEnrichmentTableColumnType.P_VALUE,
            GenericAssayCategoricalEnrichmentTableColumnType.Q_VALUE,
        ],
        initialSortColumn: 'q-Value',
        mutexTendency: true,
    };

    @autobind
    private onRowClick(d: GenericAssayCategoricalEnrichmentRow) {
        this.props.onEntityClick!(d.stableId);
        this.props.dataStore.setHighlighted(d);
    }

    private get entityTitle() {
        return (
            GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
                this.props.genericAssayType
            ]?.globalConfig?.entityTitle ||
            deriveDisplayTextFromGenericAssayType(this.props.genericAssayType)
        );
    }

    @computed get columns(): {
        [columnEnum: string]: GenericAssayCategoricalEnrichmentTableColumn;
    } {
        const columns: {
            [columnEnum: string]: GenericAssayCategoricalEnrichmentTableColumn;
        } = {};

        columns[GenericAssayCategoricalEnrichmentTableColumnType.ENTITY_ID] = {
            name: this.entityTitle,
            render: (d: GenericAssayCategoricalEnrichmentRow) => {
                return (
                    <span className={styles.StableId}>
                        <b>
                            {formatGenericAssayCompactLabelByNameAndId(
                                d.stableId,
                                d.entityName
                            )}
                        </b>
                    </span>
                );
            },
            tooltip: <span>{this.entityTitle}</span>,
            filter: (
                d: GenericAssayCategoricalEnrichmentRow,
                filterString: string,
                filterStringUpper: string
            ) => d.entityName.toUpperCase().includes(filterStringUpper),
            sortBy: (d: GenericAssayCategoricalEnrichmentRow) => d.entityName,
            download: (d: GenericAssayCategoricalEnrichmentRow) => d.entityName,
        };

        columns[
            GenericAssayCategoricalEnrichmentTableColumnType.ATTRIBUTE_TYPE
        ] = {
            name:
                GenericAssayCategoricalEnrichmentTableColumnType.ATTRIBUTE_TYPE,
            render: (d: GenericAssayCategoricalEnrichmentRow) => (
                <span>{d.attributeType}</span>
            ),
            tooltip: <span>Attribute Type</span>,
            sortBy: (d: GenericAssayCategoricalEnrichmentRow) =>
                String(d.attributeType),
            download: (d: GenericAssayCategoricalEnrichmentRow) =>
                d.attributeType,
        };

        columns[
            GenericAssayCategoricalEnrichmentTableColumnType.STATISTICAL_TEST_NAME
        ] = {
            name:
                GenericAssayCategoricalEnrichmentTableColumnType.STATISTICAL_TEST_NAME,
            render: (d: GenericAssayCategoricalEnrichmentRow) => (
                <span>{d.statisticalTest}</span>
            ),
            tooltip: <span>Statistic Test</span>,
            sortBy: (d: GenericAssayCategoricalEnrichmentRow) =>
                String(d.statisticalTest),
            download: (d: GenericAssayCategoricalEnrichmentRow) =>
                d.statisticalTest,
        };

        columns[GenericAssayCategoricalEnrichmentTableColumnType.P_VALUE] = {
            name: 'p-Value',
            render: (d: GenericAssayCategoricalEnrichmentRow) => (
                <span style={{ whiteSpace: 'nowrap' }}>
                    {toConditionalPrecision(d.pValue, 3, 0.01)}
                </span>
            ),
            tooltip: (
                <ContinousDataPvalueTooltip groupSize={this.props.groupSize} />
            ),
            sortBy: (d: GenericAssayCategoricalEnrichmentRow) => d.pValue,
            download: (d: GenericAssayCategoricalEnrichmentRow) =>
                toConditionalPrecision(d.pValue, 3, 0.01),
        };

        columns[GenericAssayCategoricalEnrichmentTableColumnType.Q_VALUE] = {
            name: 'q-Value',
            render: (d: GenericAssayCategoricalEnrichmentRow) => (
                <span style={{ whiteSpace: 'nowrap' }}>
                    {formatSignificanceValueWithStyle(d.qValue)}
                </span>
            ),
            tooltip: <span>Derived from Benjamini-Hochberg procedure</span>,
            sortBy: (d: GenericAssayCategoricalEnrichmentRow) => d.qValue,
            download: (d: GenericAssayCategoricalEnrichmentRow) =>
                toConditionalPrecision(d.qValue, 3, 0.01),
        };
        return columns;
    }

    public render() {
        const orderedColumns = _.sortBy(
            this.props.visibleOrderedColumnNames!.map(
                column => this.columns[column]
            ),
            (c: GenericAssayCategoricalEnrichmentTableColumn) => c.order
        );

        return (
            <LazyMobXTable
                initialItemsPerPage={20}
                paginationProps={{ itemsPerPageOptions: [20] }}
                columns={orderedColumns}
                data={this.props.data}
                initialSortColumn={this.props.initialSortColumn}
                onRowClick={
                    // this.props.onEntityClick ? this.onRowClick : undefined
                    this.onRowClick
                }
                dataStore={this.props.dataStore}
            />
        );
    }
}
