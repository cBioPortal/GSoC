import { SHOW_ALL_PAGE_SIZE } from '../paginationControls/PaginationControls';
import { CancerStudy } from 'cbioportal-ts-api-client';

export function maxPage(displayDataLength: number, itemsPerPage: number) {
    if (itemsPerPage === SHOW_ALL_PAGE_SIZE) {
        return 0;
    } else {
        return Math.floor(Math.max(displayDataLength - 1, 0) / itemsPerPage);
    }
}

const validSymbols = ['<', '<=', '>', '>=', '='];
export function parseNumericalFilter(filterString: string, columnName: string) {
    let ret = null;
    // matching column<value, column=value, column>value, with spaces potentially in between
    const parsed = filterString.match(
        /([^ \t\r<>=]+)[ \t\r]*([<>=]+)[ \t\r]*([^ \t\r<>=]+)/
    );
    if (parsed) {
        const columnSearch = parsed[1];
        const symbol = parsed[2];
        const value = parseFloat(parsed[3]);

        if (
            columnName.includes(columnSearch) &&
            validSymbols.includes(symbol) &&
            !isNaN(value)
        ) {
            ret = {
                symbol,
                value,
            };
        }
    }
    return ret;
}

export function filterNumericalColumn<D>(
    getValue: (d: D) => number | null,
    columnName: string
) {
    return (d: D, filterString: string, filterStringUpper: string) => {
        const rowValue = getValue(d);
        if (rowValue === null) {
            return false;
        }
        if (rowValue === parseFloat(filterString)) {
            // return true if it's exactly the same number
            return true;
        }
        let ret = false;
        const parsed = parseNumericalFilter(
            filterStringUpper,
            columnName.toUpperCase()
        );
        if (parsed) {
            switch (parsed.symbol) {
                case '>':
                    ret = rowValue > parsed.value;
                    break;
                case '>=':
                    ret = rowValue >= parsed.value;
                    break;
                case '<':
                    ret = rowValue < parsed.value;
                    break;
                case '<=':
                    ret = rowValue <= parsed.value;
                    break;
                case '=':
                    ret = rowValue === parsed.value;
                    break;
            }
        }
        return ret;
    };
}
