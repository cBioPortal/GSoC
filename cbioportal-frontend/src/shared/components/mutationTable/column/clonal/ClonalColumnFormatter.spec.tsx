import { mount, ReactWrapper } from 'enzyme';
import { assert } from 'chai';
import { initMutation } from 'test/MutationMockUtils';
import {
    ClonalValue,
    getDefaultClonalColumnDefinition,
} from './ClonalColumnFormatter';
import { Mutation } from 'cbioportal-ts-api-client';

describe('ClonalColumnFormatter', () => {
    function testExpectedClonalElementProperties(
        clonalElementProperties: any,
        expectedSampleId: string,
        expectedClonalValue: string,
        expectedCCFExpectedCopies: string
    ) {
        assert.equal(clonalElementProperties['sampleId'], expectedSampleId);
        assert.equal(
            clonalElementProperties['clonalValue'],
            expectedClonalValue
        );
        assert.equal(
            clonalElementProperties['ccfExpectedCopies'],
            expectedCCFExpectedCopies
        );
    }

    function testExpectedNumberOfClonalElements(
        columnCell: ReactWrapper<any, any>,
        expectedNumber: number
    ) {
        assert.equal(
            columnCell.find('ClonalElement').length,
            expectedNumber,
            'Does not match expected number of ClonalElement(s)'
        );
    }

    // backend API currently does not include ASCN fields if no data available
    // completely drops data member, instead of returning default "null"/"" value
    function createEmptyMutation() {
        let emptyMutation: Mutation = initMutation({
            sampleId: 'S004',
            alleleSpecificCopyNumber: {
                totalCopyNumber: 2,
                minorCopyNumber: 1,
            },
        });
        delete (emptyMutation.alleleSpecificCopyNumber as Partial<
            Mutation['alleleSpecificCopyNumber']
        >).clonal;
        delete (emptyMutation.alleleSpecificCopyNumber as Partial<
            Mutation['alleleSpecificCopyNumber']
        >).ccfExpectedCopies;
        delete (emptyMutation as Partial<Mutation>).alleleSpecificCopyNumber;
        return emptyMutation;
    }

    const mutations: Mutation[] = [
        // Clonal case
        initMutation({
            sampleId: 'S001',
            alleleSpecificCopyNumber: {
                ccfExpectedCopies: 1,
                clonal: 'CLONAL',
            },
        }),
        // Subclonal case
        initMutation({
            sampleId: 'S002',
            alleleSpecificCopyNumber: {
                ccfExpectedCopies: 0.85,
                clonal: 'SUBCLONAL',
            },
        }),
        // Indeterminate case
        initMutation({
            sampleId: 'S003',
            alleleSpecificCopyNumber: {
                ccfExpectedCopies: 0.55,
                clonal: 'INDETERMINATE',
            },
        }),
        // Clonal NA case
        // Clonal NA case
        createEmptyMutation(),
    ];

    let clonalColumnTest: ReactWrapper<any, any>;
    let clonalNoComponent: ReactWrapper<any, any>;

    it('has expected number of ClonalElement components', () => {
        clonalColumnTest = mount(
            getDefaultClonalColumnDefinition(
                ['S001', 'S002', 'S003'],
                null
            ).render(mutations)
        );
        testExpectedNumberOfClonalElements(clonalColumnTest, 3);

        clonalColumnTest = mount(
            getDefaultClonalColumnDefinition().render(mutations)
        );
        testExpectedNumberOfClonalElements(clonalColumnTest, 1);
    });

    it('generated ClonalElement componenets use correct property values', () => {
        clonalColumnTest = mount(
            getDefaultClonalColumnDefinition(
                ['S001', 'S002', 'S003', 'S004'],
                null
            ).render(mutations)
        );

        let sampleToClonalElement: { [key: string]: any } = {};
        clonalColumnTest.find('ClonalElement').forEach(node => {
            var sampleIdProp: string = node.prop('sampleId');
            sampleToClonalElement[sampleIdProp] = node.props();
        });

        testExpectedClonalElementProperties(
            sampleToClonalElement['S001'],
            'S001',
            ClonalValue.CLONAL,
            '1'
        );
        testExpectedClonalElementProperties(
            sampleToClonalElement['S002'],
            'S002',
            ClonalValue.SUBCLONAL,
            '0.85'
        );
        testExpectedClonalElementProperties(
            sampleToClonalElement['S003'],
            'S003',
            ClonalValue.INDETERMINATE,
            '0.55'
        );
        testExpectedClonalElementProperties(
            sampleToClonalElement['S004'],
            'S004',
            ClonalValue.NA,
            'NA'
        );
    });
});
