import autobind from 'autobind-decorator';
import * as React from 'react';
import ReactTable, { RowInfo } from 'react-table';

import { GnomadSummary } from '../../model/GnomadSummary';
import { GnomadTableColumnName } from '../../util/GnomadUtils';
import ColumnHeader from '../column/ColumnHeader';

import './gnomadFrequencyTable.scss';

export interface IGnomadFrequencyTableProps {
    data: GnomadSummary[];
    gnomadUrl: string;
    hideDisclaimer?: boolean;
}

export function frequencyOutput(frequency: number) {
    if (frequency === 0) {
        return <span>0</span>;
    } else {
        // show frequency as number with 4 significant digits
        return (
            <span>
                {frequency.toLocaleString(undefined, {
                    maximumSignificantDigits: 2,
                    minimumSignificantDigits: 2,
                })}
            </span>
        );
    }
}

const headerClassName = 'text-wrap font-weight-bold';

const HEADERS = {
    [GnomadTableColumnName.population]: (
        <ColumnHeader
            className={headerClassName}
            headerContent={<span>Population</span>}
        />
    ),
    [GnomadTableColumnName.alleleCount]: (
        <ColumnHeader
            className={headerClassName}
            headerContent={<span>Allele Count</span>}
            overlay={<span>Number of individuals with this allele</span>}
        />
    ),
    [GnomadTableColumnName.alleleNumber]: (
        <ColumnHeader
            className={headerClassName}
            headerContent={<span>Allele Number</span>}
            overlay={
                <span>
                    Number of times any allele has been observed at this
                    position in the population
                </span>
            }
        />
    ),
    [GnomadTableColumnName.homozygotes]: (
        <ColumnHeader
            className={headerClassName}
            headerContent={<span>Number of Homozygotes</span>}
            overlay={
                <span>
                    Number of individuals carrying this allele in both copies
                </span>
            }
        />
    ),
    [GnomadTableColumnName.alleleFrequency]: (
        <ColumnHeader
            className={headerClassName}
            headerContent={<span>Allele Frequency</span>}
            overlay={<span>Proportion of the population with this allele</span>}
        />
    ),
};

function renderNumericalValue(column: any) {
    return <span className="pull-right mr-1">{column.value}</span>;
}

const Disclaimer: React.FunctionComponent<{ gnomadUrl: string }> = props => {
    const myVariantInfoLink = (
        <a href="https://myvariant.info/" target="_blank">
            myvariant.info
        </a>
    );

    const genomeNexusLink = (
        <a href="https://www.genomenexus.org/" target="_blank">
            genomenexus.org
        </a>
    );

    const gnomadLink = (
        <a href={props.gnomadUrl} target="_blank">
            gnomAD
        </a>
    );

    return (
        <div
            style={{
                fontSize: 'x-small',
                textAlign: 'center',
                paddingTop: 5,
            }}
        >
            Source: {genomeNexusLink}, which serves {myVariantInfoLink}'s gnomAD
            data.
            <br />
            Latest {gnomadLink} data may differ.
        </div>
    );
};

export default class GnomadFrequencyTable extends React.Component<
    IGnomadFrequencyTableProps,
    {}
> {
    public render() {
        return (
            <div className="gnomad-frequency-table" data-test="gnomad-table">
                <ReactTable
                    data={this.props.data}
                    showPagination={false}
                    pageSize={this.props.data.length}
                    sortable={false}
                    className="-striped -highlight"
                    getTrProps={this.getTrProps}
                    columns={[
                        {
                            id: GnomadTableColumnName.population,
                            accessor: 'population',
                            Cell: renderNumericalValue,
                            Header: HEADERS[GnomadTableColumnName.population],
                            width: 160,
                        },
                        {
                            id: GnomadTableColumnName.alleleCount,
                            accessor: 'alleleCount',
                            Cell: renderNumericalValue,
                            Header: HEADERS[GnomadTableColumnName.alleleCount],
                            width: 55,
                        },
                        {
                            id: GnomadTableColumnName.alleleNumber,
                            accessor: 'alleleNumber',
                            Cell: renderNumericalValue,
                            Header: HEADERS[GnomadTableColumnName.alleleNumber],
                            width: 80,
                        },
                        {
                            id: GnomadTableColumnName.homozygotes,
                            Cell: renderNumericalValue,
                            accessor: 'homozygotes',
                            Header: HEADERS[GnomadTableColumnName.homozygotes],
                            width: 100,
                        },
                        {
                            id: GnomadTableColumnName.alleleFrequency,
                            accessor: 'alleleFrequency',
                            Header:
                                HEADERS[GnomadTableColumnName.alleleFrequency],
                            Cell: (column: any) => (
                                <span
                                    className="pull-right mr-1"
                                    data-test="allele-frequency-data"
                                >
                                    {frequencyOutput(column.value)}
                                </span>
                            ),
                            width: 120,
                        },
                    ]}
                />
                {!this.props.hideDisclaimer && (
                    <Disclaimer gnomadUrl={this.props.gnomadUrl} />
                )}
            </div>
        );
    }

    @autobind
    protected getTrProps(state: any, row?: RowInfo) {
        return {
            style: {
                fontWeight:
                    state && row && row.index === this.props.data.length - 1
                        ? 'bold'
                        : undefined,
            },
        };
    }
}
