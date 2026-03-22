import * as React from 'react';
import { ClinicalData } from 'cbioportal-ts-api-client';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';

import styles from './style/patientTable.module.scss';
import { SHOW_ALL_PAGE_SIZE } from '../../../shared/components/paginationControls/PaginationControls';
import { sortByClinicalAttributePriorityThenName } from '../../../shared/lib/SortUtils';
import { DownloadControlOption, isUrl } from 'cbioportal-frontend-commons';
import autobind from 'autobind-decorator';
import { formatPercentValue } from 'cbioportal-utils';
import { getServerConfig } from 'config/config';

export interface IClinicalInformationPatientTableProps {
    data: ClinicalData[];
    showTitleBar?: boolean;
    cssClass?: string;
    showFilter?: boolean;
    showCopyDownload?: boolean;
    onSelectGenePanel?: (name: string) => void;
}

class PatientTable extends LazyMobXTable<IPatientRow> {}

interface IPatientRow {
    attribute: string;
    value: string;
}

export default class ClinicalInformationPatientTable extends React.Component<
    IClinicalInformationPatientTableProps,
    {}
> {
    private getDisplayValue(data: {
        attribute: string;
        value: string;
    }): string {
        if (isNaN(data.value as any)) {
            return data.value;
        } else {
            const parsedFloat = parseFloat(data.value);
            if (parsedFloat !== parseInt(data.value)) {
                // the values formatted are not percentages in this case however the function cleanly rounds any float to 1 decimal place
                return formatPercentValue(parsedFloat);
            } else {
                return data.value;
            }
        }
    }

    @autobind handleClick(name: string) {
        if (this.props.onSelectGenePanel) {
            this.props.onSelectGenePanel(name);
        }
    }

    renderGenePanelLinks = (genePanels: string) => {
        const links: (string | JSX.Element)[] = [];
        const genePanelsArray = genePanels.split(',');
        genePanelsArray.forEach((panelName, index) => {
            panelName = panelName.trim();
            if (panelName.includes('N/A') || panelName === 'WXS') {
                // No hyperlink/popup for N/A or WXS, since they are not real gene panel ids
                links.push(panelName);
            } else {
                // split gene panel name from "TESTPANEL2 (mut)" to ["TESTPANEL2", "(mut)"]
                const splitGenePanelName = panelName.split(' ');
                links.push(
                    <a onClick={() => this.handleClick(splitGenePanelName[0])}>
                        {panelName}
                    </a>
                );
            }
            if (index < genePanelsArray.length - 1) {
                links.push(', ');
            }
        });
        return <span>{links}</span>;
    };

    public render() {
        const tableData =
            this.props.data &&
            this.props.data
                .sort((a, b) =>
                    sortByClinicalAttributePriorityThenName(
                        a.clinicalAttribute,
                        b.clinicalAttribute
                    )
                )
                .map((el: ClinicalData) => ({
                    attribute: el.clinicalAttribute.displayName || '',
                    value: el.value,
                }));

        return (
            <PatientTable
                data={tableData}
                columns={[
                    {
                        name: 'Attribute',
                        render: data => <span>{data.attribute}</span>,
                        download: data => data.attribute,
                        filter: (
                            data: IPatientRow,
                            filterString: string,
                            filterStringUpper: string
                        ) =>
                            data.attribute
                                .toString()
                                .toUpperCase()
                                .indexOf(filterStringUpper) > -1,
                        sortBy: data => data.attribute,
                    },
                    {
                        name: 'Value',
                        render: data => {
                            if (isUrl(data.value)) {
                                return (
                                    <a href={data.value} target="_blank">
                                        {data.value}
                                    </a>
                                );
                            } else if (data.attribute === 'Gene Panel') {
                                return this.renderGenePanelLinks(data.value);
                            }
                            return <span>{this.getDisplayValue(data)}</span>;
                        },
                        download: data => this.getDisplayValue(data),
                        filter: (
                            data: IPatientRow,
                            filterString: string,
                            filterStringUpper: string
                        ) =>
                            data.value
                                .toString()
                                .toUpperCase()
                                .indexOf(filterStringUpper) > -1,
                    },
                ]}
                showPagination={false}
                showColumnVisibility={false}
                className={styles.patientTable}
                initialItemsPerPage={SHOW_ALL_PAGE_SIZE}
                showFilter={this.props.showFilter === false ? false : true}
                showCopyDownload={
                    getServerConfig().skin_hide_download_controls ===
                    DownloadControlOption.SHOW_ALL
                }
            />
        );
    }
}
