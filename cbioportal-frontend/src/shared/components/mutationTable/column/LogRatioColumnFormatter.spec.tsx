import { assert } from 'chai';
import { initMutation } from 'test/MutationMockUtils';
import { Mutation } from 'cbioportal-ts-api-client';
import { GroupComparisonMutation } from 'shared/model/GroupComparisonMutation';
import { getLogRatioTextValue } from './LogRatioColumnFormatter';

describe('LogRatioColumnFormatter', () => {
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

    it('gets mutated count percentage text value properly', () => {
        assert.equal(
            getLogRatioTextValue(rowDataByProteinChange, [mutation1]),
            '>10'
        );

        assert.equal(
            getLogRatioTextValue(rowDataByProteinChange, [mutation2]),
            '3.64'
        );

        assert.equal(
            getLogRatioTextValue(rowDataByProteinChange, [mutation3]),
            '<-10'
        );
    });
});
