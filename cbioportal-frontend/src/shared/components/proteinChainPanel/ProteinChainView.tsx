import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, observable, action, makeObservable } from 'mobx';
import HotspotSet from '../../lib/HotspotSet';
import _ from 'lodash';
import { SyntheticEvent } from 'react';
import ProteinChain from './ProteinChain';

export type ProteinChainSpec = {
    start: number;
    end: number;
    gaps: { start: number; end: number }[];
    opacity: number;
    uid: string;
};

type ProteinChainViewProps = {
    selectedChainUid: string;
    chains: ProteinChainSpec[];
    width: number;
    proteinLength: number;
    setHitZone?: (
        hitRect: { x: number; y: number; width: number; height: number },
        chainUid: string
    ) => void;
    setChainUidToY?: (map: { [uid: string]: number }) => void;
};

const CHAIN_ID_PREFIX = 'chain-';
@observer
export default class ProteinChainView extends React.Component<
    ProteinChainViewProps,
    {}
> {
    @observable private rowHeight = 6;
    @observable private rowPadding = 3;
    private chainComponents: { [id: string]: ProteinChain } = {};

    @computed get rowSpecs(): ProteinChainSpec[][] {
        // Greedily add chains to rows, checking overlap using HotspotSet - if overlap, bump to next row
        const ret: ProteinChainSpec[][] = [[]];
        const overlapSets: HotspotSet[] = [new HotspotSet()];
        for (const chain of this.props.chains) {
            let chosenRow = _.findIndex(
                overlapSets,
                set => !set.check(chain.start, chain.end)
            ); // first row that can accomodate it
            if (chosenRow === -1) {
                chosenRow = ret.length;
                ret.push([]);
                overlapSets.push(new HotspotSet());
            }
            ret[chosenRow].push(chain);
            overlapSets[chosenRow].add(chain.start, chain.end);
        }
        return ret;
    }

    constructor(props: ProteinChainViewProps) {
        super(props);
        makeObservable(this);
        this.onMouseOver = this.onMouseOver.bind(this);
        this.positionToX = this.positionToX.bind(this);
    }

    private positionToX(position: number) {
        return (position * this.props.width) / this.props.proteinLength;
    }

    private makeChainIdClass(counter: number) {
        return `${CHAIN_ID_PREFIX}${counter}`;
    }
    private getChainId(classes: string): string | null {
        const match = classes
            .split(/[\s]+/g)
            .map(c => c.match(new RegExp(`^(${CHAIN_ID_PREFIX}.*)$`)))
            .find(x => x !== null);
        return (match && match[1]) || null;
    }

    private chainY(rowIndex: number) {
        return rowIndex * (this.rowHeight + this.rowPadding);
    }

    @computed get rows() {
        let chainCounter = 0;
        this.chainComponents = {};
        const chainUidToY: { [uid: string]: number } = {};

        const ret = this.rowSpecs.map((rowSpec, rowIndex) => {
            return (
                <g key={rowIndex}>
                    {rowSpec.map(chain => {
                        const className = this.makeChainIdClass(chainCounter++);
                        const uid = chain.uid;
                        const y = this.chainY(rowIndex);
                        chainUidToY[uid] = y;
                        return (
                            <ProteinChain
                                ref={proteinChain => {
                                    if (proteinChain !== null) {
                                        this.chainComponents[
                                            className
                                        ] = proteinChain;
                                    }
                                }}
                                positionToX={this.positionToX}
                                y={y}
                                height={this.rowHeight}
                                uniqueHitZoneClassName={className}
                                start={chain.start}
                                end={chain.end}
                                gaps={chain.gaps}
                                opacity={chain.opacity}
                                uid={uid}
                                highlighted={
                                    this.props.selectedChainUid === chain.uid
                                }
                            />
                        );
                    })}
                </g>
            );
        });
        this.props.setChainUidToY && this.props.setChainUidToY(chainUidToY);
        return ret;
    }

    @computed get svgHeight(): number {
        return (
            this.rows.length * this.rowHeight +
            (this.rows.length - 1) * this.rowPadding
        );
    }

    private onMouseOver(e: SyntheticEvent<any>) {
        const target = e.target as SVGElement;
        const className = target.getAttribute('class') || '';
        const chainId = this.getChainId(className);
        if (chainId !== null) {
            const chainComponent = this.chainComponents[chainId];
            if (chainComponent && this.props.setHitZone) {
                this.props.setHitZone(
                    {
                        x: parseInt(target.getAttribute('x') || '0', 10),
                        y: parseInt(target.getAttribute('y') || '0', 10),
                        width: parseInt(
                            target.getAttribute('width') || '0',
                            10
                        ),
                        height: parseInt(
                            target.getAttribute('height') || '0',
                            10
                        ),
                    },
                    chainComponent.props.uid
                );
            }
        }
    }

    render() {
        return (
            <div>
                <div onMouseOver={this.onMouseOver}>
                    <svg width={this.props.width} height={this.svgHeight}>
                        {this.rows}
                    </svg>
                </div>
            </div>
        );
    }
}
