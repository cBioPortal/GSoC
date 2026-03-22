import classnames from 'classnames';
import * as React from 'react';
import ReactTable, { Column } from 'react-table';

import Tooltip from 'rc-tooltip';
import { calcProteinChangeSortValue } from 'cbioportal-utils';

import {
    defaultSortMethod,
    defaultStringArraySortMethod,
} from 'cbioportal-utils';
import LevelIcon from './icon/LevelIcon';

export type OncoKbSummaryTableProps = {
    usingPublicOncoKbInstance: boolean;
    data: OncoKbSummary[];
    initialSortColumn?: string;
    initialSortDirection?: 'asc' | 'desc';
    initialItemsPerPage?: number;
};

export type OncoKbSummary = {
    count: number;
    proteinChange: string;
    clinicalImplication: string[];
    biologicalEffect: string[];
    level: { level: string; tumorTypes: string[] }[];
};

export const OncoKbSummaryTable: React.FunctionComponent<OncoKbSummaryTableProps> = (
    props: OncoKbSummaryTableProps
) => {
    const defaultProps = {
        data: [],
        initialSortColumn: 'count',
        initialSortDirection: 'desc',
        initialItemsPerPage: 10,
    };

    function hasLevelData(): boolean {
        return props.data.find(d => d.level.length > 0) !== undefined;
    }

    function getColumns(): Column[] {
        let columns: Column[] = [
            {
                id: 'proteinChange',
                accessor: 'proteinChange',
                Header: 'Protein Change',
                sortMethod: (a: string, b: string) =>
                    defaultSortMethod(
                        calcProteinChangeSortValue(a),
                        calcProteinChangeSortValue(b)
                    ),
            },
            {
                id: 'count',
                accessor: 'count',
                Header: 'Occurrence',
                maxWidth: 80,
            },
            {
                id: 'clinicalImplication',
                accessor: 'clinicalImplication',
                Header: 'Implication',
                Cell: (props: { original: OncoKbSummary }) => (
                    <span>{props.original.clinicalImplication.join(', ')}</span>
                ),
                sortMethod: defaultStringArraySortMethod,
                minWidth: 120,
            },
            {
                id: 'biologicalEffect',
                accessor: 'biologicalEffect',
                Header: 'Effect',
                Cell: (props: { original: OncoKbSummary }) => (
                    <span>{props.original.biologicalEffect.join(', ')}</span>
                ),
                sortMethod: defaultStringArraySortMethod,
                minWidth: 150,
            },
        ];
        if (!props.usingPublicOncoKbInstance) {
            columns.push({
                id: 'level',
                accessor: 'level',
                Header: 'Level',
                sortable: false,
                Cell: (props: { original: OncoKbSummary }) => (
                    <React.Fragment>
                        {props.original.level.map(level => (
                            <div
                                key={level.level}
                                style={{
                                    display: 'flex',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                <LevelIcon
                                    level={level.level}
                                    showDescription
                                />
                                <span
                                    style={{
                                        paddingRight: 3,
                                    }}
                                >
                                    :
                                </span>
                                <div
                                    style={{
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        textOverflow: 'ellipsis',
                                    }}
                                />
                                {level.tumorTypes.join(', ')}
                            </div>
                        ))}
                    </React.Fragment>
                ),
                minWidth: hasLevelData() ? 180 : 50,
            });
        }
        return columns;
    }

    const {
        data,
        initialSortColumn,
        initialSortDirection,
        initialItemsPerPage,
    } = props;

    const showPagination =
        data.length >
        (props.initialItemsPerPage || defaultProps.initialItemsPerPage);

    return (
        <div
            className={classnames(
                'cbioportal-frontend',
                'default-track-tooltip-table'
            )}
        >
            <ReactTable
                data={data}
                columns={getColumns()}
                defaultSorted={[
                    {
                        id: initialSortColumn || defaultProps.initialSortColumn,
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
};
