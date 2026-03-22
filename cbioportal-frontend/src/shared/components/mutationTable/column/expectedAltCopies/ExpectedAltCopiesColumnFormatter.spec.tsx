import { mount, ReactWrapper } from 'enzyme';
import { expect } from 'chai';
import { initMutation } from 'test/MutationMockUtils';
import { getDefaultExpectedAltCopiesColumnDefinition } from './ExpectedAltCopiesColumnFormatter';
import { AlleleSpecificCopyNumber, Mutation } from 'cbioportal-ts-api-client';

describe('ExpectedAltCopiesColumnFormatter', () => {
    function testExpectedExpectedAltCopiesElementProperties(
        expectedAltCopiesElementProperties: any,
        expectedSampleId: string,
        expectedTotalCopyNumberValue: string,
        expectedExpectedAltCopiesValue: string
    ) {
        expect(expectedAltCopiesElementProperties['sampleId']).to.equal(
            expectedSampleId
        );
        expect(
            expectedAltCopiesElementProperties['totalCopyNumberValue']
        ).to.equal(expectedTotalCopyNumberValue);
        expect(
            expectedAltCopiesElementProperties['expectedAltCopiesValue']
        ).to.equal(expectedExpectedAltCopiesValue);
    }

    function testExpectedNumberOfExpectedAltCopiesElements(
        columnCell: ReactWrapper<any, any>,
        expectedNumber: number
    ) {
        expect(columnCell.find('ExpectedAltCopiesElement')).to.have.length(
            expectedNumber
        );
    }

    // backend API currently does not include ASCN fields if no data available
    // completely drops data member, instead of returning default "null"/"" value
    function createMutationWithMissingData(
        sampleId: string,
        missingFields: string[]
    ) {
        let emptyMutation: Mutation = initMutation({
            sampleId: sampleId,
            alleleSpecificCopyNumber: {
                totalCopyNumber: 2,
                expectedAltCopies: 1,
            },
        });
        if (
            missingFields.length === 1 &&
            missingFields[0] === 'alleleSpecificCopyNumber'
        ) {
            delete emptyMutation[missingFields[0] as keyof Mutation];
        } else {
            for (let i = 0; i < missingFields.length; i++) {
                delete emptyMutation.alleleSpecificCopyNumber[
                    missingFields[i] as keyof AlleleSpecificCopyNumber
                ];
            }
        }
        return emptyMutation;
    }

    // one valid, one missing tcn, one missing expectedAltCopies, one w/o ASCN
    const mutations: Mutation[] = [
        // ExpectedAltCopies 'yes' case
        initMutation({
            sampleId: 'S001',
            alleleSpecificCopyNumber: {
                totalCopyNumber: 4,
                expectedAltCopies: 1,
            },
        }),
        // missing total copy number
        createMutationWithMissingData('S002', ['totalCopyNumber']),
        initMutation({
            sampleId: 'S003',
            alleleSpecificCopyNumber: {
                totalCopyNumber: 3,
                expectedAltCopies: 2,
            },
        }),
        initMutation({
            sampleId: 'S004',
            alleleSpecificCopyNumber: {
                totalCopyNumber: 2,
                expectedAltCopies: 1,
            },
        }),
        // missing expected alt copies
        createMutationWithMissingData('S005', ['expectedAltCopies']),
        // no ascn data at all
        createMutationWithMissingData('S006', ['alleleSpecificCopyNumber']),
    ];

    it('has expected number of ExpectedAltCopiesElement components', () => {
        // only mutations with tcn/expectedAltCopies available map to an element
        let expectedAltCopiesColumnTest = mount(
            getDefaultExpectedAltCopiesColumnDefinition(
                ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'],
                null
            ).render(mutations)
        );
        testExpectedNumberOfExpectedAltCopiesElements(
            expectedAltCopiesColumnTest,
            6
        );

        expectedAltCopiesColumnTest = mount(
            getDefaultExpectedAltCopiesColumnDefinition().render(mutations)
        );
        testExpectedNumberOfExpectedAltCopiesElements(
            expectedAltCopiesColumnTest,
            1
        );

        // nothing returned for single NA one
        expectedAltCopiesColumnTest = mount(
            getDefaultExpectedAltCopiesColumnDefinition().render([
                createMutationWithMissingData('S001', [
                    'alleleSpecificCopyNumber',
                ]),
            ])
        );
        testExpectedNumberOfExpectedAltCopiesElements(
            expectedAltCopiesColumnTest,
            1
        );
    });

    it('generated ExpectedAltCopiesElement components use correct property values', () => {
        let expectedAltCopiesColumnTest = mount(
            getDefaultExpectedAltCopiesColumnDefinition(
                ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'],
                null
            ).render(mutations)
        );

        let sampleToExpectedAltCopiesElement: { [key: string]: any } = {};
        expectedAltCopiesColumnTest
            .find('ExpectedAltCopiesElement')
            .forEach(node => {
                var sampleIdProp: string = node.prop('sampleId');
                sampleToExpectedAltCopiesElement[sampleIdProp] = node.props();
            });

        testExpectedExpectedAltCopiesElementProperties(
            sampleToExpectedAltCopiesElement['S001'],
            'S001',
            '4',
            '1'
        );
        testExpectedExpectedAltCopiesElementProperties(
            sampleToExpectedAltCopiesElement['S002'],
            'S002',
            'INDETERMINATE',
            '1'
        );
        testExpectedExpectedAltCopiesElementProperties(
            sampleToExpectedAltCopiesElement['S003'],
            'S003',
            '3',
            '2'
        );
        testExpectedExpectedAltCopiesElementProperties(
            sampleToExpectedAltCopiesElement['S004'],
            'S004',
            '2',
            '1'
        );
        testExpectedExpectedAltCopiesElementProperties(
            sampleToExpectedAltCopiesElement['S005'],
            'S005',
            '2',
            'INDETERMINATE'
        );
        testExpectedExpectedAltCopiesElementProperties(
            sampleToExpectedAltCopiesElement['S006'],
            'S006',
            'NA',
            'NA'
        );
    });
});
