import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { ClinicalDataEnrichmentStore } from './ClinicalData';
import { ClinicalDataEnrichmentWithQ } from './GroupComparisonUtils';
import { toConditionalPrecisionWithMinimum } from '../../shared/lib/FormatUtils';
import { makeObservable, observable } from 'mobx';
import {
    DownloadControlOption,
    toggleColumnVisibility,
} from 'cbioportal-frontend-commons';
import { IColumnVisibilityDef } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import { getServerConfig } from 'config/config';

export interface IClinicalDataEnrichmentsTableProps {
    dataStore: ClinicalDataEnrichmentStore;
}

export enum ClinicalDataEnrichmentTableColumnType {
    CLINICAL_ATTRIBUTE_NAME = 'Clinical Attribute',
    CLINICAL_ATTRIBUTE_TYPE = 'Attribute Type',
    STATISTICAL_TEST_NAME = 'Statistical Test',
    SCORE = 'Score',
    P_VALUE = 'p-Value',
    Q_VALUE = 'q-Value',
}

const COLUMNS = [
    {
        name: ClinicalDataEnrichmentTableColumnType.CLINICAL_ATTRIBUTE_NAME,
        render: (d: ClinicalDataEnrichmentWithQ) => (
            <span
                data-test={d.clinicalAttribute.displayName}
                style={{ fontWeight: d.qValue < 0.05 ? 'bold' : 'normal' }}
            >
                {d.clinicalAttribute.displayName}
            </span>
        ),
        filter: (
            d: ClinicalDataEnrichmentWithQ,
            f: string,
            filterStringUpper: string
        ) =>
            d.clinicalAttribute.displayName
                .toUpperCase()
                .indexOf(filterStringUpper) > -1,
        sortBy: (d: ClinicalDataEnrichmentWithQ) =>
            d.clinicalAttribute.displayName,
        download: (d: ClinicalDataEnrichmentWithQ) =>
            d.clinicalAttribute.displayName,
        width: 160,
        visible: true,
    },
    {
        name: ClinicalDataEnrichmentTableColumnType.CLINICAL_ATTRIBUTE_TYPE,
        render: (d: ClinicalDataEnrichmentWithQ) => (
            <span>
                {d.clinicalAttribute.patientAttribute ? 'Patient' : 'Sample'}
            </span>
        ),
        filter: (
            d: ClinicalDataEnrichmentWithQ,
            f: string,
            filterStringUpper: string
        ) =>
            (d.clinicalAttribute.patientAttribute ? 'Patient' : 'Sample')
                .toUpperCase()
                .indexOf(filterStringUpper) > -1,
        sortBy: (d: ClinicalDataEnrichmentWithQ) =>
            d.clinicalAttribute.patientAttribute ? 'Patient' : 'Sample',
        download: (d: ClinicalDataEnrichmentWithQ) =>
            d.clinicalAttribute.patientAttribute ? 'Patient' : 'Sample',
        width: 100,
        visible: true,
    },
    {
        name: ClinicalDataEnrichmentTableColumnType.STATISTICAL_TEST_NAME,
        render: (d: ClinicalDataEnrichmentWithQ) => (
            <span style={{ whiteSpace: 'nowrap' }}>{d.method}</span>
        ),
        filter: (
            d: ClinicalDataEnrichmentWithQ,
            f: string,
            filterStringUpper: string
        ) => d.method.toUpperCase().indexOf(filterStringUpper) > -1,
        sortBy: (d: ClinicalDataEnrichmentWithQ) => d.method,
        download: (d: ClinicalDataEnrichmentWithQ) => d.method,
        width: 130,
        visible: true,
    },
    {
        name: ClinicalDataEnrichmentTableColumnType.P_VALUE,
        render: (d: ClinicalDataEnrichmentWithQ) => (
            <span
                style={{
                    whiteSpace: 'nowrap',
                    fontWeight: d.qValue < 0.05 ? 'bold' : 'normal',
                }}
            >
                {toConditionalPrecisionWithMinimum(d.pValue, 3, 0.01, -10)}
            </span>
        ),
        sortBy: (d: ClinicalDataEnrichmentWithQ) => d.pValue,
        download: (d: ClinicalDataEnrichmentWithQ) =>
            toConditionalPrecision(d.pValue, 3, 0.01),
        width: 100,
        tooltip: (
            <span>
                p-value of null Hypothesis, derived from Chi-Squared test or
                Kruskal-Wallis test
            </span>
        ),
        visible: true,
    },
    {
        name: ClinicalDataEnrichmentTableColumnType.Q_VALUE,
        render: (d: ClinicalDataEnrichmentWithQ) => (
            <span
                style={{
                    whiteSpace: 'nowrap',
                    fontWeight: d.qValue < 0.05 ? 'bold' : 'normal',
                }}
            >
                {toConditionalPrecisionWithMinimum(d.qValue, 3, 0.01, -10)}
            </span>
        ),
        sortBy: (d: ClinicalDataEnrichmentWithQ) => d.qValue,
        download: (d: ClinicalDataEnrichmentWithQ) =>
            toConditionalPrecision(d.qValue, 3, 0.01),
        width: 100,
        tooltip: (
            <span>
                Derived from Benjamini-Hochberg FDR correction procedure.
            </span>
        ),
        visible: true,
    },
];

@observer
export default class ClinicalDataEnrichmentsTable extends React.Component<
    IClinicalDataEnrichmentsTableProps,
    {}
> {
    @autobind
    private onRowClick(d: ClinicalDataEnrichmentWithQ) {
        this.props.dataStore.setHighlighted(d);
    }

    @observable private columnVisibility: { [group: string]: boolean };
    constructor(props: IClinicalDataEnrichmentsTableProps) {
        super(props);
        makeObservable(this);
        this.columnVisibility = this.initColumnVisibility();
    }

    private initColumnVisibility() {
        const P_Q_VALUES_AND_STATISTICAL_TEST_NAME_DICT = _.keyBy(
            [
                ClinicalDataEnrichmentTableColumnType.STATISTICAL_TEST_NAME,
                ClinicalDataEnrichmentTableColumnType.P_VALUE,
                ClinicalDataEnrichmentTableColumnType.Q_VALUE,
            ],
            name => name
        );
        return _.mapValues(
            _.keyBy(COLUMNS, c => c.name),
            c =>
                getServerConfig()
                    .survival_show_p_q_values_in_survival_type_table
                    ? c.visible!
                    : !(c.name in P_Q_VALUES_AND_STATISTICAL_TEST_NAME_DICT)
        );
    }

    @autobind
    private onColumnToggled(
        columnId: string,
        columnVisibilityDefs: IColumnVisibilityDef[]
    ) {
        this.columnVisibility = toggleColumnVisibility(
            this.columnVisibility,
            columnId,
            columnVisibilityDefs
        );
    }

    public render() {
        return (
            <LazyMobXTable
                columns={COLUMNS}
                initialSortColumn={
                    ClinicalDataEnrichmentTableColumnType.Q_VALUE
                }
                initialSortDirection="asc"
                showColumnVisibility={true}
                showCopyDownload={
                    getServerConfig().skin_hide_download_controls ===
                    DownloadControlOption.SHOW_ALL
                }
                columnVisibility={this.columnVisibility}
                columnVisibilityProps={{
                    onColumnToggled: this.onColumnToggled,
                }}
                dataStore={this.props.dataStore}
                onRowClick={this.onRowClick}
                paginationProps={{ itemsPerPageOptions: [20] }}
                initialItemsPerPage={20}
                copyDownloadProps={{
                    showCopy: false,
                }}
            />
        );
    }
}
