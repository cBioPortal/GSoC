import * as React from 'react';
import ProteinChainView from './ProteinChainView';
import PdbChainTable from './PdbChainTable';
import { observer } from 'mobx-react';
import {
    computed,
    observable,
    action,
    IReactionDisposer,
    reaction,
    makeObservable,
} from 'mobx';
import { ProteinChainSpec } from './ProteinChainView';
import { Collapse } from 'react-collapse';
import { HitZone, DefaultTooltip } from 'cbioportal-frontend-commons';
import MutationMapperStore from 'shared/components/mutationMapper/MutationMapperStore';
import { ALIGNMENT_GAP, IPdbChain } from '../../model/Pdb';
import PdbHeaderCache from '../../cache/PdbHeaderCache';
import PdbChainInfo from '../PdbChainInfo';
import onNextRenderFrame from 'shared/lib/onNextRenderFrame';

type ProteinChainPanelProps = {
    store: MutationMapperStore;
    geneWidth: number;
    geneXOffset?: number;
    maxChainsHeight: number;
    pdbHeaderCache?: PdbHeaderCache;
};

@observer
export default class ProteinChainPanel extends React.Component<
    ProteinChainPanelProps,
    {}
> {
    @observable private isExpanded: boolean = false;
    @observable private pdbChainTableShown: boolean = false;
    @observable private hoveredChain: IPdbChain | undefined;
    @observable hitZoneConfig: any = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        onClick: () => {},
    };

    private chainDiv: HTMLDivElement;
    private _chainScrollY: number = 0;

    private collapseTimeout: number | null = null;
    private expandTimeout: number | null = null;
    private chainUidToY: { [uid: string]: number } = {};
    private onChainSelectReaction: IReactionDisposer;

    private expandDelayMs = 750;
    private collapseDelayMs = 3000;

    private handlers: any;

    constructor(props: ProteinChainPanelProps) {
        super(props);

        makeObservable(this);

        this.handlers = {
            onMouseEnter: action(() => {
                this.expandTimeout = window.setTimeout(() => {
                    this.isExpanded = true;
                }, this.expandDelayMs);

                if (this.collapseTimeout) {
                    window.clearTimeout(this.collapseTimeout);
                }
            }),
            onMouseLeave: action(() => {
                this.collapseTimeout = window.setTimeout(() => {
                    this.isExpanded = false;
                }, this.collapseDelayMs);

                if (this.expandTimeout) {
                    window.clearTimeout(this.expandTimeout);
                }
            }),
            chainDivRef: (div: HTMLDivElement) => {
                this.chainDiv = div;
            },
            onChainScroll: () => {
                if (this.chainDiv && this.isExpanded) {
                    this._chainScrollY = this.chainDiv.scrollTop;
                }
            },
            togglePDBTable: action(() => {
                this.pdbChainTableShown = !this.pdbChainTableShown;
            }),
            getTooltipContent: () => {
                if (this.hoveredChain) {
                    return (
                        <PdbChainInfo
                            pdbId={this.hoveredChain.pdbId}
                            chainId={this.hoveredChain.chain}
                            cache={this.props.pdbHeaderCache}
                        />
                    );
                } else {
                    return null;
                }
            },
            setHitZone: (
                hitRect: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                },
                chainUid: string
            ) => {
                this.hitZoneConfig.x = hitRect.x;
                this.hitZoneConfig.y = hitRect.y;
                this.hitZoneConfig.width = hitRect.width;
                this.hitZoneConfig.height = hitRect.height;
                this.hitZoneConfig.onClick = () => {
                    this.selectChain(chainUid);
                };
                this.hoveredChain = this.props.store.pdbChainDataStore.getPdbChain(
                    chainUid
                );
            },
            setChainUidToY: (chainUidToY: { [uid: string]: number }) => {
                this.chainUidToY = chainUidToY;
            },
        };
        this.onChainSelectReaction = reaction(
            () => this.props.store.pdbChainDataStore.selectedUid,
            (selectedUid: string) => {
                const chainY = this.chainUidToY[selectedUid];
                if (
                    typeof chainY !== 'undefined' &&
                    (chainY < this.chainDiv.scrollTop ||
                        chainY >
                            this.chainDiv.scrollTop +
                                this.props.maxChainsHeight)
                ) {
                    const halfChainsHeight = this.props.maxChainsHeight / 2;
                    this.chainDiv.scrollTop = chainY - halfChainsHeight;
                }
            }
        );
    }

    componentWillUnmount() {
        this.onChainSelectReaction();
    }

    @computed get chainScrollY() {
        if (this.isExpanded) {
            return this._chainScrollY;
        } else {
            return 0;
        }
    }

    @action private selectChain(chainUid: string) {
        this.props.store.pdbChainDataStore.selectUid(chainUid);
    }

    @computed private get isOpen() {
        return !!this.props.store.pdbChainDataStore.selectedChain;
    }

    @computed private get displayChains(): IPdbChain[] {
        if (!this.props.store.pdbChainDataStore.selectedChain) {
            return [];
        } else if (!this.isExpanded) {
            return [this.props.store.pdbChainDataStore.selectedChain];
        } else {
            return this.props.store.pdbChainDataStore.allData;
        }
    }

    @computed get chains(): ProteinChainSpec[] {
        return this.displayChains.map((pdbChain: IPdbChain) => {
            const gaps = [];
            let gapStart = -1;
            const alignment = pdbChain.alignment;
            for (let i = 0; i < alignment.length; i++) {
                if (alignment[i] === ALIGNMENT_GAP) {
                    if (gapStart === -1) {
                        gapStart = i;
                    }
                } else {
                    if (gapStart !== -1) {
                        gaps.push({
                            start: pdbChain.uniprotStart + gapStart,
                            end: pdbChain.uniprotStart + i,
                        });
                        gapStart = -1;
                    }
                }
            }
            return {
                start: pdbChain.uniprotStart,
                end: pdbChain.uniprotEnd + 1,
                gaps,
                opacity: pdbChain.identityPerc,
                uid: this.props.store.pdbChainDataStore.getChainUid(pdbChain),
            };
        });
    }

    @computed get proteinLength() {
        const proteinLength =
            (this.props.store.canonicalTranscript.result &&
                this.props.store.canonicalTranscript.result.proteinLength) ||
            0;
        return Math.max(proteinLength, 1);
    }

    @computed get tooltipVisible() {
        return this.handlers.getTooltipContent() !== null;
    }

    @computed get hitZone() {
        return (
            <HitZone
                x={this.hitZoneConfig.x}
                y={this.hitZoneConfig.y}
                width={this.hitZoneConfig.width}
                height={this.hitZoneConfig.height}
                onClick={this.hitZoneConfig.onClick}
                cursor="pointer"
            />
        );
    }

    componentDidMount() {
        onNextRenderFrame(() =>
            this.props.store.pdbChainDataStore.selectFirstChain()
        );
    }

    componentDidUpdate() {
        onNextRenderFrame(() => {
            if (this.chainDiv) {
                this.chainDiv.scrollTop = this.chainScrollY;
            }
        });
    }

    public helpTooltipContent() {
        return (
            <div style={{ maxWidth: 400 }}>
                This panel displays a list of PDB chains for the corresponding
                uniprot ID. PDB chains are ranked with respect to their sequence
                similarity ratio, and aligned to the y-axis of the mutation
                diagram. Highly ranked chains have darker color than the lowly
                ranked ones.
                <br />
                <br />
                Each chain is represented by a single rectangle. Gaps within the
                chains are represented by a thin line connecting the segments of
                the chain.
                <br />
                <br />
                By default, only a first few rows are displayed. To see more
                chains, use the scroll bar next to the panel. To see the
                detailed list of all available PDB chains in a table click on
                the link below the panel.
                <br />
                <br />
                To select a chain, simply click on it. Selected chain is
                highlighted with a different frame color. You can also select a
                chain by clicking on a row in the table. Selecting a chain
                reloads the PDB data for the 3D structure visualizer.
            </div>
        );
    }

    render() {
        const tooltipVisibleProps: any = {};
        if (!this.tooltipVisible) {
            tooltipVisibleProps.visible = false;
        }
        return (
            <div
                onMouseEnter={this.handlers.onMouseEnter}
                onMouseLeave={this.handlers.onMouseLeave}
            >
                <Collapse isOpened={this.isOpen}>
                    <div
                        style={{
                            position: 'relative',
                        }}
                    >
                        <div className="small" style={{ position: 'absolute' }}>
                            {/* Place holder for a possible PDB icon, for now manually aligning with a margin */}
                            <span style={{ marginLeft: 16 }}>PDB Chains</span>
                            <DefaultTooltip
                                placement="left"
                                overlay={this.helpTooltipContent}
                                destroyTooltipOnHide={true}
                            >
                                <i
                                    className="fa fa-info-circle"
                                    style={{ paddingLeft: 3 }}
                                />
                            </DefaultTooltip>
                        </div>
                        <div
                            ref={this.handlers.chainDivRef}
                            style={{
                                overflowY: 'scroll',
                                maxHeight: this.props.maxChainsHeight,
                                marginLeft: this.props.geneXOffset,
                                position: 'relative',
                            }}
                            onScroll={this.handlers.onChainScroll}
                        >
                            <ProteinChainView
                                width={this.props.geneWidth}
                                chains={this.chains}
                                proteinLength={this.proteinLength}
                                setHitZone={this.handlers.setHitZone}
                                selectedChainUid={
                                    this.props.store.pdbChainDataStore
                                        .selectedUid
                                }
                                setChainUidToY={this.handlers.setChainUidToY}
                            />
                            <DefaultTooltip
                                placement="top"
                                overlay={this.handlers.getTooltipContent}
                                {...tooltipVisibleProps}
                            >
                                {this.hitZone}
                            </DefaultTooltip>
                        </div>
                        <br />
                        <div
                            style={{
                                display: this.isExpanded ? 'inherit' : 'none',
                            }}
                        >
                            <button
                                onClick={this.handlers.togglePDBTable}
                                className="btn btn-default"
                            >
                                {this.pdbChainTableShown
                                    ? 'Hide PDB Chain Table'
                                    : 'Show PDB Chain Table'}
                            </button>
                            <div
                                style={{
                                    display: this.pdbChainTableShown
                                        ? 'inherit'
                                        : 'none',
                                    maxWidth: this.props.geneWidth,
                                }}
                            >
                                <PdbChainTable
                                    dataStore={
                                        this.props.store.pdbChainDataStore
                                    }
                                    cache={this.props.pdbHeaderCache}
                                />
                            </div>
                        </div>
                        <br />
                    </div>
                </Collapse>
            </div>
        );
    }
}
