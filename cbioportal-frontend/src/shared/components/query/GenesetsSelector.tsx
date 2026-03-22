import * as React from 'react';
import styles from './styles/styles.module.scss';
import { Modal } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import { FlexRow, FlexCol } from '../flexbox/FlexBox';
import gene_lists from './gene_lists';
import classNames from 'classnames';
import { QueryStoreComponent, Focus } from './QueryStore';
import GenesetsHierarchySelector from './GenesetsHierarchySelector';
import GenesetsVolcanoSelector from './GenesetsVolcanoSelector';
import SectionHeader from '../sectionHeader/SectionHeader';
import { getServerConfig } from 'config/config';
import { ServerConfigHelpers } from '../../../config/config';

export interface GenesetsSelectorProps {}

@observer
export default class GenesetsSelector extends QueryStoreComponent<
    GenesetsSelectorProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @computed get selectedGeneListOption() {
        const option = this.geneListOptions.find(
            opt => opt.value === this.store.geneQuery
        );
        return option ? option.value : '';
    }

    @computed get geneListOptions() {
        let geneList: { id: string; genes: string[] }[] = gene_lists;

        if (getServerConfig().query_sets_of_genes) {
            const parsed = ServerConfigHelpers.parseQuerySetsOfGenes(
                getServerConfig().query_sets_of_genes!
            );
            if (parsed) {
                geneList = parsed;
            }
        }

        return [
            {
                label: 'User-defined List',
                value: '',
            },
            ...geneList.map(item => ({
                label: `${item.id} (${item.genes.length} genes)`,
                value: item.genes.join(' '),
            })),
        ];
    }

    @computed get textAreaRef() {
        if (this.store.geneQueryErrorDisplayStatus === Focus.ShouldFocus)
            return (textArea: HTMLTextAreaElement) => {
                const { error } = this.store.oql;
                if (textArea && error) {
                    textArea.focus();
                    textArea.setSelectionRange(error.start, error.end);
                    this.store.geneQueryErrorDisplayStatus = Focus.Focused;
                }
            };
    }

    render() {
        return (
            <FlexRow padded overflow className={styles.GeneSetSelector}>
                <SectionHeader className="sectionLabel">
                    Enter Gene Sets:
                </SectionHeader>

                <FlexCol overflow>
                    <FlexRow padded className={styles.buttonRow}>
                        <button
                            className="btn btn-default btn-sm"
                            data-test="GENESET_HIERARCHY_BUTTON"
                            onClick={() =>
                                (this.store.showGenesetsHierarchyPopup = true)
                            }
                        >
                            Select Gene Sets from Hierarchy
                        </button>
                        <button
                            className="btn btn-default btn-sm"
                            data-test="GENESET_VOLCANO_BUTTON"
                            onClick={() =>
                                (this.store.showGenesetsVolcanoPopup = true)
                            }
                        >
                            Select Gene Sets from Volcano Plot
                        </button>
                    </FlexRow>

                    <textarea
                        ref={this.textAreaRef}
                        className={classNames(
                            styles.geneSet,
                            this.store.genesetQuery
                                ? styles.notEmpty
                                : styles.empty
                        )}
                        rows={5}
                        cols={80}
                        placeholder="Enter Gene Sets"
                        title="Enter Gene Sets"
                        value={this.store.genesetQuery}
                        onChange={event =>
                            (this.store.genesetQuery =
                                event.currentTarget.value)
                        }
                        data-test="GENESETS_TEXT_AREA"
                    />

                    <Modal
                        className={classNames(
                            'cbioportal-frontend',
                            styles.GenesetsSelectorWindow
                        )}
                        show={this.store.showGenesetsHierarchyPopup}
                        onHide={() =>
                            (this.store.showGenesetsHierarchyPopup = false)
                        }
                    >
                        <Modal.Header closeButton>
                            <Modal.Title>
                                Select Gene Sets From Hierarchy
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <GenesetsHierarchySelector
                                initialSelection={this.store.genesetIds}
                                gsvaProfile={
                                    this.store.getFilteredProfiles(
                                        'GENESET_SCORE'
                                    )[0].molecularProfileId
                                }
                                sampleList={this.store.selectedSampleList}
                                onSelect={map_geneset_selected => {
                                    this.store.applyGenesetSelection(
                                        map_geneset_selected
                                    );
                                    this.store.showGenesetsHierarchyPopup = false;
                                }}
                            />
                        </Modal.Body>
                    </Modal>

                    <Modal
                        className={classNames(
                            'cbioportal-frontend',
                            styles.GenesetsVolcanoSelectorWindow
                        )}
                        show={this.store.showGenesetsVolcanoPopup}
                        onHide={() =>
                            (this.store.showGenesetsVolcanoPopup = false)
                        }
                        onShow={() =>
                            this.store.map_genesets_selected_volcano.replace(
                                this.store.genesetIds.map(geneset => [
                                    geneset,
                                    true,
                                ])
                            )
                        }
                    >
                        <Modal.Header closeButton>
                            <Modal.Title>
                                Select Gene Sets From Volcano Plot
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <GenesetsVolcanoSelector
                                initialSelection={this.store.genesetIds}
                                data={this.store.volcanoPlotTableData.result}
                                plotData={this.store.volcanoPlotGraphData}
                                maxY={
                                    this.store.minYVolcanoPlot
                                        ? -(
                                              Math.log(
                                                  this.store.minYVolcanoPlot
                                              ) / Math.log(10)
                                          )
                                        : undefined
                                }
                                onSelect={map_genesets_selected => {
                                    this.store.addToGenesetSelection(
                                        map_genesets_selected
                                    );
                                    this.store.showGenesetsVolcanoPopup = false;
                                }}
                            />
                        </Modal.Body>
                    </Modal>
                </FlexCol>
            </FlexRow>
        );
    }
}
