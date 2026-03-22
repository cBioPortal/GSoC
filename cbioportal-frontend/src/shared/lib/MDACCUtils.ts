import request from 'superagent';

/**
 * Util for any logics used for MD Anderson Cancer Center services
 *
 * @author Hongxin Zhang
 */

/**
 * Pasre MDACC Heatmap response
 * @param url
 */
export async function getHeatmapMeta(url: string): Promise<string[]> {
    let result: string[] = [];
    try {
        let resp: any = await request.get(url);

        const parsedResp: any = JSON.parse(resp.text);

        // filecontent array is serialized :(
        result = JSON.parse(parsedResp.fileContent);
    } catch (e) {
        return [];
    }
    if (result === undefined) {
        return [];
    } else {
        return result;
    }
}
