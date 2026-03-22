import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import GeneSymbolValidator, {
    IGeneSymbolValidatorProps,
} from './GeneSymbolValidator';
import sinon from 'sinon';
import client from 'shared/api/cbioportalClientInstance';
import SpyInstance = jest.SpyInstance;

describe('GeneSymbolValidator', () => {
    let props: IGeneSymbolValidatorProps;
    let wrapper: any;
    let instance: GeneSymbolValidator;
    let fetchGenesStub: SpyInstance;

    beforeAll(() => {
        fetchGenesStub = jest
            .spyOn(client, 'fetchGenesUsingPOST')
            .mockImplementation(() => Promise.resolve([]));
    });

    afterAll(() => {
        fetchGenesStub.mockRestore();
    });

    beforeEach(() => {
        props = {
            oql: {
                query: [{ gene: 'TP53', alterations: false }],
            },
            geneQuery: 'TP53',
            skipGeneValidation: false,
            replaceGene: () => {},
            updateGeneQuery: () => null,
        } as IGeneSymbolValidatorProps;
        wrapper = mount(<GeneSymbolValidator {...props} />);
        instance = wrapper.instance() as GeneSymbolValidator;
    });
    afterEach(() => {});

    it('Validate geneQuery properly', () => {
        sinon.stub(instance, 'genes').get(() => {
            return {
                status: 'complete',
                isPending: false,
                isError: false,
                isComplete: true,
                result: {
                    found: [
                        {
                            entrezGeneId: 7157,
                            hugoGeneSymbol: 'TP53',
                            type: 'protein-coding',
                            cytoband: '17p13.1',
                            length: 19149,
                            chromosome: '17',
                        },
                    ],
                    suggestions: [],
                },
                error: undefined,
            };
        });

        instance.forceUpdate();

        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            'All gene symbols are valid.'
        );
    });

    it('api error', () => {
        sinon.stub(instance, 'genes').get(() => {
            return {
                status: 'error',
                isPending: false,
                isError: true,
                isComplete: true,
                result: { found: [], suggestions: [] },
                error: new Error('error'),
            };
        });

        instance.forceUpdate();

        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            'Unable to validate gene symbols.'
        );
    });
});
