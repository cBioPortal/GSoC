import {
    addClauses,
    searchNodeFields,
    FullTextSearchNode,
    performSearchSingle,
    removePhrase,
    toQueryString,
} from 'shared/lib/query/textQueryUtils';
import {
    AndSearchClause,
    NotSearchClause,
    SearchClause,
} from 'shared/components/query/filteredSearch/SearchClause';
import { QueryParser } from 'shared/lib/query/QueryParser';
import { StringPhrase } from 'shared/components/query/filteredSearch/Phrase';

describe('textQueryUtils', () => {
    const parser = new QueryParser(new Set<string>());
    const referenceGenomeFields = parser.searchFilters.find(
        f => f.phrasePrefix === 'reference-genome'
    )!.nodeFields;

    describe('performSearchSingle', () => {
        const matchPhrase = new StringPhrase(
            'match',
            'match',
            searchNodeFields
        );
        const noMatchPhrase = new StringPhrase(
            'no-match',
            'no-match',
            searchNodeFields
        );
        const hg2000 = new StringPhrase(
            'hg2000',
            'reference-genome:hg2000',
            referenceGenomeFields
        );

        it('matches study by single conjunctive clause', () => {
            const query: SearchClause[] = [new AndSearchClause([matchPhrase])];
            const studyNode = { name: 'match' } as FullTextSearchNode;
            const matched = performSearchSingle(query, studyNode);
            const expected = { match: true, forced: false };
            expect(matched).toEqual(expected);
        });

        it('matches study by single negative clause', () => {
            const query: SearchClause[] = [new NotSearchClause(noMatchPhrase)];
            const studyNode = { name: 'match' } as FullTextSearchNode;
            const matched = performSearchSingle(query, studyNode);
            const expected = { match: true, forced: false };
            expect(matched).toEqual(expected);
        });

        it('does not match study when conjunctive clause does not match', () => {
            const query: SearchClause[] = [
                new AndSearchClause([noMatchPhrase]),
            ];
            const studyNode = {
                description: 'foo match bar',
            } as FullTextSearchNode;
            const matched = performSearchSingle(query, studyNode);
            const expected = { match: false, forced: false };
            expect(matched).toEqual(expected);
        });

        it('does not match study when negative clause matches (forced match)', () => {
            const query: SearchClause[] = [new NotSearchClause(matchPhrase)];
            const studyNode = { studyId: 'match' } as FullTextSearchNode;
            const matched = performSearchSingle(query, studyNode);
            const expected = { match: false, forced: true };
            expect(matched).toEqual(expected);
        });

        it('matches study by reference genome clause', () => {
            const query: SearchClause[] = [new AndSearchClause([hg2000])];
            const studyNode = {
                referenceGenome: 'hg2000',
            } as FullTextSearchNode;
            const matched = performSearchSingle(query, studyNode);
            const expected = { match: true, forced: false };
            expect(matched).toEqual(expected);
        });

        it('does not match study when reference genome clause differs', () => {
            const query: SearchClause[] = [new AndSearchClause([hg2000])];
            const studyNode = { referenceGenome: 'hg42' } as FullTextSearchNode;
            const matched = performSearchSingle(query, studyNode);
            const expected = { match: false, forced: false };
            expect(matched).toEqual(expected);
        });

        it('does not match study when negative reference-genome clause matches (forced match)', () => {
            const query: SearchClause[] = [new NotSearchClause(hg2000)];
            const studyNode = {
                referenceGenome: 'hg2000',
            } as FullTextSearchNode;
            const result = performSearchSingle(query, studyNode);
            const expected = { match: false, forced: true };
            expect(result).toEqual(expected);
        });

        it('matches with mix of negative, conjunctive and reference genome clauses', () => {
            const query: SearchClause[] = [
                new AndSearchClause([
                    new StringPhrase('match1', 'match1', searchNodeFields),
                    new StringPhrase(
                        'hg2000',
                        'reference-genome:hg2000',
                        referenceGenomeFields
                    ),
                ]),
                new NotSearchClause(
                    new StringPhrase(
                        'no-match-4',
                        'no-match-4',
                        searchNodeFields
                    )
                ),
                new AndSearchClause([
                    new StringPhrase(
                        'part5a part5b',
                        '"part5a part5b"',
                        searchNodeFields
                    ),
                    new StringPhrase('part6', 'part6', searchNodeFields),
                ]),
            ];
            const studyNode = {
                name: 'match1',
                description: 'match5a match5b',
                studyId: 'match6',
                referenceGenome: 'hg2000',
            } as FullTextSearchNode;
            const matched = performSearchSingle(query, studyNode);
            const expected = { match: true, forced: false };
            expect(matched).toEqual(expected);
        });

        it('matches when only one of two phrases in OR-query matches', () => {
            const query = parser.parseSearchQuery(
                'reference-genome:hg19 or reference-genome:hg38'
            );
            const studyNodes = [
                { referenceGenome: 'hg19' },
                { referenceGenome: 'hg38' },
            ] as FullTextSearchNode[];

            const matched = studyNodes.map(n => performSearchSingle(query, n));
            const expected = [
                { match: true, forced: false },
                { match: true, forced: false },
            ];
            expect(matched).toEqual(expected);
        });

        it('does not match when only one of two phrases in query matches', () => {
            const query = parser.parseSearchQuery(
                'reference-genome:hg19 reference-genome:hg38'
            );
            const studyNodes = [
                { referenceGenome: 'hg19' },
                { referenceGenome: 'hg38' },
            ] as FullTextSearchNode[];

            const matched = studyNodes.map(n => performSearchSingle(query, n));
            const expected = [
                { match: false, forced: false },
                { match: false, forced: false },
            ];
            expect(matched).toEqual(expected);
        });

        it('uses studyTags field', () => {
            const query = parser.parseSearchQuery('search-term');
            const studyNodes = [
                { studyTags: 'has-search-term' },
                { studyTags: 'no-match' },
            ] as FullTextSearchNode[];

            const matched = studyNodes.map(n => performSearchSingle(query, n));
            const expected = [
                { match: true, forced: false },
                { match: false, forced: false },
            ];
            expect(matched).toEqual(expected);
        });
    });

    describe('addClauses', () => {
        const part1 = new StringPhrase('part1', 'part1', searchNodeFields);
        const part2 = new StringPhrase('part2', 'part2', searchNodeFields);

        it('should merge and-phrase when adding and-clause', () => {
            const query: SearchClause[] = [new AndSearchClause([part1])];
            const toAdd = [new AndSearchClause([part2])];
            const updatedQuery = addClauses(toAdd, query);
            const expected = [new AndSearchClause([part1, part2])];
            expect(toQueryString(updatedQuery)).toEqual(
                toQueryString(expected)
            );
        });

        it('should add not-clause to query', () => {
            const query: SearchClause[] = [new AndSearchClause([part1])];
            const toAdd = [new NotSearchClause(part2)];
            const updatedQuery = addClauses(toAdd, query);
            const expected = [...query, ...toAdd];
            expect(toQueryString(updatedQuery)).toEqual(
                toQueryString(expected)
            );
        });

        it('should remove inverse phrase when adding not-clause', () => {
            const query: SearchClause[] = [new AndSearchClause([part1, part2])];
            const toAdd = [new NotSearchClause(part1)];
            const expected = [new AndSearchClause([part2]), ...toAdd];
            const updatedQuery = addClauses(toAdd, query);
            expect(toQueryString(updatedQuery)).toEqual(
                toQueryString(expected)
            );
        });

        it('should remove inverse phrase when adding and-phrase', () => {
            const query: SearchClause[] = [new NotSearchClause(part1)];
            const toAdd = [new AndSearchClause([part1, part2])];
            const expected = toAdd;
            const updatedQuery = addClauses(toAdd, query);
            expect(toQueryString(updatedQuery)).toEqual(
                toQueryString(expected)
            );
        });

        it('should not add when clause already exists', () => {
            const query: SearchClause[] = [new AndSearchClause([part1])];
            const toAdd = [new AndSearchClause([part1])];
            const expected = [...query];
            const updatedQuery = addClauses(toAdd, query);
            expect(updatedQuery).toEqual(expected);
        });

        it('should remove existing phrases', () => {
            const query: SearchClause[] = [new AndSearchClause([part1])];
            const toAdd = [new AndSearchClause([part1, part2])];
            const updatedQuery = addClauses(toAdd, query);
            const expected = toAdd;
            expect(toQueryString(updatedQuery)).toEqual(
                toQueryString(expected)
            );
        });
    });

    describe('removePhrase', () => {
        const part1 = new StringPhrase('part1', 'part1', searchNodeFields);
        const part2 = new StringPhrase('part2', 'part2', searchNodeFields);

        it('should remove equal clause from query', () => {
            const query: SearchClause[] = [new AndSearchClause([part1])];
            const toRemove = part1;
            const updatedQuery = removePhrase(toRemove, query);
            const expected: SearchClause[] = [];
            expect(updatedQuery).toEqual(expected);
        });

        it('should remove phrase from clause with multiple phrases', () => {
            const query = [new AndSearchClause([part1, part2])];
            const toRemove = part1;
            const updatedQuery = removePhrase(toRemove, query);
            const expected = [new AndSearchClause([part2])];
            expect(toQueryString(updatedQuery)).toEqual(
                toQueryString(expected)
            );
        });

        it('should remove not clause', () => {
            const query = [new NotSearchClause(part1)];
            const toRemove = part1;
            const updatedQuery = removePhrase(toRemove, query);
            const expected: SearchClause[] = [];
            expect(updatedQuery).toEqual(expected);
        });
    });
});
