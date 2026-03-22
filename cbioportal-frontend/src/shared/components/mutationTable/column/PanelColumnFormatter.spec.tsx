import PanelColumnFormatter, { GenePanelLinks } from './PanelColumnFormatter';
import { shallow } from 'enzyme';
import { assert } from 'chai';
import SampleManager from 'pages/patientView/SampleManager';
import React from 'react';

const mockData = [
    {
        alteration: 1,
        entrezGeneId: 1,
        gene: {
            entrezGeneId: 1,
            hugoGeneSymbol: 'test',
            geneticEntityId: 1,
            type: 'test',
        },
        molecularProfileId: 'test',
        patientId: 'test',
        sampleId: 'sampleId',
        studyId: 'test',
        uniquePatientKey: 'test',
        uniqueSampleKey: 'test',
    },
];

const mockSamples = [{ id: 'sampleId', clinicalData: [] }];

const mockSampleToGenePanelId = { sampleId: 'genePanelId' };
const mockGenePanelIdToGene = { genePanelId: [1] };
const mockSampleManager = new SampleManager(
    mockSamples,
    mockSamples.map(sample => sample.id)
);

const mock = {
    data: mockData,
    sampleToGenePanelId: mockSampleToGenePanelId,
    sampleManager: mockSampleManager,
    genePanelIdToGene: mockGenePanelIdToGene,
};

describe('PanelColumnFormatter', () => {
    it('renders spinner icon if sampleToGenePanelId object is empty', () => {
        const PanelColumn = shallow(
            PanelColumnFormatter.renderFunction({
                ...mock,
                sampleToGenePanelId: {},
            })
        );
        assert(PanelColumn.find('i.fa-spinner').exists());
        PanelColumn.unmount();
    });

    it('renders gene panel information', () => {
        const PanelColumn = shallow(PanelColumnFormatter.renderFunction(mock));
        assert(PanelColumn.find(GenePanelLinks).length > 0);

        const GenePanelLinksComponent = shallow(<GenePanelLinks {...mock} />);
        assert(GenePanelLinksComponent.text().includes('genePanelId'));

        PanelColumn.unmount();
        GenePanelLinksComponent.unmount();
    });

    it('returns a list of gene panel ids on download', () => {
        const genePanelIds = PanelColumnFormatter.download(mock);
        assert.deepEqual(genePanelIds, 'genePanelId');
    });

    it('returns a list of gene panel ids on getGenePanelIds', () => {
        const genePanelIds = PanelColumnFormatter.getGenePanelIds(mock);
        assert.deepEqual(genePanelIds, ['genePanelId']);
    });
});
