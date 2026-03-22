import GenesList from './GenesList';
import React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';

describe('GenesList', () => {
    let wrapper: any;

    afterAll(() => {
        wrapper.unmount();
    });

    it('renders the component', () => {
        wrapper = mount(
            <GenesList
                genePanel={{
                    description: 'description',
                    genePanelId: 'TESTPANEL1',
                    genes: [
                        { entrezGeneId: 1, hugoGeneSymbol: 'ABLIM1' },
                        { entrezGeneId: 2, hugoGeneSymbol: 'ACPP' },
                        { entrezGeneId: 3, hugoGeneSymbol: 'ADAMTS20' },
                    ],
                }}
                columns={3}
            />
        );
        assert(wrapper.text().includes('TESTPANEL1')); // renders panel name
        assert(wrapper.text().includes('Number of genes: 3')); // renders number of genes
        assert(wrapper.text().includes('ABLIM1')); // renders gene name
        assert(wrapper.find('.input-group-sm').exists()); // renders filter input
        assert(wrapper.find('.btn-group').exists()); // renders copy download buttons
    });

    it('renders 3 columns in the genes table', () => {
        assert(wrapper.find('td').length === 3);
    });

    it('filters genes based on input value', () => {
        // with matching keywords
        wrapper.find('input').simulate('input', { target: { value: 'AB' } });
        assert(wrapper.text().includes('ABLIM1'));
        assert(!wrapper.text().includes('ACPP'));
        assert(!wrapper.text().includes('ADAMTS20'));

        // with non-matching keywords
        wrapper.find('input').simulate('input', { target: { value: 'xyz' } });
        assert(wrapper.text().includes('No matches'));
        assert(wrapper.find('td').length === 1);
    });
});
