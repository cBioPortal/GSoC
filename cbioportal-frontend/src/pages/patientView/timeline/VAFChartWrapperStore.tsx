import { action, computed, observable, makeObservable } from 'mobx';
import { getServerConfig } from 'config/config';

export default class VAFChartWrapperStore {
    @observable groupByOption: string | null = null;

    @observable _showSequentialMode: boolean = getServerConfig()
        .vaf_sequential_mode_default;

    @computed
    get showSequentialMode() {
        return this.isOnlySequentialModePossible || this._showSequentialMode;
    }

    @observable onlyShowSelectedInVAFChart: boolean | undefined = undefined;

    @observable vafChartLogScale: boolean = getServerConfig()
        .vaf_log_scale_default;

    @observable vafChartYAxisToDataRange: boolean | undefined = undefined;

    @observable minYAxisToDataRange: number = 0;

    @observable maxYAxisToDataRange: number = 0;

    @observable dataHeight: number = 200;

    @action
    setGroupByOption(value: string) {
        this.groupByOption = value;
    }

    @action
    setShowSequentialMode(value: boolean) {
        this._showSequentialMode = value;
    }

    @action
    setOnlyShowSelectedInVAFChart(value: boolean) {
        this.onlyShowSelectedInVAFChart = value;
    }

    @action
    setVafChartLogScale(value: boolean) {
        this.vafChartLogScale = value;
    }

    @action
    setVafChartYAxisToDataRange(value: boolean) {
        this.vafChartYAxisToDataRange = value;
    }

    @computed get groupingByIsSelected() {
        return !(this.groupByOption == null || this.groupByOption === 'None');
    }

    @computed get isOnlySequentialModePossible() {
        return !!(
            this.options &&
            this.options.isOnlySequentialModeAvailable &&
            this.options.isOnlySequentialModeAvailable()
        );
    }

    constructor(
        private options?: { isOnlySequentialModeAvailable?: () => boolean }
    ) {
        makeObservable(this);
    }
}
