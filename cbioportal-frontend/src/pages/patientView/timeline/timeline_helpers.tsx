import {
    formatDate,
    getAttributeValue,
    ITimelineConfig,
    POINT_COLOR,
    TimelineEvent,
    TimelineLegendItem,
    TimelineTrackSpecification,
    TimelineTrackType,
} from 'cbioportal-clinical-timeline';
import {
    getEventColor,
    getSampleInfo,
} from 'pages/patientView/timeline/TimelineWrapperUtils';
import React from 'react';
import _ from 'lodash';
import SampleMarker, {
    MultipleSampleMarker,
} from 'pages/patientView/timeline/SampleMarker';
import SampleManager from 'pages/patientView/SampleManager';
import { ISampleMetaDeta } from 'pages/patientView/timeline/TimelineWrapper';
import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { getColor } from 'cbioportal-frontend-commons';
import ReactMarkdown from 'react-markdown';

const OTHER = 'Other';

export function configureHtanOhsuTimeline(baseConfig: ITimelineConfig) {
    baseConfig.trackEventRenderers = baseConfig.trackEventRenderers || [];
    baseConfig.trackEventRenderers.push({
        trackTypeMatch: /IMAGING/i,
        configureTrack: (cat: TimelineTrackSpecification) => {
            cat.renderEvents = function(e) {
                return (
                    <a
                        href={
                            'https://minerva-story-htan-ohsu-demo.surge.sh/#s=0#w=0#g=0#m=-1#a=-100_-100#v=0.5_0.5_0.5#o=-100_-100_1_1#p=Q'
                        }
                        target={'_blank'}
                        onClick={e => e.stopPropagation()}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            version="1.1"
                            id="Layer_1"
                            x="-8px"
                            y="1px"
                            width="16px"
                            height="16px"
                            viewBox="0 0 16 16"
                            enable-background="new 0 0 16 16"
                        >
                            <g>
                                <circle
                                    fill="none"
                                    stroke="#646464"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-miterlimit="10"
                                    cx="7.997"
                                    cy="9.058"
                                    r="3.023"
                                />
                                <path
                                    fill="none"
                                    stroke="#646464"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-miterlimit="10"
                                    d="   M14.168,4h-2.983l-0.521-1.36C10.503,2.288,10.07,2,9.702,2H6.359C5.99,2,5.558,2.288,5.396,2.64L4.877,4H1.893   C1.401,4,1,4.427,1,4.948v8.072C1,13.543,1.401,14,1.893,14h12.275C14.659,14,15,13.543,15,13.021V4.948   C15,4.427,14.659,4,14.168,4z"
                                />
                            </g>
                        </svg>
                    </a>
                );
            };
            cat.renderTooltip = function(e) {
                return (
                    <div>
                        <strong>Click camera to open image viewer</strong>
                        <hr style={{ margin: '5px 0' }} />
                        <table>
                            <tr>
                                <td>Assay Type</td>
                                <td>mIHC</td>
                            </tr>
                            <tr>
                                <td>File Format</td>
                                <td>OME-TIFF</td>
                            </tr>
                        </table>
                    </div>
                );
            };
        },
    });
}

export function configureTimelineToxicityColors(baseConfig: ITimelineConfig) {
    baseConfig.trackStructures = baseConfig.trackStructures || [];
    baseConfig.trackStructures!.push([
        'TOXICITY',
        'TOXICITY_TYPE',
        'SUBTYPE',
        'TOX_OTHER_SPECIFY',
    ]);

    baseConfig.trackStructures!.push(['MEASUREMENTS', 'TEST']);

    baseConfig.trackEventRenderers?.push({
        trackTypeMatch: /BMI/i,
        configureTrack: (cat: TimelineTrackSpecification) => {
            //     psaTrack.trackType = TimelineTrackType.LINE_CHART;
            //     psaTrack.getLineChartValue = (e: TimelineEvent) => {}
            cat.trackType = TimelineTrackType.LINE_CHART;
            cat.getLineChartValue = (e: TimelineEvent) => {
                try {
                    const val = e?.event?.attributes?.find(
                        e => e.key === 'RESULT'
                    )?.value;
                    if (val !== undefined) {
                        return parseFloat(val);
                    } else {
                        return null;
                    }
                } catch (ex) {
                    return null;
                }
            };
        },
    });

    baseConfig.eventColorGetter = function(e: TimelineEvent) {
        const grade = e.event.attributes.find(
            (att: any) => att.key === 'GRADE'
        );
        if (grade) {
            const colorMap: any = {
                '1': 'green',
                '2': 'yellow',
                '3': 'orange',
                '4': 'red',
            };
            return colorMap[grade.value] || POINT_COLOR;
        } else {
            const path = e.containingTrack.uid.split('.');
            if (path[0] === 'TREATMENT' && path.length > 2) {
                return getColor(path[2]);
            }
        }
    };
}

export function configureGenieTimeline(baseConfig: ITimelineConfig) {
    baseConfig.sortOrder = [
        'Sample acquisition',
        'Sequencing',
        'Surgery',
        'Diagnostics',
        'Diagnostic',
        'Diagnosis',
        'Treatment',
        'Lab_test',
        'Status',
        'IMAGING',
        'MEDONC',
        'Med Onc Assessment',
        'Pathology',
    ];

    const legend: TimelineLegendItem[] = [
        { label: 'Indeterminate', color: '#ffffff' },
        { label: 'Stable', color: '#dcdcdc' },
        { label: 'Mixed', color: '#daa520' },
        { label: 'Improving', color: 'rgb(44, 160, 44)' },
        { label: 'Worsening', color: 'rgb(214, 39, 40)' },
    ];

    // this differs from default in that on genie, we do NOT distinguish tracks based on subtype. we hide on subtype
    baseConfig.trackStructures = [
        ['TREATMENT', 'TREATMENT_TYPE', 'AGENT'],
        ['LAB_TEST', 'TEST'],
    ];

    // status track
    baseConfig.trackEventRenderers = baseConfig.trackEventRenderers || [];
    baseConfig.trackEventRenderers.push({
        trackTypeMatch: /Med Onc Assessment|MedOnc/i,
        legend,
        attributeOrder: ['CURATED_CANCER_STATUS', 'CANCER_STATUS'],
        configureTrack: (cat: TimelineTrackSpecification) => {
            cat.label = 'Med Onc Assessment';
            const _getEventColor = (event: TimelineEvent) => {
                if (event.end > event.start) {
                    // range
                    return POINT_COLOR;
                }
                return getEventColor(
                    event,
                    ['CURATED_CANCER_STATUS'],
                    [
                        { re: /indeter/i, color: '#ffffff' },
                        { re: /stable/i, color: '#dcdcdc' },
                        { re: /mixed/i, color: 'goldenrod' },
                        {
                            re: /improving/i,
                            color: 'rgb(44, 160, 44)',
                        },
                        {
                            re: /worsening/i,
                            color: 'rgb(214, 39, 40)',
                        },
                    ]
                );
            };
            cat.renderEvents = (events, y) => {
                if (events.length === 1) {
                    const color = _getEventColor(events[0]);
                    return (
                        <circle
                            cx="0"
                            cy={y}
                            r="4"
                            stroke="#999999"
                            fill={color}
                        />
                    );
                } else {
                    return null; // render default
                }
            };
        },
    });

    // imaging track
    baseConfig.trackEventRenderers.push({
        trackTypeMatch: /IMAGING/i,
        legend,
        attributeOrder: ['CURATED_CANCER_STATUS', 'CANCER_STATUS'],
        configureTrack: (cat: TimelineTrackSpecification) => {
            cat.label = 'Imaging Assessment';
            if (cat.items && cat.items.length) {
                const _getEventColor = (event: TimelineEvent) => {
                    if (event.end > event.start) {
                        // range
                        return POINT_COLOR;
                    }
                    return getEventColor(
                        event,
                        ['IMAGE_OVERALL', 'CURATED_CANCER_STATUS'],
                        [
                            {
                                re: /indeter|does not mention/i,
                                color: '#ffffff',
                            },
                            { re: /stable/i, color: 'gainsboro' },
                            { re: /mixed/i, color: 'goldenrod' },
                            {
                                re: /improving/i,
                                color: 'rgb(44, 160, 44)',
                            },
                            {
                                re: /worsening/i,
                                color: 'rgb(214, 39, 40)',
                            },
                        ]
                    );
                };

                cat.eventColorGetter = _getEventColor;
                cat.renderEvents = (events, y) => {
                    if (events.length === 1) {
                        const color = _getEventColor(events[0]);
                        return (
                            <circle
                                cx="0"
                                cy={y}
                                r="4"
                                stroke="#999999"
                                fill={color}
                            />
                        );
                    } else {
                        return null; // use default rendering
                    }
                };
            }
        },
    });
    return baseConfig;
}

export function buildBaseConfig(
    sampleManager: SampleManager,
    caseMetaData: ISampleMetaDeta
) {
    let baseConfig: ITimelineConfig = {
        sortOrder: [
            'Specimen',
            'Sample Acquisition',
            'Sequencing',
            'Surgery',
            'Med Onc',
            'Med Onc Assessment',
            'Status',
            'Diagnostics',
            'Diagnostic',
            'Imaging',
            'Imaging Assessment',
            'Treatment',
            'Diagnosis',
            'Lab_test',
            'Measurements',
        ],
        trackStructures: [
            ['TREATMENT', 'TREATMENT_TYPE', 'SUBTYPE', 'AGENT'],
            ['LAB_TEST', 'TEST'],
            ['DIAGNOSIS', 'SUBTYPE'],
            ['PATHOLOGY', 'SUBTYPE'],
        ],
        trackEventRenderers: [
            {
                trackTypeMatch: /TOXICITY/,
                configureTrack: (cat: TimelineTrackSpecification) => {},
            },

            {
                trackTypeMatch: /MEASUREMENTS/i,
                configureTrack: (cat: TimelineTrackSpecification) => {
                    if (cat.tracks) {
                        cat.tracks.forEach(track => {
                            if (track.items.length) {
                                if (allResultValuesAreNumerical(track.items)) {
                                    track.trackType =
                                        TimelineTrackType.LINE_CHART;
                                    track.getLineChartValue = e =>
                                        getNumericalAttrVal('RESULT', e);
                                }
                            }
                        });
                    }
                },
            },

            {
                trackTypeMatch: /LAB_TEST/i,
                configureTrack: (cat: TimelineTrackSpecification) => {
                    // Configure non-PSA tracks
                    if (cat.tracks) {
                        cat.tracks.forEach(track => {
                            if (track.type !== 'PSA') {
                                configureLABTESTSubTrack(track);
                            }
                        });
                    }

                    // Configure PSA track
                    const psaTrack = cat.tracks
                        ? cat.tracks.find(t => t.type === 'PSA')
                        : undefined;

                    if (psaTrack && psaTrack && psaTrack.items.length) {
                        psaTrack.trackType = TimelineTrackType.LINE_CHART;
                        psaTrack.getLineChartValue = (e: TimelineEvent) => {
                            const val =
                                getAttributeValue('VALUE', e) ||
                                getAttributeValue('RESULT', e);
                            if (val === undefined) {
                                return null;
                            } else {
                                return parseFloat(val.replace(/^[<>]/gi, ''));
                            }
                        };
                    }
                },
            },
            {
                trackTypeMatch: /^STATUS$/i,
                configureTrack: (cat: TimelineTrackSpecification) => {
                    cat.renderEvents = (
                        events: TimelineEvent[],
                        yCoordinate: number
                    ) => {
                        if (
                            events.length === 1 &&
                            events[0].event.attributes.find((attr: any) => {
                                return (
                                    !!attr.key.match(/^STATUS$/i) &&
                                    !!attr.value.match(/^DECEASED$/i)
                                );
                            })
                        ) {
                            // if an event has a "status" attribute with value "deceased",
                            // then render it as a black diamond
                            const size = 7;
                            return (
                                <rect
                                    x={0}
                                    y={yCoordinate - size / 2}
                                    fill={'black'}
                                    width={size}
                                    height={size}
                                    style={{
                                        transformBox: 'fill-box',
                                        transformOrigin: 'center',
                                        transform: 'rotate(45deg)',
                                    }}
                                />
                            );
                        } else {
                            // render default
                            return null;
                        }
                    };
                },
            },
            {
                trackTypeMatch: /SPECIMEN|SAMPLE ACQUISITION|SEQUENCING/i,
                configureTrack: (cat: TimelineTrackSpecification) => {
                    // we want a custom tooltip for samples, which includes clinical data
                    // not included in the timeline event
                    cat.renderTooltip = function(event: TimelineEvent) {
                        try {
                            const hoveredSample = event.event.attributes.find(
                                (att: any) => att.key === 'SAMPLE_ID'
                            );

                            if (!hoveredSample || !hoveredSample.value) {
                                return null;
                            }

                            const sampleWithClinicalData = sampleManager.samples.find(
                                sample => {
                                    return sample.id === hoveredSample.value;
                                }
                            );

                            const attributes = event.event.attributes.map(
                                attr => ({
                                    key: attr.key,
                                    value: attr.value,
                                })
                            );

                            // if we have clinical data, then add that in to attributes
                            sampleWithClinicalData &&
                                sampleWithClinicalData.clinicalData.forEach(
                                    d => {
                                        attributes.push({
                                            key: d.clinicalAttributeId,
                                            value: d.value,
                                        });
                                    }
                                );

                            // put them in order by key
                            const orderedAttributes = _.orderBy(
                                attributes,
                                attr => attr.key
                            );

                            return (
                                <table>
                                    <tbody>
                                        {sampleWithClinicalData && (
                                            <tr>
                                                <th>SAMPLE ID</th>
                                                <td>
                                                    {sampleWithClinicalData.id}
                                                </td>
                                            </tr>
                                        )}

                                        {orderedAttributes?.map(attr => {
                                            return (
                                                <tr>
                                                    <th>
                                                        {attr.key
                                                            .toUpperCase()
                                                            .replace(/_/g, ' ')}
                                                    </th>
                                                    <td>
                                                        {' '}
                                                        <ReactMarkdown
                                                            allowedElements={[
                                                                'p',
                                                                'a',
                                                            ]}
                                                            linkTarget={
                                                                '_blank'
                                                            }
                                                        >
                                                            {attr.value}
                                                        </ReactMarkdown>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr>
                                            <th>START DATE</th>
                                            <td className={'nowrap'}>
                                                {formatDate(event.start)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            );
                        } catch (ex) {
                            console.log(
                                'ERROR: Failed to render Timeline tooltip',
                                ex
                            );
                            return <div>Error rendering tooltip</div>;
                        }
                    };

                    cat.sortSimultaneousEvents = (events: TimelineEvent[]) => {
                        return _.sortBy(events, event => {
                            let ret = Number.POSITIVE_INFINITY;
                            const sampleInfo = getSampleInfo(
                                event,
                                caseMetaData
                            );
                            if (sampleInfo) {
                                const label = parseInt(sampleInfo.label);
                                if (!isNaN(label)) {
                                    ret = label;
                                }
                            }
                            return ret;
                        });
                    };

                    cat.renderEvents = (events: TimelineEvent[], y: number) => {
                        if (events.length === 1) {
                            const sampleInfo = getSampleInfo(
                                events[0],
                                caseMetaData
                            );
                            if (sampleInfo) {
                                return (
                                    <SampleMarker
                                        color={sampleInfo.color}
                                        label={sampleInfo.label}
                                        y={y}
                                    />
                                );
                            } else {
                                return null;
                            }
                        } else {
                            const colors: string[] = [];
                            const labels: string[] = [];
                            for (const event of events) {
                                const sampleInfo = getSampleInfo(
                                    event,
                                    caseMetaData
                                );
                                if (sampleInfo) {
                                    colors.push(sampleInfo.color);
                                    labels.push(sampleInfo.label);
                                }
                            }
                            return (
                                <MultipleSampleMarker
                                    colors={colors}
                                    labels={labels}
                                    y={y}
                                />
                            );
                        }
                    };
                },
            },
        ],
    };

    return baseConfig;
}

export function sortTracks(
    baseConfig: any,
    data: ClinicalEvent[]
): TimelineTrackSpecification[] {
    const trackStructuresByRoot = _.keyBy(
        baseConfig.trackStructures,
        arr => arr[0]
    );

    const dataByEventType = _.groupBy(data, (e: ClinicalEvent) =>
        e.eventType.toUpperCase()
    );

    const allTracksInOrder: string[] = _.uniq(
        baseConfig.sortOrder
            .map((name: string) => name.toUpperCase())
            .concat(Object.keys(dataByEventType))
    );

    const trackSpecifications = allTracksInOrder.reduce(
        (specs: TimelineTrackSpecification[], trackKey) => {
            const data = dataByEventType[trackKey];
            if (!data) {
                return specs;
            }

            if (trackKey in trackStructuresByRoot) {
                specs.push(
                    collapseOTHERTracks(
                        organizeDataIntoTracks(
                            trackKey,
                            trackStructuresByRoot[trackKey].slice(1),
                            data,
                            trackKey
                        )
                    )
                );
            } else {
                const trackSpec: Partial<TimelineTrackSpecification> = {
                    type: trackKey,
                    uid: trackKey,
                };
                trackSpec.items = makeItems(
                    data,
                    trackSpec as TimelineTrackSpecification
                );
                specs.push(trackSpec as TimelineTrackSpecification);
            }
            return specs;
        },
        []
    );

    return trackSpecifications;
}

function collapseOTHERTracks(rootTrack: TimelineTrackSpecification) {
    // In-place operation modifying the input.

    // Recursively find cases where there is only one child track, an Other,
    //  and absorb its items and descendents into the parent.
    // If rootTrack only has one child track and it is an OTHER track, then
    //  absorb its items and descendants into rootTrack. Keep going until
    //  this is no longer true.
    while (
        rootTrack.tracks &&
        rootTrack.tracks.length === 1 &&
        rootTrack.tracks[0].type === OTHER
    ) {
        rootTrack.items = rootTrack.items.concat(rootTrack.tracks[0].items);
        rootTrack.tracks = rootTrack.tracks[0].tracks;
    }

    // Recurse
    if (rootTrack.tracks) {
        rootTrack.tracks.forEach(collapseOTHERTracks);
    }

    // Finally, return the (possibly modified) argument for easy chaining
    return rootTrack;
}

function organizeDataIntoTracks(
    rootTrackType: string,
    trackStructure: string[],
    eventData: ClinicalEvent[],
    uid: string
): TimelineTrackSpecification {
    const dataByRootValue = _.groupBy(eventData, item => {
        const rootData = item.attributes.find(
            (att: any) => att.key === trackStructure[0]
        );
        return rootData ? rootData.value : OTHER;
    });

    const tracks: TimelineTrackSpecification[] = _.map(
        dataByRootValue,
        (data, rootValue) => {
            if (trackStructure.length > 1) {
                // If trackStructure is non-trivial, recurse for this rootValue
                const track = organizeDataIntoTracks(
                    rootValue,
                    trackStructure.slice(1),
                    data,
                    `${uid}.${rootValue}`
                );
                return track;
            } else {
                // If trackStructure is trivial, then just return a single track for this rootValue
                const trackSpec: Partial<TimelineTrackSpecification> = {
                    type: rootValue,
                    uid: `${uid}.${rootValue}`,
                };
                trackSpec.items = makeItems(
                    data,
                    trackSpec as TimelineTrackSpecification
                );
                return trackSpec as TimelineTrackSpecification;
            }
        }
    );

    // Finally, organize all tracks under an empty root track
    const track = {
        type: rootTrackType,
        tracks,
        items: [],
        uid,
    };

    return track;
}

function makeItems(
    eventData: ClinicalEvent[],
    containingTrack: TimelineTrackSpecification
) {
    return eventData.map((e: ClinicalEvent) => {
        return {
            end:
                e.endNumberOfDaysSinceDiagnosis ||
                e.startNumberOfDaysSinceDiagnosis,
            start: e.startNumberOfDaysSinceDiagnosis,
            event: e,
            containingTrack,
        };
    });
}

function getNumericalAttrVal(name: string, e: TimelineEvent) {
    const val = getAttributeValue(name, e);
    if (val === undefined) {
        return null;
    } else {
        return parseFloat(val.replace(/^[<>]/gi, ''));
    }
}
function configureLABTESTSubTrack(track: TimelineTrackSpecification) {
    if (track.items.length) {
        if (allResultValuesAreNumerical(track.items)) {
            track.trackType = TimelineTrackType.LINE_CHART;
            track.getLineChartValue = e => getNumericalAttrVal('RESULT', e);
        }
        // recurse
        if (track.tracks) {
            track.tracks.forEach(configureLABTESTSubTrack);
        }
    }
}

export function allResultValuesAreNumerical(events: TimelineEvent[]) {
    return _.every(events, e => {
        const val = getNumericalAttrVal('RESULT', e);
        return !!(val !== null && !isNaN(val));
    });
}
