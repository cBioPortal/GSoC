import { assert } from 'chai';
import {
    formatErrorLog,
    formatErrorTitle,
    formatErrorMessages,
} from './errorFormatter';
import { SiteError } from 'shared/model/appMisc';

const RESPONSE_BODY_MESSAGE = 'RESPONSE_BODY_MESSAGE';
const REQUEST_ERROR_MESSAGE = 'REQUEST_ERROR_MESSAGE';
const EXAMPLE_TITLE_1 = 'EXAMPLE_TITLE_1';
const EXAMPLE_TITLE_2 = 'EXAMPLE_TITLE_2';

const siteErrors: SiteError[] = [
    {
        errorObj: {
            response: {
                body: {
                    message: RESPONSE_BODY_MESSAGE,
                },
            },
        } as any,
        displayType: 'alert',
    },
    {
        errorObj: {
            message: REQUEST_ERROR_MESSAGE,
        } as any,
        displayType: 'alert',
        title: EXAMPLE_TITLE_1,
    },
    {
        errorObj: { otherInformation: '' } as any,
        displayType: 'alert',
        title: EXAMPLE_TITLE_2,
    },
];

describe('ErrorFormatter', () => {
    describe('formatErrorLog', () => {
        it('formatErrorLog one error', () => {
            assert.deepEqual(
                formatErrorLog(siteErrors.slice(0, 1)),
                '{"body":{"message":"RESPONSE_BODY_MESSAGE"}}'
            );
            assert.deepEqual(
                formatErrorLog(siteErrors.slice(1, 2)),
                REQUEST_ERROR_MESSAGE
            );
            assert.deepEqual(
                formatErrorLog(siteErrors.slice(-1)),
                siteErrors[2].errorObj.toString()
            );
        });
        it('formatErrorLog multiple errors', () => {
            assert.deepEqual(
                formatErrorLog(siteErrors),
                '{"body":{"message":"RESPONSE_BODY_MESSAGE"}}\n\n\nREQUEST_ERROR_MESSAGE\n\n\n[object Object]'
            );
        });
    });

    describe('formatErrorTitle', () => {
        it('formatErrorTitle no title', () => {
            assert.isUndefined(formatErrorTitle(siteErrors.slice(0, 1)));
        });
        it('formatErrorTitle has one title', () => {
            assert.equal(
                formatErrorTitle(siteErrors.slice(1, 2)),
                EXAMPLE_TITLE_1
            );
            assert.equal(
                formatErrorTitle(siteErrors.slice(-1)),
                EXAMPLE_TITLE_2
            );
        });
        it('formatErrorTitle has multiple titles', () => {
            assert.equal(
                formatErrorTitle(siteErrors),
                `${EXAMPLE_TITLE_1} ${EXAMPLE_TITLE_2}`
            );
        });
    });

    describe('formatErrorMessages', () => {
        it('formatErrorMessages one error', () => {
            assert.deepEqual(formatErrorMessages(siteErrors.slice(0, 1))!, [
                RESPONSE_BODY_MESSAGE,
            ]);
            assert.deepEqual(formatErrorMessages(siteErrors.slice(1, 2))!, [
                REQUEST_ERROR_MESSAGE,
            ]);
            assert.deepEqual(
                formatErrorMessages(siteErrors.slice(-1)),
                undefined
            );
        });
        it('formatErrorMessages multiple errors', () => {
            assert.deepEqual(formatErrorMessages(siteErrors), [
                RESPONSE_BODY_MESSAGE,
                REQUEST_ERROR_MESSAGE,
            ]);
        });
    });
});
