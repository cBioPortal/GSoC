import TumorColumnFormatter from './TumorColumnFormatter';
import { assert } from 'chai';
import {
    MOLECULAR_PROFILE_MUTATIONS_SUFFIX,
    MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX,
} from '../../../../shared/constants';
import { GenePanelIdSpecialValue } from 'shared/lib/StoreUtils';

describe('TumorColumnFormatter', () => {
    let testData = [
        {
            sampleId: 'A',
            molecularProfileId: MOLECULAR_PROFILE_MUTATIONS_SUFFIX,
        },
        {
            sampleId: 'B',
            molecularProfileId: MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX,
            tumorAltCount: 0,
        },
        {
            sampleId: 'C',
            molecularProfileId: MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX,
            tumorAltCount: 5,
        },
    ];

    it('test get present samples', () => {
        let presentSamples = TumorColumnFormatter.getPresentSamples(testData);
        assert(presentSamples['A'], 'sample A is present and is called');
        assert(
            !('B' in presentSamples),
            'sample B mutation is not present because it has 0 supporting reads'
        );
        assert(
            presentSamples['C'] === false,
            'sample C mutation is present and is uncalled with > 0 supporting reads'
        );
    });

    it('test get sample ids', () => {
        assert.deepEqual(TumorColumnFormatter.getSample(testData), [
            'A',
            'B',
            'C',
        ]);
    });

    describe('getProfiledSamplesForGene', () => {
        const sampleToGenePanelId = {
            sampleA: 'panel1',
            sampleB: 'panel2',
            sampleC: GenePanelIdSpecialValue.UNKNOWN,
            sampleD: GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
            sampleE: GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
        } as { [sampleId: string]: string | undefined };

        const genePanelIdToGene = {
            panel1: [1, 2, 3],
            panel2: [3, 4, 5],
        } as { [genePanelId: string]: number[] };

        it('excludes samples where gene-of-interest is not in gene panel', () => {
            const entrezId = 1;
            const sampleIds = ['sampleA', 'sampleB'];
            const profiledSamples = TumorColumnFormatter.getProfiledSamplesForGene(
                entrezId,
                sampleIds,
                sampleToGenePanelId,
                genePanelIdToGene
            );
            const correct = {
                sampleA: true,
                sampleB: false,
            };
            assert.deepEqual(profiledSamples, correct);
        });

        it('includes samples where gene-of-interest is analyzed with different gene panels', () => {
            const entrezId = 3;
            const sampleIds = ['sampleA', 'sampleB'];
            const profiledSamples = TumorColumnFormatter.getProfiledSamplesForGene(
                entrezId,
                sampleIds,
                sampleToGenePanelId,
                genePanelIdToGene
            );
            const correct = {
                sampleA: true,
                sampleB: true,
            };
            assert.deepEqual(profiledSamples, correct);
        });

        it('always includes samples that were whole genome/exome profiled', () => {
            const entrezId = 1;
            const sampleIds = ['sampleA', 'sampleC', 'sampleD', 'sampleE'];
            const profiledSamples = TumorColumnFormatter.getProfiledSamplesForGene(
                entrezId,
                sampleIds,
                sampleToGenePanelId,
                genePanelIdToGene
            );
            const correct = {
                sampleA: true,
                sampleC: true,
                sampleD: true,
                sampleE: true,
            };
            assert.deepEqual(profiledSamples, correct);
        });
    });
});
