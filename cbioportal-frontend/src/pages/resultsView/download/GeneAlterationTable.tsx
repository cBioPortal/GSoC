import { observer } from 'mobx-react';
import * as React from 'react';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import FrequencyBar from 'shared/components/cohort/FrequencyBar';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';

export interface IGeneAlteration {
    gene: string;
    oqlLine: string;
    sequenced: number;
    altered: number;
    percentAltered: string;
}

export interface IGeneAlterationTableProps {
    geneAlterationData: IGeneAlteration[];
}

class GeneAlterationTableComponent extends LazyMobXTable<IGeneAlteration> {}

@observer
export default class GeneAlterationTable extends React.Component<
    IGeneAlterationTableProps,
    {}
> {
    public render() {
        return (
            <GeneAlterationTableComponent
                data={this.props.geneAlterationData}
                columns={[
                    {
                        name: 'Gene Symbol',
                        render: (data: IGeneAlteration) => (
                            <span>{data.gene}</span>
                        ),
                        download: (data: IGeneAlteration) => data.gene,
                        sortBy: (data: IGeneAlteration) => data.gene,
                        filter: (
                            data: IGeneAlteration,
                            filterString: string,
                            filterStringUpper: string
                        ) => {
                            return (
                                data.gene
                                    .toUpperCase()
                                    .indexOf(filterStringUpper) > -1
                            );
                        },
                    },
                    {
                        name: 'OQL Line',
                        visible: false,
                        render: (data: IGeneAlteration) => (
                            <span>{data.oqlLine}</span>
                        ),
                        download: (data: IGeneAlteration) => data.oqlLine,
                        sortBy: (data: IGeneAlteration) => data.oqlLine,
                        filter: (
                            data: IGeneAlteration,
                            filterString: string,
                            filterStringUpper: string
                        ) => {
                            return (
                                data.oqlLine
                                    .toUpperCase()
                                    .indexOf(filterStringUpper) > -1
                            );
                        },
                    },
                    {
                        name: 'Num Samples Altered',
                        render: (data: IGeneAlteration) => (
                            <span>
                                {data.sequenced ? data.altered : 'Not Profiled'}
                            </span>
                        ),
                        download: (data: IGeneAlteration) =>
                            data.sequenced ? `${data.altered}` : 'N/P',
                        sortBy: (data: IGeneAlteration) => data.altered,
                    },
                    {
                        name: 'Percent Samples Altered',
                        render: (data: IGeneAlteration) =>
                            data.sequenced ? (
                                <FrequencyBar
                                    barWidth={200}
                                    textWidth={45}
                                    counts={[data.altered]}
                                    totalCount={data.sequenced}
                                />
                            ) : (
                                <span>Not Profiled</span>
                            ),
                        download: (data: IGeneAlteration) =>
                            data.percentAltered,
                        sortBy: (data: IGeneAlteration) =>
                            data.altered / data.sequenced,
                    },
                ]}
                initialSortColumn="Percent Samples Altered"
                initialSortDirection={'desc'}
                showPagination={true}
                initialItemsPerPage={10}
                showColumnVisibility={true}
                showFilter={true}
                showCopyDownload={
                    getServerConfig().skin_hide_download_controls !==
                    DownloadControlOption.HIDE_ALL
                }
                copyDownloadProps={{
                    downloadFilename: 'gene_alteration_frequency.tsv',
                }}
            />
        );
    }
}
