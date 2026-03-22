import * as React from 'react';
import _ from 'lodash';
import { action, computed, makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import {
    PatientTreatmentRow,
    SampleTreatmentRow,
} from 'cbioportal-ts-api-client';
import { SelectionOperatorEnum } from 'pages/studyView/TableUtils';
import styles from 'pages/studyView/table/tables.module.scss';
import { treatmentUniqueKey, TreatmentTableType } from './treatmentsTableUtil';
import { stringListToSet } from 'cbioportal-frontend-commons';
import { SortDirection } from 'shared/components/lazyMobXTable/LazyMobXTable';

type TreatmentsTableProps = {
    filters: string[][];
    tableType: TreatmentTableType;
    onSubmitSelection: (value: string[][]) => void;
    onChangeSelectedRows: (rowsKeys: string[]) => void;
    selectedRowsKeys: string[];
};

export abstract class TreatmentsTable<
    P extends TreatmentsTableProps
> extends React.Component<P, {}> {
    @observable protected _selectionType: SelectionOperatorEnum;
    @observable protected sortDirection: SortDirection;
    @observable protected modalSettings: {
        modalOpen: boolean;
        modalPanelName: string;
    } = {
        modalOpen: false,
        modalPanelName: '',
    };

    abstract get preSelectedRowsKeys(): string[];

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @computed
    get flattenedFilters(): string[] {
        return _.flatMap(this.props.filters);
    }

    @computed
    get allSelectedRowsKeysSet() {
        return stringListToSet([
            ...this.props.selectedRowsKeys,
            ...this.preSelectedRowsKeys,
        ]);
    }

    @computed
    get filterKeyToIndexSet() {
        const keyIndexSet: { [id: string]: number } = {};
        return _.reduce(
            this.props.filters,
            (acc, next, index) => {
                next.forEach(key => {
                    acc[key] = index;
                });
                return acc;
            },
            keyIndexSet
        );
    }

    @computed
    get selectionType(): SelectionOperatorEnum {
        if (this._selectionType) {
            return this._selectionType;
        }
        switch (
            (localStorage.getItem(this.props.tableType) || '').toUpperCase()
        ) {
            case SelectionOperatorEnum.INTERSECTION:
                return SelectionOperatorEnum.INTERSECTION;
            case SelectionOperatorEnum.UNION:
                return SelectionOperatorEnum.UNION;
            default:
                return SelectionOperatorEnum.UNION;
        }
    }

    @autobind
    isDisabled(uniqueKey: string) {
        return _.some(this.preSelectedRowsKeys, key => key === uniqueKey);
    }

    @autobind
    isChecked(uniqueKey: string) {
        return !!this.allSelectedRowsKeysSet[uniqueKey];
    }

    @action.bound
    toggleModal(panelName: string) {
        this.modalSettings.modalOpen = !this.modalSettings.modalOpen;
        if (!this.modalSettings.modalOpen) {
            return;
        }
        this.modalSettings.modalPanelName = panelName;
    }

    @action.bound
    closeModal() {
        this.modalSettings.modalOpen = !this.modalSettings.modalOpen;
    }

    @action.bound
    toggleSelectRow(uniqueKey: string) {
        const record = _.find(
            this.props.selectedRowsKeys,
            key => key === uniqueKey
        );
        if (_.isUndefined(record)) {
            this.props.onChangeSelectedRows(
                this.props.selectedRowsKeys.concat([uniqueKey])
            );
        } else {
            this.props.onChangeSelectedRows(
                _.xorBy(this.props.selectedRowsKeys, [record])
            );
        }
    }

    @action.bound
    afterSelectingRows() {
        if (this.selectionType === SelectionOperatorEnum.UNION) {
            this.props.onSubmitSelection([this.props.selectedRowsKeys]);
        } else {
            this.props.onSubmitSelection(
                this.props.selectedRowsKeys.map(selectedRowsKey => [
                    selectedRowsKey,
                ])
            );
        }
        this.props.onChangeSelectedRows([]);
    }

    @action.bound
    toggleSelectionOperator() {
        const selectionType = this._selectionType || this.selectionType;
        if (selectionType === SelectionOperatorEnum.INTERSECTION) {
            this._selectionType = SelectionOperatorEnum.UNION;
        } else {
            this._selectionType = SelectionOperatorEnum.INTERSECTION;
        }
        localStorage.setItem(this.props.tableType, this.selectionType);
    }

    @autobind
    isSelectedRow(data: PatientTreatmentRow | SampleTreatmentRow) {
        return this.isChecked(treatmentUniqueKey(data));
    }

    @autobind
    selectedRowClassName(data: PatientTreatmentRow | SampleTreatmentRow) {
        const index = this.filterKeyToIndexSet[treatmentUniqueKey(data)];
        if (index === undefined) {
            return this.props.filters.length % 2 === 0
                ? styles.highlightedEvenRow
                : styles.highlightedOddRow;
        }
        return index % 2 === 0
            ? styles.highlightedEvenRow
            : styles.highlightedOddRow;
    }
}
