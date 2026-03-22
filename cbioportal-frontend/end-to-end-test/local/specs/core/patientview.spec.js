const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    jsApiHover,
    setDropdownOpen,
    strIsNumeric,
    waitForPatientView,
    getNestedElement,
    getElement,
    setCheckboxChecked,
} = require('../../../shared/specUtils_Async');

const _ = require('lodash');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const genePanelPatientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=teststudy_genepanels&caseId=patientA';
const ascnPatientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=ascn_test_study&caseId=FAKE_P001';

const ALLELE_FREQ_CELL_DATA_TEST = 'allele-freq-cell';
const ALLELE_FREQ_PATIENT_VIEW_URL = `${CBIOPORTAL_URL}/patient?studyId=ascn_test_study&caseId=FAKE_P001`;
const ALLELE_FREQ_SAMPLE_VIEW_URL = `${CBIOPORTAL_URL}/patient?studyId=ascn_test_study&sampleId=FAKE_P001_S3`;

describe('patient view page', function() {
    describe('gene panel information', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(genePanelPatientViewUrl, true);
            await waitForPatientView();
        });

        const p = 'sample-icon';
        const n = 'not-profiled-icon';

        it('mutation table shows correct sample icons, non-profiled icons and invisible icons', async () => {
            const sampleIcon = {
                ERBB2: [n, n, n, p, p],
                ABLIM1: [p, p, n, p, p],
                PIEZO1: [n, n, p, p, p],
                CADM2: [p, p, p, p, p],
            };

            const sampleVisibility = {
                ERBB2: [true, true, true, true, false],
                ABLIM1: [true, true, true, false, false],
                PIEZO1: [true, true, true, false, false],
                CADM2: [false, true, true, false, false],
            };

            const genes = _.keys(sampleIcon);
            for (const gene of genes) {
                await testSampleIcon(
                    gene,
                    'patientview-mutation-table',
                    sampleIcon[gene],
                    sampleVisibility[gene]
                );
            }
        });

        it('CNA table shows correct sample icons, non-profiled icons and invisible icons', async () => {
            const sampleIcon = {
                ERBB2: [n, n, p, p, n],
                CADM2: [p, p, p, p, p],
                PIEZO1: [n, p, p, p, n],
            };

            const sampleVisibility = {
                ERBB2: [true, true, false, true, true],
                CADM2: [false, true, false, false, true],
                PIEZO1: [true, true, false, false, true],
            };

            const genes = _.keys(sampleIcon);

            for (const gene of genes) {
                await testSampleIcon(
                    gene,
                    'patientview-copynumber-table',
                    sampleIcon[gene],
                    sampleVisibility[gene]
                );
            }
        });
    });

    describe('filtering of mutation table', () => {
        let selectMenu;
        let filterIcon;

        before(async () => {
            await goToUrlAndSetLocalStorage(genePanelPatientViewUrl, true);
            await waitForPatientView();
        });

        it('filter menu icon is shown when gene panels are used', async () => {
            filterIcon = await getNestedElement([
                'div[data-test=patientview-mutation-table]',
                'i[data-test=gene-filter-icon]',
            ]);
            assert(await filterIcon.isDisplayed());
        });

        it('opens selection menu when filter icon clicked', async () => {
            await setDropdownOpen(true, filterIcon, '.rc-tooltip');
            selectMenu = await getElement('.rc-tooltip');
            assert(await selectMenu.isDisplayed());
        });

        it('removes genes profiles profiled in some samples then `all genes` option selected', async () => {
            await setDropdownOpen(true, filterIcon, selectMenu);
            const allGenesRadio = await selectMenu.$('input[value=allSamples]');
            await allGenesRadio.click();
            const geneEntries = await $$(
                '[data-test=mutation-table-gene-column]'
            );
            assert.equal(geneEntries.length, 1);
            const geneName = await geneEntries[0].getText();
            assert.equal(geneName, 'CADM2');
        });

        it('re-adds genes when `any genes` option selected', async () => {
            const anyGenesRadio = await selectMenu.$('input[value=anySample]');
            await anyGenesRadio.click();
            const geneEntries = await $$(
                '[data-test=mutation-table-gene-column]'
            );
            assert.equal(geneEntries.length, 4);
        });

        it('closes selection menu when filter icon clicked again', async () => {
            await setDropdownOpen(false, filterIcon, '.rc-tooltip');
            selectMenu = await $('.rc-tooltip');
            assert(!(await selectMenu.isDisplayed()));
        });

        it('filter menu icon is not shown when gene panels are not used', async () => {
            await goToUrlAndSetLocalStorage(
                CBIOPORTAL_URL +
                    '/patient?studyId=study_es_0&caseId=TCGA-A1-A0SK',
                true
            );
            await waitForPatientView();
            const filterIcon = await getNestedElement([
                'div[data-test=patientview-mutation-table]',
                'i[data-test=gene-filter-icon]',
            ]);
            assert(!(await filterIcon.isDisplayed()));
        });
    });

    describe('filtering of CNA table', () => {
        let selectMenu;
        let filterIcon;

        before(async () => {
            await goToUrlAndSetLocalStorage(genePanelPatientViewUrl, true);
            await waitForPatientView();
        });

        it('filter menu icon is shown when gene panels are used', async () => {
            filterIcon = await getNestedElement([
                'div[data-test=patientview-copynumber-table]',
                'i[data-test=gene-filter-icon]',
            ]);
            assert(await filterIcon.isDisplayed());
        });

        it('opens selection menu when filter icon clicked', async () => {
            await setDropdownOpen(true, filterIcon, '.rc-tooltip');
            selectMenu = await getElement('.rc-tooltip');
            assert(await selectMenu.isDisplayed());
        });

        it('removes genes profiles profiled in some samples then `all genes` option selected', async () => {
            await setDropdownOpen(true, filterIcon, '.rc-tooltip');
            const allGenesRadio = await selectMenu.$('input[value=allSamples]');
            await allGenesRadio.click();
            const geneEntries = await $$('[data-test=cna-table-gene-column]');
            assert.equal(geneEntries.length, 1);
            const geneName = await geneEntries[0].getText();
            assert.equal(geneName, 'CADM2');
        });

        it('re-adds genes when `any genes` option selected', async () => {
            await setDropdownOpen(true, filterIcon, '.rc-tooltip');
            const anyGenesRadio = await selectMenu.$('input[value=anySample]');
            await anyGenesRadio.click();
            const geneEntries = await $$('[data-test=cna-table-gene-column]');
            assert.equal(geneEntries.length, 3);
        });

        it('closes selection menu when filter icon clicked again', async () => {
            await setDropdownOpen(false, filterIcon, '.rc-tooltip');
            assert(!(await selectMenu.isDisplayed()));
        });

        it('filter menu icon is not shown when gene panels are not used', async () => {
            await goToUrlAndSetLocalStorage(
                CBIOPORTAL_URL +
                    '/patient?studyId=study_es_0&caseId=TCGA-A2-A04U',
                true
            );
            await waitForPatientView();
            const filterIcon = await getNestedElement([
                'div[data-test=patientview-copynumber-table]',
                'i[data-test=gene-filter-icon]',
            ]);
            assert(!(await filterIcon.isDisplayed()));
        });
    });

    describe('genomic tracks', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(genePanelPatientViewUrl, true);
            await waitForPatientView();
        });

        it.skip('shows gene panel icon when gene panels are used for patient samples', async () => {
            assert(
                await (
                    await getElement('[data-test=cna-track-genepanel-icon-0]')
                ).isExisting()
            );
            assert(
                await (
                    await getElement('[data-test=mut-track-genepanel-icon-5]')
                ).isExisting()
            );
        });

        it.skip('shows mouse-over tooltip for gene panel icons with gene panel id', async () => {
            // Tooltip elements are created when hovering the gene panel icon.
            // Control logic below is needed to access the last one after it
            // was created.

            await waitForElementDisplayed(
                '[data-test=cna-track-genepanel-icon-1]'
            );

            await (
                await getElement('[data-test=cna-track-genepanel-icon-1]')
            ).moveTo();

            await waitForElementDisplayed('.genover-tooltip');
            const text = await (await getElement('div.qtip-content')).getText();
            assert.equal(text, 'Gene panel: TESTPANEL1');
        });

        it.skip('shows mouse-over tooltip for gene panel icons with NA for whole-genome analyzed sample', async () => {
            // Tooltip elements are created when hovering the gene panel icon.
            // Control logic below is needed to access the last one after it
            // was created.
            var curNumToolTips = await $$('div.qtip-content').length;
            await (await $('[data-test=cna-track-genepanel-icon-4]')).moveTo();
            await browser.waitUntil(
                () => $$('div.qtip-content').length > curNumToolTips
            );
            var toolTips = await $$('div.qtip-content');
            var text = await toolTips[toolTips.length - 1].getText();
            assert.equal(
                text,
                'Gene panel information not found. Sample is presumed to be whole exome/genome sequenced.'
            );
        });

        it('hides gene panel icons when no gene panels are used for patient samples', async () => {
            await goToUrlAndSetLocalStorage(
                CBIOPORTAL_URL +
                    '/patient?studyId=study_es_0&caseId=TCGA-A1-A0SK',
                true
            );
            await waitForPatientView();
            assert(
                !(await (
                    await $('[data-test=mut-track-genepanel-icon-0]')
                ).isExisting())
            );
        });
    });

    describe('VAF plot', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(genePanelPatientViewUrl, true);
            await waitForPatientView();
        });

        it('shows gene panel icons when gene panels are used', async () => {
            await (await $('.vafPlotThumbnail')).moveTo(); // moves pointer to plot thumbnail
            await (
                await $('div[role=tooltip] svg[data-test=vaf-plot]')
            ).waitForDisplayed();
            var genePanelIcon = await $(
                'svg[data-test=vaf-plot] rect.genepanel-icon'
            );
            assert(await genePanelIcon.isExisting());
        });
    });

    describe('gene panel modal', () => {
        async function clickOnGenePanelLinks() {
            const el = await $('.rc-tooltip td a');
            await el.waitForDisplayed();
            await el.click();
        }

        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(genePanelPatientViewUrl, true);
            await waitForPatientView();
        });

        it('toggles gene panel modal from patient header', async () => {
            await (
                await $('[data-test="patientSamplesClinicalSpans"] svg')
            ).moveTo();

            await clickOnGenePanelLinks();

            assert(
                await (await $('#patient-view-gene-panel')).waitForDisplayed()
            );
        });

        it.skip('toggles gene panel modal from sample icon in genomic tracks', async () => {
            await (
                await $(
                    '.genomicOverviewTracksContainer svg[data-test=sample-icon]'
                )
            ).moveTo();

            await clickOnGenePanelLinks();
            assert(
                await (await $('#patient-view-gene-panel')).waitForDisplayed()
            );
        });

        it.skip('toggles gene panel modal from gene panel icon in genomic tracks', async () => {
            await (
                await $(
                    '.genomicOverviewTracksContainer [data-test=cna-track-genepanel-icon-0]'
                )
            ).moveTo();

            await (await $('.qtip-content a')).click();
            assert(
                await (await $('#patient-view-gene-panel')).waitForDisplayed()
            );
        });

        it('toggles gene panel modal from sample icon in mutations table', async () => {
            const mutationsTable = '[data-test=patientview-mutation-table]';
            await (
                await $(
                    `${mutationsTable} table td li:not(.invisible) [data-test=not-profiled-icon]`
                )
            ).moveTo();
            await clickOnGenePanelLinks();
            assert(await (await $('#patient-view-gene-panel')).isExisting());
        });

        it('toggles gene panel modal from gene panel id in mutations table', async () => {
            const mutationsTable = '[data-test=patientview-mutation-table]';

            // select option to show "Gene Panel" column
            await (
                await $(`${mutationsTable} button#dropdown-custom-1`)
            ).click();
            await (
                await (await $(`${mutationsTable} ul.dropdown-menu`)).$$('li')
            )[2].click();

            // click on gene panel id in mutations table
            await (await $(`${mutationsTable} table a`)).click();
            assert(await (await $('#patient-view-gene-panel')).isExisting());
        });

        it('toggles gene panel modal from sample icon in copy number table', async () => {
            const copyNumberTable = '[data-test=patientview-copynumber-table]';
            await jsApiHover(
                `${copyNumberTable} table td li:not(.invisible) [data-test=not-profiled-icon]`
            );
            await browser.pause(500);
            await clickOnGenePanelLinks();
            assert(await (await $('#patient-view-gene-panel')).isExisting());
        });

        it('toggles gene panel modal from gene panel id in copy number table', async () => {
            const copyNumberTable = '[data-test=patientview-copynumber-table]';

            // select option to show "Gene Panel" column
            await (
                await $(`${copyNumberTable} button#dropdown-custom-1`)
            ).click();
            await (
                await (await $(`${copyNumberTable} ul.dropdown-menu`)).$$('li')
            )[2].click();

            // click on gene panel id in copy number table
            await (await $(`${copyNumberTable} table a`)).click();
            assert(await (await $('#patient-view-gene-panel')).isExisting());
        });
    });

    describe('mutation table ASCN columns', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(ascnPatientViewUrl, true);
            await waitForPatientView();
            const mutationsTable = '[data-test=patientview-mutation-table]';

            // make sure "Clonal", "Mutant Integer Copy #", "CCF", and "Total Integer Copy #" columns are visible

            await (
                await $(`${mutationsTable} button#dropdown-custom-1`)
            ).click();

            const clonalCheckboxSelector = `${mutationsTable} ul.dropdown-menu li label input[data-id="Clonal"]`;
            if (!(await $(clonalCheckboxSelector).isSelected())) {
                await setCheckboxChecked(true, clonalCheckboxSelector);
            }
            const mutantIntCopyCheckboxSelector = `${mutationsTable} ul.dropdown-menu li label input[data-id="Mutant Integer Copy #"]`;
            if (!(await $(mutantIntCopyCheckboxSelector).isSelected())) {
                await setCheckboxChecked(true, mutantIntCopyCheckboxSelector);
            }
            const ccfCheckboxSelector = `${mutationsTable} ul.dropdown-menu li label input[data-id="CCF"]`;
            if (!(await $(ccfCheckboxSelector).isSelected())) {
                await setCheckboxChecked(true, ccfCheckboxSelector);
            }
            const totalIntCopyCheckboxSelector = `${mutationsTable} ul.dropdown-menu li label input[data-id="Total Integer Copy #"]`;
            if (!(await $(totalIntCopyCheckboxSelector).isSelected())) {
                await setCheckboxChecked(true, totalIntCopyCheckboxSelector);
            }

            await (
                await $(`${mutationsTable} button#dropdown-custom-1`)
            ).click();
        });

        afterEach(async () => {
            // move somewhere safe so that all tooltips close or open tooltips block others from opening
            await (await $('body')).moveTo({ xOffset: 0, yOffset: 0 }); // offset 0, 0 relative to the top-left corner of the element
            await browser.pause(200); // it takes a bit of time to close the tooltip after moving
        });

        const c = 'clonal-icon';
        const s = 'subclonal-icon';
        const n = 'na-icon';

        it('shows correct clonal icons, subclonal icons, NA/indeterminate icons, and invisible icons', async () => {
            // make sure the gene of the first row is PIK3R1
            const gene = await browser.execute(function() {
                return $('[data-test=patientview-mutation-table] tbody tr')
                    .first()
                    .find(
                        '[data-test=mutation-table-gene-column]'
                    )[0].innerText;
            });

            assert.equal(gene, 'PIK3R1');

            const clonalCells = await browser.execute(function() {
                return $('[data-test=patientview-mutation-table] tbody tr')
                    .first()
                    .find('[data-test=clonal-cell] svg[data-test]')
                    .toArray()
                    .map(e => e.getAttribute('data-test'));
            });

            assert.equal(
                clonalCells.join(','),
                'clonal-icon,subclonal-icon,na-icon,clonal-icon,clonal-icon,na-icon'
            );

            const sampleVisiblity = await browser.execute(function() {
                return $('[data-test=patientview-mutation-table] tbody tr')
                    .first()
                    .find('td:first-child li')
                    .toArray()
                    .map(e => e.className);
            });

            assert.deepStrictEqual(sampleVisiblity, [
                '',
                '',
                'invisible',
                '',
                '',
                'invisible',
            ]);
        });

        it('displays clonal column tooltip on mouseover element', async () => {
            await jsApiHover(
                'span[data-test=clonal-cell] span span svg circle'
            );
            await (
                await $('div[role=tooltip] div[data-test=clonal-tooltip]')
            ).waitForExist();
        });

        it('displays expected alt copies column tooltip on mouseover element', async () => {
            await jsApiHover('span[data-test=eac-cell] span span svg g rect');
            await (
                await $('div[role=tooltip] span[data-test=eac-tooltip]')
            ).waitForExist();
        });

        it('displays integer copy number column tooltip on mouseover element', async () => {
            await jsApiHover(
                'span[data-test=ascn-copy-number-cell] span span svg g rect'
            );
            await (
                await $(
                    'div[role=tooltip] span[data-test=ascn-copy-number-tooltip]'
                )
            ).waitForExist();
        });

        it('displays ccf column tooltip on mouseover element', async () => {
            await jsApiHover('span[data-test=ccf-cell] span');
            await (
                await $('div[role=tooltip] span[data-test=ccf-tooltip]')
            ).waitForExist();
        });
    });

    describe('allele frequency', () => {
        it('should show number under allele frequency column for multiple samples patient in one sample view', async function() {
            await goToUrlAndSetLocalStorage(ALLELE_FREQ_SAMPLE_VIEW_URL, true);
            await waitForPatientView();

            assert.strictEqual(
                true,
                strIsNumeric(
                    await (
                        await (
                            await $$(
                                `div[data-test="${ALLELE_FREQ_CELL_DATA_TEST}"]`
                            )
                        )[0].$('span')
                    ).getText()
                )
            );
        });

        it('should show bars(svg) under allele frequency column for multiple samples patient in patient view', async function() {
            await goToUrlAndSetLocalStorage(ALLELE_FREQ_PATIENT_VIEW_URL, true);
            await waitForPatientView();
            assert.strictEqual(
                true,
                await (
                    await (
                        await $$(
                            `div[data-test="${ALLELE_FREQ_CELL_DATA_TEST}"]`
                        )
                    )[0].$('svg')
                ).isExisting()
            );
        });
    });
});

async function testSampleIcon(
    geneSymbol,
    tableTag,
    sampleIconTypes,
    sampleVisibilities
) {
    const geneCell = await getNestedElement([
        'div[data-test=' + tableTag + '] table',
        'span=' + geneSymbol,
    ]);
    const samplesCell = await (await (await geneCell.$('..')).$('..')).$(
        'div[data-test=samples-cell] ul'
    );
    const icons = await samplesCell.$$('li');

    for (let i = 0; i < sampleIconTypes.length; i++) {
        const desiredDataType = sampleIconTypes[i];
        const isExpectedIcon = await (
            await icons[i].$('svg[data-test=' + desiredDataType + ']')
        ).isExisting();
        assert.equal(
            isExpectedIcon,
            true,
            'Gene ' +
                geneSymbol +
                ': icon type at position ' +
                i +
                ' is not `' +
                desiredDataType +
                '`'
        );
    }

    for (let i = 0; i < sampleVisibilities.length; i++) {
        const desiredVisibility = sampleVisibilities[i];
        const actualVisibility = await icons[i].isDisplayed();
        assert.equal(
            actualVisibility,
            desiredVisibility,
            'Gene ' +
                geneSymbol +
                ': icon visibility at position ' +
                i +
                ' is not `' +
                desiredVisibility +
                '`, but is `' +
                actualVisibility +
                '`'
        );
    }
}
