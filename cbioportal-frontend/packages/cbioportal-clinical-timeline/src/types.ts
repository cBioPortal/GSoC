export interface TimelineEventAttribute {
    key: string;
    value: string;
}
export interface TimelineEvent {
    start: number;
    end: number;
    event: {
        attributes: TimelineEventAttribute[];
        eventType: string;
        patientId: string;
        startNumberOfDaysSinceDiagnosis: number;
        endNumberOfDaysSinceDiagnosis?: number;
        studyId: string;
        uniquePatientKey: string;
    };
    containingTrack: TimelineTrackSpecification;
}

export const POINT_RADIUS = 4;
export const POINT_COLOR = 'rgb(31, 119, 180)';

export interface ITimelineConfig {
    sortOrder?: string[];
    trackStructures?: string[][];
    trackEventRenderers?: ITrackEventConfig[];
    eventColorGetter?: TimeLineColorGetter;
}

export type ITrackEventConfig = {
    trackTypeMatch: RegExp;
    configureTrack: (track: TimelineTrackSpecification) => any;
    legend?: TimelineLegendItem[];
    attributeOrder?: string[];
};

export type SegmentedAttributes = {
    first: TimelineEventAttribute[];
    rest: TimelineEventAttribute[];
};

export enum TimelineTrackType {
    DEFAULT,
    LINE_CHART,
}

export type TimeLineColorGetter = (e: TimelineEvent) => string | void;

export type TimelineLegendItem = {
    label: string;
    color: string;
};

export interface TimelineTrackSpecification {
    items: TimelineEvent[];
    type: string;
    uid: string;
    label?: string;
    tracks?: TimelineTrackSpecification[];
    renderEvents?: (
        e: TimelineEvent[],
        yCoordinate: number
    ) => JSX.Element | string | null;
    renderTooltip?: (e: TimelineEvent) => JSX.Element | string | null; // null means use default tooltip
    sortSimultaneousEvents?: (e: TimelineEvent[]) => TimelineEvent[];
    trackType?: TimelineTrackType;
    getLineChartValue?: (e: TimelineEvent) => number | null;
    trackConf?: ITrackEventConfig;
    disableHover?: boolean;
    timelineConfig?: ITimelineConfig;
    eventColorGetter?: TimeLineColorGetter; // overrides the one in timelineConfig
}

export interface TimelineTick {
    start: number;
    end: number;
    realEnd?: number;
    offset?: number;
    isTrim?: boolean;
    events?: TimelineEvent[];
}

export interface EventPosition {
    left: string;
    pixelLeft: number;
    width: string;
    pixelWidth: number;
}

export enum TickIntervalEnum {
    MONTH = 30.41666,
    YEAR = 365,
    DAY = 1,
}

export interface ZoomBounds {
    start: number;
    end: number;
}
