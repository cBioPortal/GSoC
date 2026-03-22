import * as React from 'react';
import { Geneset } from 'cbioportal-ts-api-client';
import { Gene } from 'cbioportal-ts-api-client';
import { correlationColor, correlationSortBy } from './CoExpressionTableUtils';
import LazyMobXTable from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import { CoExpressionDataStore, TableMode } from './CoExpressionViz';
import Select from 'react-select1';
import { observer } from 'mobx-react';
import {
    CoExpressionWithQ,
    tableSearchInformation,
} from './CoExpressionTabUtils';
import InfoIcon from '../../../shared/components/InfoIcon';
import { bind } from 'bind-decorator';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { formatSignificanceValueWithStyle } from 'shared/lib/FormatUtils';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

export interface ICoExpressionTableGenesetsProps {
    referenceGeneticEntity: Gene | Geneset;
    dataStore: CoExpressionDataStore;
    tableMode: TableMode;
    onSelectTableMode: (t: TableMode) => void;
}

const SPEARMANS_CORRELATION_COLUMN_NAME = "Spearman's Correlation";
const P_VALUE_COLUMN_NAME = 'p-Value';
const Q_VALUE_COLUMN_NAME = 'q-Value';

const COLUMNS = [
    {
        name: 'Correlated Gene Set',
        render: (d: CoExpressionWithQ) => (
            <span style={{ fontWeight: 'bold' }}>
                {d.geneticEntityName.length > 28
                    ? d.geneticEntityName.substring(0, 25) + '...'
                    : d.geneticEntityName}
            </span>
        ),
        filter: (d: CoExpressionWithQ, f: string, filterStringUpper: string) =>
            d.geneticEntityName.indexOf(filterStringUpper) > -1,
        download: (d: CoExpressionWithQ) => d.geneticEntityName,
        sortBy: (d: CoExpressionWithQ) => d.geneticEntityName,
        width: '60%',
    },
    makeNumberColumn(
        SPEARMANS_CORRELATION_COLUMN_NAME,
        'spearmansCorrelation',
        true,
        false
    ),
    makeNumberColumn(P_VALUE_COLUMN_NAME, 'pValue', false, false),
    Object.assign(
        makeNumberColumn(Q_VALUE_COLUMN_NAME, 'qValue', false, true),
        {
            sortBy: (d: CoExpressionWithQ) => [
                d.qValue ?? Number.POSITIVE_INFINITY,
                d.pValue ?? Number.POSITIVE_INFINITY,
            ],
        }
    ),
];

function makeNumberColumn(
    name: string,
    key: keyof CoExpressionWithQ,
    colorByValue: boolean,
    formatSignificance: boolean
) {
    return {
        name: name,
        render: (d: CoExpressionWithQ) => {
            const value = d[key] as number | null;
            if (value === null || value === undefined) {
                return (
                    <DefaultTooltip
                        overlay={
                            <span>
                                Correlation could not be computed: this gene has
                                too few distinct expression values across the
                                selected samples.
                            </span>
                        }
                    >
                        <span>N/A</span>
                    </DefaultTooltip>
                );
            }
            return (
                <span
                    style={{
                        color: colorByValue
                            ? correlationColor(value)
                            : '#000000',
                        textAlign: 'right',
                        float: 'right',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {formatSignificance
                        ? formatSignificanceValueWithStyle(value)
                        : toConditionalPrecision(value, 3, 0.01)}
                </span>
            );
        },
        download: (d: CoExpressionWithQ) => {
            const value = d[key] as number | null;
            return value === null || value === undefined
                ? 'N/A'
                : value.toString();
        },
        sortBy: (d: CoExpressionWithQ) => {
            const value = d[key] as number | null;
            return value === null || value === undefined
                ? [0, 0] // sort nulls to bottom
                : correlationSortBy(value);
        },
        align: 'right' as 'right',
    };
}

@observer
export default class CoExpressionTableGenesets extends React.Component<
    ICoExpressionTableGenesetsProps,
    {}
> {
    @bind
    private onRowClick(d: CoExpressionWithQ) {
        this.props.dataStore.setHighlighted(d);
    }

    @bind
    private onSelectTableMode(d: any) {
        this.props.onSelectTableMode(d.value);
    }

    private tableModeOptions = [
        {
            label: 'Show Any Correlation',
            value: TableMode.SHOW_ALL,
        },
        {
            label: 'Show Only Positively Correlated',
            value: TableMode.SHOW_POSITIVE,
        },
        {
            label: 'Show Only Negatively Correlated',
            value: TableMode.SHOW_NEGATIVE,
        },
    ];

    private paginationProps = {
        itemsPerPageOptions: [25],
    };

    render() {
        return (
            <div>
                <div
                    style={{
                        float: 'left',
                        display: 'flex',
                        flexDirection: 'row',
                    }}
                >
                    <div style={{ width: 180 }}>
                        <Select
                            value={this.props.tableMode}
                            onChange={this.onSelectTableMode}
                            options={this.tableModeOptions}
                            searchable={false}
                            clearable={false}
                            className="coexpression-select-table-mode"
                        />
                    </div>
                    <InfoIcon
                        style={{ marginLeft: 21, marginTop: '0.7em' }}
                        tooltip={
                            <div style={{ maxWidth: 200 }}>
                                {tableSearchInformation}
                            </div>
                        }
                        tooltipPlacement="left"
                    />
                </div>
                <LazyMobXTable
                    initialSortColumn={Q_VALUE_COLUMN_NAME}
                    initialSortDirection="asc"
                    columns={COLUMNS}
                    showColumnVisibility={false}
                    dataStore={this.props.dataStore}
                    onRowClick={this.onRowClick}
                    filterPlaceholder="Enter gene set.."
                    paginationProps={this.paginationProps}
                    initialItemsPerPage={25}
                    copyDownloadProps={{
                        showCopy: false,
                    }}
                />
            </div>
        );
    }
}
