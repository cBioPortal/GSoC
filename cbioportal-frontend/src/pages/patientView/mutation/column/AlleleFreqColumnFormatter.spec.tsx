import AlleleFreqColumnFormatter from './AlleleFreqColumnFormatter';
import { initMutation } from 'test/MutationMockUtils';
import { Mutation } from 'cbioportal-ts-api-client';
import {
    MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX,
    MOLECULAR_PROFILE_MUTATIONS_SUFFIX,
} from '../../../../shared/constants';
import React from 'react';
import { assert } from 'chai';
import { shallow, mount } from 'enzyme';
import sinon from 'sinon';

describe('AlleleFreqColumnFormatter', () => {
    it('uncalled mutations component w/o reads should have 0 opacity', () => {
        const uncalledMutationWithoutSupport = {
            molecularProfileId: `study_${MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX}`,
            tumorAltCount: 0,
            tumorRefCount: 10,
        };
        const res = AlleleFreqColumnFormatter.getComponentForSampleArgs(
            uncalledMutationWithoutSupport
        );
        assert(res.opacity === 0);
    });
    it('uncalled mutations component w supporting reads should have >0 and <1 opacity', () => {
        const uncalledMutationWithSupport = {
            molecularProfileId: `study_${MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX}`,
            tumorAltCount: 1,
            tumorRefCount: 10,
        };
        const res = AlleleFreqColumnFormatter.getComponentForSampleArgs(
            uncalledMutationWithSupport
        );
        assert(res.opacity > 0 && res.opacity < 1);
    });
    it('called mutations component w supporting reads should have 1 opacity', () => {
        const calledMutation = {
            molecularProfileId: `study_${MOLECULAR_PROFILE_MUTATIONS_SUFFIX}`,
            tumorAltCount: 1,
            tumorRefCount: 10,
        };
        const res = AlleleFreqColumnFormatter.getComponentForSampleArgs(
            calledMutation
        );
        assert(res.opacity === 1);
    });
    it('sampleElement should have the text (uncalled)', () => {
        const uncalledMutationWithSupport = {
            sampleId: '1',
            molecularProfileId: `study_${MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX}`,
            tumorAltCount: 1,
            tumorRefCount: 10,
        };
        const res = AlleleFreqColumnFormatter.convertMutationToSampleElement(
            uncalledMutationWithSupport,
            'red',
            5,
            {}
        );
        assert(
            res &&
                mount(res.text)
                    .text()
                    .indexOf('(uncalled)') !== -1
        );
    });
    it('calculates the Allele frequency for a mutation', () => {
        const mutation: Mutation[] = [
            initMutation({
                tumorAltCount: 1,
                tumorRefCount: 10,
            }),
        ];
        assert.equal(
            AlleleFreqColumnFormatter.getFrequency(mutation),
            '0.09090909090909091'
        );
    });
});
