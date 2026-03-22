import { assert } from 'chai';

import { Mutation } from 'cbioportal-utils';

import {
    byMiddlemostPosition,
    byMutationCount,
    byWhetherExistsInADomain,
    calcCountRange,
    calcYMaxInput,
    getCommonYAxisMaxSliderValue,
    getYAxisMaxInputValue,
    getYAxisMaxSliderValue,
    lollipopLabelText,
    lollipopLabelTextAnchor,
} from './LollipopPlotUtils';

describe('LollipopPlotUtils', () => {
    let mutationsAtPosition: Mutation[];

    beforeAll(() => {
        mutationsAtPosition = [
            {
                proteinChange: 'G12A',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12C',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12C',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12C',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12D',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12D',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12D',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12D',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12D',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12N',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12N',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12V',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12V',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12V',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12V',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12S',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'G12R',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'GG12AC',
                proteinPosStart: 12,
            },
            {
                proteinChange: 'GG12DC',
                proteinPosStart: 12,
            },
        ];
    });

    describe('lollipopLabelText', () => {
        it('generates lollipop labels wrt different size selections', () => {
            assert.equal(
                lollipopLabelText(mutationsAtPosition),
                'G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, -1),
                'G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, 0),
                'G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC'
            );

            assert.equal(
                lollipopLabelText(mutationsAtPosition, 1),
                'G12D and 8 more'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, 2),
                'G12D/V and 7 more'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, 3),
                'G12D/V/C and 6 more'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, 4),
                'G12D/V/C/N and 5 more'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, 5),
                'G12D/V/C/N/A and 4 more'
            );
            assert.equal(
                lollipopLabelText(mutationsAtPosition, 6),
                'G12D/V/C/N/A/R and 3 more'
            );
        });
    });

    //  See https://stackoverflow.com/questions/33269093/how-to-add-canvas-support-to-my-tests-in-jest
    // describe('lollipopLabelTextAnchor', () => {
    //     it ('determines anchor position wrt protein change position and label length', () => {
    //         assert.equal(lollipopLabelTextAnchor("G12D", 1, "arial", 10, 640, 640),
    //             "start");
    //         assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 1, "arial", 10, 640, 640),
    //             "start");
    //         assert.equal(lollipopLabelTextAnchor("G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC", 1, "arial", 10, 640, 640),
    //             "start");
    //
    //         assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 100, "arial", 10, 640, 640),
    //             "middle");
    //         assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 320, "arial", 10, 640, 640),
    //             "middle");
    //         assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 540, "arial", 10, 640, 640),
    //             "middle");
    //         assert.equal(lollipopLabelTextAnchor("G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC", 320, "arial", 10, 640, 640),
    //             "middle");
    //
    //         assert.equal(lollipopLabelTextAnchor("G12D", 639, "arial", 10, 640, 640),
    //             "end");
    //         assert.equal(lollipopLabelTextAnchor("G12D/V/C and 6 more", 620, "arial", 10, 640, 640),
    //             "end");
    //         assert.equal(lollipopLabelTextAnchor("G12D/12V/12C/12N/12A/12R/12S/G12AC/G12DC", 540, "arial", 10, 640, 640),
    //             "end");
    //     });
    // });

    describe('calcYMaxInput', () => {
        it('gets the maximum y-axis value for the lollipop plot slider', () => {
            assert.equal(calcYMaxInput(1, 0.1, [1, 5], [0, 0], true), 1);
            assert.equal(calcYMaxInput(5, 0.1, [1, 5], [0, 0], true), 5);
            assert.equal(calcYMaxInput(5, 0.1, [1, 5], [0, 0], false), 5);
        });
    });

    describe('getCommonYAxisMaxSliderValue', () => {
        it('gets the common y-axis max slider value based on the highest two minimums', () => {
            assert.equal(
                getCommonYAxisMaxSliderValue(0.1, [0, 0], [1, 5], undefined),
                5
            );
        });
    });

    describe('getYAxisMaxSliderValue', () => {
        it('gets the minimum y-axis max slider value between the default and user input', () => {
            assert.equal(getYAxisMaxSliderValue(0.1, [1, 5], undefined), 5);
            assert.equal(getYAxisMaxSliderValue(0.1, [1, 5], 3), 3);
        });
    });

    describe('getYAxisMaxInputValue', () => {
        it('gets the max input value', () => {
            assert.equal(getYAxisMaxInputValue(0.1, '2'), 2);
            assert.equal(getYAxisMaxInputValue(0.1, '0'), 0.1);
        });
    });

    describe('calcCountRange', () => {
        it('calculates the count range based on whether the lollipops exist', () => {
            assert.deepEqual(
                calcCountRange(
                    [
                        {
                            codon: 223,
                            count: 1,
                        },
                        {
                            codon: 101,
                            count: 1,
                        },
                        {
                            codon: 182,
                            count: 1,
                        },
                        {
                            codon: 165,
                            count: 1,
                        },
                    ],
                    5,
                    1
                ),
                [1, 5]
            );
        });
    });

    describe('byMiddlemostPosition', () => {
        it('ranks lollipops by the smallest distance to average codon in descending order', () => {
            assert.equal(
                byMiddlemostPosition(162)(
                    {
                        codon: 182,
                        count: 1,
                    },
                    {
                        codon: 223,
                        count: 1,
                    }
                ),
                -1,
                "if first lollipop is closer, don't pick the second"
            );

            assert.equal(
                byMiddlemostPosition(162)(
                    {
                        codon: 223,
                        count: 1,
                    },
                    {
                        codon: 182,
                        count: 1,
                    }
                ),
                1,
                "if second lollipop is closer, don't pick the first"
            );

            assert.equal(
                byMiddlemostPosition(162)(
                    {
                        codon: 142,
                        count: 1,
                    },
                    {
                        codon: 182,
                        count: 1,
                    }
                ),
                0,
                'if both lollipops are just as close, neither is preferred'
            );
        });
    });

    describe('byWhetherExistsInADomain', () => {
        it('ranks lollipops by whether they exist in a domain', () => {
            assert.equal(
                byWhetherExistsInADomain([
                    {
                        pfamDomainEnd: 280,
                        pfamDomainId: 'PF01852',
                        pfamDomainStart: 78,
                    },
                ])(
                    {
                        codon: 182,
                        count: 1,
                    },
                    {
                        codon: 223,
                        count: 1,
                    }
                ),
                0,
                'if both lollipops are in a domain, neither is preferred'
            );

            assert.equal(
                byWhetherExistsInADomain([])(
                    {
                        codon: 366,
                        count: 1,
                    },
                    {
                        codon: 226,
                        count: 1,
                    }
                ),
                0,
                'if both lollipops are not in a domain, neither is preferred'
            );

            assert.equal(
                byWhetherExistsInADomain([
                    {
                        pfamDomainEnd: 200,
                        pfamDomainId: 'PF01852',
                        pfamDomainStart: 78,
                    },
                ])(
                    {
                        codon: 182,
                        count: 1,
                    },
                    {
                        codon: 223,
                        count: 1,
                    }
                ),
                -1,
                "if the first lollipop is in a domain, don't pick the second"
            );

            assert.equal(
                byWhetherExistsInADomain([
                    {
                        pfamDomainEnd: 200,
                        pfamDomainId: 'PF01852',
                        pfamDomainStart: 78,
                    },
                ])(
                    {
                        codon: 223,
                        count: 1,
                    },
                    {
                        codon: 182,
                        count: 1,
                    }
                ),
                1,
                "if the second lollipop is in a domain, don't pick the first"
            );
        });
    });

    describe('byMutationCount', () => {
        it('ranks lollipops in descending order of their count', () => {
            assert.equal(
                byMutationCount(
                    {
                        codon: 182,
                        count: 1,
                    },
                    {
                        codon: 223,
                        count: 1,
                    }
                ),
                0,
                'if both lollipops have the same count, neither is preferred'
            );

            assert.equal(
                byMutationCount(
                    {
                        codon: 182,
                        count: 5,
                    },
                    {
                        codon: 223,
                        count: 1,
                    }
                ),
                -1,
                "if first lollipop has higher count, don't pick the second"
            );

            assert.equal(
                byMutationCount(
                    {
                        codon: 182,
                        count: 1,
                    },
                    {
                        codon: 223,
                        count: 5,
                    }
                ),
                1,
                "if second lollipop has higher count, don't pick the first"
            );
        });
    });
});
