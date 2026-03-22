import * as React from 'react';
import LazyMobXTable, { Column } from '../lazyMobXTable/LazyMobXTable';
import { observer } from 'mobx-react';
import { IPdbChain } from '../../model/Pdb';
import PdbChainDataStore from '../mutationMapper/PdbChainDataStore';
import PdbChainInfo from '../PdbChainInfo';
import PdbHeaderCache from '../../cache/PdbHeaderCache';
import { computed, makeObservable } from 'mobx';
import { PdbHeader } from 'genome-nexus-ts-api-client';
import OrganismColumnFormatter from './column/OrganismColumnFormatter';
import LazyLoadedTableCell from 'shared/lib/LazyLoadedTableCell';
import { generatePdbInfoSummary } from '../../lib/PdbUtils';

class PdbChainTableComponent extends LazyMobXTable<IPdbChain> {}

export interface IPdbChainTableProps {
    dataStore: PdbChainDataStore;
    cache?: PdbHeaderCache;
}

@observer
export default class PdbChainTable extends React.Component<
    IPdbChainTableProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @computed private get columns(): Column<IPdbChain>[] {
        const ret: Column<IPdbChain>[] = [];

        ret.push({
            name: 'PDB Id',
            render: (d: IPdbChain) => {
                return (
                    <a
                        href={`http://www.rcsb.org/pdb/explore/explore.do?structureId=${d.pdbId}`}
                        target="_blank"
                    >
                        {d.pdbId}
                    </a>
                );
            },
            sortBy: (d: IPdbChain) => {
                return d.pdbId;
            },
            filter: (
                d: IPdbChain,
                filterString: string,
                filterStringUpper: string
            ) => {
                return d.pdbId.toUpperCase().indexOf(filterStringUpper) > -1;
            },
        });

        ret.push({
            name: 'Chain',
            render: (d: IPdbChain) => {
                return (
                    <span>
                        <span
                            style={{
                                float: 'left',
                                fontWeight: 'bold',
                                fontStyle: 'italic',
                            }}
                        >
                            {d.chain}
                        </span>
                        <a
                            style={{
                                float: 'right',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                            }}
                            onClick={() => {
                                this.props.dataStore.selectUid(
                                    this.props.dataStore.getChainUid(d)
                                );
                            }}
                        >
                            3D
                        </a>
                    </span>
                );
            },
            sortBy: (d: IPdbChain) => {
                return d.chain;
            },
            filter: (
                d: IPdbChain,
                filterString: string,
                filterStringUpper: string
            ) => {
                return d.chain.toUpperCase().indexOf(filterStringUpper) > -1;
            },
        });

        ret.push({
            name: 'Uniprot Positions',
            render: (d: IPdbChain) => {
                return <span>{`${d.uniprotStart}-${d.uniprotEnd}`}</span>;
            },
            sortBy: (d: IPdbChain) => {
                return [d.uniprotStart, d.uniprotEnd];
            },
            filter: (d: IPdbChain, filterString: string) => {
                return (
                    (d.uniprotStart + '').indexOf(filterString) > -1 ||
                    (d.uniprotEnd + '').indexOf(filterString) > -1
                );
            },
        });

        ret.push({
            name: 'Organism',
            render: LazyLoadedTableCell(
                (d: IPdbChain) => {
                    return this.props.cache
                        ? this.props.cache.get(d.pdbId)
                        : null;
                },
                (h: PdbHeader, d: IPdbChain) => {
                    return (
                        <span>
                            {OrganismColumnFormatter.getOrganism(h, d.chain)}
                        </span>
                    );
                }
            ),
            sortBy: (d: IPdbChain) => {
                return OrganismColumnFormatter.getOrganismFromCache(
                    this.props.cache,
                    d
                );
            },
            filter: (
                d: IPdbChain,
                filterString: string,
                filterStringUpper: string
            ) => {
                const organism =
                    OrganismColumnFormatter.getOrganismFromCache(
                        this.props.cache,
                        d
                    ) || '';
                return organism.toUpperCase().indexOf(filterStringUpper) > -1;
            },
            visible: !!this.props.cache,
        });

        ret.push({
            name: 'Summary',
            render: (d: IPdbChain) => {
                return (
                    <PdbChainInfo
                        pdbId={d.pdbId}
                        chainId={d.chain}
                        cache={this.props.cache}
                        truncateText={false}
                        summaryFormat={true}
                    />
                );
            },
            filter: (
                d: IPdbChain,
                filterString: string,
                filterStringUpper: string
            ) => {
                if (!this.props.cache) {
                    return false;
                }
                const cacheData = this.props.cache.get(d.pdbId);
                if (cacheData && cacheData.data) {
                    const infoSummary = generatePdbInfoSummary(
                        cacheData.data,
                        d.chain
                    );
                    return (
                        infoSummary.pdbInfo
                            .toUpperCase()
                            .indexOf(filterStringUpper) > -1 ||
                        (infoSummary.moleculeInfo || '')
                            .toUpperCase()
                            .indexOf(filterStringUpper) > -1
                    );
                } else {
                    return false;
                }
            },
            visible: !!this.props.cache,
        });

        return ret;
    }

    render() {
        return (
            <PdbChainTableComponent
                showColumnVisibility={false}
                showCopyDownload={false}
                itemsLabel="PDB chain"
                itemsLabelPlural="PDB chains"
                paginationProps={{
                    showItemsPerPageSelector: false,
                    showMoreButton: false,
                }}
                initialItemsPerPage={6}
                columns={this.columns}
                dataStore={this.props.dataStore}
                pageToHighlight={true}
            />
        );
    }
}
