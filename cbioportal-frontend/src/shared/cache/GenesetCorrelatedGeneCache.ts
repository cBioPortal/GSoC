import { GenesetCorrelation } from 'cbioportal-ts-api-client';
import client from 'shared/api/cbioportalInternalClientInstance';
import _ from 'lodash';
import { IDataQueryFilter } from '../lib/StoreUtils';

interface IQuery {
    genesetId: string;
    molecularProfileId: string;
}

type SampleFilterByProfile = {
    [molecularProfileId: string]: IDataQueryFilter;
};

async function fetch(
    { genesetId, molecularProfileId }: IQuery,
    sampleFilterByProfile: SampleFilterByProfile
): Promise<GenesetCorrelation[]> {
    const param = {
        genesetId,
        geneticProfileId: molecularProfileId,
        ...sampleFilterByProfile[molecularProfileId],
        correlationThreshold: 0,
    };
    return client.fetchCorrelatedGenesUsingPOST(param);
}

class AsyncStateChain<S> {
    private stateChain: Promise<S>;
    constructor(initState: S) {
        this.stateChain = Promise.resolve(initState);
    }
    appendTransition<A>(
        useState: (currentState: S) => Promise<{ newState: S; output: A }>
    ): Promise<A> {
        // Synchronously replace stateChain by a promise of the new state,
        // and return a promise of the output
        const stateAndOutputPromise = this.stateChain.then(useState);
        this.stateChain = stateAndOutputPromise.then(pair => pair.newState);
        return stateAndOutputPromise.then(pair => pair.output);
    }
}

class GenesetCorrelatedGeneIteration {
    private query: IQuery;
    private sampleFilterByProfile: SampleFilterByProfile;
    private nextGeneIndexStateChain = new AsyncStateChain(0);
    private data: undefined | GenesetCorrelation[] = undefined;

    constructor(query: IQuery, sampleFilterByProfile: SampleFilterByProfile) {
        this.query = query;
        this.sampleFilterByProfile = sampleFilterByProfile;
    }
    async next(maxNumber: number) {
        return this.nextGeneIndexStateChain.appendTransition(
            async currentIndex => {
                if (this.data === undefined) {
                    this.data = await fetch(
                        this.query,
                        this.sampleFilterByProfile
                    );
                }
                // select the first n genes starting from the index,
                // up to the end of the array
                const nextGenes = this.data.slice(
                    currentIndex,
                    currentIndex + maxNumber
                );
                return {
                    newState: currentIndex + nextGenes.length,
                    output: nextGenes,
                };
            }
        );
    }

    /**
     * Resets the iteration so that next() will start from the beginning.
     */
    reset(): void {
        this.nextGeneIndexStateChain.appendTransition(currentIndex =>
            Promise.resolve({ newState: 0, output: undefined })
        );
    }
}

export default class GenesetCorrelatedGeneCache {
    private sampleFilterByProfile: SampleFilterByProfile;
    private iterations: {
        [iterationKey: string]: GenesetCorrelatedGeneIteration;
    } = {};

    constructor(sampleFilterByProfile: SampleFilterByProfile) {
        this.sampleFilterByProfile = sampleFilterByProfile;
    }

    initIteration(iterationKey: string, query: IQuery) {
        if (
            !Object.prototype.hasOwnProperty.call(this.iterations, iterationKey)
        ) {
            this.iterations[iterationKey] = new GenesetCorrelatedGeneIteration(
                query,
                this.sampleFilterByProfile
            );
        }
    }

    async next(
        iterationKey: string,
        maxNumber: number
    ): Promise<GenesetCorrelation[]> {
        return this.iterations[iterationKey].next(maxNumber);
    }

    reset(iterationKey: string): void {
        this.iterations[iterationKey].reset();
    }
}
