import _ from 'lodash';
import { computed } from 'mobx';
import * as React from 'react';
import { ClinicalDataBySampleId, Mutation } from 'cbioportal-ts-api-client';

import { ThumbnailExpandVAFPlot } from '../vafPlot/ThumbnailExpandVAFPlot';
import GenePanelManager from '../GenePanelManager';
import SampleManager from '../SampleManager';
import {
    computeMutationFrequencyBySample,
    doesFrequencyExist,
} from './GenomicOverviewUtils';

export interface ICompactVAFPlotProps {
    mergedMutations: Mutation[][];
    sampleManager: SampleManager;
    sampleIdToMutationGenePanelId?: { [sampleId: string]: string };
    sampleIdToCopyNumberGenePanelId?: { [sampleId: string]: string };
    thumbnailComponent?: JSX.Element;
    tooltip?: JSX.Element;
}

export class CompactVAFPlot extends React.Component<ICompactVAFPlotProps> {
    public static defaultProps: Partial<ICompactVAFPlotProps> = {
        thumbnailComponent: <i className="fa fa-bar-chart vafPlotThumbnail" />,
    };

    private genePanelManager: GenePanelManager;

    constructor(props: ICompactVAFPlotProps) {
        super(props);

        this.genePanelManager = new GenePanelManager(
            props.sampleIdToMutationGenePanelId,
            props.sampleIdToCopyNumberGenePanelId
        );
    }

    get sampleOrder() {
        return this.props.sampleManager?.sampleIndex || {};
    }

    get sampleColors() {
        return this.props.sampleManager?.sampleColors || {};
    }

    @computed get frequencies() {
        return computeMutationFrequencyBySample(
            this.props.mergedMutations,
            this.sampleOrder
        );
    }

    get vafPlotLabels() {
        return _.reduce(
            this.props.sampleManager?.samples,
            (result: any, sample: ClinicalDataBySampleId, i: number) => {
                result[sample.id] = i + 1;
                return result;
            },
            {}
        );
    }

    private shouldShowVAFPlot(): boolean {
        return this.props.mergedMutations.length > 0 && this.frequencyExists;
    }

    private get frequencyExists(): boolean {
        return doesFrequencyExist(this.frequencies);
    }

    public render() {
        return this.shouldShowVAFPlot() ? (
            <ThumbnailExpandVAFPlot
                data={this.frequencies}
                order={this.sampleOrder}
                colors={this.sampleColors}
                labels={this.vafPlotLabels}
                thumbnailComponent={this.props.thumbnailComponent}
                tooltip={this.props.tooltip}
                overlayPlacement="top"
                genePanelIconData={
                    this.genePanelManager.sampleIdToMutationGenePanelIconData
                }
            />
        ) : null;
    }
}
