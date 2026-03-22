import { assert } from 'chai';
import React from 'react';
import _ from 'lodash';
import {
    AlteredStatus,
    calculateAssociation,
    calculateLogOddsRatio,
    calculatePValue,
    countOccurences,
    formatLogOddsRatio,
    formatPValue,
    formatQValueWithStyle,
    getData,
    getFilteredData,
    getTrackPairsCountText,
} from './MutualExclusivityUtil';
import expect from 'expect';
import expectJSX from 'expect-jsx';
import { mount } from 'enzyme';
import MutualExclusivityTable from './MutualExclusivityTable';

expect.extend(expectJSX);

const exampleData = [
    {
        trackA: 'EGFR',
        trackB: 'KRAS',
        neitherCount: 0,
        aNotBCount: 5,
        bNotACount: 5,
        bothCount: 0,
        logOddsRatio: -Infinity,
        pValue: 0.007936507936507901,
        qValue: 0.04761904761904741,
        association: 'Mutual exclusivity',
    },
    {
        trackA: 'TP53',
        trackB: 'BRAF',
        neitherCount: 6,
        aNotBCount: 0,
        bNotACount: 1,
        bothCount: 3,
        logOddsRatio: Infinity,
        pValue: 0.03333333333333314,
        qValue: 0.09999999999999942,
        association: 'Co-occurrence',
    },
    {
        trackA: 'EGFR',
        trackB: 'TP53',
        neitherCount: 2,
        aNotBCount: 5,
        bNotACount: 3,
        bothCount: 0,
        logOddsRatio: -Infinity,
        pValue: 0.16666666666666585,
        qValue: 0.24999999999999878,
        association: 'Mutual exclusivity',
    },
    {
        trackA: 'KRAS',
        trackB: 'TP53',
        neitherCount: 5,
        aNotBCount: 2,
        bNotACount: 0,
        bothCount: 3,
        logOddsRatio: Infinity,
        pValue: 0.16666666666666585,
        qValue: 0.24999999999999878,
        association: 'Co-occurrence',
    },
    {
        trackA: 'EGFR',
        trackB: 'BRAF',
        neitherCount: 2,
        aNotBCount: 4,
        bNotACount: 3,
        bothCount: 1,
        logOddsRatio: -2.584962500721156,
        pValue: 0.5238095238095218,
        qValue: 0.5238095238095218,
        association: 'Mutual exclusivity',
    },
    {
        trackA: 'KRAS',
        trackB: 'BRAF',
        neitherCount: 4,
        aNotBCount: 2,
        bNotACount: 1,
        bothCount: 3,
        logOddsRatio: 2.584962500721156,
        pValue: 0.5238095238095218,
        qValue: 0.5238095238095218,
        association: 'Co-occurrence',
    },
];

const isSampleAlteredMap: any = {
    EGFR: [
        AlteredStatus.ALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.ALTERED,
        AlteredStatus.ALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.ALTERED,
        AlteredStatus.ALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.UNALTERED,
    ],
    KRAS: [
        AlteredStatus.UNALTERED,
        AlteredStatus.ALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.ALTERED,
        AlteredStatus.ALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.ALTERED,
        AlteredStatus.ALTERED,
    ],
    TP53: [
        AlteredStatus.UNALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.ALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.ALTERED,
        AlteredStatus.ALTERED,
    ],
    BRAF: [
        AlteredStatus.UNALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.ALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.ALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.UNALTERED,
        AlteredStatus.ALTERED,
        AlteredStatus.ALTERED,
    ],
};

describe('MutualExclusivityUtil', () => {
    describe('#calculateAssociation()', () => {
        it('returns Co-occurrence if log odds ratio is positive', () => {
            assert.equal(calculateAssociation(1), 'Co-occurrence');
        });

        it('returns Mutual exclusivity if log odds ratio is 0', () => {
            assert.equal(calculateAssociation(0), 'Mutual exclusivity');
        });

        it('returns Mutual exclusivity if log odds ratio is negative', () => {
            assert.equal(calculateAssociation(-1), 'Mutual exclusivity');
        });
    });

    describe('#countOccurences()', () => {
        it('returns [1, 0, 0, 1] for [AlteredStatus.UNALTERED, AlteredStatus.ALTERED] and [AlteredStatus.UNALTERED, AlteredStatus.ALTERED]', () => {
            assert.deepEqual(
                countOccurences(
                    [AlteredStatus.UNALTERED, AlteredStatus.ALTERED],
                    [AlteredStatus.UNALTERED, AlteredStatus.ALTERED]
                ),
                [1, 0, 0, 1]
            );
        });

        it('returns [1, 1, 1, 1] for [AlteredStatus.UNALTERED, AlteredStatus.ALTERED, AlteredStatus.UNALTERED, AlteredStatus.ALTERED] and [AlteredStatus.UNALTERED, AlteredStatus.ALTERED, AlteredStatus.ALTERED, AlteredStatus.UNALTERED]', () => {
            assert.deepEqual(
                countOccurences(
                    [
                        AlteredStatus.UNALTERED,
                        AlteredStatus.ALTERED,
                        AlteredStatus.UNALTERED,
                        AlteredStatus.ALTERED,
                    ],
                    [
                        AlteredStatus.UNALTERED,
                        AlteredStatus.ALTERED,
                        AlteredStatus.ALTERED,
                        AlteredStatus.UNALTERED,
                    ]
                ),
                [1, 1, 1, 1]
            );
        });

        it('returns [2, 0, 0, 0] for [AlteredStatus.UNALTERED, AlteredStatus.UNALTERED] and [AlteredStatus.UNALTERED, AlteredStatus.UNALTERED]', () => {
            assert.deepEqual(
                countOccurences(
                    [AlteredStatus.UNALTERED, AlteredStatus.UNALTERED],
                    [AlteredStatus.UNALTERED, AlteredStatus.UNALTERED]
                ),
                [2, 0, 0, 0]
            );
        });

        it('returns [1, 0, 1, 1] for [AlteredStatus.UNPROFILED, AlteredStatus.UNPROFILED, AlteredStatus.ALTERED, AlteredStatus.UNALTERED] and [AlteredStatus.ALTERED, AlteredStatus.ALTERED, AlteredStatus.UNALTERED, AlteredStatus.UNALTERED]', () => {
            assert.deepEqual(
                countOccurences(
                    [
                        AlteredStatus.UNPROFILED,
                        AlteredStatus.UNPROFILED,
                        AlteredStatus.ALTERED,
                        AlteredStatus.UNALTERED,
                    ],
                    [
                        AlteredStatus.ALTERED,
                        AlteredStatus.ALTERED,
                        AlteredStatus.UNALTERED,
                        AlteredStatus.UNALTERED,
                    ]
                ),
                [1, 0, 1, 0]
            );
        });

        it('returns [0, 0, 0, 0] for [AlteredStatus.UNPROFILED, AlteredStatus.UNPROFILED, AlteredStatus.ALTERED, AlteredStatus.UNALTERED] and [AlteredStatus.ALTERED, AlteredStatus.ALTERED, AlteredStatus.UNPROFILED, AlteredStatus.UNPROFILED]', () => {
            assert.deepEqual(
                countOccurences(
                    [
                        AlteredStatus.UNPROFILED,
                        AlteredStatus.UNPROFILED,
                        AlteredStatus.ALTERED,
                        AlteredStatus.UNALTERED,
                    ],
                    [
                        AlteredStatus.ALTERED,
                        AlteredStatus.ALTERED,
                        AlteredStatus.UNPROFILED,
                        AlteredStatus.UNPROFILED,
                    ]
                ),
                [0, 0, 0, 0]
            );
        });

        it('returns [0, 0, 0, 0] for [AlteredStatus.UNPROFILED, AlteredStatus.UNPROFILED, AlteredStatus.UNPROFILED, AlteredStatus.UNPROFILED] and [AlteredStatus.ALTERED, AlteredStatus.ALTERED, AlteredStatus.UNALTERED, AlteredStatus.UNALTERED]', () => {
            assert.deepEqual(
                countOccurences(
                    [
                        AlteredStatus.UNPROFILED,
                        AlteredStatus.UNPROFILED,
                        AlteredStatus.UNPROFILED,
                        AlteredStatus.UNPROFILED,
                    ],
                    [
                        AlteredStatus.ALTERED,
                        AlteredStatus.ALTERED,
                        AlteredStatus.UNALTERED,
                        AlteredStatus.UNALTERED,
                    ]
                ),
                [0, 0, 0, 0]
            );
        });
    });

    describe('#calculatePValue()', () => {
        it('returns 0.5961538461538457 for 4, 3, 7, 2', () => {
            assert.equal(calculatePValue(4, 3, 7, 2), 0.5961538461538457);
        });

        it('returns 0.12163918040979466 for 13, 7, 3, 7', () => {
            assert.equal(calculatePValue(13, 7, 3, 7), 0.12163918040979466);
        });
    });

    /*     describe("#calculateAdjustedPValue()", () => {
        it("returns 1 if bigger than 1", () => {
            assert.equal(calculateAdjustedPValue(0.345, 4), 1);
        });

        it("returns the value if smaller than 1", () => {
            assert.equal(calculateAdjustedPValue(0.001, 3), 0.003);
        });
    }); */

    describe('#calculateLogOddsRatio()', () => {
        it('returns -1.3923174227787605 for 4, 3, 7, 2', () => {
            assert.equal(
                calculateLogOddsRatio(4, 3, 7, 2),
                -1.3923174227787605
            );
        });

        it('returns 2.1154772174199357 for 13, 7, 3, 7', () => {
            assert.equal(
                calculateLogOddsRatio(13, 7, 3, 7),
                2.1154772174199357
            );
        });

        it('returns Infinity for 5, 0 ,1, 0', () => {
            assert.equal(calculateLogOddsRatio(5, 0, 1, 0), Infinity);
        });
    });

    /*     describe("#getMutuallyExclusiveCounts()", () => {
        it("returns [<span><b>no</b> gene pair</span>, null] for empty list", () => {
            const data: MutualExclusivity[] = [];
            const result = getMutuallyExclusiveCounts(data, n => n <= 0);
            expect(result[0]).toEqualJSX(<span><b>no</b> gene pair</span>);
            assert.isNull(result[1]);
        });

        it("returns [<span><b>no</b> gene pair</span>, null] for 0 matched data", () => {
            const data: MutualExclusivity[] = [
                {
                    "trackA": "EGFR",
                    "trackB": "KRAS",
                    "neitherCount": 0,
                    "aNotBCount": 5,
                    "bNotACount": 5,
                    "bothCount": 0,
                    "logOddsRatio": Infinity,
                    "pValue": 0.003968253968253968,
                    "qValue": 0.003968253968253968,
                    "association": "Co-occurrence"
                }
            ];
            const result = getMutuallyExclusiveCounts(data, n => n <= 0);
            expect(result[0]).toEqualJSX(<span><b>no</b> gene pair</span>);
            assert.isNull(result[1]);
        });

        it("returns [<span><b>1</b> gene pair</span>, <span> (none significant)</span>] for " +
            "1 matched 0 significant data", () => {

                const data: MutualExclusivity[] = [
                    {
                        "trackA": "EGFR",
                        "trackB": "KRAS",
                        "neitherCount": 0,
                        "aNotBCount": 5,
                        "bNotACount": 5,
                        "bothCount": 0,
                        "logOddsRatio": -2.1,
                        "pValue": 0.06,
                        "qValue": 0.06,
                        "association": "Mutual exclusivity"
                    }
                ];
                const result = getMutuallyExclusiveCounts(data, n => n <= 0);
                expect(result[0]).toEqualJSX(<span><b>1</b> gene pair</span>);
                expect(result[1]).toEqualJSX(<span> (none significant)</span>);
            });

        it("returns [<span><b>1</b> gene pair</span>, <span> (<b>1</b> significant)</span>] " +
            "for 1 matched 1 significant data", () => {

                const data: MutualExclusivity[] = [
                    {
                        "trackA": "EGFR",
                        "trackB": "KRAS",
                        "neitherCount": 0,
                        "aNotBCount": 5,
                        "bNotACount": 5,
                        "bothCount": 0,
                        "logOddsRatio": -2.1,
                        "pValue": 0.04,
                        "qValue": 0.04,
                        "association": "Mutual exclusivity"
                    }
                ];
                const result = getMutuallyExclusiveCounts(data, n => n <= 0);
                expect(result[0]).toEqualJSX(<span><b>1</b> gene pair</span>);
                expect(result[1]).toEqualJSX(<span> (<b>1</b> significant)</span>);
            });

        it("returns [<span><b>2</b> gene pairs</span>, <span> (<b>2</b> significant)</span>] " +
            "for 2 matched 2 significant data", () => {

                const data: MutualExclusivity[] = [
                    {
                        "trackA": "EGFR",
                        "trackB": "KRAS",
                        "neitherCount": 0,
                        "aNotBCount": 5,
                        "bNotACount": 5,
                        "bothCount": 0,
                        "logOddsRatio": -6.51,
                        "pValue": 0.02,
                        "qValue": 0.04,
                        "association": "Mutual exclusivity"
                    },
                    {
                        "trackA": "EGFR",
                        "trackB": "TP53",
                        "neitherCount": 2,
                        "aNotBCount": 5,
                        "bNotACount": 3,
                        "bothCount": 0,
                        "logOddsRatio": -2.1,
                        "pValue": 0.001,
                        "qValue": 0.002,
                        "association": "Mutual exclusivity"
                    }
                ];
                const result = getMutuallyExclusiveCounts(data, n => n <= 0);
                expect(result[0]).toEqualJSX(<span><b>2</b> gene pairs</span>);
                expect(result[1]).toEqualJSX(<span> (<b>2</b> significant)</span>);
            });
    }); */

    describe('#getCountsText()', () => {
        it('returns correct text', () => {
            const result = getTrackPairsCountText(
                exampleData,
                _.size(isSampleAlteredMap)
            );
            expect(result).toEqualJSX(
                <p>
                    The analysis tested <b>6</b> pairs between the <b>4</b>{' '}
                    tracks in the OncoPrint.
                </p>
            );
        });
    });

    describe('#getData()', () => {
        it('returns correct data', () => {
            const result = getData(isSampleAlteredMap);
            assert.deepEqual(result, exampleData);
        });
    });

    describe('#getFilteredData()', () => {
        it('returns the data correctly', () => {
            const result = getFilteredData(exampleData, true, false, true);
            assert.deepEqual(result, [
                {
                    trackA: 'EGFR',
                    trackB: 'KRAS',
                    neitherCount: 0,
                    aNotBCount: 5,
                    bNotACount: 5,
                    bothCount: 0,
                    logOddsRatio: -Infinity,
                    pValue: 0.007936507936507901,
                    qValue: 0.04761904761904741,
                    association: 'Mutual exclusivity',
                },
            ]);
        });
    });

    describe('#formatPValue()', () => {
        it('returns <0.001 for 0.0001', () => {
            assert.equal(formatPValue(0.0001), '<0.001');
        });

        it('returns 0.001 for 0.001', () => {
            assert.equal(formatPValue(0.001), '0.001');
        });

        it('returns 1.345 for 1.3454546', () => {
            assert.equal(formatPValue(1.3454546), '1.345');
        });

        it('returns 0.050 for 0.05', () => {
            assert.equal(formatPValue(0.05), '0.050');
        });
    });

    describe('#formatPValueWithStyle()', () => {
        it('returns <span>0.050</span> for 0.05', () => {
            expect(formatQValueWithStyle(0.05)).toEqualJSX(<span>0.050</span>);
        });

        it('returns <b><span>0.042</span></b> for 0.042', () => {
            expect(formatQValueWithStyle(0.042)).toEqualJSX(
                <b>
                    <span>0.042</span>
                </b>
            );
        });
    });

    describe('#formatLogOddsRatio()', () => {
        it('returns <-3 for -6.32', () => {
            assert.equal(formatLogOddsRatio(-6.32), '<-3');
        });

        it('returns -3.000 for -3', () => {
            assert.equal(formatLogOddsRatio(-3), '-3.000');
        });

        it('returns 0.230 for 0.23', () => {
            assert.equal(formatLogOddsRatio(0.23), '0.230');
        });

        it('returns 3.000 for 3', () => {
            assert.equal(formatLogOddsRatio(3), '3.000');
        });

        it('returns >3 for 4.32', () => {
            assert.equal(formatLogOddsRatio(4.32), '>3');
        });
    });

    describe('<MutualExclusivityTable/>', () => {
        it('returns rows correctly', () => {
            const data = [
                {
                    trackA: 'KRAS',
                    trackB: 'BRAF',
                    neitherCount: 4,
                    aNotBCount: 2,
                    bNotACount: 1,
                    bothCount: 3,
                    logOddsRatio: 1.791759469228055,
                    pValue: 0.23809523809523808,
                    qValue: 0.47619047619047616,
                    association: 'Co-occurrence',
                },
                {
                    trackA: 'TP53',
                    trackB: 'BRAF',
                    neitherCount: 6,
                    aNotBCount: 0,
                    bNotACount: 1,
                    bothCount: 3,
                    logOddsRatio: Infinity,
                    pValue: 0.003968253968253951,
                    qValue: 0.023809523809523704,
                    association: 'Co-occurrence',
                },
            ];

            const wrapper = mount(<MutualExclusivityTable data={data} />);
            let cells = wrapper.find('td');
            assert.equal(
                cells.at(0).html(),
                '<td><span><b>TP53</b></span></td>'
            );
            assert.equal(
                cells.at(1).html(),
                '<td><span><b>BRAF</b></span></td>'
            );
            assert.equal(cells.at(2).html(), '<td><span>6</span></td>');
            assert.equal(cells.at(3).html(), '<td><span>0</span></td>');
            assert.equal(cells.at(4).html(), '<td><span>1</span></td>');
            assert.equal(cells.at(5).html(), '<td><span>3</span></td>');
            assert.equal(cells.at(6).html(), '<td><span>&gt;3</span></td>');
            assert.equal(cells.at(7).html(), '<td><span>0.004</span></td>');
            assert.equal(
                cells.at(8).html(),
                '<td><b><span>0.024</span></b></td>'
            );
            assert.equal(
                cells
                    .at(9)
                    .html()
                    .replace(/<!--[^>]*-->/g, ''),
                '<td><div class="Tendency Significant">' +
                    'Co-occurrence</div></td>'
            );
            assert.equal(
                cells
                    .at(19)
                    .html()
                    .replace(/<!--[^>]*-->/g, ''),
                '<td><div class="Tendency">Co-occurrence</div></td>'
            );
        });
    });
});
