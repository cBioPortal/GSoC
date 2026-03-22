import { assert } from 'chai';
import { GenericAssayChart } from '../StudyViewPageStore';
import { getInfoMessageForGenericAssayChart } from './AddChartButtonHelper';

describe('AddChartButtonHelper', () => {
    describe('getInfoMessageForGenericAssayChart', () => {
        const zeroGenericAssayChart: GenericAssayChart[] = [];
        const singleGenericAssayChart = [
            {
                name: 'chart_1',
                description: 'chart_1',
                dataType: 'data_type',
                profileType: 'profile_type',
                genericAssayType: 'generic_assay_type',
                genericAssayEntityId: 'entity_1',
            } as GenericAssayChart,
        ];
        const multipleGenericAssayChart = [
            {
                name: 'chart_1',
                description: 'chart_1',
                dataType: 'data_type',
                profileType: 'profile_type',
                genericAssayType: 'generic_assay_type',
                genericAssayEntityId: 'entity_1',
            } as GenericAssayChart,
            {
                name: 'chart_2',
                description: 'chart_2',
                dataType: 'data_type',
                profileType: 'profile_type',
                genericAssayType: 'generic_assay_type',
                genericAssayEntityId: 'entity_2',
            } as GenericAssayChart,
        ];
        const emptyAttrs: string[] = [];
        const selectedAttrs = [
            'entity_1_profile_type',
            'entity_2_profile_type',
        ];

        it('returns 0 charts added for zero charts', () => {
            assert.equal(
                getInfoMessageForGenericAssayChart(
                    zeroGenericAssayChart,
                    selectedAttrs
                ),
                '0 charts added'
            );
        });
        it('returns chart added message for one chart', () => {
            assert.equal(
                getInfoMessageForGenericAssayChart(
                    singleGenericAssayChart,
                    emptyAttrs
                ),
                'chart_1 has been added.'
            );
        });
        it('returns chart already added message for one chart', () => {
            assert.equal(
                getInfoMessageForGenericAssayChart(
                    singleGenericAssayChart,
                    selectedAttrs
                ),
                'chart_1 is already added.'
            );
        });
        it('returns 2 charts added for two charts', () => {
            assert.equal(
                getInfoMessageForGenericAssayChart(
                    multipleGenericAssayChart,
                    selectedAttrs
                ),
                '2 charts added'
            );
        });
    });
});
