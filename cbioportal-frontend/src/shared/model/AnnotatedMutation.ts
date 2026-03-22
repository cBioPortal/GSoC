import { Mutation, StructuralVariant } from 'cbioportal-ts-api-client';

export interface AnnotatedMutation extends Mutation {
    hugoGeneSymbol: string;
    putativeDriver: boolean;
    oncoKbOncogenic: string;
    isHotspot: boolean;
    simplifiedMutationType: SimplifiedMutationType;
    // following is a cloodge for when we need to
    // make synthetic mutations to represent structural variants
    structuralVariant?: AnnotatedStructuralVariant;
}

export type SimplifiedMutationType =
    | 'missense'
    | 'frameshift'
    | 'nonsense'
    | 'splice'
    | 'nonstart'
    | 'nonstop'
    | 'fusion'
    | 'inframe'
    | 'other';

export interface AnnotatedStructuralVariant extends StructuralVariant {
    putativeDriver: boolean;
    oncoKbOncogenic: string;
    isHotspot: boolean;
    entrezGeneId: number;
    hugoGeneSymbol: string;
}
