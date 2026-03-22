import { observable, makeObservable } from 'mobx';

import { makeTooltipMouseEvents } from '../../lib/PlotUtils';

export class ScatterPlotTooltipHelper {
    @observable.ref tooltipModel: any = null;
    @observable pointHovered: boolean = false;

    constructor() {
        makeObservable(this);
    }

    public get mouseEvents() {
        return makeTooltipMouseEvents(this);
    }
}
