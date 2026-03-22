import * as React from 'react';
import _ from 'lodash';
import { CancerStudy } from 'cbioportal-ts-api-client';
import { ThreeBounce } from 'better-react-spinkit';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import { getNCBIlink } from 'cbioportal-frontend-commons';
import { StudyLink } from '../../../shared/components/StudyLink/StudyLink';
import { StudyDataDownloadLink } from '../../../shared/components/StudyDataDownloadLink/StudyDataDownloadLink';
import { getServerConfig } from 'config/config';

interface IDataTableRow {
    name: string;
    reference: string;
    studyId: string;
    pmid: string;
    all: number | string;
    sequenced: number | string;
    cna: number;
    mrnaRnaSeq: number | string;
    mrnaRnaSeqV2: number | string;
    mrnaMicroarray: number | string;
    miRna: number | string;
    methylation: number | string;
    rppa: number | string;
    massSpectrometry: number | string;
    complete: number | string;
    citation: string;
}

interface IDataSetsTableProps {
    className?: string;
    datasets: CancerStudy[];
    downloadables: string[];
}

interface ICancerStudyCellProps {
    name: string;
    studyId: string;
}

interface IReferenceCellProps {
    citation: string;
    pmid: string;
}

class DataTable extends LazyMobXTable<IDataTableRow> {}

class CancerStudyCell extends React.Component<ICancerStudyCellProps, {}> {
    render() {
        return (
            <StudyLink studyId={this.props.studyId}>
                {this.props.name}
            </StudyLink>
        );
    }
}

class ReferenceCell extends React.Component<IReferenceCellProps, {}> {
    render() {
        return this.props.citation ? (
            <a target="_blank" href={getNCBIlink(`/pubmed/${this.props.pmid}`)}>
                {' '}
                {this.props.citation}{' '}
            </a>
        ) : (
            <></>
        );
    }
}

export default class DataSetsPageTable extends React.Component<
    IDataSetsTableProps
> {
    chartTarget: HTMLElement;

    render() {
        if (this.props.datasets) {
            const tableData: IDataTableRow[] = _.map(
                this.props.datasets,
                (study: CancerStudy) => ({
                    name: study.name,
                    reference: study.citation,
                    all: study.allSampleCount || '',
                    pmid: study.pmid,
                    studyId: study.studyId,
                    sequenced: study.sequencedSampleCount || '',
                    cna: study.cnaSampleCount,
                    citation: study.citation || '',
                    mrnaRnaSeq: study.mrnaRnaSeqSampleCount || '',
                    mrnaRnaSeqV2: study.mrnaRnaSeqV2SampleCount || '',
                    mrnaMicroarray: study.mrnaMicroarraySampleCount || '',
                    miRna: study.miRnaSampleCount || '',
                    methylation: study.methylationHm27SampleCount || '',
                    rppa: study.rppaSampleCount || '',
                    massSpectrometry: study.massSpectrometrySampleCount || '',
                    complete: study.completeSampleCount || '',
                    treatmentCount: study.treatmentCount || '',
                    structuralVariantCount: study.structuralVariantCount || '',
                })
            );
            return (
                <div ref={(el: HTMLDivElement) => (this.chartTarget = el)}>
                    <DataTable
                        data={tableData}
                        columns={[
                            {
                                name: 'Name',
                                type: 'name',
                                render: (data: IDataTableRow) => (
                                    <CancerStudyCell
                                        studyId={data.studyId}
                                        name={data.name}
                                    />
                                ),
                                filter: (
                                    data: any,
                                    filterString: string,
                                    filterStringUpper: string
                                ) => {
                                    return data.name
                                        .toUpperCase()
                                        .includes(filterStringUpper);
                                },
                            },
                            {
                                name: '',
                                sortBy: false,
                                togglable: false,
                                download: false,
                                type: 'download',
                                render: (data: IDataTableRow) => {
                                    const studyIsDownloadable = this.props.downloadables.includes(
                                        data.studyId
                                    );
                                    if (
                                        getServerConfig()
                                            .feature_study_export ||
                                        studyIsDownloadable
                                    ) {
                                        return (
                                            <StudyDataDownloadLink
                                                studyId={data.studyId}
                                            />
                                        );
                                    } else {
                                        return null;
                                    }
                                },
                            },
                            {
                                name: 'Reference',
                                type: 'citation',
                                render: (data: IDataTableRow) => (
                                    <ReferenceCell
                                        pmid={data.pmid}
                                        citation={data.citation}
                                    />
                                ),
                                filter: (
                                    data: any,
                                    filterString: string,
                                    filterStringUpper: string
                                ) => {
                                    return data.citation
                                        .toUpperCase()
                                        .includes(filterStringUpper);
                                },
                            },
                            { name: 'All', type: 'all' },
                            { name: 'Mutations', type: 'sequenced' }, // product team requested this be titled mutations
                            { name: 'CNA', type: 'cna' },
                            {
                                name: 'RNA-Seq',
                                type: 'mrnaRnaSeq',
                                render: (data: IDataTableRow) => {
                                    return (
                                        <span>
                                            {Number(data.mrnaRnaSeqV2) ||
                                                Number(data.mrnaRnaSeq) ||
                                                0}
                                        </span>
                                    );
                                },
                                sortBy: (data: IDataTableRow) =>
                                    Number(data.mrnaRnaSeqV2) ||
                                    Number(data.mrnaRnaSeq) ||
                                    0,
                            },
                            {
                                name: 'Structural Variants',
                                type: 'structuralVariantCount',
                                visible: false,
                            },
                            {
                                name: 'Tumor mRNA (microarray)',
                                type: 'mrnaMicroarray',
                                visible: false,
                            },
                            {
                                name: 'Tumor miRNA',
                                type: 'miRna',
                                visible: false,
                            },
                            {
                                name: 'Methylation (HM27)',
                                type: 'methylation',
                                visible: false,
                            },
                            { name: 'RPPA', type: 'rppa', visible: false },
                            {
                                name: 'Protein Mass Spectrometry',
                                type: 'massSpectrometry',
                                visible: false,
                            },
                            {
                                name: 'Complete',
                                type: 'complete',
                                visible: false,
                            },
                            {
                                name: 'Treatment Count',
                                type: 'treatmentCount',
                                visible: false,
                            },
                        ].map((column: any) => ({
                            visible: column.visible === false ? false : true,
                            togglable:
                                column.togglable === false ? false : true,
                            name: column.name,
                            defaultSortDirection: 'asc' as 'asc',
                            sortBy: column.hasOwnProperty('sortBy')
                                ? column.sortBy
                                : (data: any) => data[column.type],
                            render: column.hasOwnProperty('render')
                                ? column.render
                                : (data: any) => {
                                      const style = {}; // {textAlign: 'center', width: '100%', display: 'block'}
                                      return (
                                          <span style={style}>
                                              {data[column.type] || 0}
                                          </span>
                                      );
                                  },
                            download: column.hasOwnProperty('download')
                                ? column.download
                                : false,
                            filter: column.filter || undefined,
                        }))}
                        initialSortColumn={'Name'}
                        initialSortDirection={'asc'}
                        showPagination={false}
                        showColumnVisibility={true}
                        showFilter={true}
                        showFilterClearButton={true}
                        showCopyDownload={false}
                        initialItemsPerPage={this.props.datasets.length}
                    />
                </div>
            );
        } else {
            return (
                <div>
                    <ThreeBounce />
                </div>
            );
        }
    }
}
