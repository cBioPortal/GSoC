import _ from 'lodash';
import {
    CancerStudy,
    GenePanelData,
    Mutation,
    NumericGeneMolecularData,
    MolecularProfile,
} from 'cbioportal-ts-api-client';
import { CoverageInformation } from '../../../shared/lib/GenePanelUtils';
import { isSampleProfiled } from '../../../shared/lib/isSampleProfiled';
import { getOncoprintMutationType } from '../../../shared/components/oncoprint/DataUtils';
import {
    IBoxScatterPlotPoint,
    mutationRenderPriority,
    tooltipCnaSection,
    tooltipMutationsSection,
} from 'shared/components/plots/PlotsTabUtils';
import { getJitterForCase } from '../../../shared/components/plots/PlotUtils';
import * as React from 'react';
import { getSampleViewUrl, getStudySummaryUrl } from '../../../shared/api/urls';
import {
    STRUCTURAL_VARIANT_COLOR,
    MUT_COLOR_INFRAME,
    MUT_COLOR_MISSENSE,
    MUT_COLOR_PROMOTER,
    MUT_COLOR_SPLICE,
    MUT_COLOR_TRUNC,
} from 'cbioportal-frontend-commons';

export type ExpressionStyle = {
    typeName: string;
    symbol: string;
    fill: string;
    stroke: string;
    legendText: string;
};

export interface MolecularDataBuckets {
    mutationBuckets: { [mutationType: string]: NumericGeneMolecularData[] };
    unmutatedBucket: NumericGeneMolecularData[];
    unsequencedBucket: NumericGeneMolecularData[];
}

enum VictoryShapeType {
    circle = 'circle',
    diamond = 'diamond',
    plus = 'plus',
    square = 'square',
    star = 'star',
    triangleDown = 'triangleDown',
    triangleUp = 'triangleUp',
}

export const ExpressionStyleSheet: {
    [mutationType: string]: ExpressionStyle;
} = {
    missense: {
        typeName: 'Missense',
        symbol: VictoryShapeType.circle,
        fill: MUT_COLOR_MISSENSE,
        stroke: '#000000',
        legendText: 'Missense',
    },
    inframe: {
        typeName: 'Inframe',
        symbol: VictoryShapeType.circle,
        fill: MUT_COLOR_INFRAME,
        stroke: '#000000',
        legendText: 'Inframe',
    },
    fusion: {
        typeName: 'Fusion',
        symbol: VictoryShapeType.circle,
        fill: STRUCTURAL_VARIANT_COLOR,
        stroke: '#000000',
        legendText: 'Fusion',
    },
    trunc: {
        typeName: 'Truncating',
        symbol: VictoryShapeType.circle,
        fill: MUT_COLOR_TRUNC,
        stroke: '#000000',
        legendText: 'Truncating',
    },
    splice: {
        typeName: 'Splice',
        symbol: VictoryShapeType.circle,
        fill: MUT_COLOR_SPLICE,
        stroke: '#000000',
        legendText: 'Splice',
    },
    promoter: {
        typeName: 'Promoter',
        symbol: VictoryShapeType.circle,
        fill: MUT_COLOR_PROMOTER,
        stroke: '#000000',
        legendText: 'Promoter',
    },
    one_mut: {
        typeName: 'one_mut',
        symbol: VictoryShapeType.circle,
        fill: '#DBA901',
        stroke: '#886A08',
        legendText: 'One Gene mutated',
    },
    both_mut: {
        typeName: 'both_mut',
        symbol: VictoryShapeType.circle,
        fill: '#FF0000',
        stroke: '#B40404',
        legendText: 'Both mutated',
    },
    not_showing_mut: {
        typeName: 'not_showing_mut',
        symbol: VictoryShapeType.circle,
        fill: '#00AAF8',
        stroke: '#0089C6',
        legendText: 'shouldnt be in legend',
    },
    non_mut: {
        typeName: 'non_mut',
        symbol: VictoryShapeType.circle,
        fill: '#e3e3e3',
        stroke: '#000000',
        legendText: 'Not mutated',
    },
    non_sequenced: {
        typeName: 'non_sequenced',
        symbol: VictoryShapeType.circle,
        fill: 'white',
        stroke: 'gray',
        legendText: 'Not sequenced',
    },
};

export const RNASeqOptions = [
    {
        label: 'RNA Seq V2',
        value: 'rna_seq_v2_mrna',
    },
    {
        label: 'RNA Seq',
        value: 'rna_seq_mrna',
    },
];

export function getExpressionStyle(mutationType: string) {
    return ExpressionStyleSheet[mutationType];
}

// this function classifies molecular data by corresponding mutation type or
// non-mutated or non-sequenced status

export function getMolecularDataBuckets(
    studyData: NumericGeneMolecularData[],
    showMutations: boolean,
    mutationsKeyedBySampleId: {
        [sampleId: string]: Pick<Mutation, 'proteinChange' | 'mutationType'>;
    },
    coverageInformation: CoverageInformation,
    hugoGeneSymbol: string
): MolecularDataBuckets {
    // if mutation mode is on, we want to fill buckets by mutation type (or unmutated)
    const mutationModeInteratee = (
        memo: MolecularDataBuckets,
        molecularData: NumericGeneMolecularData
    ) => {
        const mutation =
            mutationsKeyedBySampleId[molecularData.uniqueSampleKey];
        if (mutation) {
            const oncoprintMutationType = getOncoprintMutationType(mutation);
            const bucket = (memo.mutationBuckets[oncoprintMutationType] =
                memo.mutationBuckets[oncoprintMutationType] || []);
            bucket.push(molecularData);
        } else if (
            isSampleProfiled(
                molecularData.uniqueSampleKey,
                molecularData.molecularProfileId,
                hugoGeneSymbol,
                coverageInformation
            )
        ) {
            memo.unmutatedBucket.push(molecularData);
        } else {
            memo.unsequencedBucket.push(molecularData);
        }
        return memo;
    };

    // if mutation mode is off, we don't care about mutation state
    const noMutationModeIteratee = (
        memo: MolecularDataBuckets,
        molecularData: NumericGeneMolecularData
    ) => {
        memo.unmutatedBucket.push(molecularData);
        return memo;
    };

    const iteratee = showMutations
        ? mutationModeInteratee
        : noMutationModeIteratee;

    // populate buckets using iteratee
    const buckets = studyData.reduce(iteratee, {
        mutationBuckets: {},
        unmutatedBucket: [],
        unsequencedBucket: [],
    });

    return buckets;
}

export function calculateJitter(uniqueSampleKey: string) {
    return getJitterForCase(uniqueSampleKey) * 0.3;
}

export function prioritizeMutations(mutations: Mutation[]) {
    return _.orderBy(mutations, (mutation: Mutation) => {
        const oncoprintMutationType = getOncoprintMutationType(mutation);
        return mutationRenderPriority[oncoprintMutationType];
    });
}

export function expressionTooltip(
    d: IBoxScatterPlotPoint,
    studyIdToStudy: { [studyId: string]: CancerStudy }
) {
    let mutations = null;
    let cna = null;

    if (d.mutations.length > 0) {
        mutations = tooltipMutationsSection(d);
    }

    const nonDiploidCna = d.copyNumberAlterations.filter(x => x.value !== 0);
    if (nonDiploidCna.length > 0) {
        cna = tooltipCnaSection(d);
    }

    return (
        <div>
            <span>
                <b>Study:</b>{' '}
                <a href={getStudySummaryUrl(d.studyId)}>
                    {studyIdToStudy[d.studyId].name}
                </a>
            </span>
            <br />
            <span>
                <b>Sample ID:</b>{' '}
                <a href={getSampleViewUrl(d.studyId, d.sampleId)}>
                    {d.sampleId}
                </a>
            </span>
            <br />
            <span>
                <b>Expression:</b> {d.value}
            </span>
            <br />
            {!!mutations && (
                <span>
                    <b>Mutations:</b> {mutations}
                </span>
            )}
            {!!mutations && <br />}
            {!!cna && (
                <span>
                    <b>CNA:</b> {cna}
                </span>
            )}
        </div>
    );
}

export function getPossibleRNASeqVersions(
    expressionProfiles: Pick<MolecularProfile, 'molecularProfileId'>[]
) {
    const possibleRNASeqVersions: { [id: string]: boolean } = {
        rna_seq_mrna: false,
        rna_seq_v2_mrna: false,
    };

    possibleRNASeqVersions.rna_seq_mrna = _.some(
        expressionProfiles,
        expressionProfile =>
            RegExp(
                `rna_seq_mrna$|pan_can_atlas_2018_rna_seq_mrna_median$`
            ).test(expressionProfile.molecularProfileId)
    );
    possibleRNASeqVersions.rna_seq_v2_mrna = _.some(
        expressionProfiles,
        expressionProfile =>
            RegExp(
                `rna_seq_v2_mrna$|pan_can_atlas_2018_rna_seq_v2_mrna_median$`
            ).test(expressionProfile.molecularProfileId)
    );

    return RNASeqOptions.filter(option => possibleRNASeqVersions[option.value]);
}
