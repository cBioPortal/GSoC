import * as React from 'react';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import styles from './style/mutationalSignatureTable.module.scss';
import { SHOW_ALL_PAGE_SIZE } from '../../../shared/components/paginationControls/PaginationControls';
import { getMutationalSignaturePercentage } from '../../../shared/lib/FormatUtils';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import { MUTATIONAL_SIGNATURES_SIGNIFICANT_PVALUE_THRESHOLD } from 'shared/lib/GenericAssayUtils/MutationalSignaturesUtils';
import Tooltip from 'rc-tooltip';
import { ILazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
export interface IClinicalInformationMutationalSignatureTableProps {
    data: IMutationalSignatureRow[];
    url: string;
    signature: string;
    description: string;
    samples: string[];
    onRowClick: (d: IMutationalSignatureRow) => void;
    onRowMouseEnter?: (d: IMutationalSignatureRow) => void;
    onRowMouseLeave?: (d: IMutationalSignatureRow) => void;
    dataStore: ILazyMobXTableApplicationDataStore<IMutationalSignatureRow>;
}

class MutationalSignatureTable extends LazyMobXTable<IMutationalSignatureRow> {}

export interface IMutationalSignatureRow {
    name: string;
    sampleValues: {
        [sampleId: string]: {
            //each element in the row will contain data about contribution and confidence
            value: number;
            confidence: number;
        };
    };
    description: string;
    url: string;
}

@observer
export default class ClinicalInformationMutationalSignatureTable extends React.Component<
    IClinicalInformationMutationalSignatureTableProps,
    {}
> {
    @observable
    selectedSignature: string;
    constructor(props: IClinicalInformationMutationalSignatureTableProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound getMutationalSignatureProfileData(
        e: React.MouseEvent<Element, MouseEvent>
    ): void {
        this.selectedSignature = e.currentTarget.innerHTML;
    }
    @computed get uniqueSamples() {
        return _.map(
            this.props.data.map(x => Object.keys(x.sampleValues))[0],
            uniqSample => ({
                id: uniqSample,
            })
        );
    }

    @computed get tooltipInfo() {
        return (
            <div
                style={{ maxWidth: 400 }}
                data-test="SignificantMutationalSignaturesTableTooltip"
            >
                <div>
                    <h5>
                        <b>Signature: </b>
                        {this.props.signature}
                    </h5>
                    {this.props.description != '' && (
                        <p style={{ fontSize: '12px' }}>
                            <b>Description: </b>
                            {this.props.description}
                        </p>
                    )}
                    {this.props.description == '' && (
                        <p style={{ fontSize: '12px' }}>
                            No description annnotated in data
                        </p>
                    )}
                    {this.props.url != '' && (
                        <p style={{ fontSize: '12px' }}>
                            <a href={this.props.url} target="_blank">
                                External link to signature (opens new tab)
                            </a>
                        </p>
                    )}
                    {this.props.url == '' && (
                        <p style={{ fontSize: '12px' }}>
                            No url annnotated in data
                        </p>
                    )}
                </div>
            </div>
        );
    }
    readonly firstCol = 'name';
    @computed get columns(): Column<IMutationalSignatureRow>[] {
        return [
            {
                name: 'Mutational Signature',
                render: (data: IMutationalSignatureRow) => (
                    <span>
                        <a target="_blank">{data[this.firstCol]}</a>
                        {'   '}
                        <Tooltip overlay={this.tooltipInfo}>
                            {<i className="fa fa-info-circle"></i>}
                        </Tooltip>
                    </span>
                ),
                download: (data: IMutationalSignatureRow) =>
                    `${data[this.firstCol]}`,
                filter: (
                    data: IMutationalSignatureRow,
                    filterString: string,
                    filterStringUpper: string
                ) =>
                    data[this.firstCol]
                        .toString()
                        .toUpperCase()
                        .indexOf(filterStringUpper) > -1,
                sortBy: (data: IMutationalSignatureRow) => data[this.firstCol],
            },
            ...this.uniqueSamples.map(col => ({
                name: col.id,
                render: (data: IMutationalSignatureRow) =>
                    data.sampleValues[col.id].confidence ? (
                        data.sampleValues[col.id].confidence <
                        MUTATIONAL_SIGNATURES_SIGNIFICANT_PVALUE_THRESHOLD ? ( //if it's a significant signature, bold the contribution
                            // Based on significant pvalue the span is created with style.mutationalSignatureValue for bold (sign)
                            // or normal styling (not signficant)
                            <span
                                className={styles.mutationalSignatureValue}
                                style={{ float: 'right' }}
                            >
                                {getMutationalSignaturePercentage(
                                    data.sampleValues[col.id].value
                                )}
                            </span>
                        ) : (
                            <span style={{ float: 'right' }}>
                                {getMutationalSignaturePercentage(
                                    data.sampleValues[col.id].value
                                )}
                            </span>
                        )
                    ) : (
                        <span style={{ float: 'right' }}>
                            {getMutationalSignaturePercentage(
                                data.sampleValues[col.id].value
                            )}
                        </span>
                    ),
                download: (data: IMutationalSignatureRow) =>
                    `${getMutationalSignaturePercentage(
                        data.sampleValues[col.id].value
                    )}`,
                filter: (
                    data: IMutationalSignatureRow,
                    filterString: string,
                    filterStringUpper: string
                ) =>
                    getMutationalSignaturePercentage(
                        data.sampleValues[col.id].value
                    )
                        .toUpperCase()
                        .indexOf(filterStringUpper) > -1,
                sortBy: (data: IMutationalSignatureRow) =>
                    data.sampleValues[col.id].value,
                align: 'right' as 'right',
            })),
        ];
    }

    public render() {
        return (
            <div style={{ paddingTop: '0' }}>
                <MutationalSignatureTable
                    columns={this.columns}
                    data={this.props.data}
                    dataStore={this.props.dataStore}
                    showPagination={false}
                    initialItemsPerPage={SHOW_ALL_PAGE_SIZE}
                    showColumnVisibility={false}
                    initialSortColumn={this.uniqueSamples[0].id}
                    initialSortDirection="desc"
                    onRowClick={this.props.onRowClick}
                    onRowMouseEnter={this.props.onRowMouseEnter}
                />
            </div>
        );
    }
}
