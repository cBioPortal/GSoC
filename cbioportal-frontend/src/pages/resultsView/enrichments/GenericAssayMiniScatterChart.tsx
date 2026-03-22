import { GENERIC_ASSAY_CONFIG } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import {
    deriveDisplayTextFromGenericAssayType,
    formatGenericAssayCompactLabelByNameAndId,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import MiniScatterChart, { IMiniScatterChartProps } from './MiniScatterChart';
import { makeObservable } from 'mobx';
import autobind from 'autobind-decorator';

export interface IGenericAssayMiniScatterChartProps
    extends IMiniScatterChartProps {
    onGenericAssayEntityClick?: (stableId: string) => void;
    genericAssayType?: string;
}

export default class GenericAssayMiniScatterChart extends MiniScatterChart<
    IGenericAssayMiniScatterChartProps
> {
    constructor(props: IGenericAssayMiniScatterChartProps) {
        super(props);
        makeObservable(this);
    }

    @autobind protected handleSelectionCleared() {
        if (this.tooltipModel) {
            this.props.onGenericAssayEntityClick!(this.tooltipModel.stableId);
        }
        this.props.onSelectionCleared();
    }

    protected handleSelection(points: any, bounds: any, props: any) {
        this.props.onSelection(points[0].data.map((d: any) => d.stableId));
    }

    private get genericAssayEntityTitle() {
        if (this.props.genericAssayType) {
            return (
                GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
                    this.props.genericAssayType
                ]?.globalConfig?.entityTitle ||
                deriveDisplayTextFromGenericAssayType(
                    this.props.genericAssayType
                )
            );
        }
        return '';
    }

    protected get tooltipTitle() {
        return `${
            this.genericAssayEntityTitle
        }: ${formatGenericAssayCompactLabelByNameAndId(
            this.tooltipModel.stableId,
            this.tooltipModel.entityName
        )}`;
    }

    protected get scatterFillColorFunction() {
        return (datum: any) => {
            if (datum.stableId in this.props.selectedSet) {
                return '#FE9929';
            } else if (datum.qValue < 0.05) {
                return '#58ACFA';
            } else {
                return '#D3D3D3';
            }
        };
    }
}
