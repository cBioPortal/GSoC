import * as React from 'react';
import { SiteError } from 'shared/model/appMisc';

export function formatErrorLog(errors: SiteError[]) {
    return errors
        .map(err => {
            try {
                if (err.errorObj.response) {
                    return JSON.stringify(err.errorObj.response);
                } else if (err.errorObj.message) {
                    return err.errorObj.message;
                } else {
                    return err.errorObj.toString();
                }
            } catch (exc) {
                return 'No error message available';
            }
        })
        .join('\n\n\n');
}

export function formatErrorTitle(errors: SiteError[]): string | undefined {
    const errorTitles = errors.filter(err => {
        return 'title' in err;
    });

    if (errorTitles && errorTitles.length > 0) {
        return errorTitles.map(err => err.title).join(' ');
    } else {
        return undefined;
    }
}

export function formatErrorMessages(errors: SiteError[]): string[] | undefined {
    const errorMessages = errors.map(err => {
        try {
            if (err.errorObj.response) {
                return err.errorObj.response.body.message;
            } else if (err.errorObj.message) {
                return err.errorObj.message;
            } else {
                return undefined;
            }
        } catch (exc) {
            return undefined;
        }
    });
    const validErrorMessages = errorMessages.filter(
        errorMessage => errorMessage !== undefined
    );
    if (validErrorMessages.length > 0) {
        return validErrorMessages;
    } else {
        return undefined;
    }
}
