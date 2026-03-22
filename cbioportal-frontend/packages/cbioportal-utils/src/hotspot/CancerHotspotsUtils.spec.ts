import { assert } from 'chai';

import { IHotspotIndex } from '../model/CancerHotspot';
import { Mutation } from '../model/Mutation';
import {
    indexHotspots,
    isHotspot,
    is3dHotspot,
    filter3dHotspotsByMutations,
    filterHotspotsByMutations,
    groupHotspotsByMutations,
    defaultHotspotFilter,
    isLinearClusterHotspot,
    filterLinearClusterHotspotsByMutations,
} from './CancerHotspotsUtils';

describe('CancerHotspotsUtils', () => {
    const hotspots = [
        {
            genomicLocation: {
                chromosome: '17',
                start: 66,
                end: 66,
                referenceAllele: 'A',
                variantAllele: 'T',
            },
            transcriptId: '',
            proteinLocation: {
                transcriptId: '',
                start: 0,
                end: 0,
                mutationType: '',
            },
            variant: '17:g.66A>T',
            hotspots: [
                {
                    type: 'single residue',
                    transcriptId: 'ENST00002',
                    tumorCount: 1,
                    tumorTypeCount: 1,
                    inframeCount: 0,
                    missenseCount: 1,
                    spliceCount: 0,
                    truncatingCount: 0,
                    hugoSymbol: 'TP53',
                    residue: 'R273',
                    aminoAcidPosition: {
                        start: 273,
                        end: 273,
                    },
                },
            ],
        },
        {
            genomicLocation: {
                chromosome: '3',
                start: 666,
                end: 668,
                referenceAllele: 'G',
                variantAllele: 'CAT',
            },
            transcriptId: '',
            proteinLocation: {
                transcriptId: '',
                start: 0,
                end: 0,
                mutationType: '',
            },
            variant: '3:g.666G>CAT',
            hotspots: [
                {
                    type: 'in-frame indel',
                    tumorCount: 1,
                    tumorTypeCount: 1,
                    inframeCount: 1,
                    missenseCount: 0,
                    spliceCount: 0,
                    truncatingCount: 0,
                    transcriptId: 'ENST00003',
                    hugoSymbol: 'PIK3CA',
                    residue: '38-40',
                    aminoAcidPosition: {
                        start: 38,
                        end: 40,
                    },
                },
            ],
        },
        {
            genomicLocation: {
                chromosome: '4',
                start: 111,
                end: 111,
                referenceAllele: 'T',
                variantAllele: 'C',
            },
            transcriptId: '',
            proteinLocation: {
                transcriptId: '',
                start: 0,
                end: 0,
                mutationType: '',
            },
            variant: '4:g.111T>C',
            hotspots: [
                {
                    type: '3d',
                    tumorCount: 1,
                    tumorTypeCount: 1,
                    inframeCount: 0,
                    missenseCount: 1,
                    spliceCount: 0,
                    truncatingCount: 0,
                    transcriptId: 'ENST00005',
                    hugoSymbol: 'SMURF1',
                    residue: 'R101',
                    aminoAcidPosition: {
                        start: 101,
                        end: 101,
                    },
                },
            ],
        },
        {
            genomicLocation: {
                chromosome: '1',
                start: 2,
                end: 2,
                referenceAllele: 'A',
                variantAllele: 'T',
            },
            transcriptId: '',
            proteinLocation: {
                transcriptId: '',
                start: 0,
                end: 0,
                mutationType: '',
            },
            variant: '1:g.2>T',
            hotspots: [],
        },
    ];

    const hotspots3d = [
        {
            genomicLocation: {
                chromosome: '4',
                start: 111,
                end: 111,
                referenceAllele: 'T',
                variantAllele: 'C',
            },
            transcriptId: '',
            proteinLocation: {
                transcriptId: '',
                start: 0,
                end: 0,
                mutationType: '',
            },
            variant: '4:g.111T>C',
            hotspots: [
                {
                    type: '3d',
                    tumorCount: 1,
                    tumorTypeCount: 1,
                    inframeCount: 0,
                    missenseCount: 1,
                    spliceCount: 0,
                    truncatingCount: 0,
                    transcriptId: 'ENST00005',
                    hugoSymbol: 'SMURF1',
                    residue: 'R101',
                    aminoAcidPosition: {
                        start: 101,
                        end: 101,
                    },
                },
            ],
        },
    ];

    const hotspotSplice = [
        {
            genomicLocation: {
                chromosome: '7',
                start: 111,
                end: 111,
                referenceAllele: 'T',
                variantAllele: 'C',
            },
            transcriptId: '',
            proteinLocation: {
                transcriptId: '',
                start: 0,
                end: 0,
                mutationType: '',
            },
            variant: '7:g.111T>C',
            hotspots: [
                {
                    hugoSymbol: 'MET',
                    transcriptId: 'ENST00000397752',
                    residue: 'X1010',
                    tumorCount: 19,
                    type: 'splice site',
                    missenseCount: 0,
                    truncatingCount: 0,
                    inframeCount: 0,
                    spliceCount: 19,
                },
            ],
        },
    ];

    const hotspotMutation1 = {
        chr: '17',
        gene: {
            hugoGeneSymbol: 'TP53',
        },
        startPosition: 66,
        endPosition: 66,
        referenceAllele: 'A',
        variantAllele: 'T',
        proteinPosStart: 273,
        proteinPosEnd: 273,
        proteinChange: 'R273C',
        mutationType: 'missense',
    } as Mutation;

    const hotspotMutation2 = {
        chr: '17',
        gene: {
            hugoGeneSymbol: 'TP53',
        },
        startPosition: 66,
        endPosition: 66,
        referenceAllele: 'A',
        variantAllele: 'T',
        proteinPosStart: 273,
        proteinChange: 'R273A',
        mutationType: 'missense',
    } as Mutation;

    const hotspotMutation3 = {
        chr: '3',
        gene: {
            hugoGeneSymbol: 'PIK3CA',
        },
        startPosition: 666,
        endPosition: 668,
        referenceAllele: 'G',
        variantAllele: 'CAT',
        proteinPosStart: 38,
        proteinPosEnd: 40,
        proteinChange: 'R38H',
        mutationType: 'in_frame_del',
    } as Mutation;

    const hotspot3dMutation = {
        chr: '4',
        gene: {
            hugoGeneSymbol: 'SMURF1',
        },
        startPosition: 111,
        endPosition: 111,
        referenceAllele: 'T',
        variantAllele: 'C',
        proteinPosStart: 101,
        proteinPosEnd: 101,
        proteinChange: 'R101N',
        mutationType: 'missense',
    } as Mutation;

    const hotspotSpliceMutation = {
        chr: '7',
        gene: {
            hugoGeneSymbol: 'MET',
        },
        startPosition: 111,
        endPosition: 111,
        referenceAllele: 'T',
        variantAllele: 'C',
        proteinPosStart: 1010,
        proteinPosEnd: 1010,
        proteinChange: 'X1010',
        mutationType: 'splice site',
    } as Mutation;

    const notHotspotMutation = {
        chr: '4',
        gene: {
            hugoGeneSymbol: 'SMURF1',
        },
        startPosition: 222,
        endPosition: 222,
        referenceAllele: 'T',
        variantAllele: 'C',
        proteinPosStart: 202,
        proteinPosEnd: 202,
        proteinChange: 'R101F',
        mutationType: 'non_sense',
    } as Mutation;

    let hotspotIndex: IHotspotIndex;
    let hotspot3dIndex: IHotspotIndex;
    let spliceHotspotIndex: IHotspotIndex;
    beforeAll(() => {
        hotspotIndex = indexHotspots(hotspots);
        hotspot3dIndex = indexHotspots(hotspots3d);
        spliceHotspotIndex = indexHotspots(hotspotSplice);
    });

    describe('indexHotspots', () => {
        it('properly creates hotspot index', () => {
            assert.equal(
                hotspotIndex['17,66,66,A,T'].hotspots.length,
                1,
                'Only one TP53 single-residue hotspot mutation should be indexed.'
            );

            assert.equal(
                hotspotIndex['3,666,668,G,CAT'].hotspots.length,
                1,
                'Only one PIK3CA in-frame indel hotspot mutation should be indexed.'
            );

            assert.equal(
                hotspotIndex['4,111,111,T,C'].hotspots.length,
                1,
                'Only one SMURF1 3d hotspot mutation should be indexed.'
            );
        });
    });

    // TODO remove as any[] after fixing the Mutation model...
    describe('isHotspot', () => {
        it('isHotspot works correctly', () => {
            assert.isFalse(
                isHotspot(
                    {
                        chr: '1',
                        startPosition: 2,
                        endPosition: 2,
                        referenceAllele: 'A',
                        variantAllele: 'T',
                    } as any,
                    hotspotIndex
                )
            );
            assert.isTrue(
                isHotspot(
                    {
                        chr: '4',
                        startPosition: 111,
                        endPosition: 111,
                        referenceAllele: 'T',
                        variantAllele: 'C',
                    } as any,
                    hotspotIndex
                )
            );
            assert.isFalse(
                isHotspot(
                    {
                        chr: 'asdkfjpaosid',
                        startPosition: -1,
                        endPosition: -1,
                        referenceAllele: 'A',
                        variantAllele: 'T',
                    } as any,
                    hotspotIndex
                )
            );
        });
    });

    describe('isLinearClusterHotspot', () => {
        it('checks if a mutation is a single or indel hotspot mutation by isLinearClusterHotspot()', () => {
            assert.isTrue(
                isLinearClusterHotspot(hotspotMutation1, hotspotIndex),
                'TP53 R273C should be a recurrent hotspot mutation.'
            );

            assert.isTrue(
                isLinearClusterHotspot(hotspotMutation2, hotspotIndex),
                'TP53 R273A should be a recurrent hotspot mutation.'
            );

            assert.isTrue(
                isLinearClusterHotspot(hotspotMutation3, hotspotIndex),
                'PIK3CA R38H should be a recurrent hotspot mutation.'
            );

            assert.isFalse(
                isLinearClusterHotspot(notHotspotMutation, hotspotIndex),
                'SMURF1 R101F should not be a recurrent hotspot mutation.'
            );

            assert.isFalse(
                isLinearClusterHotspot(hotspot3dMutation, hotspotIndex),
                'SMURF1 R101N should not be a recurrent hotspot mutation.'
            );
        });

        it('checks if a mutation is a splice hotspot mutation by isLinearClusterHotspot()', () => {
            assert.isFalse(
                isLinearClusterHotspot(notHotspotMutation, spliceHotspotIndex),
                'SMURF1 R101F should not be a splice hotspot mutation.'
            );

            assert.isTrue(
                isLinearClusterHotspot(
                    hotspotSpliceMutation,
                    spliceHotspotIndex
                ),
                'MET X1010 should be a splice hotspot mutation.'
            );
        });
    });

    describe('is3dHotspot', () => {
        it('checks if a mutation is a 3d hotspot mutation by is3dHotspot()', () => {
            assert.isFalse(
                is3dHotspot(notHotspotMutation, hotspot3dIndex),
                'SMURF1 R101F should not be a 3d hotspot mutation.'
            );

            assert.isTrue(
                is3dHotspot(hotspot3dMutation, hotspot3dIndex),
                'SMURF1 R101N should be a 3d hotspot mutation.'
            );
        });
    });

    // TODO remove as any[] after fixing the Mutation model...
    describe('filterHotspots', () => {
        const mutations = [
            {
                chr: '17',
                startPosition: 66,
                endPosition: 66,
                referenceAllele: 'A',
                variantAllele: 'T',
            },
            {
                chr: '3',
                startPosition: 666,
                endPosition: 668,
                referenceAllele: 'G',
                variantAllele: 'CAT',
            },
            {
                chr: '4',
                startPosition: 111,
                endPosition: 111,
                referenceAllele: 'T',
                variantAllele: 'C',
            },
            {
                chr: '1',
                startPosition: 2,
                endPosition: 2,
                referenceAllele: 'A',
                variantAllele: 'T',
            },
            {
                chr: 'NA',
                startPosition: -1,
                endPosition: -1,
                referenceAllele: 'A',
                variantAllele: 'T',
            },
        ] as any[];

        it('filters hotspots correctly with the default hotspot filter', () => {
            const filtered = filterHotspotsByMutations(
                mutations,
                hotspotIndex,
                defaultHotspotFilter
            );
            assert.equal(
                filtered.length,
                3,
                '3 mutations should be identified as hotspot'
            );
        });

        it('filters recurrent hotspots correctly', () => {
            const filtered = filterLinearClusterHotspotsByMutations(
                mutations,
                hotspotIndex
            );
            assert.equal(
                filtered.length,
                2,
                '2 mutations should be identified as recurrent hotspot'
            );
        });

        it('filters 3D hotspots correctly', () => {
            const filtered = filter3dHotspotsByMutations(
                mutations,
                hotspotIndex
            );
            assert.equal(
                filtered.length,
                1,
                'only 1 mutation should be identified as 3D hotspot'
            );
        });
    });

    // TODO remove as any[] after fixing the Mutation model...
    describe('groupHotspots', () => {
        const mutationsByPosition = {
            [1]: [
                {
                    chr: '17',
                    startPosition: 66,
                    endPosition: 66,
                    referenceAllele: 'A',
                    variantAllele: 'T',
                },
            ] as any[],
            [2]: [
                {
                    chr: '3',
                    startPosition: 666,
                    endPosition: 668,
                    referenceAllele: 'G',
                    variantAllele: 'CAT',
                },
                {
                    chr: '4',
                    startPosition: 111,
                    endPosition: 111,
                    referenceAllele: 'T',
                    variantAllele: 'C',
                },
                {
                    chr: 'NA',
                    startPosition: -1,
                    endPosition: -1,
                    referenceAllele: 'A',
                    variantAllele: 'T',
                },
            ] as any[],
            [4]: [
                {
                    chr: '1',
                    startPosition: 2,
                    endPosition: 2,
                    referenceAllele: 'A',
                    variantAllele: 'T',
                },
            ] as any[],
        };

        it('groups hotspots by mutations grouped by protein position', () => {
            const grouped = groupHotspotsByMutations(
                mutationsByPosition,
                hotspotIndex,
                defaultHotspotFilter
            );

            assert.equal(
                grouped[1].length,
                1,
                'all mutations at position 1 should be filtered as hotspot'
            );
            assert.equal(
                grouped[2].length,
                2,
                '2 out of 3 mutations at position 2 should be filtered as hotspot'
            );
            assert.isUndefined(
                grouped[4],
                'there should NOT be any hotspot mutations at position 4'
            );
        });
    });
});
