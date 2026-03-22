import { getBrowserWindow, hashString } from 'cbioportal-frontend-commons';
import { toJS } from 'mobx';
import _ from 'lodash';

export const SAVE_TEST_KEY = 'save_test_enabled';

export function urlChopper(url: string) {
    try {
        if (typeof url === 'string') {
            return url.match(/[^\/]*\/\/[^\/]*(\/.*)/)![1];
        } else {
            return url;
        }
    } catch (ex) {
        return url;
    }
}

export async function makeTest(data: any, url: string, label: string) {
    const hash = hashString(JSON.stringify({ data, url: urlChopper(url) }));

    const filterString = $('.userSelections')
        .find('*')
        .contents()
        .filter(function() {
            return this.nodeType === 3;
        })
        .toArray()
        .map(n => n.textContent)
        .slice(0, -1)
        .reduce((acc, s) => {
            switch (s) {
                case null:
                    acc += '';
                    break;
                case '(':
                    acc += ' (';
                    break;
                case ')':
                    acc += ') ';
                    break;
                case 'or':
                    acc += ' OR ';
                    break;
                case 'and':
                    acc += ' AND ';
                    break;
                default:
                    acc += s || '';
                    break;
            }
            return acc;
        }, '');

    const entry = {
        hash,
        filterString,
        data,
        url,
        label,
        studies: toJS(getBrowserWindow()?.studyViewPageStore?.studyIds),
        filterUrl: urlChopper(
            getBrowserWindow()?.studyPage?.studyViewFullUrlWithFilter
        ),
    };

    if (getBrowserWindow().localStorage.getItem(SAVE_TEST_KEY))
        saveTest(hash, entry);

    return entry;
}

function saveTest(hash: number, entry: any) {
    const testCache = getBrowserWindow().testCache || {};

    if (!(hash in testCache)) {
        testCache[hash] = entry;
        getBrowserWindow().testCache = testCache;
    }
}
