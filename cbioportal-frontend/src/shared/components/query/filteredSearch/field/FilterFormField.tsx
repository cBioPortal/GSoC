import { CancerTreeSearchFilter } from 'shared/lib/query/textQueryUtils';
import {
    SearchClause,
    QueryUpdate,
} from 'shared/components/query/filteredSearch/SearchClause';
import { QueryParser } from 'shared/lib/query/QueryParser';
import * as React from 'react';
import { FunctionComponent } from 'react';
import { ListFilterField } from 'shared/components/query/filteredSearch/field/ListFormField';
import { CheckboxFilterField } from 'shared/components/query/filteredSearch/field/CheckboxFilterField';

/**
 * Can be extended with additional input fields
 */
export type FilterField = CheckboxFilterField | ListFilterField;

export type FieldProps = {
    filter: CancerTreeSearchFilter;
    query: SearchClause[];
    onChange: (change: QueryUpdate) => void;
    parser: QueryParser;
};

export const FilterFormField: FunctionComponent<FieldProps> = props => {
    const inputField = props.filter.form.input;
    return (
        <div
            className={`filter-form-field ${props.filter.phrasePrefix || ''}`}
            style={{
                margin: '0.5em',
            }}
        >
            {React.createElement(inputField, props)}
        </div>
    );
};
