import { convertUniprotFeatureToUniprotTopology } from './UniprotUtils';
import { assert } from 'chai';

describe('UniprotTopologyUtils', () => {
    const uniprotFeature = [
        // 0
        {
            type: 'TOPO_DOM',
            category: 'TOPOLOGY',
            description: 'Extracellular',
            begin: '1',
            end: '2',
            molecule: '',
            evidences: [
                {
                    code: 'ECO:0000255',
                },
            ],
        },
        // 1
        {
            type: 'TRANSMEM',
            category: 'TOPOLOGY',
            description: 'Helical',
            begin: '3',
            end: '4',
            molecule: '',
            evidences: [
                {
                    code: 'ECO:0000255',
                },
            ],
        },
        // 2
        {
            type: 'TOPO_DOM',
            category: 'TOPOLOGY',
            description: 'Lumenal Thylakoid',
            begin: '5',
            end: '6',
            molecule: '',
            evidences: [
                {
                    code: 'ECO:0000255',
                },
            ],
        },
        // 3
        {
            type: 'INTRAMEM',
            category: 'TOPOLOGY',
            description: 'Helical',
            begin: '7',
            end: '8',
            molecule: '',
            evidences: [
                {
                    code: 'ECO:0000255',
                },
            ],
        },
    ];
    describe('convertToUniprotTopologyData', () => {
        it('should convert uniprot feature data to uniprot topology', () => {
            const topologyData = uniprotFeature.map(
                convertUniprotFeatureToUniprotTopology
            );
            assert.deepEqual(topologyData[0], {
                type: 'TOPO_DOM_EXTRACELLULAR',
                startPosition: 1,
                endPosition: 2,
                description: 'Extracellular',
                evidence: [
                    {
                        code: 'ECO:0000255',
                    },
                ],
            });
            assert.deepEqual(topologyData[1], {
                type: 'TRANSMEM',
                startPosition: 3,
                endPosition: 4,
                description: 'Helical',
                evidence: [
                    {
                        code: 'ECO:0000255',
                    },
                ],
            });
            assert.deepEqual(topologyData[2], {
                type: 'TOPO_DOM_LUMENAL_THYLAKOID',
                startPosition: 5,
                endPosition: 6,
                description: 'Lumenal Thylakoid',
                evidence: [
                    {
                        code: 'ECO:0000255',
                    },
                ],
            });
            assert.deepEqual(topologyData[3], {
                type: 'INTRAMEM',
                startPosition: 7,
                endPosition: 8,
                description: 'Helical',
                evidence: [
                    {
                        code: 'ECO:0000255',
                    },
                ],
            });
        });
    });
});
