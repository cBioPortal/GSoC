import * as React from 'react';
import PathwayMapperTable, {
    IPathwayMapperTable,
} from '../../../shared/lib/pathwayMapper/PathwayMapperTable';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { action, computed, makeObservable, observable } from 'mobx';
import { Row } from 'react-bootstrap';

import PathwayMapper from 'pathway-mapper';

import 'pathway-mapper/dist/base.css';
import 'cytoscape-panzoom/cytoscape.js-panzoom.css';
import 'cytoscape-navigator/cytoscape.js-navigator.css';
import { AlterationEnrichmentRow } from 'shared/model/AlterationEnrichmentRow';
import { ComparisonGroup } from '../GroupComparisonUtils';
import { GenesSelection } from 'pages/resultsView/enrichments/GeneBarPlot';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import GroupComparisonStore from '../GroupComparisonStore';
import { GeneOptionLabel } from 'pages/resultsView/enrichments/EnrichmentsUtil';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import GroupComparisonPathwayMapperUserSelectionStore from './GroupComparisonPathwayMapperUserSelectionStore';

interface IGroupComparisonPathwayMapperProps {
    activeGroups: ComparisonGroup[] | undefined;
    genomicData: AlterationEnrichmentRow[];
    groupComparisonStore: GroupComparisonStore;
    userSelectionStore?: GroupComparisonPathwayMapperUserSelectionStore;
}

@observer
export default class GroupComparisonPathwayMapper extends React.Component<
    IGroupComparisonPathwayMapperProps
> {
    private userSelectionStore: GroupComparisonPathwayMapperUserSelectionStore;

    constructor(props: IGroupComparisonPathwayMapperProps) {
        super(props);
        makeObservable(this);

        // @ts-ignore
        import(/* webpackChunkName: "pathway-mapper" */ 'pathway-mapper').then(
            (module: any) => {
                this.PathwayMapperComponent = (module as any)
                    .default as PathwayMapper;
            }
        );
        this.userSelectionStore =
            this.props.userSelectionStore ||
            new GroupComparisonPathwayMapperUserSelectionStore();
    }

    @observable.ref PathwayMapperComponent:
        | PathwayMapper
        | undefined = undefined;
    @observable isGeneSelectionPopupVisible: boolean = false;

    @computed get activeGenes() {
        return (
            this.userSelectionStore.selectedGenes ||
            this.props.groupComparisonStore.genesSortedByAlterationFrequency.result?.slice(
                0,
                10
            ) ||
            []
        );
    }

    @computed get alterationEnrichmentRowData(): AlterationEnrichmentRow[] {
        return (
            this.props.groupComparisonStore.alterationEnrichmentRowData
                .result || []
        ).filter(gene => {
            return this.activeGenes.includes(gene.hugoGeneSymbol);
        });
    }

    @action.bound onSelectedGenesChange(
        value: string,
        genes: SingleGeneQuery[],
        label: GeneOptionLabel
    ) {
        this.userSelectionStore.selectedGenes = genes.map(g => g.gene);
        this.isGeneSelectionPopupVisible = false;
    }

    public render() {
        if (!this.PathwayMapperComponent) {
            return null;
        }
        return (
            <div>
                <div className="alert alert-info">
                    Ranking is based on top 10 genes having highest frequency by
                    default. Genes of interest can be changed.
                    <DefaultTooltip
                        trigger={['click']}
                        destroyTooltipOnHide={true}
                        visible={this.isGeneSelectionPopupVisible}
                        onVisibleChange={visible => {
                            this.isGeneSelectionPopupVisible = !this
                                .isGeneSelectionPopupVisible;
                        }}
                        overlay={
                            <GenesSelection
                                options={[]}
                                selectedOption={{
                                    label: GeneOptionLabel.USER_DEFINED_OPTION,
                                    value: this.activeGenes.join('\n'),
                                }}
                                onSelectedGenesChange={
                                    this.onSelectedGenesChange
                                }
                                defaultNumberOfGenes={10}
                            />
                        }
                        placement="bottomLeft"
                    >
                        <button
                            data-test="selectGenes"
                            className="btn btn-default btn-xs"
                            style={{ marginLeft: 5 }}
                        >
                            Select genes
                        </button>
                    </DefaultTooltip>
                </div>
                <div className="pathwayMapper">
                    <div
                        data-test="pathwayMapperTabDiv"
                        className="cBioMode"
                        style={{ width: '99%' }}
                    >
                        <Row>
                            {/*
                              // @ts-ignore */}
                            <this.PathwayMapperComponent
                                isCBioPortal={true}
                                isCollaborative={false}
                                genes={this.alterationEnrichmentRowData as any}
                                cBioAlterationData={[]}
                                genomicData={this.props.genomicData as any}
                                tableComponent={this.renderTable}
                                patientView={false}
                                groupComparisonView={true}
                                activeGroups={this.props.activeGroups as any}
                                currentPathway={
                                    this.userSelectionStore.currentPathway
                                }
                                rankingChoices={
                                    this.userSelectionStore.rankingChoices
                                }
                                updateRankingChoices={
                                    this.userSelectionStore.updateRankingChoices
                                }
                            />
                        </Row>
                    </div>
                </div>
            </div>
        );
    }

    @autobind
    private renderTable(
        data: IPathwayMapperTable[],
        selectedPathway: string,
        onPathwaySelect: (pathway: string) => void
    ) {
        return (
            <PathwayMapperTable
                data={data}
                selectedPathway={selectedPathway}
                changePathway={onPathwaySelect}
            />
        );
    }
}
