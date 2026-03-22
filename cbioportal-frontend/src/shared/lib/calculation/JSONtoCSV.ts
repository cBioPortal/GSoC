type T = any;

export function convertToCSV(jsonArray: Array<T>, fieldsToKeep?: string[]) {
    if (!jsonArray.length) {
        return '';
    }
    // Create the header
    const csvHeader = fieldsToKeep?.join(',');

    // Create the rows
    const csvRows = jsonArray
        .map(item => {
            return fieldsToKeep
                ?.map(field => {
                    return item[field as keyof T] || '';
                })
                .join(',');
        })
        .join('\n');
    return `${csvHeader}\r\n${csvRows}`;
}
