import _ from 'lodash';
import {
    CancerTreeNode,
    CancerTypeWithVisibility,
    NodeMetadata,
} from './CancerStudyTreeData';
import {
    TypeOfCancer as CancerType,
    CancerStudy,
} from 'cbioportal-ts-api-client';
import { QueryStore } from './QueryStore';
import { computed, action, makeObservable } from 'mobx';
import { performSearchSingle } from '../../lib/query/textQueryUtils';
import { cached } from 'cbioportal-frontend-commons';
import { ServerConfigHelpers } from '../../../config/config';
import memoize from 'memoize-weak-decorator';
import { SearchResult } from 'shared/components/query/filteredSearch/SearchClause';
export const PAN_CAN_SIGNATURE = 'pan_can_atlas';

export default class StudyListLogic {
    constructor(private readonly store: QueryStore) {
        makeObservable(this);
    }

    @cached @computed get map_node_filterByDepth() {
        let map_node_filter = new Map<CancerTreeNode, boolean>();
        for (let [node, meta] of this.store.treeData.map_node_meta.entries()) {
            let filter = true;
            if (meta.isCancerType) {
                // exclude cancer types with no descendant studies or cancer types beyond max depth and not always visible
                if (
                    !meta.descendantStudies.length ||
                    (meta.ancestors.length > this.store.maxTreeDepth &&
                        !(node as CancerTypeWithVisibility).alwaysVisible)
                ) {
                    filter = false;
                }
            }
            map_node_filter.set(node, filter);
        }
        return map_node_filter;
    }

    @cached @computed get map_node_filterBySearchText() {
        // first compute individual node match results
        let map_node_searchResult = new Map<CancerTreeNode, SearchResult>();
        for (const [
            study,
            meta,
        ] of this.store.treeData.map_node_meta.entries()) {
            const fullTextSearchNode = { ...(study as CancerStudy), ...meta };
            map_node_searchResult.set(
                study,
                performSearchSingle(
                    this.store.searchClauses,
                    fullTextSearchNode
                )
            );
        }
        let map_node_filter = new Map<CancerTreeNode, boolean>();
        for (let [node, meta] of this.store.treeData.map_node_meta.entries()) {
            if (map_node_filter.has(node)) continue;
            let filter = false;
            for (let item of [
                node,
                ...meta.ancestors,
                ...meta.priorityCategories,
            ]) {
                let result = map_node_searchResult.get(item) as SearchResult;
                if (!result.match && result.forced) {
                    filter = false;
                    break;
                }
                filter = filter || result.match;
            }
            map_node_filter.set(node, filter);

            // include ancestors of matching studies
            if (filter && !meta.isCancerType)
                for (let cancerTypes of [
                    meta.ancestors,
                    meta.priorityCategories,
                ])
                    for (let cancerType of cancerTypes)
                        map_node_filter.set(cancerType, true);
        }
        return map_node_filter;
    }

    @cached @computed get map_node_filtered_by_datatype() {
        // Create a map with all the studies and set all to true (no filter applied)
        let map_node_filter = new Map<CancerTreeNode, boolean>();
        for (let node of this.store.treeData.map_node_meta.keys()) {
            map_node_filter.set(node, true);
        }
        let map_node_dataTypeResult = new Map<CancerTreeNode, boolean>();
        for (let [node, meta] of this.store.treeData.map_node_meta.entries()) {
            if (this.store.dataTypeFilters.length == 0) {
                map_node_dataTypeResult.set(node, true);
            } else {
                let nodeStudy = this.store.cancerStudies.result.find(
                    study => study.name === node.name
                );
                const filterToApply = this.store.dataTypeFilters;
                const filterValue = filterToApply.map(typeId => {
                    // try top-level fields like 'sequencedSampleCount'
                    const value = (nodeStudy as any)?.[typeId];
                    if (typeof value === 'number') {
                        return value > 0;
                    }

                    // check inside resourceCounts array otherwise
                    const resource = nodeStudy?.resourceCounts?.find(
                        r => r.resourceId === typeId
                    );
                    return (resource?.sampleCount || 0) > 0;
                });
                const filterBoolean =
                    filterValue.length == 0
                        ? false
                        : filterValue.every(v => v === true);
                map_node_dataTypeResult.set(node, filterBoolean);

                // include ancestors of matching studies
                if (filterBoolean && !meta.isCancerType)
                    for (let cancerTypes of [
                        meta.ancestors,
                        meta.priorityCategories,
                    ])
                        for (let cancerType of cancerTypes)
                            map_node_dataTypeResult.set(cancerType, true);
            }
        }
        return map_node_dataTypeResult;
    }

    @cached @computed get map_node_filterBySelectedCancerTypes() {
        let map_node_filter = new Map<CancerTreeNode, boolean>();
        if (this.store.selectedCancerTypes.length) {
            for (let cancerType of this.store.selectedCancerTypes) {
                let meta = this.getMetadata(cancerType);

                // include selected cancerType and related nodes
                map_node_filter.set(cancerType, true);
                for (let nodes of [
                    meta.ancestors,
                    meta.descendantCancerTypes,
                    meta.descendantStudies,
                ])
                    for (let node of nodes) map_node_filter.set(node, true);
            }
        } else {
            // include everything if no cancer types are selected
            for (let node of this.store.treeData.map_node_meta.keys())
                map_node_filter.set(node, true);
        }
        return map_node_filter;
    }

    @cached @computed get map_node_filterBySelectedStudies() {
        let map_node_filter = new Map<CancerTreeNode, boolean>();
        if (this.store.selectableSelectedStudies.length) {
            for (let study of this.store.selectableSelectedStudies) {
                let meta = this.store.treeData.map_node_meta.get(
                    study
                ) as NodeMetadata;

                // include selected study and related nodes
                map_node_filter.set(study, true);
                for (let nodes of [
                    meta.descendantStudies,
                    meta.ancestors,
                    meta.priorityCategories,
                ])
                    for (let node of nodes) map_node_filter.set(node, true);
            }
        }
        return map_node_filter;
    }

    getMetadata(node: CancerTreeNode) {
        return this.store.treeData.map_node_meta.get(node) as NodeMetadata;
    }

    @computed get mainView() {
        return new FilteredCancerTreeView(this.store, [
            this.map_node_filterByDepth,
            this.map_node_filterBySearchText,
            this.map_node_filterBySelectedCancerTypes,
            this.map_node_filtered_by_datatype,
        ]);
    }

    @computed get cancerTypeListView() {
        return new FilteredCancerTreeView(this.store, [
            this.map_node_filterByDepth,
            this.map_node_filterBySearchText,
            this.map_node_filtered_by_datatype,
        ]);
    }

    @computed get selectedStudiesView() {
        return new FilteredCancerTreeView(this.store, [
            this.map_node_filterByDepth,
            this.map_node_filterBySelectedStudies,
            {
                get: (node: CancerTreeNode) =>
                    !this.getMetadata(node).isPriorityCategory,
            },
        ]);
    }

    cancerTypeContainsSelectedStudies(cancerType: CancerType): boolean {
        let descendantStudies = this.getMetadata(cancerType).descendantStudies;
        return (
            _.intersection(
                this.store.selectableSelectedStudies,
                descendantStudies
            ).length > 0
        );
    }

    getDepth(node: CancerType): number {
        let meta = this.getMetadata(node);
        return meta.ancestors.length;
    }

    isHighlighted(node: CancerTreeNode): boolean {
        return (
            !!this.store.searchText &&
            !!this.map_node_filterBySearchText.get(node) &&
            !!this.map_node_filtered_by_datatype.get(node)
        );
    }
}

export class FilteredCancerTreeView {
    constructor(
        private store: QueryStore,
        private filters: Pick<Map<CancerTreeNode, boolean>, 'get'>[]
    ) {
        makeObservable(this);
    }

    nodeFilter = (node: CancerTreeNode): boolean => {
        return this.filters.every(map => !!map.get(node));
    };

    getMetadata(node: CancerTreeNode) {
        return this.store.treeData.map_node_meta.get(node) as NodeMetadata;
    }

    getChildCancerTypes(
        cancerType: CancerTypeWithVisibility,
        ignoreAlwaysVisible?: boolean
    ): CancerTypeWithVisibility[] {
        let meta = this.getMetadata(cancerType);
        const childTypes =
            meta.ancestors.length < this.store.maxTreeDepth ||
            (!ignoreAlwaysVisible && cancerType.alwaysVisible)
                ? meta.childCancerTypes
                : [];
        return childTypes.filter(this.nodeFilter);
    }

    getChildCancerStudies(cancerType: CancerTypeWithVisibility): CancerStudy[] {
        let meta = this.getMetadata(cancerType);
        let studies: CancerStudy[] = [];
        if (meta.ancestors.length < this.store.maxTreeDepth) {
            studies = meta.childStudies;
        } else {
            studies = meta.descendantStudies;
            //filter studies that are already shown under cancer type group
            if (cancerType.alwaysVisible) {
                let hideStudiesWithCancerTypes = _.chain(
                    meta.descendantCancerTypes
                )
                    .filter(
                        descendantCancerType =>
                            descendantCancerType.alwaysVisible
                    )
                    .map(
                        descendantCancerType =>
                            descendantCancerType.cancerTypeId
                    )
                    .value();
                studies = _.filter(
                    studies,
                    study =>
                        !hideStudiesWithCancerTypes.includes(study.cancerTypeId)
                );
            }
        }
        return studies.filter(this.nodeFilter);
    }

    getDescendantCancerStudies(node: CancerTreeNode): CancerStudy[] {
        let meta = this.getMetadata(node);
        return meta.descendantStudies.filter(this.nodeFilter);
    }

    getCheckboxProps(
        node: CancerTreeNode
    ): { checked: boolean; indeterminate?: boolean; disabled?: boolean } {
        let meta = this.getMetadata(node);
        if (meta.isCancerType) {
            let selectableSelectedStudyIds =
                this.store.selectableSelectedStudyIds || [];
            let selectedStudies = selectableSelectedStudyIds.map(
                studyId =>
                    this.store.treeData.map_studyId_cancerStudy.get(
                        studyId
                    ) as CancerStudy
            );
            let shownStudies = this.getDescendantCancerStudies(node);
            let shownAndSelectedStudies = _.intersection(
                shownStudies,
                selectedStudies
            );
            let checked = shownAndSelectedStudies.length > 0;
            let indeterminate =
                checked &&
                shownAndSelectedStudies.length != shownStudies.length;

            return { checked, indeterminate };
        } else {
            let study = node as CancerStudy;
            let checked = !!this.store.selectableSelectedStudyIds.find(
                id => id == study.studyId
            );
            let disabled = this.isCheckBoxDisabled(node);
            return { checked, disabled };
        }
    }

    isCheckBoxDisabled(node: CancerTreeNode): boolean {
        let meta = this.getMetadata(node);
        if (meta.isCancerType) {
            return false;
        } else {
            let study = node as CancerStudy;
            if (this.store.isDeletedVirtualStudy(study.studyId)) {
                return true;
            }
            if (study.readPermission === false) {
                return true;
            }
            return false;
        }
    }

    @action clearAllSelection(): void {
        this.store.selectableSelectedStudyIds = [];
    }

    @action onCheck(node: CancerTreeNode, checked: boolean): void {
        let clickedStudyIds;
        let meta = this.getMetadata(node);

        if (meta.isCancerType) {
            if (!this.store.forDownloadTab)
                clickedStudyIds = this.getDescendantCancerStudies(node)
                    // The user can only check studies for which she/he is authorized.
                    .filter(study => study.readPermission)
                    .map(study => study.studyId);
        } else {
            clickedStudyIds = [(node as CancerStudy).studyId];
        }

        if (clickedStudyIds)
            this.handleCheckboxStudyIds(clickedStudyIds, checked);
    }

    getSelectionReport() {
        let selectableSelectedStudyIds =
            this.store.selectableSelectedStudyIds || [];
        let selectableSelectedStudies = selectableSelectedStudyIds.map(
            studyId =>
                this.store.treeData.map_studyId_cancerStudy.get(
                    studyId
                ) as CancerStudy
        );
        let shownStudies = this.getDescendantCancerStudies(
            this.store.treeData.rootCancerType
        );
        let shownAndSelectedStudies = _.intersection(
            shownStudies,
            selectableSelectedStudies
        ) as CancerStudy[];

        return {
            selectableSelectedStudyIds,
            selectableSelectedStudies,
            shownStudies,
            shownAndSelectedStudies,
        };
    }

    @computed get isFiltered() {
        return (
            this.store.selectedCancerTypeIds.length > 0 ||
            this.store.searchText.length > 0 ||
            this.store.dataTypeFilters.length > 0
        );
    }

    // this is temporary until we can better configure quick selection
    // if there are pan can studies and there is no filtering, we want to show quick select button
    @memoize quickSelectButtons(quick_select_buttons: string | null) {
        if (quick_select_buttons) {
            try {
                return ServerConfigHelpers.parseConfigFormat(
                    quick_select_buttons
                );
            } catch (ex) {
                return {};
            }
        } else {
            return {};
        }
    }

    @action toggleAllFiltered() {
        const {
            selectableSelectedStudyIds,
            selectableSelectedStudies,
            shownStudies,
            shownAndSelectedStudies,
        } = this.getSelectionReport();

        let updatedSelectableSelectedStudyIds: string[] = [];
        if (shownStudies.length === shownAndSelectedStudies.length) {
            // deselect
            updatedSelectableSelectedStudyIds = _.without(
                this.store.selectableSelectedStudyIds,
                ...shownStudies.map((study: CancerStudy) => study.studyId)
            );
        } else {
            updatedSelectableSelectedStudyIds = _.union(
                this.store.selectableSelectedStudyIds,
                shownStudies.map((study: CancerStudy) => study.studyId)
            );
        }

        this.store.selectableSelectedStudyIds = updatedSelectableSelectedStudyIds.filter(
            id => !_.includes(this.store.deletedVirtualStudies, id)
        );
    }

    @action selectAllMatchingStudies(match: string | string[]) {
        const {
            selectableSelectedStudyIds,
            selectableSelectedStudies,
            shownStudies,
            shownAndSelectedStudies,
        } = this.getSelectionReport();
        this.store.selectableSelectedStudyIds = shownStudies
            .map(study => study.studyId)
            .filter(studyId => {
                if (_.isArray(match)) {
                    return match.includes(studyId);
                } else {
                    return studyId.includes(match);
                }
            });
    }

    private handleCheckboxStudyIds(
        clickedStudyIds: string[],
        checked: boolean
    ) {
        let selectableSelectedStudyIds = this.store.selectableSelectedStudyIds;
        if (checked)
            selectableSelectedStudyIds = _.union(
                selectableSelectedStudyIds,
                clickedStudyIds
            );
        else
            selectableSelectedStudyIds = _.difference(
                selectableSelectedStudyIds,
                clickedStudyIds
            );

        this.store.selectableSelectedStudyIds = selectableSelectedStudyIds.filter(
            id => !_.includes(this.store.deletedVirtualStudies, id)
        );
    }
}
