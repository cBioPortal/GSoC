import * as React from 'react';
import { DeckGL } from '@deck.gl/react';
import { OrthographicView } from '@deck.gl/core';
import {
    EmbeddingVisualizationProps,
    EmbeddingPoint,
    ViewState,
} from './EmbeddingTypes';

// Import modular components
import { ToolbarControls } from './controls/ToolbarControls';
import { SelectionControls } from './controls/SelectionControls';
import { LegendPanel } from './controls/LegendPanel';
import { TooltipDisplay } from './controls/TooltipDisplay';
import { AxisLabels } from './overlays/AxisLabels';
import { SelectionOverlay } from './overlays/SelectionOverlay';

// Import utility functions
import { dataToScreen, colorToRgb } from './utils/coordinateUtils';
import { calculateDataBounds } from './utils/dataUtils';
import { createScatterplotLayer } from './utils/layerUtils';

interface EmbeddingDeckGLVisualizationState {
    hoveredPoint: EmbeddingPoint | null;
    selectedPoints: EmbeddingPoint[];
    selectionMode: 'none' | 'lasso';
    isSelecting: boolean;
    selectionPath: Array<{ x: number; y: number }>;
    actualWidth: number;
    actualHeight: number;
}

/**
 * High-performance deck.gl-based visualization for embedding data
 * Uses WebGL ScatterplotLayer for efficient rendering of large datasets
 */
export class EmbeddingDeckGLVisualization extends React.Component<
    EmbeddingVisualizationProps,
    EmbeddingDeckGLVisualizationState
> {
    private containerRef = React.createRef<HTMLDivElement>();
    private deckRef = React.createRef<DeckGL>();

    constructor(props: EmbeddingVisualizationProps) {
        super(props);

        this.state = {
            hoveredPoint: null,
            selectedPoints: [],
            selectionMode: 'none',
            isSelecting: false,
            selectionPath: [],
            actualWidth: props.width || 800,
            actualHeight: props.height || 600,
        };
    }

    componentDidMount() {
        this.measureContainer();
        window.addEventListener('resize', this.measureContainer);
        window.addEventListener('keydown', this.handleKeyDown);
    }

    componentDidUpdate(prevProps: EmbeddingVisualizationProps) {
        // Remeasure container when height or width props change
        // This handles tab switching where the container might have been hidden
        if (
            prevProps.height !== this.props.height ||
            prevProps.width !== this.props.width
        ) {
            this.measureContainer();
        }

        // Also remeasure after a short delay to handle tab visibility changes
        // When switching tabs, the container might be hidden (width=0) during the update
        // but visible shortly after, so we need to remeasure once layout is complete
        setTimeout(() => {
            this.measureContainer();
        }, 0);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.measureContainer);
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    private measureContainer = () => {
        if (this.containerRef.current) {
            const rect = this.containerRef.current.getBoundingClientRect();
            const newWidth = rect.width;
            const newHeight = rect.height || this.props.height || 600;

            if (
                newWidth !== this.state.actualWidth ||
                newHeight !== this.state.actualHeight
            ) {
                this.setState({
                    actualWidth: newWidth,
                    actualHeight: newHeight,
                });
            }
        }
    };

    private getLayers() {
        const { data } = this.props;
        const { selectedPoints } = this.state;

        if (!data || data.length === 0) return [];

        return [
            createScatterplotLayer(
                data,
                selectedPoints,
                this.props.selectedPatientIds || [],
                this.onHover,
                this.onClick
            ),
        ];
    }

    private onHover = (info: any) => {
        const { object } = info;
        this.setState({
            hoveredPoint: object || null,
        });
    };

    private onClick = (info: any) => {
        const { object } = info;
        if (object) {
            if (object.isInCohort === false) {
                return;
            }
            // Pin the tooltip via parent state (survives component remount)
            if (this.props.onPinPoint) {
                this.props.onPinPoint({ ...object });
            }
            // Also trigger selection
            if (this.props.onPointSelection) {
                this.props.onPointSelection([object]);
            }
        }
    };

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && this.props.pinnedPoint) {
            if (this.props.onUnpinPoint) {
                this.props.onUnpinPoint();
            }
        }
    };

    private onUnpin = () => {
        if (this.props.onUnpinPoint) {
            this.props.onUnpinPoint();
        }
    };

    private onViewStateChange = ({ viewState }: { viewState: any }) => {
        const newViewState = viewState.ortho || viewState;
        if (this.props.onViewStateChange) {
            this.props.onViewStateChange(newViewState);
        }
    };

    private renderTooltip() {
        const pinnedPoint = this.props.pinnedPoint;
        const { hoveredPoint } = this.state;
        const isPinned = !!pinnedPoint;
        const displayedPoint = pinnedPoint || hoveredPoint;
        return (
            <TooltipDisplay
                hoveredPoint={displayedPoint}
                embeddingType={this.props.embeddingType}
                isPinned={isPinned}
                onUnpin={this.onUnpin}
            />
        );
    }

    private renderLegend() {
        return (
            <LegendPanel
                data={this.props.data}
                showLegend={this.props.showLegend}
                actualHeight={this.state.actualHeight}
                categoryCounts={this.props.categoryCounts}
                categoryColors={this.props.categoryColors}
                hiddenCategories={this.props.hiddenCategories}
                onToggleCategoryVisibility={
                    this.props.onToggleCategoryVisibility
                }
                onToggleAllCategories={this.props.onToggleAllCategories}
                visibleSampleCount={this.props.visibleSampleCount}
                totalSampleCount={this.props.totalSampleCount}
                visibleCategoryCount={this.props.visibleCategoryCount}
                totalCategoryCount={this.props.totalCategoryCount}
                isNumericAttribute={this.props.isNumericAttribute}
                numericalValueRange={this.props.numericalValueRange}
                numericalValueToColor={this.props.numericalValueToColor}
            />
        );
    }

    private renderAxisLabels() {
        return (
            <AxisLabels
                xAxisLabel={this.props.xAxisLabel}
                yAxisLabel={this.props.yAxisLabel}
                actualWidth={this.state.actualWidth}
                actualHeight={this.state.actualHeight}
            />
        );
    }

    private exportToPNG = () => {
        const { filename = 'embedding_plot' } = this.props;

        if (this.deckRef.current) {
            const canvas = this.deckRef.current.deck?.canvas;
            if (canvas) {
                const link = document.createElement('a');
                link.download = `${filename}.png`;
                link.href = canvas.toDataURL();
                link.click();
            }
        }
    };

    private centerView = () => {
        const bounds = calculateDataBounds(this.props.data);
        const currentViewState = this.props.viewState || {
            target: [0, 0, 0],
            zoom: 0,
            minZoom: -5,
            maxZoom: 10,
        };

        if (this.props.onViewStateChange) {
            this.props.onViewStateChange({
                ...currentViewState,
                target: [bounds.centerX, bounds.centerY, 0],
                zoom: bounds.zoom,
            });
        }
    };

    private onSelectionModeChange = (mode: 'none' | 'lasso') => {
        this.setState({
            selectionMode: mode,
            isSelecting: false,
            selectionPath: [],
        });
    };

    private handleMouseDown = (event: React.MouseEvent) => {
        if (this.state.selectionMode === 'none') return;

        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.setState({
            isSelecting: true,
            selectionPath: [{ x, y }],
        });
    };

    private handleMouseMove = (event: React.MouseEvent) => {
        if (!this.state.isSelecting || this.state.selectionMode === 'none')
            return;

        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Throttle point collection - only add if moved at least 3 pixels
        const lastPoint = this.state.selectionPath[
            this.state.selectionPath.length - 1
        ];
        if (lastPoint) {
            const dx = x - lastPoint.x;
            const dy = y - lastPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 3) return;
        }

        this.setState(prevState => ({
            selectionPath: [...prevState.selectionPath, { x, y }],
        }));
    };

    private handleMouseUp = (event: React.MouseEvent) => {
        if (!this.state.isSelecting || this.state.selectionMode === 'none')
            return;

        // Perform lasso selection
        this.performLassoSelection();

        // Clear selection state and return to pan mode
        this.setState({
            isSelecting: false,
            selectionMode: 'none',
            selectionPath: [],
        });
    };

    /**
     * Point-in-polygon test using ray casting algorithm
     */
    private isPointInPolygon(
        point: { x: number; y: number },
        polygon: Array<{ x: number; y: number }>
    ): boolean {
        if (polygon.length < 3) return false;

        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x,
                yi = polygon[i].y;
            const xj = polygon[j].x,
                yj = polygon[j].y;

            if (
                yi > point.y !== yj > point.y &&
                point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
            ) {
                inside = !inside;
            }
        }
        return inside;
    }

    private performLassoSelection = () => {
        const { selectionPath } = this.state;

        if (!this.deckRef.current || selectionPath.length < 3) {
            return;
        }

        // Calculate bounding box of the lasso path for initial filtering
        let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;
        for (const point of selectionPath) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }

        const width = maxX - minX;
        const height = maxY - minY;

        try {
            const deck = this.deckRef.current.deck as any;
            if (!deck) {
                return;
            }

            // Use deck.gl's built-in picking to get objects in bounding box
            let pickedObjects: any[] = [];

            if (typeof deck.pickObjects === 'function') {
                pickedObjects = deck.pickObjects({
                    x: minX,
                    y: minY,
                    width,
                    height,
                    layerIds: ['embedding-scatter'],
                });
            } else if (typeof deck.pickMultipleObjects === 'function') {
                pickedObjects = deck.pickMultipleObjects({
                    x: minX,
                    y: minY,
                    width,
                    height,
                    layerIds: ['embedding-scatter'],
                });
            } else {
                // Fallback: sample multiple points within the bounding box
                const samplePoints: any[] = [];
                const stepSize = 5;
                for (let x = minX; x < maxX; x += stepSize) {
                    for (let y = minY; y < maxY; y += stepSize) {
                        if (typeof deck.pickObject === 'function') {
                            const picked = deck.pickObject({
                                x,
                                y,
                                layerIds: ['embedding-scatter'],
                            });
                            if (picked && picked.object) {
                                samplePoints.push(picked);
                            }
                        }
                    }
                }
                pickedObjects = samplePoints;
            }

            // Get the viewport for coordinate projection
            const viewports = deck.getViewports();
            const viewport = viewports && viewports[0];

            // Filter picked objects using point-in-polygon test
            const selectedPoints: EmbeddingPoint[] = pickedObjects
                .filter((info: any) => {
                    if (!info || !info.object) return false;
                    const point = info.object as EmbeddingPoint;

                    // Use viewport.project for accurate screen coordinates
                    let screenPoint;
                    if (viewport && viewport.project) {
                        const projected = viewport.project([
                            point.x,
                            point.y,
                            0,
                        ]);
                        screenPoint = { x: projected[0], y: projected[1] };
                    } else {
                        screenPoint = this.dataToScreen(point.x, point.y);
                    }

                    return this.isPointInPolygon(screenPoint, selectionPath);
                })
                .map((info: any) => info.object);

            // Remove duplicates (in case same point picked multiple times)
            const uniquePoints = Array.from(
                new Map(
                    selectedPoints.map(p => [p.patientId || p.sampleId, p])
                ).values()
            );

            this.setState({ selectedPoints: uniquePoints });

            // Notify parent component of selection
            if (this.props.onPointSelection && uniquePoints.length > 0) {
                this.props.onPointSelection(uniquePoints);
            }
        } catch (error) {
            this.setState({ selectedPoints: [] });
        }
    };

    private dataToScreen = (
        dataX: number,
        dataY: number
    ): { x: number; y: number } => {
        const { actualWidth, actualHeight } = this.state;
        const viewState = this.props.viewState || {
            target: [0, 0, 0],
            zoom: 0,
            minZoom: -5,
            maxZoom: 10,
        };

        return dataToScreen(dataX, dataY, viewState, actualWidth, actualHeight);
    };

    private renderControls() {
        const { selectionMode } = this.state;

        return (
            <div
                style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                }}
            >
                <ToolbarControls
                    onExport={this.exportToPNG}
                    onCenter={this.centerView}
                />
                <SelectionControls
                    selectionMode={selectionMode}
                    onSelectionModeChange={this.onSelectionModeChange}
                />
            </div>
        );
    }

    private renderSelectionOverlay() {
        const { isSelecting, selectionMode, selectionPath } = this.state;

        return (
            <SelectionOverlay
                isSelecting={isSelecting}
                selectionMode={selectionMode}
                selectionPath={selectionPath}
            />
        );
    }

    render() {
        const { actualWidth, actualHeight } = this.state;

        return (
            <div
                ref={this.containerRef}
                style={{ position: 'relative', width: '100%' }}
            >
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: `${actualHeight}px`,
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                    }}
                    onMouseDown={this.handleMouseDown}
                    onMouseMove={this.handleMouseMove}
                    onMouseUp={this.handleMouseUp}
                >
                    <DeckGL
                        ref={this.deckRef}
                        views={
                            new OrthographicView({
                                id: 'ortho',
                                controller: !this.state.isSelecting,
                            })
                        }
                        viewState={
                            this.props.viewState || {
                                target: [0, 0, 0],
                                zoom: 0,
                                minZoom: -5,
                                maxZoom: 10,
                            }
                        }
                        onViewStateChange={this.onViewStateChange}
                        layers={this.getLayers()}
                        width={actualWidth}
                        height={actualHeight}
                        style={{
                            backgroundColor: 'white',
                            cursor:
                                this.state.selectionMode === 'lasso'
                                    ? 'crosshair'
                                    : 'grab',
                        }}
                    />

                    {this.renderTooltip()}
                    {this.renderLegend()}
                    {this.renderAxisLabels()}
                    {this.renderControls()}
                    {this.renderSelectionOverlay()}

                    {/* Show message when no points are visible */}
                    {this.props.data.length === 0 && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: '#666',
                                fontSize: '14px',
                                textAlign: 'center',
                                pointerEvents: 'none',
                            }}
                        >
                            No points selected for display
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
