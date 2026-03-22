import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';
import { VAFPlot, MutationFrequenciesBySample } from './VAFPlot';
import { IKeyedIconData } from '../genomicOverview/GenomicOverviewUtils';
import { DefaultTooltip, isWebdriver } from 'cbioportal-frontend-commons';

export type IThumbnailExpandVAFPlotProps = {
    data: MutationFrequenciesBySample;
    order?: { [s: string]: number };
    colors?: { [s: string]: string };
    labels?: { [s: string]: string };
    thumbnailWidth?: number;
    thumbnailHeight?: number;
    overlayPlacement?: string;
    tooltip?: JSX.Element;
    cssClass?: string;
    genePanelIconData?: IKeyedIconData;
    thumbnailComponent?: JSX.Element;
};

export class ThumbnailExpandVAFPlot extends React.Component<
    IThumbnailExpandVAFPlotProps,
    {}
> {
    public static defaultProps = {
        order: {},
        colors: {},
        labels: {},
        overlayPlacement: 'left',
    };

    get thumbnailPlotProps() {
        return {
            data: this.props.data,
            colors: this.props.colors,
            order: this.props.order,
            show_controls: false,
            nolegend: true,
            width: this.props.thumbnailWidth || 64,
            height: this.props.thumbnailHeight || 64,
            label_font_size: '6.5px',
            xticks: 0,
            yticks: 0,
            margin_bottom: 15,
        };
    }

    get expandedPlotProps() {
        return {
            data: this.props.data,
            colors: this.props.colors,
            labels: this.props.labels,
            order: this.props.order,
            show_controls: true,
            nolegend: false,
            init_show_histogram: true,
            init_show_curve: true,
            genepanel_icon_data: this.props.genePanelIconData,
        };
    }

    render() {
        const expandedPlot = <VAFPlot {...this.expandedPlotProps} />;
        return (
            <DefaultTooltip
                placement={this.props.overlayPlacement}
                trigger={['hover', 'focus']}
                overlay={
                    this.props.tooltip ? (
                        <>
                            {this.props.tooltip} {expandedPlot}
                        </>
                    ) : (
                        expandedPlot
                    )
                }
                arrowContent={<div className="rc-tooltip-arrow-inner" />}
                destroyTooltipOnHide={false}
                mouseLeaveDelay={isWebdriver() ? 2 : 0.05}
            >
                <span className={this.props.cssClass || ''}>
                    {this.props.thumbnailComponent ? (
                        this.props.thumbnailComponent
                    ) : (
                        <VAFPlot {...this.thumbnailPlotProps} />
                    )}
                </span>
            </DefaultTooltip>
        );
    }
}
