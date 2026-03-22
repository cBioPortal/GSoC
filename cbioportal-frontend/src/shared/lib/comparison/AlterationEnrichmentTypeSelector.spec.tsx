import React from 'react';
import AlterationEnrichmentTypeSelector from 'shared/lib/comparison/AlterationEnrichmentTypeSelector';
import ComparisonStore from 'shared/lib/comparison/ComparisonStore';
import { mountWithCustomWrappers } from 'enzyme-custom-wrappers';
import { assert, expect } from 'chai';
import _ from 'lodash';
import sinon from 'sinon';
import {
    cnaEventTypeSelectInit,
    mutationEventTypeSelectInit,
} from './ComparisonStoreUtils';
import { MolecularProfile } from 'cbioportal-ts-api-client';

describe('AlterationEnrichmentTypeSelector', () => {
    let menu: any;
    const updateSelectedEnrichmentEventTypes = sinon.spy();

    const inframeCheckboxRefs = [
        'InFrame',
        'InframeDeletion',
        'InframeInsertion',
    ];

    const frameshiftCheckboxRefs = [
        'Frameshift',
        'FrameshiftDeletion',
        'FrameshiftInsertion',
    ];

    const truncatingCheckboxRefs = [
        'Truncating',
        ...frameshiftCheckboxRefs,
        'Nonsense',
        'Splice',
        'Nonstart',
        'Nonstop',
    ];

    const cnaCheckboxRefs = [
        'CheckCopynumberAlterations',
        'DeepDeletion',
        'Amplification',
    ];

    const mutationTypeCheckboxRefs = [
        'Missense',
        ...inframeCheckboxRefs,
        ...truncatingCheckboxRefs,
        'Other',
    ];

    const wrapperForMenu = (component: any) => {
        function allSelected(refs: string[]) {
            return _.every(
                refs,
                checkbox => component.findByDataTest(checkbox).props().checked
            );
        }

        function allDeselected(refs: string[]) {
            return _.every(
                refs,
                checkbox => !component.findByDataTest(checkbox).props().checked
            );
        }

        function checkboxIsSelected(ref: string) {
            return component.findByDataTest(ref).props().checked;
        }

        function toggleCheckbox(ref: string) {
            component.findByDataTest(ref).click();
        }

        return {
            cnaSection: {
                pressMasterButton: () =>
                    toggleCheckbox('CheckCopynumberAlterations'),
                pressChildButton: () => toggleCheckbox('DeepDeletion'),
                masterCheckBoxIsSelected: () =>
                    checkboxIsSelected('CheckCopynumberAlterations'),
                allCheckBoxesSelected: () => allSelected(cnaCheckboxRefs),
                allCheckBoxesDeselected: () => allDeselected(cnaCheckboxRefs),
            },
            frameshiftSection: {
                pressMasterButton: () => toggleCheckbox('Frameshift'),
                pressChildButton: () => toggleCheckbox('FrameshiftDeletion'),
                masterCheckBoxIsSelected: () =>
                    checkboxIsSelected('Frameshift'),
                allCheckBoxesSelected: () =>
                    allSelected(frameshiftCheckboxRefs),
                allCheckBoxesDeselected: () =>
                    allDeselected(frameshiftCheckboxRefs),
            },
            inframeSection: {
                pressMasterButton: () => toggleCheckbox('InFrame'),
                pressChildButton: () => toggleCheckbox('InframeDeletion'),
                masterCheckBoxIsSelected: () => checkboxIsSelected('InFrame'),
                allCheckBoxesSelected: () => allSelected(inframeCheckboxRefs),
                allCheckBoxesDeselected: () =>
                    allDeselected(inframeCheckboxRefs),
            },
            truncatingSection: {
                pressMasterButton: () => toggleCheckbox('Truncating'),
                pressChildButton: () => toggleCheckbox('Nonsense'),
                masterCheckBoxIsSelected: () =>
                    checkboxIsSelected('Truncating'),
                allCheckBoxesSelected: () =>
                    allSelected(truncatingCheckboxRefs),
                allCheckBoxesDeselected: () =>
                    allDeselected(truncatingCheckboxRefs),
            },
            mutationSection: {
                pressMasterButton: () => toggleCheckbox('Mutations'),
                pressChildButton: () => toggleCheckbox('Missense'),
                masterCheckBoxIsSelected: () => checkboxIsSelected('Mutations'),
                allCheckBoxesSelected: () =>
                    allSelected(mutationTypeCheckboxRefs),
                allCheckBoxesDeselected: () =>
                    allDeselected(mutationTypeCheckboxRefs),
            },
            structuralVariantSection: {
                pressMasterButton: () => toggleCheckbox('StructuralVariants'),
            },
            pressSubmitButton: () =>
                component.findByDataTest('buttonSelectAlterations').click(),
        };
    };

    function createStore() {
        return {
            selectedCopyNumberEnrichmentEventTypes: cnaEventTypeSelectInit([
                {
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                } as MolecularProfile,
            ]),
            selectedMutationEnrichmentEventTypes: mutationEventTypeSelectInit([
                {
                    molecularAlterationType: 'MUTATION_EXTENDED',
                } as MolecularProfile,
            ]),
            isStructuralVariantEnrichmentSelected: true,
        } as ComparisonStore;
    }

    describe('checkbox logic', () => {
        beforeEach(() => {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    updateSelectedEnrichmentEventTypes={
                        updateSelectedEnrichmentEventTypes
                    }
                    store={createStore()}
                    showMutations={true}
                    showStructuralVariants={true}
                    showCnas={true}
                />,
                wrapperForMenu
            );
        });

        // -+=+ MUTATION +=+-
        it('unchecks all mutation types using the mutation master checkbox', function() {
            menu.mutationSection.pressMasterButton();
            assert.isTrue(
                menu.mutationSection.allCheckBoxesDeselected(),
                'unchecks all mutation checkboxes'
            );
        });
        it('checks all mutation types using the master mutation checkbox', function() {
            menu.mutationSection.pressMasterButton();
            menu.mutationSection.pressMasterButton();
            assert.isTrue(
                menu.mutationSection.allCheckBoxesSelected(),
                'checks all mutation checkboxes'
            );
        });
        it('checks the master mutation checkbox when any mutation type is checked', function() {
            menu.mutationSection.pressMasterButton();
            menu.mutationSection.pressChildButton();
            assert.isTrue(menu.mutationSection.masterCheckBoxIsSelected());
        });

        // -+=+ FRAMESHIFT MUTATION +=+-
        it('unchecks all frameshift mutation types using the frameshift mutation master checkbox', function() {
            menu.frameshiftSection.pressMasterButton();
            assert.isTrue(
                menu.frameshiftSection.allCheckBoxesDeselected(),
                'unchecks all frameshift mutation checkboxes'
            );
        });
        it('checks all frameshift mutation types using the master frameshift mutation checkbox', function() {
            menu.frameshiftSection.pressMasterButton();
            menu.frameshiftSection.pressMasterButton();
            assert.isTrue(
                menu.frameshiftSection.allCheckBoxesSelected(),
                'checks all frameshift mutation checkboxes'
            );
        });
        it('checks the master frameshift mutation checkbox when any frameshift mutation type is checked', function() {
            menu.frameshiftSection.pressMasterButton();
            menu.frameshiftSection.pressChildButton();
            assert.isTrue(menu.frameshiftSection.masterCheckBoxIsSelected());
        });

        // -+=+ INFRAME MUTATION +=+-
        it('unchecks all inframe mutation types using the inframe mutation master checkbox', function() {
            menu.inframeSection.pressMasterButton();
            assert.isTrue(
                menu.inframeSection.allCheckBoxesDeselected(),
                'unchecks all inframe mutation checkboxes'
            );
        });
        it('checks all inframe mutation types using the master inframe mutation checkbox', function() {
            menu.inframeSection.pressMasterButton();
            menu.inframeSection.pressMasterButton();
            assert.isTrue(
                menu.inframeSection.allCheckBoxesSelected(),
                'checks all inframe mutation checkboxes'
            );
        });
        it('checks the master inframe mutation checkbox when any inframe mutation type is checked', function() {
            menu.inframeSection.pressMasterButton();
            menu.inframeSection.pressChildButton();
            assert.isTrue(menu.inframeSection.masterCheckBoxIsSelected());
        });

        // -+=+ TRUNCATING MUTATION +=+-
        it('unchecks all truncating mutation types using the truncating mutation master checkbox', function() {
            menu.truncatingSection.pressMasterButton();
            assert.isTrue(
                menu.truncatingSection.allCheckBoxesDeselected(),
                'unchecks all truncating mutation checkboxes'
            );
        });
        it('checks all truncating mutation types using the master truncating mutation checkbox', function() {
            menu.truncatingSection.pressMasterButton();
            menu.truncatingSection.pressMasterButton();
            assert.isTrue(
                menu.truncatingSection.allCheckBoxesSelected(),
                'checks all truncating mutation checkboxes'
            );
        });
        it('checks the master truncating mutation checkbox when any truncating mutation type is checked', function() {
            menu.truncatingSection.pressMasterButton();
            menu.truncatingSection.pressChildButton();
            assert.isTrue(menu.truncatingSection.masterCheckBoxIsSelected());
        });

        // -+=+ CNA +=+-
        it('unchecks all cna types using the cna master checkbox', function() {
            menu.cnaSection.pressMasterButton();
            assert.isTrue(
                menu.cnaSection.allCheckBoxesDeselected(),
                'unchecks all cna checkboxes'
            );
        });
        it('checks all cna types using the master cna checkbox', function() {
            menu.cnaSection.pressMasterButton();
            menu.cnaSection.pressMasterButton();
            assert.isTrue(
                menu.cnaSection.allCheckBoxesSelected(),
                'checks all cna checkboxes'
            );
        });
        it('checks the master cna checkbox when any cna type is checked', function() {
            menu.cnaSection.pressMasterButton();
            menu.cnaSection.pressChildButton();
            assert.isTrue(menu.cnaSection.masterCheckBoxIsSelected());
        });
    });

    describe('conditional sections', () => {
        it('shows all sections when asked', function() {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    updateSelectedEnrichmentEventTypes={
                        updateSelectedEnrichmentEventTypes
                    }
                    store={createStore()}
                    showMutations={true}
                    showStructuralVariants={true}
                    showCnas={true}
                />,
                wrapperForMenu
            );
            assert.isTrue(menu.exists('input[data-test="Mutations"]'));
            assert.isTrue(menu.exists('input[data-test="StructuralVariants"]'));
            assert.isTrue(
                menu.exists('input[data-test="CheckCopynumberAlterations"]')
            );
        });

        it('shows no sections when asked', function() {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    updateSelectedEnrichmentEventTypes={
                        updateSelectedEnrichmentEventTypes
                    }
                    store={createStore()}
                    showMutations={false}
                    showStructuralVariants={false}
                    showCnas={false}
                />,
                wrapperForMenu
            );
            assert.isFalse(menu.exists('input[data-test="Mutations"]'));
            assert.isFalse(
                menu.exists('input[data-test="StructuralVariants"]')
            );
            assert.isFalse(
                menu.exists('input[data-test="CheckCopynumberAlterations"]')
            );
        });

        it('shows mutation section when asked', function() {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    updateSelectedEnrichmentEventTypes={
                        updateSelectedEnrichmentEventTypes
                    }
                    store={createStore()}
                    showMutations={true}
                    showStructuralVariants={false}
                    showCnas={false}
                />,
                wrapperForMenu
            );
            assert.isTrue(menu.exists('input[data-test="Mutations"]'));
            assert.isFalse(
                menu.exists('input[data-test="StructuralVariants"]')
            );
            assert.isFalse(
                menu.exists('input[data-test="CheckCopynumberAlterations"]')
            );
        });

        it('shows structural variant section when asked', function() {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    updateSelectedEnrichmentEventTypes={
                        updateSelectedEnrichmentEventTypes
                    }
                    store={createStore()}
                    showMutations={false}
                    showStructuralVariants={true}
                    showCnas={false}
                />,
                wrapperForMenu
            );
            assert.isFalse(menu.exists('input[data-test="Mutations"]'));
            assert.isTrue(menu.exists('input[data-test="StructuralVariants"]'));
            assert.isFalse(
                menu.exists('input[data-test="CheckCopynumberAlterations"]')
            );
        });

        it('shows cna section when asked', function() {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    updateSelectedEnrichmentEventTypes={
                        updateSelectedEnrichmentEventTypes
                    }
                    store={createStore()}
                    showMutations={false}
                    showStructuralVariants={false}
                    showCnas={true}
                />,
                wrapperForMenu
            );
            assert.isFalse(menu.exists('input[data-test="Mutations"]'));
            assert.isFalse(
                menu.exists('input[data-test="StructuralVariants"]')
            );
            assert.isTrue(
                menu.exists('input[data-test="CheckCopynumberAlterations"]')
            );
        });
    });

    describe('submit button', () => {
        beforeEach(() => {
            menu = mountWithCustomWrappers(
                <AlterationEnrichmentTypeSelector
                    updateSelectedEnrichmentEventTypes={
                        updateSelectedEnrichmentEventTypes
                    }
                    store={createStore()}
                    showMutations={true}
                    showStructuralVariants={true}
                    showCnas={true}
                />,
                wrapperForMenu
            );
            updateSelectedEnrichmentEventTypes.resetHistory();
        });

        it('is disabled before any changes are made', function() {
            menu.pressSubmitButton();
            assert.isTrue(updateSelectedEnrichmentEventTypes.notCalled);
        });

        it('invokes callback when pressed after change is made', function() {
            menu.mutationSection.pressChildButton();
            menu.pressSubmitButton();
            assert.isTrue(updateSelectedEnrichmentEventTypes.calledOnce);
        });

        it('returns mutation types to callback', function() {
            menu.mutationSection.pressMasterButton();
            menu.cnaSection.pressMasterButton();
            menu.structuralVariantSection.pressMasterButton();

            menu.mutationSection.pressChildButton();
            menu.pressSubmitButton();

            expect(
                updateSelectedEnrichmentEventTypes.args[0][0]
            ).to.have.members([
                'missense',
                'missense_mutation',
                'missense_variant',
            ]);
        });

        it('returns cna types to callback', function() {
            menu.mutationSection.pressMasterButton();
            menu.cnaSection.pressMasterButton();
            menu.structuralVariantSection.pressMasterButton();

            menu.cnaSection.pressChildButton();
            menu.pressSubmitButton();

            expect(
                updateSelectedEnrichmentEventTypes.args[0][0]
            ).to.have.members(['HOMDEL']);
        });
    });
});
