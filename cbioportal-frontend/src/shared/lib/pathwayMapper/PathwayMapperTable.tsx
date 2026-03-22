import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import { observable, makeObservable } from 'mobx';
import { Radio } from 'react-bootstrap';
import {
    DefaultTooltip,
    DownloadControlOption,
} from 'cbioportal-frontend-commons';
import {
    getSortedData,
    getSortedFilteredData,
    SimpleGetterLazyMobXTableApplicationDataStore,
} from '../../../shared/lib/ILazyMobXTableApplicationDataStore';
import { truncateGeneList } from './PathwayMapperHelpers';
import { getServerConfig } from 'config/config';

export interface IPathwayMapperTable {
    name: string;
    score: number;
    genes: string[];
}

export enum IPathwayMapperTableColumnType {
    NAME,
    SCORE,
    GENES,
}

interface IPathwayMapperTableProps {
    data: IPathwayMapperTable[];
    selectedPathway: string;
    changePathway: (pathway: string) => void;
    onSelectedPathwayChange?: () => void;
    initialSortColumn?: string;
    columnsOverride?: {
        [columnEnum: number]: Partial<PathwayMapperTableColumn>;
    };
}

type PathwayMapperTableColumn = Column<IPathwayMapperTable>;

class PathwayMapperTableComponent extends LazyMobXTable<IPathwayMapperTable> {}

export function findPageOfSelectedPathway(
    data: IPathwayMapperTable[],
    store: SimpleGetterLazyMobXTableApplicationDataStore<IPathwayMapperTable>,
    selectedPathway: string
): number {
    const sortedData = getSortedData(
        data,
        store.sortMetric,
        store.sortAscending
    );
    const sortedFilteredData = getSortedFilteredData(
        sortedData,
        store.filterString,
        store.getFilter()
    );

    const index = _.findIndex(sortedFilteredData, d => {
        return d.name === selectedPathway;
    });

    return index >= 0 ? Math.floor(index / (store.itemsPerPage || 10)) : 0;
}

@observer
export default class PathwayMapperTable extends React.Component<
    IPathwayMapperTableProps
> {
    public static defaultProps = {
        columns: [
            IPathwayMapperTableColumnType.NAME,
            IPathwayMapperTableColumnType.SCORE,
            IPathwayMapperTableColumnType.GENES,
        ],
        columnsOverride: {},
        initialSortColumn: 'Score',
    };
    @observable protected _columns: {
        [columnEnum: number]: PathwayMapperTableColumn;
    };
    @observable.ref selectedPathway: string;

    private dataStore: SimpleGetterLazyMobXTableApplicationDataStore<
        IPathwayMapperTable
    >;

    constructor(props: IPathwayMapperTableProps) {
        super(props);
        makeObservable(this);
        this._columns = {};
        this.generateColumns();
        this.dataStore = new SimpleGetterLazyMobXTableApplicationDataStore(
            () => this.props.data
        );
    }

    generateColumns() {
        const lengthThreshold = 20;

        this._columns = {};

        this._columns[IPathwayMapperTableColumnType.NAME] = {
            name: 'Pathway name',
            render: (d: IPathwayMapperTable) => {
                const pwName = d.name;
                const isPwNameShort = pwName.length < lengthThreshold;
                return (
                    <Radio
                        style={{ marginTop: 0, marginBottom: 0 }}
                        checked={this.props.selectedPathway === d.name}
                        onChange={(e: any) => {
                            if (this.props.onSelectedPathwayChange) {
                                this.props.onSelectedPathwayChange();
                            }
                            this.props.changePathway(d.name);
                        }}
                    >
                        <DefaultTooltip
                            overlay={pwName}
                            disabled={isPwNameShort}
                        >
                            <b>
                                {isPwNameShort
                                    ? pwName
                                    : pwName.substring(0, lengthThreshold) +
                                      '...'}
                            </b>
                        </DefaultTooltip>
                    </Radio>
                );
            },
            tooltip: <span>Pathway name</span>,
            filter: (
                d: IPathwayMapperTable,
                filterString: string,
                filterStringUpper: string
            ) => d.name.toUpperCase().includes(filterStringUpper),
            sortBy: (d: IPathwayMapperTable) => d.name,
            download: (d: IPathwayMapperTable) => d.name,

            ...this.props.columnsOverride![IPathwayMapperTableColumnType.NAME],
        };

        this._columns[IPathwayMapperTableColumnType.SCORE] = {
            name: 'Score',
            render: (d: IPathwayMapperTable) => (
                <span>
                    <b>{d.score.toFixed(2)}</b>
                </span>
            ),
            tooltip: <span>Score</span>,
            filter: (
                d: IPathwayMapperTable,
                filterString: string,
                filterStringUpper: string
            ) => (d.score + '').includes(filterStringUpper),
            sortBy: (d: IPathwayMapperTable) => d.score,
            download: (d: IPathwayMapperTable) => d.score + '',

            ...this.props.columnsOverride![IPathwayMapperTableColumnType.SCORE],
        };

        this._columns[IPathwayMapperTableColumnType.GENES] = {
            name: 'Genes matched',
            render: (d: IPathwayMapperTable) => {
                const geneTextLength = d.genes.join(' ').length;

                return (
                    <DefaultTooltip
                        overlay={d.genes.join(' ')}
                        disabled={geneTextLength < lengthThreshold}
                    >
                        <span>
                            {truncateGeneList(d.genes, lengthThreshold)}
                        </span>
                    </DefaultTooltip>
                );
            },
            tooltip: <span>Genes matched</span>,
            filter: (
                d: IPathwayMapperTable,
                filterString: string,
                filterStringUpper: string
            ) =>
                d.genes
                    .join(' ')
                    .toUpperCase()
                    .includes(filterStringUpper),
            sortBy: (d: IPathwayMapperTable) => d.genes.length,
            download: (d: IPathwayMapperTable) => d.genes.toString(),

            ...this.props.columnsOverride![IPathwayMapperTableColumnType.GENES],
        };
    }

    componentDidMount() {
        // When the component mounts, we need to find the page number for the selected pathway.
        // We can use the current data and data store to determine the page number.
        this.dataStore.page = findPageOfSelectedPathway(
            this.props.data,
            this.dataStore,
            this.props.selectedPathway
        );
    }

    componentWillUpdate(nextProps: Readonly<IPathwayMapperTableProps>): void {
        // we need to know on which page the selected pathway will fall after Ranking option is updated.
        // there is a chance that selected pathway might be on another page than currently visible one.
        // therefore we need find the page number for the updated data and set data store page accordingly
        this.dataStore.page = findPageOfSelectedPathway(
            nextProps.data,
            this.dataStore,
            nextProps.selectedPathway
        );
    }

    render() {
        const columns = _.sortBy(this._columns);
        return (
            <PathwayMapperTableComponent
                columns={columns}
                dataStore={this.dataStore}
                initialItemsPerPage={10}
                initialSortColumn={this.props.initialSortColumn}
                initialSortDirection={'desc'}
                paginationProps={{ itemsPerPageOptions: [10] }}
                showColumnVisibility={false}
                showCopyDownload={
                    getServerConfig().skin_hide_download_controls !==
                    DownloadControlOption.HIDE_ALL
                }
            />
        );
    }
}
