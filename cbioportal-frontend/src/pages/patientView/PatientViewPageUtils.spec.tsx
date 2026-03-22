import { assert } from 'chai';
import sinon from 'sinon';
import SampleManager from './SampleManager';
import TumorColumnFormatter from './mutation/column/TumorColumnFormatter';
import {
    checkNonProfiledGenesExist,
    retrieveMutationalSignatureMap,
} from './PatientViewPageUtils';
import { PatientViewPageStore } from './clinicalInformation/PatientViewPageStore';
import { GenericAssayMeta } from 'cbioportal-ts-api-client';

describe('PatientViewPageUtils', () => {
    describe('checkNonProfiledGenesExist()', () => {
        const sampleIds = ['sampleA', 'sampleB'];
        const entrezGeneIds = [1, 2, 3];

        const stub = sinon.stub(
            TumorColumnFormatter,
            'getProfiledSamplesForGene'
        );

        afterAll(() => {
            stub.restore();
        });

        it('returns false when all samples have been profiled', () => {
            const allSamplesProfiled = {
                sampleA: true,
                sampleB: true,
            };

            stub.returns(allSamplesProfiled);
            assert.isFalse(
                checkNonProfiledGenesExist(
                    sampleIds,
                    entrezGeneIds,
                    {} as any,
                    {} as any
                )
            );
        });

        it('returns true when a sample has not been not profiled', () => {
            const oneSampleNotProfiled = {
                sampleA: true,
                sampleB: false,
            };

            stub.returns(oneSampleNotProfiled);
            assert.isTrue(
                checkNonProfiledGenesExist(
                    sampleIds,
                    entrezGeneIds,
                    {} as any,
                    {} as any
                )
            );
        });
    });

    describe('retrieveMutationalSignatureMap()', () => {
        it('returns true if result is equal to the ground truth output', () => {
            const genericAssayMetaData = [
                {
                    entityType: 'GENERIC_ASSAY',
                    genericEntityMetaProperties: { NAME: '1:Del:C:0' },
                    stableId: 'mutational_signatures_matrix_1_Del_C_0',
                },
                {
                    entityType: 'GENERIC_ASSAY',
                    genericEntityMetaProperties: { NAME: '1:Del:C:1' },
                    stableId: 'mutational_signatures_matrix_1_Del_C_1',
                },
            ];

            const output = [
                {
                    name: '1:Del:C:0',
                    signatureClass: '',
                    signatureLabel: '',
                    stableId: 'mutational_signatures_matrix_1_Del_C_0',
                },
                {
                    name: '1:Del:C:1',
                    signatureClass: '',
                    signatureLabel: '',
                    stableId: 'mutational_signatures_matrix_1_Del_C_1',
                },
            ];

            const result = retrieveMutationalSignatureMap(genericAssayMetaData);
            assert.deepEqual(result, output);
        });
    });
});
