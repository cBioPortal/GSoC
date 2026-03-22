import { assert } from 'chai';
import { GenericAssayData } from 'cbioportal-ts-api-client';
import { validateMutationalSignatureRawData } from './MutationalSignaturesUtils';

describe('MutationalSignaturesUtils', () => {
    describe('validateMutationalSignatureRawData()', () => {
        it('single version: data come from single profile is not valid', () => {
            const genericAssayData = [
                {
                    molecularProfileId: 'study1_contribution_v2',
                },
            ];

            assert.isFalse(
                validateMutationalSignatureRawData(
                    genericAssayData as GenericAssayData[]
                )
            );
        });

        it('single version: data come from paired profiles is valid', () => {
            const genericAssayData = [
                {
                    molecularProfileId: 'study1_contribution_v2',
                },
                {
                    molecularProfileId: 'study1_pvalue_v2',
                },
            ];

            assert.isTrue(
                validateMutationalSignatureRawData(
                    genericAssayData as GenericAssayData[]
                )
            );
        });

        it('single version: data come from paired profiles is valid, have other profiles', () => {
            const genericAssayData = [
                {
                    molecularProfileId: 'study1_contribution_v2',
                },
                {
                    molecularProfileId: 'study1_pvalue_v2',
                },
                {
                    molecularProfileId: 'study1_category_v2',
                },
            ];

            assert.isTrue(
                validateMutationalSignatureRawData(
                    genericAssayData as GenericAssayData[]
                )
            );
        });

        it('multiple version: data come from single profile is not valid', () => {
            const genericAssayData = [
                {
                    molecularProfileId: 'study1_contribution_v2',
                },
                {
                    molecularProfileId: 'study1_contribution_v3',
                },
            ];

            assert.isFalse(
                validateMutationalSignatureRawData(
                    genericAssayData as GenericAssayData[]
                )
            );
        });

        it('multiple version: data come from paired profiles is valid', () => {
            const genericAssayData = [
                {
                    molecularProfileId: 'study1_contribution_v2',
                },
                {
                    molecularProfileId: 'study1_pvalue_v2',
                },
                {
                    molecularProfileId: 'study1_contribution_v3',
                },
                {
                    molecularProfileId: 'study1_pvalue_v3',
                },
            ];

            assert.isTrue(
                validateMutationalSignatureRawData(
                    genericAssayData as GenericAssayData[]
                )
            );
        });

        it('multiple version: data come from paired profiles is valid, have other profiles', () => {
            const genericAssayData = [
                {
                    molecularProfileId: 'study1_contribution_v2',
                },
                {
                    molecularProfileId: 'study1_pvalue_v2',
                },
                {
                    molecularProfileId: 'study1_category_v2',
                },
                {
                    molecularProfileId: 'study1_contribution_v3',
                },
                {
                    molecularProfileId: 'study1_pvalue_v3',
                },
                {
                    molecularProfileId: 'study1_category_v3',
                },
            ];

            assert.isTrue(
                validateMutationalSignatureRawData(
                    genericAssayData as GenericAssayData[]
                )
            );
        });
    });
});
