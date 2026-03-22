import * as React from 'react';
import { map } from 'lodash';
import { computed, makeObservable } from 'mobx';
import SampleManager from 'pages/patientView/SampleManager';
import { ClinicalDataBySampleId } from 'cbioportal-ts-api-client';
import TumorColumnFormatter from 'pages/patientView/mutation/column/TumorColumnFormatter';
import autobind from 'autobind-decorator';

interface PanelColumnFormatterProps {
    data: { sampleId: string; entrezGeneId: number }[];
    sampleToGenePanelId: { [sampleId: string]: string | undefined };
    sampleManager: SampleManager | null;
    genePanelIdToGene: { [genePanelId: string]: number[] };
    onSelectGenePanel?: (name: string) => void;
}

export class GenePanelLinks extends React.Component<PanelColumnFormatterProps> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @autobind handleClick(genePanelId: string | undefined) {
        if (this.props.onSelectGenePanel && genePanelId) {
            this.props.onSelectGenePanel(genePanelId);
        }
    }

    @computed get renderGenePanelLinks() {
        const genePanelIds = getGenePanelIds(this.props);
        const links: (string | JSX.Element)[] = [];
        genePanelIds.forEach((genePanel, index) => {
            if (genePanel && genePanel !== 'N/A') {
                links.push(
                    <a onClick={() => this.handleClick(genePanel)}>
                        {genePanel}
                    </a>
                );
            } else {
                links.push(genePanel);
            }
            if (index < genePanelIds.length - 1) {
                links.push(', ');
            }
        });
        return links;
    }

    render() {
        return <React.Fragment>{this.renderGenePanelLinks}</React.Fragment>;
    }
}

class PanelColumn extends React.Component<PanelColumnFormatterProps, {}> {
    constructor(props: PanelColumnFormatterProps) {
        super(props);
    }

    render() {
        const { sampleToGenePanelId, sampleManager } = this.props;
        if (!sampleToGenePanelId || !sampleManager) return;

        if (sampleToGenePanelId && !Object.keys(sampleToGenePanelId).length) {
            return <i className="fa fa-spinner fa-pulse" />;
        }

        return (
            <div style={{ position: 'relative' }}>
                <ul
                    style={{ marginBottom: 0 }}
                    className="list-inline list-unstyled"
                >
                    <GenePanelLinks {...this.props} />
                </ul>
            </div>
        );
    }
}

const getGenePanelIds = (
    props: PanelColumnFormatterProps,
    ignoreUnprofiledGenePanelIds?: boolean
) => {
    const {
        data,
        sampleToGenePanelId,
        sampleManager,
        genePanelIdToGene,
    } = props;
    if (sampleToGenePanelId && sampleManager) {
        const samples = sampleManager.samples;
        const sampleIds = map(
            samples,
            (sample: ClinicalDataBySampleId) => sample.id
        );
        const entrezGeneId = data[0].entrezGeneId;
        const mutatedSamples = TumorColumnFormatter.getPresentSamples(data);
        const profiledSamples = TumorColumnFormatter.getProfiledSamplesForGene(
            entrezGeneId,
            sampleIds,
            sampleToGenePanelId,
            genePanelIdToGene
        );

        const genePanelsIds = samples.map(sample => {
            const isMutated = sample.id in mutatedSamples;
            const isProfiled =
                sample.id in profiledSamples && profiledSamples[sample.id];
            if (
                (ignoreUnprofiledGenePanelIds && !isProfiled) ||
                (isProfiled && !isMutated)
            ) {
                return '';
            }
            return sampleToGenePanelId[sample.id] || 'N/A';
        });

        return genePanelsIds.filter(id => id);
    }
    return [];
};

export default {
    renderFunction: (props: PanelColumnFormatterProps) => (
        <PanelColumn
            data={props.data}
            sampleToGenePanelId={props.sampleToGenePanelId}
            sampleManager={props.sampleManager}
            genePanelIdToGene={props.genePanelIdToGene}
            onSelectGenePanel={props.onSelectGenePanel}
        />
    ),
    // Exclude not profiled gene panel ids for download
    download: (props: PanelColumnFormatterProps) =>
        getGenePanelIds(props, true).join(','),
    getGenePanelIds,
};
