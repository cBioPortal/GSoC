import * as React from 'react';
import _ from 'lodash';
import LazyMobXTable, {
    Column,
} from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import { Checkbox } from 'react-bootstrap';
import { formatSignificanceValueWithStyle } from 'shared/lib/FormatUtils';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import styles from './styles.module.scss';
import { ExpressionEnrichmentRow } from 'shared/model/EnrichmentRow';
import { cytobandFilter } from 'pages/resultsView/ResultsViewTableUtils';
import autobind from 'autobind-decorator';
import { EnrichmentsTableDataStore } from 'pages/resultsView/enrichments/EnrichmentsTableDataStore';
import { ContinousDataPvalueTooltip } from './EnrichmentsUtil';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';

export interface IExpressionEnrichmentTableProps {
    visibleOrderedColumnNames?: string[];
    customColumns?: { [id: string]: ExpressionEnrichmentTableColumn };
    data: ExpressionEnrichmentRow[];
    initialSortColumn?: string;
    dataStore: EnrichmentsTableDataStore;
    onCheckGene?: (hugoGeneSymbol: string) => void;
    onGeneNameClick?: (hugoGeneSymbol: string, entrezGeneId: number) => void;
    checkedGenes?: string[];
    mutexTendency?: boolean;
    groupSize?: number;
}

export enum ExpressionEnrichmentTableColumnType {
    GENE = 'GENE',
    CYTOBAND = 'CYTOBAND',
    LOG_RATIO = 'Log2 Ratio',
    P_VALUE = 'P_VALUE',
    Q_VALUE = 'Q_VALUE',
    TENDENCY = 'Tendency',
    EXPRESSED = 'Higher expression in',
    METHYLATION = 'Higher methylation in',
    MEAN_SUFFIX = ' mean',
    STANDARD_DEVIATION_SUFFIX = ' standard deviation',
}

export type ExpressionEnrichmentTableColumn = Column<
    ExpressionEnrichmentRow
> & { uniqueName?: string; order?: number };

@observer
export default class ExpressionEnrichmentTable extends React.Component<
    IExpressionEnrichmentTableProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps = {
        columns: [
            ExpressionEnrichmentTableColumnType.GENE,
            ExpressionEnrichmentTableColumnType.CYTOBAND,
            ExpressionEnrichmentTableColumnType.P_VALUE,
            ExpressionEnrichmentTableColumnType.Q_VALUE,
        ],
        initialSortColumn: 'q-Value',
        mutexTendency: true,
    };

    private checkboxChange(hugoGeneSymbol: string) {
        const row: ExpressionEnrichmentRow = _.find(this.props.data, {
            hugoGeneSymbol,
        })!;
        row.checked = !row.checked;
        this.props.onCheckGene!(hugoGeneSymbol);
    }

    @autobind
    private onRowClick(d: ExpressionEnrichmentRow) {
        this.props.onGeneNameClick!(d.hugoGeneSymbol, d.entrezGeneId);
        this.props.dataStore.setHighlighted(d);
    }

    @computed get columns(): {
        [columnEnum: string]: ExpressionEnrichmentTableColumn;
    } {
        const columns: {
            [columnEnum: string]: ExpressionEnrichmentTableColumn;
        } = this.props.customColumns || {};

        columns[ExpressionEnrichmentTableColumnType.GENE] = {
            name: 'Gene',
            render: (d: ExpressionEnrichmentRow) => (
                <div style={{ display: 'flex' }}>
                    {this.props.onCheckGene && this.props.checkedGenes && (
                        <Checkbox
                            checked={this.props.checkedGenes.includes(
                                d.hugoGeneSymbol
                            )}
                            disabled={d.disabled}
                            key={d.hugoGeneSymbol}
                            className={styles.Checkbox}
                            onChange={() => {
                                this.checkboxChange(d.hugoGeneSymbol);
                            }}
                            onClick={e => {
                                e.stopPropagation();
                            }}
                            title={
                                d.disabled
                                    ? 'This is one of the query genes'
                                    : ''
                            }
                        />
                    )}
                    <span className={styles.GeneName}>
                        <b>{d.hugoGeneSymbol}</b>
                    </span>
                </div>
            ),
            tooltip: <span>Gene</span>,
            filter: (
                d: ExpressionEnrichmentRow,
                filterString: string,
                filterStringUpper: string
            ) => d.hugoGeneSymbol.toUpperCase().includes(filterStringUpper),
            sortBy: (d: ExpressionEnrichmentRow) => d.hugoGeneSymbol,
            download: (d: ExpressionEnrichmentRow) => d.hugoGeneSymbol,
        };

        columns[ExpressionEnrichmentTableColumnType.CYTOBAND] = {
            name: 'Cytoband',
            render: (d: ExpressionEnrichmentRow) => <span>{d.cytoband}</span>,
            tooltip: <span>Cytoband</span>,
            filter: cytobandFilter,
            sortBy: (d: ExpressionEnrichmentRow) => d.cytoband,
            download: (d: ExpressionEnrichmentRow) => d.cytoband,
        };

        columns[ExpressionEnrichmentTableColumnType.P_VALUE] = {
            name: 'p-Value',
            render: (d: ExpressionEnrichmentRow) => (
                <span style={{ whiteSpace: 'nowrap' }}>
                    {toConditionalPrecision(d.pValue, 3, 0.01)}
                </span>
            ),
            tooltip: (
                <ContinousDataPvalueTooltip groupSize={this.props.groupSize} />
            ),
            sortBy: (d: ExpressionEnrichmentRow) => d.pValue,
            download: (d: ExpressionEnrichmentRow) =>
                toConditionalPrecision(d.pValue, 3, 0.01),
        };

        columns[ExpressionEnrichmentTableColumnType.Q_VALUE] = {
            name: 'q-Value',
            render: (d: ExpressionEnrichmentRow) => (
                <span style={{ whiteSpace: 'nowrap' }}>
                    {formatSignificanceValueWithStyle(d.qValue)}
                </span>
            ),
            tooltip: <span>Derived from Benjamini-Hochberg procedure</span>,
            sortBy: (d: ExpressionEnrichmentRow) => d.qValue,
            download: (d: ExpressionEnrichmentRow) =>
                toConditionalPrecision(d.qValue, 3, 0.01),
        };

        return columns;
    }

    public render() {
        const orderedColumns = _.sortBy(
            this.props.visibleOrderedColumnNames!.map(
                column => this.columns[column]
            ),
            (c: ExpressionEnrichmentTableColumn) => c.order
        );
        return (
            <LazyMobXTable
                initialItemsPerPage={20}
                paginationProps={{ itemsPerPageOptions: [20] }}
                columns={orderedColumns}
                data={this.props.data}
                initialSortColumn={this.props.initialSortColumn}
                onRowClick={
                    this.props.onGeneNameClick ? this.onRowClick : undefined
                }
                dataStore={this.props.dataStore}
                showCopyDownload={
                    getServerConfig().skin_hide_download_controls ===
                    DownloadControlOption.SHOW_ALL
                }
            />
        );
    }
}
