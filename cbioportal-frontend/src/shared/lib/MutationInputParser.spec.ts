import { assert } from 'chai';
import {
    buildIndexMap,
    getClinicalData,
    getGeneList,
    parseInput,
} from './MutationInputParser';

describe('MutationInputParser', () => {
    const partiallyAnnotatedMutationInput =
        'Hugo_Symbol\tSample_ID\tProtein_Change\tMutation_Type\tChromosome\tStart_Position\tEnd_Position\tReference_Allele\tVariant_Allele\n' +
        'AR\tTCGA-13-0760\tL729I\tMissense_Mutation\t23\t66937331\t66937331\tT\tA\n' +
        'AR\tTCGA-BS-A0UF\tR832*\tNonsense_Mutation\t23\t66942713\t66942713\tC\tT\n' +
        'AR\tTCGA-D1-A17M\tL185P\tMissense_Mutation\t23\t66765542\t66765542\tT\tC\n' +
        'AR\tTCGA-B5-A0JY\tK222N\tMissense_Mutation\t23\t66765654\t66765654\tG\tT\n' +
        'BRCA1\tTCGA-24-2298\tQ1395fs\tFrame_Shift_Ins\t17\t41242962\t41242963\t-\tGA\n' +
        'BRCA1\tTCGA-09-1669\tE1345fs\tFrame_Shift_Del\t17\t41243513\t41243513\tT\t-\n' +
        'BRCA1\tTCGA-25-1625\tE116*\tNonsense_Mutation\t17\t41256234\t41256234\tC\tA\n' +
        'BRCA1\tTCGA-13-0804\tC47W\tMissense_Mutation\t17\t41258544\t41258544\tG\tC\n' +
        'BRCA1\tTCGA-23-1027\tE23fs\tFrame_Shift_Del\t17\t41276045\t41276046\tCT\t-\n' +
        'BRCA1\tTCGA-23-1118\tE23fs\tFrame_Shift_Del\t17\t41276045\t41276046\tCT\t-\n' +
        'BRCA1\tTCGA-AP-A051\tL49M\tMissense_Mutation\t17\t41258540\t41258540\tG\tT\n' +
        'BRCA1\tTCGA-B5-A11E\tA942V\tMissense_Mutation\t17\t41244723\t41244723\tG\tA\n' +
        'BRCA1\tTCGA-BS-A0UF\tD1778_splice\tSplice_Site\t17\t41201212\t41201212\tC\tA\n' +
        'BRCA2\tTCGA-13-0793\tT3085fs\tFrame_Shift_Del\t13\t32954281\t32954282\tAG\t-\n' +
        'BRCA2\tTCGA-24-1103\tK1638E\tMissense_Mutation\t13\t32913404\t32913404\tA\tG\n' +
        'BRCA2\tTCGA-24-2024\tY1710fs\tFrame_Shift_Del\t13\t32913620\t32913623\tTATG\t-\n' +
        'BRCA2\tTCGA-04-1367\tE294*\tNonsense_Mutation\t13\t32906495\t32906495\tG\tT\n' +
        'BRCA2\tTCGA-23-1030\tT1354M\tMissense_Mutation\t13\t32912553\t32912553\tC\tT\n' +
        'BRCA2\tTCGA-13-0792\tE1143D\tMissense_Mutation\t13\t32911921\t32911921\tA\tT\n' +
        'BRCA2\tTCGA-24-1555\tE2878_splice\tSplice_Site\t13\t32950806\t32950806\tG\tC\n' +
        'BRCA2\tTCGA-B5-A11E\tR2842C\tMissense_Mutation\t13\t32945129\t32945129\tC\tT\n' +
        'BRCA2\tTCGA-B5-A0JY\tR2842C\tMissense_Mutation\t13\t32945129\t32945129\tC\tT\n' +
        'BRCA2\tTCGA-AP-A059\tS3239Y\tMissense_Mutation\t13\t32972366\t32972366\tC\tA\n' +
        'BRCA2\tTCGA-BS-A0UV\tE1441*\tNonsense_Mutation\t13\t32912813\t32912813\tG\tT\n' +
        'BRCA2\tTCGA-AX-A05Z\tE897*\tNonsense_Mutation\t13\t32911181\t32911181\tG\tT\n' +
        'POLE\tTCGA-57-1582\tN1869K\tMissense_Mutation\t12\t133214671\t133214671\tG\tC\n' +
        'POLE\tTCGA-24-1104\tT2245N\tMissense_Mutation\t12\t133201504\t133201504\tG\tT\n' +
        'POLE\tTCGA-AX-A05Z\tS1930*\tNonsense_Mutation\t12\t133212500\t133212500\tG\tT\n' +
        'POLE\tTCGA-AP-A059\tL2112M\tMissense_Mutation\t12\t133202900\t133202900\tG\tT\n' +
        'POLE\tTCGA-AP-A059\tA25T\tMissense_Mutation\t12\t133257855\t133257855\tC\tT\n' +
        'TP53\tTCGA-FI-A2EX\tR248W\tMissense_Mutation\t17\t7577539\t7577539\tG\tA\n' +
        'TP53\tTCGA-B5-A11N\tT256fs\tFrame_Shift_Ins\t17\t7577514\t7577515\t-\tT\n' +
        'TP53\tTCGA-DI-A1NN\tQ144*\tNonsense_Mutation\t17\t7578500\t7578500\tG\tA\n' +
        'TP53\tTCGA-AX-A0IU\tP278fs\tFrame_Shift_Ins\t17\t7577105\t7577106\t-\tGA\n' +
        'TP53\tTCGA-AP-A1DQ\tR175H\tMissense_Mutation\t17\t7578406\t7578406\tC\tT\n' +
        'TP53\tTCGA-AJ-A23M\t277_277C>CC\tIn_Frame_Ins\t17\t7577107\t7577108\t-\tCAG\n' +
        'TP53\tTCGA-EY-A212\tV173L\tMissense_Mutation\t17\t7578413\t7578413\tC\tG\n' +
        'TP53\tTCGA-D1-A16I\tI332_splice\tSplice_Site\t17\t7574034\t7574034\tC\tG';

    const basicMutationInput =
        'Sample_ID\tChromosome\tStart_Position\tEnd_Position\tReference_Allele\tVariant_Allele\n' +
        'TCGA-13-0760\tX\t66937331\t66937331\tT\tA\n' +
        'TCGA-BS-A0UF\tX\t66942713\t66942713\tC\tT\n' +
        'TCGA-D1-A17M\tX\t66765542\t66765542\tT\tC\n' +
        'TCGA-B5-A0JY\tX\t66765654\t66765654\tG\tT\n' +
        'TCGA-24-2298\t17\t41242962\t41242963\t-\tGA\n' +
        'TCGA-09-1669\t17\t41243513\t41243513\tT\t-\n' +
        'TCGA-25-1625\t17\t41256234\t41256234\tC\tA\n' +
        'TCGA-13-0804\t17\t41258544\t41258544\tG\tC\n' +
        'TCGA-23-1027\t17\t41276045\t41276046\tCT\t-\n' +
        'TCGA-23-1118\t17\t41276045\t41276046\tCT\t-\n' +
        'TCGA-AP-A051\t17\t41258540\t41258540\tG\tT\n' +
        'TCGA-B5-A11E\t17\t41244723\t41244723\tG\tA\n' +
        'TCGA-BS-A0UF\t17\t41201212\t41201212\tC\tA\n' +
        'TCGA-13-0793\t13\t32954281\t32954282\tAG\t-\n' +
        'TCGA-24-1103\t13\t32913404\t32913404\tA\tG\n' +
        'TCGA-24-2024\t13\t32913620\t32913623\tTATG\t-\n' +
        'TCGA-04-1367\t13\t32906495\t32906495\tG\tT\n' +
        'TCGA-23-1030\t13\t32912553\t32912553\tC\tT\n' +
        'TCGA-13-0792\t13\t32911921\t32911921\tA\tT\n' +
        'TCGA-24-1555\t13\t32950806\t32950806\tG\tC\n' +
        'TCGA-B5-A11E\t13\t32945129\t32945129\tC\tT\n' +
        'TCGA-B5-A0JY\t13\t32945129\t32945129\tC\tT\n' +
        'TCGA-AP-A059\t13\t32972366\t32972366\tC\tA\n' +
        'TCGA-BS-A0UV\t13\t32912813\t32912813\tG\tT\n' +
        'TCGA-AX-A05Z\t13\t32911181\t32911181\tG\tT\n' +
        'TCGA-57-1582\t12\t133214671\t133214671\tG\tC\n' +
        'TCGA-24-1104\t12\t133201504\t133201504\tG\tT\n' +
        'TCGA-AX-A05Z\t12\t133212500\t133212500\tG\tT\n' +
        'TCGA-AP-A059\t12\t133202900\t133202900\tG\tT\n' +
        'TCGA-AP-A059\t12\t133257855\t133257855\tC\tT\n' +
        'TCGA-FI-A2EX\t17\t7577539\t7577539\tG\tA\n' +
        'TCGA-B5-A11N\t17\t7577514\t7577515\t-\tT\n' +
        'TCGA-DI-A1NN\t17\t7578500\t7578500\tG\tA\n' +
        'TCGA-AX-A0IU\t17\t7577105\t7577106\t-\tGA\n' +
        'TCGA-AP-A1DQ\t17\t7578406\t7578406\tC\tT\n' +
        'TCGA-AJ-A23M\t17\t7577107\t7577108\t-\tCAG\n' +
        'TCGA-EY-A212\t17\t7578413\t7578413\tC\tG\n' +
        'TCGA-D1-A16I\t17\t7574034\t7574034\tC\tG\n' +
        'Unknown\t10\t89692905\t89692905\tG\tA';

    const minimalMutationInput =
        'Hugo_Symbol\tProtein_Change\n' +
        'AR\tL729I\n' +
        'AR\tR832*\n' +
        'AR\tL185P\n' +
        'AR\tK222N\n' +
        'BRCA1\tQ1395fs\n' +
        'BRCA1\tE1345fs\n' +
        'BRCA1\tE116*\n' +
        'BRCA1\tC47W\n' +
        'BRCA1\tE23fs\n' +
        'BRCA1\tE23fs\n' +
        'BRCA1\tL49M\n' +
        'BRCA1\tA942V\n' +
        'BRCA1\tD1778_splice\n' +
        'BRCA2\tT3085fs\n' +
        'BRCA2\tK1638E\n' +
        'BRCA2\tY1710fs\n' +
        'BRCA2\tE294*\n' +
        'BRCA2\tT1354M\n' +
        'BRCA2\tE1143D\n' +
        'BRCA2\tE2878_splice\n' +
        'BRCA2\tR2842C\n' +
        'BRCA2\tR2842C\n' +
        'BRCA2\tS3239Y\n' +
        'BRCA2\tE1441*\n' +
        'BRCA2\tE897*\n' +
        'POLE\tN1869K\n' +
        'POLE\tT2245N\n' +
        'POLE\tS1930*\n' +
        'POLE\tL2112M\n' +
        'POLE\tA25T\n' +
        'TP53\tR248W\n' +
        'TP53\tT256fs\n' +
        'TP53\tQ144*\n' +
        'TP53\tP278fs\n' +
        'TP53\tR175H\n' +
        'TP53\t277_277C>CC\n' +
        'TP53\tV173L\n' +
        'TP53\tI332_splice\n' +
        'PTEN\tR130Q';

    const mutationInputWithClinicalData =
        'Sample_ID\tCancer_Type\n' +
        'TCGA-13-0760\tCancerType1\n' +
        'TCGA-BS-A0UF\tCancerType1\n' +
        'TCGA-AP-A051\tCancerType2\n' +
        'TCGA-B5-A11E\tCancerType2\n' +
        'TCGA-BS-A0UF\tCancerType3\n' +
        'TCGA-13-0792\tCancerType3\n' +
        'TCGA-24-1104\tCancerType3\n' +
        'Unknown\tCancerType4';

    it('extracts mutation input headers', () => {
        const separator = '\t';
        const richInputIndexMap = buildIndexMap(
            partiallyAnnotatedMutationInput.split('\n')[0],
            separator
        );
        assert.equal(richInputIndexMap['hugo_symbol'], 0);
        assert.equal(richInputIndexMap['sample_id'], 1);
        assert.equal(richInputIndexMap['protein_change'], 2);
        assert.equal(richInputIndexMap['mutation_type'], 3);
        assert.equal(richInputIndexMap['chromosome'], 4);
        assert.equal(richInputIndexMap['start_position'], 5);
        assert.equal(richInputIndexMap['end_position'], 6);
        assert.equal(richInputIndexMap['reference_allele'], 7);
        assert.equal(richInputIndexMap['variant_allele'], 8);

        const basicInputIndexMap = buildIndexMap(
            basicMutationInput.split('\n')[0],
            separator
        );
        assert.equal(basicInputIndexMap['sample_id'], 0);
        assert.equal(basicInputIndexMap['chromosome'], 1);
        assert.equal(basicInputIndexMap['start_position'], 2);
        assert.equal(basicInputIndexMap['end_position'], 3);
        assert.equal(basicInputIndexMap['reference_allele'], 4);
        assert.equal(basicInputIndexMap['variant_allele'], 5);

        const minimalInputIndexMap = buildIndexMap(
            minimalMutationInput.split('\n')[0],
            separator
        );
        assert.equal(minimalInputIndexMap['hugo_symbol'], 0);
        assert.equal(minimalInputIndexMap['protein_change'], 1);

        const clinicalInputIndexMap = buildIndexMap(
            mutationInputWithClinicalData.split('\n')[0],
            separator
        );
        assert.equal(clinicalInputIndexMap['sample_id'], 0);
        assert.equal(clinicalInputIndexMap['cancer_type'], 1);
    });

    it('parses minimal mutation input', () => {
        const mutations = parseInput(minimalMutationInput);

        assert.equal(
            mutations.length,
            39,
            'number of parsed mutations should be equal to number of data lines'
        );

        assert.equal(
            mutations[0].proteinChange,
            'L729I',
            'input order of mutations should be preserved'
        );
        assert.equal(
            mutations[mutations.length - 1].proteinChange,
            'R130Q',
            'input order of mutations should be preserved'
        );

        assert.equal(
            mutations[0].gene!.hugoGeneSymbol,
            'AR',
            'gene instance should have hugo symbol'
        );

        assert.equal(
            mutations[1].sampleId,
            undefined,
            'mutation should NOT have sample id'
        );
        assert.equal(
            mutations[1].proteinChange,
            'R832*',
            'mutation should have protein change'
        );
        assert.equal(
            mutations[1].mutationType,
            undefined,
            'mutation should NOT have mutation type'
        );

        assert.equal(
            mutations[1].chr,
            undefined,
            'mutation should NOT have chromosome'
        );
        assert.equal(
            mutations[1].startPosition,
            undefined,
            'mutation should NOT have start position'
        );
        assert.equal(
            mutations[1].endPosition,
            undefined,
            'mutation should NOT have end position'
        );
        assert.equal(
            mutations[1].referenceAllele,
            undefined,
            'mutation should NOT have reference allele'
        );
        assert.equal(
            mutations[1].variantAllele,
            undefined,
            'mutation should NOT have variant allele'
        );
    });

    it('parses basic mutation input', () => {
        const mutations = parseInput(basicMutationInput);

        assert.equal(
            mutations.length,
            39,
            'number of parsed mutations should be equal to number of data lines'
        );

        assert.equal(
            mutations[0].sampleId,
            'TCGA-13-0760',
            'input order of mutations should be preserved'
        );
        assert.equal(
            mutations[mutations.length - 1].sampleId,
            'Unknown',
            'input order of mutations should be preserved'
        );

        assert.equal(
            mutations[0].gene,
            undefined,
            'gene instance should NOT have hugo symbol'
        );

        assert.equal(
            mutations[1].sampleId,
            'TCGA-BS-A0UF',
            'mutation should have sample id'
        );
        assert.equal(
            mutations[1].proteinChange,
            undefined,
            'mutation should NOT have protein change'
        );
        assert.equal(
            mutations[1].mutationType,
            undefined,
            'mutation should NOT have mutation type'
        );

        assert.equal(mutations[1].chr, 'X', 'mutation should have chromosome');
        assert.equal(
            mutations[1].startPosition,
            66942713,
            'mutation should have start position'
        );
        assert.equal(
            mutations[1].endPosition,
            66942713,
            'mutation should have end position'
        );
        assert.equal(
            mutations[1].referenceAllele,
            'C',
            'mutation should have reference allele'
        );
        assert.equal(
            mutations[1].variantAllele,
            'T',
            'mutation should have variant allele'
        );
    });

    it('parses partially annotated mutation input', () => {
        const mutations = parseInput(partiallyAnnotatedMutationInput);

        assert.equal(
            mutations.length,
            38,
            'number of parsed mutations should be equal to number of data lines'
        );

        assert.equal(
            mutations[0].proteinChange,
            'L729I',
            'input order of mutations should be preserved'
        );
        assert.equal(
            mutations[mutations.length - 1].sampleId,
            'TCGA-D1-A16I',
            'input order of mutations should be preserved'
        );

        assert.equal(
            mutations[0].gene!.hugoGeneSymbol,
            'AR',
            'gene instance should have hugo symbol'
        );
        assert.equal(
            mutations[1].sampleId,
            'TCGA-BS-A0UF',
            'mutation should have sample id'
        );
        assert.equal(
            mutations[2].proteinChange,
            'L185P',
            'mutation should have protein change'
        );
        assert.equal(
            mutations[3].mutationType,
            'Missense_Mutation',
            'mutation should have mutation type'
        );

        assert.equal(mutations[4].chr, '17', 'mutation should have chromosome');
        assert.equal(
            mutations[4].startPosition,
            41242962,
            'mutation should have start position'
        );
        assert.equal(
            mutations[4].endPosition,
            41242963,
            'mutation should have end position'
        );
        assert.equal(
            mutations[4].referenceAllele,
            '-',
            'mutation should have reference allele'
        );
        assert.equal(
            mutations[4].variantAllele,
            'GA',
            'mutation should have variant allele'
        );
    });

    it('parses mutation input with clinical data', () => {
        const mutations = parseInput(mutationInputWithClinicalData);

        assert.equal(
            mutations.length,
            8,
            'number of parsed mutations should be equal to number of data lines'
        );

        assert.equal(
            mutations[0].sampleId,
            'TCGA-13-0760',
            'mutation should have sample id'
        );
        assert.equal(
            mutations[0].cancerType,
            'CancerType1',
            'mutation should have cancer type'
        );

        assert.equal(
            mutations[7].sampleId,
            'Unknown',
            'mutation should have sample id'
        );
        assert.equal(
            mutations[7].cancerType,
            'CancerType4',
            'mutation should have cancer type'
        );
    });

    it('extracts list of hugo gene symbols from parsed input', () => {
        assert.deepEqual(
            getGeneList(parseInput(partiallyAnnotatedMutationInput)),
            ['AR', 'BRCA1', 'BRCA2', 'POLE', 'TP53']
        );

        assert.deepEqual(getGeneList(parseInput(minimalMutationInput)), [
            'AR',
            'BRCA1',
            'BRCA2',
            'POLE',
            'TP53',
            'PTEN',
        ]);

        assert.deepEqual(getGeneList(parseInput(basicMutationInput)), []);
    });

    it('extracts clinical data from parsed input', () => {
        assert.deepEqual(
            getClinicalData(parseInput(partiallyAnnotatedMutationInput)),
            [],
            'partially annotation mutation input should NOT have any clinical data'
        );
        assert.deepEqual(
            getClinicalData(parseInput(minimalMutationInput)),
            [],
            'minimal mutation input should NOT have any clinical data'
        );
        assert.deepEqual(
            getClinicalData(parseInput(basicMutationInput)),
            [],
            'basic mutation input should NOT have any clinical data'
        );

        const clinicalData = getClinicalData(
            parseInput(mutationInputWithClinicalData)
        );

        assert.isAbove(
            clinicalData.length,
            0,
            'mutation input with clinical data should have clinical data'
        );

        assert.equal(clinicalData[0].clinicalAttributeId, 'CANCER_TYPE');
        assert.equal(clinicalData[0].value, 'CancerType1');
        assert.equal(clinicalData[0].sampleId, 'TCGA-13-0760');

        assert.equal(clinicalData[2].clinicalAttributeId, 'CANCER_TYPE');
        assert.equal(clinicalData[2].value, 'CancerType2');
        assert.equal(clinicalData[2].sampleId, 'TCGA-AP-A051');

        assert.equal(clinicalData[4].clinicalAttributeId, 'CANCER_TYPE');
        assert.equal(clinicalData[4].value, 'CancerType3');
        assert.equal(clinicalData[4].sampleId, 'TCGA-BS-A0UF');

        assert.equal(clinicalData[7].clinicalAttributeId, 'CANCER_TYPE');
        assert.equal(clinicalData[7].value, 'CancerType4');
        assert.equal(clinicalData[7].sampleId, 'Unknown');
    });
});
