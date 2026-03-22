import { WindowWrapper } from 'cbioportal-frontend-commons';

let windowInstance: WindowWrapper | undefined;

export function getDefaultWindowInstance() {
    if (!windowInstance) {
        windowInstance = new WindowWrapper();
    }

    return windowInstance;
}
