import * as React from 'react';
import { GenePanel, GenePanelToGene } from 'cbioportal-ts-api-client';
import { observer } from 'mobx-react';
import { SimpleCopyDownloadControls } from 'shared/components/copyDownloadControls/SimpleCopyDownloadControls';
import { serializeData } from 'shared/lib/Serializer';
import styles from './styles.module.scss';
import { chunk, flatten } from 'lodash';
import { observable, action, computed, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import classnames from 'classnames';
import SimpleTable from 'shared/components/simpleTable/SimpleTable';

interface IGenesListProps {
    genePanel: GenePanel;
    columns?: number;
    id?: string | undefined;
}

@observer
export default class GenesList extends React.Component<IGenesListProps, {}> {
    @observable filter: string = '';

    constructor(props: IGenesListProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    handleChangeInput(value: string) {
        this.filter = value;
    }

    @computed get filteredGenes() {
        const { genes } = this.props.genePanel;
        if (this.filter) {
            const regex = new RegExp(this.filter, 'i');
            return genes.filter(
                gene =>
                    regex.test(gene.entrezGeneId.toString()) ||
                    regex.test(gene.hugoGeneSymbol)
            );
        }
        return genes;
    }

    genesDividedToColumns = (genes: GenePanelToGene[]) => {
        let result = [];
        let columnCount = this.columnCount;
        let remainingGenes = [...genes];
        while (columnCount > 0) {
            const chunked = chunk(
                remainingGenes,
                Math.ceil(remainingGenes.length / columnCount)
            );
            if (chunked.length === columnCount) {
                result = result.concat(chunked);
                break;
            } else {
                result.push(chunked[0]);
                remainingGenes = remainingGenes.slice(flatten(result).length);
                columnCount--;
            }
        }
        return result;
    };

    @computed get renderTableRows() {
        const filtered = this.filteredGenes;
        if (filtered.length === 0) {
            return [];
        }
        const rows: JSX.Element[] = [];
        this.genesDividedToRows(filtered).forEach(row => {
            const tdValues = row.map(gene => (
                <td key={gene ? gene : Math.random()}>{gene}</td>
            ));
            rows.push(<tr>{tdValues}</tr>);
        });
        return rows;
    }

    getDownloadData = () => {
        const downloadData = [
            ['Genes'],
            ...this.props.genePanel.genes.map(gene => [gene.hugoGeneSymbol]),
        ];
        return serializeData(downloadData);
    };

    genesDividedToRows = (genes: GenePanelToGene[]) => {
        const genesByColumns = this.genesDividedToColumns(genes);
        const genesByRows = [];
        const geneCountPerColumn = this.geneCountPerColumn(genes.length);
        for (let i = 0; i < geneCountPerColumn; i++) {
            const genesPerRow = [];
            for (let j = 0; j < this.columnCount; j++) {
                genesPerRow.push(
                    genesByColumns[j] && genesByColumns[j][i]
                        ? genesByColumns[j][i].hugoGeneSymbol
                        : ''
                );
            }
            genesByRows.push(genesPerRow);
        }
        return genesByRows;
    };

    @computed get columnCount() {
        return this.props.columns || 1;
    }

    geneCountPerColumn = (totalLength: number) => {
        return Math.ceil(totalLength / this.columnCount);
    };

    @computed get renderTableHeaders() {
        const thValues = [<th>Genes</th>];
        return thValues.concat(Array(this.columnCount - 1).fill(<th></th>));
    }

    render() {
        return (
            <div id={this.props.id} className={styles.genesList}>
                <h4 className={styles.panelName}>
                    {this.props.genePanel.genePanelId}
                </h4>
                <span>
                    Number of genes: {this.props.genePanel.genes.length}
                </span>
                <div
                    className={classnames(
                        'pull-right has-feedback input-group-sm',
                        styles.searchInput
                    )}
                >
                    <input
                        type="text"
                        value={this.filter}
                        onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                            this.handleChangeInput(e.target.value)
                        }
                        className="form-control"
                    />
                    <span
                        className="fa fa-search form-control-feedback"
                        aria-hidden="true"
                    />
                </div>
                <SimpleCopyDownloadControls
                    className={classnames(
                        'pull-right',
                        styles.copyDownloadControls
                    )}
                    downloadData={this.getDownloadData}
                    downloadFilename={`gene_panel_${this.props.genePanel.genePanelId}.tsv`}
                    controlsStyle="BUTTON"
                    containerId={this.props.id}
                />
                <SimpleTable
                    headers={this.renderTableHeaders}
                    rows={this.renderTableRows}
                    noRowsText="No matches"
                />
            </div>
        );
    }
}
