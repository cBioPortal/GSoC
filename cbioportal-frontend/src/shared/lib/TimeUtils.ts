export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function sleepUntil(
    predicate: () => boolean,
    intervalMs: number = 100,
    timeoutMs: number = 2000
) {
    return new Promise<void>(resolve => {
        let timeElapsed = 0;
        const interval = setInterval(() => {
            timeElapsed += intervalMs;
            if (predicate()) {
                clearInterval(interval);
                resolve();
            } else if (timeElapsed > timeoutMs) {
                clearInterval(interval);
                throw new Error('sleepUntil timeout');
            }
        }, intervalMs);
    });
}
