const assert = require('assert');
const {
    waitForStudyView,
    goToUrlAndSetLocalStorage,
    waitForGroupComparisonTabOpen,
    setDropdownOpen,
    getNthElements,
    clickElement,
    getElement,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`;

describe('color chooser for groups menu in study view', function() {
    const genderPies =
        '[data-test=chart-container-SEX] .studyViewPieChartGroup path';
    const oncotreePies =
        '[data-test=chart-container-ONCOTREE_CODE] .studyViewPieChartGroup path';
    const survivalPies =
        '[data-test=chart-container-OS_STATUS] .studyViewPieChartGroup path';
    const groupsMenuButton = '[data-test=groups-button]';
    const createNewGroupButton = '[data-test=create-new-group-btn]';
    const finalizeGroupButton = 'button=Create';
    const colorIconRect = '[data-test=color-picker-icon] rect';
    const colorIcon = '[data-test=color-picker-icon]';
    const colorPickerBlue = '.circle-picker [title="#2986E2"]';
    const colorIconBlue = 'svg rect[fill="#2986e2"]';
    const colorPickerGreen = '.circle-picker [title="#109618"]';
    const colorIconEmpty = 'svg rect[fill="#FFFFFF"]';
    const warningSign = '.fa.fa-warning';
    const groupCheckboxes = '[data-test=group-checkboxes] input';
    const compareButton = 'button=Compare';
    const gbGroupButton = '[data-test=groupSelectorButtonGB]';
    const oastGroupButton = '[data-test=groupSelectorButtonOAST]';

    const gbGroupColorIcon = `[data-test="group-checkboxes"] [data-test="GB"] ${colorIcon}`;
    const gbGroupColorIconRect = `[data-test="group-checkboxes"] [data-test="GB"] ${colorIconRect}`;
    const gbGroupColorIconEmpty = `[data-test="group-checkboxes"] [data-test="GB"] ${colorIconEmpty}`;
    const gbGroupColorIconBlue = `[data-test="group-checkboxes"] [data-test="GB"] ${colorIconBlue}`;

    before(async () => {
        await goToUrlAndSetLocalStorage(studyViewUrl, true);
        await waitForStudyView();
        await deleteAllGroups();
    });

    it('shows no icon color for new group', async () => {
        // select GB on the oncotree pie chart
        const cancertypeGbPie = await getNthElements(oncotreePies, 2);
        await cancertypeGbPie.click();

        // open group menu and create group from selected samples
        await openGroupsMenu();
        await clickElement(createNewGroupButton);
        await clickElement(finalizeGroupButton);

        // check color
        await (await getElement(gbGroupColorIconRect)).waitForExist();
        const GroupGbColorIcon = await getElement(gbGroupColorIconRect);
        assert.strictEqual(
            await GroupGbColorIcon.getAttribute('fill'),
            '#FFFFFF'
        );
    });

    it('shows new color in icon when new color is selected', async () => {
        // open color picker and select blue
        await setDropdownOpen(true, gbGroupColorIcon, colorPickerBlue);
        await clickElement(colorPickerBlue);
        await (await getElement(gbGroupColorIconBlue)).waitForExist();
        // check the color icon
        const GroupGbColorIcon = await getElement(gbGroupColorIconRect);
        assert.strictEqual(
            await GroupGbColorIcon.getAttribute('fill'),
            '#2986e2'
        );
    });

    it('selects no color after pressing same color', async () => {
        await setDropdownOpen(true, gbGroupColorIcon, colorPickerBlue);
        // unselect blue and check the color icon
        await clickElement(colorPickerBlue);
        await (await getElement(gbGroupColorIconEmpty)).waitForExist();
        const groupGBColorIcon = await getElement(gbGroupColorIconRect);
        assert.strictEqual(
            await groupGBColorIcon.getAttribute('fill'),
            '#FFFFFF'
        );
    });

    it('warns of same color in groups selected for comparison', async () => {
        // close the color picker and group menu
        await setDropdownOpen(false, gbGroupColorIcon, colorPickerBlue);
        await closeGroupsMenu();

        // unselect previous oncotree code and select another
        await (await getNthElements(oncotreePies, 2)).click();
        await (await getNthElements(oncotreePies, 1)).click();

        // create a group for it
        openGroupsMenu();

        await clickElement(createNewGroupButton);
        await clickElement(finalizeGroupButton);

        // select same color for both groups

        await browser.waitUntil(async () => (await $$(colorIcon)).length === 2);

        // select both groups
        await (await getNthElements(groupCheckboxes, 0)).click();
        await (await getNthElements(groupCheckboxes, 1)).click();

        await setDropdownOpen(true, gbGroupColorIcon, colorPickerBlue);
        await clickElement(colorPickerBlue);
        // close color picker 0 before going to next one
        await setDropdownOpen(false, gbGroupColorIcon, colorPickerBlue);
        await setDropdownOpen(
            true,
            await getNthElements(colorIcon, 1),
            colorPickerBlue
        );
        await clickElement(colorPickerBlue);

        // assert that warning sign exists

        await (await getElement(warningSign)).waitForExist();
        assert(await (await getElement(warningSign)).isExisting());
    });

    it('does not warn of same color when one of groups is not selected for comparison', async () => {
        // unselect one group for comparison
        await clickElement(groupCheckboxes);
        // assert that there is no warning sign
        assert(!(await (await getElement(warningSign)).isExisting()));
    });

    it('shows default color for male/female groups', async () => {
        // create female group and check predefined color
        await clickElement(groupsMenuButton);
        const genderTypeGbPie = await getNthElements(genderPies, 1);
        await genderTypeGbPie.click();

        await openGroupsMenu();
        await clickElement(createNewGroupButton);
        await clickElement(finalizeGroupButton);

        await browser.waitUntil(
            async () => (await $$(colorIconRect)).length === 3
        );
        const GroupGbColorIcon = await getNthElements(colorIconRect, 2);
        assert.strictEqual(
            await GroupGbColorIcon.getAttribute('fill'),
            '#E0699E'
        );
    });

    it('shows undefined color when two groups with predefined colors are selected', async () => {
        // select living on overall survival chart (female is already selected from previous test)
        await clickElement(groupsMenuButton);
        const survivalLivingPie = await getNthElements(survivalPies, 1);

        await survivalLivingPie.click();
        // create living female group and check there is no color
        await openGroupsMenu();
        await clickElement(createNewGroupButton);
        await clickElement(finalizeGroupButton);

        await browser.waitUntil(
            async () => (await $$(colorIconRect)).length === 4
        );
        const livingFemaleColorIcon = await getNthElements(colorIconRect, 2);
        assert.strictEqual(
            await livingFemaleColorIcon.getAttribute('fill'),
            '#FFFFFF'
        );
    });

    it('stores group colors in study view user session', async () => {
        // refresh the page and check if color is still present
        await browser.refresh();
        await (await getElement(groupsMenuButton)).waitForExist();
        await clickElement(groupsMenuButton);
        await (await getElement(colorIconRect)).waitForExist();
        assert.strictEqual(
            await (await getElement(colorIconRect)).getAttribute('fill'),
            '#2986e2'
        );
    });

    it('uses custom colors in group comparison view', async () => {
        // compare first 2 groups (GB and OAST) after changing the color of OAST

        // select GB and OAST groups
        await (await getNthElements(groupCheckboxes, 0)).click();
        await (await getNthElements(groupCheckboxes, 1)).click();

        // GB group remains blue; OAST becomes green
        await (await getNthElements(colorIcon, 1)).click();
        await clickElement(colorPickerGreen);

        // open comparison tab
        const studyViewTabId = (await browser.getWindowHandles())[0];
        await clickElement(compareButton);
        await browser.waitUntil(
            async () => (await browser.getWindowHandles()).length > 1
        ); // wait until new tab opens
        const groupComparisonTabId = (await browser.getWindowHandles()).find(
            id => id !== studyViewTabId
        );
        await browser.switchToWindow(groupComparisonTabId);
        await waitForGroupComparisonTabOpen();

        // check that selected colors are used
        assert(
            (
                await (await getElement(gbGroupButton)).getAttribute('style')
            ).includes('background-color: rgb(41, 134, 226)')
        );
        assert(
            (
                await (await getElement(oastGroupButton)).getAttribute('style')
            ).includes('background-color: rgb(16, 150, 24);')
        );
    });

    const openGroupsMenu = async () => {
        await setDropdownOpen(true, groupsMenuButton, createNewGroupButton);
    };
    const closeGroupsMenu = async () => {
        await setDropdownOpen(false, groupsMenuButton, createNewGroupButton);
    };
    const deleteAllGroups = async () => {
        await openGroupsMenu();
        try {
            await (
                await getElement('[data-test="deleteGroupButton"]')
            ).waitForExist();
            for (const button of await $$('[data-test="deleteGroupButton"]')) {
                await button.click();
            }
        } catch (e) {
            // no groups to delete
        }
        await closeGroupsMenu();
    };
});
