export type HotSpotInfo = {
    hotspotAnnotationsActive: boolean;
    hotspotDriver: boolean;
};

export type DriverInfo = {
    oncoKb: string;
    customDriverBinary: boolean;
    customDriverTier?: string;
    hotspots?: boolean;
};

export type CustomDriverFilterEvent = {
    driverFilter: string;
    driverTiersFilter: string;
};

export type DriverInfoWithHotspots = DriverInfo & {
    hotspots: boolean;
};
