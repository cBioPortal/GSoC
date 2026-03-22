import { assert } from 'chai';
import { initMutation } from 'test/MutationMockUtils';
import { Mutation } from 'cbioportal-ts-api-client';
import { GroupComparisonMutation } from 'shared/model/GroupComparisonMutation';
import { enrichedInRenderFunction } from './EnrichedInColumnFormatter';
import { mount, ReactWrapper } from 'enzyme';
import { ComparisonGroup } from 'pages/groupComparison/GroupComparisonUtils';
import styles from 'pages/resultsView/enrichments/styles.module.scss';

describe('EnrichedInColumnFormatter', () => {
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
            groupAMutatedCount: 9,
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
            groupAMutatedCount: 9,
            groupBMutatedCount: 1,
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
            studies: [],
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
            studies: [],
            nonExistentSamples: [],
            origin: ['msk_impact_2017'],
            description: '',
        },
    ];

    let component1: ReactWrapper<any, any>;
    let component2: ReactWrapper<any, any>;
    let component3: ReactWrapper<any, any>;

    beforeAll(() => {
        component1 = mount(
            enrichedInRenderFunction(
                rowDataByProteinChange,
                [mutation1],
                groups
            )
        );
        component2 = mount(
            enrichedInRenderFunction(
                rowDataByProteinChange,
                [mutation2],
                groups
            )
        );
        component3 = mount(
            enrichedInRenderFunction(
                rowDataByProteinChange,
                [mutation3],
                groups
            )
        );
    });

    function testRenderedValues(
        component: ReactWrapper<any, any>,
        classNames: string[],
        value: string
    ) {
        assert.isTrue(
            classNames.every(c =>
                component.find(`div.${(styles as any)[c]}`).exists()
            )
        );
        assert.equal(component.find(`div`).text(), value);
    }

    it('renders enriched in column correctly', () => {
        testRenderedValues(
            component1,
            ['Tendency', 'Significant', 'ColoredBackground'],
            '(A) Metastasis'
        );
        testRenderedValues(
            component2,
            ['Tendency', 'Significant', 'ColoredBackground'],
            '(A) Metastasis'
        );
        testRenderedValues(component3, ['Tendency'], '(B) Primary');
    });
});
