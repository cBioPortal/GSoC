import {
    FullTextSearchFields,
    FullTextSearchNode,
} from 'shared/lib/query/textQueryUtils';
import _ from 'lodash';
import {
    FILTER_SEPARATOR,
    FILTER_VALUE_SEPARATOR,
} from 'shared/components/query/filteredSearch/SearchClause';

/**
 * Phrase and associated fields
 */
export interface Phrase {
    phrase: string;
    toString(): string;
    match(searchNode: FullTextSearchNode): boolean;
    equals(other: Phrase): boolean;
}

/**
 * Single string that is partially matched against fields in study
 *
 * Shape: [<prefix>:]<phrase>
 *
 * Study fields are matched using logical or
 */
export class StringPhrase implements Phrase {
    constructor(
        phrase: string,
        textRepresentation: string,
        fields: FullTextSearchFields[]
    ) {
        this._fields = fields;
        this._phrase = phrase;
        this._textRepresentation = textRepresentation;
    }

    private readonly _fields: FullTextSearchFields[];
    protected readonly _textRepresentation: string;
    private readonly _phrase: string;

    public get phrase() {
        return this._phrase;
    }

    public get fields() {
        return this._fields;
    }

    public toString() {
        return this._textRepresentation;
    }

    public match(study: FullTextSearchNode): boolean {
        let anyFieldMatch = false;
        for (const fieldName of this.fields) {
            let fieldMatch = false;
            const fieldValue = study[fieldName];
            if (fieldValue) {
                fieldMatch = matchPhrase(this.phrase, '' + fieldValue);
            }
            anyFieldMatch = anyFieldMatch || fieldMatch;
        }
        return anyFieldMatch;
    }

    equals(other: Phrase): boolean {
        if (!other) {
            return false;
        }
        const o = other as StringPhrase;
        if (!o.phrase || !o.fields) {
            return false;
        }
        if (this.phrase !== o.phrase) {
            return false;
        }
        return _.isEqual(this.fields, o.fields);
    }
}

/**
 * Comma separated list of strings that is matched against fields in study
 *
 * Shape: <prefix>:<phrase> in which phrase is a comma separated list
 *
 * Study fields are matched against all elements in list using logical or
 */
export class ListPhrase implements Phrase {
    protected readonly _textRepresentation: string;
    private readonly _fields: FullTextSearchFields[];
    private readonly _phraseList: string[];
    private readonly _prefix: string;

    constructor(
        phrase: string,
        textRepresentation: string,
        fields: FullTextSearchFields[]
    ) {
        this._fields = fields;
        this._phraseList = phrase.split(FILTER_VALUE_SEPARATOR);
        this._textRepresentation = textRepresentation;
        this._prefix = textRepresentation.split(FILTER_SEPARATOR)[0];
    }

    public get phrase() {
        return this._phraseList.join(FILTER_VALUE_SEPARATOR);
    }

    public get fields() {
        return this._fields;
    }

    public get prefix() {
        return this._prefix;
    }

    public get phraseList() {
        return this._phraseList;
    }

    public toString() {
        return this._textRepresentation;
    }

    public match(study: FullTextSearchNode): boolean {
        let anyFieldMatch = false;
        for (const fieldName of this.fields) {
            let anyPhraseMatch = false;
            const fieldValue = study[fieldName];
            if (fieldValue) {
                for (const phrase of this._phraseList) {
                    anyPhraseMatch =
                        anyPhraseMatch ||
                        matchPhraseFull(phrase, '' + fieldValue);
                }
            }
            anyFieldMatch = anyFieldMatch || anyPhraseMatch;
        }
        return anyFieldMatch;
    }

    equals(other: Phrase): boolean {
        if (!other) {
            return false;
        }
        const o = other as ListPhrase;
        if (!o._phraseList || !o.fields) {
            return false;
        }
        if (!_.isEqual(this._phraseList, o._phraseList)) {
            return false;
        }
        return _.isEqual(this.fields, o.fields);
    }
}

/**
 * Partial match using lowercase
 */
function matchPhrase(phrase: string, fullText: string) {
    return fullText.toLowerCase().indexOf(phrase.toLowerCase()) > -1;
}

/**
 * Full match using lowercase
 */
function matchPhraseFull(phrase: string, fullText: string) {
    return fullText.toLowerCase() === phrase.toLowerCase();
}
