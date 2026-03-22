export interface PostTranslationalModification {
    source?: PtmSource;
    type: string;
    residue: {
        start: number;
        end: number;
    };
    pubmedIds?: string[];
    description?: string;
}

export enum PtmType {
    Phosphorylation = 'Phosphorylation',
    Acetylation = 'Acetylation',
    Ubiquitination = 'Ubiquitination',
    Methylation = 'Methylation',
    AdpRibosylation = 'ADP-ribosylation',
    Amidation = 'Amidation',
    Bromination = 'Bromination',
    Citrullination = 'Citrullination',
    Hydroxylation = 'Hydroxylation',
    Lipoylation = 'Lipoylation',
    Iodination = 'Iodination',
    Nitration = 'Nitration',
    Oxidation = 'Oxidation',
    Pyruvate = 'Pyruvate',
    SNitrosylation = 'S-nitrosylation',
    Sulfation = 'Sulfation',
    Sumoylation = 'Sumoylation',
    Other = 'Other',
}

export enum PtmSource {
    Uniprot = 'Uniprot',
    dbPTM = 'dbPTM',
}
