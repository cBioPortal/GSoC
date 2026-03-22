import _ from 'lodash';
import * as React from 'react';
import LabeledCheckbox from '../labeledCheckbox/LabeledCheckbox';
import styles from './styles/styles.module.scss';
import {
    action,
    ObservableMap,
    computed,
    observable,
    makeObservable,
} from 'mobx';
import { expr } from 'mobx-utils';
import { observer, Observer } from 'mobx-react';
import EnhancedReactTable from '../enhancedReactTable/EnhancedReactTable';
import { MutSig } from 'cbioportal-ts-api-client';
import { IColumnFormatterData } from '../enhancedReactTable/IColumnFormatter';
import { IColumnDefMap } from '../enhancedReactTable/IEnhancedReactTableProps';
import { Td } from 'reactable';
import { toPrecision } from '../../lib/FormatUtils';

class MutSigTable extends EnhancedReactTable<MutSig> {}

export interface MutSigGeneSelectorProps {
    initialSelection: string[];
    data: MutSig[];
    onSelect: (map_geneSymbol_selected: ObservableMap<string, boolean>) => void;
}

@observer
export default class MutSigGeneSelector extends React.Component<
    MutSigGeneSelectorProps,
    {}
> {
    constructor(props: MutSigGeneSelectorProps) {
        super(props);
        makeObservable(this);
        this.map_geneSymbol_selected.replace(
            props.initialSelection.map(geneSymbol => [geneSymbol, true])
        );
    }

    private readonly map_geneSymbol_selected = observable.map<
        string,
        boolean
    >();

    @computed get allGenes() {
        return _.uniq(this.props.data.map(mutSig => mutSig.hugoGeneSymbol));
    }

    @computed get selectedGenes() {
        return this.allGenes.filter(symbol =>
            this.map_geneSymbol_selected.get(symbol)
        );
    }

    @action selectAll(selected: boolean) {
        for (let gene of this.allGenes)
            this.map_geneSymbol_selected.set(gene, selected);
    }

    private columns: IColumnDefMap = {
        hugoGeneSymbol: {
            priority: 1,
            dataField: 'hugoGeneSymbol',
            name: 'Gene Symbol',
            sortable: true,
            filterable: true,
        },
        numberOfMutations: {
            priority: 2,
            dataField: 'numberOfMutations',
            name: 'Num Mutations',
            sortable: true,
            filterable: true,
        },
        qValue: {
            priority: 3,
            dataField: 'qValue',
            name: 'Q-Value',
            sortable: true,
            filterable: true,
            formatter: ({
                name,
                columnData: value,
            }: IColumnFormatterData<MutSig>) => (
                <Td key={name} column={name} value={value}>
                    {toPrecision(value, 2, 0.1)}
                </Td>
            ),
        },
        selected: {
            name: 'Selected',
            priority: 4,
            sortable: false,
            filterable: false,
            header: (
                <div className={styles.selectionColumnHeader}>
                    <span>All</span>
                    <Observer>
                        {() => (
                            <LabeledCheckbox
                                checked={this.selectedGenes.length > 0}
                                indeterminate={
                                    this.selectedGenes.length > 0 &&
                                    this.selectedGenes.length <
                                        this.allGenes.length
                                }
                                onChange={event =>
                                    this.selectAll(event.target.checked)
                                }
                            />
                        )}
                    </Observer>
                </div>
            ),
            formatter: ({
                name,
                rowData: mutSig,
            }: IColumnFormatterData<MutSig>) => (
                <Td key={name} column={name}>
                    {!!mutSig && (
                        <div className={styles.selectionColumnCell}>
                            <Observer>
                                {() => (
                                    <LabeledCheckbox
                                        checked={
                                            !!this.map_geneSymbol_selected.get(
                                                mutSig.hugoGeneSymbol
                                            )
                                        }
                                        onChange={event =>
                                            this.map_geneSymbol_selected.set(
                                                mutSig.hugoGeneSymbol,
                                                event.target.checked
                                            )
                                        }
                                    />
                                )}
                            </Observer>
                        </div>
                    )}
                </Td>
            ),
        },
    };

    render() {
        return (
            <div className={styles.MutSigGeneSelector}>
                <MutSigTable
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
