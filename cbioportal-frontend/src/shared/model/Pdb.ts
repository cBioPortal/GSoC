import { Alignment } from 'genome-nexus-ts-api-client';

export interface IPdbPosition {
    position: number;
    insertionCode?: string;
}

export interface IPdbPositionRange {
    start: IPdbPosition;
    end: IPdbPosition;
}

export type PdbAlignmentIndex = {
    [pdbId: string]: {
        [chainId: string]: Alignment[];
    };
};

export interface IPdbChain {
    pdbId: string;
    chain: string;
    uniprotStart: number;
    uniprotEnd: number;
    alignment: string;
    identityPerc: number;
    identity: number;
}

export const ALIGNMENT_GAP = '*';
export const ALIGNMENT_PLUS = '+';
export const ALIGNMENT_MINUS = '-';
export const ALIGNMENT_SPACE = ' ';
