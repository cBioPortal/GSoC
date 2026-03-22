const jp = require('jsonpath');

const placeHolderRegex = /[{][$][^}]*[}]/g;

export function hasJsonPathPlaceholders(message: string): boolean {
    return message.match(placeHolderRegex) !== null;
}

export function replaceJsonPathPlaceholders(
    message: string,
    studyMetadata: any,
    studyId: string
) {
    let placeholders = message.match(placeHolderRegex);
    if (placeholders !== null) {
        placeholders.forEach(placeholder => {
            let placeholderReplaceValue;
            if (placeholder === '{$.studyId}') {
                placeholderReplaceValue = studyId;
            } else {
                placeholderReplaceValue = jp.query(
                    studyMetadata,
                    placeholder.replace(/["'{}]/g, '')
                );
            }
            if (placeholderReplaceValue.length > 0) {
                message = message.replace(placeholder, placeholderReplaceValue);
            }
        });
    }
    return message;
}
