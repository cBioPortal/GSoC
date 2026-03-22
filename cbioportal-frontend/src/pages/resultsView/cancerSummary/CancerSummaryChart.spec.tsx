import { assert } from 'chai';
import { shallow } from 'enzyme';
import * as React from 'react';
import {
    CancerSummaryChart,
    HORIZONTAL_SCROLLING_THRESHOLD,
    mergeAlterationDataAcrossAlterationTypes,
} from './CancerSummaryChart';

describe('CancerSummaryChart', () => {
    it('Allows chart container to be horizontally scrolled when bar threshold is reached', () => {
        const method: () => any = Object.getOwnPropertyDescriptor(
            CancerSummaryChart.prototype,
            'overflowStyle'
        )!.get!;

        let result = method
            .bind({ props: { xLabels: Array(HORIZONTAL_SCROLLING_THRESHOLD) } })
            .call();
        assert.equal(result.width, 'auto');

        result = method
            .bind({
                props: { xLabels: Array(HORIZONTAL_SCROLLING_THRESHOLD + 1) },
            })
            .call();
        assert.equal(result.width, '100%');
    });

    it('#legendData only includes alteration types which are present in query', () => {
        const props = {
            data: [
                [
                    {
                        alterationType: 'multiple',
                        x: 'Lung Squamous Cell Carcinoma',
                        y: 27.066115702479337,
                    },
                    {
                        alterationType: 'multiple',
                        x: 'Lung Adenocarcinoma',
                        y: 13.18181818181818,
                    },
                ],
                [
                    {
                        alterationType: 'protExpressionLow',
                        x: 'Lung Squamous Cell Carcinoma',
                        y: 0,
                    },
                    {
                        alterationType: 'protExpressionLow',
                        x: 'Lung Adenocarcinoma',
                        y: 0,
                    },
                ],
                [
                    {
                        alterationType: 'protExpressionHigh',
                        x: 'Lung Squamous Cell Carcinoma',
                        y: 0,
                    },
                    {
                        alterationType: 'protExpressionHigh',
                        x: 'Lung Adenocarcinoma',
                        y: 0,
                    },
                ],
                [
                    {
                        alterationType: 'mrnaExpressionLow',
                        x: 'Lung Squamous Cell Carcinoma',
                        y: 0,
                    },
                    {
                        alterationType: 'mrnaExpressionLow',
                        x: 'Lung Adenocarcinoma',
                        y: 0,
                    },
                ],
                [
                    {
                        alterationType: 'mrnaExpressionHigh',
                        x: 'Lung Squamous Cell Carcinoma',
                        y: 0,
                    },
                    {
                        alterationType: 'mrnaExpressionHigh',
                        x: 'Lung Adenocarcinoma',
                        y: 0,
                    },
                ],
                [
                    {
                        alterationType: 'hetloss',
                        x: 'Lung Squamous Cell Carcinoma',
                        y: 0,
                    },
                    {
                        alterationType: 'hetloss',
                        x: 'Lung Adenocarcinoma',
                        y: 0,
                    },
                ],
                [
                    {
                        alterationType: 'homdel',
                        x: 'Lung Squamous Cell Carcinoma',
                        y: 3.71900826446281,
                    },
                    {
                        alterationType: 'homdel',
                        x: 'Lung Adenocarcinoma',
                        y: 8.181818181818182,
                    },
                ],
                [
                    {
                        alterationType: 'gain',
                        x: 'Lung Squamous Cell Carcinoma',
                        y: 0,
                    },
                    {
                        alterationType: 'gain',
                        x: 'Lung Adenocarcinoma',
                        y: 0,
                    },
                ],
                [
                    {
                        alterationType: 'amp',
                        x: 'Lung Squamous Cell Carcinoma',
                        y: 0.4132231404958678,
                    },
                    {
                        alterationType: 'amp',
                        x: 'Lung Adenocarcinoma',
                        y: 5.909090909090909,
                    },
                ],
                [
                    {
                        alterationType: 'fusion',
                        x: 'Lung Squamous Cell Carcinoma',
                        y: 0,
                    },
                    {
                        alterationType: 'fusion',
                        x: 'Lung Adenocarcinoma',
                        y: 0,
                    },
                ],
                [
                    {
                        alterationType: 'mutated',
                        x: 'Lung Squamous Cell Carcinoma',
                        y: 60.33057851239669,
                    },
                    {
                        alterationType: 'mutated',
                        x: 'Lung Adenocarcinoma',
                        y: 42.42424242424242,
                    },
                ],
            ],
            countsByGroup: {
                'Lung Adenocarcinoma': {
                    profiledTotal: 660,
                    alterationTotal: 547,
                    alterationTypeCounts: {
                        mutated: 280,
                        amp: 39,
                        homdel: 54,
                        hetloss: 0,
                        gain: 0,
                        fusion: 0,
                        mrnaExpressionHigh: 0,
                        mrnaExpressionLow: 0,
                        protExpressionHigh: 0,
                        protExpressionLow: 0,
                        multiple: 87,
                    },
                    alteredCount: 460,
                    parentCancerType: 'Non-Small Cell Lung Cancer',
                },
                'Lung Squamous Cell Carcinoma': {
                    profiledTotal: 484,
                    alterationTotal: 574,
                    alterationTypeCounts: {
                        mutated: 292,
                        amp: 2,
                        homdel: 18,
                        hetloss: 0,
                        gain: 0,
                        fusion: 0,
                        mrnaExpressionHigh: 0,
                        mrnaExpressionLow: 0,
                        protExpressionHigh: 0,
                        protExpressionLow: 0,
                        multiple: 131,
                    },
                    alteredCount: 443,
                    parentCancerType: 'Non-Small Cell Lung Cancer',
                },
            },
            representedAlterations: {
                multiple: true,
                homdel: true,
                amp: true,
                mutated: true,
            },
            alterationTypes: {
                multiple: 'Multiple Alterations',
                protExpressionLow: 'Protein Low',
                protExpressionHigh: 'Protein High',
                mrnaExpressionLow: 'mRNA Low',
                mrnaExpressionHigh: 'mRNA High',
                hetloss: 'Shallow Deletion',
                homdel: 'Deep Deletion',
                gain: 'Gain',
                amp: 'Amplification',
                fusion: 'Fusion',
                mutated: 'Mutation',
            },
            isPercentage: true,
            colors: {
                mutated: '#008000',
                amp: '#ff0000',
                homdel: 'rgb(0,0,255)',
                hetloss: '#000',
                gain: 'rgb(255,182,193)',
                fusion: '#8B00C9',
                mrnaExpressionHigh: '#FF989A',
                mrnaExpressionLow: '#529AC8',
                protExpressionHigh: '#FF989A',
                protExpressionLow: '#E0FFFF',
                multiple: '#666',
            },
            xLabels: ['Lung Squamous Cell Carcinoma', 'Lung Adenocarcinoma'],
            alterationTypeDataCounts: [
                {
                    x: 'Lung Squamous Cell Carcinoma',
                    y: 'Mutation data',
                    profiledCount: 484,
                    notProfiledCount: 0,
                },
                {
                    x: 'Lung Adenocarcinoma',
                    y: 'Mutation data',
                    profiledCount: 660,
                    notProfiledCount: 0,
                },
                {
                    x: 'Lung Squamous Cell Carcinoma',
                    y: 'CNA data',
                    profiledCount: 100,
                    notProfiledCount: 0,
                },
                {
                    x: 'Lung Adenocarcinoma',
                    y: 'CNA data',
                    profiledCount: 25,
                    notProfiledCount: 0,
                },
            ],
        } as any;

        const instance = shallow(
            <CancerSummaryChart {...props} />
        ).instance() as CancerSummaryChart;

        const result = [
            { name: 'Mutation', symbol: { fill: '#008000' } },
            { name: 'Amplification', symbol: { fill: '#ff0000' } },
            { name: 'Deep Deletion', symbol: { fill: 'rgb(0,0,255)' } },
            { name: 'Multiple Alterations', symbol: { fill: '#666' } },
        ];

        assert.deepEqual(
            instance.legendData,
            result,
            'represented alterations present in legendData'
        );

        delete instance.props.representedAlterations['mutated'];

        assert.deepEqual(
            instance.legendData,
            result.slice(1),
            'mutations no longer present be no longer in represented alterations'
        );
    });

    it('#mergeAlterationDataAcrossAlterationTypes should merge alteration rate/count across alteration types', () => {
        let alterationData = [
            [
                {
                    alterationType: 'multiple',
                    x: 'Colorectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'multiple',
                    x: 'Rectal Adenocarcinoma',
                    y: 2.083333333333333,
                    alterationCount: 0,
                },
                {
                    alterationType: 'multiple',
                    x: 'Colon Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
            ],
            [
                {
                    alterationType: 'protExpressionLow',
                    x: 'Colorectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'protExpressionLow',
                    x: 'Rectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'protExpressionLow',
                    x: 'Colon Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
            ],
            [
                {
                    alterationType: 'protExpressionHigh',
                    x: 'Colorectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'protExpressionHigh',
                    x: 'Rectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'protExpressionHigh',
                    x: 'Colon Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
            ],
            [
                {
                    alterationType: 'mrnaExpressionLow',
                    x: 'Colorectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'mrnaExpressionLow',
                    x: 'Rectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'mrnaExpressionLow',
                    x: 'Colon Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
            ],
            [
                {
                    alterationType: 'mrnaExpressionHigh',
                    x: 'Colorectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'mrnaExpressionHigh',
                    x: 'Rectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'mrnaExpressionHigh',
                    x: 'Colon Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
            ],
            [
                {
                    alterationType: 'hetloss',
                    x: 'Colorectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'hetloss',
                    x: 'Rectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'hetloss',
                    x: 'Colon Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
            ],
            [
                {
                    alterationType: 'homdel',
                    x: 'Colorectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'homdel',
                    x: 'Rectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'homdel',
                    x: 'Colon Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
            ],
            [
                {
                    alterationType: 'gain',
                    x: 'Colorectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'gain',
                    x: 'Rectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'gain',
                    x: 'Colon Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
            ],
            [
                {
                    alterationType: 'amp',
                    x: 'Colorectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'amp',
                    x: 'Rectal Adenocarcinoma',
                    y: 2.083333333333333,
                    alterationCount: 0,
                },
                {
                    alterationType: 'amp',
                    x: 'Colon Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
            ],
            [
                {
                    alterationType: 'fusion',
                    x: 'Colorectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'fusion',
                    x: 'Rectal Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
                {
                    alterationType: 'fusion',
                    x: 'Colon Adenocarcinoma',
                    y: 0,
                    alterationCount: 0,
                },
            ],
            [
                {
                    alterationType: 'mutated',
                    x: 'Colorectal Adenocarcinoma',
                    y: 78.26086956521739,
                    alterationCount: 0,
                },
                {
                    alterationType: 'mutated',
                    x: 'Rectal Adenocarcinoma',
                    y: 54.166666666666664,
                    alterationCount: 0,
                },
                {
                    alterationType: 'mutated',
                    x: 'Colon Adenocarcinoma',
                    y: 46.808510638297875,
                    alterationCount: 0,
                },
            ],
        ];

        const ret = mergeAlterationDataAcrossAlterationTypes(alterationData);

        const expectedResult = [
            {
                x: 'Colorectal Adenocarcinoma',
                y: 78.26086956521739,
                alterationType: 'whatever',
            },
            {
                x: 'Rectal Adenocarcinoma',
                y: 58.33333333333333,
                alterationType: 'whatever',
            },
            {
                x: 'Colon Adenocarcinoma',
                y: 46.808510638297875,
                alterationType: 'whatever',
            },
        ];

        assert.deepEqual(ret, expectedResult);
    });
});
