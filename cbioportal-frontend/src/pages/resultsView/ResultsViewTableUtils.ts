import { logicalAnd } from '../../shared/lib/LogicUtils';
import _ from 'lodash';

function cytobandFilterSingle(d: { cytoband: string }, filterString: string) {
    if (!filterString.length) {
        return true;
    } else {
        let match = false;
        let reject = false;
        if (filterString[0] === '-') {
            filterString = filterString.substring(1);
            reject = true;
        }
        if (!filterString.length) {
            return true;
        }
        match = !!(d.cytoband && d.cytoband.indexOf(filterString) === 0); // only match at beginning, this makes most sense for cytoband
        return reject ? !match : match;
    }
}

export function cytobandFilter(d: { cytoband: string }, filterString: string) {
    filterString = filterString.trim();
    if (!filterString.length) {
        return true;
    } else {
        const queryElts = filterString.split(/\s+/g);
        const positiveQueries = [];
        const negativeQueries = [];
        for (const q of queryElts) {
            if (q[0] === '-') {
                negativeQueries.push(q);
            } else {
                positiveQueries.push(q);
            }
        }
        const positiveResult = positiveQueries.length
            ? _.some(positiveQueries, q => cytobandFilterSingle(d, q))
            : true;
        const negativeResult = negativeQueries.length
            ? logicalAnd(negativeQueries.map(q => cytobandFilterSingle(d, q)))
            : true;
        return positiveResult && negativeResult;
    }
}
