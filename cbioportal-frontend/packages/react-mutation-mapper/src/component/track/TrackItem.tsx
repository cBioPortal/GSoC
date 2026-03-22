import * as React from 'react';
import { computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import TrackCircle from './TrackCircle';
import TrackRect from './TrackRect';

type TrackItemProps = {
    x: number;
    y: number;
    dim1: number; // radius or width
    dim2?: number; // height if necessary
    hoverdim1?: number;
    hitZoneClassName?: string;
    hitZoneXOffset?: number;
    spec: TrackItemSpec;
};

export enum TrackItemType {
    CIRCLE,
    RECTANGLE,
}

export type TrackItemSpec = {
    startCodon: number;
    endCodon?: number;
    itemType?: TrackItemType;
    label?: string;
    color?: string;
    tooltip?: JSX.Element;
    height?: number;
};

@observer
export default class TrackItem extends React.Component<TrackItemProps> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @observable public isHovered = false;

    @computed public get hitRectangle() {
        let hoverWidth;
        let hoverHeight;
        let xOffset;
        if (this.props.spec.itemType === TrackItemType.CIRCLE) {
            hoverHeight =
                this.props.hoverdim1 || TrackCircle.defaultProps.hoverRadius;

            hoverWidth =
                this.props.hoverdim1 || TrackCircle.defaultProps.hoverRadius;

            xOffset =
                this.props.x - hoverWidth + (this.props.hitZoneXOffset || 0);
        } else {
            hoverHeight = this.props.dim2! / 2;

            hoverWidth = this.props.dim1! / 2;

            xOffset = this.props.x + (this.props.hitZoneXOffset || 0);
        }

        return {
            x: xOffset,
            y: this.props.y,
            width: hoverWidth * 2,
            height: hoverHeight * 2,
        };
    }

    public render() {
        if (this.props.spec.itemType === TrackItemType.CIRCLE) {
            return (
                <TrackCircle
                    isHovered={this.isHovered}
                    radius={this.props.dim1}
                    hoverRadius={this.props.hoverdim1}
                    {...this.props}
                />
            );
        } else {
            return (
                <TrackRect
                    isHovered={this.isHovered}
                    width={this.props.dim1}
                    height={this.props.dim2}
                    {...this.props}
                />
            );
        }
    }
}
