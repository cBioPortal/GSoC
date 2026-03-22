import Tooltip from 'rc-tooltip';
import { Implication } from 'oncokb-ts-api-client';
import * as React from 'react';

import OncoKbHelper from '../OncoKbHelper';
import ReactTable from 'react-table';
import { EvidenceReferenceContent } from './EvidenceReferenceContent';
import mainStyles from '../main.module.scss';

type ImplicationContentProps = {
    variant: string;
    summary: string;
    implications: Implication[];
};

export const ImplicationContent: React.FunctionComponent<ImplicationContentProps> = (
    props: ImplicationContentProps
) => {
    const columns = [
        {
            ...OncoKbHelper.getDefaultColumnDefinition('level'),
            accessor: 'levelOfEvidence',
            maxWidth: 100,
        },
        {
            ...OncoKbHelper.getDefaultColumnDefinition('alterations'),
            Cell: (cellProps: { value: string[] }) => {
                return OncoKbHelper.getAlterationsColumnCell(
                    cellProps.value,
                    props.variant
                );
            },
        },
        {
            id: 'referenceList',
            Header: <span />,
            sortable: false,
            maxWidth: 50,
            Cell: (cellProps: { original: Implication }) => (
                <Tooltip
                    overlay={() => (
                        <div className={mainStyles['tooltip-refs']}>
                            <EvidenceReferenceContent
                                description={cellProps.original.description}
                                citations={{
                                    pmids: cellProps.original.pmids,
                                    abstracts: cellProps.original.abstracts,
                                }}
                                noInfoDisclaimer={
                                    'Mutation effect information is not available.'
                                }
                            />
                        </div>
                    )}
                    placement="right"
                    trigger={['hover', 'focus']}
                    destroyTooltipOnHide={true}
                >
                    <i className="fa fa-book" />
                </Tooltip>
            ),
        },
    ];

    return (
        <div>
            <p>{props.summary}</p>
            <div>
                <ReactTable
                    data={props.implications}
                    columns={columns}
                    showPagination={false}
                    pageSize={props.implications.length}
                    className="-striped -highlight"
                />
            </div>
        </div>
    );
};
