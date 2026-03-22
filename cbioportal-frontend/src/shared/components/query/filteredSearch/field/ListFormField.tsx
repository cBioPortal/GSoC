import { FieldProps } from 'shared/components/query/filteredSearch/field/FilterFormField';
import * as React from 'react';
import { FunctionComponent } from 'react';
import { SearchClause } from 'shared/components/query/filteredSearch/SearchClause';
import { Phrase } from 'shared/components/query/filteredSearch/Phrase';
import './ListFormField.scss';
import { toQueryString } from 'shared/lib/query/textQueryUtils';

export type ListFilterField = {
    label: string;
    input: typeof FilterList;
    options: string[];
};

export const FilterList: FunctionComponent<FieldProps> = props => {
    const form = props.filter.form as ListFilterField;
    const allPhrases = toUniquePhrases(props.query);
    const queryString = toQueryString(props.query);
    return (
        <div className="filter-list">
            <h5>{props.filter.form.label}</h5>
            {form.options.map(option => {
                const update = props.parser.parseSearchQuery(option);
                return (
                    <li className="dropdown-item">
                        <a
                            tabIndex={-1}
                            onMouseDown={() => {
                                props.onChange({
                                    toAdd: update,
                                    toRemove: allPhrases,
                                });
                            }}
                        >
                            {option}
                        </a>
                    </li>
                );
            })}
        </div>
    );
};

function toUniquePhrases(query: SearchClause[]): Phrase[] {
    return query.reduce<Phrase[]>((accumulator, clause) => {
        accumulator.push(...clause.getPhrases());
        return [...new Set(accumulator)];
    }, []);
}
