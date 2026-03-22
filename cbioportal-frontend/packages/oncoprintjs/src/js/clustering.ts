import ClusteringWorker from 'web-worker:./workers/clustering-worker';
import {
    CaseItem,
    CasesAndEntities,
    ClusteringMessage,
    EntityItem,
} from './workers/clustering-worker';

/**
 * Executes the clustering of casesAndEntitites in the requested
 * dimension (CASES or ENTITIES).
 *
 * @param casesAndEntitites: Object with sample(or patient)Id and map
 * of geneticEntity/value pairs. Example:
 *
 * var a =
 *  {
 *    "TCGA-AO-AA98-01":
 *    {
 *    	"TP53": 0.045,
 *    	"BRA1": -0.89
 *    }
 *   },
 *   ...
 *
 * @return a deferred which gets resolved with the clustering result
 *   when the clustering is done.
 */
function _hcluster(
    casesAndEntitites: ClusteringMessage['casesAndEntities'],
    dimension: ClusteringMessage['dimension']
) {
    var worker = new ClusteringWorker();
    var message = new Object() as ClusteringMessage;
    //@ts-ignore
    var def = new $.Deferred();
    message.casesAndEntities = casesAndEntitites;
    message.dimension = dimension;
    worker.postMessage(message);
    worker.onmessage = function(m: any) {
        def.resolve(m.data as CaseItem[] | EntityItem[]);
    };
    return def.promise();
}

/**
 * Use: cbio.stat.hclusterCases(a);

 * @return a deferred which gets resolved with the clustering result
 *   when the clustering is done.
 */
export function hclusterColumns(
    casesAndEntitites: CasesAndEntities
): Promise<CaseItem[]> {
    return _hcluster(casesAndEntitites, 'CASES');
}

/**
 * Use: hclusterGeneticEntities(a);
 *
 * @return a deferred which gets resolved with the clustering result
 *   when the clustering is done.
 */
export function hclusterTracks(
    casesAndEntitites: CasesAndEntities
): Promise<EntityItem[]> {
    return _hcluster(casesAndEntitites, 'ENTITIES');
}
