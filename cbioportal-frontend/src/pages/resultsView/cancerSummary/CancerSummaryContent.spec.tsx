import {
    calculatePercentage,
    CancerSummaryContent,
    IAlterationData,
    OrderedAlterationLabelMap,
} from './CancerSummaryContent';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import * as React from 'react';
import _ from 'lodash';
import sinon from 'sinon';

describe('CancerSummaryContent', () => {
    let groupedAlterationData: {
        [groupType: string]: IAlterationData;
    };

    beforeEach(() => {
        groupedAlterationData = {
            'Colon Adenocarcinoma': {
                profiledTotal: 94,
                alterationTotal: 10,
                alterationTypeCounts: {
                    mutated: 10,
                    amp: 0,
                    homdel: 0,
                    hetloss: 0,
                    gain: 0,
                    structuralVariant: 0,
                    mrnaExpressionHigh: 0,
                    mrnaExpressionLow: 0,
                    protExpressionHigh: 0,
                    protExpressionLow: 0,
                    multiple: 0,
                },
                alteredCount: 10,
                parentCancerType: 'Colorectal Cancer',
                profiledCounts: {
                    mutation: 10,
                    cna: 0,
                    expression: 0,
                    protein: 0,
                    structuralVariant: 0,
                },
                notProfiledCounts: {
                    mutation: 0,
                    cna: 0,
                    expression: 0,
                    protein: 0,
                    structuralVariant: 0,
                },
            },
            'Colorectal Adenocarcinoma': {
                profiledTotal: 23,
                alterationTotal: 1,
                alterationTypeCounts: {
                    mutated: 1,
                    amp: 0,
                    homdel: 0,
                    hetloss: 0,
                    gain: 0,
                    structuralVariant: 0,
                    mrnaExpressionHigh: 0,
                    mrnaExpressionLow: 0,
                    protExpressionHigh: 0,
                    protExpressionLow: 0,
                    multiple: 0,
                },
                alteredCount: 1,
                parentCancerType: 'Colorectal Cancer',
                profiledCounts: {
                    mutation: 1,
                    cna: 0,
                    expression: 0,
                    protein: 0,
                    structuralVariant: 0,
                },
                notProfiledCounts: {
                    mutation: 0,
                    cna: 0,
                    expression: 0,
                    protein: 0,
                    structuralVariant: 0,
                },
            },
            'Rectal Adenocarcinoma': {
                profiledTotal: 48,
                alterationTotal: 5,
                alterationTypeCounts: {
                    mutated: 4,
                    amp: 1,
                    homdel: 0,
                    hetloss: 0,
                    gain: 0,
                    structuralVariant: 0,
                    mrnaExpressionHigh: 0,
                    mrnaExpressionLow: 0,
                    protExpressionHigh: 0,
                    protExpressionLow: 0,
                    multiple: 0,
                },
                alteredCount: 5,
                parentCancerType: 'Colorectal Cancer',
                profiledCounts: {
                    mutation: 5,
                    cna: 1,
                    expression: 0,
                    protein: 0,
                    structuralVariant: 0,
                },
                notProfiledCounts: {
                    mutation: 0,
                    cna: 0,
                    expression: 0,
                    protein: 0,
                    structuralVariant: 0,
                },
            },
        };
    });

    it('#getYValue should return total count if absolute mode, otherwise percentage', () => {
        const comp = CancerSummaryContent;
        const ret1 = comp.prototype.getYValue.call(
            { yAxis: 'abs-count' },
            1,
            5,
            'absolute count returns count value'
        );
        assert.equal(ret1, 1);

        const ret2 = comp.prototype.getYValue.call(
            { yAxis: 'alt-freq' },
            1,
            5,
            'frequency returns percentage of total'
        );
        assert.equal(ret2, 20);
    });

    it('#calculatePercentage returns ratio of part to whole', () => {
        assert.equal(calculatePercentage(5, 10), 50);
        assert.equal(calculatePercentage(0, 5), 0);
        assert.equal(calculatePercentage(20, 20), 100);
        assert.equal(calculatePercentage(9, 10), 90);
    });

    it("#maxAltCount getter returns maxPercenage if we're in frequecy mode (default), absolute count otherwise", () => {
        const wrapper = shallow(
            <CancerSummaryContent
                groupedAlterationData={groupedAlterationData}
                groupAlterationsBy={'cancerTypeDetailed'}
                countAlterationsBy={'sampleCounts'}
                gene={'NRAS'}
                width={500}
                handlePivotChange={() => {}}
                handlePivotCountChange={() => {}}
            />
        );

        const instance = wrapper.instance() as CancerSummaryContent;
        const chartData = instance.chartData;
        assert.equal(
            instance.altCasesMax,
            chartData.maxPercentage,
            'returns percentage'
        );

        instance.yAxis = 'abs-count';
        assert.equal(
            instance.altCasesMax,
            chartData.maxAbsoluteCount,
            'returns absolute count'
        );
    });

    it('#handleYAxisChange should reset alteration slider to zero', () => {
        const comp = CancerSummaryContent;
        const mockInstance = {
            handleAltSliderChange: sinon.stub(),
            altCasesValue: null,
            yAxis: null,
        };
        comp.prototype.handleYAxisChange.call(mockInstance, {
            target: {
                value: 'something',
            },
        });
        assert.equal(mockInstance.altCasesValue, 0, 'sets altCasesValue to 0');
        assert.equal(
            mockInstance.yAxis,
            'something',
            'sets altCasesValue to 0'
        );
        assert.isTrue(
            mockInstance.handleAltSliderChange.calledOnce,
            'slider change handler called'
        );
        assert.isTrue(
            mockInstance.handleAltSliderChange.calledWith(0),
            'slider set to zero'
        );
    });

    it('#handleXAxisChange should reset alteration slider to zero', () => {
        const comp = CancerSummaryContent;
        const mockInstance = {
            xAxis: null,
        };
        comp.prototype.handleXAxisChange.call(mockInstance, {
            target: {
                value: 'something',
            },
        });
        assert.equal(
            mockInstance.xAxis,
            'something',
            'sets xAis to passed value'
        );
    });

    describe('chartData getter', () => {
        it('returns labels and appropriate alteration percentages', () => {
            const wrapper = shallow(
                <CancerSummaryContent
                    groupedAlterationData={groupedAlterationData}
                    groupAlterationsBy={'cancerTypeDetailed'}
                    countAlterationsBy={'sampleCounts'}
                    gene={'NRAS'}
                    width={500}
                    handlePivotChange={() => {}}
                    handlePivotCountChange={() => {}}
                />
            );

            const chartData = (wrapper.instance() as CancerSummaryContent)
                .chartData;
            assert.equal(
                chartData.data.length,
                _.size(OrderedAlterationLabelMap),
                'all alteration types are returned in data'
            );
            assert.isFalse(
                'gain' in chartData.representedAlterations,
                'Alteration types with count 0 in result are NOT in represented alteration map'
            );
            assert.deepEqual(chartData.representedAlterations, {
                amp: true,
                mutated: true,
            });
            assert.equal(chartData.data[8][1].y, 2.083333333333333);
        });

        it('respects alteration percentage threshold', () => {
            const wrapper = shallow(
                <CancerSummaryContent
                    groupedAlterationData={groupedAlterationData}
                    groupAlterationsBy={'cancerTypeDetailed'}
                    countAlterationsBy={'sampleCounts'}
                    gene={'NRAS'}
                    width={500}
                    handlePivotChange={() => {}}
                    handlePivotCountChange={() => {}}
                />
            );

            const instance = wrapper.instance() as CancerSummaryContent;
            assert.deepEqual(
                instance.chartData.labels,
                [
                    'Colon Adenocarcinoma',
                    'Rectal Adenocarcinoma',
                    'Colorectal Adenocarcinoma',
                ],
                'Has all three group types in labels'
            );

            instance.tempAltCasesValue = 5;
            assert.deepEqual(
                instance.chartData.labels,
                ['Colon Adenocarcinoma', 'Rectal Adenocarcinoma'],
                'Filters out alt percentage lower than 5'
            );

            instance.tempAltCasesValue = 10.5;
            assert.deepEqual(
                instance.chartData.labels,
                ['Colon Adenocarcinoma'],
                'Filters out alt percentage lower than 10.5'
            );
        });

        it('respects alteration absolute threshold', () => {
            const wrapper = shallow(
                <CancerSummaryContent
                    groupedAlterationData={groupedAlterationData}
                    groupAlterationsBy={'cancerTypeDetailed'}
                    countAlterationsBy={'sampleCounts'}
                    gene={'NRAS'}
                    width={500}
                    handlePivotChange={() => {}}
                    handlePivotCountChange={() => {}}
                />
            );

            const instance = wrapper.instance() as CancerSummaryContent;

            instance.yAxis = 'abs-count';

            assert.deepEqual(
                instance.chartData.labels,
                [
                    'Colon Adenocarcinoma',
                    'Rectal Adenocarcinoma',
                    'Colorectal Adenocarcinoma',
                ],
                'Has all three group types in labels'
            );

            instance.tempAltCasesValue = 4;
            assert.deepEqual(
                instance.chartData.labels,
                ['Colon Adenocarcinoma', 'Rectal Adenocarcinoma'],
                'Filters out alt percentage lower than 5'
            );

            instance.tempAltCasesValue = 6;
            assert.deepEqual(
                instance.chartData.labels,
                ['Colon Adenocarcinoma'],
                'Filters out alt percentage lower than 6'
            );

            instance.tempAltCasesValue = 11;
            assert.deepEqual(instance.chartData.labels, [], 'Filters out all');
        });

        it('respects total sample threshold', () => {
            const wrapper = shallow(
                <CancerSummaryContent
                    groupedAlterationData={groupedAlterationData}
                    groupAlterationsBy={'cancerTypeDetailed'}
                    countAlterationsBy={'sampleCounts'}
                    gene={'NRAS'}
                    width={500}
                    handlePivotChange={() => {}}
                    handlePivotCountChange={() => {}}
                />
            );

            const instance = wrapper.instance() as CancerSummaryContent;
            assert.deepEqual(
                instance.chartData.labels,
                [
                    'Colon Adenocarcinoma',
                    'Rectal Adenocarcinoma',
                    'Colorectal Adenocarcinoma',
                ],
                'Has all three group types in labels'
            );

            instance.totalCasesValue = 24;
            assert.deepEqual(
                instance.chartData.labels,
                ['Colon Adenocarcinoma', 'Rectal Adenocarcinoma'],
                'Filters out total samples less than 24'
            );

            instance.totalCasesValue = 49;
            assert.deepEqual(
                instance.chartData.labels,
                ['Colon Adenocarcinoma'],
                'Filters out percentage lower than 49'
            );
        });

        it('applies label transformer', () => {
            const wrapper = shallow(
                <CancerSummaryContent
                    groupedAlterationData={groupedAlterationData}
                    groupAlterationsBy={'cancerTypeDetailed'}
                    countAlterationsBy={'sampleCounts'}
                    gene={'NRAS'}
                    labelTransformer={(t: string) => `|${t.toUpperCase()}|`}
                    width={500}
                    handlePivotChange={() => {}}
                    handlePivotCountChange={() => {}}
                />
            );

            const instance = wrapper.instance() as CancerSummaryContent;
            assert.equal(
                instance.chartData.labels[0],
                '|COLON ADENOCARCINOMA|',
                'Has all three group types in labels'
            );
        });
    });

    describe('determineSorterAndDirection', () => {
        it('sorting is default=desc and if x-axis, asc', () => {
            let ret = CancerSummaryContent.prototype.determineSorterAndDirection.apply(
                {}
            );
            assert.equal(ret.dir, 'desc');

            ret = CancerSummaryContent.prototype.determineSorterAndDirection.apply(
                { xAxis: 'x-axis' }
            );
            assert.equal(ret.dir, 'asc');
        });

        it('if sorting by xAxis, sort just returns input key', () => {
            const instance = {
                xAxis: 'x-axis',
            };
            let {
                sorter,
            } = CancerSummaryContent.prototype.determineSorterAndDirection.apply(
                instance
            );
            assert.equal(sorter('tree'), 'tree');
        });

        it('if NOT sorting by xAxis, sorter return either absolute count or percentage value depending on yAxis value', () => {
            const instance = {
                xAxis: 'whatever',
                yAxis: 'abs-count',
                countsData: {
                    test: {
                        alteredCount: 12,
                        profiledTotal: 50,
                    },
                },
            };
            let {
                sorter,
            } = CancerSummaryContent.prototype.determineSorterAndDirection.apply(
                instance
            );
            assert.equal(
                sorter('test'),
                12,
                'just returns alteredSample value'
            );

            instance.yAxis = 'someDefault';

            let {
                sorter: sorter2,
            } = CancerSummaryContent.prototype.determineSorterAndDirection.apply(
                instance
            );

            assert.equal(
                sorter2('test'),
                0.24,
                'returns alteration percentage of total'
            );
        });
    });
});
