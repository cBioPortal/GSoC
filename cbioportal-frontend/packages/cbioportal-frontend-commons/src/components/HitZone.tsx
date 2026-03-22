import * as React from 'react';
import { observer } from 'mobx-react';

type HitZoneProps = {
    x: number;
    y: number;
    width: number;
    height: number;
    cursor?: string;
    onMouseOver?: () => void;
    onClick?: () => void;
    onMouseOut?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
};

export type HitZoneConfig = {
    hitRect: { x: number; y: number; width: number; height: number };
    content?: JSX.Element;
    mirrorHitRect?: { x: number; y: number; width: number; height: number }; // mirror lollipop component location and dimensions
    mirrorContent?: JSX.Element; // mirror lollipop component tooltip contents
    tooltipPlacement?: string;
    cursor?: string;
    onMouseOver?: () => void;
    onClick?: () => void;
    onMouseOut?: () => void;
};

export function defaultHitzoneConfig(): HitZoneConfig {
    return {
        hitRect: {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
        },
        content: <span />,
        mirrorHitRect: undefined,
        mirrorContent: undefined,
        tooltipPlacement: 'top',
        cursor: 'pointer',
        onMouseOver: () => 0,
        onClick: () => 0,
        onMouseOut: () => 0,
    };
}

export function initHitZoneFromConfig(config: HitZoneConfig) {
    return (
        <HitZone
            y={config.hitRect.y}
            x={config.hitRect.x}
            width={config.hitRect.width}
            height={config.hitRect.height}
            onMouseOver={config.onMouseOver}
            onClick={config.onClick}
            onMouseOut={config.onMouseOut}
            cursor={config.cursor}
        />
    );
}

//@observer
export class HitZone extends React.Component<HitZoneProps, {}> {
    private handlers: any;

    constructor(props: HitZoneProps) {
        super(props);
        this.handlers = {
            onMouseOver: () => {
                this.props.onMouseOver && this.props.onMouseOver();
                this.props.onMouseEnter && this.props.onMouseEnter();
            },
            onMouseOut: () => {
                this.props.onMouseOut && this.props.onMouseOut();
                this.props.onMouseLeave && this.props.onMouseLeave();
            },
        };
    }

    render() {
        return (
            <svg
                width={this.props.width}
                height={this.props.height}
                style={{
                    position: 'absolute',
                    top: this.props.y,
                    left: this.props.x,
                    cursor: this.props.cursor,
                }}
                onMouseOver={this.handlers.onMouseOver}
                onClick={this.props.onClick}
                onMouseOut={this.handlers.onMouseOut}
            />
        );
    }
}

export default HitZone;
