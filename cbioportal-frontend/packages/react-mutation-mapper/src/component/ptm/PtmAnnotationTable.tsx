import _ from 'lodash';
import classnames from 'classnames';
import * as React from 'react';
import ReactTable, { Column } from 'react-table';
import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';

import {
    Cache,
    MobxCache,
    PostTranslationalModification,
} from 'cbioportal-utils';

import PtmReferenceList from './PtmReferenceList';

export type PtmSummaryTableProps = {
    data: PostTranslationalModification[];
    pubMedCache?: MobxCache;
    initialSortColumn?: string;
    initialSortDirection?: 'asc' | 'desc';
    initialItemsPerPage?: number;
    columnOverrides?: { [id: string]: Partial<Column> };
};

export enum PtmAnnotationTableColumnId {
    POSITION = 'position',
    TYPE = 'type',
    DESCRIPTION = 'description',
    PUBMED_IDS = 'pubmedIds',
}

export const PTM_ANNOTATION_DEFAULT_COLUMNS: { [id: string]: Column } = {
    [PtmAnnotationTableColumnId.POSITION]: {
        id: PtmAnnotationTableColumnId.POSITION,
        accessor: (ptm: PostTranslationalModification) => ptm.residue.start,
        Header: 'Residue',
        Cell: (props: { original: PostTranslationalModification }) => (
            <div style={{ textAlign: 'right' }}>
                {getResidue(props.original)}
            </div>
        ),
        maxWidth: 64,
    },
    [PtmAnnotationTableColumnId.TYPE]: {
        id: PtmAnnotationTableColumnId.TYPE,
        accessor: (ptm: PostTranslationalModification) => ptm.type,
        Header: 'Type',
        minWidth: 100,
    },
    [PtmAnnotationTableColumnId.DESCRIPTION]: {
        id: PtmAnnotationTableColumnId.DESCRIPTION,
        accessor: (ptm: PostTranslationalModification) => ptm.description,
        Header: 'Description',
        minWidth: 180,
    },
    [PtmAnnotationTableColumnId.PUBMED_IDS]: {
        id: PtmAnnotationTableColumnId.PUBMED_IDS,
        Header: '',
        sortable: false,
        maxWidth: 32,
    },
};

function getResidue(ptm: PostTranslationalModification): string {
    if (ptm.residue.end && ptm.residue.end > ptm.residue.start) {
        return `${ptm.residue.start}-${ptm.residue.end}`;
    } else {
        return ptm.residue.start.toString();
    }
}

@observer
export default class PtmAnnotationTable extends React.Component<
    PtmSummaryTableProps
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps = {
        data: [],
        initialSortColumn: 'type',
        initialSortDirection: 'asc',
        initialItemsPerPage: 10,
    };

    @computed
    get pmidData(): Cache {
        if (this.props.pubMedCache) {
            this.props.data.forEach(ptm =>
                (ptm.pubmedIds || []).forEach(id =>
                    this.props.pubMedCache!.get(Number(id))
                )
            );
        }

        return (this.props.pubMedCache && this.props.pubMedCache.cache) || {};
    }

    @computed
    get columns(): Column[] {
        const columnOverrides = this.props.columnOverrides
            ? this.props.columnOverrides
            : {};
        return [
            {
                ...PTM_ANNOTATION_DEFAULT_COLUMNS[
                    PtmAnnotationTableColumnId.POSITION
                ],
                ...columnOverrides[PtmAnnotationTableColumnId.POSITION],
            },
            {
                ...PTM_ANNOTATION_DEFAULT_COLUMNS[
                    PtmAnnotationTableColumnId.TYPE
                ],
                ...columnOverrides[PtmAnnotationTableColumnId.TYPE],
            },
            {
                ...PTM_ANNOTATION_DEFAULT_COLUMNS[
                    PtmAnnotationTableColumnId.DESCRIPTION
                ],
                ...columnOverrides[PtmAnnotationTableColumnId.DESCRIPTION],
            },
            {
                ...PTM_ANNOTATION_DEFAULT_COLUMNS[
                    PtmAnnotationTableColumnId.PUBMED_IDS
                ],
                Cell: this.pubmedCellRender,
                ...columnOverrides[PtmAnnotationTableColumnId.PUBMED_IDS],
            },
        ];
    }

    @computed
    public get pubmedCellRender() {
        let cellRenderFn: (props: {
            original: PostTranslationalModification;
        }) => JSX.Element | null;

        // we need to observe the observable this.pmidData here to trigger a new render cycle,
        // observing it inside the cellRenderFn does not work because it is handled by the table library
        if (!this.props.pubMedCache) {
            cellRenderFn = () => null;
        } else if (!_.isEmpty(this.pmidData)) {
            cellRenderFn = (props: {
                original: PostTranslationalModification;
            }) =>
                !_.isEmpty(props.original.pubmedIds) ? (
                    <PtmReferenceList
                        pmidData={this.pmidData}
                        pubmedIds={props.original.pubmedIds || []}
                    />
                ) : null;
        } else {
            cellRenderFn = (props: {
                original: PostTranslationalModification;
            }) =>
                !_.isEmpty(props.original.pubmedIds) ? (
                    <i className="fa fa-spinner fa-pulse" />
                ) : null;
        }

        return cellRenderFn;
    }

    public render() {
        const {
            data,
            initialSortColumn,
            initialSortDirection,
            initialItemsPerPage,
        } = this.props;

        const showPagination =
            data.length >
            (this.props.initialItemsPerPage ||
                PtmAnnotationTable.defaultProps.initialItemsPerPage);

        return (
            <div
                className={classnames(
                    'cbioportal-frontend',
                    'default-track-tooltip-table'
                )}
            >
                <ReactTable
                    data={data}
                    columns={this.columns}
                    defaultSorted={[
                        {
                            id:
                                initialSortColumn ||
                                PtmAnnotationTable.defaultProps
                                    .initialSortColumn,
                            desc: initialSortDirection === 'desc',
                        },
                    ]}
                    defaultPageSize={
                        data.length > initialItemsPerPage!
                            ? initialItemsPerPage
                            : data.length
                    }
                    showPagination={showPagination}
                    showPaginationTop={true}
                    showPaginationBottom={false}
                    className="-striped -highlight"
                    previousText="<"
                    nextText=">"
                />
            </div>
        );
    }
}
