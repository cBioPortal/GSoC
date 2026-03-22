import { assert } from 'chai';

import {
    BadgeSelectorOption,
    calculateBadgeAlignmentStyle,
    calculateBadgeAlignmentStyles,
    DEFAULT_BADGE_CHAR_WIDTH,
    DEFAULT_BADGE_CONTENT_PADDING,
} from './BadgeSelector';

describe('BadgeSelector', () => {
    describe('calculateBadgeWidth', () => {
        it('calculates badge width correctly for values of different lengths', () => {
            assert.deepEqual(
                calculateBadgeAlignmentStyle('6'.length, '6'.length).width,
                DEFAULT_BADGE_CHAR_WIDTH * 1 + DEFAULT_BADGE_CONTENT_PADDING * 2
            );

            assert.deepEqual(
                calculateBadgeAlignmentStyle('66'.length, '66'.length).width,
                DEFAULT_BADGE_CHAR_WIDTH * 2 + DEFAULT_BADGE_CONTENT_PADDING * 2
            );

            assert.deepEqual(
                calculateBadgeAlignmentStyle('666'.length, '666'.length).width,
                DEFAULT_BADGE_CHAR_WIDTH * 3 + DEFAULT_BADGE_CONTENT_PADDING * 2
            );

            assert.deepEqual(
                calculateBadgeAlignmentStyle('6666'.length, '6666'.length)
                    .width,
                DEFAULT_BADGE_CHAR_WIDTH * 4 + DEFAULT_BADGE_CONTENT_PADDING * 2
            );

            assert.deepEqual(
                calculateBadgeAlignmentStyle('66666'.length, '66666'.length)
                    .width,
                DEFAULT_BADGE_CHAR_WIDTH * 5 + DEFAULT_BADGE_CONTENT_PADDING * 2
            );

            assert.deepEqual(
                calculateBadgeAlignmentStyle('666666'.length, '666666'.length)
                    .width,
                DEFAULT_BADGE_CHAR_WIDTH * 6 + DEFAULT_BADGE_CONTENT_PADDING * 2
            );
        });
    });

    describe('calculateBadgeWidths', () => {
        const len1Width =
            DEFAULT_BADGE_CHAR_WIDTH * 1 + DEFAULT_BADGE_CONTENT_PADDING * 2;
        const len2Width =
            DEFAULT_BADGE_CHAR_WIDTH * 2 + DEFAULT_BADGE_CONTENT_PADDING * 2;
        const len3Width =
            DEFAULT_BADGE_CHAR_WIDTH * 3 + DEFAULT_BADGE_CONTENT_PADDING * 2;
        const len4Width =
            DEFAULT_BADGE_CHAR_WIDTH * 4 + DEFAULT_BADGE_CONTENT_PADDING * 2;
        const len5Width =
            DEFAULT_BADGE_CHAR_WIDTH * 5 + DEFAULT_BADGE_CONTENT_PADDING * 2;

        const options: BadgeSelectorOption[] = [
            {
                value: 'option 1',
                badgeContent: 1,
            },
            {
                value: 'option 2',
                badgeContent: 222,
            },
            {
                value: 'option 3',
                badgeContent: 33,
            },
            {
                value: 'option 4',
                badgeContent: 44,
            },
            {
                value: 'option 5',
                badgeContent: 55555,
            },
            {
                value: 'option 6',
                badgeContent: 666,
            },
            {
                value: 'option 7',
                badgeContent: 7777,
            },
        ];

        it('returns empty array when options is empty', () => {
            const result = calculateBadgeAlignmentStyles([], 1, false);
            assert.deepEqual(result, []);
        });

        it('returns empty array for # columns < 1', () => {
            const result = calculateBadgeAlignmentStyles(options, 0, false);
            assert.deepEqual(result, []);
        });

        it('calculates badge styles for # columns = 1, alignmentWithinBadge = false', () => {
            // columns => [1, 222, 33, 44, 55555, 666, 7777]
            const result = calculateBadgeAlignmentStyles(options, 1, false);

            // value = 1
            assert.equal(result[0].width, len1Width);
            assert.equal(result[0].marginLeft, (len5Width - len1Width) / 2);
            assert.equal(result[0].marginRight, (len5Width - len1Width) / 2);

            // value = 222
            assert.equal(result[1].width, len3Width);
            assert.equal(result[1].marginLeft, (len5Width - len3Width) / 2);
            assert.equal(result[1].marginRight, (len5Width - len3Width) / 2);

            // value = 33
            assert.equal(result[2].width, len2Width);
            assert.equal(result[2].marginLeft, (len5Width - len2Width) / 2);
            assert.equal(result[2].marginRight, (len5Width - len2Width) / 2);

            // value = 44
            assert.equal(result[3].width, len2Width);
            assert.equal(result[3].marginLeft, (len5Width - len2Width) / 2);
            assert.equal(result[3].marginRight, (len5Width - len2Width) / 2);

            // value = 55555
            assert.equal(result[4].width, len5Width);
            assert.equal(result[4].marginLeft, 0);
            assert.equal(result[4].marginRight, 0);

            // value = 666
            assert.equal(result[5].width, len3Width);
            assert.equal(result[5].marginLeft, (len5Width - len3Width) / 2);
            assert.equal(result[5].marginRight, (len5Width - len3Width) / 2);

            // value = 7777
            assert.equal(result[6].width, len4Width);
            assert.equal(result[6].marginLeft, (len5Width - len4Width) / 2);
            assert.equal(result[6].marginRight, (len5Width - len4Width) / 2);
        });

        it('calculates badge styles for # columns = 1, alignmentPaddingWithinBadge = true', () => {
            // columns => [1, 222, 33, 44, 55555, 666, 7777]
            const result = calculateBadgeAlignmentStyles(
                options,
                1,
                false,
                DEFAULT_BADGE_CHAR_WIDTH,
                DEFAULT_BADGE_CONTENT_PADDING,
                true
            );

            assert.deepEqual(result, [
                { width: len5Width },
                { width: len5Width },
                { width: len5Width },
                { width: len5Width },
                { width: len5Width },
                { width: len5Width },
                { width: len5Width },
            ]);
        });

        it('calculates badge styles for # columns = 2, alignmentWithinBadge = false', () => {
            // columns => [1, 33, 55555, 7777]
            //            [222, 44, 666]
            const result = calculateBadgeAlignmentStyles(options, 2, false);

            // value = 1
            assert.equal(result[0].width, len1Width);
            assert.equal(result[0].marginLeft, (len5Width - len1Width) / 2);
            assert.equal(result[0].marginRight, (len5Width - len1Width) / 2);

            // value = 222
            assert.equal(result[1].width, len3Width);
            assert.equal(result[1].marginLeft, 0);
            assert.equal(result[1].marginRight, 0);

            // value = 33
            assert.equal(result[2].width, len2Width);
            assert.equal(result[2].marginLeft, (len5Width - len2Width) / 2);
            assert.equal(result[2].marginRight, (len5Width - len2Width) / 2);

            // value = 44
            assert.equal(result[3].width, len2Width);
            assert.equal(result[3].marginLeft, (len3Width - len2Width) / 2);
            assert.equal(result[3].marginRight, (len3Width - len2Width) / 2);

            // value = 55555
            assert.equal(result[4].width, len5Width);
            assert.equal(result[4].marginLeft, 0);
            assert.equal(result[4].marginRight, 0);

            // value = 666
            assert.equal(result[5].width, len3Width);
            assert.equal(result[5].marginLeft, 0);
            assert.equal(result[5].marginRight, 0);

            // value = 7777
            assert.equal(result[6].width, len4Width);
            assert.equal(result[6].marginLeft, (len5Width - len4Width) / 2);
            assert.equal(result[6].marginRight, (len5Width - len4Width) / 2);
        });

        it('calculates badge styles for # columns = 2, alignmentPaddingWithinBadge = true', () => {
            // columns => [1, 33, 55555, 7777]
            //            [222, 44, 666]
            const result = calculateBadgeAlignmentStyles(
                options,
                2,
                false,
                DEFAULT_BADGE_CHAR_WIDTH,
                DEFAULT_BADGE_CONTENT_PADDING,
                true
            );

            assert.deepEqual(result, [
                { width: len5Width },
                { width: len3Width },
                { width: len5Width },
                { width: len3Width },
                { width: len5Width },
                { width: len3Width },
                { width: len5Width },
            ]);
        });

        it('calculates badge styles for # columns = 3, alignmentPaddingWithinBadge = false', () => {
            // columns => [1, 44, 7777]
            //            [222, 55555]
            //            [33, 666]
            const result = calculateBadgeAlignmentStyles(options, 3, false);

            // value = 1
            assert.equal(result[0].width, len1Width);
            assert.equal(result[0].marginLeft, (len4Width - len1Width) / 2);
            assert.equal(result[0].marginRight, (len4Width - len1Width) / 2);

            // value = 222
            assert.equal(result[1].width, len3Width);
            assert.equal(result[1].marginLeft, (len5Width - len3Width) / 2);
            assert.equal(result[1].marginRight, (len5Width - len3Width) / 2);

            // value = 33
            assert.equal(result[2].width, len2Width);
            assert.equal(result[2].marginLeft, (len3Width - len2Width) / 2);
            assert.equal(result[2].marginRight, (len3Width - len2Width) / 2);

            // value = 44
            assert.equal(result[3].width, len2Width);
            assert.equal(result[3].marginLeft, (len4Width - len2Width) / 2);
            assert.equal(result[3].marginRight, (len4Width - len2Width) / 2);

            // value = 55555
            assert.equal(result[4].width, len5Width);
            assert.equal(result[4].marginLeft, 0);
            assert.equal(result[4].marginRight, 0);

            // value = 666
            assert.equal(result[5].width, len3Width);
            assert.equal(result[5].marginLeft, 0);
            assert.equal(result[5].marginRight, 0);

            // value = 7777
            assert.equal(result[6].width, len4Width);
            assert.equal(result[6].marginLeft, 0);
            assert.equal(result[6].marginRight, 0);
        });

        it('calculates badge styles for # columns = 3, alignmentPaddingWithinBadge = true', () => {
            // columns => [1, 44, 7777]
            //            [222, 55555]
            //            [33, 666]
            const result = calculateBadgeAlignmentStyles(
                options,
                3,
                false,
                DEFAULT_BADGE_CHAR_WIDTH,
                DEFAULT_BADGE_CONTENT_PADDING,
                true
            );

            assert.deepEqual(result, [
                { width: len4Width },
                { width: len5Width },
                { width: len3Width },
                { width: len4Width },
                { width: len5Width },
                { width: len3Width },
                { width: len4Width },
            ]);
        });

        it('calculates badge styles for # columns = 4, alignmentPaddingWithinBadge = false', () => {
            // columns => [1, 55555]
            //            [222, 666]
            //            [33, 7777]
            //            [44]
            const result = calculateBadgeAlignmentStyles(options, 4, false);

            // value = 1
            assert.equal(result[0].width, len1Width);
            assert.equal(result[0].marginLeft, (len5Width - len1Width) / 2);
            assert.equal(result[0].marginRight, (len5Width - len1Width) / 2);

            // value = 222
            assert.equal(result[1].width, len3Width);
            assert.equal(result[1].marginLeft, 0);
            assert.equal(result[1].marginRight, 0);

            // value = 33
            assert.equal(result[2].width, len2Width);
            assert.equal(result[2].marginLeft, (len4Width - len2Width) / 2);
            assert.equal(result[2].marginRight, (len4Width - len2Width) / 2);

            // value = 44
            assert.equal(result[3].width, len2Width);
            assert.equal(result[3].marginLeft, 0);
            assert.equal(result[3].marginRight, 0);

            // value = 55555
            assert.equal(result[4].width, len5Width);
            assert.equal(result[4].marginLeft, 0);
            assert.equal(result[4].marginRight, 0);

            // value = 666
            assert.equal(result[5].width, len3Width);
            assert.equal(result[5].marginLeft, 0);
            assert.equal(result[5].marginRight, 0);

            // value = 7777
            assert.equal(result[6].width, len4Width);
            assert.equal(result[6].marginLeft, 0);
            assert.equal(result[6].marginRight, 0);
        });

        it('calculates badge styles for # columns = 4, alignmentPaddingWithinBadge = true', () => {
            // columns => [1, 55555]
            //            [222, 666]
            //            [33, 7777]
            //            [44]
            const result = calculateBadgeAlignmentStyles(
                options,
                4,
                false,
                DEFAULT_BADGE_CHAR_WIDTH,
                DEFAULT_BADGE_CONTENT_PADDING,
                true
            );

            assert.deepEqual(result, [
                { width: len5Width },
                { width: len3Width },
                { width: len4Width },
                { width: len2Width },
                { width: len5Width },
                { width: len3Width },
                { width: len4Width },
            ]);
        });

        it('calculates badge styles for # columns = 5, alignmentPaddingWithinBadge = false', () => {
            // columns => [1, 666]
            //            [222, 7777]
            //            [33]
            //            [44]
            //            [55555]
            const result = calculateBadgeAlignmentStyles(options, 5, false);

            // value = 1
            assert.equal(result[0].width, len1Width);
            assert.equal(result[0].marginLeft, (len3Width - len1Width) / 2);
            assert.equal(result[0].marginRight, (len3Width - len1Width) / 2);

            // value = 222
            assert.equal(result[1].width, len3Width);
            assert.equal(result[1].marginLeft, (len4Width - len3Width) / 2);
            assert.equal(result[1].marginRight, (len4Width - len3Width) / 2);

            // value = 33
            assert.equal(result[2].width, len2Width);
            assert.equal(result[2].marginLeft, 0);
            assert.equal(result[2].marginRight, 0);

            // value = 44
            assert.equal(result[3].width, len2Width);
            assert.equal(result[3].marginLeft, 0);
            assert.equal(result[3].marginRight, 0);

            // value = 55555
            assert.equal(result[4].width, len5Width);
            assert.equal(result[4].marginLeft, 0);
            assert.equal(result[4].marginRight, 0);

            // value = 666
            assert.equal(result[5].width, len3Width);
            assert.equal(result[5].marginLeft, 0);
            assert.equal(result[5].marginRight, 0);

            // value = 7777
            assert.equal(result[6].width, len4Width);
            assert.equal(result[6].marginLeft, 0);
            assert.equal(result[6].marginRight, 0);
        });

        it('calculates badge styles for # columns = 5, alignmentPaddingWithinBadge = true', () => {
            // columns => [1, 666]
            //            [222, 7777]
            //            [33]
            //            [44]
            //            [55555]
            const result = calculateBadgeAlignmentStyles(
                options,
                5,
                false,
                DEFAULT_BADGE_CHAR_WIDTH,
                DEFAULT_BADGE_CONTENT_PADDING,
                true
            );

            assert.deepEqual(result, [
                { width: len3Width },
                { width: len4Width },
                { width: len2Width },
                { width: len2Width },
                { width: len5Width },
                { width: len3Width },
                { width: len4Width },
            ]);
        });

        it('calculates badge styles for # columns = 6, alignmentPaddingWithinBadge = false', () => {
            // columns => [1, 7777]
            //            [222]
            //            [33]
            //            [44]
            //            [55555]
            //            [666]
            const result = calculateBadgeAlignmentStyles(options, 6, false);

            // value = 1
            assert.equal(result[0].width, len1Width);
            assert.equal(result[0].marginLeft, (len4Width - len1Width) / 2);
            assert.equal(result[0].marginRight, (len4Width - len1Width) / 2);

            // value = 222
            assert.equal(result[1].width, len3Width);
            assert.equal(result[1].marginLeft, 0);
            assert.equal(result[1].marginRight, 0);

            // value = 33
            assert.equal(result[2].width, len2Width);
            assert.equal(result[2].marginLeft, 0);
            assert.equal(result[2].marginRight, 0);

            // value = 44
            assert.equal(result[3].width, len2Width);
            assert.equal(result[3].marginLeft, 0);
            assert.equal(result[3].marginRight, 0);

            // value = 55555
            assert.equal(result[4].width, len5Width);
            assert.equal(result[4].marginLeft, 0);
            assert.equal(result[4].marginRight, 0);

            // value = 666
            assert.equal(result[5].width, len3Width);
            assert.equal(result[5].marginLeft, 0);
            assert.equal(result[5].marginRight, 0);

            // value = 7777
            assert.equal(result[6].width, len4Width);
            assert.equal(result[6].marginLeft, 0);
            assert.equal(result[6].marginRight, 0);
        });

        it('calculates badge styles for # columns = 6, alignmentPaddingWithinBadge = true', () => {
            // columns => [1, 7777]
            //            [222]
            //            [33]
            //            [44]
            //            [55555]
            //            [666]
            const result = calculateBadgeAlignmentStyles(
                options,
                6,
                false,
                DEFAULT_BADGE_CHAR_WIDTH,
                DEFAULT_BADGE_CONTENT_PADDING,
                true
            );

            assert.deepEqual(result, [
                { width: len4Width },
                { width: len3Width },
                { width: len2Width },
                { width: len2Width },
                { width: len5Width },
                { width: len3Width },
                { width: len4Width },
            ]);
        });

        it('calculates badge styles for # columns = 7, alignmentPaddingWithinBadge = false', () => {
            // columns => [1]
            //            [222]
            //            [33]
            //            [44]
            //            [55555]
            //            [666]
            //            [7777]
            const result = calculateBadgeAlignmentStyles(options, 7, false);

            // value = 1
            assert.equal(result[0].width, len1Width);
            assert.equal(result[0].marginLeft, 0);
            assert.equal(result[0].marginRight, 0);

            // value = 222
            assert.equal(result[1].width, len3Width);
            assert.equal(result[1].marginLeft, 0);
            assert.equal(result[1].marginRight, 0);

            // value = 33
            assert.equal(result[2].width, len2Width);
            assert.equal(result[2].marginLeft, 0);
            assert.equal(result[2].marginRight, 0);

            // value = 44
            assert.equal(result[3].width, len2Width);
            assert.equal(result[3].marginLeft, 0);
            assert.equal(result[3].marginRight, 0);

            // value = 55555
            assert.equal(result[4].width, len5Width);
            assert.equal(result[4].marginLeft, 0);
            assert.equal(result[4].marginRight, 0);

            // value = 666
            assert.equal(result[5].width, len3Width);
            assert.equal(result[5].marginLeft, 0);
            assert.equal(result[5].marginRight, 0);

            // value = 7777
            assert.equal(result[6].width, len4Width);
            assert.equal(result[6].marginLeft, 0);
            assert.equal(result[6].marginRight, 0);
        });

        it('calculates badge styles for # columns = 7, alignmentPaddingWithinBadge = true', () => {
            // columns => [1]
            //            [222]
            //            [33]
            //            [44]
            //            [55555]
            //            [666]
            //            [7777]
            const result = calculateBadgeAlignmentStyles(
                options,
                7,
                false,
                DEFAULT_BADGE_CHAR_WIDTH,
                DEFAULT_BADGE_CONTENT_PADDING,
                true
            );

            assert.deepEqual(result, [
                { width: len1Width },
                { width: len3Width },
                { width: len2Width },
                { width: len2Width },
                { width: len5Width },
                { width: len3Width },
                { width: len4Width },
            ]);
        });

        it('calculates badge styles for # columns > # options, alignmentPaddingWithinBadge = false', () => {
            // columns => [1]
            //            [222]
            //            [33]
            //            [44]
            //            [55555]
            //            [666]
            //            [7777]
            const result = calculateBadgeAlignmentStyles(options, 666, false);

            assert.equal(result.length, 7);

            // value = 1
            assert.equal(result[0].width, len1Width);
            assert.equal(result[0].marginLeft, 0);
            assert.equal(result[0].marginRight, 0);

            // value = 222
            assert.equal(result[1].width, len3Width);
            assert.equal(result[1].marginLeft, 0);
            assert.equal(result[1].marginRight, 0);

            // value = 33
            assert.equal(result[2].width, len2Width);
            assert.equal(result[2].marginLeft, 0);
            assert.equal(result[2].marginRight, 0);

            // value = 44
            assert.equal(result[3].width, len2Width);
            assert.equal(result[3].marginLeft, 0);
            assert.equal(result[3].marginRight, 0);

            // value = 55555
            assert.equal(result[4].width, len5Width);
            assert.equal(result[4].marginLeft, 0);
            assert.equal(result[4].marginRight, 0);

            // value = 666
            assert.equal(result[5].width, len3Width);
            assert.equal(result[5].marginLeft, 0);
            assert.equal(result[5].marginRight, 0);

            // value = 7777
            assert.equal(result[6].width, len4Width);
            assert.equal(result[6].marginLeft, 0);
            assert.equal(result[6].marginRight, 0);
        });

        it('calculates badge styles for # columns > # options, alignmentPaddingWithinBadge = true', () => {
            // columns => [1]
            //            [222]
            //            [33]
            //            [44]
            //            [55555]
            //            [666]
            //            [7777]
            const result = calculateBadgeAlignmentStyles(
                options,
                666,
                false,
                DEFAULT_BADGE_CHAR_WIDTH,
                DEFAULT_BADGE_CONTENT_PADDING,
                true
            );

            assert.deepEqual(result, [
                { width: len1Width },
                { width: len3Width },
                { width: len2Width },
                { width: len2Width },
                { width: len5Width },
                { width: len3Width },
                { width: len4Width },
            ]);
        });

        it('calculates a uniform badge width regardless of the # columns or alignmentPaddingWithinBadge value', () => {
            const expected = [
                { width: len5Width },
                { width: len5Width },
                { width: len5Width },
                { width: len5Width },
                { width: len5Width },
                { width: len5Width },
                { width: len5Width },
            ];

            assert.deepEqual(
                calculateBadgeAlignmentStyles(options, 1, true),
                expected
            );
            assert.deepEqual(
                calculateBadgeAlignmentStyles(options, 2, true),
                expected
            );
            assert.deepEqual(
                calculateBadgeAlignmentStyles(
                    options,
                    3,
                    true,
                    DEFAULT_BADGE_CHAR_WIDTH,
                    DEFAULT_BADGE_CONTENT_PADDING,
                    true
                ),
                expected
            );
            assert.deepEqual(
                calculateBadgeAlignmentStyles(
                    options,
                    4,
                    true,
                    DEFAULT_BADGE_CHAR_WIDTH,
                    DEFAULT_BADGE_CONTENT_PADDING,
                    false
                ),
                expected
            );
            assert.deepEqual(
                calculateBadgeAlignmentStyles(
                    options,
                    5,
                    true,
                    DEFAULT_BADGE_CHAR_WIDTH,
                    DEFAULT_BADGE_CONTENT_PADDING,
                    true
                ),
                expected
            );
            assert.deepEqual(
                calculateBadgeAlignmentStyles(
                    options,
                    6,
                    true,
                    DEFAULT_BADGE_CHAR_WIDTH,
                    DEFAULT_BADGE_CONTENT_PADDING,
                    false
                ),
                expected
            );
            assert.deepEqual(
                calculateBadgeAlignmentStyles(options, 7, true),
                expected
            );
            assert.deepEqual(
                calculateBadgeAlignmentStyles(options, 666, true),
                expected
            );
            assert.deepEqual(
                calculateBadgeAlignmentStyles(options, 666, true),
                expected
            );
        });
    });
});
