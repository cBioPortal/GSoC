import * as React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import { getDefaultCancerCellFractionColumnDefinition } from './CancerCellFractionColumnFormatter';
import CancerCellFractionElement from 'shared/components/mutationTable/column/cancerCellFraction/CancerCellFractionElement';
import SampleManager from 'pages/patientView/SampleManager';
import { initMutation } from 'test/MutationMockUtils';
import { Mutation } from 'cbioportal-ts-api-client';

describe('CancerCellFractionColumnFormatter', () => {
    function createMutationWithoutASCN() {
        let mutationWithoutASCN = initMutation({
            sampleId: 'S003',
        });
        delete (mutationWithoutASCN as Partial<Mutation>)
            .alleleSpecificCopyNumber;
        return mutationWithoutASCN;
    }

    function createMutationWithoutCCF() {
        let mutationWithoutCCF = initMutation({
            sampleId: 'S002',
        });
        delete (mutationWithoutCCF.alleleSpecificCopyNumber as Partial<
            Mutation['alleleSpecificCopyNumber']
        >).ccfExpectedCopies;
        return mutationWithoutCCF;
    }

    function createMutation(sampleIdVal: string, ccfExpectedCopiesVal: number) {
        const mutationWithCCF = initMutation({
            sampleId: sampleIdVal,
            alleleSpecificCopyNumber: {
                ccfExpectedCopies: ccfExpectedCopiesVal,
            },
        });
        return mutationWithCCF;
    }

    function testExpectedCancerCellFractionElement(
        cancerCellFractionElement: any,
        expectedSampleIds: string[],
        expectedSampleToCCFValue: { [key: string]: string }
    ) {
        expect(cancerCellFractionElement.prop('sampleIds')).to.deep.equal(
            expectedSampleIds
        );
        expect(
            cancerCellFractionElement.prop('sampleToCCFValue')
        ).to.deep.equal(expectedSampleToCCFValue);
    }

    // no SampleManager, single sample
    it('generates CancerCellFractionElement for single valid sample with right properties', () => {
        const validSingleSampleCCFColumn = mount(
            getDefaultCancerCellFractionColumnDefinition().render([
                createMutation('S001', 0.75),
            ])
        );
        testExpectedCancerCellFractionElement(
            validSingleSampleCCFColumn.find('CancerCellFractionElement'),
            ['S001'],
            { S001: '0.75' }
        );
        expect(
            validSingleSampleCCFColumn.find('DefaultTooltip')
        ).to.have.lengthOf(0);
    });

    // SampleManager, multiple samples
    it('generates CancerCellFractionElement for multiple valid samples with right properties', () => {
        const validMultiSampleCCFColumn = mount(
            getDefaultCancerCellFractionColumnDefinition(
                ['S001', 'S002'],
                new SampleManager([], [])
            ).render([createMutation('S001', 0.75), createMutation('S002', 1)])
        );
        testExpectedCancerCellFractionElement(
            validMultiSampleCCFColumn.find('CancerCellFractionElement'),
            ['S001', 'S002'],
            { S001: '0.75', S002: '1.00' }
        );
        expect(
            validMultiSampleCCFColumn.find('DefaultTooltip')
        ).to.have.lengthOf(1);
    });

    // make sure NA generated for samples missing CCF or ASCN values
    it('generates CancerCellFractionElement for invalid and valid samples with right properties', () => {
        const validMultiSampleCCFColumn = mount(
            getDefaultCancerCellFractionColumnDefinition(
                ['S001', 'S002', 'S003'],
                new SampleManager([], [])
            ).render([
                createMutationWithoutASCN(),
                createMutationWithoutCCF(),
                createMutation('S001', 0.75),
            ])
        );
        testExpectedCancerCellFractionElement(
            validMultiSampleCCFColumn.find('CancerCellFractionElement'),
            ['S001', 'S002', 'S003'],
            { S001: '0.75', S002: 'NA', S003: 'NA' }
        );
        expect(
            validMultiSampleCCFColumn.find('DefaultTooltip')
        ).to.have.lengthOf(1);
    });
});
