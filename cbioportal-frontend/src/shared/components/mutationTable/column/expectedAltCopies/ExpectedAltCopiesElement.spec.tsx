import * as React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import {
    default as ExpectedAltCopiesElement,
    ExpectedAltCopiesColor,
    ExpectedAltCopiesElementTooltip,
} from './ExpectedAltCopiesElement';

describe('ExpectedAltCopiesElement', () => {
    function getExpectedAltCopiesProps(
        sampleId: string,
        totalCopyNumberValue: string,
        expectedAltCopiesValue: string
    ) {
        return {
            sampleId: sampleId,
            totalCopyNumberValue: totalCopyNumberValue,
            expectedAltCopiesValue: expectedAltCopiesValue,
            sampleManager: undefined,
        };
    }

    function testExpectedAltCopiesElementTooltip(
        expectedAltCopiesElement: any
    ) {
        let expectedAltCopiesElementTooltip = mount(
            <ExpectedAltCopiesElementTooltip
                {...(expectedAltCopiesElement.find('DefaultTooltip').props()
                    .overlay as any).props}
            />
        );
        expect(
            expectedAltCopiesElementTooltip
                .find('span span')
                .findWhere(
                    node =>
                        node.text() ==
                        ' 2 out of 4 copies of this gene are mutated.'
                )
        ).to.have.lengthOf(2);
    }

    function testExpectedIndeterminateAltCopiesElementTooltip(
        expectedAltCopiesElement: any
    ) {
        let expectedAltCopiesElementTooltip = mount(
            <ExpectedAltCopiesElementTooltip
                {...(expectedAltCopiesElement.find('DefaultTooltip').props()
                    .overlay as any).props}
            />
        );
        expect(
            expectedAltCopiesElementTooltip
                .find('span span')
                .findWhere(node => node.text() == 'Indeterminate sample')
        ).to.have.lengthOf(2);
    }

    it('generates ExpectedAltCopiesElement with Tooltip', () => {
        // only mutations with tcn/expectedAltCopies available map to an element
        let expectedAltCopiesElementTest = mount(
            <ExpectedAltCopiesElement
                {...getExpectedAltCopiesProps('S001', '4', '2')}
            />
        );
        expect(expectedAltCopiesElementTest.find('text').text()).to.equal('2');
        expect(expectedAltCopiesElementTest.find('rect').prop('fill')).to.equal(
            ExpectedAltCopiesColor.WHITE
        );
        testExpectedAltCopiesElementTooltip(expectedAltCopiesElementTest);
    });

    it('generates indeterminate ExpectedAltCopiesElement with Tooltip', () => {
        // only mutations with tcn/expectedAltCopies available map to an element
        let expectedAltCopiesElementTest = mount(
            <ExpectedAltCopiesElement
                {...getExpectedAltCopiesProps('S001', '3', 'INDETERMINATE')}
            />
        );
        expect(expectedAltCopiesElementTest.find('text').text()).to.equal('-');
        expect(expectedAltCopiesElementTest.find('rect').prop('fill')).to.equal(
            ExpectedAltCopiesColor.LIGHTGREY
        );
        testExpectedIndeterminateAltCopiesElementTooltip(
            expectedAltCopiesElementTest
        );
    });
});
