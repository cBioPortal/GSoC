import { GenomicLocation, Hotspot } from 'genome-nexus-ts-api-client';

export type AggregatedHotspots = {
    genomicLocation: GenomicLocation;
    hotspots: Hotspot[];
};

export interface IHotspotIndex {
    [genomicLocation: string]: AggregatedHotspots;
}
