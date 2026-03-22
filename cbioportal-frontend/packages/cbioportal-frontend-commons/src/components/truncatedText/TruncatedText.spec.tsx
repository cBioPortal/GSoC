import { default as TruncatedText, truncateText } from './TruncatedText';
import { default as DefaultTooltip } from '../defaultTooltip/DefaultTooltip';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount, ReactWrapper } from 'enzyme';

/**
 * @author Selcuk Onur Sumer
 */
describe('TruncatedText', () => {
    let componentShort: ReactWrapper<any, any>;
    let componentLong: ReactWrapper<any, any>;

    beforeEach(() => {
        const shortText = 'noTip';
        const longText =
            'it might be a good idea to truncate this text and show the full value in a tooltip';

        componentShort = mount(
            <TruncatedText
                text={shortText}
                tooltip={<span>{shortText}</span>}
            />
        );
        componentLong = mount(
            <TruncatedText text={longText} tooltip={<span>{longText}</span>} />
        );
    });

    it('truncates the text properly with a suffix', () => {
        const shortText = 'short_text';
        const longText = 'this_is_a_quite_long_text_in_my_opinion!';

        assert.equal(
            truncateText(shortText, '...', shortText.length + 5, 2),
            shortText,
            'actual and truncated values should be the same for short texts'
        );
        assert.notEqual(
            truncateText(longText, '...', 16, 2),
            longText,
            'actual and truncated values should be the different for long texts'
        );
        assert.equal(
            truncateText(longText, '...', 16, 2).length,
            16 + '...'.length,
            'truncated size should have fixed number of characters'
        );
        assert.equal(
            truncateText(longText, '...', 16, 2).indexOf('...'),
            16,
            'suffix should be at the end'
        );
    });

    it('properly adds tooltip', () => {
        assert.isFalse(
            componentShort.find(DefaultTooltip).exists(),
            'Tooltip should not exists for short texts'
        );
        assert.isTrue(
            componentLong.find(DefaultTooltip).exists(),
            'Tooltip should exists for long texts'
        );
    });
});
