import { PatientSurvival } from '../../../shared/model/PatientSurvival';
import { tsvFormat } from 'd3-dsv';
import _ from 'lodash';
import { ClinicalAttribute } from 'cbioportal-ts-api-client';
import { Dictionary } from 'lodash';
import { calculateLogConfidenceIntervals } from './SurvivalHelper';

export type ScatterData = {
    x: number;
    y: number;
    patientId: string;
    uniquePatientKey: string;
    studyId: string;
    status: boolean;
    opacity?: number;
    group?: string;
    atRisk?: number;
    numberOfEvents?: number;
    numberOfCensored?: number;
};

export type DownSamplingOpts = {
    xDenominator: number;
    yDenominator: number;
    threshold: number;
    enableCensoringCross?: boolean;
    floorTimeToMonth?: boolean;
};

export type GroupedScatterData = {
    [key: string]: SurvivalCurveData;
};

export type SurvivalSummary = {
    survivalFunctionEstimate: number;
    standardError?: number;
    low95ConfidenceInterval?: number;
    high95ConfidenceInterval?: number;
    atRisk?: number;
};

export type SurvivalCurveData = {
    numOfCases: number;
    line: any[];
    scatterWithOpacity: ScatterData[];
    scatter: ScatterData[];
};

export type SurvivalPlotFilters = {
    x: [number, number];
    y: [number, number];
};

export type ParsedSurvivalData = {
    status: string | undefined;
    label: string;
};

type EventInfo = ScatterData & {
    eventCount: number;
    lastYInMonth: number;
    censorCount: number;
    lastRiskInMonth?: number;
};

export const survivalCasesHeaderText: { [prefix: string]: string } = {
    OS: 'DECEASED',
    PFS: 'Progressed',
    DFS: 'Recurred/Progressed',
    DSS: 'DECEASED',
};

export const SURVIVAL_PLOT_X_LABEL_WITH_EVENT_TOOLTIP = 'Time of event';
export const SURVIVAL_PLOT_X_LABEL_WITHOUT_EVENT_TOOLTIP =
    'Time of last observation';
export const SURVIVAL_PLOT_Y_LABEL_TOOLTIP = '% event free';

// OS, DFS, PFS, DSS are four reserved KM plot types
// use priority from RESERVED_SURVIVAL_PLOT_PRIORITY for these four types
export const RESERVED_SURVIVAL_PLOT_PRIORITY: { [prefix: string]: number } = {
    OS: 400,
    DFS: 300,
    PFS: 250,
    DSS: 250,
};

// when try to find if a data is null
// make sure add trim() and toLowerCase() for the value
// this comparision is ignoring the cases and leading/trailing white space and line terminator characters from a string.
export const survivalClinicalDataNullValueSet = new Set([
    '[not applicable]',
    '[not available]',
    '[pending]',
    '[discrepancy]',
    '[completed]',
    '[null]',
    '',
    'na',
]);

// TODO: We can add this into the server properties if needed
export const SURVIVAL_COMPACT_MODE_THRESHOLD = 15000;

export function sortPatientSurvivals(patientSurvivals: PatientSurvival[]) {
    // First sort by month in asc order (smaller number to the front)
    // Then sort by status in desc order (status is boolean, if status equals to true, then go to the front, false goes after it in the same time stamp)
    return _.orderBy(patientSurvivals, [s => s.months, s => !s.status]);
}

// Concept of Number at risk:
// In order to calculate survival probability using the Kaplan-Meier product limit method
// We need to know how many individuals were still accounted for in the study that had not yet experienced the event of interest.
// Therefore, the number at risk at any specific time point will be equal to the total number of subjects remaining in the study,
// including any individuals that experience the event of interest or individuals that are censored at this time point.
export function getNumPatientsAtRisk(
    // In order to calculate correct result
    // Patient survivals need to be sorted by months and status
    // First sort by month in asc order (smaller number to the front)
    // Then sort by status in desc order (status is boolean, if status equals to true, then go to the front, false goes after it in the same time stamp)
    sortedPatientSurvivals: Pick<PatientSurvival, 'entryMonths' | 'months'>[]
): number[] {
    // returns an array in the same order as patientSurvivals

    // When we see one entry time is not zero, we consider the data is left truncated
    if (
        _.some(sortedPatientSurvivals, survival => survival.entryMonths !== 0)
    ) {
        // Calculate number of patients at risk for data with entry time (left truncation)
        return _.map(sortedPatientSurvivals, (patientSurvival, index) => {
            const exitTime = patientSurvival.months;
            // This step is to count the total number of subjects remaining in the study at this specific exit time
            // subtract index from atRisk because previous subjects are no longer remain in the study at this specific exit time
            return (
                sortedPatientSurvivals.filter(
                    survival => survival.entryMonths < exitTime
                ).length - index
            );
        });
    } else {
        // Calculate the number of patients at risk for data without an entry time
        // we need this in descending order, so reverse
        return sortedPatientSurvivals.map((el, i) => i + 1).reverse();
    }
}

export function getSurvivalSummaries(
    // In order to calculate correct result
    // Patient survivals need to be sorted by months and status
    // First sort by month in asc order (smaller number to the front)
    // Then sort by status in desc order (status is boolean, if status equals to true, then go to the front, false goes after it in the same time stamp)
    sortedPatientSurvivals: PatientSurvival[]
): SurvivalSummary[] {
    let summaries: SurvivalSummary[] = [];
    let previousEstimate: number = 1;
    let numberOfEvents: number = 0;
    let previousMonths: number | undefined = undefined;
    let errorAccumulator: number = 0;
    let isErrorCalculatable: boolean = false;

    // calculate number of events
    const eventCountsByMonths: Dictionary<number> = _.reduce(
        sortedPatientSurvivals,
        (dict, patientSurvival) => {
            if (patientSurvival.status) {
                dict[patientSurvival.months] =
                    patientSurvival.months in dict
                        ? dict[patientSurvival.months] + 1
                        : 1;
            }
            return dict;
        },
        {} as Dictionary<number>
    );

    const atRisk = getNumPatientsAtRisk(sortedPatientSurvivals);

    sortedPatientSurvivals.forEach((patientSurvival, index) => {
        // we may see multiple data points at the same time
        // only calculate the error for the last data point of the same months
        if (
            previousMonths === patientSurvival.months &&
            patientSurvival.status
        ) {
            numberOfEvents++;
        } else {
            numberOfEvents = 1;
        }
        previousMonths = patientSurvival.months;
        if (eventCountsByMonths[patientSurvival.months] === numberOfEvents) {
            isErrorCalculatable = true;
        } else {
            isErrorCalculatable = false;
        }
        // only calculate standard error and confidence intervals for event data
        if (patientSurvival.status) {
            const estimate =
                previousEstimate * ((atRisk[index] - 1) / atRisk[index]);
            previousEstimate = estimate;
            // define calculate standard error and confidence intervals
            // undefined is default value, means it's not found
            let standardError: number | undefined = undefined;
            let low95ConfidenceInterval: number | undefined = undefined;
            let high95ConfidenceInterval: number | undefined = undefined;

            if (isErrorCalculatable) {
                // calculate standard error
                // adjustedAtRisk need to add number of events back since we may have multiple events at the same time
                const adjustedAtRisk =
                    atRisk[index] +
                    eventCountsByMonths[patientSurvival.months] -
                    1;
                const toBeAccumulated =
                    eventCountsByMonths[patientSurvival.months] /
                    (adjustedAtRisk *
                        (adjustedAtRisk -
                            eventCountsByMonths[patientSurvival.months]));
                errorAccumulator = errorAccumulator + toBeAccumulated;
                const error = estimate * estimate * errorAccumulator;
                standardError = Math.sqrt(error);

                // calculate confidence intervals
                const confidenceSet = calculateLogConfidenceIntervals(
                    estimate,
                    standardError
                );
                low95ConfidenceInterval = confidenceSet.low;
                high95ConfidenceInterval = confidenceSet.high;
            }
            summaries.push({
                survivalFunctionEstimate: estimate,
                standardError,
                low95ConfidenceInterval,
                high95ConfidenceInterval,
                atRisk: atRisk[index],
            } as SurvivalSummary);
        } else {
            summaries.push({
                survivalFunctionEstimate: previousEstimate,
                atRisk: atRisk[index],
            });
        }
    });

    return summaries;
}

export function parseSurvivalData(s: string) {
    const splitStatusAndLabel = s.split(':').map(text => text.trim());
    let status = undefined;
    let label = undefined;
    // survival data in new format "status:label"
    if (splitStatusAndLabel.length === 2) {
        status = splitStatusAndLabel[0];
        label = splitStatusAndLabel[1];
    } else {
        // old format "label"
        label = splitStatusAndLabel[0];
    }

    // if status not exists, status will be undefined
    return {
        status,
        label,
    } as ParsedSurvivalData;
}

export function getSurvivalStatusBoolean(s: string, prefix: string) {
    const parsedSurvivalData = parseSurvivalData(s);
    if (parsedSurvivalData.status) {
        return parsedSurvivalData.status === '1';
    }
    // return false as default for values that cannot get mapped
    return false;
}

export function getStatusCasesHeaderText(
    prefix: string,
    uniqueSurvivalData: string[]
): string {
    // if not found set as 'Event'
    let text = 'Event';

    if (prefix in survivalCasesHeaderText) {
        text = survivalCasesHeaderText[prefix];
    } else {
        // find first data with '1:' prefix
        _.forEach(uniqueSurvivalData, data => {
            const splitData = data.split(':');
            if (splitData.length == 2 && splitData[0] === '1') {
                text = splitData[1];
                // first one found, return result
                return false;
            }
        });
    }
    return _.startCase(_.toLower(text));
}

export function isNullSurvivalClinicalDataValue(value: string) {
    return survivalClinicalDataNullValueSet.has(value.trim().toLowerCase());
}

export function getMedian(
    patientSurvivals: PatientSurvival[],
    survivalSummaries: SurvivalSummary[]
): string {
    let median: string | undefined = undefined;
    let lowerControlLimit: string | undefined = undefined;
    let upperControlLimit: string | undefined = undefined;

    for (let i = 0; i < survivalSummaries.length; i++) {
        if (
            median === undefined &&
            survivalSummaries[i].survivalFunctionEstimate <= 0.5
        ) {
            median = patientSurvivals[i].months.toFixed(2);
        }
        if (
            lowerControlLimit === undefined &&
            survivalSummaries[i].low95ConfidenceInterval &&
            survivalSummaries[i].low95ConfidenceInterval! <= 0.5
        ) {
            lowerControlLimit = patientSurvivals[i].months.toFixed(2);
        }
        if (
            upperControlLimit === undefined &&
            survivalSummaries[i].high95ConfidenceInterval &&
            survivalSummaries[i].high95ConfidenceInterval! <= 0.5
        ) {
            upperControlLimit = patientSurvivals[i].months.toFixed(2);
        }
    }

    if (median === undefined) {
        return 'NA';
    } else if (
        lowerControlLimit !== undefined &&
        upperControlLimit === undefined
    ) {
        return `${median} (${lowerControlLimit} - NA)`;
    } else if (
        lowerControlLimit === undefined &&
        upperControlLimit !== undefined
    ) {
        return `${median} (NA - ${upperControlLimit})`;
    } else if (
        lowerControlLimit !== undefined &&
        upperControlLimit !== undefined
    ) {
        return `${median} (${lowerControlLimit} - ${upperControlLimit})`;
    } else {
        return median;
    }
}

export function getLineData(
    patientSurvivals: PatientSurvival[],
    survivalSummaries: SurvivalSummary[]
): any[] {
    let chartData: any[] = [];

    chartData.push({ x: 0, y: 100 });
    patientSurvivals.forEach((patientSurvival, index) => {
        chartData.push({
            x: patientSurvival.months,
            y: survivalSummaries[index].survivalFunctionEstimate * 100,
        });
    });

    return chartData;
}

export function getScatterData(
    patientSurvivals: PatientSurvival[],
    survivalSummaries: SurvivalSummary[],
    group?: string
): ScatterData[] {
    return patientSurvivals.map((patientSurvival, index) => {
        const ret: ScatterData = {
            x: patientSurvival.months,
            y: survivalSummaries[index].survivalFunctionEstimate * 100,
            patientId: patientSurvival.patientId,
            studyId: patientSurvival.studyId,
            uniquePatientKey: patientSurvival.uniquePatientKey,
            status: patientSurvival.status,
            atRisk: survivalSummaries[index].atRisk,
        };
        if (group) {
            ret.group = group;
        }
        return ret;
    });
}

export function getScatterDataWithOpacity(
    patientSurvivals: PatientSurvival[],
    survivalSummaries: SurvivalSummary[],
    group?: string
): any[] {
    let scatterData = getScatterData(
        patientSurvivals,
        survivalSummaries,
        group
    );
    let chartData: any[] = [];
    let previousEstimate: number;

    patientSurvivals.forEach((patientSurvival, index) => {
        const estimate = survivalSummaries[index].survivalFunctionEstimate;
        let opacity: number = 1;
        if (previousEstimate && estimate !== previousEstimate) {
            opacity = 0;
        }
        previousEstimate = estimate;
        chartData.push({ ...scatterData[index], opacity: opacity });
    });

    return chartData;
}

export function getStats(
    patientSurvivals?: PatientSurvival[],
    survivalSummaries?: SurvivalSummary[]
): [number, number, string] {
    if (patientSurvivals && survivalSummaries) {
        return [
            patientSurvivals.length,
            patientSurvivals.filter(
                patientSurvival => patientSurvival.status === true
            ).length,
            getMedian(patientSurvivals, survivalSummaries),
        ];
    } else {
        return [0, 0, 'N/A'];
    }
}

export function getDownloadContent(
    data: { scatterData: ScatterData[]; title: string }[],
    mainTitle: string
): string {
    let content: string = mainTitle; // + '\n\n';// + alteredTitle + '\n';
    for (const d of data) {
        content += '\n\n';
        content += d.title;
        content += '\n';
        content += tsvFormat(convertScatterDataToDownloadData(d.scatterData));
    }
    return content;
}

export function convertScatterDataToDownloadData(patientData: any[]): any[] {
    const downloadData: any[] = [];

    patientData.map((datum, index) => {
        downloadData.push({
            'Case ID': datum.patientId,
            'Study ID': datum.studyId,
            'Number at Risk': patientData.length - index,
            Status: datum.status ? 'deceased' : 'censored',
            'Survival Rate': datum.y / 100,
            'Time (months)': datum.x,
        });
    });

    return downloadData;
}

/**
 * Down sampling based on the hypotenuse difference.
 * The cross dot is guaranteed to be drawn when hidden dots are taking into account.
 * @param {DownSampling} opts
 * @returns {ScatterData[]}
 */
export function downSampling(
    data: ScatterData[],
    opts: DownSamplingOpts
): ScatterData[] {
    let xMax = _.maxBy(data, 'x');
    let xMin = _.minBy(data, 'x');

    let yMax = _.maxBy(data, 'y');
    let yMin = _.minBy(data, 'y');

    if (opts.xDenominator <= 0 || opts.yDenominator <= 0) return data;

    let timeThreshold =
        ((xMax ? xMax.x : 0) - (xMin ? xMin.x : 0)) / opts.xDenominator;
    let survivalRateThreshold =
        ((yMax ? yMax.y : 0) - (yMin ? yMin.y : 0)) / opts.yDenominator;
    let averageThreshold = Math.hypot(timeThreshold, survivalRateThreshold);
    let lastVisibleDataPoint = {
        x: 0,
        y: 0,
    };
    let lastDataPoint = {
        x: 0,
        y: 0,
    };

    return data.filter(function(dataItem, index) {
        let isVisibleDot =
            _.isUndefined(dataItem.opacity) || dataItem.opacity > 0;
        if (index == 0) {
            lastDataPoint.x = dataItem.x;
            lastDataPoint.y = dataItem.y;
            lastVisibleDataPoint.x = dataItem.x;
            lastVisibleDataPoint.y = dataItem.y;
            return true;
        }
        let distance = 0;
        if (isVisibleDot) {
            distance = Math.hypot(
                dataItem.x - lastVisibleDataPoint.x,
                dataItem.y - lastVisibleDataPoint.y
            );
        } else {
            distance = Math.hypot(
                dataItem.x - lastDataPoint.x,
                dataItem.y - lastDataPoint.y
            );
        }
        if (distance > averageThreshold) {
            lastDataPoint.x = dataItem.x;
            lastDataPoint.y = dataItem.y;
            if (isVisibleDot) {
                lastVisibleDataPoint.x = dataItem.x;
                lastVisibleDataPoint.y = dataItem.y;
            }
            return true;
        } else {
            return false;
        }
    });
}

export function floorScatterData(
    scatterDataWithOpacity: ScatterData[]
): ScatterData[] {
    let eventInfo: EventInfo;
    let result: ScatterData[] = [];
    const eventInfoByMonth: { [month: number]: EventInfo } = _.reduce(
        scatterDataWithOpacity,
        (eventInfoByMonth: { [month: string]: EventInfo }, item) => {
            const month = Math.floor(item.x);
            if (!(month in eventInfoByMonth)) {
                // Provide initial value
                eventInfo = {
                    ...item,
                    eventCount: 0,
                    lastYInMonth: 0,
                    censorCount: 0,
                    lastRiskInMonth: item.atRisk!,
                };
            } else {
                eventInfo = eventInfoByMonth[month];
            }
            eventInfoByMonth[month] = updateEventInfo(eventInfo, item);
            return eventInfoByMonth;
        },
        {}
    );

    result = _.map(eventInfoByMonth, (eventInfo, month) => {
        const aggregatedScatter: ScatterData = {
            x: parseInt(month),
            y: eventInfo.lastYInMonth,
            patientId: eventInfo.patientId,
            uniquePatientKey: eventInfo.uniquePatientKey,
            studyId: eventInfo.studyId,
            status: eventInfo.status,
            opacity: eventInfo.opacity,
            group: eventInfo.group,
            atRisk: eventInfo.lastRiskInMonth,
            numberOfEvents: eventInfo.eventCount,
            numberOfCensored: eventInfo.censorCount,
        };
        return aggregatedScatter;
    });
    return result;
}

// EventInfo is an object that keeps tracking the statistical information for KM plot during a period (e.g. a month)
// updateEventInfo will update EventInfo based on the new scatter data
// This is an internal function and only should be used by floorScatterData function
function updateEventInfo(eventInfo: EventInfo, data: ScatterData): EventInfo {
    eventInfo.lastYInMonth = data.y;
    eventInfo.lastRiskInMonth = data.atRisk;
    eventInfo.eventCount = data.status
        ? eventInfo.eventCount + 1
        : eventInfo.eventCount;
    eventInfo.censorCount = data.status
        ? eventInfo.censorCount
        : eventInfo.censorCount + 1;
    return eventInfo;
}

export function getLineDataFromScatterData(data: ScatterData[]): any[] {
    let chartData: any[] = [];

    chartData.push({ x: 0, y: 100 });
    data.forEach((item, index) => {
        chartData.push({
            x: item.x,
            y: item.y,
        });
    });

    return chartData;
}

export function filterScatterData(
    allScatterData: GroupedScatterData,
    filters: SurvivalPlotFilters | undefined,
    downSamplingOpts: DownSamplingOpts
): GroupedScatterData {
    let filteredData = _.cloneDeep(allScatterData);
    _.forEach(filteredData, (value: SurvivalCurveData) => {
        if (value.numOfCases > downSamplingOpts.threshold) {
            if (filters) {
                value.scatter = value.scatter.filter(_val =>
                    filterBasedOnCoordinates(filters, _val)
                );
                value.scatterWithOpacity = value.scatterWithOpacity.filter(
                    _val => filterBasedOnCoordinates(filters, _val)
                );
            }
            if (downSamplingOpts.floorTimeToMonth) {
                value.scatter = floorScatterData(value.scatterWithOpacity);
                value.line = getLineDataFromScatterData(value.scatter);
            } else {
                value.scatter = downSampling(value.scatter, downSamplingOpts);
            }
            value.scatterWithOpacity = downSamplingOpts.enableCensoringCross
                ? downSampling(value.scatterWithOpacity, downSamplingOpts)
                : [];
            value.numOfCases = value.scatter.length;
        }
    });
    return filteredData;
}

function filterBasedOnCoordinates(
    filters: SurvivalPlotFilters,
    _val: ScatterData
) {
    if (
        _val.x <= filters.x[1] &&
        _val.x >= filters.x[0] &&
        _val.y <= filters.y[1] &&
        _val.y >= filters.y[0]
    ) {
        return true;
    }
    return false;
}

export const ALTERED_GROUP_VALUE = 'Altered';
export const UNALTERED_GROUP_VALUE = 'Unaltered';

export function getSurvivalChartDataByAlteredStatus(
    alteredSurvivals: PatientSurvival[],
    unalteredSurvivals: PatientSurvival[]
) {
    const patientToAnalysisGroups: { [patientKey: string]: string[] } = {};
    for (const s of alteredSurvivals) {
        patientToAnalysisGroups[s.uniquePatientKey] = [ALTERED_GROUP_VALUE];
    }
    for (const s of unalteredSurvivals) {
        patientToAnalysisGroups[s.uniquePatientKey] = [UNALTERED_GROUP_VALUE];
    }
    return {
        patientSurvivals: alteredSurvivals.concat(unalteredSurvivals),
        patientToAnalysisGroups,
    };
}

export function generateSurvivalPlotTitleFromDisplayName(displayName: string) {
    return displayName.replace(/status|survival/gi, '');
}

export function generateSurvivalPlotYAxisLabelFromDisplayName(
    displayName: string
) {
    if (displayName.includes('OS ') || displayName.includes('Overall')) {
        return 'Probability of Overall Survival';
    } else if (displayName.includes('PFS')) {
        return 'Probability of Progression-Free Survival';
    } else if (displayName.includes('DFS')) {
        return 'Probability of Disease-Free Survival';
    } else {
        return generateSurvivalPlotTitleFromDisplayName(displayName);
    }
}

// The plot title string come from a related survival status clinical attribute
// To get a correct title, we need to replace "status" and possible "survival" words with blank
// See related request here: https://github.com/cBioPortal/cbioportal/issues/8378
export function generateStudyViewSurvivalPlotTitle(title: string) {
    return title.replace(/status|survival/gi, '').trim();
}

export function getSurvivalAttributes(clinicalAttributes: ClinicalAttribute[]) {
    return _.chain(clinicalAttributes)
        .map(attr => attr.clinicalAttributeId)
        .filter(id => /_STATUS$/i.test(id) || /_MONTHS$/i.test(id))
        .uniq()
        .value();
}

export function createSurvivalAttributeIdsDict(
    prefixList: string[],
    excludeMonths: boolean = false,
    excludeStatus: boolean = false
) {
    return _.reduce(
        prefixList,
        (dict, prefix) => {
            if (!excludeMonths) {
                const monthsAttrId = `${prefix}_MONTHS`;
                dict[monthsAttrId] = monthsAttrId;
            }
            if (!excludeStatus) {
                const statusAttrId = `${prefix}_STATUS`;
                dict[statusAttrId] = statusAttrId;
            }
            return dict;
        },
        {} as { [id: string]: string }
    );
}

export function calculateNumberOfPatients(
    patientSurvivals: PatientSurvival[],
    patientToAnalysisGroups: { [patientKey: string]: string[] }
) {
    return _.sumBy(patientSurvivals, s =>
        s.uniquePatientKey in patientToAnalysisGroups ? 1 : 0
    );
}

export function calculateLabelWidth(
    text: number,
    fontFamily: string,
    fontSize: number
) {
    const tempElement = document.createElement('div');
    tempElement.style.position = 'absolute';
    tempElement.style.opacity = '0';
    tempElement.style.fontFamily = fontFamily;
    tempElement.style.fontSize = fontSize.toString();
    tempElement.textContent = text.toString();
    document.body.appendChild(tempElement);
    const labelWidth = tempElement.offsetWidth;
    document.body.removeChild(tempElement);
    return labelWidth;
}
