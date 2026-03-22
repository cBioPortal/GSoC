import { validate, ParameterValidationError } from 'parameter-validator';
import _ from 'lodash';

export interface URLValidationResult {
    isValid: Boolean;
    message: string | null;
}

export function validateParametersPatientView(params: {
    [k: string]: string;
}): URLValidationResult {
    return validateParameters(params, ['studyId', ['sampleId', 'caseId']]);
}

export default function validateParameters(
    params: { [k: string]: string },
    rules: (string | string[])[]
): URLValidationResult {
    // we want to interpret empty string as missing
    let cleanedParams = _.reduce(
        params,
        (memo: { [k: string]: string }, paramVal, paramKey) => {
            if (paramVal && paramVal.length > 0) {
                memo[paramKey] = paramVal;
            }
            return memo;
        },
        {}
    );

    try {
        validate(cleanedParams, rules);
        return { isValid: true, message: null };
    } catch (error) {
        return { isValid: false, message: error.message };
    }
}
