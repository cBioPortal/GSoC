import {
    downsampleByGrouping,
    DSData,
} from '../../../../shared/components/plots/downsampleByGrouping';
import _ from 'lodash';
import { SampleIdentifier } from 'cbioportal-ts-api-client';
import { AnalysisGroup } from 'pages/studyView/StudyViewUtils';
import { ClinicalAttribute } from 'cbioportal-ts-api-client';

export interface IStudyViewScatterPlotData {
    x: number;
    y: number;
    uniqueSampleKey: string;
    studyId: string;
    sampleId: string;
    patientId: string;
}

export interface IStudyViewScatterPlotProps {
    width: number;
    height: number;
    data: IStudyViewScatterPlotData[];
    onSelection: (
        sampleIdentifiers: SampleIdentifier[],
        keepCurrent: boolean
    ) => void;

    isLoading?: boolean;
    svgRef?: (svg: SVGElement | null) => void;
    tooltip?: (d: DSData<IStudyViewScatterPlotData>) => JSX.Element;
    axisLabelX?: string;
    axisLabelY?: string;
    title?: string;

    sampleToAnalysisGroup: { [uniqueSampleKey: string]: string };
    analysisGroups: ReadonlyArray<AnalysisGroup>; // identified by `value`
    analysisClinicalAttribute?: ClinicalAttribute;
}

export const DOWNSAMPLE_PIXEL_DISTANCE_THRESHOLD = 4;
export const MAX_DOT_SIZE = 5;

export function getDownsampledData(
    data: IStudyViewScatterPlotProps['data'],
    dataSpaceToPixelSpace: {
        x: (val: number) => number;
        y: (val: number) => number;
    }
): DSData<IStudyViewScatterPlotData>[];

export function getDownsampledData(
    data: IStudyViewScatterPlotProps['data'],
    dataSpaceToPixelSpace: {
        x: (val: number) => number;
        y: (val: number) => number;
    },
    sampleToAnalysisGroup: IStudyViewScatterPlotProps['sampleToAnalysisGroup']
): { [groupVal: string]: DSData<IStudyViewScatterPlotData>[] };

export function getDownsampledData(
    data: IStudyViewScatterPlotProps['data'],
    dataSpaceToPixelSpace: {
        x: (val: number) => number;
        y: (val: number) => number;
    },
    sampleToAnalysisGroup?: IStudyViewScatterPlotProps['sampleToAnalysisGroup']
) {
    if (sampleToAnalysisGroup) {
        // group data by analysis group
        const groupedData = _.groupBy(
            data,
            d => sampleToAnalysisGroup[d.uniqueSampleKey]
        );
        // downsample, and sort by number of points in the downsample group
        const downsampledGroups = _.mapValues(groupedData, dataForGroup => {
            return _.sortBy(
                downsampleByGrouping(
                    dataForGroup,
                    DOWNSAMPLE_PIXEL_DISTANCE_THRESHOLD,
                    dataSpaceToPixelSpace
                ),
                d => d.data.length
            );
        });
        return downsampledGroups;
    } else {
        // downsample, and sort by number of points in the downsample group
        return _.sortBy(
            downsampleByGrouping(
                data,
                DOWNSAMPLE_PIXEL_DISTANCE_THRESHOLD,
                dataSpaceToPixelSpace
            ),
            d => d.data.length
        );
    }
}

export function getBinnedData<D extends { x: number; y: number }>(
    unbinnedData: D[],
    plotDomain: { x: [number, number]; y: [number, number] },
    mesh: number
): DSData<D>[] {
    const X_STEP = (plotDomain.x[1] - plotDomain.x[0]) / mesh;
    const Y_STEP = (plotDomain.y[1] - plotDomain.y[0]) / mesh;
    const getGridCoords = (d: { x: number; y: number }) => {
        const x = Math.floor((d.x - plotDomain.x[0]) / X_STEP);
        const y = Math.floor((d.y - plotDomain.y[0]) / Y_STEP);
        return { x, y };
    };

    const getAreaHash = (gridCoords: { x: number; y: number }) =>
        `${gridCoords.x},${gridCoords.y}`;

    const bins = _.groupBy(unbinnedData, d => getAreaHash(getGridCoords(d)));
    return _.values(bins).map(data => {
        const gridCoords = getGridCoords(data[0]);
        return {
            x: gridCoords.x * X_STEP,
            y: gridCoords.y * Y_STEP,
            data,
        };
    });
}
