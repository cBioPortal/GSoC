import * as React from 'react';
import { ProteinChainSpec } from './ProteinChainView';
import { observer } from 'mobx-react';
import { observable, computed, makeObservable } from 'mobx';
import _ from 'lodash';

type ProteinChainProps = ProteinChainSpec & {
    positionToX: (pos: number) => number;
    y: number;
    height: number;
    uniqueHitZoneClassName: string;
    highlighted?: boolean;
};

@observer
export default class ProteinChain extends React.Component<
    ProteinChainProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @computed get segmentsAndGaps(): {
        gap: boolean;
        start: number;
        end: number;
    }[] {
        const ret = [];
        const sortedGaps = _.sortBy(this.props.gaps, gap => gap.start);
        if (sortedGaps.length === 0) {
            ret.push({
                gap: false,
                start: this.props.start,
                end: this.props.end,
            });
        } else {
            if (sortedGaps[0].start > this.props.start) {
                ret.push({
                    gap: false,
                    start: this.props.start,
                    end: sortedGaps[0].start,
                });
            }
            ret.push({
                gap: true,
                start: sortedGaps[0].start,
                end: sortedGaps[0].end,
            });
            for (let i = 1; i < sortedGaps.length; i++) {
                ret.push({
                    gap: false,
                    start: sortedGaps[i - 1].end,
                    end: sortedGaps[i].start,
                });
                ret.push({
                    gap: true,
                    start: sortedGaps[i].start,
                    end: sortedGaps[i].end,
                });
            }
            const lastGap = sortedGaps[sortedGaps.length - 1];
            if (lastGap.end < this.props.end) {
                ret.push({
                    gap: false,
                    start: lastGap.end,
                    end: this.props.end,
                });
            }
        }
        return ret;
    }

    render() {
        return (
            <g key={this.props.uniqueHitZoneClassName}>
                {this.segmentsAndGaps.map(obj => {
                    if (obj.gap) {
                        return (
                            <line
                                stroke="#666666"
                                strokeWidth="0.5"
                                x1={this.props.positionToX(obj.start)}
                                x2={this.props.positionToX(obj.end)}
                                y1={this.props.y + this.props.height / 2}
                                y2={this.props.y + this.props.height / 2}
                            />
                        );
                    } else {
                        return (
                            <rect
                                fill="#3366cc"
                                fillOpacity={this.props.opacity}
                                stroke="#666666"
                                strokeWidth="0.5"
                                x={this.props.positionToX(obj.start)}
                                y={this.props.y}
                                width={
                                    this.props.positionToX(obj.end) -
                                    this.props.positionToX(obj.start)
                                }
                                height={this.props.height}
                            />
                        );
                    }
                })}
                <rect
                    stroke="#FF9900"
                    strokeWidth="2"
                    fillOpacity="0"
                    strokeOpacity={+!!this.props.highlighted}
                    height={this.props.height}
                    width={
                        this.props.positionToX(this.props.end) -
                        this.props.positionToX(this.props.start)
                    }
                    x={this.props.positionToX(this.props.start)}
                    y={this.props.y}
                    className={this.props.uniqueHitZoneClassName}
                />
            </g>
        );
    }
}
