import { assert } from 'chai';
import LastPlotsTabSelectionForDatatype from './LastPlotsTabSelectionForDatatype';
import {
    AxisMenuSelection,
    MutationCountBy,
    StructuralVariantCountBy,
} from './PlotsTab';
import sinon from 'sinon';

// couldn't figure out how to do this with sinon
function createFakeCallbacks() {
    return {
        gene: sinon.stub(),
        geneSet: sinon.stub(),
        source: sinon.stub(),
        genericAssay: sinon.stub(),
    };
}

// parts of AxisMenuSelection needed to make things compile that are not
// used in PlotsTabSelectionHistory
const untestedSelectionFields = {
    mutationCountBy: MutationCountBy.MutationType,
    structuralVariantCountBy: StructuralVariantCountBy.VariantType,
    logScale: false,
} as AxisMenuSelection;

describe('PlotsTabSelectionHistory', () => {
    describe('horizontal updates', () => {
        it('should update nothing when no changes have been made', () => {
            const subject = new LastPlotsTabSelectionForDatatype();
            const fakes = createFakeCallbacks();

            subject.runHorizontalUpdaters(
                'foo',
                fakes.gene,
                fakes.geneSet,
                fakes.source,
                fakes.genericAssay
            );

            assert.equal(fakes.gene.args.length, 0);
            assert.equal(fakes.geneSet.args.length, 0);
            assert.equal(fakes.source.args.length, 0);
            assert.equal(fakes.genericAssay.args.length, 0);
        });

        it('should update genes when changes have been made to genes', () => {
            const subject = new LastPlotsTabSelectionForDatatype();
            const fakes = createFakeCallbacks();
            const newSelection: AxisMenuSelection = {
                dataType: 'COPY_NUMBER_ALTERATION',
                selectedGeneOption: { value: 0, label: 'BRAF' },
                ...untestedSelectionFields,
            };

            subject.updateHorizontalFromSelection(newSelection);
            subject.runHorizontalUpdaters(
                'COPY_NUMBER_ALTERATION',
                fakes.gene,
                fakes.geneSet,
                fakes.source,
                fakes.genericAssay
            );

            assert.equal(fakes.gene.args.length, 1);
            assert.equal(fakes.geneSet.args.length, 0);
            assert.equal(fakes.source.args.length, 0);
            assert.equal(fakes.genericAssay.args.length, 0);

            assert.deepEqual(fakes.gene.args[0], [{ value: 0, label: 'BRAF' }]);
        });

        it('should update genesets when changes have been made to genesets', () => {
            const subject = new LastPlotsTabSelectionForDatatype();
            const fakes = createFakeCallbacks();
            const newSelection: AxisMenuSelection = {
                dataType: 'COPY_NUMBER_ALTERATION',
                selectedGenesetOption: { value: 'BRAF', label: 'BRAF' },
                ...untestedSelectionFields,
            };

            subject.updateHorizontalFromSelection(newSelection);
            subject.runHorizontalUpdaters(
                'COPY_NUMBER_ALTERATION',
                fakes.gene,
                fakes.geneSet,
                fakes.source,
                fakes.genericAssay
            );

            assert.equal(fakes.gene.args.length, 0);
            assert.equal(fakes.geneSet.args.length, 1);
            assert.equal(fakes.source.args.length, 0);
            assert.equal(fakes.genericAssay.args.length, 0);

            assert.deepEqual(fakes.geneSet.args[0], [
                { value: 'BRAF', label: 'BRAF' },
            ]);
        });

        it('should update source when changes have been made to source', () => {
            const subject = new LastPlotsTabSelectionForDatatype();
            const fakes = createFakeCallbacks();
            const newSelection: AxisMenuSelection = {
                dataType: 'COPY_NUMBER_ALTERATION',
                selectedDataSourceOption: {
                    value: 'coadread_tcga_pub_gistic',
                    label: 'Putative copy-number alterations from GISTIC',
                },
                ...untestedSelectionFields,
            };

            subject.updateHorizontalFromSelection(newSelection);
            subject.runHorizontalUpdaters(
                'COPY_NUMBER_ALTERATION',
                fakes.gene,
                fakes.geneSet,
                fakes.source,
                fakes.genericAssay
            );

            assert.equal(fakes.gene.args.length, 0);
            assert.equal(fakes.geneSet.args.length, 0);
            assert.equal(fakes.source.args.length, 1);
            assert.equal(fakes.genericAssay.args.length, 0);

            assert.deepEqual(fakes.source.args[0], [
                {
                    value: 'coadread_tcga_pub_gistic',
                    label: 'Putative copy-number alterations from GISTIC',
                },
            ]);
        });

        it('should update generic assay entities when changes have been made to generic assay', () => {
            const subject = new LastPlotsTabSelectionForDatatype();
            const fakes = createFakeCallbacks();
            const newSelection: AxisMenuSelection = {
                dataType: 'COPY_NUMBER_ALTERATION',
                selectedGenericAssayOption: {
                    value: 'test value',
                    label: 'test label',
                },
                ...untestedSelectionFields,
            };

            subject.updateHorizontalFromSelection(newSelection);
            subject.runHorizontalUpdaters(
                'COPY_NUMBER_ALTERATION',
                fakes.gene,
                fakes.geneSet,
                fakes.source,
                fakes.genericAssay
            );

            assert.equal(fakes.gene.args.length, 0);
            assert.equal(fakes.geneSet.args.length, 0);
            assert.equal(fakes.source.args.length, 0);
            assert.equal(fakes.genericAssay.args.length, 1);

            assert.deepEqual(fakes.genericAssay.args[0], [
                { value: 'test value', label: 'test label' },
            ]);
        });
    });

    describe('vertical updates', () => {
        it('should update all the vertical fields', () => {
            const subject = new LastPlotsTabSelectionForDatatype();
            const fakes = createFakeCallbacks();
            const newSelection: AxisMenuSelection = {
                dataType: 'COPY_NUMBER_ALTERATION',
                selectedGeneOption: {
                    value: 0,
                    label: 'BRAF',
                },
                selectedGenesetOption: {
                    value: 'BRAF',
                    label: 'BRAF',
                },
                selectedDataSourceOption: {
                    value: 'coadread_tcga_pub_gistic',
                    label: 'Putative copy-number alterations from GISTIC',
                },
                selectedGenericAssayOption: {
                    value: 'test value',
                    label: 'test label',
                },
                ...untestedSelectionFields,
            };

            subject.updateHorizontalFromSelection(newSelection);
            subject.runHorizontalUpdaters(
                'COPY_NUMBER_ALTERATION',
                fakes.gene,
                fakes.geneSet,
                fakes.source,
                fakes.genericAssay
            );

            assert.equal(fakes.gene.args.length, 1);
            assert.equal(fakes.geneSet.args.length, 1);
            assert.equal(fakes.source.args.length, 1);
            assert.equal(fakes.genericAssay.args.length, 1);

            assert.deepEqual(fakes.gene.args[0], [{ value: 0, label: 'BRAF' }]);
            assert.deepEqual(fakes.geneSet.args[0], [
                { value: 'BRAF', label: 'BRAF' },
            ]);
            assert.deepEqual(fakes.source.args[0], [
                {
                    value: 'coadread_tcga_pub_gistic',
                    label: 'Putative copy-number alterations from GISTIC',
                },
            ]);
            assert.deepEqual(fakes.genericAssay.args[0], [
                { value: 'test value', label: 'test label' },
            ]);
        });
    });
});
