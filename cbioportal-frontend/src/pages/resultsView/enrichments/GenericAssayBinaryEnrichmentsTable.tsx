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
import { GenericAssayBinaryEnrichmentsTableDataStore } from './GenericAssayBinaryEnrichmentsTableDataStore';
import { GenericAssayBinaryEnrichmentRow } from 'shared/model/EnrichmentRow';
import { GENERIC_ASSAY_CONFIG } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import {
    deriveDisplayTextFromGenericAssayType,
    formatGenericAssayCompactLabelByNameAndId,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { ContinousDataPvalueTooltip } from './EnrichmentsUtil';

export interface IGenericAssayBinaryEnrichmentTableProps {
    genericAssayType: string;
    visibleOrderedColumnNames?: string[];
    customColumns?: { [id: string]: GenericAssayBinaryEnrichmentTableColumn };
    data: GenericAssayBinaryEnrichmentRow[];
    initialSortColumn?: string;
    dataStore: GenericAssayBinaryEnrichmentsTableDataStore;
    onEntityClick?: (stableId: string) => void;
    mutexTendency?: boolean;
    groupSize?: number;
}

export enum GenericAssayBinaryEnrichmentTableColumnType {
    ENTITY_ID = 'Entity ID',
    LOG_RATIO = 'Log Ratio',
    P_VALUE = 'P_VALUE',
    Q_VALUE = 'Q_VALUE',
    TENDENCY = 'Tendency',
    EXPRESSED = 'Higher in',
    MEAN_SUFFIX = ' mean',
    STANDARD_DEVIATION_SUFFIX = ' standard deviation',
    ENRICHED = 'Enriched in',
    MOST_ENRICHED = 'Most enriched in',
}

export type GenericAssayBinaryEnrichmentTableColumn = Column<
    GenericAssayBinaryEnrichmentRow
> & { order?: number };

@observer
export default class GenericAssayBinaryEnrichmentsTable extends React.Component<
    IGenericAssayBinaryEnrichmentTableProps,
    {}
> {
    constructor(props: IGenericAssayBinaryEnrichmentTableProps) {
        super(props);
        makeObservable(this);
    }

    public static defaultProps = {
        columns: [
            GenericAssayBinaryEnrichmentTableColumnType.ENTITY_ID,
            GenericAssayBinaryEnrichmentTableColumnType.P_VALUE,
            GenericAssayBinaryEnrichmentTableColumnType.Q_VALUE,
        ],
        initialSortColumn: 'q-Value',
        mutexTendency: true,
    };

    @autobind
    private onRowClick(d: GenericAssayBinaryEnrichmentRow) {
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
        [columnEnum: string]: GenericAssayBinaryEnrichmentTableColumn;
    } {
        const columns: {
            [columnEnum: string]: GenericAssayBinaryEnrichmentTableColumn;
        } = this.props.customColumns || {};

        columns[GenericAssayBinaryEnrichmentTableColumnType.ENTITY_ID] = {
            name: this.entityTitle,
            render: (d: GenericAssayBinaryEnrichmentRow) => {
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
                d: GenericAssayBinaryEnrichmentRow,
                filterString: string,
                filterStringUpper: string
            ) => d.entityName.toUpperCase().includes(filterStringUpper),
            sortBy: (d: GenericAssayBinaryEnrichmentRow) => d.entityName,
            download: (d: GenericAssayBinaryEnrichmentRow) => d.entityName,
        };

        columns[GenericAssayBinaryEnrichmentTableColumnType.P_VALUE] = {
            name: 'p-Value',
            render: (d: GenericAssayBinaryEnrichmentRow) => (
                <span style={{ whiteSpace: 'nowrap' }}>
                    {toConditionalPrecision(d.pValue, 3, 0.01)}
                </span>
            ),
            tooltip: (
                <ContinousDataPvalueTooltip groupSize={this.props.groupSize} />
            ),
            sortBy: (d: GenericAssayBinaryEnrichmentRow) => d.pValue,
            download: (d: GenericAssayBinaryEnrichmentRow) =>
                toConditionalPrecision(d.pValue, 3, 0.01),
        };

        columns[GenericAssayBinaryEnrichmentTableColumnType.Q_VALUE] = {
            name: 'q-Value',
            render: (d: GenericAssayBinaryEnrichmentRow) => (
                <span style={{ whiteSpace: 'nowrap' }}>
                    {formatSignificanceValueWithStyle(d.qValue)}
                </span>
            ),
            tooltip: <span>Derived from Benjamini-Hochberg procedure</span>,
            sortBy: (d: GenericAssayBinaryEnrichmentRow) => d.qValue,
            download: (d: GenericAssayBinaryEnrichmentRow) =>
                toConditionalPrecision(d.qValue, 3, 0.01),
        };
        return columns;
    }

    public render() {
        const orderedColumns = _.sortBy(
            this.props.visibleOrderedColumnNames!.map(
                column => this.columns[column]
            ),
            (c: GenericAssayBinaryEnrichmentTableColumn) => c.order
        );
        return (
            <LazyMobXTable
                initialItemsPerPage={20}
                paginationProps={{ itemsPerPageOptions: [20] }}
                columns={orderedColumns}
                data={this.props.data}
                initialSortColumn={this.props.initialSortColumn}
                dataStore={this.props.dataStore}
            />
        );
    }
}
