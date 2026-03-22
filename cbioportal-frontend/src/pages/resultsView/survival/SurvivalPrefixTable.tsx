import * as React from 'react';
import { observer } from 'mobx-react';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import autobind from 'autobind-decorator';
import {
    getSortedFilteredData,
    SimpleGetterLazyMobXTableApplicationDataStore,
} from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { filterNumericalColumn } from 'shared/components/lazyMobXTable/utils';
import _ from 'lodash';
import {
    DownloadControlOption,
    EditableSpan,
    toggleColumnVisibility,
} from 'cbioportal-frontend-commons';
import { IColumnVisibilityDef } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import { observable, computed, makeObservable, action } from 'mobx';
import { getServerConfig } from 'config/config';
import Slider from 'react-rangeslider';
import styles from 'pages/resultsView/survival/styles.module.scss';

export interface ISurvivalPrefixTableProps {
    survivalPrefixes: SurvivalPrefixSummary[];
    groupNames: string[];
    getSelectedPrefix: () => string | undefined;
    setSelectedPrefix: (p: string) => void;
    dataStore?: SurvivalPrefixTableStore;
}

export type SurvivalPrefixSummary = {
    prefix: string;
    displayText: string;
    numPatients: number;
    numPatientsPerGroup: { [groupName: string]: number };
    medianPerGroup: { [groupName: string]: string };
    pValue: number | null;
    qValue: number | null;
};

interface INumPatientsSliderProps {
    maxNumPatients: number;
    minNumPatients: number;
    patientMinThreshold: number;
    onPatientMinThresholdChange: (val: number) => void;
}

@observer
class NumPatientsSlider extends React.Component<INumPatientsSliderProps, any> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    onSliderTextChange(text: string) {
        // check if not a number then send to callback
        const val = Number.parseFloat(text);
        if (!isNaN(val)) {
            this.props.onPatientMinThresholdChange(val);
        }
    }

    render() {
        return (
            <div
                className="small"
                style={{
                    float: 'left',
                    display: 'inline-flex',
                    alignItems: 'center',
                    alignContent: 'center',
                }}
            >
                <span style={{ textAlign: 'center', maxWidth: 95 }}>
                    Min. # Patients per Group:
                </span>
                <div
                    className={'RangeSliderContainer'}
                    style={{
                        width: 75,
                        marginLeft: 10,
                        marginRight: 10,
                    }}
                >
                    <Slider
                        min={this.props.minNumPatients}
                        max={this.props.maxNumPatients}
                        value={this.props.patientMinThreshold}
                        onChange={this.props.onPatientMinThresholdChange}
                        tooltip={false}
                        step={1}
                    />
                </div>
                <EditableSpan
                    className={styles['XmaxNumberInput']}
                    value={this.props.patientMinThreshold.toString()}
                    setValue={this.onSliderTextChange}
                    numericOnly={true}
                />
            </div>
        );
    }
}

export class SurvivalPrefixTableStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    SurvivalPrefixSummary
> {
    @observable patientMinThreshold = getServerConfig()
        .survival_min_group_threshold;

    constructor(
        getData: () => SurvivalPrefixSummary[],
        getSelectedPrefix: () => string | undefined
    ) {
        super(getData);
        makeObservable(this);
        this.dataHighlighter = (d: SurvivalPrefixSummary) => {
            return d.prefix === getSelectedPrefix();
        };
    }

    getSortedFilteredData = () => {
        const dataFilterWithThreshold = (
            d: SurvivalPrefixSummary,
            s: string,
            sU: string,
            sL: string
        ) => {
            return (
                // every group needs at least patientMinThreshold patients
                _.every(
                    Object.values(d.numPatientsPerGroup),
                    x => x >= this.patientMinThreshold
                ) && this.dataFilter(d, s, sU, sL)
            );
        };
        return getSortedFilteredData(
            this.sortedData,
            this.filterString,
            dataFilterWithThreshold
        );
    };
}

enum ColumnName {
    P_VALUE = 'p-Value',
}

function makeGroupColumn(groupName: string) {
    const name = `# in ${groupName}`;
    return {
        name,
        render: (d: SurvivalPrefixSummary) => (
            <span>{d.numPatientsPerGroup[groupName]}</span>
        ),
        sortBy: (d: SurvivalPrefixSummary) => d.numPatientsPerGroup[groupName],
        filter: filterNumericalColumn(
            (d: SurvivalPrefixSummary) => d.numPatientsPerGroup[groupName],
            name
        ),
        download: (d: SurvivalPrefixSummary) =>
            d.numPatientsPerGroup[groupName].toString(),
        visible: false,
    };
}
function makeGroupMedianSurvivalColumn(groupName: string) {
    const name = `Median months survival in ${groupName} (95% CI)`;
    return {
        name,
        render: (d: SurvivalPrefixSummary) => (
            <span>{d.medianPerGroup[groupName]}</span>
        ),
        sortBy: (d: SurvivalPrefixSummary) => {
            const asNumber = parseFloat(d.medianPerGroup[groupName]);
            if (isNaN(asNumber)) {
                return Number.POSITIVE_INFINITY;
            }
            return asNumber;
        },
        filter: filterNumericalColumn((d: SurvivalPrefixSummary) => {
            const asNumber = parseFloat(d.medianPerGroup[groupName]);
            if (isNaN(asNumber)) {
                return Number.POSITIVE_INFINITY;
            }
            return asNumber;
        }, name),
        download: (d: SurvivalPrefixSummary) => d.medianPerGroup[groupName],
        visible: false,
    };
}

const COLUMNS = [
    {
        name: 'Survival Type',
        render: (d: SurvivalPrefixSummary) => <span>{d.displayText}</span>,
        filter: (
            d: SurvivalPrefixSummary,
            f: string,
            filterStringUpper: string
        ) => d.displayText.toUpperCase().indexOf(filterStringUpper) > -1,
        sortBy: (d: SurvivalPrefixSummary) => d.displayText,
        download: (d: SurvivalPrefixSummary) => d.displayText,
        visible: true,
        togglable: false,
    },
    {
        name: 'Number of Patients',
        render: (d: SurvivalPrefixSummary) => <span>{d.numPatients}</span>,
        sortBy: (d: SurvivalPrefixSummary) => d.numPatients,
        download: (d: SurvivalPrefixSummary) => d.numPatients.toString(),
        visible: true,
    },
];
const P_Q_COLUMNS = [
    {
        name: ColumnName.P_VALUE,
        render: (d: SurvivalPrefixSummary) => (
            <span>
                {d.pValue !== null
                    ? toConditionalPrecisionWithMinimum(d.pValue, 3, 0.01, -10)
                    : 'N/A'}
            </span>
        ),
        sortBy: (d: SurvivalPrefixSummary) => d.pValue,
        filter: filterNumericalColumn(
            (d: SurvivalPrefixSummary) => d.pValue,
            ColumnName.P_VALUE
        ),
        download: (d: SurvivalPrefixSummary) =>
            d.pValue !== null
                ? toConditionalPrecision(d.pValue, 3, 0.01)
                : 'N/A',
        tooltip: <span>Derived from Log Rank test.</span>,
        visible: true,
    },
    {
        name: 'q-Value',
        render: (d: SurvivalPrefixSummary) => (
            <span>
                {d.qValue !== null
                    ? toConditionalPrecisionWithMinimum(d.qValue, 3, 0.01, -10)
                    : 'N/A'}
            </span>
        ),
        sortBy: (d: SurvivalPrefixSummary) => d.qValue,
        filter: filterNumericalColumn(
            (d: SurvivalPrefixSummary) => d.qValue,
            'q-Value'
        ),
        download: (d: SurvivalPrefixSummary) =>
            d.qValue !== null
                ? toConditionalPrecision(d.qValue, 3, 0.01)
                : 'N/A',
        tooltip: (
            <span>
                Derived from Benjamini-Hochberg FDR correction procedure.
            </span>
        ),
        visible: true,
    },
];

@observer
export default class SurvivalPrefixTable extends React.Component<
    ISurvivalPrefixTableProps,
    {}
> {
    private dataStore: SurvivalPrefixTableStore;
    @observable private columnVisibility: { [group: string]: boolean };

    constructor(props: ISurvivalPrefixTableProps) {
        super(props);
        makeObservable(this);
        this.dataStore =
            props.dataStore ||
            new SurvivalPrefixTableStore(
                () => this.props.survivalPrefixes,
                this.props.getSelectedPrefix
            );
        this.columnVisibility = this.initColumnVisibility();
    }

    private initColumnVisibility() {
        return _.mapValues(
            _.keyBy(this.columns, c => c.name),
            c => c.visible!
        );
    }
    @autobind
    private onRowClick(d: SurvivalPrefixSummary) {
        this.props.setSelectedPrefix(d.prefix);
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

    @computed get columns() {
        // insert "Num patients in group" columns right before p value
        const cols: Column<SurvivalPrefixSummary>[] = [
            ...COLUMNS,
            ...this.props.groupNames.map(makeGroupColumn),
            ...this.props.groupNames.map(makeGroupMedianSurvivalColumn),
        ];
        if (getServerConfig().survival_show_p_q_values_in_survival_type_table) {
            cols.push(...P_Q_COLUMNS);
        }
        return cols;
    }

    @computed get minNumPatients() {
        return Math.min(
            ...this.dataStore.allData.map(v =>
                Math.min(...Object.values(v.numPatientsPerGroup))
            )
        );
    }

    @computed get maxNumPatients() {
        // get the max of minimum of all groups to always show at least one row
        return Math.max(
            ...this.dataStore.allData.map(v =>
                Math.min(...Object.values(v.numPatientsPerGroup))
            )
        );
    }

    @action.bound
    private onPatientMinThresholdChange(val: number) {
        this.dataStore.patientMinThreshold = val;
    }

    public render() {
        return (
            <LazyMobXTable
                columns={this.columns}
                showColumnVisibility={true}
                columnVisibility={this.columnVisibility}
                columnVisibilityProps={{
                    onColumnToggled: this.onColumnToggled,
                    className: 'pull-right SurvivalPrefixTableVisibilityColumn',
                }}
                headerComponent={
                    <NumPatientsSlider
                        maxNumPatients={this.maxNumPatients}
                        minNumPatients={this.minNumPatients}
                        patientMinThreshold={this.dataStore.patientMinThreshold}
                        onPatientMinThresholdChange={
                            this.onPatientMinThresholdChange
                        }
                    />
                }
                initialSortColumn={ColumnName.P_VALUE}
                initialSortDirection={'asc'}
                dataStore={this.dataStore}
                onRowClick={this.onRowClick}
                paginationProps={{ itemsPerPageOptions: [15] }}
                initialItemsPerPage={15}
                copyDownloadProps={{
                    showCopy: false,
                }}
                filterBoxWidth={120}
                showCopyDownload={
                    getServerConfig().skin_hide_download_controls !==
                    DownloadControlOption.HIDE_ALL
                }
            />
        );
    }
}
