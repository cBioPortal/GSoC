// DeckGL type definitions for cBioPortal
//
// This file provides complete TypeScript support for DeckGL components used in the project.
// It replaces the broken internal DeckGL type definitions through path mapping in tsconfig.json.
//
// Architecture:
// - Path mapping redirects all @deck.gl/* imports to this file
// - Direct exports provide types for the redirected imports
// - Ambient module declarations ensure compatibility with standard import syntax
//
// Usage: Import DeckGL components normally - TypeScript will automatically use these definitions

import { Component } from 'react';

// =============================================================================
// DIRECT EXPORTS (for path mapping)
// =============================================================================

export interface DeckGLProps {
    views?: any;
    viewState?: any;
    onViewStateChange?: (info: { viewState: any }) => void;
    controller?: any;
    layers?: any[];
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    [key: string]: any;
}

export class DeckGL extends Component<DeckGLProps> {
    deck?: {
        canvas?: HTMLCanvasElement;
    };
}

export interface ScatterplotLayerProps {
    id: string;
    data: any[];
    getPosition: (d: any) => [number, number];
    getRadius: number | ((d: any) => number);
    getFillColor: (d: any) => [number, number, number];
    getLineColor: (d: any) => [number, number, number];
    getLineWidth: (d: any) => number;
    filled?: boolean;
    stroked?: boolean;
    radiusUnits?: 'pixels' | 'meters';
    lineWidthUnits?: 'pixels' | 'meters';
    pickable?: boolean;
    onHover?: (info: any) => void;
    onClick?: (info: any) => void;
    updateTriggers?: {
        getFillColor?: any[];
        getLineColor?: any[];
        getLineWidth?: any[];
        getRadius?: any[];
    };
    [key: string]: any;
}

export class ScatterplotLayer {
    constructor(props: ScatterplotLayerProps);
}

export class OrthographicView {
    constructor(props?: any);
}

// Export everything else as any
declare const _default: any;
export default _default;

// =============================================================================
// AMBIENT MODULE DECLARATIONS (for fallback coverage)
// =============================================================================

declare module '@deck.gl/react' {
    export interface DeckGLProps {
        views?: any;
        viewState?: any;
        onViewStateChange?: (info: { viewState: any }) => void;
        controller?: any;
        layers?: any[];
        width?: number;
        height?: number;
        style?: React.CSSProperties;
        [key: string]: any;
    }

    export class DeckGL extends Component<DeckGLProps> {
        deck?: {
            canvas?: HTMLCanvasElement;
        };
    }
}

declare module '@deck.gl/layers' {
    export interface ScatterplotLayerProps {
        id: string;
        data: any[];
        getPosition: (d: any) => [number, number];
        getRadius: number | ((d: any) => number);
        getFillColor: (d: any) => [number, number, number];
        getLineColor: (d: any) => [number, number, number];
        getLineWidth: (d: any) => number;
        filled?: boolean;
        stroked?: boolean;
        radiusUnits?: 'pixels' | 'meters';
        lineWidthUnits?: 'pixels' | 'meters';
        pickable?: boolean;
        onHover?: (info: any) => void;
        onClick?: (info: any) => void;
        updateTriggers?: {
            getFillColor?: any[];
            getLineColor?: any[];
            getLineWidth?: any[];
            getRadius?: any[];
        };
        [key: string]: any;
    }

    export class ScatterplotLayer {
        constructor(props: ScatterplotLayerProps);
    }
}

declare module '@deck.gl/core' {
    export class OrthographicView {
        constructor(props?: any);
    }
}
