import { parseOQLQuery } from 'shared/lib/oql/oqlfilter';
import { SyntaxError } from 'shared/lib/oql/oql-parser';
import { OQL } from 'shared/components/GeneSelectionBox/OQLTextArea';

export function getFocusOutText(genes: string[]): string {
    let focusOutText = '';
    if (genes.length > 0) {
        focusOutText = genes[0];
        for (let i = 1; i < genes.length; i++) {
            if (
                focusOutText.length > 13 ||
                focusOutText.length + genes[i].length > 13
            ) {
                focusOutText += ' and ' + (genes.length - i) + ' more';
                break;
            }
            focusOutText += ' ' + genes[i];
        }
    }
    return focusOutText;
}

export function getOQL(query: string): OQL {
    try {
        return {
            query: query ? parseOQLQuery(query.trim().toUpperCase()) : [],
            error: undefined,
        };
    } catch (error) {
        if (error.name !== 'SyntaxError')
            return {
                query: [],
                error: { start: 0, end: 0, message: `Unexpected ${error}` },
            };

        let {
            location: {
                start: { offset },
            },
        } = error as SyntaxError;
        let near, start, end;
        if (offset === query.length)
            [near, start, end] = ['after', offset - 1, offset];
        else if (offset === 0)
            [near, start, end] = ['before', offset, offset + 1];
        else [near, start, end] = ['at', offset, offset + 1];
        let message = `OQL syntax error ${near} selected character; please fix and submit again.`;
        return {
            query: [],
            error: { start, end, message },
        };
    }
}

export function getEmptyGeneValidationResult() {
    return { found: [], suggestions: [] };
}
