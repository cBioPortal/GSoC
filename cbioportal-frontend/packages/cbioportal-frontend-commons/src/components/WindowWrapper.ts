import autobind from 'autobind-decorator';
import _ from 'lodash';
import { action, makeObservable, observable } from 'mobx';
import { isWebdriver } from '../lib/webdriverUtils';

export interface WindowSize {
    width: number;
    height: number;
}

export default class WindowWrapper {
    @observable public size: WindowSize = { width: 0, height: 0 };

    private handleWindowResize: () => void;
    private windowObj: any;

    constructor() {
        makeObservable(this);
        if (typeof window === 'object') {
            this.windowObj = window;
            this.setWindowSize();
            this.handleWindowResize = isWebdriver()
                ? this.setWindowSize
                : _.debounce(this.setWindowSize, 500);
            this.windowObj.addEventListener('resize', this.handleWindowResize);
        }
    }

    @action.bound
    private setWindowSize() {
        this.size = {
            width: this.windowObj.innerWidth,
            height: this.windowObj.innerHeight,
        };
    }

    @autobind
    public getWindowWidth() {
        return this.size.width;
    }

    @autobind
    public getWindowHeight() {
        return this.size.height;
    }
}
