export default class DeterministicRNG {
    constructor(private seed: number = 19) {}
    public random() {
        // source: https://stackoverflow.com/a/23304189

        // compute based on current seed
        const intermediateProduct = Math.sin(this.seed) * 10000;
        // get a random number in [0,1]
        const uRand = intermediateProduct - Math.floor(intermediateProduct); // between 0 and 1
        // update the seed and return the new number
        this.seed = uRand;
        return uRand;
    }
}
