import { assert } from 'chai';
import _ from 'lodash';
import {
    getMatchPriority,
    excludeControlArms,
    getDrugsFromArm,
    mergeClinicalGroupMatchByAge,
} from './TrialMatchTableUtils';
import {
    IArm,
    IClinicalGroupMatch,
    ITrialMatch,
} from '../../../shared/model/MatchMiner';

describe('TrialMatchTableUtils', () => {
    it('Test setTrialMatchPriority: set priority of trial match record based on number of positive matches and not matches.', () => {
        const clinicalMatchGroup = [
            {
                trialAgeNumerical: '>=18',
                trialOncotreePrimaryDiagnosis: {
                    positive: ['Non-Small Cell Lung Cancer'],
                    negative: [],
                },
                matches: {
                    MUTATION: [],
                    MSI: [],
                    CNA: [],
                    WILDTYPE: [],
                },
                notMatches: {
                    MUTATION: [
                        {
                            genomicAlteration: 'EGFR !E709_T710delinsD',
                            matches: [
                                {
                                    trueHugoSymbol: null,
                                    trueProteinChange: null,
                                    sampleIds: [
                                        'P-0000628-T01-IM3',
                                        'P-0000628-T02-IM5',
                                    ],
                                },
                            ],
                        },
                        {
                            genomicAlteration: 'EGFR !E709K',
                            matches: [
                                {
                                    trueHugoSymbol: null,
                                    trueProteinChange: null,
                                    sampleIds: [
                                        'P-0000628-T01-IM3',
                                        'P-0000628-T02-IM5',
                                    ],
                                },
                            ],
                        },
                        {
                            genomicAlteration: 'EGFR !L833V',
                            matches: [
                                {
                                    trueHugoSymbol: null,
                                    trueProteinChange: null,
                                    sampleIds: [
                                        'P-0000628-T01-IM3',
                                        'P-0000628-T02-IM5',
                                    ],
                                },
                            ],
                        },
                    ],
                    MSI: [],
                    CNA: [],
                    WILDTYPE: [],
                },
            },
            {
                trialAgeNumerical: '>=18',
                trialOncotreePrimaryDiagnosis: {
                    positive: ['Non-Small Cell Lung Cancer'],
                    negative: [],
                },
                matches: {
                    MUTATION: [
                        {
                            genomicAlteration: 'EGFR 729_761del',
                            matches: [
                                {
                                    trueHugoSymbol: 'EGFR',
                                    trueProteinChange: ['L747_P753delinsS'],
                                    sampleIds: ['P-0000628-T01-IM3'],
                                },
                            ],
                        },
                    ],
                    MSI: [],
                    CNA: [],
                    WILDTYPE: [],
                },
                notMatches: {
                    MUTATION: [
                        {
                            genomicAlteration: 'EGFR !T790M',
                            matches: [
                                {
                                    trueHugoSymbol: null,
                                    trueProteinChange: null,
                                    sampleIds: ['P-0000628-T01-IM3'],
                                },
                            ],
                        },
                    ],
                    MSI: [],
                    CNA: [],
                    WILDTYPE: [],
                },
            },
            {
                trialAgeNumerical: '>18',
                trialOncotreePrimaryDiagnosis: {
                    positive: ['Lung Adenocarcinoma'],
                    negative: [],
                },
                matches: {
                    MUTATION: [
                        {
                            genomicAlteration: 'EGFR Oncogenic Mutations',
                            matches: [
                                {
                                    trueHugoSymbol: 'EGFR',
                                    trueProteinChange: ['L747_P753delinsS'],
                                    sampleIds: [
                                        'P-0000628-T01-IM3',
                                        'P-0000628-T02-IM5',
                                    ],
                                },
                                {
                                    trueHugoSymbol: 'EGFR',
                                    trueProteinChange: ['T790M'],
                                    sampleIds: ['P-0000628-T02-IM5'],
                                },
                            ],
                        },
                    ],
                    MSI: [],
                    CNA: [],
                    WILDTYPE: [],
                },
                notMatches: {
                    MUTATION: [],
                    MSI: [],
                    CNA: [],
                    WILDTYPE: [],
                },
            },
        ];
        const expectedResult = [2, 1, 0];
        _.forEach(clinicalMatchGroup, (item: any, index: number) => {
            assert.equal(
                getMatchPriority(item),
                expectedResult[index],
                'Priority of trial is wrong.'
            );
        });
    });

    it('Test excludeControlArms: control arms should be excluded from matched results.', () => {
        const data: ITrialMatch[] = [
            {
                id: 'NCT01948297+13-131',
                nctId: 'NCT01948297',
                protocolNo: '13-131',
                oncotreePrimaryDiagnosisName: 'Intrahepatic Cholangiocarcinoma',
                matchType: 'annotated_variant',
                armDescription: 'Part A - Dose Escalation',
                trueHugoSymbol: 'FGFR2',
                sampleId: 'P-0002675-T01-IM3',
                mrn: 'P-0002675',
                trueProteinChange: 'FGFR2-BICC1 fusion',
                genomicAlteration: 'FGFR2 Oncogenic Mutations',
                trialAgeNumerical: '>=18',
                trialOncotreePrimaryDiagnosis: 'All Solid Tumors',
            },
            {
                id: 'NCT01948297+13-131',
                nctId: 'NCT01948297',
                protocolNo: '13-131',
                oncotreePrimaryDiagnosisName: 'Intrahepatic Cholangiocarcinoma',
                matchType: 'annotated_variant',
                armDescription: 'Part B - Expansion Cohort',
                trueHugoSymbol: 'FGFR2',
                sampleId: 'P-0002675-T01-IM3',
                mrn: 'P-0002675',
                trueProteinChange: 'FGFR2-BICC1 fusion',
                genomicAlteration: 'FGFR2 Fusions',
                trialAgeNumerical: '>=18',
                trialOncotreePrimaryDiagnosis: 'All Solid Tumors',
            },
            {
                id: 'NCT02924376+17-405',
                nctId: 'NCT02924376',
                protocolNo: '17-405',
                oncotreePrimaryDiagnosisName: 'Intrahepatic Cholangiocarcinoma',
                matchType: 'annotated_variant',
                armDescription: 'Cohort C INCB054828',
                armType: 'Control Arm',
                sampleId: 'P-0002675-T01-IM3',
                mrn: 'P-0002675',
                genomicAlteration: 'FGF23 !Oncogenic Mutations',
                trialAgeNumerical: '>=18',
                trialOncotreePrimaryDiagnosis: 'Cholangiocarcinoma',
            },
            {
                id: 'NCT02924376+17-405',
                nctId: 'NCT02924376',
                protocolNo: '17-405',
                oncotreePrimaryDiagnosisName: 'Intrahepatic Cholangiocarcinoma',
                matchType: 'annotated_variant',
                armDescription: 'Cohort C INCB054828',
                armType: 'Control Arm',
                sampleId: 'P-0002675-T01-IM3',
                mrn: 'P-0002675',
                genomicAlteration: 'FGFR1 !Oncogenic Mutations',
                trialAgeNumerical: '>=18',
                trialOncotreePrimaryDiagnosis: 'Cholangiocarcinoma',
            },
        ];
        const expectedResult: ITrialMatch[] = [
            {
                id: 'NCT01948297+13-131',
                nctId: 'NCT01948297',
                protocolNo: '13-131',
                oncotreePrimaryDiagnosisName: 'Intrahepatic Cholangiocarcinoma',
                matchType: 'annotated_variant',
                armDescription: 'Part A - Dose Escalation',
                trueHugoSymbol: 'FGFR2',
                sampleId: 'P-0002675-T01-IM3',
                mrn: 'P-0002675',
                trueProteinChange: 'FGFR2-BICC1 fusion',
                genomicAlteration: 'FGFR2 Oncogenic Mutations',
                trialAgeNumerical: '>=18',
                trialOncotreePrimaryDiagnosis: 'All Solid Tumors',
            },
            {
                id: 'NCT01948297+13-131',
                nctId: 'NCT01948297',
                protocolNo: '13-131',
                oncotreePrimaryDiagnosisName: 'Intrahepatic Cholangiocarcinoma',
                matchType: 'annotated_variant',
                armDescription: 'Part B - Expansion Cohort',
                trueHugoSymbol: 'FGFR2',
                sampleId: 'P-0002675-T01-IM3',
                mrn: 'P-0002675',
                trueProteinChange: 'FGFR2-BICC1 fusion',
                genomicAlteration: 'FGFR2 Fusions',
                trialAgeNumerical: '>=18',
                trialOncotreePrimaryDiagnosis: 'All Solid Tumors',
            },
        ];
        assert.deepEqual(
            excludeControlArms(data),
            expectedResult,
            'Exclude control arm failed.'
        );
    });

    it('Test getDrugsFromArm: fetch drugs from arm.', () => {
        const arm: IArm[] = [
            {
                drugs: [
                    [
                        {
                            synonyms: '',
                            name: 'Pemigatinib',
                            ncit_code: 'C121553',
                        },
                    ],
                ],
                arm_info:
                    'INCB054828 in subjects with FGFR2 translocation with a documented fusion partner in central laboratory report',
                match: [
                    {
                        and: [
                            {
                                genomic: {
                                    annotated_variant: 'Fusions',
                                    hugo_symbol: 'FGFR2',
                                },
                            },
                            {
                                clinical: {
                                    oncotree_primary_diagnosis:
                                        'Cholangiocarcinoma',
                                    age_numerical: '>=18',
                                },
                            },
                        ],
                    },
                ],
                arm_eligibility:
                    'Men and women 18 years and older\n\nHistologically or cytologically confirmed advanced/metastatic or surgically unresectable cholangiocarcinoma.\n\nCohort A: FGFR2 translocation with a documented fusion partner in central laboratory report\n',
                arm_description: 'Cohort A INCB054828',
            },
            {
                drugs: [
                    [
                        {
                            synonyms: '',
                            name: 'Pemigatinib',
                            ncit_code: 'C121553',
                        },
                    ],
                ],
                arm_info:
                    'INCB054828 in subjects with other FGF/FGFR alterations',
                match: [
                    {
                        and: [
                            {
                                clinical: {
                                    oncotree_primary_diagnosis:
                                        'Cholangiocarcinoma',
                                    age_numerical: '>=18',
                                },
                            },
                            {
                                or: [
                                    {
                                        genomic: {
                                            annotated_variant: 'N549Y',
                                            hugo_symbol: 'FGFR2',
                                        },
                                    },
                                    {
                                        genomic: {
                                            annotated_variant:
                                                'Oncogenic Mutations',
                                            hugo_symbol: 'FGFR3',
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
                arm_eligibility:
                    'Men and women 18 years and older\n\nHistologically or cytologically confirmed advanced/metastatic or surgically unresectable cholangiocarcinoma.\nCohort B: other FGF/FGFR alterations\n',
                arm_description: 'Cohort B INCB054828',
            },
        ];
        const armDescription: string = 'Cohort B INCB054828';
        const expectedResult: string[][] = [['Pemigatinib']];
        assert.deepEqual(
            getDrugsFromArm(armDescription, arm),
            expectedResult,
            'Get drugs failed.'
        );
    });

    it('Test mergeClinicalGroupMatchByAge: merge trial matches by the same clinical age.', () => {
        const clinicalGroupMatch: IClinicalGroupMatch[] = [
            {
                trialAgeNumerical: ['>0'],
                trialOncotreePrimaryDiagnosis: {
                    positive: ['All Solid Tumors'],
                    negative: ['CNS Cancer'],
                },
                matches: {
                    MUTATION: [
                        {
                            genomicAlteration: ['NTRK3 Fusions'],
                            patientGenomic: {
                                trueHugoSymbol: 'NTRK3',
                                trueProteinChange: [
                                    'NTRK3-ETV6 fusion - Archer',
                                ],
                            },
                        },
                        {
                            genomicAlteration: ['NTRK3 Fusions'],
                            patientGenomic: {
                                trueHugoSymbol: 'NTRK3',
                                trueProteinChange: ['ETV6-NTRK3 fusion'],
                            },
                        },
                    ],
                    CNA: [],
                    MSI: [],
                    WILDTYPE: [],
                },
                notMatches: {
                    MUTATION: [],
                    CNA: [],
                    MSI: [],
                    WILDTYPE: [],
                },
            },
            {
                trialAgeNumerical: ['<22'],
                trialOncotreePrimaryDiagnosis: {
                    positive: ['All Solid Tumors'],
                    negative: ['CNS Cancer'],
                },
                matches: {
                    MUTATION: [
                        {
                            genomicAlteration: ['NTRK3 Fusions'],
                            patientGenomic: {
                                trueHugoSymbol: 'NTRK3',
                                trueProteinChange: [
                                    'NTRK3-ETV6 fusion - Archer',
                                ],
                            },
                        },
                        {
                            genomicAlteration: ['NTRK3 Fusions'],
                            patientGenomic: {
                                trueHugoSymbol: 'NTRK3',
                                trueProteinChange: ['ETV6-NTRK3 fusion'],
                            },
                        },
                    ],
                    CNA: [],
                    MSI: [],
                    WILDTYPE: [],
                },
                notMatches: {
                    MUTATION: [],
                    CNA: [],
                    MSI: [],
                    WILDTYPE: [],
                },
            },
        ];
        const expectedResult: IClinicalGroupMatch[] = [
            {
                trialAgeNumerical: ['>0', '<22'],
                trialOncotreePrimaryDiagnosis: {
                    positive: ['All Solid Tumors'],
                    negative: ['CNS Cancer'],
                },
                matches: {
                    MUTATION: [
                        {
                            genomicAlteration: ['NTRK3 Fusions'],
                            patientGenomic: {
                                trueHugoSymbol: 'NTRK3',
                                trueProteinChange: [
                                    'NTRK3-ETV6 fusion - Archer',
                                ],
                            },
                        },
                        {
                            genomicAlteration: ['NTRK3 Fusions'],
                            patientGenomic: {
                                trueHugoSymbol: 'NTRK3',
                                trueProteinChange: ['ETV6-NTRK3 fusion'],
                            },
                        },
                    ],
                    CNA: [],
                    MSI: [],
                    WILDTYPE: [],
                },
                notMatches: {
                    MUTATION: [],
                    CNA: [],
                    MSI: [],
                    WILDTYPE: [],
                },
            },
        ];
        assert.deepEqual(
            mergeClinicalGroupMatchByAge(clinicalGroupMatch),
            expectedResult,
            'Merge trial matches by the same clinical age failed.'
        );
    });
});
