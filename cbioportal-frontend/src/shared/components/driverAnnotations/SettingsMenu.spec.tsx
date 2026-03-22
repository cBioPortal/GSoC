import React from 'react';
import { mountWithCustomWrappers } from 'enzyme-custom-wrappers';
import { assert } from 'chai';
import _ from 'lodash';
import {
    DriverAnnotationSettings,
    IAnnotationFilterSettings,
    IDriverAnnotationReport,
} from 'shared/alterationFiltering/AnnotationFilteringSettings';
import { MobxPromiseUnionType } from 'cbioportal-frontend-commons';
import { observable } from 'mobx';
import SettingsMenu from 'shared/components/driverAnnotations/SettingsMenu';

describe('SettingsMenu', () => {
    let menu: any;

    const mutationStatusCheckboxRefs = [
        'ToggleAllMutationStatus',
        'ShowGermline',
        'HideSomatic',
        'ShowUnknown',
    ];

    const driverAnnotationCheckboxRefs = [
        'ToggleAllDriverAnnotation',
        'ShowDriver',
        'ShowVUS',
        'ShowUnknownOncogenicity',
    ];

    const tierAnnotationCheckboxRefs = [
        'ToggleAllDriverTiers',
        'Class_1',
        'Class_2',
        'Class_3',
        'Class_4',
        'ShowUnknownTier',
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
            mutationStatusSection: {
                pressMasterButton: () =>
                    toggleCheckbox('ToggleAllMutationStatus'),
                pressChildButton: () => toggleCheckbox('ShowGermline'),
                masterCheckBoxIsSelected: () =>
                    checkboxIsSelected('ToggleAllMutationStatus'),
                allCheckBoxesSelected: () =>
                    allSelected(mutationStatusCheckboxRefs),
                allCheckBoxesDeselected: () =>
                    allDeselected(mutationStatusCheckboxRefs),
            },
            driverAnnotationSection: {
                pressMasterButton: () =>
                    toggleCheckbox('ToggleAllDriverAnnotation'),
                pressChildButton: () => toggleCheckbox('ShowDriver'),
                masterCheckBoxIsSelected: () =>
                    checkboxIsSelected('ToggleAllDriverAnnotation'),
                allCheckBoxesSelected: () =>
                    allSelected(driverAnnotationCheckboxRefs),
                allCheckBoxesDeselected: () =>
                    allDeselected(driverAnnotationCheckboxRefs),
            },
            tierAnnotationSection: {
                pressMasterButton: () => toggleCheckbox('ToggleAllDriverTiers'),
                pressChildButton: () => toggleCheckbox('Class_1'),
                pressUnknownButton: () => toggleCheckbox('ShowUnknownTier'),
                masterCheckBoxIsSelected: () =>
                    checkboxIsSelected('ToggleAllDriverTiers'),
                allCheckBoxesSelected: () =>
                    allSelected(tierAnnotationCheckboxRefs),
                allCheckBoxesDeselected: () =>
                    allDeselected(tierAnnotationCheckboxRefs),
            },
        };
    };

    function createStore() {
        return observable({
            driverAnnotationSettings: {
                includeDriver: true,
                includeVUS: true,
                includeUnknownOncogenicity: true,
                customBinary: true,
                customTiersDefault: true,
                driverTiers: observable.map<string, boolean>({
                    'Class 1': false,
                    'Class 2': false,
                    'Class 3': false,
                    'Class 4': false,
                }),
                includeUnknownTier: false,
                driversAnnotated: true,

                // -- props below are not relevant for SettingsMenu
                hotspots: false,
                oncoKb: false,
                // --
            } as DriverAnnotationSettings,
            customDriverAnnotationReport: {
                isComplete: true,
                status: 'complete',
                isPending: false,
                isError: false,
                result: {
                    hasBinary: true,
                    tiers: ['Class 1', 'Class 2', 'Class 3', 'Class 4'],
                } as IDriverAnnotationReport,
            } as MobxPromiseUnionType<IDriverAnnotationReport>,
            includeGermlineMutations: true,
            includeSomaticMutations: true,
            includeUnknownStatusMutations: true,
        } as IAnnotationFilterSettings);
    }

    describe('checkbox logic', () => {
        beforeEach(() => {
            menu = mountWithCustomWrappers(
                <SettingsMenu
                    store={createStore()}
                    showDriverAnnotationSection={true}
                    showTierAnnotationSection={true}
                />,
                wrapperForMenu
            );
        });

        // -+=+ MUTATION STATUS +=+-
        it('unchecks all mutation status using the master checkbox', function() {
            menu.mutationStatusSection.pressMasterButton();
            assert.isTrue(
                menu.mutationStatusSection.allCheckBoxesDeselected(),
                'unchecks all mutation status checkboxes'
            );
        });
        it('checks all mutation status using the master checkbox', function() {
            menu.mutationStatusSection.pressMasterButton();
            menu.mutationStatusSection.pressMasterButton();
            assert.isTrue(
                menu.mutationStatusSection.allCheckBoxesSelected(),
                'checks all mutation status checkboxes'
            );
        });
        it('checks the master checkbox when any mutation status is checked', function() {
            menu.mutationStatusSection.pressMasterButton();
            menu.mutationStatusSection.pressChildButton();
            assert.isTrue(
                menu.mutationStatusSection.masterCheckBoxIsSelected()
            );
        });

        // -+=+ DRIVER ANNOTATION +=+-
        it('unchecks all driver annotations using the master checkbox', function() {
            menu.driverAnnotationSection.pressMasterButton();
            assert.isTrue(
                menu.driverAnnotationSection.allCheckBoxesDeselected(),
                'unchecks all driver annotation checkboxes'
            );
        });
        it('checks all driver annotations using the master checkbox', function() {
            menu.driverAnnotationSection.pressMasterButton();
            menu.driverAnnotationSection.pressMasterButton();
            assert.isTrue(
                menu.driverAnnotationSection.allCheckBoxesSelected(),
                'checks all driver annotation checkboxes'
            );
        });
        it('checks the master checkbox when any driver annotation is checked', function() {
            menu.driverAnnotationSection.pressMasterButton();
            menu.driverAnnotationSection.pressChildButton();
            assert.isTrue(
                menu.driverAnnotationSection.masterCheckBoxIsSelected()
            );
        });

        // -+=+ TIER ANNOTATION +=+-
        it('checks all driver tier annotations using the master checkbox', function() {
            menu.tierAnnotationSection.pressMasterButton();
            assert.isTrue(
                menu.tierAnnotationSection.allCheckBoxesSelected(),
                'checks all driver tier annotation checkboxes'
            );
        });
        it('unchecks all driver tier annotations using the master checkbox', function() {
            menu.tierAnnotationSection.pressMasterButton();
            menu.tierAnnotationSection.pressMasterButton();
            assert.isTrue(
                menu.tierAnnotationSection.allCheckBoxesDeselected(),
                'unchecks all driver tier annotation checkboxes'
            );
        });
        it('checks the master checkbox when any driver tier annotation is checked', function() {
            menu.tierAnnotationSection.pressMasterButton();
            menu.tierAnnotationSection.pressChildButton();
            assert.isTrue(
                menu.tierAnnotationSection.masterCheckBoxIsSelected()
            );
        });
        it('checks the master when unknown tier annotation checkbox is checked', function() {
            assert.isTrue(menu.tierAnnotationSection.allCheckBoxesDeselected());
            menu.tierAnnotationSection.pressUnknownButton();
            assert.isTrue(
                menu.tierAnnotationSection.masterCheckBoxIsSelected()
            );
        });
    });

    describe('menu layout', () => {
        it('shows all sections', () => {
            menu = mountWithCustomWrappers(
                <SettingsMenu
                    store={createStore()}
                    showDriverAnnotationSection={true}
                    showTierAnnotationSection={true}
                />,
                wrapperForMenu
            );
            assert.isTrue(
                menu.exists('input[data-test="ToggleAllMutationStatus"]')
            );
            assert.isTrue(
                menu.exists('input[data-test="ToggleAllDriverAnnotation"]')
            );
            assert.isTrue(
                menu.exists('input[data-test="ToggleAllDriverTiers"]')
            );
            assert.isFalse(
                menu.exists('input[data-test="GlobalSettingsButtonHint"]')
            );
        });
        it('hides driver annotation section', () => {
            menu = mountWithCustomWrappers(
                <SettingsMenu
                    store={createStore()}
                    showDriverAnnotationSection={false}
                    showTierAnnotationSection={true}
                />,
                wrapperForMenu
            );
            assert.isTrue(
                menu.exists('input[data-test="ToggleAllMutationStatus"]')
            );
            assert.isFalse(
                menu.exists('input[data-test="ToggleAllDriverAnnotation"]')
            );
            assert.isTrue(
                menu.exists('input[data-test="ToggleAllDriverTiers"]')
            );
            assert.isFalse(
                menu.exists('input[data-test="GlobalSettingsButtonHint"]')
            );
        });
        it('hides driver tiers annotation section', () => {
            menu = mountWithCustomWrappers(
                <SettingsMenu
                    store={createStore()}
                    showDriverAnnotationSection={true}
                    showTierAnnotationSection={false}
                />,
                wrapperForMenu
            );
            assert.isTrue(
                menu.exists('input[data-test="ToggleAllMutationStatus"]')
            );
            assert.isTrue(
                menu.exists('input[data-test="ToggleAllDriverAnnotation"]')
            );
            assert.isFalse(
                menu.exists('input[data-test="ToggleAllDriverTiers"]')
            );
            assert.isFalse(
                menu.exists('input[data-test="GlobalSettingsButtonHint"]')
            );
        });
        it('shows user info message when menu inactive (no driver annotations available)', () => {
            menu = mountWithCustomWrappers(
                <SettingsMenu
                    store={createStore()}
                    disabled={true}
                    showDriverAnnotationSection={true}
                    showTierAnnotationSection={true}
                />,
                wrapperForMenu
            );
            assert.isTrue(
                menu.exists('[data-test="GlobalSettingsButtonHint"]')
            );
        });
    });

    describe('callback invocation', () => {
        it('updates the store', () => {
            const store = createStore();
            menu = mountWithCustomWrappers(
                <SettingsMenu
                    store={store}
                    showDriverAnnotationSection={true}
                    showTierAnnotationSection={true}
                />,
                wrapperForMenu
            );
            menu.findByDataTest('ShowGermline').click();
            menu.findByDataTest('HideSomatic').click();
            menu.findByDataTest('ShowUnknown').click();
            assert.isFalse(store.includeGermlineMutations);
            assert.isFalse(store.includeSomaticMutations);
            assert.isFalse(store.includeUnknownStatusMutations);

            menu.findByDataTest('ShowDriver').click();
            menu.findByDataTest('ShowVUS').click();
            menu.findByDataTest('ShowUnknownOncogenicity').click();
            assert.isFalse(store.driverAnnotationSettings.includeDriver);
            assert.isFalse(store.driverAnnotationSettings.includeVUS);
            assert.isFalse(
                store.driverAnnotationSettings.includeUnknownOncogenicity
            );

            menu.findByDataTest('Class_1').click();
            menu.findByDataTest('Class_2').click();
            menu.findByDataTest('Class_3').click();
            menu.findByDataTest('Class_4').click();
            menu.findByDataTest('ShowUnknownTier').click();
            assert.isTrue(
                store.driverAnnotationSettings.driverTiers.get('Class 1')
            );
            assert.isTrue(
                store.driverAnnotationSettings.driverTiers.get('Class 2')
            );
            assert.isTrue(
                store.driverAnnotationSettings.driverTiers.get('Class 3')
            );
            assert.isTrue(store.driverAnnotationSettings.includeUnknownTier);
        });
    });
});
