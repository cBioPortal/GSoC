import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { IOncoprintProps } from 'shared/components/oncoprint/Oncoprint';
import { DataUnderMouse } from 'shared/components/oncoprint/makeGeneticTrackTooltip';

export type CustomJsFunctions = {
    createCustomOncoprintTooltip?: (
        oncoprintProps: IOncoprintProps,
        dataUnderMouse: DataUnderMouse
    ) => string;
};

export default function getCustomJsFunctions(): CustomJsFunctions {
    if (!getBrowserWindow().customJsFunctions) {
        getBrowserWindow().customJsFunctions = {};
    }
    return getBrowserWindow().customJsFunctions;
}

// expose functions to dynamically loaded js:
const win = window as any;
win.getBrowserWindow = getBrowserWindow;
win.getCustomJsFunctions = getCustomJsFunctions;
