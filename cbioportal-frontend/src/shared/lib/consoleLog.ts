import { getBrowserWindow } from 'cbioportal-frontend-commons';

const win = getBrowserWindow();

export function log(...args: any[]) {
    if (win.localStorage.debug) {
        if (win.greplog && typeof args[0] === 'string') {
            if (new RegExp(win.greplog).test(args[0])) {
                console.log.apply(this, args);
            }
        } else {
            console.log.apply(this, args);
        }
    }
}
