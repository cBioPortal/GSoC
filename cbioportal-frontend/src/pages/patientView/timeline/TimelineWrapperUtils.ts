import { TimelineEvent } from 'cbioportal-clinical-timeline';
import { ISampleMetaDeta } from 'pages/patientView/timeline/TimelineWrapper';
import _ from 'lodash';
import { ClinicalEvent } from 'cbioportal-ts-api-client';

const DEFAULT_LABEL = '-';

export function getSampleInfo(
    event: TimelineEvent,
    caseMetaData: ISampleMetaDeta
) {
    const sampleId = event.event.attributes.find(
        (att: any) => att.key === 'SAMPLE_ID'
    );
    if (sampleId) {
        const color = caseMetaData.color[sampleId.value] || '#333333';
        const label = caseMetaData.label[sampleId.value] || DEFAULT_LABEL;

        return { color, label };
    }

    return null;
}

export function getNumberRangeLabel(sortedNumbers: number[]) {
    if (!sortedNumbers.length) {
        return DEFAULT_LABEL;
    }

    // aggregate into ranges
    const ranges: { start: number; end: number }[] = [];
    let currentRange = {
        start: sortedNumbers[0],
        end: sortedNumbers[0],
    };
    sortedNumbers.forEach((num, index) => {
        if (index === 0) {
            // skip first element - we already used it in currentRange init
            return;
        }
        if (num === currentRange.end + 1) {
            // if this number is at the end of the current running range,
            //  then extend the range
            currentRange.end += 1;
        } else {
            // otherwise, flush the current running range, and start a new range
            ranges.push(currentRange);
            currentRange = {
                start: num,
                end: num,
            };
        }
    });
    // finally, flush the last trailing range
    ranges.push(currentRange);

    // print
    return ranges
        .map(r => {
            if (r.start !== r.end) {
                return `${r.start}-${r.end}`;
            } else {
                return r.start.toString();
            }
        })
        .join(', ');
}

export function getSortedSampleInfo(colors: string[], labels: string[]) {
    const pairs = [];
    // filter out NaN and pair with colors
    for (let i = 0; i < labels.length; i++) {
        const num = parseInt(labels[i]);
        if (!isNaN(num)) {
            pairs.push({
                label: num,
                color: colors[i],
            });
        }
    }

    // sort by label
    return _.sortBy(pairs, p => p.label);
}

export function getEventColor(
    event: TimelineEvent,
    statusAttributes: string[],
    colorMappings: { re: RegExp; color: string }[]
) {
    const status = event.event.attributes.find((att: any) =>
        statusAttributes.includes(att.key)
    );
    let color = '#ffffff';
    if (status) {
        const colorConfig = colorMappings.find(m => m.re.test(status.value));
        if (colorConfig) {
            color = colorConfig.color;
        }
    }
    return color;
}
