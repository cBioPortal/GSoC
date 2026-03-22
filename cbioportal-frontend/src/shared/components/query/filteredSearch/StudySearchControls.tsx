import * as React from 'react';
import { FunctionComponent } from 'react';
import { CancerTreeSearchFilter } from 'shared/lib/query/textQueryUtils';
import {
    QueryUpdate,
    SearchClause,
} from 'shared/components/query/filteredSearch/SearchClause';
import { QueryParser } from 'shared/lib/query/QueryParser';
import { FilterFormField } from 'shared/components/query/filteredSearch/field/FilterFormField';
import { CancerStudy } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import { IFilterDef } from '../DataTypeFilter';

export type FilteredSearchDropdownFormProps = {
    query: SearchClause[];
    filterConfig: CancerTreeSearchFilter[];
    onChange: (change: QueryUpdate) => void;
    parser: QueryParser;
};

/**
 * Rendering of search filters as defined in query parser
 */
export const StudySearchControls: FunctionComponent<FilteredSearchDropdownFormProps> = props => {
    return (
        <ul
            data-test="study-search-controls-container"
            className="dropdown-menu"
            style={{
                width: '300px',
            }}
        >
            {props.filterConfig.map((filter, index, filters) => {
                const notFirst = index !== 0;
                const hasPreviousFilter = filters
                    .slice(0, index)
                    .find(showFilter);
                return (
                    showFilter(filter) && (
                        <div>
                            {notFirst && hasPreviousFilter && (
                                <hr style={{ marginTop: '1em' }} />
                            )}
                            <FilterFormField
                                filter={filter}
                                query={props.query}
                                onChange={props.onChange}
                                parser={props.parser}
                            />
                        </div>
                    )
                );
            })}
        </ul>
    );
};

/**
 * Only render filters with multiple options
 * E.g. show reference genome filter when both hg19 and hg38 used
 */
function showFilter(filter: CancerTreeSearchFilter): boolean {
    return filter.form.options.length >= 2;
}

export function getSampleCountsPerFilter(
    studyFilters: IFilterDef[],
    studies: CancerStudy[]
): number[] {
    return _.map(studyFilters, filter => {
        return _.sumBy(studies, study => {
            // try top-level fields like 'sequencedSampleCount'
            const value = (study as any)[filter.id];
            if (_.isNumber(value)) {
                return value;
            }

            // check inside resourceCounts array otherwise
            const resource = _.find(
                study.resourceCounts,
                r => r.resourceId === filter.id
            );
            return resource?.sampleCount || 0;
        });
    });
}

export function getStudyCountPerFilter(
    studyFilters: IFilterDef[],
    studies: CancerStudy[]
): number[] {
    return _.map(studyFilters, filter => {
        return _.filter(studies, study => {
            // try top-level fields like 'sequencedSampleCount'
            const value = (study as any)[filter.id];
            if (_.isNumber(value) && value > 0) {
                return true;
            }

            // check inside resourcesCountsarray otherwise
            const resource = _.find(
                study.resourceCounts,
                r => r.resourceId === filter.id
            );
            return resource ? resource.sampleCount > 0 : false;
        }).length;
    });
}
