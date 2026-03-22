import { mount } from 'enzyme';
import * as React from 'react';
import { assert } from 'chai';
import { ClonalValue } from './ClonalColumnFormatter';
import {
    ClonalColor,
    ClonalElementTooltip,
    default as ClonalElement,
} from './ClonalElement';

describe('ClonalElement', () => {
    const clonal = {
        sampleId: 'S001',
        clonalValue: ClonalValue.CLONAL,
        ccfExpectedCopies: '1',
    };

    const subclonal = {
        sampleId: 'S002',
        clonalValue: ClonalValue.SUBCLONAL,
        ccfExpectedCopies: '0.85',
    };

    const indeterminate = {
        sampleId: 'S003',
        clonalValue: ClonalValue.INDETERMINATE,
        ccfExpectedCopies: 'NA',
    };

    const na = {
        sampleId: 'S004',
        clonalValue: ClonalValue.NA,
        ccfExpectedCopies: 'NA',
    };

    function testExpectedValidClonalElement(
        componentProperties: any,
        expectedCircleColor: string,
        expectedTextColor: string
    ) {
        // check main icon is right color given a clonalValue
        const validClonalElementTest = mount(
            <ClonalElement {...componentProperties} />
        );
        assert.equal(
            validClonalElementTest.find('circle').prop('fill'),
            expectedCircleColor
        );

        // check props are correctly passed to tooltip
        const clonalElementTooltipTest = mount(
            <ClonalElementTooltip
                {...(validClonalElementTest
                    .find('DefaultTooltip')
                    .prop('overlay') as any).props}
            />
        );

        // get individual divs in tooltip
        const clonalDiv = clonalElementTooltipTest.findWhere(
            n =>
                n.type() === 'div' &&
                n
                    .render()
                    .children('span')
                    .text() === 'Clonal'
        );

        const ccfDiv = clonalElementTooltipTest.findWhere(
            n =>
                n.type() === 'div' &&
                n
                    .render()
                    .children('span')
                    .text() === 'CCF'
        );

        // check clonal text is same color as circle && correct text values are used
        assert.isTrue(clonalDiv.exists() && ccfDiv.exists());
        assert.equal(
            (clonalDiv.find('strong').prop('style') as any).color,
            expectedTextColor
        );
        assert.equal(
            clonalDiv.find('strong').text(),
            componentProperties['clonalValue'].toLowerCase()
        );
        assert.equal(
            ccfDiv.find('strong').text(),
            componentProperties['ccfExpectedCopies']
        );
    }

    function testExpectedInvalidClonalElement(
        componentProperties: any,
        expectedColor: string
    ) {
        const invalidClonalElementTest = mount(
            <ClonalElement {...componentProperties} />
        );
        assert.isTrue(
            invalidClonalElementTest.find('circle').prop('opacity') === 0
        );

        assert.isTrue(
            !invalidClonalElementTest.find('DefaultTooltip').exists()
        );
    }

    it('generates black circle with tooltip for clonal', () => {
        testExpectedValidClonalElement(
            clonal,
            ClonalColor.BLACK,
            ClonalColor.BLACK
        );
    });

    it('generates striped circle with tooltip for subclonal', () => {
        testExpectedValidClonalElement(
            subclonal,
            ClonalColor.STRIPED,
            ClonalColor.BLACK
        );
    });

    it('generates lightgrey circle with tooltip for indeterminate', () => {
        testExpectedValidClonalElement(
            indeterminate,
            ClonalColor.LIGHTGREY,
            ClonalColor.LIGHTGREY
        );
    });

    it('generates invisible circle with no tooltip for clonal NA', () => {
        testExpectedInvalidClonalElement(na, ClonalColor.LIGHTGREY);
    });
});
