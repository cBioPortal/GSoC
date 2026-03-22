import VariantTypeColumnFormatter from './VariantTypeColumnFormatter';
import { initMutation } from 'test/MutationMockUtils';
import React from 'react';
import { assert } from 'chai';
import Enzyme from 'enzyme';

describe('VariantTypeColumnFormatter', () => {
    const snpVariant = initMutation({
        variantType: 'SNP',
    });

    const snpLowerCaseVariant = initMutation({
        variantType: 'snp',
    });

    const dnpVariant = initMutation({
        variantType: 'DNP',
    });

    const insVariant = initMutation({
        variantType: 'INS',
    });

    const delVariant = initMutation({
        variantType: 'DEL',
    });

    const otherVariant = initMutation({
        variantType: 'other_unknown',
    });

    it('test display value', () => {
        let mutationList = [snpVariant];
        let displayValue = VariantTypeColumnFormatter.getDisplayValue(
            mutationList
        );
        assert.equal(displayValue, 'SNP');

        //  snp should be changed to SNP
        mutationList = [snpLowerCaseVariant];
        displayValue = VariantTypeColumnFormatter.getDisplayValue(mutationList);
        assert.equal(displayValue, 'SNP');

        mutationList = [insVariant];
        displayValue = VariantTypeColumnFormatter.getDisplayValue(mutationList);
        assert.equal(displayValue, 'INS');

        // if we have a non-standard variant type, it should be displayed as is
        // but as upper-case
        mutationList = [otherVariant];
        displayValue = VariantTypeColumnFormatter.getDisplayValue(mutationList);
        assert.equal(displayValue, 'OTHER_UNKNOWN');
    });

    it('test tooltip content', () => {
        let mutationList = [snpVariant];
        let toolTip = VariantTypeColumnFormatter.getTooltip(mutationList);
        assert.equal(
            toolTip,
            VariantTypeColumnFormatter.MAIN_VARIANT_TYPE_MAP.SNP.toolTip
        );

        mutationList = [snpLowerCaseVariant];
        toolTip = VariantTypeColumnFormatter.getTooltip(mutationList);
        assert.equal(
            toolTip,
            VariantTypeColumnFormatter.MAIN_VARIANT_TYPE_MAP.SNP.toolTip
        );

        mutationList = [insVariant];
        toolTip = VariantTypeColumnFormatter.getTooltip(mutationList);
        assert.equal(
            toolTip,
            VariantTypeColumnFormatter.MAIN_VARIANT_TYPE_MAP.INS.toolTip
        );

        //  non-standard variant types do not have tooltips
        mutationList = [otherVariant];
        toolTip = VariantTypeColumnFormatter.getTooltip(mutationList);
        assert.equal(toolTip, undefined);
    });

    it('test style classes', () => {
        let mutationList = [snpVariant];
        let className = VariantTypeColumnFormatter.getClassName(mutationList);
        assert.equal(
            className,
            VariantTypeColumnFormatter.MAIN_VARIANT_TYPE_MAP.SNP.className
        );

        mutationList = [snpLowerCaseVariant];
        className = VariantTypeColumnFormatter.getClassName(mutationList);
        assert.equal(
            className,
            VariantTypeColumnFormatter.MAIN_VARIANT_TYPE_MAP.SNP.className
        );

        mutationList = [insVariant];
        className = VariantTypeColumnFormatter.getClassName(mutationList);
        assert.equal(
            className,
            VariantTypeColumnFormatter.MAIN_VARIANT_TYPE_MAP.INS.className
        );

        mutationList = [otherVariant];
        className = VariantTypeColumnFormatter.getClassName(mutationList);
        assert.equal(
            className,
            VariantTypeColumnFormatter.MAIN_VARIANT_TYPE_MAP.OTHER.className
        );
    });
});
