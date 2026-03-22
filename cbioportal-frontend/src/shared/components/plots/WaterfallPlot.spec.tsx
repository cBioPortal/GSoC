// need to mock this module to prevent circular references from breaking the tests
jest.mock('shared/components/plots/PlotsTab.tsx');

import React from 'react';
import { assert } from 'chai';
import { IBaseWaterfallPlotData, IWaterfallPlotProps } from './WaterfallPlot';
import WaterfallPlot from 'shared/components/plots/WaterfallPlot';

describe('WaterfallPlot', () => {
    let testData: IBaseWaterfallPlotData[] = [{ value: 2 }, { value: 4 }];
    let testProps: IWaterfallPlotProps<IBaseWaterfallPlotData> = {
        data: testData,
        chartWidth: 600,
        chartHeight: 400,
        horizontal: true,
        sortOrder: 'ASC',
    };
    let plot: WaterfallPlot<IBaseWaterfallPlotData> = new WaterfallPlot<
        IBaseWaterfallPlotData
    >(testProps);

    beforeEach(() => {
        testProps = {
            data: testData,
            chartWidth: 600,
            chartHeight: 400,
            horizontal: true,
            sortOrder: 'ASC',
        };

        testData = [{ value: 2 }, { value: 4 }];

        plot = new WaterfallPlot<IBaseWaterfallPlotData>(testProps);
    });

    describe('#waterfallPlotData', () => {
        it('Datum has internally computed field', () => {
            const datum = plot.waterfallPlotData[0];
            assert.isDefined(datum.order);
        });

        it('Sort order parameter controls ordering of data', () => {
            // test "ASC" and horizontal is false
            testProps.horizontal = false;
            let datum1 = plot.waterfallPlotData[0];
            let datum2 = plot.waterfallPlotData[1];
            assert.equal(datum1.order, 1);
            assert.equal(datum1.value, 2);
            assert.equal(datum2.order, 2);
            assert.equal(datum2.value, 4);

            // test "DESC" and horizontal is false
            testProps.sortOrder = 'DESC';
            plot = new WaterfallPlot<IBaseWaterfallPlotData>(testProps);

            datum1 = plot.waterfallPlotData[0];
            datum2 = plot.waterfallPlotData[1];
            assert.equal(datum1.order, 1);
            assert.equal(datum1.value, 4);
            assert.equal(datum2.order, 2);
            assert.equal(datum2.value, 2);

            // test "ASC" and horizontal is true
            testProps.horizontal = true;
            testProps.sortOrder = 'ASC';
            plot = new WaterfallPlot<IBaseWaterfallPlotData>(testProps);

            datum1 = plot.waterfallPlotData[0];
            datum2 = plot.waterfallPlotData[1];
            assert.equal(datum1.order, 1);
            assert.equal(datum1.value, 4);
            assert.equal(datum2.order, 2);
            assert.equal(datum2.value, 2);

            // test "DESC" and horizontal is true
            testProps.sortOrder = 'DESC';
            plot = new WaterfallPlot<IBaseWaterfallPlotData>(testProps);

            datum1 = plot.waterfallPlotData[0];
            datum2 = plot.waterfallPlotData[1];
            assert.equal(datum1.order, 1);
            assert.equal(datum1.value, 2);
            assert.equal(datum2.order, 2);
            assert.equal(datum2.value, 4);
        });
    });

    describe('#styledWaterfallPlotData', () => {
        it('Datum has styling info when passed to component', () => {
            testProps.fill = 'test';
            testProps.stroke = 'test';
            testProps.strokeOpacity = 1;
            testProps.strokeWidth = 1;
            testProps.symbol = 'test';

            plot = new WaterfallPlot<IBaseWaterfallPlotData>(testProps);
            const datum = plot.styledWaterfallPlotData[0];

            assert.isDefined(datum.fill);
            assert.isDefined(datum.stroke);
            assert.isDefined(datum.strokeOpacity);
            assert.isDefined(datum.strokeWidth);
            assert.isDefined(datum.symbol);
        });
    });

    describe('#plotDomain', () => {
        it('Has correct x dimensions', () => {
            const domain = plot.plotDomain;
            assert.equal(domain.order[0], 1);
            assert.equal(domain.order[1], 2);
        });
        it('Has correct y dimensions', () => {
            const domain = plot.plotDomain;
            assert.equal(domain.value[0], 2);
            assert.equal(domain.value[1], 4);
        });
    });

    describe('Search indicators', () => {
        it('Absent when no highlight param passed', () => {
            testProps.highlight = undefined;
            assert.equal(plot.searchLabels.length, 0);
        });

        it('Absent when no samples match', () => {
            testProps.highlight = d => false;
            assert.equal(plot.searchLabels.length, 0);
        });

        it('Present when search function is passed', () => {
            testProps.highlight = d => true;
            assert.equal(plot.searchLabels.length, 2);
        });

        it('Present when search function is passed', () => {
            testProps.highlight = d => true;
            assert.equal(plot.searchLabels.length, 2);
        });

        it('Search label data points have x/y coordinates', () => {
            testProps.highlight = d => true;
            assert.isDefined(plot.searchLabels[0].searchindicatorx);
            assert.isDefined(plot.searchLabels[0].searchindicatory);
        });
    });

    describe('Limit value indicators', () => {
        it('Absent when labelVisibility param not passed', () => {
            testProps.labelVisibility = undefined;
            plot = new WaterfallPlot<IBaseWaterfallPlotData>(testProps);
            assert.equal(plot.limitLabels.length, 0);
        });

        it('Absent when no datapoints are limited', () => {
            testProps.labelVisibility = () => false;
            plot = new WaterfallPlot<IBaseWaterfallPlotData>(testProps);
            assert.equal(plot.limitLabels.length, 0);
        });

        it('Present when datapoints are limited', () => {
            testProps.labelVisibility = () => true;
            plot = new WaterfallPlot<IBaseWaterfallPlotData>(testProps);
            assert.equal(plot.limitLabels.length, 2);
        });

        it('Limit vlaue label data points have x/y coordinates', () => {
            testProps.labelVisibility = () => true;
            plot = new WaterfallPlot<IBaseWaterfallPlotData>(testProps);
            assert.isDefined(plot.limitLabels[0].labelx);
            assert.isDefined(plot.limitLabels[0].labely);
        });
    });
});
