import { render } from '@testing-library/react';
import React from 'react';
import { assert } from 'chai';
import _ from 'lodash';

import { sortValue as oncoKbAnnotationSortValue, OncoKB } from './OncoKB';
import { defaultArraySortMethod } from 'cbioportal-utils';
import { LevelOfEvidence, IndicatorQueryResp } from 'oncokb-ts-api-client';

function emptyQueryIndicator(): IndicatorQueryResp {
    return {
        // alleleExist: false,
        // dataVersion: "",
        geneExist: false,
        geneSummary: '',
        highestResistanceLevel: 'LEVEL_R3',
        highestSensitiveLevel: 'LEVEL_4',
        // highestDiagnosticImplicationLevel: "LEVEL_Dx1",
        // highestPrognosticImplicationLevel: "LEVEL_Px1",
        // hotspot: false,
        // lastUpdate: "",
        mutationEffect: {
            description: '',
            knownEffect: '',
            citations: {
                abstracts: [],
                pmids: [],
            },
        },
        oncogenic: '',
        // otherSignificantResistanceLevels: [],
        // otherSignificantSensitiveLevels: [],
        query: {
            alteration: '',
            // alterationType: "",
            // consequence: "",
            // entrezGeneId: -1,
            hugoSymbol: '',
            id: '',
            //proteinEnd: -1,
            //proteinStart: -1,
            tumorType: '',
            //type: "web",
            //hgvs: "",
            //svType: "DELETION" // TODO: hack because svType is not optional
        },
        treatments: [],
        // diagnosticImplications: [],
        // prognosticImplications: [],
        tumorTypeSummary: '',
        // diagnosticSummary: "",
        // prognosticSummary: "",
        // variantExist: false,
        variantSummary: '',
        vus: false,
    } as any;
}

function initQueryIndicator(props: { [key: string]: any }): IndicatorQueryResp {
    return _.merge(emptyQueryIndicator(), props);
}

function oncoKbAnnotationSortMethod(
    a: IndicatorQueryResp,
    b: IndicatorQueryResp
) {
    return defaultArraySortMethod(
        oncoKbAnnotationSortValue(a),
        oncoKbAnnotationSortValue(b)
    );
}

describe('OncoKB', () => {
    it('displays a load spinner when there is no indicator data', () => {
        const component = render(
            <OncoKB
                status="pending"
                isCancerGene={false}
                geneNotExist={false}
                hugoGeneSymbol=""
                usingPublicOncoKbInstance={true}
            />
        );

        const loader = component.container.getElementsByClassName('fa-spinner');

        assert.equal(loader.length, 1, 'Spinner component should exist');
    });

    it('properly calculates OncoKB sort values', () => {
        let queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
        });

        let queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
        });

        let array: IndicatorQueryResp[] = [queryA, queryB];

        let sortedArray: IndicatorQueryResp[];

        assert.deepEqual(
            oncoKbAnnotationSortValue(queryA),
            oncoKbAnnotationSortValue(queryB),
            'Equal Oncogenicity'
        );

        queryA.oncogenic = 'Oncogenic';
        queryB.oncogenic = 'Inconclusive';
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'Oncogenicity test 2'
        );

        queryA.oncogenic = 'Oncogenic';
        queryB.oncogenic = 'Unknown';
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'Oncogenicity test 3'
        );

        queryA.oncogenic = 'Oncogenic';
        queryB.oncogenic = 'Likely Neutral';
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'Oncogenicity test 4'
        );

        queryA.oncogenic = 'Inconclusive';
        queryB.oncogenic = 'Unknown';
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'Oncogenicity test 5'
        );

        queryA.oncogenic = 'Likely Neutral';
        queryB.oncogenic = 'Inconclusive';
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'Oncogenicity test 6'
        );

        queryA = initQueryIndicator({
            oncogenic: 'Unknown',
            vus: true,
        });
        queryB = initQueryIndicator({
            oncogenic: 'Unknown',
            vus: false,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A is VUS, which should have higher score.'
        );

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: LevelOfEvidence.LEVEL_1,
        });
        queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A(LEVEL_1) should be higher than B(LEVEL_2)'
        );

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestResistanceLevel: LevelOfEvidence.LEVEL_R1,
        });
        queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestResistanceLevel: LevelOfEvidence.LEVEL_R2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A(LEVEL_R1) should be higher than B(LEVEL_R2)'
        );

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
            highestResistanceLevel: '',
        });
        queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: '',
            highestResistanceLevel: LevelOfEvidence.LEVEL_R1,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A(LEVEL_2) should be higher than B(LEVEL_R1)'
        );

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
        });
        queryB = initQueryIndicator({
            oncogenic: 'Unknown',
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'The score for Oncogenic variant(A) should always higher than other categories(B) even B has treatments.'
        );

        // GeneExist tests
        queryA = initQueryIndicator({
            geneExist: true,
        });
        queryB = initQueryIndicator({
            geneExist: false,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A should be higher than B.'
        );

        // GeneExist tests
        queryA = initQueryIndicator({
            geneExist: false,
            oncogenic: 'Oncogenic',
        });
        queryB = initQueryIndicator({
            geneExist: true,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A should be higher than B even A gene does not exist. Because A has higher oncogenicity.'
        );

        // VariantExist does not have any impact any more
        queryA = initQueryIndicator({
            variantExist: false,
        });
        queryB = initQueryIndicator({
            variantExist: true,
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isBelow(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A should be lower than B.'
        );

        queryA = initQueryIndicator({
            variantExist: true,
        });
        queryB = initQueryIndicator({
            variantExist: false,
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isBelow(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A should be lower than B[LEVEL_2] even B variant does not exist.'
        );

        // Is Hotspot does not have any impact any more
        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
            hotspot: false,
        });
        queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
            hotspot: true,
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isBelow(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A should be lower than B.'
        );

        queryA = initQueryIndicator({
            oncogenic: 'Oncogenic',
            hotspot: true,
        });
        queryB = initQueryIndicator({
            oncogenic: 'Oncogenic',
            hotspot: false,
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isBelow(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A should be lower than B[LEVEL_2] even A is hotspot.'
        );
    });
});
