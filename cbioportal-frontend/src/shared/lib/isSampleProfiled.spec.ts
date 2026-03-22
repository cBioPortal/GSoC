import { assert } from 'chai';
import {
    isSampleProfiled,
    isSampleProfiledInProfile,
} from './isSampleProfiled';
import { GenePanelData } from 'cbioportal-ts-api-client';

describe('isSampleProfiled', () => {
    it('(mis)matches by allGenes as appropriate', () => {
        let uniqueSampleKey =
            'VENHQS0zWC1BQVY5LTAxOmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg';

        let hugoGeneSymbol = 'EGFR';

        let coverageInformation = {
            samples: {
                VENHQS0zWC1BQVY5LTAxOmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg: {
                    byGene: {},
                    allGenes: [
                        {
                            uniqueSampleKey:
                                'VENHQS0zWC1BQVY5LTAxOmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                            uniquePatientKey:
                                'VENHQS0zWC1BQVY5OmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                            molecularProfileId:
                                'chol_tcga_pan_can_atlas_2018_gistic',
                            sampleId: 'TCGA-3X-AAV9-01',
                            patientId: 'TCGA-3X-AAV9',
                            studyId: 'chol_tcga_pan_can_atlas_2018',
                            profiled: true,
                        },
                        {
                            uniqueSampleKey:
                                'VENHQS0zWC1BQVY5LTAxOmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                            uniquePatientKey:
                                'VENHQS0zWC1BQVY5OmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                            molecularProfileId:
                                'chol_tcga_pan_can_atlas_2018_mutations',
                            sampleId: 'TCGA-3X-AAV9-01',
                            patientId: 'TCGA-3X-AAV9',
                            studyId: 'chol_tcga_pan_can_atlas_2018',
                            profiled: true,
                        },
                    ],
                    notProfiledByGene: {},
                    notProfiledAllGenes: [],
                },
                VENHQS0zWC1BQVZBLTAxOmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg: {
                    byGene: {},
                    allGenes: [
                        {
                            uniqueSampleKey:
                                'VENHQS0zWC1BQVZBLTAxOmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                            uniquePatientKey:
                                'VENHQS0zWC1BQVZBOmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                            molecularProfileId:
                                'chol_tcga_pan_can_atlas_2018_gistic',
                            sampleId: 'TCGA-3X-AAVA-01',
                            patientId: 'TCGA-3X-AAVA',
                            studyId: 'chol_tcga_pan_can_atlas_2018',
                            profiled: true,
                        },
                        {
                            uniqueSampleKey:
                                'VENHQS0zWC1BQVZBLTAxOmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                            uniquePatientKey:
                                'VENHQS0zWC1BQVZBOmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                            molecularProfileId:
                                'chol_tcga_pan_can_atlas_2018_mutations',
                            sampleId: 'TCGA-3X-AAVA-01',
                            patientId: 'TCGA-3X-AAVA',
                            studyId: 'chol_tcga_pan_can_atlas_2018',
                            profiled: true,
                        },
                    ],
                    notProfiledByGene: {},
                    notProfiledAllGenes: [],
                },
            },
        } as any;

        assert.isFalse(
            isSampleProfiled(
                uniqueSampleKey,
                'chol_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                hugoGeneSymbol,
                coverageInformation
            ),
            'non matching molecularProfile'
        );

        assert.isTrue(
            isSampleProfiled(
                uniqueSampleKey,
                'chol_tcga_pan_can_atlas_2018_mutations',
                hugoGeneSymbol,
                coverageInformation
            ),
            'matching molecularProfile'
        );

        assert.isTrue(
            isSampleProfiled(
                uniqueSampleKey,
                'chol_tcga_pan_can_atlas_2018_mutations',
                'blah',
                coverageInformation
            ),
            'matches allGenes inspite of gene mismatch'
        );

        assert.isFalse(
            isSampleProfiled(
                uniqueSampleKey + 'blah',
                'chol_tcga_pan_can_atlas_2018_mutations',
                hugoGeneSymbol,
                coverageInformation
            ),
            'no matching sample key'
        );

        assert.isFalse(
            isSampleProfiled(
                uniqueSampleKey,
                'chol_tcga_pan_can_atlas_2018_mutations',
                hugoGeneSymbol,
                { samples: {} } as any
            ),
            'no matching sample key'
        );
    });

    it('(mis)matches by byGenes as appropriate', () => {
        let uniqueSampleKey =
            'VENHQS0zWC1BQVY5LTAxOmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg';

        let hugoGeneSymbol = 'EGFR';

        let coverageInformation = {
            samples: {
                VENHQS0zWC1BQVY5LTAxOmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg: {
                    byGene: {
                        EGFR: [
                            {
                                uniqueSampleKey:
                                    'VENHQS0zWC1BQVY5LTAxOmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                                uniquePatientKey:
                                    'VENHQS0zWC1BQVY5OmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                                molecularProfileId:
                                    'chol_tcga_pan_can_atlas_2018_gistic',
                                sampleId: 'TCGA-3X-AAV9-01',
                                patientId: 'TCGA-3X-AAV9',
                                studyId: 'chol_tcga_pan_can_atlas_2018',
                                profiled: true,
                            },
                            {
                                uniqueSampleKey:
                                    'VENHQS0zWC1BQVY5LTAxOmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                                uniquePatientKey:
                                    'VENHQS0zWC1BQVY5OmNob2xfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                                molecularProfileId:
                                    'chol_tcga_pan_can_atlas_2018_mutations',
                                sampleId: 'TCGA-3X-AAV9-01',
                                patientId: 'TCGA-3X-AAV9',
                                studyId: 'chol_tcga_pan_can_atlas_2018',
                                profiled: true,
                            },
                        ],
                    },
                    allGenes: [],
                    notProfiledByGene: {},
                    notProfiledAllGenes: [],
                },
            },
        } as any;

        assert.isFalse(
            isSampleProfiled(
                uniqueSampleKey,
                'chol_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                hugoGeneSymbol,
                coverageInformation
            ),
            'non matching molecularProfile'
        );

        assert.isTrue(
            isSampleProfiled(
                uniqueSampleKey,
                'chol_tcga_pan_can_atlas_2018_mutations',
                hugoGeneSymbol,
                coverageInformation
            ),
            'matching molecularProfile'
        );

        assert.isFalse(
            isSampleProfiled(
                uniqueSampleKey,
                'chol_tcga_pan_can_atlas_2018_mutations',
                'blah',
                coverageInformation
            ),
            "non matching if GENE doesn't exist in result"
        );
    });
});

describe('isSampleProfiledInProfile', () => {
    it('returns true if sample exists in profile data and is true, false otherwise', () => {
        const data = {
            someProfile1: {
                someSample1: {
                    profiled: true,
                } as GenePanelData,
            },
        };

        assert.isTrue(
            isSampleProfiledInProfile(data, 'someProfile1', 'someSample1')
        );

        assert.isFalse(
            isSampleProfiledInProfile(data, 'someProfile2', 'someSample1')
        );

        assert.isFalse(
            isSampleProfiledInProfile(data, undefined, 'someSample1')
        );

        assert.isFalse(
            isSampleProfiledInProfile(data, 'someProfile1', 'someSample2')
        );

        assert.isFalse(
            isSampleProfiledInProfile(data, 'someProfile1', undefined)
        );
    });
});
