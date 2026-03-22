import * as React from 'react';
import { FunctionComponent } from 'react';
import {
    AndSearchClause,
    FILTER_VALUE_SEPARATOR,
    SearchClause,
    NotSearchClause,
    QueryUpdate,
} from 'shared/components/query/filteredSearch/SearchClause';
import {
    CancerTreeSearchFilter,
    createListPhrase,
} from 'shared/lib/query/textQueryUtils';
import { FieldProps } from 'shared/components/query/filteredSearch/field/FilterFormField';
import { ListPhrase } from 'shared/components/query/filteredSearch/Phrase';

export type CheckboxFilterField = {
    input: typeof FilterCheckbox;
    label: string;
    options: string[];
};

export const FilterCheckbox: FunctionComponent<FieldProps> = props => {
    const options = props.filter.form.options;
    if (options.length < 2) {
        return null;
    }

    const prefix = props.filter.phrasePrefix || '';
    let checkedOptions: string[] = [];
    const relevantClauses: SearchClause[] = [];
    const toRemove: ListPhrase[] = [];
    props.query.forEach(clause => {
        const phraseToRemove = clause
            .getPhrases()
            .find(p => (p as ListPhrase).prefix === prefix);
        if (phraseToRemove) {
            relevantClauses.push(clause);
            toRemove.push(phraseToRemove as ListPhrase);
        }
    });
    for (const option of options) {
        const isChecked = isOptionChecked(option, relevantClauses);
        if (isChecked) {
            checkedOptions.push(option);
        }
    }
    return (
        <div className="filter-checkbox">
            <h5>{props.filter.form.label}</h5>
            <div>
                {options.map((option: string) => {
                    const id = `input-${option}`;
                    let isChecked = checkedOptions.includes(option);
                    return (
                        <div
                            style={{
                                display: 'inline-block',
                                padding: '0 1em 0 0',
                            }}
                        >
                            <input
                                type="checkbox"
                                id={id}
                                value={option}
                                checked={isChecked}
                                onClick={() => {
                                    isChecked = !isChecked;
                                    updatePhrases(option, isChecked);
                                    const update = createQueryUpdate(
                                        toRemove,
                                        checkedOptions,
                                        props.filter
                                    );
                                    props.onChange(update);
                                }}
                                style={{
                                    display: 'inline-block',
                                }}
                            />
                            <label
                                htmlFor={id}
                                style={{
                                    display: 'inline-block',
                                    padding: '0 0 0 0.2em',
                                }}
                            >
                                {option}
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
    function updatePhrases(option: string, checked?: boolean) {
        if (checked) {
            checkedOptions.push(option);
        } else {
            checkedOptions = checkedOptions.filter(as => as !== option);
        }
    }
};

function isOptionChecked(
    option: string,
    relevantClauses: SearchClause[]
): boolean {
    if (!relevantClauses.length) {
        return true;
    }
    const containingClause = relevantClauses.find(c =>
        c
            .getPhrases()
            .find(
                p =>
                    (p as ListPhrase).phraseList &&
                    (p as ListPhrase).phraseList.includes(option)
            )
    );
    const onlyNotClauses =
        relevantClauses.length ===
        relevantClauses.filter(c => c.isNot()).length;
    if (!containingClause) {
        return onlyNotClauses;
    }
    if (containingClause.isNot()) {
        return false;
    }
    return containingClause.isAnd();
}

/**
 * Create query update while trying
 * to keep the query as short as possible
 */
export function createQueryUpdate(
    phrasesToRemove: ListPhrase[],
    optionsToAdd: string[],
    filter: CancerTreeSearchFilter
): QueryUpdate {
    let toAdd: SearchClause[];
    const toRemove = phrasesToRemove;
    const options = filter.form.options;
    const prefix = filter.phrasePrefix || '';
    const fields = filter.nodeFields;

    const onlyAnd = optionsToAdd.length === options.length;
    const onlyNot = !optionsToAdd.length;
    const moreAnd = optionsToAdd.length > options.length / 2;
    if (onlyAnd) {
        toAdd = [];
    } else if (onlyNot || moreAnd) {
        const phrase = options
            .filter(o => !optionsToAdd.includes(o))
            .join(FILTER_VALUE_SEPARATOR);

        toAdd = [new NotSearchClause(createListPhrase(prefix, phrase, fields))];
    } else {
        const phrase = optionsToAdd.join(FILTER_VALUE_SEPARATOR);
        toAdd = [
            new AndSearchClause([createListPhrase(prefix, phrase, fields)]),
        ];
    }
    return { toAdd, toRemove };
}
