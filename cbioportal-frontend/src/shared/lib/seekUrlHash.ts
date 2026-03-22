import { getBrowserWindow } from 'cbioportal-frontend-commons';

// this is the only way to solve issue in SPA where content doesn't exist when URL changes
// thus anchors corresponding to url hash may not be in DOM to scroll to

function getElement(id: string) {
    const eltById = document.getElementById(id);
    if (eltById) {
        return eltById;
    }

    const eltsByName = document.getElementsByName(id);
    if (eltsByName.length > 0) {
        return eltsByName.item(0);
    }

    return null;
}

export function seekUrlHash(id: string) {
    let counter = 0;
    let limit = 50;
    let pollInterval = 100;
    let interval = setInterval(() => {
        if (getElement(id)) {
            // The browser won't scroll to the element if it
            //  doesn't exist when the page first loads.
            // So let's just keep checking if it loads and
            //  scroll to it when it appears.
            getElement(id)?.scrollIntoView();
            clearInterval(interval);
        }
        // bail if we reach reasonable limit
        if (counter >= limit) {
            clearInterval(interval);
        } else {
            counter++;
        }
    }, pollInterval);
}
