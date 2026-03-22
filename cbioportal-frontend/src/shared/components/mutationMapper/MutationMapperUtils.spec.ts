import { assert } from 'chai';
import { Gene, Mutation } from 'cbioportal-ts-api-client';
import {
    buildNamespaceColumnConfig,
    createNamespaceColumnName,
} from 'shared/components/namespaceColumns/namespaceColumnsUtils';

describe('MutationMapperUtils', () => {
    describe('buildNamespaceColumnConfig', () => {
        it('derives namespace config from mutation data - single namespace, single column', () => {
            const mutations = [
                createMutation({ myNamespace: { column: 'value1' } }),
                createMutation({ myNamespace: { column: 'value2' } }),
            ] as Mutation[];
            const columnConfig = buildNamespaceColumnConfig(mutations);
            assert.deepEqual(columnConfig, {
                myNamespace: { column: 'string' },
            });
        });

        it('derives namespace config from mutation data - two namespaces, single column', () => {
            const mutations = [
                createMutation({ myNamespace1: { column: 'value1' } }),
                createMutation({ myNamespace2: { column: 'value2' } }),
            ] as Mutation[];
            const columnConfig = buildNamespaceColumnConfig(mutations);
            assert.deepEqual(columnConfig, {
                myNamespace1: { column: 'string' },
                myNamespace2: { column: 'string' },
            });
        });

        it('derives namespace config from mutation data - single namespace, two columns', () => {
            const mutations = [
                createMutation({ myNamespace: { column1: 'value1' } }),
                createMutation({ myNamespace: { column2: 'value2' } }),
            ] as Mutation[];
            const columnConfig = buildNamespaceColumnConfig(mutations);
            assert.deepEqual(columnConfig, {
                myNamespace: {
                    column1: 'string',
                    column2: 'string',
                },
            });
        });

        it('derives namespace config from mutation data - empty arguments', () => {
            const mutations = [
                createMutation({ myNamespace: {} }),
                createMutation({ myNamespace: {} }),
            ] as Mutation[];
            const columnConfig = buildNamespaceColumnConfig(mutations);
            assert.deepEqual(columnConfig, {});
        });

        it('derives namespace config from mutation data - no namespace data', () => {
            const mutations = [
                createMutation({}),
                createMutation({}),
            ] as Mutation[];
            const columnConfig = buildNamespaceColumnConfig(mutations);
            assert.deepEqual(columnConfig, {});
        });

        it('derives namespace config from mutation data - numeric column', () => {
            const mutations = [
                createMutation({ myNamespace: { column: 1 } }),
                createMutation({ myNamespace: { column: 2 } }),
            ] as Mutation[];
            const columnConfig = buildNamespaceColumnConfig(mutations);
            assert.deepEqual(columnConfig, {
                myNamespace: { column: 'number' },
            });
        });

        it('derives namespace config from mutation data - mixed column is not numeric', () => {
            const mutations = [
                createMutation({ myNamespace: { column: 1 } }),
                createMutation({ myNamespace: { column: 'value' } }),
            ] as Mutation[];
            const columnConfig = buildNamespaceColumnConfig(mutations);
            assert.deepEqual(columnConfig, {
                myNamespace: { column: 'string' },
            });
        });

        it('derives namespace config from mutation data - numeric column with null is numeric ', () => {
            const mutations = [
                createMutation({ myNamespace: { column: 1 } }),
                createMutation({ myNamespace: { column: null } }),
            ] as Mutation[];
            const columnConfig = buildNamespaceColumnConfig(mutations);
            assert.deepEqual(columnConfig, {
                myNamespace: { column: 'number' },
            });
        });

        it('derives namespace config from mutation data - numeric column with undefined is numeric', () => {
            const mutations = [
                createMutation({ myNamespace: { column: 1 } }),
                createMutation({ myNamespace: { column: undefined } }),
            ] as Mutation[];
            const columnConfig = buildNamespaceColumnConfig(mutations);
            assert.deepEqual(columnConfig, {
                myNamespace: { column: 'number' },
            });
        });
    });

    describe('createNamespaceColumnName', () => {
        it('Capitalizes column name', () => {
            assert.equal(
                createNamespaceColumnName('Namespace', 'column'),
                'Namespace Column'
            );
        });
        it('Does not affect namespace column case', () => {
            assert.equal(
                createNamespaceColumnName('nAmEsPaCe', 'column'),
                'nAmEsPaCe Column'
            );
        });
    });
});

const createMutation = (namespaceData: any) => {
    return ({
        gene: {
            hugoGeneSymbol: 'GENE',
        } as Gene,
        mutationStatus: undefined,
        uniqueSampleKey: undefined,
        uniquePatientKey: undefined,
        sampleId: 'sample',
        patientId: 'patient',
        studyId: 'study',
        chr: '1',
        startPosition: 0,
        endPosition: 0,
        referenceAllele: '',
        variantAllele: '',
        tumorAltCount: 1,
        tumorRefCount: 1,
        molecularProfileId: 'mutations',
        namespaceColumns: namespaceData,
    } as unknown) as Mutation;
};
