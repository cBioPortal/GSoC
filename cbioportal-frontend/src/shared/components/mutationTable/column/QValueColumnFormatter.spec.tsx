import { assert } from 'chai';
import { initMutation } from 'test/MutationMockUtils';
import { Mutation } from 'cbioportal-ts-api-client';
import { GroupComparisonMutation } from 'shared/model/GroupComparisonMutation';
import { qValueRenderFunction } from './QValueColumnFormatter';
import { mount, ReactWrapper } from 'enzyme';

describe('QValueColumnFormatter', () => {
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

    let component1: ReactWrapper<any, any>;
    let component2: ReactWrapper<any, any>;
    let component3: ReactWrapper<any, any>;

    beforeAll(() => {
        component1 = mount(
            qValueRenderFunction(rowDataByProteinChange, [mutation1])
        );
        component2 = mount(
            qValueRenderFunction(rowDataByProteinChange, [mutation2])
        );
        component3 = mount(
            qValueRenderFunction(rowDataByProteinChange, [mutation3])
        );
    });

    function testRenderedValues(
        component: ReactWrapper<any, any>,
        value: string,
        fontWeight: string
    ) {
        assert.equal(component.find(`span`).text(), value);
        assert.isTrue(
            component.find(`span`).getElement().props.style.fontWeight ===
                fontWeight
        );
    }

    it('renders q-value correctly', () => {
        testRenderedValues(component1, '5.907e-3', 'bold');
        testRenderedValues(component2, '0.0186', 'bold');
        testRenderedValues(component3, '1.00', 'normal');
    });
});
