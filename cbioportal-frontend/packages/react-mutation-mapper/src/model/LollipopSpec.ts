export enum LollipopPlacement {
    TOP,
    BOTTOM,
}

export type LollipopSpec = {
    codon: number;
    count: number;
    group?: string;
    placement?: LollipopPlacement;
    label?: LollipopLabel;
    color?: string;
    tooltip?: JSX.Element;
};

export type LollipopLabel = {
    text: string;
    textAnchor?: string;
    fontSize?: number;
    fontFamily?: string;
    show: boolean;
};
