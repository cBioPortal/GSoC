import { FunctionComponent } from 'react';
import * as React from 'react';
import { IMultipleCategoryBarPlotData } from 'shared/components/plots/MultipleCategoryBarPlot';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';

import styles from './styles.module.scss';

type CategoryTableProps = {
    data: IMultipleCategoryBarPlotData[];
    labels: string[];
    category?: string;
};

function getColumnDatum(data: IMultipleCategoryBarPlotData, label: string) {
    const datum = data.counts.find(c => c.majorCategory === label);
    return datum?.count || 0;
}

export const CategoryTable: FunctionComponent<CategoryTableProps> = (
    props: CategoryTableProps
) => {
    const columns: Column<IMultipleCategoryBarPlotData>[] = [
        // minor category column
        {
            name: props.category || '',
            render: (d: IMultipleCategoryBarPlotData) => <>{d.minorCategory}</>,
            sortBy: (d: IMultipleCategoryBarPlotData) => d.minorCategory,
            filter: (
                d: IMultipleCategoryBarPlotData,
                f: string,
                filterStringUpper: string
            ) => d.minorCategory.toUpperCase().includes(filterStringUpper),
        },
        // major category columns (groups)
        ...props.labels.map(
            label =>
                ({
                    name: label,
                    align: 'right',
                    render: (d: IMultipleCategoryBarPlotData) => (
                        <div className={styles.numericalData}>
                            {getColumnDatum(d, label)}
                        </div>
                    ),
                    sortBy: (d: IMultipleCategoryBarPlotData) =>
                        getColumnDatum(d, label),
                } as Column<IMultipleCategoryBarPlotData>)
        ),
    ];

    return (
        <LazyMobXTable
            data={props.data}
            columns={columns}
            showColumnVisibility={false}
            showCopyDownload={false}
            paginationProps={{ itemsPerPageOptions: [20] }}
            initialItemsPerPage={20}
        />
    );
};
