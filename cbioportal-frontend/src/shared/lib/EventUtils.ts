export function inputBoxChangeTimeoutEvent(
    callback: (value: string) => void,
    timeout: number
): (evt: any) => void {
    let searchTimeout: number | null = null;
    return (evt: any) => {
        if (searchTimeout !== null) {
            window.clearTimeout(searchTimeout);
            searchTimeout = null;
        }

        const filterValue = evt.currentTarget.value;
        searchTimeout = window.setTimeout(() => {
            callback(filterValue);
        }, timeout || 400);
    };
}
