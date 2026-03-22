import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import { ComparisonGroup } from '../GroupComparisonUtils';
import * as d3 from 'd3';
import _ from 'lodash';
import MemoizedHandlerFactory from '../../../shared/lib/MemoizedHandlerFactory';
import measureText from 'measure-text';
import * as ReactDOM from 'react-dom';
import { Popover } from 'react-bootstrap';
import classnames from 'classnames';
import styles from '../../resultsView/survival/styles.module.scss';
import { pluralize } from 'cbioportal-frontend-commons';
import {
    blendColors,
    getExcludedIndexes,
    getTextColor,
    joinGroupNames,
    regionIsSelected,
    toggleRegionSelected,
} from '../OverlapUtils';
import { computeRectangleVennLayout, getRegionLabelPosition } from './layout';
import {
    adjustSizesForMinimumSizeRegions,
    scaleAndCenterLayout,
} from './normalizeLayout';

export interface IRectangleVennDiagramProps {
    uid: string;
    groups: {
        uid: string;
        cases: string[];
    }[]; // either 2 or 3
    x: number;
    y: number;
    width: number;
    height: number;
    uidToGroup: { [uid: string]: ComparisonGroup };
    onChangeSelectedRegions: (selectedRegions: number[][]) => void;
    selection: {
        regions: number[][]; // we do it like this so that updating it doesn't update all props
    };
    caseType: 'sample' | 'patient';
    onLayoutFailure: () => void;
}

function regionMouseOver(e: any) {
    e.target.setAttribute('fill', e.target.getAttribute('data-hover-fill'));
}

function regionMouseOut(e: any) {
    e.target.setAttribute('fill', e.target.getAttribute('data-default-fill'));
}

@observer
export default class RectangleVennDiagram extends React.Component<
    IRectangleVennDiagramProps,
    {}
> {
    @observable.ref svg: SVGElement | null = null;
    @observable.ref tooltipModel: {
        combination: number[];
        sizeOfRegion: number;
    } | null = null;
    @observable mousePosition = { x: 0, y: 0 };

    constructor(props: IRectangleVennDiagramProps) {
        super(props);
        makeObservable(this);
    }

    private regionClickHandlers = MemoizedHandlerFactory(
        (e: any, params: { combination: number[] }) => {
            this.props.onChangeSelectedRegions(
                toggleRegionSelected(
                    params.combination,
                    this.props.selection.regions
                )
            );
        }
    );

    private regionHoverHandlers = MemoizedHandlerFactory(
        (
            e: React.MouseEvent<any>,
            params: { combination: number[]; sizeOfRegion: number }
        ) => {
            if (params.sizeOfRegion > 0) {
                this.tooltipModel = params;
                this.mousePosition.x = e.pageX;
                this.mousePosition.y = e.pageY;
            }
        }
    );

    @autobind private svgRef(_svg: SVGElement | null) {
        this.svg = _svg;
    }

    @computed get layoutParams() {
        // First generate regions
        let combinations: number[][]; // in painting order so that mouse interactions look right
        switch (this.props.groups.length) {
            case 2:
                // all combinations of two groups
                combinations = [[0], [1], [0, 1]];
                break;
            case 3:
            default:
                // all combinations of three groups
                combinations = [
                    [0],
                    [1],
                    [2],
                    [0, 1],
                    [0, 2],
                    [1, 2],
                    [0, 1, 2],
                ];
                break;
        }

        // `regions` corresponds to exclusive regions in the diagram.
        // For example, in a diagram with sets A and B, there's a region for the intersection of A and B,
        //  a region for whats only in A, and a region for whats only in B.
        const regions = combinations.map(combination => {
            // compute the cases in this region
            let casesInRegion = _.intersection(
                ...combination.map(index => this.props.groups[index].cases)
            );
            const sizeOfIntersectionOfSets = casesInRegion.length;
            for (const i of getExcludedIndexes(
                combination,
                this.props.groups.length
            )) {
                _.pullAll(casesInRegion, this.props.groups[i].cases);
            }
            return {
                combination,
                sizeOfIntersectionOfSets,
                sizeOfRegion: casesInRegion.length,
                // compute the fill based on the colors of the included groups
                color: blendColors(
                    combination.map(
                        index =>
                            this.props.uidToGroup[this.props.groups[index].uid]
                                .color
                    )
                ),
                labelPosition: null as { x: number; y: number } | null,
            };
        });

        // convert to form thats useful for algorithm
        const regionsInAlgorithmForm = regions.map(r => ({
            sets: r.combination.map(i => this.props.groups[i].uid),
            size: r.sizeOfRegion,
            sizeOfIntersectionOfSets: r.sizeOfIntersectionOfSets,
        }));

        // the algorithm also needs all the sets
        const sets = this.props.groups.map(g => ({
            size: g.cases.length,
            uid: g.uid,
            color: this.props.uidToGroup[g.uid].color,
            disjoint: (function() {
                const region = regionsInAlgorithmForm.find(
                    r => r.sets.length === 1 && r.sets[0] === g.uid
                );
                return region!.size === region!.sizeOfIntersectionOfSets; // disjoint if not intersecting with anything else, aka nothing is excluded from its solo region
            })(),
        }));

        const algorithmInput = adjustSizesForMinimumSizeRegions(
            regionsInAlgorithmForm,
            sets
        );

        // compute a layout for the venn diagram using the specification given by the
        //  sets and the regions
        const unscaledLayout = computeRectangleVennLayout(
            algorithmInput.regions,
            algorithmInput.sets,
            {
                maxIterations: 10000,
            }
        );

        // scale and center the layout in a normalized form for presenting
        const padding = 20;
        const rectangles = scaleAndCenterLayout(
            unscaledLayout.rectangles,
            this.props.width,
            this.props.height,
            padding
        );

        // compute label positions for nonempty regions
        for (const region of regions) {
            if (region.sizeOfRegion > 0) {
                region.labelPosition = getRegionLabelPosition(
                    region.combination.map(i => this.props.groups[i].uid),
                    rectangles
                );
            }
        }

        const layoutFailure = unscaledLayout.finalErrorValue >= 1;
        if (layoutFailure) {
            setTimeout(this.props.onLayoutFailure, 0); // call in timeout so that no chance of breaking mobx invariant
        }

        return {
            rectangles,
            regions,
            sets,
        };
    }

    @computed get svgElements() {
        // Compute all of the display elements of the venn diagram - the outline, the fills, and the text

        const CORNER_RADIUS = 8;
        const rectangleParams = this.layoutParams.rectangles;
        // compute the clip paths corresponding to each group circle
        const clipPaths = this.props.groups.map((group, index) => (
            <clipPath id={`${this.props.uid}_circle_${index}`}>
                <rect
                    x={rectangleParams[group.uid].x}
                    y={rectangleParams[group.uid].y}
                    width={rectangleParams[group.uid].xLength}
                    height={rectangleParams[group.uid].yLength}
                    rx={CORNER_RADIUS}
                />
            </clipPath>
        ));

        const elements = _.flattenDeep<any>(
            this.layoutParams.regions.map(region => {
                // FOR EACH REGION: generate the filled region, and the "# cases" text for it
                // Each region is specified by the combination of groups corresponding to it
                const comb = region.combination;

                // generate clipped hover region by iteratively nesting a rect in all the clip paths
                //  corresponding to groups in this region. This clips out, one by one, everything
                //  except for the intersection.
                let hoverRegion: JSX.Element = (
                    <g>
                        <rect
                            x="0"
                            y="0"
                            height={this.props.height}
                            width={this.props.width}
                            fill={region.color}
                            style={{
                                cursor:
                                    region.sizeOfRegion > 0
                                        ? 'pointer'
                                        : 'default',
                            }}
                            data-default-fill={region.color}
                            data-hover-fill={d3
                                .hsl(region.color)
                                .brighter(1)
                                .rgb()}
                            onMouseOver={
                                region.sizeOfRegion > 0
                                    ? regionMouseOver
                                    : undefined
                            }
                            onMouseOut={
                                region.sizeOfRegion > 0
                                    ? regionMouseOut
                                    : undefined
                            }
                            onMouseMove={this.regionHoverHandlers({
                                combination: comb,
                                sizeOfRegion: region.sizeOfRegion,
                            })}
                            onClick={
                                region.sizeOfRegion > 0
                                    ? this.regionClickHandlers({
                                          combination: comb,
                                      })
                                    : undefined
                            }
                            data-test={`${
                                this.props.caseType
                            }${region.combination.join(',')}VennRegion`}
                        />
                    </g>
                );
                for (const index of comb) {
                    hoverRegion = (
                        <g clipPath={`url(#${this.props.uid}_circle_${index})`}>
                            {hoverRegion}
                        </g>
                    );
                }

                return [hoverRegion];
            })
        );

        const outlines = _.sortBy(this.layoutParams.sets, s => -s.size).map(
            s => {
                // draw the outlines of the rectangles
                const uid = s.uid;
                return (
                    <rect
                        x={rectangleParams[uid].x}
                        y={rectangleParams[uid].y}
                        width={rectangleParams[uid].xLength}
                        height={rectangleParams[uid].yLength}
                        fill="none"
                        stroke={s.color}
                        strokeWidth={2}
                        rx={CORNER_RADIUS}
                    />
                );
            }
        );
        const textElements = _.flattenDeep<any>(
            this.layoutParams.regions.map(region => {
                if (region.sizeOfRegion === 0 || !region.labelPosition) {
                    return [];
                }

                const selected = regionIsSelected(
                    region.combination,
                    this.props.selection.regions
                );

                const textContents = `${region.sizeOfRegion.toString()}${
                    selected ? ' ' + String.fromCharCode(10004) : ''
                }`;
                // Add rect behind for ease of reading
                const textSize = measureText({
                    text: textContents,
                    fontFamily: 'Arial',
                    fontSize: '13px',
                    lineHeight: 1,
                });
                const padding = 4;
                const textPosition = region.labelPosition;
                let textBackground = null;
                if (selected) {
                    textBackground = (
                        <rect
                            x={
                                textPosition.x -
                                textSize.width.value / 2 -
                                padding
                            }
                            y={textPosition.y - textSize.height.value + 3}
                            width={textSize.width.value + 2 * padding}
                            height={textSize.height.value + padding}
                            fill={'yellow'}
                            rx={3}
                            ry={3}
                            pointerEvents="none"
                        />
                    );
                }
                return [
                    textBackground,
                    <text
                        x={textPosition.x}
                        y={textPosition.y}
                        style={{
                            userSelect: 'none',
                            color: selected
                                ? 'black'
                                : getTextColor(region.color),
                        }}
                        fontWeight={region.sizeOfRegion > 0 ? 'bold' : 'normal'}
                        pointerEvents="none"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        data-test={`${
                            this.props.caseType
                        }${region.combination.join(',')}VennLabel`}
                    >
                        {textContents}
                    </text>,
                ];
            })
        );

        return (
            <>
                {clipPaths}
                {elements}
                {outlines}
                {textElements}
            </>
        );
    }

    @autobind private resetSelection() {
        this.props.onChangeSelectedRegions([]);
    }

    @autobind private resetTooltip() {
        this.tooltipModel = null;
    }

    @computed get tooltipContent() {
        if (!this.tooltipModel) {
            return null;
        }
        const includedGroupUids = this.tooltipModel.combination.map(
            groupIndex => this.props.groups[groupIndex].uid
        );
        const includedGroups = includedGroupUids.map(
            uid => this.props.uidToGroup[uid]
        );

        return (
            <div style={{ width: 300, whiteSpace: 'normal' }}>
                <strong>
                    {this.tooltipModel.sizeOfRegion}{' '}
                    {pluralize(
                        this.props.caseType,
                        this.tooltipModel.sizeOfRegion
                    )}
                </strong>
                <br />
                in only {joinGroupNames(includedGroups, 'and')}.
            </div>
        );
    }

    render() {
        return (
            <g
                transform={`translate(${this.props.x},${this.props.y})`}
                onMouseOut={this.resetTooltip}
            >
                <rect
                    x="0"
                    y="0"
                    fill="white"
                    fillOpacity={0}
                    width={this.props.width}
                    height={this.props.height}
                    onMouseMove={this.resetTooltip}
                    onClick={this.resetSelection}
                />
                {this.svgElements}
                {!!this.tooltipModel &&
                    (ReactDOM as any).createPortal(
                        <Popover
                            arrowOffsetTop={17}
                            className={classnames(
                                'cbioportal-frontend',
                                'cbioTooltip',
                                styles.Tooltip
                            )}
                            positionLeft={this.mousePosition.x + 15}
                            positionTop={this.mousePosition.y - 17}
                        >
                            {this.tooltipContent}
                        </Popover>,
                        document.body
                    )}
            </g>
        );
    }
}
