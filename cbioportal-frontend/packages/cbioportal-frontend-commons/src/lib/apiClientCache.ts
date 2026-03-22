import getBrowserWindow from './getBrowserWindow';
import sizeof from 'object-sizeof';
import fileDownload from 'react-file-download';

function hash(str: string) {
    var hash = 0,
        i,
        chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function getHash(obj: any) {
    return hash(JSON.stringify(obj));
}

function megabytes(n: number) {
    return n * Math.pow(10, 6);
}

const postCacheStore: any = {};

getBrowserWindow().postCacheStore = postCacheStore;

// Cache clearing for memory management
type SizeQueueElt = { methodName: string; storeKey: number; size: number };
const sizeQueue: SizeQueueElt[] = [];
let cacheSize = 0;

// set apiCacheLimit to Number.POSITIVE_INFINITY to disable cache clearing
function tryFreeCache(
    apiCacheLimit: number = Number.POSITIVE_INFINITY,
    log?: (message: string) => void,
    sentryLog?: (message: string) => void
) {
    const maxCacheSize = megabytes(apiCacheLimit);

    // delete data to free up memory, starting from the front of the line (least recently used)
    let elt: any;
    try {
        if (sentryLog && cacheSize > maxCacheSize) {
            // log this
            sentryLog(
                `Clearing cache after reaching cache limit of ${maxCacheSize} bytes (${(
                    maxCacheSize / Math.pow(10, 6)
                ).toFixed(2)} Mb)`
            );
        }

        while (cacheSize > maxCacheSize) {
            elt = undefined;
            // remove least recently used element from front, skipping over
            //  elements that dont have updated size (aka call hasnt completed yet)
            for (let i = 0; i < sizeQueue.length; i++) {
                if (sizeQueue[i].size !== -1) {
                    elt = sizeQueue[i];
                    sizeQueue.splice(i, 1);
                    break;
                }
            }

            // delete it from cache
            // at this point we'll encounter an error if elt is undefined - this should never happen
            if (log) {
                log(
                    `POST cache max size exceeded: ${cacheSize} > ${maxCacheSize}. Deleting entries.`
                );
            }

            delete postCacheStore[elt.methodName][elt.storeKey];
            // update cacheSize
            cacheSize -= elt.size;
        }
        //console.log(`POST cache size is now ${cacheSize}`);
    } catch (e) {
        throw 'maxCacheSize exceeded while nothing in cache. This should never happen.';
    }
}

export function cachePostMethod(
    targetObj: any,
    methodName: string,
    apiCacheLimit?: number,
    log?: (message: string) => void,
    sentryLog?: (message: string) => void
) {
    const oldMethod = targetObj[methodName];

    //prepare store with entry for this method
    postCacheStore[methodName] = {};
    const storeNode = postCacheStore[methodName];

    targetObj[methodName] = function(arg: any) {
        //console.log('posted data',arg);
        const hash = getHash(arg);

        // remove this from sizeQueue, if it exists, because we just used it so it should get bumped back in line,
        //  away from deletion
        const sizeQueueIndex = sizeQueue.findIndex(
            o => o.methodName === methodName && o.storeKey === hash
        );
        let sizeQueueElement: SizeQueueElt;
        if (sizeQueueIndex > -1) {
            sizeQueueElement = sizeQueue.splice(sizeQueueIndex, 1)[0];
        } else {
            sizeQueueElement = { methodName, storeKey: hash, size: -1 };
        }
        // add element to back of size queue- push it here so that its place in line depends on when it was called, not
        //  when the call completes. We'll update its size when the call completes
        sizeQueue.push(sizeQueueElement);
        if (!(hash in storeNode)) {
            // make call and add handler to update size, if we dont already have this data
            storeNode[hash] = oldMethod.apply(this, arguments);
            storeNode[hash].then((result: any) => {
                // if the hash doesnt exist, then this is the data being fetched for first time
                // update sizeQueueElement size and cacheSize
                sizeQueueElement.size = sizeof(result);
                cacheSize += sizeQueueElement.size;
                //console.log(`Added entry to cache from ${sizeQueueElement.methodName} of size ${sizeQueueElement.size}. cacheSize is now ${cacheSize}`);
                // free memory if necessary
                tryFreeCache(apiCacheLimit, log, sentryLog);
            });
        }
        return storeNode[hash];
    };
}

export function cachePostMethodsOnClient(
    obj: any,
    excluded: string[] = [],
    postMethodNameRegex: RegExp = /UsingPOST$/,
    apiCacheLimit?: number,
    log?: (message: string) => void,
    sentryLog?: (message: string) => void
) {
    const postMethods = Object.getOwnPropertyNames(
        obj.prototype
    ).filter(methodName => postMethodNameRegex.test(methodName));

    postMethods.forEach(methodName => {
        if (!excluded.includes(methodName)) {
            cachePostMethod(
                obj.prototype,
                methodName,
                apiCacheLimit,
                log,
                sentryLog
            );
        }
    });
}
