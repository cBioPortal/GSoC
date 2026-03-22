export default class LazyMemo<I, O> {
    private memo: { [key: string]: O } = {};

    constructor(
        private inputToKey: (input: I) => string,
        private inputToOutput: (input: I) => O
    ) {}

    public get(i: I) {
        const key = this.inputToKey(i);
        this.memo[key] = this.memo[key] || this.inputToOutput(i);
        return this.memo[key];
    }

    public has(i: I) {
        return this.inputToKey(i) in this.memo;
    }
}
