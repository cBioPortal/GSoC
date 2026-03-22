import * as React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import {
    CancerCellFractionElementTooltip,
    default as CancerCellFractionElement,
    maxBarHeight,
} from 'shared/components/mutationTable/column/cancerCellFraction/CancerCellFractionElement';
import { getClonalCircleColor } from 'shared/components/mutationTable/column/clonal/ClonalElement';
import { ClonalValue } from 'shared/components/mutationTable/column/clonal/ClonalColumnFormatter';
import SampleManager from 'pages/patientView/SampleManager';

describe('CancerCellFractionElement', () => {
    // For single sample test (only text displayed)
    const validSingleSampleToCCFValue = {
        S001: '0.94',
    };

    // invalid sample will have 'NA' (check column formatter)
    const invalidSingleSampleToCCFValue = {
        S001: 'NA',
    };

    // For multi sample test (bar chart displayed)
    const invalidMultiSampleToCCFValue = {
        S001: 'NA',
        S002: 'NA',
        S003: 'NA',
    };

    // For multi sample test (bar chart displayed)
    const validMultiSampleToCCFValue = {
        S001: '.50',
        S002: 'NA',
        S003: '1.00',
    };

    const sampleToClonalValue = {
        S001: 'SUBCLONAL',
        S002: 'NA',
        S003: 'CLONAL',
    };

    const multiSampleSampleManager = new SampleManager(
        [
            { id: 'S001', clinicalData: [] },
            { id: 'S002', clinicalData: [] },
            { id: 'S003', clinicalData: [] },
        ],
        ['S001', 'S002', 'S003']
    );

    function getCancerCellFractionProps(multi: boolean, valid: boolean) {
        return {
            sampleIds: multi ? ['S001', 'S002', 'S003'] : ['S001'],
            sampleToClonalValue: sampleToClonalValue,
            sampleToCCFValue: multi
                ? valid
                    ? validMultiSampleToCCFValue
                    : invalidMultiSampleToCCFValue
                : valid
                ? validSingleSampleToCCFValue
                : invalidSingleSampleToCCFValue,
            sampleManager: multi ? multiSampleSampleManager : undefined,
        };
    }

    function testExpectedSingleSampleCCF(
        CCFWrapper: any,
        expectedText: string
    ) {
        expect(CCFWrapper.find('DefaultTooltip')).to.have.lengthOf(0);
        expect(CCFWrapper.find('CancerCellFractionBar')).to.have.lengthOf(0);
        expect(CCFWrapper.find('span').text()).to.equal(expectedText);
    }

    // test rectangle adds up to max height
    function testExpectedBarRectangle(
        barRectangle: any,
        expectedHeight: number,
        expectedY: number,
        clonalValue: ClonalValue
    ) {
        expect(barRectangle.height).to.equal(expectedHeight);
        expect(barRectangle.y).to.equal(expectedY);
        expect(barRectangle.fill).to.equal(getClonalCircleColor(clonalValue));
    }

    function testExpectedCancerCellFractionTooltip(
        cancerCellFractionColumn: any,
        sampleId: string,
        expectedCCFValue: string
    ) {
        const cancerCellFractionTooltip = mount(
            <CancerCellFractionElementTooltip
                {...(cancerCellFractionColumn.find('DefaultTooltip').props()
                    .overlay as any).props}
            />
        );
        expect(
            cancerCellFractionTooltip
                .findWhere(n => n.type() === 'span' && n.key() === sampleId)
                .text()
                .split(' ')[1]
        ).to.equal(expectedCCFValue);
    }

    it('renders correctly for valid single sample', () => {
        const validSingleSampleCancerCellFractionColumn = mount(
            <CancerCellFractionElement
                {...getCancerCellFractionProps(false, true)}
            />
        );
        testExpectedSingleSampleCCF(
            validSingleSampleCancerCellFractionColumn,
            '0.94'
        );
    });

    it('renders correctly for invalid single sample', () => {
        const invalidSingleSampleCancerCellFractionColumn = mount(
            <CancerCellFractionElement
                {...getCancerCellFractionProps(false, false)}
            />
        );
        testExpectedSingleSampleCCF(
            invalidSingleSampleCancerCellFractionColumn,
            'NA'
        );
    });

    it('renders bar chart w/ tooltip for multiple samples', () => {
        const multiSampleCancerCellFractionColumn = mount(
            <CancerCellFractionElement
                {...getCancerCellFractionProps(true, true)}
            />
        );
        let sampleToCCFBar: { [key: string]: any } = {};
        multiSampleCancerCellFractionColumn
            .find('CancerCellFractionBar')
            .forEach(node => {
                sampleToCCFBar[node.key()] = node;
            });

        testExpectedBarRectangle(
            sampleToCCFBar['S001'].find('rect').props(),
            maxBarHeight * 0.5,
            maxBarHeight - maxBarHeight * 0.5,
            ClonalValue.SUBCLONAL
        );
        testExpectedBarRectangle(
            sampleToCCFBar['S002'].find('rect').props(),
            0,
            maxBarHeight,
            ClonalValue.NA
        );
        testExpectedBarRectangle(
            sampleToCCFBar['S003'].find('rect').props(),
            maxBarHeight,
            0,
            ClonalValue.CLONAL
        );
        testExpectedCancerCellFractionTooltip(
            multiSampleCancerCellFractionColumn,
            'S001',
            '.50'
        );
        testExpectedCancerCellFractionTooltip(
            multiSampleCancerCellFractionColumn,
            'S002',
            'NA'
        );
        testExpectedCancerCellFractionTooltip(
            multiSampleCancerCellFractionColumn,
            'S003',
            '1.00'
        );
    });

    it('renders bar chart w/ tooltip for multiple invalid samples', () => {
        const multiSampleCancerCellFractionColumn = mount(
            <CancerCellFractionElement
                {...getCancerCellFractionProps(true, false)}
            />
        );
        let sampleToCCFBar: { [key: string]: any } = {};
        multiSampleCancerCellFractionColumn
            .find('CancerCellFractionBar')
            .forEach(node => {
                sampleToCCFBar[node.key()] = node;
            });

        // all NA samples still have rectangles created with 0 height
        testExpectedBarRectangle(
            sampleToCCFBar['S001'].find('rect').props(),
            0,
            maxBarHeight,
            ClonalValue.SUBCLONAL
        );
        testExpectedBarRectangle(
            sampleToCCFBar['S002'].find('rect').props(),
            0,
            maxBarHeight,
            ClonalValue.NA
        );
        testExpectedBarRectangle(
            sampleToCCFBar['S003'].find('rect').props(),
            0,
            maxBarHeight,
            ClonalValue.CLONAL
        );
        testExpectedCancerCellFractionTooltip(
            multiSampleCancerCellFractionColumn,
            'S001',
            'NA'
        );
        testExpectedCancerCellFractionTooltip(
            multiSampleCancerCellFractionColumn,
            'S002',
            'NA'
        );
        testExpectedCancerCellFractionTooltip(
            multiSampleCancerCellFractionColumn,
            'S003',
            'NA'
        );
    });

    const singleSampleSampleManager = new SampleManager(
        [{ id: 'S001', clinicalData: [] }],
        ['S001']
    );

    it('renders correctly for valid single sample with SampleManager', () => {
        const validSingleSampleWithManager = mount(
            <CancerCellFractionElement
                {...getCancerCellFractionProps(false, true)}
                sampleManager={singleSampleSampleManager}
            />
        );
        testExpectedSingleSampleCCF(validSingleSampleWithManager, '0.94');
    });
});
