import { PatientSurvival } from 'shared/model/PatientSurvival';
import _ from 'lodash';
import { sortedFindIndexWith, sortedFindWith } from 'shared/lib/sortedFindWith';
import jStat from 'jStat';

import linearAlgebra from 'linear-algebra';
const { Vector, Matrix } = linearAlgebra();

type SurvivalCurveItem = Pick<PatientSurvival, 'months' | 'status'>;
class SurvivalCurve {
    private deathEvents: SurvivalCurveItem[];
    private deathsByMonth: { [month: number]: SurvivalCurveItem[] };

    private censorEvents: SurvivalCurveItem[];
    private censorsByMonth: { [month: number]: SurvivalCurveItem[] };

    constructor(private events: SurvivalCurveItem[]) {
        this.deathEvents = _.sortBy(
            events.filter(s => s.status),
            s => s.months
        );
        this.deathsByMonth = _.groupBy(this.deathEvents, s => s.months);

        this.censorEvents = _.sortBy(
            events.filter(s => !s.status),
            s => s.months
        );
        this.censorsByMonth = _.groupBy(this.censorEvents, s => s.months);
    }

    private getTotalEventsAtStartOf(
        sortedEvents: SurvivalCurveItem[],
        months: number
    ): number {
        if (sortedEvents.length === 0 || months <= sortedEvents[0].months) {
            // No events occurred before `months`
            return 0;
        }

        // We're looking for the latest death event before `months`.
        // Then we'll return the one-based index of that event to get
        //  the total number of deaths `before` months.
        const foundIndex = sortedFindIndexWith(sortedEvents, (event, index) => {
            if (event.months < months) {
                // This event is before `months`, but is it the latest such event?
                if (
                    index === sortedEvents.length - 1 ||
                    sortedEvents[index + 1].months >= months
                ) {
                    // There is no later such event
                    return 0;
                } else {
                    // There is a later such event, meaning we are too early in the list
                    return -1;
                }
            } else {
                // This event is not before `months`, meaning we are too late in the list
                return 1;
            }
        });

        return foundIndex! + 1;
    }
    public getTotalDeathsAtStartOf(months: number) {
        return this.getTotalEventsAtStartOf(this.deathEvents, months);
    }
    public getTotalCensorsAtStartOf(months: number) {
        return this.getTotalEventsAtStartOf(this.censorEvents, months);
    }
    public getDeathsExactlyAt(months: number) {
        return (this.deathsByMonth[months] || []).length;
    }
    public getCensorsExactlyAt(months: number) {
        return (this.censorsByMonth[months] || []).length;
    }
    public getTotalAtRiskAtStartOf(months: number) {
        return (
            this.events.length -
            this.getTotalDeathsAtStartOf(months) -
            this.getTotalCensorsAtStartOf(months)
        );
    }
}

const { map, sortBy, groupBy, reduce, last, filter } = _;

type UCSCSurvivalItem = {
    t: number;
    d: number;
    n: number;
    rate: number;
};

// source: https://github.com/ucscXena/ucsc-xena-client/blob/master/js/km.js
function expectedObservedEventNumber(
    si: UCSCSurvivalItem[],
    eventTimes: number[],
    eventTypes: (0 | 1)[]
) {
    var exits = sortBy(
            map(eventTimes, function(x, i) {
                return { tte: x, ev: eventTypes[i] };
            }),
            'tte'
        ), // sort and collate
        uexits = _.uniq(map(exits, 'tte')), // unique tte
        gexits = groupBy(exits, function(x) {
            return x.tte;
        }), // group by common time of exit
        data = reduce(
            uexits,
            function(a, tte) {
                // sorted by time stats from the input data as in tte,ev
                var group = gexits[tte],
                    l = last(a) || { n: exits.length, e: 0 },
                    events = filter(group, function(x) {
                        return x.ev;
                    });

                a.push({
                    n: l.n - l.e, // at risk
                    e: group.length, // number exiting
                    d: events.length, // number events (death)
                    t: group[0].tte, // time
                });
                return a;
            },
            [] as { n: number; e: number; d: number; t: number }[]
        ),
        expectedNumber,
        observedNumber,
        dataByTimeTable: { n: number; e: number; d: number; t: number }[] = [];

    si = si.filter(function(item) {
        //only keep the curve where there is an event
        if (item.d) {
            return true;
        } else {
            return false;
        }
    });

    expectedNumber = reduce(
        si,
        function(memo, item) {
            var pointerInData = _.find(data, function(x) {
                if (x.t === item.t) {
                    return true;
                }
                if (x.t > item.t) {
                    return true;
                }
                return false;
            });

            if (pointerInData) {
                var expected = pointerInData.n * item.rate;
                dataByTimeTable.push(pointerInData);
                return memo + expected;
            } else {
                return memo;
            }
        },
        0
    );

    observedNumber = filter(eventTypes, function(x) {
        return x === 1;
    }).length; //1 is the internal xena converted code for EVENT

    return {
        expected: expectedNumber,
        observed: observedNumber,
        dataByTimeTable: dataByTimeTable,
        timeNumber: dataByTimeTable.length,
    };
}

function _logRankTest(
    allGroupsRes: UCSCSurvivalItem[],
    groupsTte: number[][],
    groupsEv: (0 | 1)[][]
) {
    var KM_stats,
        pValue = null,
        dof, // degree of freedom
        i,
        j, //groups
        t, //timeIndex
        O_E_table: {
            expected: number;
            observed: number;
            dataByTimeTable: any;
            timeNumber: number;
        }[] = [],
        O_minus_E_vector: number[] = [],
        O_minus_E_vector_minus1: number[], // O-E and O-E drop the last element
        vv: number[][] = [],
        vv_minus1: number[][], //covariant matrix and covraiance matrix drops the last row and column
        N, //total number of samples
        Ki,
        Kj, // at risk number from each group
        n; //total observed

    _.each(groupsTte, function(groupTte, i) {
        var group = { tte: groupTte, ev: groupsEv[i] },
            r = expectedObservedEventNumber(allGroupsRes, group.tte, group.ev);
        //	(r.observed-r.expected)*(r.observed-r.expected)/r.expected, r.timeNumber);
        if (r.expected) {
            O_E_table.push(r);
            O_minus_E_vector.push(r.observed - r.expected);
        }
    });

    dof = O_E_table.length - 1;

    // logrank stats covariance matrix vv
    for (i = 0; i < O_E_table.length; i++) {
        vv.push([]);
        for (j = 0; j < O_E_table.length; j++) {
            vv[i].push(0);
        }
    }

    for (i = 0; i < O_E_table.length; i++) {
        for (j = i; j < O_E_table.length; j++) {
            for (t = 0; t < allGroupsRes.length; t++) {
                N = allGroupsRes[t].n;
                n = allGroupsRes[t].d;
                if (
                    t < O_E_table[i].timeNumber &&
                    t < O_E_table[j].timeNumber
                ) {
                    Ki = O_E_table[i].dataByTimeTable[t].n;
                    Kj = O_E_table[j].dataByTimeTable[t].n;
                    // https://books.google.com/books?id=nPkjIEVY-CsC&pg=PA451&lpg=PA451&dq=multivariate+hypergeometric+distribution+covariance&source=bl&ots=yoieGfA4bu&sig=dhRcSYKcYiqLXBPZWOaqzciViMs&hl=en&sa=X&ved=0CEQQ6AEwBmoVChMIkqbU09SuyAIVgimICh0J3w1x#v=onepage&q=multivariate%20hypergeometric%20distribution%20covariance&f=false
                    // when N==1: only 1 subject, no variance
                    if (i !== j && N !== 1) {
                        vv[i][j] -= (n * Ki * Kj * (N - n)) / (N * N * (N - 1));
                        vv[j][i] = vv[i][j];
                    } else {
                        //i==j
                        if (N !== 1) {
                            vv[i][i] +=
                                (n * Ki * (N - Ki) * (N - n)) /
                                (N * N * (N - 1));
                        }
                    }
                }
            }
        }
    }

    O_minus_E_vector_minus1 = O_minus_E_vector.slice(
        0,
        O_minus_E_vector.length - 1
    );
    vv_minus1 = vv.slice(0, vv.length - 1);
    for (i = 0; i < vv_minus1.length; i++) {
        vv_minus1[i] = vv_minus1[i].slice(0, vv_minus1[i].length - 1);
    }
    var vv_minus1_copy = vv_minus1.slice(0, vv_minus1.length);
    for (i = 0; i < vv_minus1.length; i++) {
        vv_minus1_copy[i] = vv_minus1[i].slice(0, vv_minus1[i].length);
    }

    if (dof > 0) {
        var m = new Matrix([O_minus_E_vector_minus1]),
            m_T = new Matrix([O_minus_E_vector_minus1]).trans(),
            vv_minus1_inv = new Matrix(jStat.inv(vv_minus1_copy)),
            mfinal = m.dot(vv_minus1_inv).dot(m_T);

        KM_stats = mfinal.data[0][0];

        pValue = 1 - jStat.chisquare.cdf(KM_stats, dof);
    }

    return {
        dof,
        KM_stats,
        pValue,
        O_E_table,
    };
}

export function logRankTest(...survivalCurves: SurvivalCurveItem[][]) {
    const allEvents = _.sortBy(_.flatten(survivalCurves), s => s.months);
    const curve = new SurvivalCurve(allEvents);

    const sortedCurves = survivalCurves.map(curveData => {
        return _.sortBy(curveData, d => d.months);
    });
    const groupsTte = sortedCurves.map(curveData => {
        return curveData.map(d => d.months);
    });
    const groupsEv = sortedCurves.map(curveData => {
        return curveData.map(d => +d.status as 0 | 1);
    });

    const survivalItems = _.uniqBy(allEvents, e => e.months)
        .map(e => {
            return {
                t: e.months,
                d: curve.getDeathsExactlyAt(e.months),
                n: curve.getTotalAtRiskAtStartOf(e.months),
                rate:
                    curve.getDeathsExactlyAt(e.months) /
                    curve.getTotalAtRiskAtStartOf(e.months),
            };
        })
        .filter(x => x.d > 0);
    return _logRankTest(survivalItems, groupsTte, groupsEv).pValue;
}

export function calculatePairWiseHazardRatio(
    controlGroup: string,
    ...survivalCurves: SurvivalCurveItem[][]
) {
    const allEvents = _.sortBy(_.flatten(survivalCurves), s => s.months);
    const curve = new SurvivalCurve(allEvents);
    const sortedCurves = survivalCurves.map(curveData => {
        return _.sortBy(curveData, d => d.months);
    });

    const groupsTte = sortedCurves.map(curveData => {
        return curveData.map(d => d.months);
    });
    const groupsEv = sortedCurves.map(curveData => {
        return curveData.map(d => +d.status as 0 | 1);
    });

    const survivalItems = _.uniqBy(allEvents, e => e.months)
        .map(e => {
            return {
                t: e.months,
                d: curve.getDeathsExactlyAt(e.months),
                n: curve.getTotalAtRiskAtStartOf(e.months),
                rate:
                    curve.getDeathsExactlyAt(e.months) /
                    curve.getTotalAtRiskAtStartOf(e.months),
            };
        })
        .filter(x => x.d > 0);
    const expectedObservedEvents = _logRankTest(
        survivalItems,
        groupsTte,
        groupsEv
    ).O_E_table;
    const expectedObservedRatioGroups = expectedObservedEvents.map(
        (entry, i) => ({
            name: 'Group ' + i,
            ratio: entry.observed / (entry.expected + 0.0001),
            observed: entry.observed,
            expected: entry.expected,
        })
    );
    const qnorm: number = 1.959963984540054;
    const controleGroup = expectedObservedRatioGroups.map(group => group.ratio);
    const expectedEventsControl = expectedObservedRatioGroups.map(
        group => group.expected
    );
    const hazardratio = expectedObservedRatioGroups.map(group => ({
        name: group.name,
        ratio: controleGroup.map(
            (ratioControl: number, i: number) => group.ratio / ratioControl
        ),
        expected: group.expected,
        observed: group.observed,
    }));
    const confidenceInterval = hazardratio.map((subgrp, i) => {
        return {
            name: subgrp.name,
            hazardInformation: subgrp.ratio.map((hr, j) => {
                return {
                    hazardRatio: hr,
                    upperCI: Math.exp(
                        Math.log(hr) +
                            qnorm *
                                Math.sqrt(
                                    1 / expectedEventsControl[j] +
                                        1 / expectedEventsControl[i]
                                )
                    ),
                    lowerCI: Math.exp(
                        Math.log(hr) -
                            qnorm *
                                Math.sqrt(
                                    1 / expectedEventsControl[j] +
                                        1 / expectedEventsControl[i]
                                )
                    ),
                };
            }),
        };
    });
    return confidenceInterval;
}
