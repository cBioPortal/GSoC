export const LESS_THAN_HTML_ENTITY = '&lt;';
export const GREATER_THAN_HTML_ENTITY = '&gt;';

// This method is only designed to trim off html tags <**> </**>
// A full solution could be https://www.npmjs.com/package/string-strip-html
// But there is an issue related to template literals (https://gitlab.com/codsen/codsen/-/issues/31)
export function trimOffHtmlTagEntities(str: string) {
    // I previously explored Regex but does not work really well in multiple matches
    return (str || '')
        .split(LESS_THAN_HTML_ENTITY)
        .map(match => {
            const elements = match.split(GREATER_THAN_HTML_ENTITY);
            if (elements.length > 1) {
                return elements[1];
            } else {
                return elements.length === 0 ? '' : elements[0];
            }
        })
        .join('');
}
