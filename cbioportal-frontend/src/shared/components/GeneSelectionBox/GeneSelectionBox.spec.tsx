import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import OQLTextArea, {
    IGeneSelectionBoxProps,
    GeneBoxType,
} from './OQLTextArea';
import client from 'shared/api/cbioportalClientInstance';
import SpyInstance = jest.SpyInstance;

describe('GeneSelectionBox', () => {
    let fetchGenesStub: SpyInstance;
    let getAllGenesStub: SpyInstance;

    beforeAll(() => {
        fetchGenesStub = jest
            .spyOn(client, 'fetchGenesUsingPOST')
            .mockImplementation(() => Promise.resolve([]));
        getAllGenesStub = jest
            .spyOn(client, 'getAllGenesUsingGET')
            .mockImplementation(() => Promise.resolve([]));
    });

    afterAll(() => {
        fetchGenesStub.mockRestore();
        getAllGenesStub.mockRestore();
    });

    it('textarea value - default view', () => {
        const props = {
            inputGeneQuery: 'CDKN2A CDKN2A-AS1 CDKN2B',
        } as IGeneSelectionBoxProps;

        let wrapper = mount(<OQLTextArea {...props} />);
        assert.equal(
            wrapper.find({ 'data-test': 'geneSet' }).text(),
            'CDKN2A CDKN2A-AS1 CDKN2B'
        );
    });

    it('textarea value - study view', () => {
        const props = {
            inputGeneQuery: 'CDKN2A CDKN2A-AS1 CDKN2B',
            location: GeneBoxType.STUDY_VIEW_PAGE,
        } as IGeneSelectionBoxProps;

        let wrapper = mount(<OQLTextArea {...props} />);
        assert.equal(
            wrapper.find({ 'data-test': 'geneSet' }).text(),
            'CDKN2A and 2 more'
        );
    });
});
