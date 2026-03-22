export interface ILazyMobXTableApplicationLazyDownloadDataFetcher {
    // fetch and cache all lazy the data (from API) required for download
    fetchAndCacheAllLazyData: () => Promise<any[]>;
}
