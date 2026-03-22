export enum Alterations {
    Deletion = -2,
    Loss = -1,
    Gain = 1,
    Amplification = 2,
}

export function getAlterationString(alteration: number): string {
    return Alterations[alteration] || '';
}
