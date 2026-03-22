import * as React from 'react';
import { Mutation, Sample } from 'cbioportal-ts-api-client';
import {
    ComparisonGroup,
    getPatientIdentifiers,
    getSampleIdentifiers,
} from 'pages/groupComparison/GroupComparisonUtils';
import { MiniOncoprint } from 'shared/components/miniOncoprint/MiniOncoprint';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { GroupComparisonMutation } from 'shared/model/GroupComparisonMutation';
import { MutationOverlapOverlay } from './mutationOverlap/MutationOverlapOverlay';

export function mutationOverlapRenderFunction(
    rowDataByProteinChange: {
        [proteinChange: string]: GroupComparisonMutation;
    },
    mutations: Mutation[],
    profiledPatientCounts: number[],
    sampleSet: ComplexKeyMap<Sample>,
    groups: ComparisonGroup[]
) {
    const rowData = rowDataByProteinChange[mutations[0].proteinChange];

    const sampleIdentifiersForGroupA = getSampleIdentifiers([groups[0]]);
    const patientIdentifiersforGroupA = getPatientIdentifiers(
        sampleIdentifiersForGroupA,
        sampleSet
    );
    const sampleIdentifiersForGroupB = getSampleIdentifiers([groups[1]]);
    const patientIdentifiersforGroupB = getPatientIdentifiers(
        sampleIdentifiersForGroupB,
        sampleSet
    );

    const totalQueriedCases =
        patientIdentifiersforGroupA.length + patientIdentifiersforGroupB.length;
    const group1Width =
        (patientIdentifiersforGroupA.length / totalQueriedCases) * 100;
    const group2Width = 100 - group1Width;
    const group1Unprofiled =
        ((patientIdentifiersforGroupA.length - profiledPatientCounts[0]) /
            totalQueriedCases) *
        100;
    const group1Unaltered =
        ((profiledPatientCounts[0] - rowData.groupAMutatedCount) /
            totalQueriedCases) *
        100;
    const group2Unprofiled =
        ((patientIdentifiersforGroupB.length - profiledPatientCounts[1]) /
            totalQueriedCases) *
        100;
    const group1Altered =
        (rowData.groupAMutatedCount / totalQueriedCases) * 100;
    const group2Altered =
        (rowData.groupBMutatedCount / totalQueriedCases) * 100;

    const overlay = (
        <MutationOverlapOverlay
            groupAMutatedCount={rowData.groupAMutatedCount}
            groupBMutatedCount={rowData.groupBMutatedCount}
            hugoGeneSymbol={mutations[0].gene.hugoGeneSymbol}
            proteinChange={mutations[0].proteinChange}
            profiledPatientCounts={profiledPatientCounts}
            groups={groups}
        />
    );

    return (
        <DefaultTooltip
            destroyTooltipOnHide={true}
            trigger={['hover']}
            overlay={overlay}
        >
            <div className={'inlineBlock'} style={{ padding: '3px 0' }}>
                <MiniOncoprint
                    group1Width={group1Width}
                    group2Width={group2Width}
                    group1Unaltered={group1Unaltered}
                    group1Altered={group1Altered}
                    group2Altered={group2Altered}
                    group1Unprofiled={group1Unprofiled}
                    group2Unprofiled={group2Unprofiled}
                    group1Color={groups[0].color}
                    group2Color={groups[1].color}
                    width={150}
                />
            </div>
        </DefaultTooltip>
    );
}
