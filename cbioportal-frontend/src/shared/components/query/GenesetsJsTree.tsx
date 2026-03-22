import React from 'react';
import $ from 'jquery';
import { getHierarchyData } from 'shared/lib/StoreUtils';
//Import jstree.min and style for jstree to work
import 'jstree'; // tslint:disable-line
import 'shared/components/query/styles/jstree/style.css'; // tslint:disable-line
import _ from 'lodash';
import { GenesetHierarchyInfo } from 'cbioportal-ts-api-client';
import { observer } from 'mobx-react';
import { observable, ObservableMap, makeObservable } from 'mobx';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { getServerConfig } from 'config/config';

export interface GenesetsJsTreeProps {
    initialSelection: string[];
    scoreThreshold: number;
    pvalueThreshold: number;
    percentile: number;
    gsvaProfile: string;
    sampleListId: string | undefined;
    searchValue: string;
    onSelect: (map_geneSet_selected: ObservableMap<string, boolean>) => void;
}

type JSNode = {
    original: { description: string; geneset: boolean };
};

@observer
export default class GenesetsJsTree extends React.Component<
    GenesetsJsTreeProps,
    {}
> {
    tree: Element | null;
    @observable isLoading = true;
    promisedTree: Promise<Element>;
    private readonly map_geneSets_selected = new ObservableMap<
        string,
        boolean
    >();

    constructor(props: GenesetsJsTreeProps) {
        super(props);
        makeObservable(this);
        this.map_geneSets_selected.replace(
            props.initialSelection.map(geneSet => [geneSet, true])
        );
    }

    componentDidMount() {
        this.promisedTree = this.initTree(this.tree as Element); //React only sets the div to null when the component unmounts
        this.promisedTree.then(tree => ((this.isLoading = false), tree));
    }

    componentDidUpdate(prevProps: GenesetsJsTreeProps) {
        if (
            this.props.scoreThreshold !== prevProps.scoreThreshold ||
            this.props.pvalueThreshold !== prevProps.pvalueThreshold ||
            this.props.percentile !== prevProps.percentile
        ) {
            this.promisedTree = this.promisedTree
                .then(tree => ((this.isLoading = true), this.replaceTree(tree)))
                .then(tree => ((this.isLoading = false), tree));
        }
        if (this.props.searchValue !== prevProps.searchValue) {
            this.promisedTree = this.promisedTree.then(tree =>
                this.searchTree(tree, this.props.searchValue)
            );
        }
    }

    transformHierarchyData(result_data: GenesetHierarchyInfo[]) {
        const data = result_data;
        const flatData = [];

        // Leafs can be non-unique, therefore a unique ID is necessary,
        // because selecting a duplicate leaf results in a visualization issue.
        let leafId = 0;

        for (const node of data) {
            const nodeName = node.nodeName;
            const nodeParent = node.parentNodeName ? node.parentNodeName : '#';

            flatData.push({
                id: nodeName,
                parent: nodeParent,
                text: nodeName,
                li_attr: {
                    name: nodeName,
                },
                geneset: false,
                state: {
                    opened: !getServerConfig()
                        .skin_geneset_hierarchy_collapse_by_default,
                    selected: false,
                },
            });

            // Check if node has any gene sets, and if so, iterate over them
            if (_.has(node, 'genesets')) {
                for (const geneSet of node.genesets) {
                    const genesetId = leafId++;
                    const genesetName = geneSet.genesetId;
                    const genesetDescription = geneSet.description;
                    const genesetRepresentativeScore =
                        geneSet.representativeScore;
                    let genesetRepresentativePvalue: number | string =
                        geneSet.representativePvalue;
                    const genesetRefLink = geneSet.refLink;
                    let genesetInfo = '';

                    // Add score to leaf
                    genesetInfo =
                        genesetInfo +
                        'score = ' +
                        genesetRepresentativeScore.toFixed(2);

                    // Round pvalue if necessary
                    // 0.005 is rounded to 0.01 and 0.0049 to 0.00, so below 0.005 should be exponential (5e-3)
                    if (genesetRepresentativePvalue < 0.005) {
                        genesetRepresentativePvalue = genesetRepresentativePvalue.toExponential(
                            0
                        );
                    } else {
                        genesetRepresentativePvalue = genesetRepresentativePvalue.toFixed(
                            2
                        );
                    }

                    // Add pvalue to leaf
                    genesetInfo =
                        genesetInfo +
                        ', p-value = ' +
                        genesetRepresentativePvalue;

                    // Build label and add styling
                    const genesetNameText =
                        genesetName +
                        '<span style="font-weight:normal;font-style:italic;"> ' +
                        genesetInfo +
                        '</span>';

                    flatData.push({
                        // Add compulsory information
                        id: genesetId.toString(),
                        parent: nodeName,
                        text: genesetNameText,
                        state: {
                            selected: false,
                        },
                        li_attr: {
                            name: genesetName,
                        },

                        // Also add additional data which might be useful later
                        description: genesetDescription,
                        representativeScore: genesetRepresentativeScore,
                        representativePvalue: genesetRepresentativePvalue,
                        refLink: genesetRefLink,
                        geneset: true,
                    });
                }
            }
        }
        return flatData;
    }

    async initTree(tree: Element): Promise<Element> {
        const hierarchyData = await getHierarchyData(
            this.props.gsvaProfile,
            this.props.percentile,
            this.props.scoreThreshold,
            this.props.pvalueThreshold,
            this.props.sampleListId
        );
        $(tree).jstree({
            search: {
                show_only_matches: true,
                show_only_matches_children: true,
            },
            checkbox: {
                cascade_to_disabled: false,
                cascade_to_hidden: false,
            },
            core: {
                themes: {
                    icons: false,
                },
                check_callback: true,
                data: this.transformHierarchyData(hierarchyData),
            },
            plugins: ['checkbox', 'search'],
        });
        return tree;
    }

    destroyTree(tree: Element) {
        $(tree)
            .jstree(true)
            .destroy();
    }

    async replaceTree(tree: Element): Promise<Element> {
        this.destroyTree(tree);
        return await this.initTree(tree);
    }

    submitGeneSets(tree: Element | null) {
        if (tree) {
            const selectedNodes = $(tree).jstree('get_selected', true);
            for (const geneSet of selectedNodes) {
                if (geneSet.original.geneset) {
                    this.map_geneSets_selected.set(
                        geneSet.original.li_attr.name,
                        true
                    );
                }
            }
        }
        return this.map_geneSets_selected;
    }

    searchTree(tree: Element, searchValue: string) {
        $(tree)
            .jstree(true)
            .search(searchValue);
        return tree;
    }

    render() {
        return (
            <div>
                <LoadingIndicator isLoading={this.isLoading} />
                <div
                    ref={tree => (this.tree = tree)}
                    style={{ maxHeight: '380px', overflowY: 'scroll' }}
                    data-test="gsva-tree-container"
                ></div>
                <div style={{ padding: '30px 0px' }}>
                    <button
                        className="btn btn-primary btn-sm pull-right"
                        style={{ margin: '2px' }}
                        disabled={this.isLoading}
                        onClick={() => {
                            const geneSetsselected = this.submitGeneSets(
                                this.tree
                            );
                            this.props.onSelect(geneSetsselected);
                        }}
                    >
                        Select
                    </button>
                </div>
            </div>
        );
    }
}
