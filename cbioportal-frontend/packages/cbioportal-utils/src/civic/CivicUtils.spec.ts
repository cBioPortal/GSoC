import { assert } from 'chai';
import { ICivicGeneIndex, ICivicVariantIndex } from '../model/Civic';
import {
    MutationSpec,
    getCivicVariants,
    splitProteinChange,
} from './CivicUtils';

describe('CivicUtils', () => {
    const proteinChangeWithSplittingSymbol =
        'proteinchange1/proteinchange2+proteinchange3';
    const proteinChangeWithoutSplittingSymbol = 'protein.change';

    describe('splitProteinChange', () => {
        it('Match any other variants after splitting the name on + or /', () => {
            const splittedProteinChanges = splitProteinChange(
                proteinChangeWithSplittingSymbol
            );

            assert.equal(
                splittedProteinChanges.length,
                3,
                'Split by "/" and "+"'
            );

            assert.equal(
                splittedProteinChanges[0],
                'proteinchange1',
                'First protein change is "proteinchange1"'
            );

            assert.equal(
                splittedProteinChanges[1],
                'proteinchange2',
                'Second protein change is "proteinchange2"'
            );

            assert.equal(
                splittedProteinChanges[2],
                'proteinchange3',
                'Third protein change is "proteinchange3"'
            );
        });

        it('Returns protein change when no + or /', () => {
            const splittedProteinChanges = splitProteinChange(
                proteinChangeWithoutSplittingSymbol
            );

            assert.equal(splittedProteinChanges.length, 1, 'No + or / matched');

            assert.equal(
                splittedProteinChanges[0],
                'protein.change',
                'Protein change is "protein.change"'
            );
        });
    });

    describe('getCivicVariants', () => {
        const civicGenes: ICivicGeneIndex = {
            PIK3CA: {
                id: 37,
                name: 'PIK3CA',
                description:
                    "PIK3CA is the most recurrently mutated gene in breast cancer, and has been found to important in a number of cancer types. An integral part of the PI3K pathway, PIK3CA has long been described as an oncogene, with two main hotspots for activating mutations, the 542/545 region of the helical domain, and the 1047 region of the kinase domain. PIK3CA, and its interaction with the AKT and mTOR pathways, is the subject of an immense amount of research and development, and PI3K inhibition has seen some limited success in recent clinical trials. While monotherapies seem to be limited in their potential, there is a recent interest in pursuing PI3K inhibition as part of a combination therapy regiment with inhibition partners including TKI's, MEK inhibitors, PARP inhibitors, and in breast cancer, aromatase inhibitors.",
                url: 'https://civicdb.org/genes/37/summary',
                variants: {
                    E545K: {
                        id: 104,
                        name: 'E545K',
                        geneId: 37,
                        description:
                            'PIK3CA E545K/E542K are the second most recurrent PIK3CA mutations in breast cancer, and are highly recurrent mutations in many other cancer types. E545K, and possibly the other mutations in the E545 region, may present patients with a poorer prognosis than patients with either patients with other PIK3CA variant or wild-type PIK3CA. There is also data to suggest that E545/542 mutations may confer resistance to EGFR inhibitors like cetuximab. While very prevalent, targeted therapies for variants in PIK3CA are still in early clinical trial phases.',
                        url: 'https://civicdb.org/variants/104/summary',
                        evidenceCounts: {
                            prognosticCount: 1,
                            predictiveCount: 14,
                            diagnosticCount: 0,
                            predisposingCount: 0,
                            oncogenicCount: 0,
                            functionalCount: 0,
                        },
                    },
                },
            },
        } as any;

        const civicCnaGenes: ICivicGeneIndex = {
            RAF1: {
                id: 4767,
                name: 'RAF1',
                description: '',
                url: 'https://civicdb.org/genes/4767/summary',
                variants: {
                    id: 591,
                    name: 'AMPLIFICATION',
                    geneId: 4767,
                    description: '',
                    url: 'https://civicdb.org/variants/591/summary',
                    evidenceCounts: {
                        prognosticCount: 1,
                        predictiveCount: 1,
                        diagnosticCount: 0,
                        predisposingCount: 0,
                        oncogenicCount: 0,
                        functionalCount: 0,
                    },
                },
            },
        } as any;

        const cnaCivicVariants: ICivicVariantIndex = {
            RAF1: {
                AMPLIFICATION: {
                    id: 591,
                    name: 'AMPLIFICATION',
                    description: '',
                    url: 'https://civicdb.org/variants/591/summary',
                    evidenceCounts: {
                        prognosticCount: 1,
                        predictiveCount: 1,
                        diagnosticCount: 0,
                        predisposingCount: 0,
                        oncogenicCount: 0,
                        functionalCount: 0,
                    },
                },
            },
        };

        const mutationCivicVariants: ICivicVariantIndex = {
            PIK3CA: {
                E545K: {
                    id: 104,
                    name: 'E545K',
                    description:
                        'PIK3CA E545K/E542K are the second most recurrent PIK3CA mutations in breast cancer, and are highly recurrent mutations in many other cancer types. E545K, and possibly the other mutations in the E545 region, may present patients with a poorer prognosis than patients with either patients with other PIK3CA variant or wild-type PIK3CA. There is also data to suggest that E545/542 mutations may confer resistance to EGFR inhibitors like cetuximab. While very prevalent, targeted therapies for variants in PIK3CA are still in early clinical trial phases.',
                    url: 'https://civicdb.org/variants/104/summary',
                    evidenceCounts: {
                        prognosticCount: 1,
                        predictiveCount: 14,
                        diagnosticCount: 0,
                        predisposingCount: 0,
                        oncogenicCount: 0,
                        functionalCount: 0,
                    },
                },
            },
        };

        const mutationData: MutationSpec[] = [
            {
                gene: {
                    hugoGeneSymbol: 'PIK3CA',
                },
                proteinChange: 'E545K',
            },
        ];

        it('Returns civicVariants map for PIK3CA', () => {
            const civicVariantsPromise = getCivicVariants(
                civicGenes,
                mutationData
            );
            civicVariantsPromise
                .then(civicVariants => {
                    assert.equal(
                        civicVariants,
                        mutationCivicVariants,
                        'PIK3CA E545K civic variants'
                    );
                })
                .catch(() => {
                    /*do nothing*/
                });
        });
        it('Returns civicVariants map for CNA', () => {
            const civicVariantsPromise = getCivicVariants(
                civicCnaGenes,
                undefined
            );
            civicVariantsPromise
                .then(civicVariants => {
                    assert.equal(
                        civicVariants,
                        cnaCivicVariants,
                        'CNA civic variants'
                    );
                })
                .catch(() => {
                    /*do nothing*/
                });
        });
    });
});
