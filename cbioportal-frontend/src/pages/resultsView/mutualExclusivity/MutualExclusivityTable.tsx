import * as React from 'react';
import _ from 'lodash';
import LazyMobXTable, {
    Column,
} from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import { MutualExclusivity } from '../../../shared/model/MutualExclusivity';
import { observer } from 'mobx-react';
import { observable, makeObservable } from 'mobx';
import { Badge } from 'react-bootstrap';
import {
    formatPValue,
    formatQValueWithStyle,
    formatLogOddsRatio,
} from './MutualExclusivityUtil';
import styles from './styles.module.scss';
import classNames from 'classnames';
import { DownloadControlOption } from 'cbioportal-frontend-commons';

import { getServerConfig } from 'config/config';

export interface IMutualExclusivityTableProps {
    columns?: MutualExclusivityTableColumnType[];
    data: MutualExclusivity[];
    initialSortColumn?: string;
}

export enum MutualExclusivityTableColumnType {
    TRACK_A,
    TRACK_B,
    NEITHER,
    A_NOT_B,
    B_NOT_A,
    BOTH,
    LOG_ODDS_RATIO,
    P_VALUE,
    Q_VALUE,
    ASSOCIATION,
}

type MutualExclusivityTableColumn = Column<MutualExclusivity> & {
    order?: number;
    shouldExclude?: () => boolean;
};

export class MutualExclusivityTableComponent extends LazyMobXTable<
    MutualExclusivity
> {}

@observer
export default class MutualExclusivityTable extends React.Component<
    IMutualExclusivityTableProps,
    {}
> {
    @observable protected _columns: {
        [columnEnum: number]: MutualExclusivityTableColumn;
    };

    constructor(props: IMutualExclusivityTableProps) {
        super(props);
        makeObservable(this);
        this._columns = {};
        this.generateColumns();
    }

    public static defaultProps = {
        columns: [
            MutualExclusivityTableColumnType.TRACK_A,
            MutualExclusivityTableColumnType.TRACK_B,
            MutualExclusivityTableColumnType.NEITHER,
            MutualExclusivityTableColumnType.A_NOT_B,
            MutualExclusivityTableColumnType.B_NOT_A,
            MutualExclusivityTableColumnType.BOTH,
            MutualExclusivityTableColumnType.LOG_ODDS_RATIO,
            MutualExclusivityTableColumnType.P_VALUE,
            MutualExclusivityTableColumnType.Q_VALUE,
            MutualExclusivityTableColumnType.ASSOCIATION,
        ],
        initialSortColumn: 'q-Value',
    };

    protected generateColumns() {
        this._columns = {};

        this._columns[MutualExclusivityTableColumnType.TRACK_A] = {
            name: 'A',
            render: (d: MutualExclusivity) => (
                <span>
                    <b>{d.trackA}</b>
                </span>
            ),
            tooltip: <span>A</span>,
            filter: (
                d: MutualExclusivity,
                filterString: string,
                filterStringUpper: string
            ) => d.trackA.toUpperCase().includes(filterStringUpper),
            sortBy: (d: MutualExclusivity) => d.trackA,
            download: (d: MutualExclusivity) => d.trackA,
        };

        this._columns[MutualExclusivityTableColumnType.TRACK_B] = {
            name: 'B',
            render: (d: MutualExclusivity) => (
                <span>
                    <b>{d.trackB}</b>
                </span>
            ),
            tooltip: <span>B</span>,
            filter: (
                d: MutualExclusivity,
                filterString: string,
                filterStringUpper: string
            ) => d.trackB.toUpperCase().includes(filterStringUpper),
            sortBy: (d: MutualExclusivity) => d.trackB,
            download: (d: MutualExclusivity) => d.trackB,
        };

        this._columns[MutualExclusivityTableColumnType.NEITHER] = {
            name: 'Neither',
            render: (d: MutualExclusivity) => <span>{d.neitherCount}</span>,
            tooltip: (
                <span>
                    Number of samples with alterations in neither A nor B
                </span>
            ),
            sortBy: (d: MutualExclusivity) => d.neitherCount,
            download: (d: MutualExclusivity) => d.neitherCount.toString(),
        };

        this._columns[MutualExclusivityTableColumnType.A_NOT_B] = {
            name: 'A Not B',
            render: (d: MutualExclusivity) => <span>{d.aNotBCount}</span>,
            tooltip: (
                <span>
                    Number of samples with alterations in A but not in B
                </span>
            ),
            sortBy: (d: MutualExclusivity) => d.aNotBCount,
            download: (d: MutualExclusivity) => d.aNotBCount.toString(),
        };

        this._columns[MutualExclusivityTableColumnType.B_NOT_A] = {
            name: 'B Not A',
            render: (d: MutualExclusivity) => <span>{d.bNotACount}</span>,
            tooltip: (
                <span>
                    Number of samples with alterations in B but not in A
                </span>
            ),
            sortBy: (d: MutualExclusivity) => d.bNotACount,
            download: (d: MutualExclusivity) => d.bNotACount.toString(),
        };

        this._columns[MutualExclusivityTableColumnType.BOTH] = {
            name: 'Both',
            render: (d: MutualExclusivity) => <span>{d.bothCount}</span>,
            tooltip: (
                <span>Number of samples with alterations in both A and B</span>
            ),
            sortBy: (d: MutualExclusivity) => d.bothCount,
            download: (d: MutualExclusivity) => d.bothCount.toString(),
        };

        this._columns[MutualExclusivityTableColumnType.LOG_ODDS_RATIO] = {
            name: 'Log2 Odds Ratio',
            render: (d: MutualExclusivity) => (
                <span>{formatLogOddsRatio(d.logOddsRatio)}</span>
            ),
            tooltip: (
                <span style={{ display: 'inline-block', maxWidth: 300 }}>
                    Quantifies how strongly the presence or absence of
                    alterations in A are associated with the presence or absence
                    of alterations in B in the selected samples. OR = (Neither *
                    Both) / (A Not B * B Not A)
                </span>
            ),
            sortBy: (d: MutualExclusivity) => d.logOddsRatio,
            download: (d: MutualExclusivity) =>
                formatLogOddsRatio(d.logOddsRatio),
        };

        this._columns[MutualExclusivityTableColumnType.P_VALUE] = {
            name: 'p-Value',
            render: (d: MutualExclusivity) => (
                <span>{formatPValue(d.pValue)}</span>
            ),
            tooltip: <span>Derived from two-sided Fisher Exact Test</span>,
            sortBy: (d: MutualExclusivity) => d.pValue,
            download: (d: MutualExclusivity) => formatPValue(d.pValue),
        };

        this._columns[MutualExclusivityTableColumnType.Q_VALUE] = {
            name: 'q-Value',
            render: (d: MutualExclusivity) => formatQValueWithStyle(d.qValue),
            tooltip: (
                <span>
                    Derived from Benjamini-Hochberg FDR correction procedure
                </span>
            ),
            sortBy: (d: MutualExclusivity) => d.qValue,
            download: (d: MutualExclusivity) => formatPValue(d.qValue),
        };

        this._columns[MutualExclusivityTableColumnType.ASSOCIATION] = {
            name: 'Tendency',
            render: (d: MutualExclusivity) => (
                <div
                    className={classNames(styles.Tendency, {
                        [styles.Significant]: d.qValue < 0.05,
                    })}
                >
                    {d.association}
                </div>
            ),
            tooltip: (
                <table>
                    <tr>
                        <td>Log2 ratio {'>'} 0</td>
                        <td>: Tendency towards co-occurrence</td>
                    </tr>
                    <tr>
                        <td>Log2 ratio &lt;= 0</td>
                        <td>: Tendency towards mutual exclusivity</td>
                    </tr>
                    <tr>
                        <td>q-Value &lt; 0.05</td>
                        <td>: Significant association</td>
                    </tr>
                </table>
            ),
            filter: (
                d: MutualExclusivity,
                filterString: string,
                filterStringUpper: string
            ) => d.association.toUpperCase().includes(filterStringUpper),
            sortBy: (d: MutualExclusivity) => d.association,
            download: (d: MutualExclusivity) => d.association,
        };
    }

    public render() {
        const orderedColumns = _.sortBy(
            this._columns,
            (c: MutualExclusivityTableColumn) => c.order
        );
        return (
            <MutualExclusivityTableComponent
                columns={orderedColumns}
                data={this.props.data}
                initialItemsPerPage={50}
                initialSortColumn={this.props.initialSortColumn}
                paginationProps={{ itemsPerPageOptions: [50] }}
                showCopyDownload={
                    getServerConfig().skin_hide_download_controls !==
                    DownloadControlOption.HIDE_ALL
                }
            />
        );
    }
}
