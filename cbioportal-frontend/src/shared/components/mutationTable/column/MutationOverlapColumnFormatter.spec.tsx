import { assert } from 'chai';
import { initMutation } from 'test/MutationMockUtils';
import { Mutation, Sample } from 'cbioportal-ts-api-client';
import { GroupComparisonMutation } from 'shared/model/GroupComparisonMutation';
import { mutationOverlapRenderFunction } from './MutationOverlapColumnFormatter';
import { mount, ReactWrapper } from 'enzyme';
import {
    ComparisonGroup,
    getPatientIdentifiers,
    getSampleIdentifiers,
} from 'pages/groupComparison/GroupComparisonUtils';
import styles from 'pages/resultsView/enrichments/styles.module.scss';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';

describe('MutationOverlapColumnFormatter', () => {
    const mutation1: Mutation = initMutation({
        proteinChange: 'L702H',
    });

    const mutation2: Mutation = initMutation({
        proteinChange: 'H875Y',
    });

    const mutation3: Mutation = initMutation({
        proteinChange: 'A646D',
    });

    const rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    } = {
        L702H: {
            proteinChange: 'L702H',
            enrichedGroup: '(A) Metastasis',
            groupAMutatedCount: 1,
            groupAMutatedPercentage: 3.2490974729241873,
            groupBMutatedCount: 0,
            groupBMutatedPercentage: 0,
            logRatio: Infinity,
            pValue: 0.00036917378321091467,
            qValue: 0.005906780531374635,
        },
        H875Y: {
            proteinChange: 'H875Y',
            enrichedGroup: '(A) Metastasis',
            groupAMutatedCount: 1,
            groupBMutatedCount: 0,
            groupAMutatedPercentage: 3.2490974729241873,
            groupBMutatedPercentage: 0.26041666666666663,
            logRatio: 3.6411453361142803,
            pValue: 0.0023260213212133113,
            qValue: 0.01860817056970649,
        },
        A646D: {
            proteinChange: 'A646D',
            enrichedGroup: '(B) Primary',
            groupAMutatedCount: 0,
            groupBMutatedCount: 1,
            groupAMutatedPercentage: 0,
            groupBMutatedPercentage: 0.26041666666666663,
            logRatio: -Infinity,
            pValue: 0.999999999999234,
            qValue: 0.999999999999234,
        },
    };

    const groups: ComparisonGroup[] = [
        {
            color: '#DC3912',
            uid: 'Metastasis',
            name: 'Metastasis',
            nameWithOrdinal: '(A) Metastasis',
            ordinal: 'A',
            studies: [
                {
                    id: 'msk_impact_2017',
                    samples: [
                        'P-0000441-T01-IM3',
                        'P-0000441-T02-IM5',
                        'P-0004910-T03-IM5',
                        'P-0004910-T04-IM5',
                    ],
                    patients: [],
                },
            ],
            nonExistentSamples: [],
            origin: ['msk_impact_2017'],
            description: '',
        },
        {
            color: '#2986E2',
            uid: 'Primary',
            name: 'Primary',
            nameWithOrdinal: '(B) Primary',
            ordinal: 'B',
            studies: [
                {
                    id: 'msk_impact_2017',
                    samples: ['P-0004474-T01-IM5'],
                    patients: [],
                },
            ],
            nonExistentSamples: [],
            origin: ['msk_impact_2017'],
            description: '',
        },
    ];

    const profiledPatientCounts = [2, 1];

    const samples: Sample[] = [
        {
            uniqueSampleKey: 'UC0wMDAwNDQxLVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3',
            uniquePatientKey: 'UC0wMDAwNDQxOm1za19pbXBhY3RfMjAxNw',
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            copyNumberSegmentPresent: true,
            sampleId: 'P-0000441-T01-IM3',
            patientId: 'P-0000441',
            studyId: 'msk_impact_2017',
        },
        {
            uniqueSampleKey: 'UC0wMDAwNDQxLVQwMi1JTTU6bXNrX2ltcGFjdF8yMDE3',
            uniquePatientKey: 'UC0wMDAwNDQxOm1za19pbXBhY3RfMjAxNw',
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            copyNumberSegmentPresent: true,
            sampleId: 'P-0000441-T02-IM5',
            patientId: 'P-0000441',
            studyId: 'msk_impact_2017',
        },
        {
            uniqueSampleKey: 'UC0wMDA0OTEwLVQwMy1JTTU6bXNrX2ltcGFjdF8yMDE3',
            uniquePatientKey: 'UC0wMDA0OTEwOm1za19pbXBhY3RfMjAxNw',
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            copyNumberSegmentPresent: true,
            sampleId: 'P-0004910-T03-IM5',
            patientId: 'P-0004910',
            studyId: 'msk_impact_2017',
        },
        {
            uniqueSampleKey: 'UC0wMDA0OTEwLVQwNC1JTTU6bXNrX2ltcGFjdF8yMDE3',
            uniquePatientKey: 'UC0wMDA0OTEwOm1za19pbXBhY3RfMjAxNw',
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            copyNumberSegmentPresent: true,
            sampleId: 'P-0004910-T04-IM5',
            patientId: 'P-0004910',
            studyId: 'msk_impact_2017',
        },
        {
            uniqueSampleKey: 'UC0wMDA0NDc0LVQwMS1JTTU6bXNrX2ltcGFjdF8yMDE3',
            uniquePatientKey: 'UC0wMDA0NDc0Om1za19pbXBhY3RfMjAxNw',
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            copyNumberSegmentPresent: true,
            sampleId: 'P-0004474-T01-IM5',
            patientId: 'P-0004474',
            studyId: 'msk_impact_2017',
        },
    ];
    const sampleSet = new ComplexKeyMap<Sample>();
    for (const sample of samples) {
        sampleSet.set(
            { studyId: sample.studyId, sampleId: sample.sampleId },
            sample
        );
    }

    const sampleIdentifiersForGroupA = getSampleIdentifiers([groups[0]]);
    const patientIdentifiersforGroupA = getPatientIdentifiers(
        sampleIdentifiersForGroupA,
        sampleSet
    );
    const sampleIdentifiersForGroupB = getSampleIdentifiers([groups[1]]);
    const patientIdentifiersforGroupB = getPatientIdentifiers(
        sampleIdentifiersForGroupB,
        sampleSet
    );
    const totalQueriedCases =
        patientIdentifiersforGroupA.length + patientIdentifiersforGroupB.length;

    let component1: ReactWrapper<any, any>;
    let component2: ReactWrapper<any, any>;
    let component3: ReactWrapper<any, any>;

    beforeAll(() => {
        component1 = mount(
            mutationOverlapRenderFunction(
                rowDataByProteinChange,
                [mutation1],
                profiledPatientCounts,
                sampleSet,
                groups
            )
        );
        component2 = mount(
            mutationOverlapRenderFunction(
                rowDataByProteinChange,
                [mutation2],
                profiledPatientCounts,
                sampleSet,
                groups
            )
        );
        component3 = mount(
            mutationOverlapRenderFunction(
                rowDataByProteinChange,
                [mutation3],
                profiledPatientCounts,
                sampleSet,
                groups
            )
        );
    });

    it('adds tooltips for all', () => {
        assert.isTrue(component1.find(DefaultTooltip).exists());
        assert.isTrue(component2.find(DefaultTooltip).exists());
        assert.isTrue(component3.find(DefaultTooltip).exists());
    });

    it('displays correct number of patients in tooltip', () => {
        assert.equal(patientIdentifiersforGroupA.length, 2);
        assert.equal(patientIdentifiersforGroupB.length, 1);
        assert.equal(totalQueriedCases, 3);
    });

    it('uses correct number of unprofiled patients in tooltip', () => {
        const group1Unprofiled =
            ((patientIdentifiersforGroupA.length - profiledPatientCounts[0]) /
                totalQueriedCases) *
            100;
        const group2Unprofiled =
            ((patientIdentifiersforGroupB.length - profiledPatientCounts[1]) /
                totalQueriedCases) *
            100;

        assert.equal(group1Unprofiled, 0);
        assert.equal(group2Unprofiled, 0);
    });

    it('displays correct percentage of patients in tooltip', () => {
        // mutation 1
        const group1UnalteredForMutation1 =
            ((profiledPatientCounts[0] -
                rowDataByProteinChange[mutation1.proteinChange]
                    .groupAMutatedCount) /
                totalQueriedCases) *
            100;
        const group1AlteredForMutation1 =
            (rowDataByProteinChange[mutation1.proteinChange]
                .groupAMutatedCount /
                totalQueriedCases) *
            100;
        const group2AlteredForMutation1 =
            (rowDataByProteinChange[mutation1.proteinChange]
                .groupBMutatedCount /
                totalQueriedCases) *
            100;

        assert.equal(group1UnalteredForMutation1, 33.33333333333333);
        assert.equal(group1AlteredForMutation1, 33.33333333333333);
        assert.equal(group2AlteredForMutation1, 0);

        // mutation 2
        const group1UnalteredForMutation2 =
            ((profiledPatientCounts[0] -
                rowDataByProteinChange[mutation2.proteinChange]
                    .groupAMutatedCount) /
                totalQueriedCases) *
            100;
        const group1AlteredForMutation2 =
            (rowDataByProteinChange[mutation2.proteinChange]
                .groupAMutatedCount /
                totalQueriedCases) *
            100;
        const group2AlteredForMutation2 =
            (rowDataByProteinChange[mutation2.proteinChange]
                .groupBMutatedCount /
                totalQueriedCases) *
            100;

        assert.equal(group1UnalteredForMutation2, 33.33333333333333);
        assert.equal(group1AlteredForMutation2, 33.33333333333333);
        assert.equal(group2AlteredForMutation2, 0);

        // mutation 3
        const group1UnalteredForMutation3 =
            ((profiledPatientCounts[0] -
                rowDataByProteinChange[mutation3.proteinChange]
                    .groupAMutatedCount) /
                totalQueriedCases) *
            100;
        const group1AlteredForMutation3 =
            (rowDataByProteinChange[mutation3.proteinChange]
                .groupAMutatedCount /
                totalQueriedCases) *
            100;
        const group2AlteredForMutation3 =
            (rowDataByProteinChange[mutation3.proteinChange]
                .groupBMutatedCount /
                totalQueriedCases) *
            100;

        assert.equal(group1UnalteredForMutation3, 66.66666666666666);
        assert.equal(group1AlteredForMutation3, 0);
        assert.equal(group2AlteredForMutation3, 33.33333333333333);
    });
});
