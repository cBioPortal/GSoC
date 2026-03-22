import {
    addClauses,
    removePhrase,
    toQueryString,
} from 'shared/lib/query/textQueryUtils';
import * as React from 'react';
import { FunctionComponent, useCallback } from 'react';
import {
    SearchClause,
    QueryUpdate,
} from 'shared/components/query/filteredSearch/SearchClause';
import { QueryParser } from 'shared/lib/query/QueryParser';
import _ from 'lodash';
import { SearchBox } from 'shared/components/query/filteredSearch/SearchBox';
import { StudySearchControls } from 'shared/components/query/filteredSearch/StudySearchControls';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { sleep } from 'shared/lib/TimeUtils';

export type StudySearchProps = {
    parser: QueryParser;
    query: SearchClause[];
    onSearch: (query: SearchClause[]) => void;
};

export const StudySearch: FunctionComponent<StudySearchProps> = observer(
    function(props) {
        const store = useLocalObservable(() => ({
            isMenuOpen: false,
            toggle() {
                this.isMenuOpen = !this.isMenuOpen;
            },
            setMenuOpen(visible: boolean) {
                this.isMenuOpen = visible;
            },
        }));

        const onFocusSearchBox = useCallback(() => {
            store.setMenuOpen(true);
        }, []);

        const onBlurSearchBox = useCallback(async () => {
            // thus pause is necessary to allow clicks
            // from inside the dropdown menu to update state
            // before the menu is closed
            await sleep(200);
            store.setMenuOpen(false);
        }, []);

        const onKeyDownSearchBox = useCallback(
            async (e: React.KeyboardEvent<HTMLInputElement>) => {
                if (store.isMenuOpen) {
                    await sleep(500);
                    store.setMenuOpen(false);
                }
            },
            []
        );

        return (
            <div
                data-test="study-search"
                className={`dropdown ${store.isMenuOpen ? 'open' : ''}`}
            >
                <div className="input-group input-group-sm input-group-toggle">
                    <SearchBox
                        queryString={toQueryString(props.query)}
                        onType={(update: string) =>
                            handleQueryTyping(props, update)
                        }
                        onFocus={onFocusSearchBox}
                        onBlur={onBlurSearchBox}
                        onKeyDown={onKeyDownSearchBox}
                    />
                    <SearchMenuToggle
                        onClick={store.toggle}
                        open={store.isMenuOpen}
                    />
                </div>
                <ClearSearchButton
                    show={props.query.length > 0}
                    onClick={() => handleQueryTyping(props, '')}
                />
                <StudySearchControls
                    query={props.query}
                    filterConfig={props.parser.searchFilters}
                    onChange={(update: QueryUpdate) => {
                        handleQueryUpdate(props, update);
                        store.setMenuOpen(false);
                    }}
                    parser={props.parser}
                />
            </div>
        );
    }
);

function handleQueryTyping(props: StudySearchProps, update: string) {
    const updatedQuery = props.parser.parseSearchQuery(update);
    return props.onSearch(updatedQuery);
}

function handleQueryUpdate(props: StudySearchProps, update: QueryUpdate) {
    let updatedQuery = _.cloneDeep(props.query);
    if (update.toRemove) {
        for (const p of update.toRemove) {
            updatedQuery = removePhrase(p, updatedQuery);
        }
    }
    if (update.toAdd) {
        updatedQuery = addClauses(update.toAdd, updatedQuery);
    }
    props.onSearch(updatedQuery);
}

const SearchMenuToggle: FunctionComponent<{
    onClick: () => void;
    open: boolean;
}> = props => {
    const arrowDirection = props.open ? 'rotate(180deg)' : 'rotate(0deg)';
    return (
        <div className="input-group-btn">
            <button
                type="button"
                className="dropdown-toggle btn btn-sm btn-default"
                onMouseDown={props.onClick}
            >
                <span className="caret" style={{ transform: arrowDirection }}>
                    &nbsp;
                </span>
            </button>
        </div>
    );
};

const ClearSearchButton: FunctionComponent<{
    onClick: () => void;
    show: boolean;
}> = props => {
    return (
        <div
            data-test="clearStudyFilter"
            onClick={props.onClick}
            style={{
                visibility: props.show ? 'visible' : 'hidden',
                position: 'absolute',
                right: '37px',
                top: '3px',
                zIndex: 10,
                fontSize: '18px',
                cursor: 'pointer',
                color: 'grey',
            }}
        >
            x
        </div>
    );
};
