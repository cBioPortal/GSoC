import { ListPhrase } from 'shared/components/query/filteredSearch/Phrase';
import { FullTextSearchNode } from 'shared/lib/query/textQueryUtils';

describe('Phrase', () => {
    describe('ListPhrase', () => {
        it('should match when single element in phraseList', () => {
            const phrase = new ListPhrase('a', 'test:a', ['studyId']);
            const study = { studyId: 'a' } as FullTextSearchNode;
            expect(phrase.match(study)).toBe(true);
        });

        it('should not match when single element in phraseList does not match', () => {
            const phrase = new ListPhrase('a', 'test:a', ['studyId']);
            const study = { studyId: 'b' } as FullTextSearchNode;
            expect(phrase.match(study)).toBe(false);
        });

        it('should do a full (instead of partial) match', () => {
            const phrase = new ListPhrase('a', 'test:a', ['studyId']);
            const study = { studyId: 'ab' } as FullTextSearchNode;
            expect(phrase.match(study)).toBe(false);
        });

        it('should match when multiple elements in phraseList', () => {
            const phrase = new ListPhrase('a,b', 'test:a,b', ['studyId']);
            const study = { studyId: 'a' } as FullTextSearchNode;
            expect(phrase.match(study)).toBe(true);
        });
    });
});
