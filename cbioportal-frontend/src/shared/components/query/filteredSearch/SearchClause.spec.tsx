import {
    AndSearchClause,
    NotSearchClause,
} from 'shared/components/query/filteredSearch/SearchClause';
import { CancerTreeNode } from 'shared/components/query/CancerStudyTreeData';
import {
    StringPhrase,
    ListPhrase,
    Phrase,
} from 'shared/components/query/filteredSearch/Phrase';

function createTestPhrase(): Phrase {
    return new StringPhrase('a', 'a', ['studyId']);
}

describe('ISearchClause', () => {
    describe('AndSearchClause', () => {
        it('should equal when empty phrases', () => {
            const a = new AndSearchClause([]);
            const b = new AndSearchClause([]);
            expect(a.equals(b)).toEqual(true);
        });

        it('should not equal when different phrases', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            const b = new AndSearchClause([]);
            expect(a.equals(b)).toEqual(false);
        });

        it('should equal when same phrases', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            const b = new AndSearchClause([
                new StringPhrase('a', 'a', ['studyId']),
            ]);
            expect(a.equals(b)).toEqual(true);
        });

        it('returns true when calling contains() with contained phrase', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            expect(a.contains(new StringPhrase('a', 'a', ['studyId']))).toEqual(
                true
            );
        });

        it('returns false when calling contains() with non contained phrase', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            let b: Phrase = new StringPhrase('b', 'a', ['studyId']);
            expect(a.contains(b)).toEqual(false);
        });

        it('returns false when calling contains() with faulty textRepresentation', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            expect(
                a.contains(new StringPhrase('a', 'faulty', ['studyId']))
            ).toEqual(true);
        });

        it('returns textRepresentation when calling toString', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            expect(a.toString()).toEqual('a');
        });

        it('returns empty string when calling toString with no phrases', () => {
            const a = new AndSearchClause([createTestPhrase()]);
            (a as any).phrases = [];
            expect(a.toString()).toEqual('');
        });
    });

    describe('NotSearchClause', () => {
        it('should equal when same phrases', () => {
            const a = new NotSearchClause(createTestPhrase());
            const b = new NotSearchClause(createTestPhrase());
            expect(a.equals(b)).toEqual(true);
        });

        it('should not equal when different phrases', () => {
            const a = new NotSearchClause(createTestPhrase());
            const b = new NotSearchClause(
                new StringPhrase('different', 'a', ['studyId'])
            );
            expect(a.equals(b)).toEqual(false);
        });

        it('returns true when calling contains() with contained phrase', () => {
            const a = new NotSearchClause(createTestPhrase());
            expect(a.contains(new StringPhrase('a', 'a', ['studyId']))).toEqual(
                true
            );
        });

        it('returns false when calling contains() with non contained phrase', () => {
            const a = new NotSearchClause(createTestPhrase());
            expect(a.contains(new StringPhrase('b', 'a', ['studyId']))).toEqual(
                false
            );
        });

        it('ignores textRepresentation when calling contains()', () => {
            const a = new NotSearchClause(createTestPhrase());
            expect(
                a.contains(new StringPhrase('a', 'faulty', ['studyId']))
            ).toEqual(true);
        });

        it('returns negative textRepresentation when calling toString', () => {
            const a = new NotSearchClause(createTestPhrase());
            expect(a.toString()).toEqual('- a');
        });

        it('returns empty string when calling toString with empty phrase', () => {
            const a = new NotSearchClause(createTestPhrase());
            (a as any).phrase = null;
            expect(a.toString()).toEqual('');
        });
    });
});
