import * as React from 'react';
import { GenePanel } from 'cbioportal-ts-api-client';
import { observer } from 'mobx-react';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';
import GenePanelModal from 'shared/components/GenePanelModal/GenePanelModal';

interface IStudyViewGeneModalProps {
    genePanelCache: MobxPromiseCache<{ genePanelId: string }, GenePanel>;
    panelName: string;
    show: boolean;
    onHide: () => void;
}

interface IGenePanelTooltipProps {
    genePanelIds: string[];
    toggleModal: (panelId: string) => void;
}

export const GenePanelList: React.FunctionComponent<IGenePanelTooltipProps> = ({
    genePanelIds,
    toggleModal,
}) => {
    if (genePanelIds.length > 0) {
        return (
            <span style={{ maxWidth: 400 }}>
                Gene panels:{' '}
                {genePanelIds.map((genePanelId, i) => [
                    i > 0 && ', ',
                    <a
                        key={genePanelId}
                        data-test={`gene-panel-linkout-${genePanelId}`}
                        href="#"
                        onClick={() => {
                            toggleModal(genePanelId);
                        }}
                    >
                        {genePanelId}
                    </a>,
                ])}
            </span>
        );
    } else {
        return <span>Gene panels: none</span>;
    }
};

@observer
export class StudyViewGenePanelModal extends React.Component<
    IStudyViewGeneModalProps,
    {}
> {
    getGenesList = (result: GenePanel | undefined) => {
        if (result && result.genes) {
            return result.genes.map(gene => (
                <p key={gene.entrezGeneId}>{gene.hugoGeneSymbol}</p>
            ));
        }
        return null;
    };

    render() {
        const mobxPromise = this.props.genePanelCache.get({
            genePanelId: this.props.panelName,
        });
        return (
            <GenePanelModal
                panelName={this.props.panelName}
                show={this.props.show}
                onHide={this.props.onHide}
                isLoading={mobxPromise.isPending}
            >
                {mobxPromise.isComplete &&
                    this.getGenesList(mobxPromise.result)}
            </GenePanelModal>
        );
    }
}
