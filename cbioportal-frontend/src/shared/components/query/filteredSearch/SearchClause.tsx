import _ from 'lodash';
import { Phrase } from 'shared/components/query/filteredSearch/Phrase';

export const FILTER_SEPARATOR = `:`;
export const FILTER_VALUE_SEPARATOR = ',';
export const NOT_PREFIX = `-`;

export interface SearchClause {
    isNot(): boolean;
    isAnd(): boolean;
    toString(): string;
    equals(other: SearchClause): boolean;

    /**
     * check clause contains phrase using:
     * - {@link Phrase}
     * - or a predicate function
     */
    contains(match: Phrase | null | ((predicate: Phrase) => boolean)): boolean;

    /**
     * @returns {phrases}
     *
     *  - not-clause returns one phrase
     *  - and-clause returns one or more phrases
     */
    getPhrases(): Phrase[];
}

/**
 * Negative clause
 * contains single phrase
 */
export class NotSearchClause implements SearchClause {
    private readonly phrase: Phrase;
    private readonly type = 'not';

    constructor(phrase: Phrase) {
        this.phrase = phrase;
    }

    getPhrases(): Phrase[] {
        return [this.phrase];
    }

    isAnd(): boolean {
        return false;
    }

    isNot(): boolean {
        return true;
    }

    toString(): string {
        return this.phrase ? `${NOT_PREFIX} ${this.phrase.toString()}` : '';
    }

    equals(other: SearchClause): boolean {
        if (other.isAnd()) {
            return false;
        }
        return other.contains(this.phrase);
    }

    contains(match: Phrase | null | ((predicate: Phrase) => boolean)): boolean {
        if (!match) {
            return !this.phrase;
        }
        if (_.isFunction(match)) {
            return match(this.phrase);
        }
        return this.phrase.equals(match);
    }
}

/**
 * Conjunctive clause
 * consists of multiple phrases which all must match
 */
export class AndSearchClause implements SearchClause {
    private readonly phrases: Phrase[];
    private readonly type = 'and';

    constructor(phrases: Phrase[]) {
        this.phrases = phrases;
    }

    getPhrases(): Phrase[] {
        return this.phrases;
    }

    isAnd(): boolean {
        return true;
    }

    isNot(): boolean {
        return false;
    }

    toString(): string {
        return this.phrases.length
            ? this.phrases.map(p => p.toString()).join(' ')
            : '';
    }

    contains(match: Phrase | null | ((predicate: Phrase) => boolean)): boolean {
        if (!match) {
            return !this.phrases.length;
        }
        if (_.isFunction(match)) {
            for (const phrase of this.phrases) {
                if (match(phrase)) {
                    return true;
                }
            }
            return false;
        }

        for (const phrase of this.phrases) {
            if (phrase.equals(match)) {
                return true;
            }
        }
        return false;
    }

    equals(other: SearchClause): boolean {
        if (other.isNot()) {
            return false;
        }
        let itemPhrases = (other as AndSearchClause).phrases;
        let containsAll = true;
        for (const itemPhrase of this.phrases) {
            containsAll = containsAll && other.contains(itemPhrase);
        }
        for (const itemPhrase of itemPhrases) {
            containsAll = containsAll && this.contains(itemPhrase);
        }
        return containsAll;
    }
}

export type SearchResult = {
    match: boolean;
    forced: boolean;
};

export type QueryUpdate = {
    toAdd: SearchClause[];

    /**
     * Remove phrases instead of clauses,
     * to prevent conflicting clauses
     */
    toRemove: Phrase[];
};
