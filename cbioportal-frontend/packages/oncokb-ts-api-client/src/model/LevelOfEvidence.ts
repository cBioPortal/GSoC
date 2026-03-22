export enum LevelOfEvidence {
    LEVEL_0 = 'LEVEL_0',
    LEVEL_1 = 'LEVEL_1',
    LEVEL_2 = 'LEVEL_2',
    LEVEL_3A = 'LEVEL_3A',
    LEVEL_3B = 'LEVEL_3B',
    LEVEL_4 = 'LEVEL_4',
    LEVEL_R1 = 'LEVEL_R1',
    LEVEL_R2 = 'LEVEL_R2',
    LEVEL_R3 = 'LEVEL_R3',
    LEVEL_Px1 = 'LEVEL_Px1',
    LEVEL_Px2 = 'LEVEL_Px2',
    LEVEL_Px3 = 'LEVEL_Px3',
    LEVEL_Dx1 = 'LEVEL_Dx1',
    LEVEL_Dx2 = 'LEVEL_Dx2',
    LEVEL_Dx3 = 'LEVEL_Dx3',
    NO = 'NO',
}

export type LevelOfEvidenceType = keyof typeof LevelOfEvidence;
