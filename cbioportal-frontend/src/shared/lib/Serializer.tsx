import _ from 'lodash';

export function serializeData(
    data: any[],
    autoGenerateHeader = false,
    delim = '\t'
) {
    const content: string[] = [];

    if (autoGenerateHeader) {
        // try to get the header from object keys in case no header provided
        // if contains header, assuming that the first element represents the header values
        Object.keys(data[0]).forEach((col: any) => content.push(col, delim));

        content.pop();
        content.push('\r\n');
    }

    data.forEach((row: any) => {
        _.each(row, (cell: string) => {
            content.push(cell, delim);
        });

        content.pop();
        content.push('\r\n');
    });

    return content.join('');
}
