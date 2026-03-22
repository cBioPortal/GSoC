import { ISignalTumorTypeDecomposition } from 'cbioportal-utils';
import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import ReactTable, { Column } from 'react-table';
import {
    FrequencyTableColumnEnum,
    FREQUENCY_COLUMNS_DEFINITION,
} from './SignalHelper';

import 'react-table/react-table.css';
import './styles.scss';

export interface ITumorTypeFrequencyTableProps {
    data: ISignalTumorTypeDecomposition[];
    columns?: Partial<Column<ISignalTumorTypeDecomposition>>[];
}

@observer
class MutationTumorTypeFrequencyTable extends React.Component<
    ITumorTypeFrequencyTableProps
> {
    static readonly defaultProps: Partial<ITumorTypeFrequencyTableProps> = {
        columns: [
            FREQUENCY_COLUMNS_DEFINITION[FrequencyTableColumnEnum.TUMOR_TYPE],
            FREQUENCY_COLUMNS_DEFINITION[
                FrequencyTableColumnEnum.MUTATION_STATUS
            ],
            FREQUENCY_COLUMNS_DEFINITION[FrequencyTableColumnEnum.SAMPLE_COUNT],
            FREQUENCY_COLUMNS_DEFINITION[
                FrequencyTableColumnEnum.VARIANT_COUNT
            ],
            FREQUENCY_COLUMNS_DEFINITION[
                FrequencyTableColumnEnum.NUMBER_OF_GERMLINE_HOMOZYGOUS
            ],
            FREQUENCY_COLUMNS_DEFINITION[
                FrequencyTableColumnEnum.PREVALENCE_FREQUENCY
            ],
            FREQUENCY_COLUMNS_DEFINITION[
                FrequencyTableColumnEnum.BIALLELIC_RATIO
            ],
            FREQUENCY_COLUMNS_DEFINITION[
                FrequencyTableColumnEnum.MEDIAN_AGE_AT_DX
            ],
            FREQUENCY_COLUMNS_DEFINITION[FrequencyTableColumnEnum.MEDIAN_TMB],
            FREQUENCY_COLUMNS_DEFINITION[FrequencyTableColumnEnum.MSI_SCORE],
            FREQUENCY_COLUMNS_DEFINITION[
                FrequencyTableColumnEnum.MEDIAN_HRD_LST
            ],
            FREQUENCY_COLUMNS_DEFINITION[
                FrequencyTableColumnEnum.MEDIAN_HRD_NTELOMERIC_AI
            ],
            FREQUENCY_COLUMNS_DEFINITION[
                FrequencyTableColumnEnum.MEDIAN_HRD_FRACTION_LOH
            ],
        ],
    };

    constructor(props: ITumorTypeFrequencyTableProps) {
        super(props);
        makeObservable(this);
    }

    @computed
    private get defaultPageSize() {
        if (this.props.data.length > 10) {
            return 10;
        } else if (this.props.data.length === 0) {
            return 1;
        } else {
            return this.props.data.length;
        }
    }

    public render() {
        return (
            <div className={`cbioportal-frontend default-data-table`}>
                <ReactTable
                    data={this.props.data}
                    columns={this.props.columns}
                    defaultSorted={[
                        {
                            id: FrequencyTableColumnEnum.PREVALENCE_FREQUENCY,
                            desc: true,
                        },
                    ]}
                    defaultSortDesc={true}
                    defaultPageSize={this.defaultPageSize}
                    showPagination={
                        this.defaultPageSize !== this.props.data.length
                    }
                    minRows={0}
                    className="-striped -highlight"
                    previousText="<"
                    nextText=">"
                />
            </div>
        );
    }
}

export default MutationTumorTypeFrequencyTable;
