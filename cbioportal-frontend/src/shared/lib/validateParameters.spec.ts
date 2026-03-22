import validateParameters from './validateParameters';
import { assert } from 'chai';
import * as React from 'react';
import _ from 'lodash';
import * as $ from 'jquery';

describe('validateParameters function', () => {
    it('recognizes valid and invalid url parameter combinations according to provided rules', () => {
        assert.isTrue(
            validateParameters(
                { studyId: 'someString', sampleId: 'someString' },
                ['studyId', ['sampleId', 'caseId']]
            ).isValid
        );

        assert.isTrue(
            validateParameters(
                { studyId: 'someString', caseId: 'someString' },
                ['studyId', ['sampleId', 'caseId']]
            ).isValid
        );

        assert.isFalse(
            validateParameters({ studyId: 'someString', sampleId: '' }, [
                'studyId',
                ['sampleId', 'caseId'],
            ]).isValid,
            'non zero length string required'
        );

        assert.isFalse(
            validateParameters({ studyId: 'someString', sampleId: '' }, [
                'param1',
                ['sampleId', 'caseId'],
            ]).isValid,
            'non zero length string required'
        );

        assert.isFalse(
            validateParameters({ sampleId: '' }, [
                'studyId',
                ['sampleId', 'caseId'],
            ]).isValid,
            'missing parameter recognized'
        );
    });
});
