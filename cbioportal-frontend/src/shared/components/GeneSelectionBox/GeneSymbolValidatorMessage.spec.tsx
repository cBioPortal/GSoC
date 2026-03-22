import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import GeneSymbolValidatorMessage, {
    GeneSymbolValidatorMessageProps,
} from 'shared/components/GeneSelectionBox/GeneSymbolValidatorMessage';

describe('GeneSymbolValidatorMessage', () => {
    let props: GeneSymbolValidatorMessageProps;

    beforeEach(() => {
        props = {
            oql: {
                query: [],
            },
            validatingGenes: false,
            genes: {
                found: [],
                suggestions: [],
            },
            replaceGene: () => null,
        } as GeneSymbolValidatorMessageProps;
    });
    afterEach(() => {});

    it('Valid input', () => {
        props.oql = {
            query: [{ gene: 'TP53', alterations: false }],
        };
        props.genes = {
            found: [
                {
                    geneticEntityId: 5808,
                    entrezGeneId: 7157,
                    hugoGeneSymbol: 'TP53',
                    type: 'protein-coding',
                },
            ],
            suggestions: [],
        };
        const wrapper = mount(<GeneSymbolValidatorMessage {...props} />);
        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            'All gene symbols are valid.'
        );

        wrapper.setProps({ errorMessageOnly: true });

        assert.equal(wrapper.find('#geneBoxValidationStatus').text(), '');
    });

    it('invalid input', () => {
        const wrapper = mount(<GeneSymbolValidatorMessage {...props} />);
        assert.equal(wrapper.find('#geneBoxValidationStatus').text(), '');

        wrapper.setProps({ oql: new Error('Error') });
        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            'Cannot validate gene symbols because of invalid OQL.  Click to highlight error'
        );
    });

    it('genes api error', async () => {
        props.oql = {
            query: [{ gene: 'TP53', alterations: false }],
        };
        props.genes = new Error('Error');
        const wrapper = mount(<GeneSymbolValidatorMessage {...props} />);
        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            'Unable to validate gene symbols.'
        );
    });

    it('genes api pending', () => {
        props.oql = {
            query: [{ gene: 'TP53', alterations: false }],
        };
        props.validatingGenes = true;
        const wrapper = mount(<GeneSymbolValidatorMessage {...props} />);
        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            'Validating gene symbols...'
        );
    });

    it('invalid genes with no suggestions', () => {
        props.oql = {
            query: [{ gene: 'TP53', alterations: false }],
        };
        props.genes = { found: [], suggestions: [{ alias: 'TP5', genes: [] }] };
        const wrapper = mount(<GeneSymbolValidatorMessage {...props} />);
        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            'Invalid gene symbols.TP5'
        );
    });

    it('invalid genes with suggestions', () => {
        props.oql = {
            query: [{ gene: 'AAA', alterations: false }],
        };
        props.genes = {
            found: [],
            suggestions: [
                {
                    alias: 'AAA',
                    genes: [
                        {
                            geneticEntityId: 296,
                            entrezGeneId: 351,
                            hugoGeneSymbol: 'APP',
                            type: 'protein-coding',
                        },
                    ],
                },
            ],
        };
        const wrapper = mount(<GeneSymbolValidatorMessage {...props} />);
        assert.equal(
            wrapper.find('#geneBoxValidationStatus').text(),
            'Invalid gene symbols.AAA: APP'
        );
    });
});
