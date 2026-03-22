// this can be adapted to consume new profile membership data
import { CancerStudy } from 'cbioportal-ts-api-client';
import _ from 'lodash';

export function allowExpressionCrossStudy(
    studies: CancerStudy[],
    rule: string | undefined,
    defaultValue = false
) {
    if (studies.length === 1) {
        return true;
    }

    if (rule === undefined) {
        return defaultValue;
    } else {
        try {
            const conf = eval(rule);
            if (_.isBoolean(conf)) {
                return conf;
            }
            if (_.isFunction(conf)) {
                return conf(studies);
            }
            return defaultValue;
        } catch (ex) {
            return defaultValue;
        }
    }
}
