import { assert } from 'chai';
import {
    doesOptionMatchSearchText,
    ISelectOption,
} from './GenericAssaySelectionUtils';

describe('GenericAssaySelectionUtils', () => {
    describe('doesOptionMatchSearchText()', () => {
        const TEXT_FOR_MATCHING = 'TP53';
        const VALID_MATCHING = 'TP53 in the text';
        const VALID_MATCHING_IGNORECASE = 'tp53 in the text';

        it('returns true for undefined or empty text', () => {
            const emptyText = '';
            const undefinedText = undefined;

            const option: ISelectOption = {
                value: VALID_MATCHING,
                label: VALID_MATCHING,
            };
            assert.equal(doesOptionMatchSearchText(emptyText, option), true);
            assert.equal(
                doesOptionMatchSearchText(undefinedText as any, option),
                true
            );
        });

        it('returns true for matched text', () => {
            const onlyLabelMatchOption: ISelectOption = {
                value: '',
                label: VALID_MATCHING,
            };
            const onlyValueMatchOption: ISelectOption = {
                value: VALID_MATCHING,
                label: '',
            };
            const onlyLabelMatchOptionIgnorecase: ISelectOption = {
                value: '',
                label: VALID_MATCHING_IGNORECASE,
            };
            const onlyValueMatchOptionIgnorecase: ISelectOption = {
                value: VALID_MATCHING_IGNORECASE,
                label: '',
            };
            assert.equal(
                doesOptionMatchSearchText(
                    TEXT_FOR_MATCHING,
                    onlyLabelMatchOption
                ),
                true
            );
            assert.equal(
                doesOptionMatchSearchText(
                    TEXT_FOR_MATCHING,
                    onlyValueMatchOption
                ),
                true
            );
            assert.equal(
                doesOptionMatchSearchText(
                    TEXT_FOR_MATCHING,
                    onlyLabelMatchOptionIgnorecase
                ),
                true
            );
            assert.equal(
                doesOptionMatchSearchText(
                    TEXT_FOR_MATCHING,
                    onlyValueMatchOptionIgnorecase
                ),
                true
            );
        });

        it('returns false for not matched text', () => {
            const notMatchOption: ISelectOption = {
                value: 'not matched',
                label: 'not matched',
            };
            assert.equal(
                doesOptionMatchSearchText(TEXT_FOR_MATCHING, notMatchOption),
                false
            );
        });
    });
});
