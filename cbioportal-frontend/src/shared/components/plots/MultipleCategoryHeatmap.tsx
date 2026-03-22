import * as React from 'react';
import { observer } from 'mobx-react';
import { makeObservable } from 'mobx';
import Oncoprint, {
    IBaseHeatmapTrackDatum,
    IBaseHeatmapTrackSpec,
    IHeatmapTrackSpec,
} from 'shared/components/oncoprint/Oncoprint';
import autobind from 'autobind-decorator';
import { InitParams, OncoprintJS } from 'oncoprintjs';
import _ from 'lodash';
import { IStringAxisData } from './PlotsTabUtils';

export type IOncoprintHeatmapProps = {
    horzData?: IStringAxisData['data'];
    vertData?: IStringAxisData['data'];
    axisLabelX: string;
    barWidth: number;
    groupToColor?: { [group: string]: string };
    broadcastOncoprintJsRef: (oncoprint: OncoprintJS) => void;
};

const MIN_WIDTH = 400;

const INIT_PARAMS: InitParams = {
    init_cell_width: 20,
    init_cell_padding: 1,
    cell_padding_off_cell_width_threshold: 10,
};

@observer
export default class MultipleCategoryHeatmap extends React.Component<
    IOncoprintHeatmapProps,
    {}
> {
    private oncoprintJs: OncoprintJS | null = null;
    private oncoprint: Oncoprint | null = null;

    constructor(props: any) {
        super(props);
    }

    @autobind
    private oncoprintRef(oncoprint: Oncoprint | null) {
        this.oncoprint = oncoprint;
    }

    @autobind
    private oncoprintJsRef(oncoprint: OncoprintJS) {
        this.oncoprintJs = oncoprint;
        this.props.broadcastOncoprintJsRef(oncoprint);
    }

    render() {
        const columnLabels = toColumnLabels(this.props);
        let heatmapTracks = toHeatmapTracks(this.props, columnLabels);
        const width = calcWidth(this.props.barWidth, columnLabels, MIN_WIDTH);
        heatmapTracks = _.sortBy(heatmapTracks, ['key']);
        heatmapTracks.forEach(t => (t.data = _.sortBy(t.data, ['uid'])));

        return (
            <div style={{ display: 'inline-block' }}>
                &nbsp;
                <Oncoprint
                    key="MutationOncoprint"
                    ref={this.oncoprintRef}
                    broadcastOncoprintJsRef={this.oncoprintJsRef}
                    highlightedIds={[]}
                    highlightedTracks={undefined}
                    initParams={INIT_PARAMS}
                    showTrackLabels={true}
                    columnLabels={columnLabels}
                    clinicalTracks={[]}
                    geneticTracks={[]}
                    genesetHeatmapTracks={[]}
                    categoricalTracks={[]}
                    heatmapTracks={heatmapTracks}
                    heatmapTracksOrder={undefined}
                    divId="MutationHeatmap"
                    width={width}
                    caseLinkOutInTooltips={false}
                />
            </div>
        );
    }
}

function calcWidth(barWidth: number, columnLabels: any, minWidth: number) {
    let width = barWidth * Object.keys(columnLabels).length * 1.2;
    if (width < MIN_WIDTH) {
        width = MIN_WIDTH;
    }
    return width;
}

function toColumnLabels(props: IOncoprintHeatmapProps): any {
    if (!props.vertData) {
        return {};
    }
    return props.vertData.reduce((result: any, element) => {
        result[element.value as string] = {
            text: element.value,
        };
        return result;
    }, {});
}

function toHeatmapTracks(
    props: IOncoprintHeatmapProps,
    categories: string[]
): IBaseHeatmapTrackSpec[] {
    if (!props.horzData || !props.vertData) {
        return [];
    }

    let groups = props.horzData.reduce((arr: IBaseHeatmapTrackSpec[], next) => {
        const trackKey = Array.isArray(next.value) ? next.value[0] : next.value;
        let track = arr.find(r => r.key === trackKey);
        const column = props.vertData!.find(
            vd => vd.uniqueSampleKey === next.uniqueSampleKey
        );
        if (!column) {
            // When categories are filtered, i.e. when NA is not shown:
            return arr;
        }
        const columnKey = Array.isArray(column.value)
            ? column.value[0]
            : column.value;
        if (!track) {
            track = createTrack(trackKey, categories, props);
            arr.push(track);
        }
        let cell = track.data.find(gd => gd.uid === columnKey);
        cell!.profile_data!++;
        return arr;
    }, []);

    const groupsPercentages: number[][] = [];

    // Create clone to prevent changing data
    // that is used in other places as well:
    groups = _.cloneDeep(groups);

    groups.forEach(group => {
        const groupSampleCount = group.data.reduce(
            (partialSum: number, d) => partialSum + (d.profile_data || 0),
            0
        );

        const groupPercentages: number[] = [];
        groupsPercentages.push(groupPercentages);
        group.data.forEach(d => {
            const sampleCount = d.profile_data || 0;
            const percentage = (sampleCount / groupSampleCount) * 100;
            groupPercentages.push(percentage);
            // Tooltip label:
            d.sample = `${
                d.sample
            }; ${sampleCount} samples (${percentage.toFixed(1)}%)`;
        });
    });

    // Calculate 'heat' (value between 0 and 1) of heatmap cells:
    const percentageMax = Math.max(..._.flatten(groupsPercentages));
    groups.forEach((group, gi) => {
        group.data.forEach((d, di) => {
            d.profile_data = groupsPercentages[gi][di] / percentageMax;
        });
    });

    return groups;
}

function createTrack(
    key: string,
    binKeys: string[],
    props: IOncoprintHeatmapProps
) {
    const groupBins = Object.keys(binKeys).map(k => {
        return {
            uid: k,
            profile_data: 0,
            study_id: '',
        } as IBaseHeatmapTrackDatum;
    });

    const labelLetters = key.match(/[a-zA-Z0-9]{1}/);
    const label = `${labelLetters ? labelLetters[0] : '-'}`;
    const labelCircleColor =
        props.groupToColor && props.groupToColor[key]
            ? props.groupToColor[key]
            : 'black';
    return {
        key,
        label,
        labelCircleColor,
        description: key,
        data: _.cloneDeep(groupBins).map(b => {
            b.sample = `group: ${key}; category: ${b.uid}`;
            return b;
        }) as IBaseHeatmapTrackDatum[],
        molecularProfileId: '',
        trackGroupIndex: 2,
        naLegendLabel: 'No data',
        labelColor: 'white',
        labelFontWeight: 'normal',
        labelLeftPadding: 21,
        hasColumnSpacing: true,
        sortDirectionChangeable: false,
        initSortDirection: -1,
        movable: false,
        legendLabel: props.axisLabelX,
        // Color scheme:
        molecularAlterationType: 'MUTATION_EXTENDED',
    } as IHeatmapTrackSpec;
}
