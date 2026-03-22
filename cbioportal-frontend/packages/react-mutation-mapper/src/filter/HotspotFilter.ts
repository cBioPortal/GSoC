import { DataFilter } from '../model/DataFilter';

export enum HotspotFilterValue {
    DefaultHotspot = 'DEFAULT_HOTSPOT',
}

export type HotspotFilter = DataFilter<HotspotFilterValue>;
