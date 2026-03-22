import { ClinicalEvent, ClinicalEventData } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import JSZip from 'jszip';
import fileDownload from 'react-file-download';

const HEADERS = ['PATIENT_ID', 'START_DATE', 'STOP_DATE', 'EVENT_TYPE'];

export function downloadZippedTracks(events: ClinicalEvent[]) {
    const groupedData = _.groupBy(events, d => d.eventType);

    const zip = new JSZip();
    _.forEach(groupedData, (data, eventType) => {
        zip.file(`data_timeline_${eventType.toLowerCase()}.txt`, toTSV(data));
    });
    zip.generateAsync({ type: 'blob' }).then(function(content) {
        fileDownload(content, 'timeline.zip');
    });
}

export function groupTimelineData(events: ClinicalEvent[]) {
    const groupedData = _.groupBy(events, d => d.eventType);

    return _.mapValues(groupedData, data => getRows(data));
}

function toTSV(events: ClinicalEvent[]): string {
    const rows = getRows(events);

    return rows.map(row => row.join('\t')).join('\n') + '\n';
}

function getRows(events: ClinicalEvent[]): string[][] {
    // First get the extra columns
    const extraColumnsMap: { [columnKey: string]: any } = {};
    for (const event of events) {
        for (const attribute of event.attributes) {
            extraColumnsMap[attribute.key] = true;
        }
    }
    const extraColumns = Object.keys(extraColumnsMap);

    // Now put together the rows
    const rows: string[][] = [];
    rows.push(HEADERS.concat(extraColumns));
    for (const event of events) {
        rows.push(buildRow(event, extraColumns));
    }
    return rows;
}

function buildRow(event: ClinicalEvent, extraColumns: string[]): string[] {
    return [
        event.patientId,
        event.startNumberOfDaysSinceDiagnosis !== undefined
            ? event.startNumberOfDaysSinceDiagnosis.toString()
            : '',
        event.endNumberOfDaysSinceDiagnosis !== undefined
            ? event.endNumberOfDaysSinceDiagnosis.toString()
            : '',
        event.eventType,
        ...extraColumns.map(
            key => getValueFromAttribute(event.attributes, key) || ''
        ),
    ];
}

function getValueFromAttribute(
    attributes: ClinicalEventData[],
    key: string
): string | undefined {
    const attribute = attributes.find(a => a.key === key);
    return attribute === undefined ? undefined : attribute.value;
}
