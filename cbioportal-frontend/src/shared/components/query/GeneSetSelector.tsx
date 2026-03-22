import * as React from 'react';
import styles from './styles/styles.module.scss';
import { Modal } from 'react-bootstrap';
import ReactSelect from 'react-select1';
import { observer } from 'mobx-react';
import { computed, action, makeObservable } from 'mobx';
import { FlexRow, FlexCol } from '../flexbox/FlexBox';
import gene_lists from './gene_lists';
import classNames from 'classnames';
import { getOncoQueryDocUrl } from '../../api/urls';
import { QueryStoreComponent, Focus, GeneReplacement } from './QueryStore';
import MutSigGeneSelector from './MutSigGeneSelector';
import GisticGeneSelector from './GisticGeneSelector';
import SectionHeader from '../sectionHeader/SectionHeader';
import { getServerConfig } from 'config/config';
import { ServerConfigHelpers } from '../../../config/config';
import OQLTextArea, { GeneBoxType } from '../GeneSelectionBox/OQLTextArea';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { Gene } from 'cbioportal-ts-api-client';
import GenesetsValidator from './GenesetsValidator';
import FontAwesome from 'react-fontawesome';
import GeneSymbolValidationError from './GeneSymbolValidationError';

@observer
export default class GeneSetSelector extends QueryStoreComponent<{}, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @computed get selectedGeneListOption() {
        let option = this.geneListOptions.find(
            opt => opt.value == this.store.geneQuery
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

    @action.bound
    handleOQLUpdate(
        oql: {
            query: SingleGeneQuery[];
            error?: { start: number; end: number; message: string };
        },
        genes: { found: Gene[]; suggestions: GeneReplacement[] },
        queryStr: string
    ): void {
        if (queryStr !== this.store.geneQuery) {
            this.store.geneQuery = queryStr;
            this.store.oql.error = oql.error;
        }
    }

    @computed
    get customError(): JSX.Element | null {
        if (this.store.isQueryLimitReached) {
            return (
                <div className={styles.geneCount}>
                    <div
                        className={''}
                        title={`Please limit your queries to ${this.store.geneLimit} genes or fewer.`}
                    >
                        <FontAwesome
                            className={styles.icon}
                            name="exclamation-circle"
                        />
                        <GeneSymbolValidationError
                            sampleCount={this.store.approxSampleCount}
                            queryProductLimit={
                                getServerConfig().query_product_limit
                            }
                            email={getServerConfig().skin_email_contact}
                        />
                    </div>
                </div>
            );
        }

        return null;
    }

    render() {
        return (
            <FlexRow overflow padded className={styles.GeneSetSelector}>
                <SectionHeader
                    className="sectionLabel"
                    secondaryComponent={
                        <a
                            target="_blank"
                            className={styles.learnOql}
                            href={getOncoQueryDocUrl()}
                        >
                            <strong>Hint:</strong> Learn Onco Query Language
                            (OQL)
                            <br />
                            to write more powerful queries{' '}
                            <i className={'fa fa-external-link'} />
                        </a>
                    }
                >
                    Enter Genes:
                </SectionHeader>

                <FlexCol overflow>
                    <ReactSelect
                        value={this.selectedGeneListOption}
                        options={this.geneListOptions}
                        onChange={(option: any) =>
                            (this.store.geneQuery = option ? option.value : '')
                        }
                    />

                    <OQLTextArea
                        focus={this.store.geneQueryErrorDisplayStatus}
                        inputGeneQuery={this.store.geneQuery}
                        validateInputGeneQuery={true}
                        location={GeneBoxType.DEFAULT}
                        textBoxPrompt={
                            'Enter HUGO Gene Symbols, Gene Aliases, or OQL'
                        }
                        callback={this.handleOQLUpdate}
                        error={this.store.submitError}
                        messages={this.store.oqlMessages}
                    >
                        {this.customError}
                    </OQLTextArea>

                    <GenesetsValidator />

                    <Modal
                        className={classNames(
                            'cbioportal-frontend',
                            styles.MutSigGeneSelectorWindow
                        )}
                        show={this.store.showMutSigPopup}
                        onHide={() => (this.store.showMutSigPopup = false)}
                    >
                        <Modal.Header closeButton>
                            <Modal.Title>Recently Mutated Genes</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <MutSigGeneSelector
                                initialSelection={this.store.geneIds}
                                data={this.store.mutSigForSingleStudy.result}
                                onSelect={map_geneSymbol_selected => {
                                    this.store.applyGeneSelection(
                                        map_geneSymbol_selected
                                    );
                                    this.store.showMutSigPopup = false;
                                }}
                            />
                        </Modal.Body>
                    </Modal>

                    <Modal
                        className={classNames(
                            'cbioportal-frontend',
                            styles.GisticGeneSelectorWindow
                        )}
                        show={this.store.showGisticPopup}
                        onHide={() => (this.store.showGisticPopup = false)}
                    >
                        <Modal.Header closeButton>
                            <Modal.Title>
                                Recurrent Copy Number Alterations (Gistic)
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <GisticGeneSelector
                                initialSelection={this.store.geneIds}
                                data={this.store.gisticForSingleStudy.result}
                                onSelect={map_geneSymbol_selected => {
                                    this.store.applyGeneSelection(
                                        map_geneSymbol_selected
                                    );
                                    this.store.showGisticPopup = false;
                                }}
                            />
                        </Modal.Body>
                    </Modal>
                </FlexCol>
            </FlexRow>
        );
    }
}
