import * as React from 'react';
import { observer } from 'mobx-react';
import {
    ClinicalViolinPlotIndividualPoint,
    ClinicalViolinPlotBoxData,
} from 'cbioportal-ts-api-client';
import { computed } from 'mobx';
import {
    getViolinX,
    violinPlotSvgHeight,
    violinPlotXPadding,
} from 'pages/studyView/charts/violinPlotTable/StudyViewViolinPlotUtils';

export interface IStudyViewViolinPlotProps {
    curveMagnitudes: number[];
    violinBounds: { min: number; max: number };
    individualPoints: ClinicalViolinPlotIndividualPoint[];
    boxData: ClinicalViolinPlotBoxData;
    showViolin: boolean;
    showBox: boolean;
    width: number;
    gridValues: number[];
    onMouseOverPoint: (
        p: ClinicalViolinPlotIndividualPoint,
        mouseX: number,
        mouseY: number
    ) => void;
    onMouseOverBoxPlot: (mouseX: number, mouseY: number) => void;
    onMouseOverBackground: () => void;
}

export const yPadding = 3;
export const height = violinPlotSvgHeight - 2 * yPadding;

@observer
export default class StudyViewViolinPlot extends React.Component<
    IStudyViewViolinPlotProps,
    {}
> {
    @computed get svgWidth() {
        return this.props.width;
    }
    @computed get violinWidth() {
        return this.svgWidth - 2 * violinPlotXPadding;
    }
    renderCurve() {
        if (this.props.curveMagnitudes.length > 0) {
            // This code draws a violin plot from the given curve magnitudes.
            // The violin plot is a mirrored version of the given curve.

            // Central y-coordinate
            const center = violinPlotSvgHeight / 2;

            // Maximum drawn magnitude (i.e. distance from the center) of each
            //  half of the violin.
            const curveLimit = height / 2;

            // Multiplicative factor converting the given magnitudes to the
            //  svg coordinate space.
            const scale = Math.min(
                1,
                curveLimit / Math.max(...this.props.curveMagnitudes)
            );

            // Compute the curve magnitudes in svg coordinates by multiplying the scale factor.
            const curve = this.props.curveMagnitudes.map(y => scale * y);

            // Compute the step width in the x-direction (i.e. the x distance between
            //  each given curve point).
            const stepSize = this.violinWidth / (curve.length - 1);

            // Draw the same curve twice, mirrored halves - one will be
            //  on the upper side of the y-center, one will be on the lower side.
            let dUpperHalf = `M 0 ${center} L 0 ${center - curve[0]}`;
            let dLowerHalf = `M 0 ${center} L 0 ${center + curve[0]}`;
            for (let i = 1; i < curve.length; i++) {
                dUpperHalf = `${dUpperHalf} L ${i * stepSize} ${center -
                    curve[i]}`;
                dLowerHalf = `${dLowerHalf} L ${i * stepSize} ${center +
                    curve[i]}`;
            }
            dUpperHalf = `${dUpperHalf} L ${this.violinWidth} ${center} L 0 ${center}`;
            dLowerHalf = `${dLowerHalf} L ${this.violinWidth} ${center} L 0 ${center}`;

            return (
                <g transform={`translate(${violinPlotXPadding}, 0)`}>
                    <path d={dUpperHalf} fill={'gray'} />
                    <path d={dLowerHalf} fill={'gray'} />
                </g>
            );
        } else {
            return null;
        }
    }

    private x(v: number) {
        return getViolinX(v, this.props.violinBounds, this.violinWidth);
    }

    renderPoints() {
        // Render individual given points (e.g. outliers, or points if
        //  there are too few to create a density/violin plot).
        const y = violinPlotSvgHeight / 2;
        return this.props.individualPoints.map(d => {
            return (
                <circle
                    key={`${d.studyId}:${d.sampleId}`}
                    onMouseMove={e => {
                        this.props.onMouseOverPoint(d, e.pageX, e.pageY);
                        e.stopPropagation();
                    }}
                    cx={this.x(d.value)}
                    cy={y}
                    r={3}
                />
            );
        });
    }

    renderBox() {
        const whiskerStrokeWidth = 0.5;
        const center = violinPlotSvgHeight / 2;
        const whiskerLowerX = this.x(this.props.boxData.whiskerLower);
        const whiskerUpperX = this.x(this.props.boxData.whiskerUpper);
        const whiskerTop = center - 3;
        const whiskerBottom = center + 3;

        const boxWidth =
            this.x(this.props.boxData.q3) - this.x(this.props.boxData.q1);
        const boxHeight = 10; //whiskerBottom - whiskerTop;
        const boxX = this.x(this.props.boxData.q1);
        const boxY = center - boxHeight / 2; //whiskerTop;

        const median = this.x(this.props.boxData.median);

        return (
            <>
                {/*left whisker*/}
                <line
                    x1={whiskerLowerX}
                    x2={whiskerLowerX}
                    y1={whiskerTop}
                    y2={whiskerBottom}
                    stroke="black"
                    strokeWidth={whiskerStrokeWidth}
                />
                {/*connecting line*/}
                <line
                    x1={whiskerLowerX}
                    x2={whiskerUpperX}
                    y1={center}
                    y2={center}
                    stroke="black"
                    strokeWidth={whiskerStrokeWidth}
                />
                {/*right whisker*/}
                <line
                    x1={whiskerUpperX}
                    x2={whiskerUpperX}
                    y1={whiskerTop}
                    y2={whiskerBottom}
                    stroke="black"
                    strokeWidth={whiskerStrokeWidth}
                />
                {/*box*/}
                <rect
                    x={boxX}
                    y={boxY}
                    width={boxWidth}
                    height={boxHeight}
                    fill={'#dddddd'}
                    stroke={'black'}
                    strokeWidth={0.2}
                    onMouseOver={e =>
                        this.props.onMouseOverBoxPlot(e.pageX, e.pageY)
                    }
                />
                {/*median*/}
                <line
                    x1={median}
                    x2={median}
                    y1={boxY}
                    y2={boxY + boxHeight}
                    stroke="black"
                />
            </>
        );
    }

    renderGridLines() {
        return (
            <>
                {this.props.gridValues.map((val, index) => {
                    const x = this.x(val);
                    return (
                        <>
                            <line
                                x1={x}
                                x2={x}
                                y1={0}
                                y2={violinPlotSvgHeight}
                                stroke={'#aaa'}
                                strokeWidth={1}
                                strokeDasharray={'3,2'}
                            />
                        </>
                    );
                })}
            </>
        );
    }

    render() {
        return (
            <svg
                width={this.svgWidth}
                height={violinPlotSvgHeight}
                style={{
                    marginTop: 5 /*Not sure why the svgs are naturally misaligned with the row, but they are, making this necessary*/,
                }}
            >
                {this.renderGridLines()}
                {this.props.curveMagnitudes.length > 0 &&
                    this.props.showViolin &&
                    this.renderCurve()}
                <rect
                    width={this.svgWidth}
                    height={violinPlotSvgHeight}
                    fillOpacity={0}
                    onMouseMove={this.props.onMouseOverBackground}
                />
                {this.props.curveMagnitudes.length > 0 &&
                    this.props.showBox &&
                    this.renderBox()}
                {(this.props.showViolin || this.props.showBox) &&
                    this.renderPoints()}
            </svg>
        );
    }
}
