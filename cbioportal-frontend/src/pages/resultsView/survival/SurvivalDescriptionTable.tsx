import { observer } from 'mobx-react';
import * as React from 'react';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';

export interface ISurvivalDescription {
    studyName: string;
    description: string;
    displayName: string;
}

export interface ISurvivalDescriptionTableProps {
    survivalDescriptionData: ISurvivalDescription[];
}

class SurvivalDescriptionTableComponent extends LazyMobXTable<
    ISurvivalDescription
> {}

@observer
export default class SurvivalDescriptionTable extends React.Component<
    ISurvivalDescriptionTableProps,
    {}
> {
    public render() {
        return (
            <SurvivalDescriptionTableComponent
                data={this.props.survivalDescriptionData}
                columns={[
                    {
                        name: 'Study',
                        render: (data: ISurvivalDescription) => (
                            <span>{data.studyName}</span>
                        ),
                        sortBy: (data: ISurvivalDescription) => data.studyName,
                    },
                    {
                        name: 'Description',
                        render: (data: ISurvivalDescription) => (
                            <span>{data.description}</span>
                        ),
                        sortBy: (data: ISurvivalDescription) =>
                            data.description,
                    },
                ]}
                initialSortColumn="Description"
                initialSortDirection={'desc'}
                showPagination={true}
                initialItemsPerPage={10}
                showColumnVisibility={false}
                showFilter={false}
                showCopyDownload={false}
            />
        );
    }
}
