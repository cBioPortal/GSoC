import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import MutationMapperDataStore from 'shared/components/mutationMapper/MutationMapperDataStore';
import { ComparisonGroup } from './GroupComparisonUtils';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import _ from 'lodash';
import { getTwoTailedPValue } from 'shared/lib/calculation/FisherExactTestCalculator';
import intersect from 'fast_array_intersect';
import InfoIcon from 'shared/components/InfoIcon';
import { MutationOverlapOverlay } from 'shared/components/mutationTable/column/mutationOverlap/MutationOverlapOverlay';
import { Mutation } from 'cbioportal-ts-api-client';

interface IFisherExactTwoSidedTestLabelProps {
    dataStore: MutationMapperDataStore;
    hugoGeneSymbol: string;
    groups: ComparisonGroup[];
    profiledPatientCounts: number[];
}

export function countMutated(
    tableData: Mutation[][],
    filteredGroupData: Mutation[][]
) {
    return _.uniq(
        // only count unique patients
        intersect([
            // all/selected/filtered mutations is the intersect of table data and filtered group data
            _.flatten(tableData),
            _.flatten(filteredGroupData),
        ]).map(m => m.patientId)
    ).length;
}

export const FisherExactTwoSidedTestLabel: React.FC<IFisherExactTwoSidedTestLabelProps> = observer(
    ({
        dataStore,
        hugoGeneSymbol,
        groups,
        profiledPatientCounts,
    }: IFisherExactTwoSidedTestLabelProps) => {
        // get table data for group A/B and get the number of unique patients using that data
        const groupAMutatedCount = countMutated(
            dataStore.tableData,
            dataStore.sortedFilteredGroupedData[0].data
        );

        const groupBMutatedCount = countMutated(
            dataStore.tableData,
            dataStore.sortedFilteredGroupedData[1].data
        );

        const getFisherTestLabel =
            dataStore.sortedFilteredSelectedData.length > 0
                ? 'Fisher Exact Two-Sided Test p-value for selected mutations - '
                : dataStore.sortedFilteredData.length < dataStore.allData.length
                ? 'Fisher Exact Two-Sided Test p-value for filtered mutations - '
                : 'Fisher Exact Two-Sided Test p-value for all mutations - ';

        return (
            <div data-test="fisherTestLabel">
                {getFisherTestLabel}
                {groups[0].nameWithOrdinal} vs {groups[1].nameWithOrdinal}:{' '}
                {toConditionalPrecisionWithMinimum(
                    getTwoTailedPValue(
                        groupAMutatedCount,
                        profiledPatientCounts[0] - groupAMutatedCount,
                        groupBMutatedCount,
                        profiledPatientCounts[1] - groupBMutatedCount
                    ),
                    3,
                    0.01,
                    -10
                )}
                <InfoIcon
                    divStyle={{ display: 'inline-block', marginLeft: 6 }}
                    tooltip={
                        <>
                            <MutationOverlapOverlay
                                groupAMutatedCount={groupAMutatedCount}
                                groupBMutatedCount={groupBMutatedCount}
                                hugoGeneSymbol={hugoGeneSymbol}
                                profiledPatientCounts={profiledPatientCounts}
                                groups={groups}
                            />
                            <span data-test="patientMultipleMutationsMessage">
                                {`${
                                    _.filter(
                                        dataStore.tableDataGroupedByPatients,
                                        d => d.length > 1
                                    ).length
                                } ${
                                    _.filter(
                                        dataStore.tableDataGroupedByPatients,
                                        d => d.length > 1
                                    ).length === 1
                                        ? 'patient has'
                                        : 'patients have'
                                } more than one mutation in ${hugoGeneSymbol}`}
                            </span>
                        </>
                    }
                />
            </div>
        );
    }
);
