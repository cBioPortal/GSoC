const {
    getElement,
    getNestedElement,
    clickElement,
    isDisplayed,
} = require('../../shared/specUtils_Async');

const clickColumnSelectionButton = async patientCnaTable => {
    await (
        await getNestedElement([
            `[data-test=${patientCnaTable}]`,
            'button*=Columns',
        ])
    ).click();
};

const selectColumn = async namespaceColumn1 => {
    await clickElement(`[data-id="${namespaceColumn1}"]`);
};

const waitForTable = async table => {
    await (await getElement(`[data-test=${table}]`)).waitForDisplayed();
};

const namespaceColumnsAreDisplayed = async columns => {
    for (const column of columns) {
        if (!(await isDisplayed(`//span[text()='${column}']`))) {
            return false;
        }
    }
    return true;
};

const namespaceColumnsAreNotDisplayed = async columns => {
    return !(await namespaceColumnsAreDisplayed(columns));
};

const getRowByGene = async (tableName, gene) => {
    const tableRows = await $$(`[data-test="${tableName}"] tr`);

    for (const row of tableRows) {
        const cell = await row.$(`td=${gene}`);
        if (await cell.isExisting()) {
            return row;
        }
    }

    return null;
};

module.exports = {
    getRowByGene,
    namespaceColumnsAreNotDisplayed,
    namespaceColumnsAreDisplayed,
    waitForTable,
    selectColumn,
    clickColumnSelectionButton,
};
