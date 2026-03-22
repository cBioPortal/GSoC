import { assert } from 'chai';

import { countMutations } from './mutationCountHelpers';
import { Mutation } from 'cbioportal-ts-api-client';

describe('#countMutations', () => {
    it('produces keyed table of position identifiers', () => {
        let mutations = [
            {
                uniqueSampleKey: 'VENHQS1aSC1BOFk4LTAxOmNob2xfdGNnYQ',
                uniquePatientKey: 'VENHQS1aSC1BOFk4OmNob2xfdGNnYQ',
                molecularProfileId: 'chol_tcga_mutations',
                sampleId: 'TCGA-ZH-A8Y8-01',
                patientId: 'TCGA-ZH-A8Y8',
                entrezGeneId: 3845,
                gene: {
                    entrezGeneId: 3845,
                    hugoGeneSymbol: 'KRAS',
                    type: 'protein-coding',
                },
                studyId: 'chol_tcga',
                center: 'hgsc.bcm.edu;broad.mit.edu;ucsc.edu;bcgsc.ca',
                mutationStatus: 'Somatic',
                validationStatus: 'Untested',
                tumorAltCount: -1,
                tumorRefCount: -1,
                normalAltCount: -1,
                normalRefCount: -1,
                startPosition: 25380277,
                endPosition: 25380278,
                referenceAllele: 'GA',
                proteinChange: 'Q61K',
                mutationType: 'Missense_Mutation',
                ncbiBuild: 'GRCh37',
                variantType: 'DNP',
                keyword: 'KRAS Q61 missense',
                driverFilter: '',
                driverFilterAnnotation: '',
                driverTiersFilter: '',
                driverTiersFilterAnnotation: '',
                variantAllele: 'TT',
                refseqMrnaId: 'NM_033360.2',
                proteinPosStart: 60,
                proteinPosEnd: 61,
            },
            {
                uniqueSampleKey: 'VENHQS0zWC1BQVZCLTAxOmNob2xfdGNnYQ',
                uniquePatientKey: 'VENHQS0zWC1BQVZCOmNob2xfdGNnYQ',
                molecularProfileId: 'chol_tcga_mutations',
                sampleId: 'TCGA-3X-AAVB-01',
                patientId: 'TCGA-3X-AAVB',
                entrezGeneId: 3845,
                gene: {
                    entrezGeneId: 3845,
                    hugoGeneSymbol: 'KRAS',
                    type: 'protein-coding',
                    chromosome: '12',
                },
                studyId: 'chol_tcga',
                center: 'hgsc.bcm.edu;broad.mit.edu;ucsc.edu;bcgsc.ca',
                mutationStatus: 'Somatic',
                validationStatus: 'Untested',
                tumorAltCount: -1,
                tumorRefCount: -1,
                normalAltCount: -1,
                normalRefCount: -1,
                startPosition: 25398285,
                endPosition: 25398285,
                referenceAllele: 'C',
                proteinChange: 'G12R',
                mutationType: 'Missense_Mutation',
                functionalImpactScore: 'M',
                fisValue: 2.675,
                linkXvar: 'getma.org/?cm=var&var=hg19,12,25398285,C,G&fts=all',
                linkPdb:
                    'getma.org/pdb.php?prot=RASK_HUMAN&from=5&to=165&var=G12R',
                linkMsa:
                    'getma.org/?cm=msa&ty=f&p=RASK_HUMAN&rb=5&re=165&var=G12R',
                ncbiBuild: 'GRCh37',
                variantType: 'SNP',
                keyword: 'KRAS G12 missense',
                driverFilter: '',
                driverFilterAnnotation: '',
                driverTiersFilter: '',
                driverTiersFilterAnnotation: '',
                variantAllele: 'G',
                refseqMrnaId: 'NM_033360.2',
                proteinPosStart: 12,
                proteinPosEnd: 12,
            },
        ] as Mutation[];

        const expectedResult_missense = {
            '3845_60_61': {
                entrezGeneId: 3845,
                proteinPosStart: 60,
                proteinPosEnd: 61,
            },
            '3845_12_12': {
                entrezGeneId: 3845,
                proteinPosStart: 12,
                proteinPosEnd: 12,
            },
        };

        assert.deepEqual(
            countMutations(mutations),
            expectedResult_missense,
            'missense mutations are counted'
        );

        mutations[0].mutationType = 'in_frame_del';

        assert.deepEqual(
            countMutations(mutations),
            expectedResult_missense,
            'frame mutations are counted'
        );

        mutations[0].mutationType = 'splice';

        assert.deepEqual(
            countMutations(mutations),
            expectedResult_missense,
            'splice mutations are counted'
        );
    });
});
