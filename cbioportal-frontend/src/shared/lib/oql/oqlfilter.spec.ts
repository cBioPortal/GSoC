import {
    filterCBioPortalWebServiceDataByUnflattenedOQLLine,
    MergedTrackLineFilterOutput,
    filterCBioPortalWebServiceData,
    parseOQLQuery,
    unparseOQLQueryLine,
    doesQueryContainMutationOQL,
    doesQueryContainOQL,
    convertToGene1Gene2String,
    STUCTVARDownstreamFusionStr,
    STUCTVARUpstreamFusionStr,
    STRUCTVARAnyGeneStr,
    STRUCTVARNullGeneStr,
    queryContainsStructVarAlteration,
} from './oqlfilter';
import {
    NumericGeneMolecularData,
    MolecularProfile,
} from 'cbioportal-ts-api-client';
import AccessorsForOqlFilter from './AccessorsForOqlFilter';
import { assert } from 'chai';
import { AlterationTypeConstants } from 'shared/constants';
import {
    AnnotatedMutation,
    AnnotatedStructuralVariant,
} from 'shared/model/AnnotatedMutation';
import { CustomDriverNumericGeneMolecularData } from 'shared/model/CustomDriverNumericGeneMolecularData';
import { SingleGeneQuery } from './oql-parser';
import { assertEsLintSupport } from 'fork-ts-checker-webpack-plugin/lib/eslint-reporter/assertEsLintSupport';

// This file uses type assertions to force functions that use overly specific
// Swagger-generated types as parameters to accept mocked literals believed to
// be sufficient
// tslint:disable no-object-literal-type-assertion

// I believe DETAILED projection to have enough details for the filter function
const THREE_GENE_TWO_SAMPLE_CNA_DATA = ([
    {
        __id: 4,
        putativeDriver: true,
        sampleId: 'TCGA-02-0001-01',
        entrezGeneId: 672,
        value: 1,
        molecularProfileId: 'gbm_tcga_gistic',
        uniqueSampleKey: 'VENHQS0wMi0wMDAxLTAxOmdibV90Y2dh',
        uniquePatientKey: 'VENHQS0wMi0wMDAxOmdibV90Y2dh',
        patientId: 'TCGA-02-0001',
        studyId: 'gbm_tcga',
        gene: {
            entrezGeneId: 672,
            hugoGeneSymbol: 'BRCA1',
            type: 'protein-coding',
            cytoband: '17q21.31',
            length: 8922,
        },
    },
    {
        __id: 5,
        putativeDriver: false,
        sampleId: 'TCGA-02-0001-01',
        entrezGeneId: 5728,
        value: 0,
        molecularProfileId: 'gbm_tcga_gistic',
        uniqueSampleKey: 'VENHQS0wMi0wMDAxLTAxOmdibV90Y2dh',
        uniquePatientKey: 'VENHQS0wMi0wMDAxOmdibV90Y2dh',
        patientId: 'TCGA-02-0001',
        studyId: 'gbm_tcga',
        gene: {
            entrezGeneId: 5728,
            hugoGeneSymbol: 'PTEN',
            type: 'protein-coding',
            cytoband: '10q23.31',
            length: 11581,
        },
    },
    {
        __id: 6,
        putativeDriver: false,
        sampleId: 'TCGA-02-0001-01',
        entrezGeneId: 7157,
        value: -1,
        molecularProfileId: 'gbm_tcga_gistic',
        uniqueSampleKey: 'VENHQS0wMi0wMDAxLTAxOmdibV90Y2dh',
        uniquePatientKey: 'VENHQS0wMi0wMDAxOmdibV90Y2dh',
        patientId: 'TCGA-02-0001',
        studyId: 'gbm_tcga',
        gene: {
            entrezGeneId: 7157,
            hugoGeneSymbol: 'TP53',
            type: 'protein-coding',
            cytoband: '17p13.1',
            length: 4576,
        },
    },
    {
        __id: 7,
        putativeDriver: true,
        sampleId: 'TCGA-02-0003-01',
        entrezGeneId: 672,
        value: -2,
        molecularProfileId: 'gbm_tcga_gistic',
        uniqueSampleKey: 'VENHQS0wMi0wMDAzLTAxOmdibV90Y2dh',
        uniquePatientKey: 'VENHQS0wMi0wMDAzOmdibV90Y2dh',
        patientId: 'TCGA-02-0003',
        studyId: 'gbm_tcga',
        gene: {
            entrezGeneId: 672,
            hugoGeneSymbol: 'BRCA1',
            type: 'protein-coding',
            cytoband: '17q21.31',
            length: 8922,
        },
    },
    {
        __id: 8,
        putativeDriver: true,
        sampleId: 'TCGA-02-0003-01',
        entrezGeneId: 5728,
        value: -1,
        molecularProfileId: 'gbm_tcga_gistic',
        uniqueSampleKey: 'VENHQS0wMi0wMDAzLTAxOmdibV90Y2dh',
        uniquePatientKey: 'VENHQS0wMi0wMDAzOmdibV90Y2dh',
        patientId: 'TCGA-02-0003',
        studyId: 'gbm_tcga',
        gene: {
            entrezGeneId: 5728,
            hugoGeneSymbol: 'PTEN',
            type: 'protein-coding',
            cytoband: '10q23.31',
            length: 11581,
        },
    },
    {
        __id: 9,
        putativeDriver: true,
        sampleId: 'TCGA-02-0003-01',
        entrezGeneId: 7157,
        value: 0,
        molecularProfileId: 'gbm_tcga_gistic',
        uniqueSampleKey: 'VENHQS0wMi0wMDAzLTAxOmdibV90Y2dh',
        uniquePatientKey: 'VENHQS0wMi0wMDAzOmdibV90Y2dh',
        patientId: 'TCGA-02-0003',
        studyId: 'gbm_tcga',
        gene: {
            entrezGeneId: 7157,
            hugoGeneSymbol: 'TP53',
            type: 'protein-coding',
            cytoband: '17p13.1',
            length: 4576,
        },
    },
] as any) as CustomDriverNumericGeneMolecularData[];
// I believe these metadata to be all `new AccessorsForOqlFilter()` needs
const DATA_PROFILE = {
    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
    datatype: 'DISCRETE',
    molecularProfileId: 'gbm_tcga_gistic',
    studyId: 'gbm_tcga',
} as MolecularProfile;

const MUTATION_PROFILE = {
    molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
    molecularProfileId: 'gbm_tcga_mutations',
    studyId: 'gbm_tcga',
} as MolecularProfile;

const STRUCTURAL_VARIANT_PROFILE = {
    molecularAlterationType: AlterationTypeConstants.STRUCTURAL_VARIANT,
    molecularProfileId: 'gbm_tcga_fusion',
    studyId: 'gbm_tcga',
} as MolecularProfile;

const MUTATION_DATA = ([
    {
        gene: {
            hugoGeneSymbol: 'BRCA1',
        },
        molecularProfileId: 'gbm_tcga_mutations',
        mutationType: 'Missense_Variant',
        mutationStatus: 'germline',
        proteinPosStart: 10,
        proteinPosEnd: 53,
        putativeDriver: true,
        __id: 0,
    },
    {
        gene: {
            hugoGeneSymbol: 'BRCA1',
        },
        molecularProfileId: 'gbm_tcga_mutations',
        mutationType: 'Missense_Variant',
        mutationStatus: 'aspdoifjpasoid',
        proteinPosStart: 20,
        proteinPosEnd: 33,
        putativeDriver: true,
        __id: 1,
    },
    {
        gene: {
            hugoGeneSymbol: 'BRCA1',
        },
        molecularProfileId: 'gbm_tcga_mutations',
        mutationType: 'Missense_Variant',
        mutationStatus: null,
        proteinPosStart: 1,
        proteinPosEnd: 3,
        putativeDriver: false,
        __id: 2,
    },
    {
        gene: {
            hugoGeneSymbol: 'BRCA1',
        },
        molecularProfileId: 'gbm_tcga_mutations',
        mutationType: 'in_frame_ins',
        mutationStatus: undefined,
        proteinPosStart: undefined,
        proteinPosEnd: undefined,
        putativeDriver: true,
        __id: 3,
    },
    {
        gene: {
            hugoGeneSymbol: 'BRCA1',
        },
        molecularProfileId: 'gbm_tcga_mutations',
        mutationType: 'in_frame_ins',
        mutationStatus: undefined,
        proteinPosStart: -1,
        proteinPosEnd: 10000000,
        putativeDriver: true,
        __id: 3.1,
    },
] as any) as AnnotatedMutation[];

const STRUCTURAL_VARIANT_DATA = ([
    {
        hugoGeneSymbol: 'BRCA1',
        site1HugoSymbol: 'BRCA1',
        site2HugoSymbol: 'IGF2',
        molecularProfileId: 'gbm_tcga_fusion',
        variantClass: 'Fusion',
        eventInfo: 'BRCA1-IGF2',
        putativeDriver: false,
        __id: -1,
    },
    {
        hugoGeneSymbol: 'PTEN',
        site1HugoSymbol: 'PTEN',
        site2HugoSymbol: 'IGF2',
        molecularProfileId: 'gbm_tcga_fusion',
        variantClass: 'Fusion',
        eventInfo: 'PTEN-IGF2',
        putativeDriver: true,
        __id: -2,
    },
] as any) as AnnotatedStructuralVariant[];

describe('doesQueryContainOQL', () => {
    it('returns correct result in various cases', () => {
        assert.equal(doesQueryContainOQL('TP53 BRCA1 BRCA2'), false);
        assert.equal(doesQueryContainOQL('TP53'), false);
        assert.equal(doesQueryContainOQL('TP53 BRCA1 BRCA2;'), false);
        assert.equal(doesQueryContainOQL('TP53;'), false);
        assert.equal(doesQueryContainOQL('TP53 BRCA1 BRCA2:MUT'), true);
        assert.equal(doesQueryContainOQL('TP53 BRCA1 BRCA2:AMP'), true);
        assert.equal(doesQueryContainOQL('TP53 BRCA1 BRCA2:HOMDEL'), true);
        assert.equal(doesQueryContainOQL('TP53 BRCA1 BRCA2:EXP>0'), true);
        assert.equal(doesQueryContainOQL('TP53 BRCA1 BRCA2:FUSION'), true);
        assert.equal(doesQueryContainOQL('TP53 BRCA1 BRCA2:DRIVER'), true);
        assert.equal(doesQueryContainOQL('TP53 BRCA1 PTEN::'), true);
        assert.equal(doesQueryContainOQL('TP53 BRCA1 ::IGF2'), true);
        assert.equal(doesQueryContainOQL('TP53 BRCA1 PTEN::IGF2'), true);
        assert.equal(doesQueryContainOQL('TP53 BRCA1 PTEN:FUSION::'), true);
        assert.equal(doesQueryContainOQL('TP53 BRCA1 PTEN:FUSION::IGF2'), true);
        assert.equal(doesQueryContainOQL('TP53 BRCA1 PTEN:IGF::FUSION'), true);
    });
});

describe('doesQueryContainMutationOQL', () => {
    it('returns correct result in various cases', () => {
        assert.equal(doesQueryContainMutationOQL('TP53: AMP'), false);
        assert.equal(doesQueryContainMutationOQL('TP53: EXP>0'), false);
        assert.equal(doesQueryContainMutationOQL('TP53;'), false);
        assert.equal(doesQueryContainMutationOQL('TP53 BRCA1 BRCA2;'), false);
        assert.equal(doesQueryContainMutationOQL('TP53: MUT'), false);
        assert.equal(doesQueryContainMutationOQL('TP53: GERMLINE'), true);
        assert.equal(doesQueryContainMutationOQL('TP53: proteinchange'), true);
        assert.equal(
            doesQueryContainMutationOQL('TP53: proteinchange_GERMLINE'),
            true
        );
        assert.equal(doesQueryContainMutationOQL('TP53: DRIVER'), true);

        // Struct Vars
        assert.equal(doesQueryContainMutationOQL('TP53: FUSION'), false);
        assert.equal(doesQueryContainMutationOQL('TP53: FUSION::'), false);
        assert.equal(doesQueryContainMutationOQL('TP53: ::FUSION'), false);
        assert.equal(doesQueryContainMutationOQL('TP53: FUSION::-'), false);
        assert.equal(doesQueryContainMutationOQL('TP53: -::FUSION'), false);
        assert.equal(doesQueryContainMutationOQL('KIF5B: FUSION::RET'), false);
        assert.equal(doesQueryContainMutationOQL('RET: KIF5B::FUSION'), false);
    });
});

describe('unparseOQLQueryLine', () => {
    it('unparses query with no alterations', () => {
        const parsedLine = parseOQLQuery('TP53;')[0];
        assert.equal(unparseOQLQueryLine(parsedLine), 'TP53');
    });
    it('unparses query with MUT keyword', () => {
        const parsedLine = parseOQLQuery('TP53: MUT;')[0];
        assert.equal(unparseOQLQueryLine(parsedLine), 'TP53: MUT;');
    });
    it('unparses query with complex mutation specifications', () => {
        const parsedLine = parseOQLQuery('TP53: MISSENSE proteinchange;')[0];
        assert.equal(
            unparseOQLQueryLine(parsedLine),
            'TP53: MUT=MISSENSE MUT=proteinchange;'
        );
    });
    it('unparses query with EXP and PROT', () => {
        const parsedLine = parseOQLQuery('TP53: EXP > 0 PROT < -2')[0];
        assert.equal(unparseOQLQueryLine(parsedLine), 'TP53: EXP>0 PROT<-2;');
    });
    it('unparses query with many alteration types', () => {
        const parsedLine = parseOQLQuery(
            'TP53: MISSENSE proteinchange HOMDEL EXP<-4 PROT>1 FUSION;'
        )[0];
        assert.equal(
            unparseOQLQueryLine(parsedLine),
            'TP53: MUT=MISSENSE MUT=proteinchange HOMDEL EXP<-4 PROT>1 FUSION;'
        );
    });
    it('unparses queries with germline and somatic mutation modifiers', () => {
        const parsedLine = parseOQLQuery(
            'TP53: GERMLINE SOMATIC_MISSENSE proteinchange_GERMLINE;'
        )[0];
        assert.equal(
            unparseOQLQueryLine(parsedLine),
            'TP53: MUT_GERMLINE MUT=MISSENSE_SOMATIC MUT=proteinchange_GERMLINE;'
        );
    });
    it('unparses queries with driver modifier', () => {
        const parsedLine = parseOQLQuery(
            'TP53: DRIVER MUT=DRIVER CNA_DRIVER DRIVER_CNA FUSION_DRIVER DRIVER_FUSION TRUNC_DRIVER DRIVER_TRUNC AMP_DRIVER DRIVER_HOMDEL GERMLINE SOMATIC_MISSENSE proteinchange_GERMLINE;'
        )[0];
        assert.equal(
            unparseOQLQueryLine(parsedLine),
            'TP53: DRIVER MUT=DRIVER CNA_DRIVER CNA_DRIVER FUSION_DRIVER FUSION_DRIVER MUT=TRUNC_DRIVER MUT=TRUNC_DRIVER AMP_DRIVER HOMDEL_DRIVER MUT_GERMLINE MUT=MISSENSE_SOMATIC MUT=proteinchange_GERMLINE;'
        );
    });
    it('unparses queries with range mutation modifiers', () => {
        const parsedLine = parseOQLQuery(
            'TP53: DRIVER_GERMLINE_INFRAME_(1-100*) MUT_(-500) GERMLINE_(51-)_DRIVER'
        )[0];
        assert.equal(
            unparseOQLQueryLine(parsedLine),
            'TP53: MUT=INFRAME_DRIVER_GERMLINE_(1-100*) MUT_(-500) MUT_GERMLINE_(51-)_DRIVER;'
        );
    });
    it('unparses queries with downstream fusion with RET', () => {
        const parsedLine = parseOQLQuery(
            'KIF5B: SOMATIC_FUSION::RET_DRIVER'
        )[0];
        assert.equal(
            unparseOQLQueryLine(parsedLine),
            'KIF5B: FUSION::RET_SOMATIC_DRIVER;'
        );
    });
    it('unparses queries with downstream fusion with any gene', () => {
        const parsedLine = parseOQLQuery('KIF5B: SOMATIC_FUSION::_DRIVER')[0];
        assert.equal(
            unparseOQLQueryLine(parsedLine),
            'KIF5B: FUSION::_SOMATIC_DRIVER;'
        );
    });
    it('unparses queries with downstream fusion with undefined gene', () => {
        const parsedLine = parseOQLQuery('KIF5B: SOMATIC_FUSION::-_DRIVER')[0];
        assert.equal(
            unparseOQLQueryLine(parsedLine),
            'KIF5B: FUSION::-_SOMATIC_DRIVER;'
        );
    });
});

describe('filterCBioPortalWebServiceData', () => {
    it('filters properly using the GERMLINE and SOMATIC mutation modifiers', () => {
        const accessorsInstance = new AccessorsForOqlFilter([MUTATION_PROFILE]);
        let filteredData = filterCBioPortalWebServiceData(
            'BRCA1:GERMLINE',
            MUTATION_DATA,
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [0]
        );
        filteredData = filterCBioPortalWebServiceData(
            'BRCA1:SOMATIC',
            MUTATION_DATA,
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [1, 2, 3, 3.1]
        );
        filteredData = filterCBioPortalWebServiceData(
            'BRCA1:MISSENSE_SOMATIC',
            MUTATION_DATA,
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [1, 2]
        );
        filteredData = filterCBioPortalWebServiceData(
            'BRCA1:INFRAME_SOMATIC',
            MUTATION_DATA,
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [3, 3.1]
        );
        filteredData = filterCBioPortalWebServiceData(
            'BRCA1:INFRAME_GERMLINE',
            MUTATION_DATA,
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            []
        );
        filteredData = filterCBioPortalWebServiceData(
            'BRCA1:MISSENSE_GERMLINE',
            MUTATION_DATA,
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [0]
        );
        filteredData = filterCBioPortalWebServiceData(
            'BRCA1:MISSENSE_GERMLINE INFRAME_SOMATIC',
            MUTATION_DATA,
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [0, 3, 3.1]
        );
    });
    it('filters properly using the DRIVER modifier', () => {
        const accessorsInstance = new AccessorsForOqlFilter([
            MUTATION_PROFILE,
            DATA_PROFILE,
            STRUCTURAL_VARIANT_PROFILE,
        ]);
        let filteredData = filterCBioPortalWebServiceData(
            'BRCA1:DRIVER',
            [
                ...STRUCTURAL_VARIANT_DATA,
                ...MUTATION_DATA,
                ...THREE_GENE_TWO_SAMPLE_CNA_DATA,
            ] as any[],
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [0, 1, 3, 3.1, 7]
        );

        filteredData = filterCBioPortalWebServiceData(
            'BRCA1:MUT=DRIVER',
            [
                ...STRUCTURAL_VARIANT_DATA,
                ...MUTATION_DATA,
                ...THREE_GENE_TWO_SAMPLE_CNA_DATA,
            ] as any[],
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [0, 1, 3, 3.1]
        );

        filteredData = filterCBioPortalWebServiceData(
            'BRCA1:MISSENSE_DRIVER',
            [
                ...STRUCTURAL_VARIANT_DATA,
                ...MUTATION_DATA,
                ...THREE_GENE_TWO_SAMPLE_CNA_DATA,
            ] as any[],
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [0, 1]
        );

        filteredData = filterCBioPortalWebServiceData(
            'BRCA1:MUT=MISSENSE_DRIVER',
            [
                ...STRUCTURAL_VARIANT_DATA,
                ...MUTATION_DATA,
                ...THREE_GENE_TWO_SAMPLE_CNA_DATA,
            ] as any[],
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [0, 1]
        );

        filteredData = filterCBioPortalWebServiceData(
            'BRCA1:DRIVER_MISSENSE',
            [
                ...STRUCTURAL_VARIANT_DATA,
                ...MUTATION_DATA,
                ...THREE_GENE_TWO_SAMPLE_CNA_DATA,
            ] as any[],
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [0, 1]
        );

        filteredData = filterCBioPortalWebServiceData(
            'PTEN:DRIVER_HETLOSS',
            [
                ...STRUCTURAL_VARIANT_DATA,
                ...MUTATION_DATA,
                ...THREE_GENE_TWO_SAMPLE_CNA_DATA,
            ] as any[],
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [8]
        );

        filteredData = filterCBioPortalWebServiceData(
            'PTEN:CNA_DRIVER',
            [
                ...STRUCTURAL_VARIANT_DATA,
                ...MUTATION_DATA,
                ...THREE_GENE_TWO_SAMPLE_CNA_DATA,
            ] as any[],
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [8]
        );

        filteredData = filterCBioPortalWebServiceData(
            'BRCA1: DRIVER; PTEN:HETLOSS_DRIVER; TP53: DRIVER',
            [
                ...STRUCTURAL_VARIANT_DATA,
                ...MUTATION_DATA,
                ...THREE_GENE_TWO_SAMPLE_CNA_DATA,
            ] as any[],
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [0, 1, 3, 3.1, 7, 8]
        );

        filteredData = filterCBioPortalWebServiceData(
            'BRCA1:FUSION_DRIVER',
            [
                ...STRUCTURAL_VARIANT_DATA,
                ...MUTATION_DATA,
                ...THREE_GENE_TWO_SAMPLE_CNA_DATA,
            ] as any[],
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            []
        );

        filteredData = filterCBioPortalWebServiceData(
            'BRCA1:DRIVER_FUSION',
            [
                ...STRUCTURAL_VARIANT_DATA,
                ...MUTATION_DATA,
                ...THREE_GENE_TWO_SAMPLE_CNA_DATA,
            ] as any[],
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            []
        );

        filteredData = filterCBioPortalWebServiceData(
            'PTEN:FUSION_DRIVER',
            [
                ...STRUCTURAL_VARIANT_DATA,
                ...MUTATION_DATA,
                ...THREE_GENE_TWO_SAMPLE_CNA_DATA,
            ] as any[],
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [-2]
        );

        filteredData = filterCBioPortalWebServiceData(
            'PTEN:DRIVER_FUSION',
            [
                ...STRUCTURAL_VARIANT_DATA,
                ...MUTATION_DATA,
                ...THREE_GENE_TWO_SAMPLE_CNA_DATA,
            ] as any[],
            accessorsInstance,
            ''
        );
        assert.deepEqual(
            (filteredData as any).map((x: any) => x.__id),
            [-2]
        );
    });

    it('filters by RANGE modifier alone', () => {
        const accessorsInstance = new AccessorsForOqlFilter([MUTATION_PROFILE]);
        const tests = [
            { oql: 'BRCA1: MUT_(1-10)', ids: [0, 2] },
            { oql: 'BRCA1: MUT_(20-49)', ids: [0, 1] },
            { oql: 'BRCA1: MUT_(1-10*)', ids: [2] },
            { oql: 'BRCA1: MUT_(20-49*)', ids: [1] },
            { oql: 'BRCA1: MUT_(2-)', ids: [0, 1, 2] },
            { oql: 'BRCA1: MUT_(20-)', ids: [0, 1] },
            { oql: 'BRCA1: MUT_(2-*)', ids: [0, 1] },
            { oql: 'BRCA1: MUT_(20-*)', ids: [1] },
            { oql: 'BRCA1: MUT_(-15)', ids: [0, 2] },
            { oql: 'BRCA1: MUT_(-45)', ids: [0, 1, 2] },
            { oql: 'BRCA1: MUT_(-15*)', ids: [2] },
            { oql: 'BRCA1: MUT_(-45*)', ids: [1, 2] },
        ];
        let filteredData: any[];
        for (const test of tests) {
            filteredData = filterCBioPortalWebServiceData(
                test.oql,
                MUTATION_DATA,
                accessorsInstance,
                ''
            );
            assert.deepEqual(
                filteredData.map((x: any) => x.__id),
                test.ids,
                test.oql
            );
        }
    });

    it('filters by RANGE modifier combined with other modifiers', () => {
        const accessorsInstance = new AccessorsForOqlFilter([MUTATION_PROFILE]);
        const tests = [
            { oql: 'BRCA1: MUT_(1-10)_GERMLINE', ids: [0] },
            { oql: 'BRCA1: MUT_(20-49*)_DRIVER', ids: [1] },
            { oql: 'BRCA1: MUT_(2-)_GERMLINE_DRIVER', ids: [0] },
            { oql: 'BRCA1: MUT_(20-*)_GERMLINE_DRIVER', ids: [] },
            { oql: 'BRCA1: MUT_(-15)_SOMATIC', ids: [2] },
            { oql: 'BRCA1: MUT_(-45*)_SOMATIC_DRIVER', ids: [1] },
        ];
        let filteredData: any[];
        for (const test of tests) {
            filteredData = filterCBioPortalWebServiceData(
                test.oql,
                MUTATION_DATA,
                accessorsInstance,
                ''
            );
            assert.deepEqual(
                filteredData.map((x: any) => x.__id),
                test.ids,
                test.oql
            );
        }
    });
});

describe('filterCBioPortalWebServiceDataByUnflattenedOQLLine', () => {
    it('returns a single .data object for a single-gene query', () => {
        // given CNA data for 3 genes in 2 samples and an AccessorsForOqlFilter instance
        // aware of their profile
        const dataArray: NumericGeneMolecularData[] = THREE_GENE_TWO_SAMPLE_CNA_DATA;
        const accessorsInstance: AccessorsForOqlFilter = new AccessorsForOqlFilter(
            [DATA_PROFILE]
        );
        // when calling the function with an OQL query asking data for 1 gene
        const filteredData = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
            'BRCA1',
            dataArray,
            accessorsInstance,
            ''
        );
        // then it returns a single data object with data for the 3 samples
        assert.lengthOf(filteredData, 1);
        assert.property(filteredData[0], 'data');
    });

    it('returns a .list with single .data object for a single-gene merged query', () => {
        // given CNA data for 3 genes in 2 samples and an AccessorsForOqlFilter instance
        // aware of their profile
        const dataArray: NumericGeneMolecularData[] = THREE_GENE_TWO_SAMPLE_CNA_DATA;
        const accessorsInstance: AccessorsForOqlFilter = new AccessorsForOqlFilter(
            [DATA_PROFILE]
        );
        // when calling the function with an OQL query asking data for a
        // 1-gene list
        const filteredData = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
            '[BRCA1]',
            dataArray,
            accessorsInstance,
            ''
        );
        // then it returns a single list object containing a single data object
        assert.lengthOf(filteredData, 1);
        assert.property(filteredData[0], 'list');
        assert.lengthOf(
            (filteredData[0] as MergedTrackLineFilterOutput<object>).list,
            1
        );
        assert.property(
            (filteredData[0] as MergedTrackLineFilterOutput<object>).list[0],
            'data'
        );
    });

    it('returns a .list with two .data objects for a two-gene merged query', () => {
        // given CNA data for 3 genes in 2 samples and an AccessorsForOqlFilter instance
        // aware of their profile
        const dataArray: NumericGeneMolecularData[] = THREE_GENE_TWO_SAMPLE_CNA_DATA;
        const accessorsInstance: AccessorsForOqlFilter = new AccessorsForOqlFilter(
            [DATA_PROFILE]
        );
        // when calling the function with an OQL query asking data for a
        // 2-gene list
        const filteredData = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
            '[BRCA1 PTEN]',
            dataArray,
            accessorsInstance,
            ''
        );
        // then it returns a single list object containing 2 data objects
        assert.lengthOf(filteredData, 1);
        assert.property(filteredData[0], 'list');
        assert.lengthOf(
            (filteredData[0] as MergedTrackLineFilterOutput<object>).list,
            2
        );
        (filteredData[0] as MergedTrackLineFilterOutput<
            object
        >).list.forEach(subline => assert.property(subline, 'data'));
    });

    it('returns both a two-element .list and a .data if a merged-gene line precedes a single-gene one', () => {
        // given CNA data for 3 genes in 2 samples and an AccessorsForOqlFilter instance
        // aware of their profile
        const dataArray: NumericGeneMolecularData[] = THREE_GENE_TWO_SAMPLE_CNA_DATA;
        const accessorsInstance: AccessorsForOqlFilter = new AccessorsForOqlFilter(
            [DATA_PROFILE]
        );
        // when calling the function with an OQL query asking data for 1 gene
        const filteredData = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
            '[BRCA1 PTEN] TP53',
            dataArray,
            accessorsInstance,
            ''
        );
        // then it returns both a two-element .list and a .data
        assert.lengthOf(filteredData, 2);
        assert.property(filteredData[0], 'list');
        assert.lengthOf(
            (filteredData[0] as MergedTrackLineFilterOutput<object>).list,
            2
        );
        assert.property(filteredData[1], 'data');
    });

    it('returns both a .data and a two-element .list if a single-gene line precedes a merged-gene one', () => {
        // given CNA data for 3 genes in 2 samples and an AccessorsForOqlFilter instance
        // aware of their profile
        const dataArray: NumericGeneMolecularData[] = THREE_GENE_TWO_SAMPLE_CNA_DATA;
        const accessorsInstance: AccessorsForOqlFilter = new AccessorsForOqlFilter(
            [DATA_PROFILE]
        );
        // when calling the function with an OQL query asking data for 1 gene
        const filteredData = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
            'PTEN [BRCA1 TP53]',
            dataArray,
            accessorsInstance,
            ''
        );
        // then it returns both a .data and two-element .list
        assert.lengthOf(filteredData, 2);
        assert.property(filteredData[0], 'data');
        assert.property(filteredData[1], 'list');
        assert.lengthOf(
            (filteredData[1] as MergedTrackLineFilterOutput<object>).list,
            2
        );
    });
});

describe('convertToGene1Gene2String', () => {
    it.each([
        [{ gene: 'A', alterations: [] }, ['A']],
        [
            {
                gene: 'A',
                alterations: [
                    {
                        gene: undefined,
                        alteration_type: STUCTVARDownstreamFusionStr,
                        modifiers: [],
                    },
                ],
            },
            ['A'],
        ],
        [
            {
                gene: 'A',
                alterations: [
                    {
                        gene: 'B',
                        alteration_type: STUCTVARDownstreamFusionStr,
                        modifiers: [],
                    },
                ],
            },
            ['A::B'],
        ],
        [
            {
                gene: 'A',
                alterations: [
                    {
                        gene: STRUCTVARAnyGeneStr,
                        alteration_type: STUCTVARDownstreamFusionStr,
                        modifiers: [],
                    },
                ],
            },
            [`A::${STRUCTVARAnyGeneStr}`],
        ],
        [
            {
                gene: 'A',
                alterations: [
                    {
                        gene: STRUCTVARNullGeneStr,
                        alteration_type: STUCTVARDownstreamFusionStr,
                        modifiers: [],
                    },
                ],
            },
            [`A::${STRUCTVARNullGeneStr}`],
        ],
        [
            {
                gene: 'A',
                alterations: [
                    {
                        gene: 'B',
                        alteration_type: STUCTVARUpstreamFusionStr,
                        modifiers: [],
                    },
                ],
            },
            ['B::A'],
        ],
        [
            {
                gene: 'A',
                alterations: [
                    {
                        gene: STRUCTVARAnyGeneStr,
                        alteration_type: STUCTVARUpstreamFusionStr,
                        modifiers: [],
                    },
                ],
            },
            [`${STRUCTVARAnyGeneStr}::A`],
        ],
        [
            {
                gene: 'A',
                alterations: [
                    {
                        gene: STRUCTVARNullGeneStr,
                        alteration_type: STUCTVARUpstreamFusionStr,
                        modifiers: [],
                    },
                ],
            },
            [`${STRUCTVARNullGeneStr}::A`],
        ],
        [
            {
                gene: 'A',
                alterations: [
                    {
                        gene: 'B',
                        alteration_type: STUCTVARDownstreamFusionStr,
                        modifiers: [],
                    },
                    {
                        gene: 'C',
                        alteration_type: STUCTVARDownstreamFusionStr,
                        modifiers: [],
                    },
                ],
            },
            ['A::B', 'A::C'],
        ],
    ])('converts %p into %p', (singleGeneQuery, expected: string[]) => {
        assert.deepEqual(
            convertToGene1Gene2String(singleGeneQuery as SingleGeneQuery),
            expected
        );
    });
});

describe('queryContainsStructVarAlteration', () => {
    it.each([
        [{ gene: 'A', alterations: false }, false],
        [{ gene: 'A', alterations: [] }, false],
        [
            {
                gene: 'A',
                alterations: [
                    {
                        gene: undefined,
                        alteration_type: STUCTVARDownstreamFusionStr,
                        modifiers: [],
                    },
                ],
            },
            false,
        ],
        [
            {
                gene: 'A',
                alterations: [
                    {
                        alteration_type: 'mut',
                        modifiers: [],
                    },
                ],
            },
            false,
        ],
        [
            {
                gene: 'A',
                alterations: [
                    {
                        gene: 'B',
                        alteration_type: 'mut',
                        modifiers: [],
                    },
                    {
                        gene: 'C',
                        alteration_type: STUCTVARDownstreamFusionStr,
                        modifiers: [],
                    },
                ],
            },
            true,
        ],
    ])('converts %p into %p', (singleGeneQuery, expected: boolean) => {
        assert.equal(
            queryContainsStructVarAlteration(
                singleGeneQuery as SingleGeneQuery
            ),
            expected
        );
    });
});
