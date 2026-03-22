import _ from 'lodash';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { ResourceData, ResourceDefinition } from 'cbioportal-ts-api-client';

/*
 * this is hacky attempt to provide custom state persistence for resource iframes
 * e.g. so that settings are saved as a user moves across patients
 */

function transformUrlForMinerva(resource: ResourceData) {
    const MINVERVA_STATE_KEY = 'MINVERVA_STATE_KEY';
    // we invoke this here in order to keep this hackery consolidated
    // we use lodash once to make sure we only establish this listener once
    // while the parent function will be invoked many times

    const url = resource.url;

    _.once(() => {
        getBrowserWindow().addEventListener(
            'message',
            (event: any) => {
                if (event?.data?.href) {
                    const group = event?.data?.href.match(/g=(\d+)/)?.[1];
                    getBrowserWindow().localStorage.setItem(
                        MINVERVA_STATE_KEY,
                        group
                    );
                }
            },
            false
        );
    })(); // we invoke it here

    const group = getBrowserWindow().localStorage.getItem(MINVERVA_STATE_KEY);

    if (group) {
        const newUrl =
            url +
            `#s=0#w=0#g=${group}#m=-1#a=-100_-100#v=1_0.7207_0.5#o=-100_-100_1_1#p=Q`;
        return newUrl;
    } else {
        return url;
    }
}

type ResourceUrlCustomizer = {
    test: (r: ResourceData) => boolean;
    transformer: (r: ResourceData) => string;
};

export const CUSTOM_URL_TRANSFORMERS: ResourceUrlCustomizer[] = [
    {
        test: resource => {
            const re = /minerva/i;
            return (
                re.test(resource.resourceDefinition.description) ||
                re.test(resource.resourceDefinition.displayName) ||
                re.test(resource.resourceId) ||
                re.test(resource.url)
            );
        },
        transformer: transformUrlForMinerva,
    },
];
