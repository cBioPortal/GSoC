import * as React from 'react';
import styles from './styles/styles.module.scss';
import {
    ObservableMap,
    toJS,
    computed,
    observable,
    makeObservable,
} from 'mobx';
import { expr } from 'mobx-utils';
import { observer, Observer } from 'mobx-react';
import { Gistic } from 'cbioportal-ts-api-client';
import EnhancedReactTable from '../enhancedReactTable/EnhancedReactTable';
import { IColumnFormatterData } from '../enhancedReactTable/IColumnFormatter';
import { Td } from 'reactable';
import classNames from 'classnames';
import { IColumnDefMap } from '../enhancedReactTable/IEnhancedReactTableProps';
import { toPrecision } from '../../lib/FormatUtils';
import { getGeneSymbols, sortByCytoband } from '../../lib/GisticUtils';

const DEFAULT_NUM_GENES_SHOWN = 5;

class GisticTable extends EnhancedReactTable<Gistic> {}

export interface GisticGeneSelectorProps {
    initialSelection: string[];
    data: Gistic[];
    onSelect: (map_geneSymbol_selected: ObservableMap<string, boolean>) => void;
}

@observer
export default class GisticGeneSelector extends React.Component<
    GisticGeneSelectorProps,
    {}
> {
    constructor(props: GisticGeneSelectorProps) {
        super(props);
        this.map_geneSymbol_selected.replace(
            props.initialSelection.map(geneSymbol => [geneSymbol, true])
        );
    }

    map_geneSymbol_selected = observable.map<string, boolean>();

    private columns: IColumnDefMap = {
        amp: {
            priority: 1,
            columnDataFunction: ({
                rowData: gistic,
            }: IColumnFormatterData<Gistic>) =>
                gistic && (gistic.amp ? 'Amp' : 'Del'),
            name: 'Amp Del',
            sortable: true,
            filterable: true,
            header: (
                <div
                    className={classNames(
                        styles.header,
                        styles.amp,
                        styles.del
                    )}
                >
                    <span className={styles.amp}>Amp</span>
                    <span className={styles.del}>Del</span>
                </div>
            ),
            formatter: ({
                name,
                rowData: gistic,
                columnData: value,
            }: IColumnFormatterData<Gistic>) => (
                <Td key={name} column={name} value={value}>
                    {!!gistic && (
                        <div className={gistic.amp ? styles.amp : styles.del} />
                    )}
                </Td>
            ),
        },
        chromosome: {
            priority: 2,
            dataField: 'chromosome',
            name: 'Chr',
            sortable: true,
            filterable: true,
        },
        cytoband: {
            priority: 3,
            dataField: 'cytoband',
            name: 'Cytoband',
            sortable: sortByCytoband,
            filterable: true,
        },
        '#': {
            priority: 4,
            columnDataFunction: ({
                rowData: gistic,
            }: IColumnFormatterData<Gistic>) => getGeneSymbols(gistic).length,
            name: '#',
            sortable: true,
            filterable: true,
        },
        genes: {
            priority: 5,
            // this columnDataFunction allows quick searching by gene symbol
            columnDataFunction: ({
                rowData: gistic,
            }: IColumnFormatterData<Gistic>) =>
                getGeneSymbols(gistic).join(' '),
            name: 'Genes',
            sortable: (genes1: string, genes2: string) => {
                // sort by length, then alphabetically
                return (
                    genes1.length - genes2.length ||
                    +(genes1 > genes2) - +(genes1 < genes2)
                );
            },
            filterable: true,
            formatter: ({
                name,
                rowData: gistic,
                columnData: value,
            }: IColumnFormatterData<Gistic>) => (
                <Td key={name} column={name} value={value}>
                    <GisticGeneToggles
                        gistic={gistic}
                        map_geneSymbol_selected={this.map_geneSymbol_selected}
                    />
                </Td>
            ),
        },
        qValue: {
            priority: 6,
            dataField: 'qValue',
            name: 'Q-Value',
            sortable: true,
            filterable: true,
            formatter: ({
                name,
                rowData: gistic,
                columnData: value,
            }: IColumnFormatterData<Gistic>) => (
                <Td key={name} column={name} value={value}>
                    {toPrecision(value, 2, 0.1)}
                </Td>
            ),
        },
    };

    render() {
        return (
            <div className={styles.GisticGeneSelector}>
                <span>
                    {'Click on a gene to '}
                    <span
                        className={classNames(
                            styles.geneToggle,
                            styles.selected,
                            styles.simulateHovered
                        )}
                    >
                        {'select'}
                    </span>
                    {' it.'}
                </span>
                <GisticTable
                    className={styles.gisticTable}
                    itemsName="genes"
                    initItemsPerPage={10}
                    columns={this.columns}
                    rawData={this.props.data}
                    headerControlsProps={{
                        showCopyAndDownload: false,
                        showHideShowColumnButton: false,
                        showPagination: true,
                    }}
                    reactTableProps={{
                        className: 'table table-striped table-border-top',
                        hideFilterInput: true,
                        defaultSort: this.columns.qValue.name,
                    }}
                />
                <div>
                    <button
                        style={{ marginTop: 20 }}
                        className="btn btn-primary btn-sm pull-right"
                        onClick={() =>
                            this.props.onSelect(this.map_geneSymbol_selected)
                        }
                    >
                        Select
                    </button>
                </div>
            </div>
        );
    }
}

@observer
class GisticGeneToggles extends React.Component<
    {
        gistic?: Gistic;
        map_geneSymbol_selected: ObservableMap<string, boolean>;
    },
    {}
> {
    @observable showAll = false;

    constructor(props: {
        gistic?: Gistic;
        map_geneSymbol_selected: ObservableMap<string, boolean>;
    }) {
        super(props);
        makeObservable(this);
    }

    renderGeneToggles(genes: string[]) {
        return genes.map(gene => (
            <Observer>
                {() => {
                    let selected = !!this.props.map_geneSymbol_selected.get(
                        gene
                    );
                    return (
                        <span
                            key={gene}
                            className={classNames(
                                styles.geneToggle,
                                selected ? styles.selected : styles.notSelected
                            )}
                            onClick={event =>
                                this.props.map_geneSymbol_selected.set(
                                    gene,
                                    !selected
                                )
                            }
                        >
                            {gene}
                        </span>
                    );
                }}
            </Observer>
        ));
    }

    render() {
        let allGenes = getGeneSymbols(this.props.gistic);
        let someGenes = allGenes.slice(0, DEFAULT_NUM_GENES_SHOWN);
        let moreGenes = allGenes.slice(DEFAULT_NUM_GENES_SHOWN);
        return (
            <div className={styles.GisticGeneToggles}>
                <div className={styles.someGenes}>
                    {this.renderGeneToggles(someGenes)}
                    {!!moreGenes.length && (
                        <a
                            className={styles.showMoreLess}
                            onClick={() => (this.showAll = !this.showAll)}
                        >
                            {this.showAll
                                ? 'less'
                                : `+${moreGenes.length} more`}
                        </a>
                    )}
                </div>
                <div className={styles.moreGenes}>
                    {this.showAll && this.renderGeneToggles(moreGenes)}
                </div>
            </div>
        );
    }
}
