export type AccumulatingDebouncedFunction<ArgsType> = {
    (...next: ArgsType[]): void;
    isPending: () => boolean;
    cancel: () => void;
};
export default function accumulatingDebounce<AccumulatorType, ArgsType>(
    fn: (acc: AccumulatorType) => void,
    addArgs: (acc: AccumulatorType, ...next: ArgsType[]) => AccumulatorType,
    getInit: () => AccumulatorType, // getInit needs to be a function, otherwise we'd have to deal w/clonining the given init value to ensure we're resetting
    wait: number,
    afterTimeoutExpire?: (...args: any[]) => void // mainly useful for testing
): AccumulatingDebouncedFunction<ArgsType> {
    let timeout: number | null;
    let shouldExecuteFn: boolean;
    let acc: AccumulatorType;

    function reset() {
        acc = getInit();
        shouldExecuteFn = false;
        timeout = null;
    }

    function considerExecuting() {
        if (shouldExecuteFn) {
            fn(acc);
            reset();
        } else {
            shouldExecuteFn = true;
            timeout = window.setTimeout(considerExecuting, wait);
        }
        afterTimeoutExpire && afterTimeoutExpire();
    }

    reset();

    let ret: AccumulatingDebouncedFunction<ArgsType> = Object.assign(
        (...next: ArgsType[]) => {
            acc = addArgs(acc, ...next);

            if (timeout === null) {
                shouldExecuteFn = true;
                timeout = window.setTimeout(considerExecuting, wait);
            } else {
                shouldExecuteFn = false;
            }
        },
        {
            isPending: () => timeout !== null,
            cancel: () => {
                if (timeout !== null) {
                    window.clearTimeout(timeout);
                }
                reset();
            },
        }
    );

    return ret;
}
